package com.smsmonitor.app.claim

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.R
import com.smsmonitor.data.repository.ClaimResult
import com.smsmonitor.data.repository.ClaimService
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.data.repository.KeywordSyncService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Manual code entry activity for device claim.
 * Allows users to enter 8-character alphanumeric claim codes.
 */
@AndroidEntryPoint
class ManualCodeEntryActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "ManualCodeEntry"
        private const val CLAIM_CODE_LENGTH = 8
        private const val CLAIM_CODE_REGEX = "^[A-Z0-9]{8}$"

        fun start(context: Context) {
            context.startActivity(Intent(context, ManualCodeEntryActivity::class.java))
        }
    }

    @Inject
    lateinit var claimService: ClaimService

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var keywordSyncService: com.smsmonitor.data.repository.KeywordSyncService

    @Inject
    lateinit var deviceInfoCollector: com.smsmonitor.util.DeviceInfoCollector

    private lateinit var serverUrlInput: EditText
    private lateinit var codeInput: EditText
    private lateinit var claimButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_manual_code_entry)

        setupViews()
    }

    private fun setupViews() {
        serverUrlInput = findViewById(R.id.serverUrlInput)
        codeInput = findViewById(R.id.codeInput)
        claimButton = findViewById(R.id.claimButton)
        progressBar = findViewById(R.id.progressBar)
        statusText = findViewById(R.id.statusText)

        serverUrlInput.setText(settingsRepository.backendUrl)

        codeInput.filters = arrayOf(InputFilter.LengthFilter(CLAIM_CODE_LENGTH))

        // Auto-uppercase input
        codeInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val text = s?.toString()?.uppercase() ?: ""
                if (s.toString() != text) {
                    codeInput.setText(text)
                    codeInput.setSelection(text.length)
                }
                updateClaimButtonState()
            }
        })

        claimButton.setOnClickListener {
            val code = codeInput.text.toString().trim().uppercase()
            if (isValidCode(code)) {
                claimDevice(code)
            }
        }

        updateClaimButtonState()
    }

    private fun updateClaimButtonState() {
        val code = codeInput.text.toString().trim()
        val serverUrl = serverUrlInput.text.toString().trim()
        claimButton.isEnabled = code.length == CLAIM_CODE_LENGTH && isValidCode(code) && serverUrl.isNotBlank()
    }

    private fun isValidCode(code: String): Boolean {
        return code.matches(CLAIM_CODE_REGEX.toRegex())
    }

    private fun claimDevice(code: String) {
        val serverUrl = serverUrlInput.text.toString().trim()
        if (serverUrl.isBlank()) {
            statusText.text = "Server URL is required"
            statusText.setTextColor(getColor(android.R.color.holo_red_dark))
            return
        }

        settingsRepository.backendUrl = serverUrl
        setLoading(true)
        statusText.text = "Claiming device..."
        statusText.setTextColor(getColor(android.R.color.holo_blue_dark))

        lifecycleScope.launch {
            val result = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                claimService.claimDevice(code, null, deviceInfoCollector.collectDeviceInfoWithSim())
            }
            when (result) {
                is ClaimResult.Success -> {
                    setLoading(false)
                    statusText.text = "Device claimed successfully!"
                    statusText.setTextColor(getColor(android.R.color.holo_green_dark))
                    Toast.makeText(
                            this@ManualCodeEntryActivity,
                            "Device claimed successfully!",
                            Toast.LENGTH_LONG
                        ).show()

                        com.smsmonitor.app.service.HeartbeatService.start(this@ManualCodeEntryActivity)

                        // Sync keywords immediately after claim
                        lifecycleScope.launch {
                            val syncResult = keywordSyncService.syncKeywords()
                            when (syncResult) {
                                is com.smsmonitor.data.repository.SyncResult.Success -> {
                                    Log.d(TAG, "Synced ${syncResult.count} keywords after claim")
                                }
                                is com.smsmonitor.data.repository.SyncResult.Error -> {
                                    Log.w(TAG, "Keyword sync after claim failed: ${syncResult.message}")
                                }
                            }
                        }

                        val intent = Intent(this@ManualCodeEntryActivity, com.smsmonitor.app.MainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                is ClaimResult.Error -> {
                    setLoading(false)
                    statusText.text = result.message
                    statusText.setTextColor(getColor(android.R.color.holo_red_dark))
                    Toast.makeText(
                        this@ManualCodeEntryActivity,
                        "Claim failed: ${result.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
        claimButton.isEnabled = !loading
        codeInput.isEnabled = !loading
    }
}
