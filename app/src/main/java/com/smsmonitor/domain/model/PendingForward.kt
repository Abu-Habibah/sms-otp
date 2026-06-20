package com.smsmonitor.domain.model

data class PendingForward(
    val id: Int = 0,
    val smsId: String,
    val sender: String,
    val message: String,
    val matchedKeyword: String,
    val retryCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val lastAttempt: Long? = null
)
