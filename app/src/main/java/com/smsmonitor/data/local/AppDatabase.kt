package com.smsmonitor.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.smsmonitor.data.local.dao.ForwardingLogDao
import com.smsmonitor.data.local.dao.KeywordDao
import com.smsmonitor.data.local.dao.PendingForwardDao
import com.smsmonitor.data.local.entity.ForwardingLogEntity
import com.smsmonitor.data.local.entity.KeywordEntity
import com.smsmonitor.data.local.entity.PendingForwardEntity

@Database(
    entities = [
        KeywordEntity::class,
        ForwardingLogEntity::class,
        PendingForwardEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun keywordDao(): KeywordDao
    abstract fun forwardingLogDao(): ForwardingLogDao
    abstract fun pendingForwardDao(): PendingForwardDao
}
