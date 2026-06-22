package com.smsmonitor.app.keywords

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the Keywords screen.
 */
data class KeywordsUiState(
    val keywords: List<Keyword> = emptyList(),
    val error: String? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class KeywordsViewModel @Inject constructor(
    private val keywordService: KeywordService
) : ViewModel() {

    private val _error = MutableStateFlow<String?>(null)
    private val _isLoading = MutableStateFlow(false)

    /**
     * The consolidated UI state for the screen.
     */
    val uiState: StateFlow<KeywordsUiState> = combine(
        keywordService.keywords,
        _error,
        _isLoading
    ) { keywords, error, isLoading ->
        KeywordsUiState(keywords, error, isLoading)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = KeywordsUiState()
    )

    // Exposed for backward compatibility with existing Activity code
    val keywords: StateFlow<List<Keyword>> = keywordService.keywords
    val error: StateFlow<String?> = _error.asStateFlow()

    fun addKeyword(word: String, matchMode: MatchMode) {
        viewModelScope.launch {
            _isLoading.update { true }
            val result = keywordService.addKeyword(word, matchMode)
            _isLoading.update { false }
            
            result.onFailure { e ->
                _error.update { e.message }
            }
            result.onSuccess {
                _error.update { null }
            }
        }
    }

    fun updateKeyword(keyword: Keyword, newWord: String, newMatchMode: MatchMode) {
        viewModelScope.launch {
            _isLoading.update { true }
            val result = keywordService.updateKeyword(
                keyword.copy(word = newWord, matchMode = newMatchMode)
            )
            _isLoading.update { false }

            result.onFailure { e ->
                _error.update { e.message }
            }
            result.onSuccess {
                _error.update { null }
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
