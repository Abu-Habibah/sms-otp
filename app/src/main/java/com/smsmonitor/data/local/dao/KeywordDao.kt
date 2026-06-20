package com.smsmonitor.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.smsmonitor.data.local.entity.KeywordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface KeywordDao {

    @Query("SELECT * FROM keywords ORDER BY createdAt DESC")
    fun getAllKeywords(): Flow<List<KeywordEntity>>

    @Query("SELECT * FROM keywords WHERE enabled = 1")
    suspend fun getEnabledKeywords(): List<KeywordEntity>

    @Query("SELECT * FROM keywords WHERE id = :id")
    suspend fun getKeywordById(id: Int): KeywordEntity?

    @Query("SELECT * FROM keywords WHERE word = :word LIMIT 1")
    suspend fun getKeywordByWord(word: String): KeywordEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(keyword: KeywordEntity): Long

    @Update
    suspend fun update(keyword: KeywordEntity)

    @Delete
    suspend fun delete(keyword: KeywordEntity)

    @Query("DELETE FROM keywords WHERE id = :id")
    suspend fun deleteById(id: Int)

    @Query("DELETE FROM keywords")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM keywords")
    suspend fun getKeywordCount(): Int
}
