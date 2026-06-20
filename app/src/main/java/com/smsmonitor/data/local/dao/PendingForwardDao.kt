package com.smsmonitor.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.smsmonitor.data.local.entity.PendingForwardEntity

@Dao
interface PendingForwardDao {

    @Query("SELECT * FROM pending_forwards ORDER BY createdAt ASC")
    suspend fun getAllPending(): List<PendingForwardEntity>

    @Query("SELECT * FROM pending_forwards WHERE id = :id")
    suspend fun getPendingById(id: Int): PendingForwardEntity?

    @Query("SELECT * FROM pending_forwards WHERE smsId = :smsId LIMIT 1")
    suspend fun getPendingBySmsId(smsId: String): PendingForwardEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(pending: PendingForwardEntity): Long

    @Update
    suspend fun update(pending: PendingForwardEntity)

    @Query("DELETE FROM pending_forwards WHERE id = :id")
    suspend fun deleteById(id: Int)

    @Query("DELETE FROM pending_forwards WHERE smsId = :smsId")
    suspend fun deleteBySmsId(smsId: String)
}
