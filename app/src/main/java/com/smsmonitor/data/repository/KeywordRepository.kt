package com.smsmonitor.data.repository

import com.smsmonitor.data.local.dao.KeywordDao
import com.smsmonitor.data.local.entity.KeywordEntity
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class KeywordRepository @Inject constructor(
    private val keywordDao: KeywordDao
) {

    fun getAllKeywords(): Flow<List<Keyword>> {
        return keywordDao.getAllKeywords().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    suspend fun getEnabledKeywords(): List<Keyword> {
        return keywordDao.getEnabledKeywords().map { it.toDomain() }
    }

    suspend fun getKeywordById(id: Int): Keyword? {
        return keywordDao.getKeywordById(id)?.toDomain()
    }

    suspend fun getKeywordByWord(word: String): Keyword? {
        return keywordDao.getKeywordByWord(word)?.toDomain()
    }

    suspend fun insert(keyword: Keyword): Long {
        return keywordDao.insert(keyword.toEntity())
    }

    suspend fun update(keyword: Keyword) {
        keywordDao.update(keyword.toEntity())
    }

    suspend fun delete(keyword: Keyword) {
        keywordDao.delete(keyword.toEntity())
    }

    suspend fun deleteById(id: Int) {
        keywordDao.deleteById(id)
    }

    suspend fun getKeywordCount(): Int {
        return keywordDao.getKeywordCount()
    }

    private fun KeywordEntity.toDomain(): Keyword {
        return Keyword(
            id = id,
            word = word,
            matchMode = MatchMode.valueOf(matchMode),
            enabled = enabled,
            createdAt = createdAt
        )
    }

    private fun Keyword.toEntity(): KeywordEntity {
        return KeywordEntity(
            id = id,
            word = word,
            matchMode = matchMode.name,
            enabled = enabled,
            createdAt = createdAt
        )
    }
}
