package com.smsmonitor.app.settings

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.app.claim.ClaimCodeScannerActivity
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.databinding.ActivitySettingsBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private val viewModel: SettingsViewModel by viewModels()
    private var initialStateLoaded = false

    @Inject
    lateinit var settingsRepository: SettingsRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
        showDeviceInfo()
    }

    private fun setupViews() {
        binding.saveButton.setOnClickListener {
            val url = binding.backendUrlInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()
            val deviceName = binding.deviceNameInput.text.toString().trim()
            viewModel.updateBackendUrl(url)
            viewModel.updateApiKey(apiKey)
            if (deviceName.isNotBlank()) {
                settingsRepository.deviceName = deviceName
            }
            viewModel.saveSettings()
        }

        binding.showApiKeyCheckbox.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                binding.apiKeyInput.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
                binding.apiKeyInput.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            }
            binding.apiKeyInput.setSelection(binding.apiKeyInput.text?.length ?: 0)
        }

        binding.reclaimButton.setOnClickListener {
            settingsRepository.clearDeviceData()
            startActivity(Intent(this, ClaimCodeScannerActivity::class.java))
            finish()
        }
    }

    private fun showDeviceInfo() {
        val deviceId = settingsRepository.deviceId
        val tenantId = settingsRepository.tenantId
        val serverUrl = settingsRepository.backendUrl
        val workspaceName = settingsRepository.workspaceName

        if (deviceId != null) {
            binding.deviceInfoCard.visibility = View.VISIBLE
            binding.deviceIdText.text = deviceId.take(16) + "..."
            binding.tenantIdText.text = tenantId ?: "N/A"
            binding.serverUrlText.text = serverUrl
            binding.workspaceNameText.text = workspaceName ?: "N/A"
            binding.connectionStatusText.text = "Connected"
            binding.connectionStatusText.setTextColor(getColor(android.R.color.holo_green_dark))
        } else {
            binding.deviceInfoCard.visibility = View.GONE
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Only update text fields on initial load (avoid overwriting user input)
                if (!initialStateLoaded && state.backendUrl.isNotEmpty()) {
                    binding.backendUrlInput.setText(state.backendUrl)
                    if (state.apiKey.isNotEmpty()) {
                        binding.apiKeyInput.setText(state.apiKey)
                    }
                    initialStateLoaded = true
                }

                if (state.isSaved) {
                    Toast.makeText(this@SettingsActivity, "Settings saved!", Toast.LENGTH_SHORT).show()
                    binding.statusText.visibility = View.VISIBLE
                    binding.statusText.text = "Settings saved successfully"
                    binding.statusText.setTextColor(getColor(android.R.color.holo_green_dark))
                    viewModel.clearSavedFlag()
                } else if (state.error != null) {
                    binding.statusText.visibility = View.VISIBLE
                    binding.statusText.text = state.error
                    binding.statusText.setTextColor(getColor(android.R.color.holo_red_dark))
                    Toast.makeText(this@SettingsActivity, state.error, Toast.LENGTH_LONG).show()
                    viewModel.clearError()
                } else {
                    binding.statusText.visibility = View.GONE
                }
            }
        }
    }
}