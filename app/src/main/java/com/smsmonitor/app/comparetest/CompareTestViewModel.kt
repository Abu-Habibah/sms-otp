package com.smsmonitor.app.comparetest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.domain.model.SmsMessage
import com.smsmonitor.domain.service.KeywordService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltViewModel
class CompareTestViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val keywordService: KeywordService
) : ViewModel() {

    private val _uiState = MutableStateFlow(CompareTestUiState())
    val uiState: StateFlow<CompareTestUiState> = _uiState.asStateFlow()

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    fun loadDefaults() {
        _uiState.value = _uiState.value.copy(
            serverUrl = settingsRepository.backendUrl,
            apiKey = settingsRepository.apiKey
        )
    }

    fun fetchReceivedSms(url: String, apiKey: String) {
        if (url.isBlank()) {
            _uiState.value = _uiState.value.copy(
                fetchStatus = "Server URL is required",
                fetchSuccess = false
            )
            return
        }

        _uiState.value = _uiState.value.copy(isFetching = true, fetchStatus = "Fetching...")

        viewModelScope.launch {
            try {
                val smsList = withContext(Dispatchers.IO) {
                    fetchFromBackend(url, apiKey)
                }
                _uiState.value = _uiState.value.copy(
                    isFetching = false,
                    receivedSms = smsList,
                    fetchSuccess = true,
                    fetchStatus = "Fetched ${smsList.size} message(s)"
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isFetching = false,
                    fetchSuccess = false,
                    fetchStatus = "Error: ${e.message ?: e.javaClass.simpleName}"
                )
            }
        }
    }

    fun testMatch(keyword: String, matchMode: MatchMode) {
        val smsList = _uiState.value.receivedSms
        if (smsList.isEmpty()) {
            _uiState.value = _uiState.value.copy(
                matchResults = MatchResult(
                    keyword = keyword,
                    matchMode = matchMode,
                    totalChecked = 0,
                    matches = emptyList(),
                    error = "No SMS fetched yet. Tap 'Fetch Received SMS' first."
                ),
                showResults = true
            )
            return
        }

        if (keyword.isBlank()) {
            _uiState.value = _uiState.value.copy(
                matchResults = MatchResult(
                    keyword = keyword,
                    matchMode = matchMode,
                    totalChecked = smsList.size,
                    matches = emptyList(),
                    error = "Keyword cannot be empty"
                ),
                showResults = true
            )
            return
        }

        val matches = mutableListOf<MatchDetail>()
        for (sms in smsList) {
            val matched = when (matchMode) {
                MatchMode.CONTAINS -> sms.body.contains(keyword, ignoreCase = true)
                MatchMode.EXACT -> sms.body.contains(keyword)
                MatchMode.AT_START -> sms.body.trimStart().startsWith(keyword, ignoreCase = true)
                MatchMode.AT_END -> sms.body.trimEnd().endsWith(keyword, ignoreCase = true)
                MatchMode.REGEX -> {
                    try {
                        Regex(keyword).containsMatchIn(sms.body)
                    } catch (e: Exception) {
                        false
                    }
                }
            }
            if (matched) {
                matches.add(MatchDetail(sms, matchMode))
            }
        }

        _uiState.value = _uiState.value.copy(
            matchResults = MatchResult(
                keyword = keyword,
                matchMode = matchMode,
                totalChecked = smsList.size,
                matches = matches,
                error = null
            ),
            showResults = true
        )
    }

    private fun fetchFromBackend(url: String, apiKey: String): List<SmsMessage> {
        val builder = Request.Builder()
            .url("$url/v1/sms-logs")
            .get()

        if (apiKey.isNotBlank()) {
            builder.addHeader("Authorization", "Bearer $apiKey")
        }

        val request = builder.build()

        val response = okHttpClient.newCall(request).execute()
        response.use {
            val body = it.body?.string() ?: "{}"
            if (!it.isSuccessful) {
                throw RuntimeException("HTTP ${it.code} ${it.message}")
            }
            return parseSmsList(body)
        }
    }

    private fun parseSmsList(json: String): List<SmsMessage> {
        val root = JSONObject(json)
        val arr = root.optJSONArray("messages") ?: JSONArray()
        val result = mutableListOf<SmsMessage>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            val sender = obj.optString("sender", "unknown")
            val message = obj.optString("message", "")
            val timestampStr = obj.optString("timestamp", "")
            val timestamp = parseTimestamp(timestampStr)
            val id = "$sender:$timestamp:$i"
            result.add(SmsMessage(id = id, sender = sender, body = message, timestamp = timestamp))
        }
        return result
    }

    private fun parseTimestamp(timestampStr: String): Long {
        if (timestampStr.isBlank()) return System.currentTimeMillis()
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            sdf.parse(timestampStr)?.time ?: System.currentTimeMillis()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
}

data class CompareTestUiState(
    val serverUrl: String = "",
    val apiKey: String = "",
    val isFetching: Boolean = false,
    val fetchSuccess: Boolean = false,
    val fetchStatus: String = "",
    val receivedSms: List<SmsMessage> = emptyList(),
    val showResults: Boolean = false,
    val matchResults: MatchResult? = null
)

data class MatchResult(
    val keyword: String,
    val matchMode: MatchMode,
    val totalChecked: Int,
    val matches: List<MatchDetail>,
    val error: String?
)

data class MatchDetail(
    val sms: SmsMessage,
    val matchMode: MatchMode
)