package com.smsmonitor.app.claim

import androidx.lifecycle.ViewModel
import com.smsmonitor.data.repository.ClaimService
import com.smsmonitor.data.repository.DeviceInfo
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject

@HiltViewModel
class TenantSelectionViewModel @Inject constructor(
    private val claimService: ClaimService
) : ViewModel() {

    private val _uiState = MutableStateFlow(TenantSelectionUiState())
    val uiState: StateFlow<TenantSelectionUiState> = _uiState.asStateFlow()

    init {
        loadTenantInfo()
    }

    fun loadTenantInfo() {
        _uiState.update { it.copy(isLoading = true) }
        val deviceInfo = claimService.getDeviceInfo()
        _uiState.update { 
            it.copy(
                isLoading = false,
                deviceInfo = deviceInfo
            )
        }
    }
}

data class TenantSelectionUiState(
    val deviceInfo: DeviceInfo? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)
