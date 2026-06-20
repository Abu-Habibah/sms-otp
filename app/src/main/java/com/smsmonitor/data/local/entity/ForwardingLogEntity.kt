package com.smsmonitor.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "forwarding_logs")
data class ForwardingLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val smsId: String,
    val sender: String,
    val message: String,
    val matchedKeyword: String,
    val status: String,
    val retryCount: Int,
    val timestamp: Long,
    val lastAttempt: Long?,
    val errorMessage: String?
)
