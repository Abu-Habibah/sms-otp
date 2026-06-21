package com.smsmonitor.app.claim

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smsmonitor.R
import com.smsmonitor.data.repository.ClaimService
import com.smsmonitor.data.repository.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Tenant selection activity for multi-tenant devices.
 * Shows current tenant info and allows switching if device belongs to multiple tenants.
 */
@AndroidEntryPoint
class TenantSelectionActivity : AppCompatActivity() {

    companion object {
        fun start(context: Context) {
            context.startActivity(Intent(context, TenantSelectionActivity::class.java))
        }
    }

    @Inject
    lateinit var settingsRepository: SettingsRepository

    @Inject
    lateinit var claimService: ClaimService

    private lateinit var currentTenantText: TextView
    private lateinit var deviceInfoText: TextView
    private lateinit var changeTenantButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tenant_selection)

        setupViews()
        loadTenantInfo()
    }

    private fun setupViews() {
        currentTenantText = findViewById(R.id.currentTenantText)
        deviceInfoText = findViewById(R.id.deviceInfoText)
        changeTenantButton = findViewById(R.id.changeTenantButton)
        progressBar = findViewById(R.id.progressBar)
        statusText = findViewById(R.id.statusText)

        changeTenantButton.setOnClickListener {
            startActivity(Intent(this, ManualCodeEntryActivity::class.java))
        }

        findViewById<Button>(R.id.backButton).setOnClickListener {
            finish()
        }
    }

    private fun loadTenantInfo() {
        val deviceInfo = claimService.getDeviceInfo()

        if (deviceInfo != null) {
            currentTenantText.text = "Tenant ID: ${deviceInfo.tenantId}"
            deviceInfoText.text = "Device ID: ${deviceInfo.id}"
            changeTenantButton.visibility = View.VISIBLE
        } else {
            currentTenantText.text = "No tenant assigned"
            deviceInfoText.text = "Device not claimed"
            changeTenantButton.visibility = View.GONE
            statusText.text = "Please claim this device first"
            statusText.setTextColor(getColor(android.R.color.holo_red_dark))
        }
    }
}
