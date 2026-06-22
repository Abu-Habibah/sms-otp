package com.smsmonitor.app.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val backendUrl: String = "",
    val apiKey: String = "",
    val deviceName: String = "",
    val deviceInfo: DeviceInfo? = null,
    val isSaved: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null
)

data class DeviceInfo(
    val id: String,
    val tenantId: String?,
    val serverUrl: String,
    val workspaceName: String?
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(createInitialState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    private fun createInitialState() = SettingsUiState(
        backendUrl = settingsRepository.backendUrl,
        apiKey = settingsRepository.apiKey,
        deviceName = settingsRepository.deviceName,
        deviceInfo = settingsRepository.deviceId?.let {
            DeviceInfo(
                id = it,
                tenantId = settingsRepository.tenantId,
                serverUrl = settingsRepository.backendUrl,
                workspaceName = settingsRepository.workspaceName
            )
        }
    )

    fun updateBackendUrl(url: String) {
        _uiState.update { it.copy(backendUrl = url) }
    }

    fun updateApiKey(apiKey: String) {
        _uiState.update { it.copy(apiKey = apiKey) }
    }

    fun updateDeviceName(name: String) {
        _uiState.update { it.copy(deviceName = name) }
    }

    fun saveSettings() {
        val currentState = _uiState.value
        val url = currentState.backendUrl.trim()
        val apiKey = currentState.apiKey.trim()
        val deviceName = currentState.deviceName.trim()

        if (url.isBlank()) {
            _uiState.update { it.copy(error = "Backend URL cannot be empty") }
            return
        }

        if (!android.util.Patterns.WEB_URL.matcher(url).matches()) {
            _uiState.update { it.copy(error = "Invalid Backend URL format") }
            return
        }

        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Writing to EncryptedSharedPreferences involves crypto and I/O
                settingsRepository.backendUrl = url
                settingsRepository.apiKey = apiKey
                settingsRepository.deviceName = deviceName
                
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        isSaved = true, 
                        error = null 
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Failed to save: ${e.message}"
                    )
                }
            }
        }
    }

    fun reclaimDevice() {
        _uiState.update { it.copy(isLoading = true) }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                settingsRepository.clearDeviceData()
                _uiState.update { it.copy(deviceInfo = null, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Failed to reclaim: ${e.message}") }
            }
        }
    }

    fun clearSavedFlag() {
        _uiState.update { it.copy(isSaved = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
