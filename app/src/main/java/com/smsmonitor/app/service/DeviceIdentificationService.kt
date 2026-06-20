package com.smsmonitor.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import androidx.core.app.NotificationCompat
import com.smsmonitor.R
import com.smsmonitor.app.MainActivity
import com.smsmonitor.data.repository.SettingsRepository
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

/**
 * Foreground service for device identification.
 * Checks for identification requests on heartbeat and shows visual indicators.
 */
@AndroidEntryPoint
class DeviceIdentificationService : Service() {

    companion object {
        private const val TAG = "DeviceIdentificationService"
        private const val CHANNEL_ID = "identification_channel"
        private const val NOTIFICATION_ID = 1003
        private const val IDENTIFICATION_CHECK_INTERVAL_MS = 10_000L
        private const val IDENTIFICATION_DURATION_MS = 5_000L

        fun start(context: Context) {
            val intent = Intent(context, DeviceIdentificationService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, DeviceIdentificationService::class.java))
        }
    }

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var okHttpClient: OkHttpClient

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification("Device identification active"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startIdentificationCheckLoop()
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    private fun startIdentificationCheckLoop() {
        serviceScope.launch {
            while (true) {
                checkForIdentification()
                delay(IDENTIFICATION_CHECK_INTERVAL_MS)
            }
        }
    }

    private suspend fun checkForIdentification() {
        val baseUrl = settingsRepository.backendUrl
        val apiKey = settingsRepository.apiKey
        val deviceId = settingsRepository.deviceId ?: return
        val deviceSecret = settingsRepository.deviceSecret ?: return

        if (baseUrl.isBlank() || apiKey.isBlank()) return

        val timestamp = HmacSigner.generateTimestamp()
        val signature = HmacSigner.sign(deviceSecret, timestamp, "GET", "/v1/devices/$deviceId/identify")

        val request = Request.Builder()
            .url("$baseUrl/v1/devices/$deviceId/identify")
            .get()
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-Device-ID", deviceId)
            .addHeader("X-Device-Signature", signature)
            .addHeader("X-Device-Timestamp", timestamp)
            .build()

        try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                if (it.isSuccessful) {
                    val body = it.body?.string()
                    if (body != null && body.contains("identifyRequestedAt")) {
                        Log.d(TAG, "Identification request received")
                        triggerIdentification()
                        acknowledgeIdentification()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Identification check error: ${e.message}")
        }
    }

    private fun triggerIdentification() {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        vibrator.vibrate(VibrationEffect.createOneShot(IDENTIFICATION_DURATION_MS, VibrationEffect.DEFAULT_AMPLITUDE))

        val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        RingtoneManager.getRingtone(this, ringtone)?.play()

        val notificationManager = getSystemService(NotificationManager::class.java)
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Device Identification")
            .setContentText("This device has been identified by an admin")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID + 1, notification)

        Log.d(TAG, "Identification triggered")
    }

    private suspend fun acknowledgeIdentification() {
        val baseUrl = settingsRepository.backendUrl
        val apiKey = settingsRepository.apiKey
        val deviceId = settingsRepository.deviceId ?: return
        val deviceSecret = settingsRepository.deviceSecret ?: return

        if (baseUrl.isBlank() || apiKey.isBlank()) return

        val timestamp = HmacSigner.generateTimestamp()
        val signature = HmacSigner.sign(deviceSecret, timestamp, "POST", "/v1/devices/$deviceId/identify/ack")

        val request = Request.Builder()
            .url("$baseUrl/v1/devices/$deviceId/identify/ack")
            .post("{}".toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-Device-ID", deviceId)
            .addHeader("X-Device-Signature", signature)
            .addHeader("X-Device-Timestamp", timestamp)
            .build()

        try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                if (it.isSuccessful) {
                    Log.d(TAG, "Identification acknowledged")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Identification acknowledge error: ${e.message}")
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Device Identification",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Device identification alerts"
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
