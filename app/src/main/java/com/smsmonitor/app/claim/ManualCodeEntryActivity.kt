package com.smsmonitor.app.claim

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.InputFilter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smsmonitor.app.MainActivity
import com.smsmonitor.databinding.ActivityManualCodeEntryBinding
import com.smsmonitor.app.service.HeartbeatService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Manual code entry activity for device claim.
 * Allows users to enter 8-character alphanumeric claim codes.
 */
@AndroidEntryPoint
class ManualCodeEntryActivity : AppCompatActivity() {

    companion object {
        fun start(context: Context) {
            context.startActivity(Intent(context, ManualCodeEntryActivity::class.java))
        }
    }

    private lateinit var binding: ActivityManualCodeEntryBinding
    private val viewModel: ManualCodeEntryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityManualCodeEntryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeViewModel()
    }

    private fun setupViews() {
        binding.apply {
            // Force 8-character limit and all caps at input level
            codeInput.filters = arrayOf(
                InputFilter.LengthFilter(8),
                InputFilter.AllCaps()
            )

            serverUrlInput.doAfterTextChanged {
                viewModel.onServerUrlChanged(it?.toString().orEmpty())
            }

            codeInput.doAfterTextChanged {
                viewModel.onCodeChanged(it?.toString().orEmpty())
            }

            claimButton.setOnClickListener {
                viewModel.claimDevice()
            }
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    updateUi(state)
                }
            }
        }
    }

    private fun updateUi(state: ManualCodeEntryUiState) {
        binding.apply {
            // Update input states
            serverUrlInput.isEnabled = !state.isLoading
            codeInput.isEnabled = !state.isLoading
            claimButton.isEnabled = state.isClaimButtonEnabled
            progressBar.isVisible = state.isLoading

            // Update status message
            when {
                state.error != null -> {
                    statusText.text = state.error
                    statusText.setTextColor(getColor(android.R.color.holo_red_dark))
                    Toast.makeText(this@ManualCodeEntryActivity, state.error, Toast.LENGTH_LONG).show()
                }
                state.statusMessage != null -> {
                    statusText.text = state.statusMessage
                    statusText.setTextColor(getColor(android.R.color.holo_blue_dark))
                }
                else -> {
                    statusText.text = ""
                }
            }

            // Handle success
            if (state.isSuccess) {
                statusText.setTextColor(getColor(android.R.color.holo_green_dark))
                Toast.makeText(this@ManualCodeEntryActivity, "Device claimed successfully!", Toast.LENGTH_LONG).show()
                
                HeartbeatService.start(this@ManualCodeEntryActivity)

                val intent = Intent(this@ManualCodeEntryActivity, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                }
                startActivity(intent)
                finish()
            }
        }
    }
}
