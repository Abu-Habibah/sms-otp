package com.smsmonitor.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_forwards")
data class PendingForwardEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val smsId: String,
    val sender: String,
    val message: String,
    val matchedKeyword: String,
    val retryCount: Int,
    val createdAt: Long,
    val lastAttempt: Long?
)
