package com.smsmonitor.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.smsmonitor.data.local.entity.ForwardingLogEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ForwardingLogDao {

    @Query("SELECT * FROM forwarding_logs ORDER BY timestamp DESC")
    fun getAllLogs(): Flow<List<ForwardingLogEntity>>

    @Query("SELECT * FROM forwarding_logs WHERE status = :status ORDER BY timestamp DESC")
    fun getLogsByStatus(status: String): Flow<List<ForwardingLogEntity>>

    @Query("SELECT * FROM forwarding_logs WHERE id = :id")
    suspend fun getLogById(id: Int): ForwardingLogEntity?

    @Query("SELECT * FROM forwarding_logs WHERE smsId = :smsId LIMIT 1")
    suspend fun getLogBySmsId(smsId: String): ForwardingLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: ForwardingLogEntity): Long

    @Update
    suspend fun update(log: ForwardingLogEntity)

    @Query("DELETE FROM forwarding_logs WHERE id = :id")
    suspend fun deleteById(id: Int)

    @Query("DELETE FROM forwarding_logs WHERE id IN (SELECT id FROM forwarding_logs ORDER BY timestamp ASC LIMIT :count)")
    suspend fun pruneOldLogs(count: Int)

    @Query("SELECT COUNT(*) FROM forwarding_logs")
    suspend fun getLogCount(): Int

    @Query("SELECT COUNT(*) FROM forwarding_logs WHERE status = :status")
    suspend fun getLogCountByStatus(status: String): Int
}
