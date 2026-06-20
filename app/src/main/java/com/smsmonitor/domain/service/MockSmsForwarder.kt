package com.smsmonitor.domain.service

import android.util.Log
import com.smsmonitor.domain.model.SmsMessage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockSmsForwarder @Inject constructor() : SmsForwarder {
    private val tag = "MockSmsForwarder"
    private val forwardedMessages = mutableListOf<ForwardedMessage>()

    var isEnabled = false
        set(value) {
            Log.d(tag, "Mock forwarder enabled: $value")
            field = value
        }

    var shouldFail = false

    val receivedMessages: List<ForwardedMessage>
        get() = forwardedMessages.toList()

    fun clearMessages() {
        forwardedMessages.clear()
    }

    override suspend fun forward(sms: SmsMessage, matchedKeyword: String): Result<Unit> {
        if (!isEnabled) {
            return Result.failure(IllegalStateException("Mock forwarder is not enabled"))
        }

        val message = ForwardedMessage(
            timestamp = System.currentTimeMillis(),
            sms = sms,
            matchedKeyword = matchedKeyword
        )
        forwardedMessages.add(message)

        Log.d(tag, "Mock forward: ${sms.sender} -> ${sms.body.take(50)} (matched: $matchedKeyword)")

        return if (shouldFail) {
            Result.failure(Exception("Mock forwarding failed"))
        } else {
            Result.success(Unit)
        }
    }

    data class ForwardedMessage(
        val timestamp: Long,
        val sms: SmsMessage,
        val matchedKeyword: String
    )
}