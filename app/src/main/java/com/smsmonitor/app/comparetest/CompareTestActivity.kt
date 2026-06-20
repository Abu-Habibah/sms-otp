package com.smsmonitor.app.comparetest

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smsmonitor.R
import com.smsmonitor.databinding.ActivityCompareTestBinding
import com.smsmonitor.domain.model.MatchMode
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class CompareTestActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCompareTestBinding
    private val viewModel: CompareTestViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCompareTestBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
        viewModel.loadDefaults()
    }

    private fun setupViews() {
        binding.fetchButton.setOnClickListener {
            val url = binding.serverUrlInput.text.toString().trim()
            val apiKey = binding.apiKeyInput.text.toString().trim()
            viewModel.fetchReceivedSms(url, apiKey)
        }

        binding.testMatchButton.setOnClickListener {
            val keyword = binding.keywordInput.text.toString().trim()
            val matchMode = when (binding.matchModeGroup.checkedRadioButtonId) {
                R.id.radioExact -> MatchMode.EXACT
                R.id.radioAtStart -> MatchMode.AT_START
                R.id.radioAtEnd -> MatchMode.AT_END
                R.id.radioRegex -> MatchMode.REGEX
                else -> MatchMode.CONTAINS
            }
            viewModel.testMatch(keyword, matchMode)
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                if (state.serverUrl.isNotEmpty() && binding.serverUrlInput.text.isNullOrEmpty()) {
                    binding.serverUrlInput.setText(state.serverUrl)
                }
                if (state.apiKey.isNotEmpty() && binding.apiKeyInput.text.isNullOrEmpty()) {
                    binding.apiKeyInput.setText(state.apiKey)
                }

                binding.fetchStatusText.text = state.fetchStatus
                binding.fetchStatusText.setTextColor(
                    if (state.fetchSuccess) getColor(android.R.color.holo_green_dark)
                    else getColor(android.R.color.holo_red_dark)
                )
                binding.fetchButton.isEnabled = !state.isFetching

                if (state.showResults && state.matchResults != null) {
                    binding.resultsCard.visibility = View.VISIBLE
                    renderResults(state.matchResults)
                } else {
                    binding.resultsCard.visibility = View.GONE
                }
            }
        }
    }

    private fun renderResults(result: MatchResult) {
        if (result.error != null) {
            binding.resultsSummaryText.text = "Error: ${result.error}"
            binding.resultsSummaryText.setTextColor(getColor(android.R.color.holo_red_dark))
            binding.resultsDetailText.text = ""
            return
        }

        val sb = StringBuilder()
        sb.append("Keyword: '${result.keyword}'\n")
        sb.append("Mode: ${result.matchMode.name}\n")
        sb.append("Total checked: ${result.totalChecked}\n")
        sb.append("Matched: ${result.matches.size}\n")
        sb.append("\n")

        if (result.matches.isEmpty()) {
            sb.append("❌ NO MATCHES FOUND\n\n")
            sb.append("The keyword matching would NOT have forwarded any of the received SMS.\n")
            sb.append("This means even if SMS Monitor is working, the keyword is not matching.")
        } else {
            sb.append("✓ MATCHES FOUND:\n\n")
            result.matches.forEachIndexed { idx, detail ->
                sb.append("Match #${idx + 1}\n")
                sb.append("  From: ${detail.sms.sender}\n")
                sb.append("  Body: ${detail.sms.body}\n")
                sb.append("  Time: ${detail.sms.timestamp}\n")
                sb.append("\n")
            }
            sb.append("If SMS Monitor is working correctly, all these messages should appear in the app's Logs screen.")
        }

        binding.resultsSummaryText.text = if (result.matches.isNotEmpty()) {
            "✓ Found ${result.matches.size} match(es) out of ${result.totalChecked}"
        } else {
            "✗ No matches in ${result.totalChecked} message(s)"
        }
        binding.resultsSummaryText.setTextColor(
            if (result.matches.isNotEmpty()) getColor(android.R.color.holo_green_dark)
            else getColor(android.R.color.holo_orange_dark)
        )
        binding.resultsDetailText.text = sb.toString()
    }
}