package com.smsmonitor.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.smsmonitor.app.MainActivity
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.util.HmacSigner
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException
import javax.inject.Inject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Foreground service for device identification.
 * Periodically checks for identification requests from the backend and alerts the user.
 */
@AndroidEntryPoint
class DeviceIdentificationService : Service() {

    companion object {
        private const val TAG = "DeviceIdentService"
        private const val CHANNEL_ID_STATUS = "identification_status_channel"
        private const val CHANNEL_ID_ALERTS = "identification_alerts_channel"
        private const val NOTIFICATION_ID_STATUS = 1003
        private const val NOTIFICATION_ID_ALERT = 1004
        private const val IDENTIFICATION_CHECK_INTERVAL_MS = 10_000L
        private const val IDENTIFICATION_DURATION_MS = 5_000L

        /**
         * Starts the service in foreground.
         */
        fun start(context: Context) {
            val intent = Intent(context, DeviceIdentificationService::class.java)
            ContextCompat.startForegroundService(context, intent)
        }

        /**
         * Stops the service.
         */
        fun stop(context: Context) {
            context.stopService(Intent(context, DeviceIdentificationService::class.java))
        }
    }

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var okHttpClient: OkHttpClient

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var identificationJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startForeground(NOTIFICATION_ID_STATUS, createStatusNotification("Device identification active"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (identificationJob == null || identificationJob?.isActive == false) {
            startIdentificationCheckLoop()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    /**
     * Starts the periodic loop to check for identification requests.
     */
    private fun startIdentificationCheckLoop() {
        if (!settingsRepository.isClaimed) {
            Log.w(TAG, "Device not claimed, identification check loop skipped")
            return
        }

        identificationJob?.cancel()
        identificationJob = serviceScope.launch {
            Log.d(TAG, "Identification check loop started")
            while (isActive) {
                try {
                    checkForIdentification()
                } catch (e: Exception) {
                    Log.e(TAG, "Error in identification loop: ${e.message}")
                }
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
            val response = okHttpClient.newCall(request).executeAsync()
            response.use {
                if (it.isSuccessful) {
                    val bodyString = it.body?.string()
                    if (bodyString != null) {
                        val json = JSONObject(bodyString)
                        if (json.has("identifyRequestedAt")) {
                            Log.i(TAG, "Identification request received from backend")
                            triggerIdentification()
                            acknowledgeIdentification()
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Identification check request failed: ${e.message}")
        }
    }

    /**
     * Triggers visual, audible, and haptic feedback to identify the device.
     */
    private fun triggerIdentification() {
        // Haptic feedback
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        vibrator.vibrate(VibrationEffect.createOneShot(IDENTIFICATION_DURATION_MS, VibrationEffect.DEFAULT_AMPLITUDE))

        // Audible feedback
        val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        RingtoneManager.getRingtone(this, ringtoneUri)?.play()

        // Visual feedback (High priority notification)
        val notification = NotificationCompat.Builder(this, CHANNEL_ID_ALERTS)
            .setContentTitle("Device Identification")
            .setContentText("This device has been identified by an administrator")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .build()
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID_ALERT, notification)

        Log.d(TAG, "Identification feedback triggered")
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
            val response = okHttpClient.newCall(request).executeAsync()
            response.use {
                if (it.isSuccessful) {
                    Log.d(TAG, "Identification acknowledged by backend")
                } else {
                    Log.w(TAG, "Failed to acknowledge identification: ${it.code}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Identification acknowledge error: ${e.message}")
        }
    }

    private fun createNotificationChannels() {
        val notificationManager = getSystemService(NotificationManager::class.java)

        // Channel for the ongoing service status
        val statusChannel = NotificationChannel(
            CHANNEL_ID_STATUS,
            "Service Status",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Status of the device identification service"
        }

        // Channel for the high-priority identification alerts
        val alertChannel = NotificationChannel(
            CHANNEL_ID_ALERTS,
            "Identification Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Alerts when this device is being identified"
            enableVibration(true)
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
        }

        notificationManager.createNotificationChannels(listOf(statusChannel, alertChannel))
    }

    private fun createStatusNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID_STATUS)
            .setContentTitle("SMS Monitor")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private suspend fun Call.executeAsync(): Response {
        return suspendCancellableCoroutine { continuation ->
            enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    continuation.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    continuation.resume(response)
                }
            })
            continuation.invokeOnCancellation {
                cancel()
            }
        }
    }
}
