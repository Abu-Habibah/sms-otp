package com.smsmonitor.domain.service

import com.smsmonitor.domain.model.SmsMessage

interface SmsForwarder {
    suspend fun forward(sms: SmsMessage, matchedKeyword: String): Result<Unit>
}