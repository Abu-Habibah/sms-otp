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
import com.smsmonitor.R
import com.smsmonitor.app.MainActivity
import com.smsmonitor.app.worker.SmsForwardWorker
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
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

        fun start(context: Context) {
            val intent = Intent(context, ForwardingService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, ForwardingService::class.java))
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
        when (intent?.action) {
            ACTION_START -> {
                Log.d(TAG, "Starting foreground service")
                startForeground(NOTIFICATION_ID, createNotification("Processing SMS messages..."))
                processPendingForwards()
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stopping foreground service")
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            else -> {
                Log.d(TAG, "Unknown action: ${intent?.action}")
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        Log.d(TAG, "ForwardingService destroyed")
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
            .setContentTitle("SMS Monitor")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun processPendingForwards() {
        serviceScope.launch {
            try {
                // Trigger WorkManager to process pending forwards
                SmsForwardWorker.enqueue(this@ForwardingService)
                updateNotification("Forwarding SMS messages...")

                // Wait a bit then stop if no more work
                kotlinx.coroutines.delay(5000)
                updateNotification("Ready")
            } catch (e: Exception) {
                Log.e(TAG, "Error processing forwards: ${e.message}", e)
                updateNotification("Error occurred")
            }
        }
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification(text))
    }
}
