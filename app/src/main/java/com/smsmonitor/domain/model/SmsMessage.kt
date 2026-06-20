package com.smsmonitor.domain.model

data class SmsMessage(
    val id: String,
    val sender: String,
    val body: String,
    val timestamp: Long
)
