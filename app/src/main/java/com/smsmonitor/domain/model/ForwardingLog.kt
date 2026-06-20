package com.smsmonitor.domain.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class ForwardingLog(
    val id: Int = 0,
    val smsId: String,
    val sender: String,
    val message: String,
    val matchedKeyword: String,
    val status: ForwardingStatus,
    val retryCount: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val lastAttempt: Long? = null,
    val errorMessage: String? = null
) : Parcelable

enum class ForwardingStatus {
    PENDING,
    SUCCESS,
    FAILED
}
