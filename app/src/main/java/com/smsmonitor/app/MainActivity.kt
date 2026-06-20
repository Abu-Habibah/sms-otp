package com.smsmonitor.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.BuildConfig
import com.smsmonitor.app.claim.ClaimCodeScannerActivity
import com.smsmonitor.app.comparetest.CompareTestActivity
import com.smsmonitor.app.keywords.KeywordsActivity
import com.smsmonitor.app.logs.LogsActivity
import com.smsmonitor.app.settings.SettingsActivity
import com.smsmonitor.app.testapi.TestApiActivity
import com.smsmonitor.data.repository.ForwardingRepository
import com.smsmonitor.data.repository.KeywordSyncService
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.databinding.ActivityMainBinding
import com.smsmonitor.domain.model.ForwardingStatus
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    @Inject
    lateinit var keywordService: KeywordService

    @Inject
    lateinit var forwardingRepository: ForwardingRepository

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var keywordSyncService: KeywordSyncService

    private lateinit var binding: ActivityMainBinding

    private var monitoringEnabled = true

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startMonitoring()
        } else {
            showPermissionDeniedError()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!settingsRepository.isClaimed && intent?.hasExtra("skip_onboarding") != true) {
            startActivity(Intent(this, ClaimCodeScannerActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        checkAndRequestSmsPermission()
        syncKeywordsFromBackend()
    }

    private fun syncKeywordsFromBackend() {
        lifecycleScope.launch {
            val result = keywordSyncService.syncKeywords()
            when (result) {
                is com.smsmonitor.data.repository.SyncResult.Success -> {
                    Log.d(TAG, "Synced ${result.count} keywords from backend")
                    settingsRepository.lastKeywordSyncTime = System.currentTimeMillis()
                }
                is com.smsmonitor.data.repository.SyncResult.Error -> {
                    Log.w(TAG, "Keyword sync failed: ${result.message}")
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::binding.isInitialized) {
            refreshDashboard()
        }
    }

    private fun setupViews() {
        binding.monitoringSwitch.setOnCheckedChangeListener { _, isChecked ->
            monitoringEnabled = isChecked
            updateMonitoringStatus()
        }

        binding.keywordsButton.setOnClickListener {
            startActivity(Intent(this, KeywordsActivity::class.java))
        }

        binding.settingsButton.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        binding.logsButton.setOnClickListener {
            startActivity(Intent(this, LogsActivity::class.java))
        }

        binding.testApiButton.setOnClickListener {
            startActivity(Intent(this, TestApiActivity::class.java))
        }

        binding.compareTestButton.setOnClickListener {
            startActivity(Intent(this, CompareTestActivity::class.java))
        }

        binding.claimDeviceButton.setOnClickListener {
            startActivity(Intent(this, ClaimCodeScannerActivity::class.java))
        }

        binding.lastLogCard.setOnClickListener {
            startActivity(Intent(this, LogsActivity::class.java))
        }

        binding.versionText.text = "v${BuildConfig.VERSION_NAME} (Build: ${BuildConfig.VERSION_CODE})"
    }

    private fun checkAndRequestSmsPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECEIVE_SMS
            ) == PackageManager.PERMISSION_GRANTED -> {
                startMonitoring()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.RECEIVE_SMS) -> {
                showPermissionDeniedError()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.RECEIVE_SMS)
            }
        }
    }

    private fun startMonitoring() {
        binding.errorCard.visibility = View.GONE
        lifecycleScope.launch {
            keywordService.loadKeywords()
        }
        updateMonitoringStatus()
        refreshDashboard()
    }

    private fun showPermissionDeniedError() {
        binding.errorCard.visibility = View.VISIBLE
        binding.errorText.text = "SMS permission is required for monitoring. Please grant the permission in settings."
        binding.statusText.text = "Inactive"
        binding.monitoringSwitch.isChecked = false
 }

    private fun updateMonitoringStatus() {
        if (monitoringEnabled && ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECEIVE_SMS
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            binding.statusText.text = "Active"
            binding.statusText.setTextColor(getColor(android.R.color.holo_green_dark))
        } else {
            binding.statusText.text = "Inactive"
            binding.statusText.setTextColor(getColor(android.R.color.holo_red_dark))
        }
    }

    private fun refreshDashboard() {
        lifecycleScope.launch {
            val keywords = keywordService.keywords.first()
            binding.keywordCount.text = keywords.size.toString()

            val logs = forwardingRepository.getAllLogs().first()
            binding.pendingCount.text = logs.count { it.status == ForwardingStatus.PENDING }.toString()
            binding.successCount.text = logs.count { it.status == ForwardingStatus.SUCCESS }.toString()
            binding.failedCount.text = logs.count { it.status == ForwardingStatus.FAILED }.toString()

            logs.firstOrNull()?.let { lastLog ->
                binding.lastLogCard.visibility = View.VISIBLE
                binding.lastLogSender.text = lastLog.sender
                binding.lastLogMessage.text = lastLog.message
                binding.lastLogStatus.text = "Status: ${lastLog.status.name}"
                val color = when (lastLog.status) {
                    ForwardingStatus.PENDING -> android.R.color.holo_orange_dark
                    ForwardingStatus.SUCCESS -> android.R.color.holo_green_dark
                    ForwardingStatus.FAILED -> android.R.color.holo_red_dark
                }
                binding.lastLogStatus.setTextColor(getColor(color))
            } ?: run {
                binding.lastLogCard.visibility = View.GONE
            }

            if (!settingsRepository.isConfigured) {
                binding.errorCard.visibility = View.VISIBLE
                binding.errorText.text = "Backend URL or API key not configured. Go to Settings to configure."
            } else {
                binding.errorCard.visibility = View.GONE
            }
        }
    }
}
