package com.smsmonitor.app.claim

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.data.repository.ClaimResult
import com.smsmonitor.data.repository.ClaimService
import com.smsmonitor.data.repository.KeywordSyncService
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.util.DeviceInfoCollector
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@HiltViewModel
class ManualCodeEntryViewModel @Inject constructor(
    private val claimService: ClaimService,
    private val settingsRepository: SettingsRepository,
    private val keywordSyncService: KeywordSyncService,
    private val deviceInfoCollector: DeviceInfoCollector
) : ViewModel() {

    private val _uiState = MutableStateFlow(ManualCodeEntryUiState(
        serverUrl = settingsRepository.backendUrl
    ))
    val uiState: StateFlow<ManualCodeEntryUiState> = _uiState.asStateFlow()

    fun onServerUrlChanged(url: String) {
        _uiState.update { it.copy(serverUrl = url, error = null) }
    }

    fun onCodeChanged(code: String) {
        _uiState.update { it.copy(code = code, error = null) }
    }

    fun claimDevice() {
        val state = _uiState.value
        val serverUrl = state.serverUrl.trim()
        val code = state.code.trim().uppercase()

        if (serverUrl.isBlank()) {
            _uiState.update { it.copy(error = "Server URL is required") }
            return
        }

        settingsRepository.backendUrl = serverUrl
        
        _uiState.update { it.copy(isLoading = true, error = null, statusMessage = "Claiming device...") }

        viewModelScope.launch {
            try {
                val deviceInfo = deviceInfoCollector.collectDeviceInfoWithSim()
                val result = withContext(Dispatchers.IO) { claimService.claimDevice(code, null, deviceInfo) }
                
                when (result) {
                    is ClaimResult.Success -> {
                        keywordSyncService.syncKeywords()
                        _uiState.update { it.copy(
                            isLoading = false,
                            statusMessage = "Device claimed successfully!",
                            isSuccess = true
                        ) }
                    }
                    is ClaimResult.Error -> {
                        _uiState.update { it.copy(
                            isLoading = false,
                            error = "Claim failed: ${result.message}",
                            statusMessage = null
                        ) }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isLoading = false,
                    error = "An unexpected error occurred: ${e.message}",
                    statusMessage = null
                ) }
            }
        }
    }
}

data class ManualCodeEntryUiState(
    val serverUrl: String = "",
    val code: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val statusMessage: String? = null,
    val isSuccess: Boolean = false
) {
    companion object {
        private const val CLAIM_CODE_LENGTH = 8
        private val CLAIM_CODE_REGEX = "^[A-Z0-9]{8}$".toRegex()
    }

    val isClaimButtonEnabled: Boolean
        get() = !isLoading && 
                code.trim().length == CLAIM_CODE_LENGTH && 
                code.trim().uppercase().matches(CLAIM_CODE_REGEX) && 
                serverUrl.isNotBlank()
}
