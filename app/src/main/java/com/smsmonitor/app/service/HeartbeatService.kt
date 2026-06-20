package com.smsmonitor.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import com.smsmonitor.R
import com.smsmonitor.app.MainActivity
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.data.repository.SyncResult
import com.smsmonitor.data.repository.KeywordSyncService
import com.smsmonitor.util.HmacSigner
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

@AndroidEntryPoint
class HeartbeatService : Service() {

    companion object {
        private const val TAG = "HeartbeatService"
        private const val CHANNEL_ID = "heartbeat_channel"
        private const val NOTIFICATION_ID = 1002
        private const val HEARTBEAT_INTERVAL_MS = 60_000L
        private const val SYNC_THROTTLE_MS = 5 * 60 * 1000L

        fun start(context: Context) {
            val intent = Intent(context, HeartbeatService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, HeartbeatService::class.java))
        }
    }

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var okHttpClient: OkHttpClient

    @Inject
    lateinit var keywordSyncService: KeywordSyncService

    @Inject
    lateinit var deviceInfoCollector: com.smsmonitor.util.DeviceInfoCollector

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val gson = Gson()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification("Heartbeat active"))
        DeviceIdentificationService.start(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startHeartbeatLoop()
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (true) {
                sendHeartbeat()
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    private suspend fun sendHeartbeat() {
        val baseUrl = settingsRepository.backendUrl
        val apiKey = settingsRepository.apiKey
        val deviceId = settingsRepository.deviceId ?: return
        val deviceSecret = settingsRepository.deviceSecret ?: return

        if (baseUrl.isBlank() || apiKey.isBlank()) return

        val timestamp = HmacSigner.generateTimestamp()
        val signature = HmacSigner.sign(deviceSecret, timestamp, "POST", "/v1/devices/$deviceId/heartbeat")

        val deviceInfo = deviceInfoCollector.collectDeviceInfo()
        val heartbeatPayload = mapOf(
            "deviceInfo" to deviceInfo.toMap()
        )
        val json = gson.toJson(heartbeatPayload)

        val request = Request.Builder()
            .url("$baseUrl/v1/devices/$deviceId/heartbeat")
            .post(json.toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-Device-Signature", signature)
            .addHeader("X-Device-Timestamp", timestamp)
            .build()

        try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                if (it.isSuccessful) {
                    Log.d(TAG, "Heartbeat sent successfully")
                    syncKeywordsIfNeeded()
                } else {
                    Log.w(TAG, "Heartbeat failed: ${it.code}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Heartbeat error: ${e.message}")
        }
    }

    private suspend fun syncKeywordsIfNeeded() {
        val lastSync = settingsRepository.lastKeywordSyncTime
        val now = System.currentTimeMillis()

        if (now - lastSync < SYNC_THROTTLE_MS) {
            Log.d(TAG, "Keyword sync throttled (last sync ${(now - lastSync) / 1000}s ago)")
            return
        }

        when (val result = keywordSyncService.syncKeywords()) {
            is SyncResult.Success -> {
                Log.d(TAG, "Synced ${result.count} keywords from heartbeat")
                settingsRepository.lastKeywordSyncTime = now
            }
            is SyncResult.Error -> {
                Log.w(TAG, "Keyword sync failed: ${result.message}")
            }
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Heartbeat",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Device heartbeat to server"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun createNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS Monitor")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
}
