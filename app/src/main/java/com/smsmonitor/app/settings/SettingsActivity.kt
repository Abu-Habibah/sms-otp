package com.smsmonitor.app.settings

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smsmonitor.R
import com.smsmonitor.app.claim.ClaimCodeScannerActivity
import com.smsmonitor.databinding.ActivitySettingsBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private val viewModel: SettingsViewModel by viewModels()
    private var initialStateLoaded = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
    }

    private fun setupViews() {
        binding.saveButton.setOnClickListener {
            hideKeyboard()
            val url = binding.backendUrlInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()
            val deviceName = binding.deviceNameInput.text.toString().trim()
            
            viewModel.updateBackendUrl(url)
            viewModel.updateApiKey(apiKey)
            viewModel.updateDeviceName(deviceName)
            viewModel.saveSettings()
        }

        binding.showApiKeyCheckbox.setOnCheckedChangeListener { _, isChecked ->
            val inputType = if (isChecked) {
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
                InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            }
            binding.apiKeyInput.inputType = inputType
            binding.apiKeyInput.setSelection(binding.apiKeyInput.text?.length ?: 0)
        }

        binding.reclaimButton.setOnClickListener {
            viewModel.reclaimDevice()
            startActivity(Intent(this, ClaimCodeScannerActivity::class.java))
            finish()
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    handleInitialLoad(state)
                    updateStatusUi(state)
                    updateDeviceInfoUi(state.deviceInfo)
                }
            }
        }
    }

    private fun handleInitialLoad(state: SettingsUiState) {
        if (!initialStateLoaded && state.backendUrl.isNotEmpty()) {
            binding.backendUrlInput.setText(state.backendUrl)
            if (state.apiKey.isNotEmpty()) {
                binding.apiKeyInput.setText(state.apiKey)
            }
            if (state.deviceName.isNotEmpty()) {
                binding.deviceNameInput.setText(state.deviceName)
            }
            initialStateLoaded = true
        }
    }

    private fun updateDeviceInfoUi(info: DeviceInfo?) {
        binding.deviceInfoCard.isVisible = info != null
        info?.let {
            binding.deviceIdText.text = if (it.id.length > 16) "${it.id.take(16)}..." else it.id
            binding.tenantIdText.text = it.tenantId ?: getString(R.string.not_available)
            binding.serverUrlText.text = it.serverUrl
            binding.workspaceNameText.text = it.workspaceName ?: getString(R.string.not_available)
            binding.connectionStatusText.text = getString(R.string.connected)
            binding.connectionStatusText.setTextColor(getColor(android.R.color.holo_green_dark))
        }
    }

    private fun updateStatusUi(state: SettingsUiState) {
        binding.statusText.isVisible = state.isSaved || state.error != null

        if (state.isSaved) {
            Toast.makeText(this, R.string.settings_saved, Toast.LENGTH_SHORT).show()
            binding.statusText.text = getString(R.string.settings_saved_success)
            binding.statusText.setTextColor(getColor(android.R.color.holo_green_dark))
            viewModel.clearSavedFlag()
        } else if (state.error != null) {
            binding.statusText.text = state.error
            binding.statusText.setTextColor(getColor(android.R.color.holo_red_dark))
            Toast.makeText(this, state.error, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    private fun hideKeyboard() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(binding.root.windowToken, 0)
    }
}
