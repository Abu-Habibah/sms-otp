package com.smsmonitor.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.smsmonitor.R
import com.smsmonitor.app.MainActivity
import com.smsmonitor.app.worker.SmsForwardWorker
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Foreground service for critical SMS forwarding.
 * Ensures forwarding survives OEM battery optimization.
 */
@AndroidEntryPoint
class ForwardingService : Service() {

    companion object {
        private const val TAG = "ForwardingService"
        private const val CHANNEL_ID = "sms_forwarding_channel"
        private const val NOTIFICATION_ID = 1001
        private const val NOTIFICATION_CHANNEL_NAME = "SMS Forwarding"
        const val ACTION_START = "com.smsmonitor.ACTION_START_FORWARDING"
        const val ACTION_STOP = "com.smsmonitor.ACTION_STOP_FORWARDING"

        /**
         * Starts the service in the foreground with ACTION_START.
         */
        fun start(context: Context) {
            val intent = Intent(context, ForwardingService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stops the service.
         */
        fun stop(context: Context) {
            val intent = Intent(context, ForwardingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "ForwardingService created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Handle stop action immediately
        if (intent?.action == ACTION_STOP) {
            Log.d(TAG, "Stopping foreground service via action")
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        // For all other starts (including null action), ensure startForeground is called
        // to comply with Android 8+ requirements.
        showForegroundNotification("Processing SMS messages...")

        Log.d(TAG, "Handling action: ${intent?.action}")
        processPendingForwards()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        Log.d(TAG, "ForwardingService destroyed")
    }

    private fun showForegroundNotification(text: String) {
        val notification = createNotification(text)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            NOTIFICATION_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows SMS forwarding status"
            setShowBadge(false)
        }
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }

    private fun createNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher) // Use app icon instead of system icon
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun processPendingForwards() {
        serviceScope.launch {
            try {
                // Trigger WorkManager to process pending forwards
                SmsForwardWorker.enqueue(this@ForwardingService)
                updateNotification("Forwarding SMS messages...")

                // Keep service alive briefly to ensure worker gets CPU time
                // then stop self. WorkManager will continue in background.
                delay(10000)
                Log.d(TAG, "Processing complete, stopping service")
                stopSelf()
            } catch (e: Exception) {
                Log.e(TAG, "Error processing forwards: ${e.message}", e)
                updateNotification("Error occurred")
                delay(2000)
                stopSelf()
            }
        }
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification(text))
    }
}
