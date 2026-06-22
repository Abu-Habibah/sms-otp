package com.smsmonitor.app.claim

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.smsmonitor.R
import com.smsmonitor.databinding.ActivityTenantSelectionBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

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

    private lateinit var binding: ActivityTenantSelectionBinding
    private val viewModel: TenantSelectionViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTenantSelectionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
    }

    private fun setupViews() {
        binding.changeTenantButton.setOnClickListener {
            startActivity(Intent(this, ManualCodeEntryActivity::class.java))
        }

        binding.backButton.setOnClickListener {
            finish()
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    updateUi(state)
                }
            }
        }
    }

    private fun updateUi(state: TenantSelectionUiState) {
        binding.progressBar.visibility = if (state.isLoading) View.VISIBLE else View.GONE
        
        val deviceInfo = state.deviceInfo
        if (deviceInfo != null) {
            binding.currentTenantText.text = getString(R.string.tenant_id_label, deviceInfo.tenantId)
            binding.deviceInfoText.text = getString(R.string.device_id_label, deviceInfo.id)
            binding.changeTenantButton.visibility = View.VISIBLE
            binding.statusText.visibility = View.GONE
        } else {
            binding.currentTenantText.text = getString(R.string.no_tenant_assigned)
            binding.deviceInfoText.text = getString(R.string.device_not_claimed)
            binding.changeTenantButton.visibility = View.GONE
            binding.statusText.apply {
                visibility = View.VISIBLE
                text = getString(R.string.please_claim_device)
                setTextColor(ContextCompat.getColor(this@TenantSelectionActivity, android.R.color.holo_red_dark))
            }
        }

        state.error?.let { error ->
            binding.statusText.visibility = View.VISIBLE
            binding.statusText.text = error
            binding.statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
        }
    }
}
