package com.smsmonitor.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "keywords")
data class KeywordEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val word: String,
    val matchMode: String,
    val enabled: Boolean,
    val createdAt: Long
)
