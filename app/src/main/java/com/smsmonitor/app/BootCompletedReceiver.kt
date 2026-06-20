package com.smsmonitor.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.smsmonitor.app.worker.SmsForwardWorker
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class BootCompletedReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsMonitor"
    }

    @Inject
    lateinit var keywordService: KeywordService

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "[BootReceiver] Received action: $action")

        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "android.intent.action.MY_PACKAGE_REPLACED" -> {
                Log.d(TAG, "[BootReceiver] Re-initializing SMS Monitor after $action")
                val pending = goAsync()
                CoroutineScope(SupervisorJob() + Dispatchers.Default).launch {
                    try {
                        keywordService.loadKeywords()
                        Log.d(TAG, "[BootReceiver] ✓ Keywords reloaded")

                        SmsForwardWorker.enqueue(context)
                        Log.d(TAG, "[BootReceiver] ✓ Worker enqueued to flush pending forwards")
                    } catch (e: Exception) {
                        Log.e(TAG, "[BootReceiver] Error during re-initialization", e)
                    } finally {
                        pending.finish()
                    }
                }
            }
        }
    }
}