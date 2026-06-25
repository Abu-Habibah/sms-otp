package com.smsmonitor.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.app.worker.SmsForwardWorker
import com.smsmonitor.app.worker.SmsHttpSender
import com.smsmonitor.data.repository.ForwardingRepository
import com.smsmonitor.domain.model.ForwardingLog
import com.smsmonitor.domain.model.ForwardingStatus
import com.smsmonitor.domain.model.SmsMessage
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import javax.inject.Inject

@AndroidEntryPoint
class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "SmsMonitor"
    }

    @Inject
    lateinit var keywordService: KeywordService

    @Inject
    lateinit var forwardingRepository: ForwardingRepository

    @Inject
    lateinit var smsHttpSender: SmsHttpSender

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "[Broadcast] onReceive fired, action=${intent.action}")

        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            Log.d(TAG, "[Broadcast] Wrong action, ignoring")
            return
        }

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) {
            Log.w(TAG, "[Broadcast] No messages extracted from intent")
            return
        }

        val combinedMessage = StringBuilder()
        var sender: String? = null
        var timestamp: Long = System.currentTimeMillis()

        for (message in messages) {
            if (sender == null) {
                sender = message.originatingAddress
                timestamp = message.timestampMillis
            }
            combinedMessage.append(message.messageBody)
        }

        val senderAddress = sender
        if (senderAddress == null) {
            Log.w(TAG, "[Broadcast] No sender address found")
            return
        }
        val body = combinedMessage.toString()
        val smsId = generateSmsId(senderAddress, timestamp)

        Log.d(TAG, "[Broadcast] SMS captured: from=$senderAddress")

        val smsMessage = SmsMessage(
            id = smsId,
            sender = senderAddress,
            body = body,
            timestamp = timestamp
        )

        val pendingResult = goAsync()
        ProcessLifecycleOwner.get().lifecycleScope.launch {
            try {
                val match = keywordService.process(smsMessage)
                if (match == null) {
                    Log.d(TAG, "[Broadcast] No keyword match, SMS not forwarded")
                    return@launch
                }

                Log.d(TAG, "[Broadcast] ✓ Matched keyword='${match.word}' — attempting immediate send")
                val sentImmediately = withContext(Dispatchers.IO) {
                    runCatching { smsHttpSender.send(smsId, senderAddress, body, match.word) }
                        .getOrElse { e ->
                            Log.w(TAG, "[Broadcast] Immediate send threw: ${e.message}")
                            false
                        }
                }

                if (sentImmediately) {
                    Log.d(TAG, "[Broadcast] ✓ Immediate send SUCCEEDED — flipping PENDING log to SUCCESS")
                    forwardingRepository.upsertLog(
                        ForwardingLog(
                            smsId = smsId,
                            sender = senderAddress,
                            message = body,
                            matchedKeyword = match.word,
                            status = ForwardingStatus.SUCCESS,
                            retryCount = 0
                        )
                    )
                    forwardingRepository.deletePendingBySmsId(smsId)
                } else {
                    Log.d(TAG, "[Broadcast] Immediate send FAILED — keeping PENDING + enqueuing WorkManager retry")
                    SmsForwardWorker.enqueue(context)
                }
            } catch (e: Exception) {
                Log.e(TAG, "[Broadcast] Error processing SMS", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun generateSmsId(sender: String, timestamp: Long): String {
        val input = "$sender:$timestamp"
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
