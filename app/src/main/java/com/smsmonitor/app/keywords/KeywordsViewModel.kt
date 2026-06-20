package com.smsmonitor.app.keywords

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class KeywordsViewModel @Inject constructor(
    private val keywordService: KeywordService
) : ViewModel() {

    private val _keywords = MutableStateFlow<List<Keyword>>(emptyList())
    val keywords: StateFlow<List<Keyword>> = _keywords.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadKeywords()
    }

    private fun loadKeywords() {
        viewModelScope.launch {
            keywordService.keywords.collect { keywordList ->
                _keywords.value = keywordList
            }
        }
    }

    fun addKeyword(word: String, matchMode: MatchMode) {
        viewModelScope.launch {
            val result = keywordService.addKeyword(word, matchMode)
            result.onFailure { e ->
                _error.value = e.message
            }
            result.onSuccess {
                _error.value = null
            }
        }
    }

    fun updateKeyword(keyword: Keyword, newWord: String, newMatchMode: MatchMode) {
        viewModelScope.launch {
            val result = keywordService.updateKeyword(
                keyword.copy(word = newWord, matchMode = newMatchMode)
            )
            result.onFailure { e ->
                _error.value = e.message
            }
            result.onSuccess {
                _error.value = null
            }
        }
    }

    fun deleteKeyword(keyword: Keyword) {
        viewModelScope.launch {
            keywordService.deleteKeyword(keyword)
        }
    }

    fun toggleKeyword(keyword: Keyword) {
        viewModelScope.launch {
            keywordService.toggleKeyword(keyword)
        }
    }

    fun clearError() {
        _error.value = null
    }
}
