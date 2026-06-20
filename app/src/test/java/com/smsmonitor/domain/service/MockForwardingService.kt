package com.smsmonitor.domain.service

import com.smsmonitor.domain.model.SmsMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockForwardingService @Inject constructor() : SmsForwarder {
    private val _receivedMessages = MutableStateFlow<List<SmsMessage>>(emptyList())
    val receivedMessages: StateFlow<List<SmsMessage>> = _receivedMessages.asStateFlow()

    private val _forwardingLogs = MutableStateFlow<List<ForwardingRecord>>(emptyList())
    val forwardingLogs: StateFlow<List<ForwardingRecord>> = _forwardingLogs.asStateFlow()

    private var shouldFail = false

    fun setShouldFail(fail: Boolean) {
        shouldFail = fail
    }

    fun clearLogs() {
        _receivedMessages.value = emptyList()
        _forwardingLogs.value = emptyList()
    }

    override suspend fun forward(sms: SmsMessage, matchedKeyword: String): Result<Unit> {
        _receivedMessages.value = _receivedMessages.value + sms
        _forwardingLogs.value = _forwardingLogs.value + ForwardingRecord(
            sms = sms,
            matchedKeyword = matchedKeyword,
            timestamp = System.currentTimeMillis()
        )

        return if (shouldFail) {
            Result.failure(Exception("Mock failure"))
        } else {
            Result.success(Unit)
        }
    }

    data class ForwardingRecord(
        val sms: SmsMessage,
        val matchedKeyword: String,
        val timestamp: Long
    )
}