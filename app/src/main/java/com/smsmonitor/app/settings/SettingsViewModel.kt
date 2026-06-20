package com.smsmonitor.app.settings

import androidx.lifecycle.ViewModel
import com.smsmonitor.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        SettingsUiState(
            backendUrl = settingsRepository.backendUrl,
            apiKey = settingsRepository.apiKey
        )
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        _uiState.value = SettingsUiState(
            backendUrl = settingsRepository.backendUrl,
            apiKey = settingsRepository.apiKey
        )
    }

    fun updateBackendUrl(url: String) {
        _uiState.value = _uiState.value.copy(backendUrl = url)
    }

    fun updateApiKey(apiKey: String) {
        _uiState.value = _uiState.value.copy(apiKey = apiKey)
    }

    fun saveSettings(): Boolean {
        val state = _uiState.value
        if (state.backendUrl.isBlank()) {
            _uiState.value = state.copy(error = "Backend URL cannot be empty")
            return false
        }
        settingsRepository.backendUrl = state.backendUrl
        settingsRepository.apiKey = state.apiKey
        _uiState.value = state.copy(isSaved = true, error = null)
        return true
    }

    fun clearSavedFlag() {
        _uiState.value = _uiState.value.copy(isSaved = false)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class SettingsUiState(
    val backendUrl: String = "",
    val apiKey: String = "",
    val isSaved: Boolean = false,
    val error: String? = null
)