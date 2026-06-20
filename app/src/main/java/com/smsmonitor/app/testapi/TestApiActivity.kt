package com.smsmonitor.app.testapi

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.databinding.ActivityTestApiBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class TestApiActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTestApiBinding
    private val viewModel: TestApiViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTestApiBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
        viewModel.loadDefaults()
    }

    private fun setupViews() {
        binding.sendTestButton.setOnClickListener {
            val url = binding.serverUrlInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()
            val sender = binding.senderInput.text.toString().trim()
            val message = binding.messageInput.text.toString().trim()

            if (url.isBlank()) {
                Toast.makeText(this, "Server URL is required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (sender.isBlank() || message.isBlank()) {
                Toast.makeText(this, "Sender and message are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            viewModel.sendTestRequest(url, apiKey, sender, message)
        }

        binding.fetchButton.setOnClickListener {
            val url = binding.serverUrlInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()

            if (url.isBlank()) {
                Toast.makeText(this, "Server URL is required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            viewModel.fetchReceivedMessages(url, apiKey)
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Initial default values
                if (state.serverUrl.isNotEmpty() && binding.serverUrlInput.text.isNullOrEmpty()) {
                    binding.serverUrlInput.setText(state.serverUrl)
                }
                if (state.apiKey.isNotEmpty() && binding.apiKeyInput.text.isNullOrEmpty()) {
                    binding.apiKeyInput.setText(state.apiKey)
                }

                binding.progressBar.visibility = if (state.isLoading) View.VISIBLE else View.GONE
                binding.sendTestButton.isEnabled = !state.isLoading

                state.result?.let { result ->
                    binding.resultLabel.visibility = View.VISIBLE
                    binding.resultText.text = result.toFormattedString()
                    if (result.success) {
                        binding.resultLabel.text = "✓ Success"
                        binding.resultLabel.setTextColor(getColor(android.R.color.holo_green_dark))
                    } else {
                        binding.resultLabel.text = "✗ Failed"
                        binding.resultLabel.setTextColor(getColor(android.R.color.holo_red_dark))
                    }
                }
            }
        }
    }
}