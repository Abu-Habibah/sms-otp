package com.smsmonitor.domain.service

import android.util.Log
import com.smsmonitor.data.repository.KeywordRepository
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.domain.model.SmsMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class KeywordService @Inject constructor(
    private val keywordRepository: KeywordRepository,
    private val smsForwarder: SmsForwarder
) {

    companion object {
        private const val TAG = "SmsMonitor"
    }

    private val _keywords = MutableStateFlow<List<Keyword>>(emptyList())
    val keywords: StateFlow<List<Keyword>> = _keywords.asStateFlow()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        Log.d(TAG, "[KeywordService] Initialized, starting keyword collector")
        scope.launch {
            keywordRepository.getAllKeywords().collect { keywordList ->
                _keywords.value = keywordList
                Log.d(TAG, "[KeywordService] Loaded ${keywordList.size} keyword(s) (${keywordList.count { it.enabled }} enabled)")
            }
        }
    }

    suspend fun loadKeywords() {
        val list = keywordRepository.getAllKeywords().first()
        _keywords.value = list
        Log.d(TAG, "[KeywordService] loadKeywords() loaded ${list.size} keyword(s)")
    }

    suspend fun process(sms: SmsMessage): Keyword? {
        Log.d(TAG, "[KeywordService] Processing SMS from ${sms.sender}")
        val match = findMatch(sms.body)
        if (match != null) {
            Log.d(TAG, "[KeywordService] ✓ Match found: keyword='${match.word}' mode=${match.matchMode}")
            val result = smsForwarder.forward(sms, match.word)
            if (result.isSuccess) {
                Log.d(TAG, "[KeywordService] ✓ Enqueued for forwarding to backend (actual send happens in SmsForwardWorker)")
            } else {
                Log.e(TAG, "[KeywordService] ✗ Enqueue failed: ${result.exceptionOrNull()?.message}")
            }
        } else {
            Log.d(TAG, "[KeywordService] ✗ No match in body='${sms.body.take(50)}' against ${_keywords.value.count { it.enabled }} enabled keyword(s)")
        }
        return match
    }

    fun findMatch(messageBody: String): Keyword? {
        val currentKeywords = _keywords.value
        for (keyword in currentKeywords) {
            if (keyword.enabled && matches(messageBody, keyword)) {
                return keyword
            }
        }
        return null
    }

    private fun matches(messageBody: String, keyword: Keyword): Boolean {
        return when (keyword.matchMode) {
            MatchMode.EXACT -> messageBody.contains(keyword.word)
            MatchMode.CONTAINS -> messageBody.contains(keyword.word, ignoreCase = true)
            MatchMode.REGEX -> {
                try {
                    Regex(keyword.word).containsMatchIn(messageBody)
                } catch (e: Exception) {
                    false
                }
            }
            MatchMode.AT_START -> messageBody.trimStart().startsWith(keyword.word, ignoreCase = true)
            MatchMode.AT_END -> messageBody.trimEnd().endsWith(keyword.word, ignoreCase = true)
        }
    }

    suspend fun addKeyword(word: String, matchMode: MatchMode): Result<Keyword> {
        if (word.length < 2 || word.length > 50) {
            return Result.failure(IllegalArgumentException("Keyword must be 2-50 characters"))
        }

        val count = keywordRepository.getKeywordCount()
        if (count >= 100) {
            return Result.failure(IllegalStateException("Maximum 100 keywords allowed"))
        }

        val existing = keywordRepository.getKeywordByWord(word)
        if (existing != null) {
            return Result.failure(IllegalArgumentException("Keyword already exists"))
        }

        val keyword = Keyword(word = word, matchMode = matchMode)
        val id = keywordRepository.insert(keyword)
        return Result.success(keyword.copy(id = id.toInt()))
    }

    suspend fun updateKeyword(keyword: Keyword): Result<Unit> {
        val existing = keywordRepository.getKeywordById(keyword.id)
            ?: return Result.failure(IllegalArgumentException("Keyword not found"))

        if (keyword.word != existing.word) {
            val duplicate = keywordRepository.getKeywordByWord(keyword.word)
            if (duplicate != null) {
                return Result.failure(IllegalArgumentException("Keyword already exists"))
            }
        }

        keywordRepository.update(keyword)
        return Result.success(Unit)
    }

    suspend fun deleteKeyword(keyword: Keyword) {
        keywordRepository.delete(keyword)
    }

    suspend fun toggleKeyword(keyword: Keyword) {
        keywordRepository.update(keyword.copy(enabled = !keyword.enabled))
    }

    fun validateKeyword(word: String): Boolean {
        return word.length in 2..50
    }
}
