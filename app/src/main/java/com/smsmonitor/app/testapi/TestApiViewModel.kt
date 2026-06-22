package com.smsmonitor.app.testapi

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsmonitor.data.repository.SettingsRepository
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
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltViewModel
class TestApiViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TestApiUiState())
    val uiState: StateFlow<TestApiUiState> = _uiState.asStateFlow()

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

    fun sendTestRequest(url: String, apiKey: String, sender: String, message: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, result = null)

        viewModelScope.launch {
            val result = try {
                withContext(Dispatchers.IO) {
                    sendToBackend(url, apiKey, sender, message)
                }
            } catch (e: Exception) {
                TestResult(
                    success = false,
                    statusCode = null,
                    responseBody = null,
                    error = e.message ?: e.javaClass.simpleName
                )
            }
            _uiState.value = _uiState.value.copy(isLoading = false, result = result)
        }
    }

    fun fetchReceivedMessages(url: String, apiKey: String) {
        _uiState.value = _uiState.value.copy(isLoading = true)

        viewModelScope.launch {
            val result = try {
                withContext(Dispatchers.IO) {
                    fetchFromBackend(url, apiKey)
                }
            } catch (e: Exception) {
                TestResult(
                    success = false,
                    statusCode = null,
                    responseBody = null,
                    error = e.message ?: e.javaClass.simpleName
                )
            }
            _uiState.value = _uiState.value.copy(isLoading = false, result = result)
        }
    }

    private fun fetchFromBackend(url: String, apiKey: String): TestResult {
        val builder = Request.Builder()
            .url("$url/v1/sms-logs")
            .get()

        if (apiKey.isNotBlank()) {
            builder.addHeader("Authorization", "Bearer $apiKey")
        }

        val request = builder.build()

        val response = okHttpClient.newCall(request).execute()
        response.use {
            val body = it.body?.string()
            return if (it.isSuccessful) {
                TestResult(
                    success = true,
                    statusCode = it.code,
                    responseBody = body,
                    error = null
                )
            } else {
                TestResult(
                    success = false,
                    statusCode = it.code,
                    responseBody = body,
                    error = "HTTP ${it.code} ${it.message}"
                )
            }
        }
    }

    private fun sendToBackend(url: String, apiKey: String, sender: String, message: String): TestResult {
        val timestamp = formatTimestamp(System.currentTimeMillis())
        val payload = JSONObject().apply {
            put("timestamp", timestamp)
            put("sender", sender)
            put("message", message)
            put("matchedKeyword", "test")
            put("deviceId", "android-test")
            put("deviceAlias", "SMS Monitor Test")
        }

        val requestBody = payload.toString().toRequestBody("application/json".toMediaType())

        val builder = Request.Builder()
            .url("$url/v1/sms")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")

        if (apiKey.isNotBlank()) {
            builder.addHeader("Authorization", "Bearer $apiKey")
        }

        val request = builder.build()

        val response = okHttpClient.newCall(request).execute()
        response.use {
            val body = it.body?.string()
            return if (it.isSuccessful) {
                TestResult(
                    success = true,
                    statusCode = it.code,
                    responseBody = body,
                    error = null
                )
            } else {
                TestResult(
                    success = false,
                    statusCode = it.code,
                    responseBody = body,
                    error = "HTTP ${it.code} ${it.message}"
                )
            }
        }
    }

    private fun formatTimestamp(timestamp: Long): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date(timestamp))
    }
}

data class TestApiUiState(
    val serverUrl: String = "",
    val apiKey: String = "",
    val isLoading: Boolean = false,
    val result: TestResult? = null
)

data class TestResult(
    val success: Boolean,
    val statusCode: Int?,
    val responseBody: String?,
    val error: String?
) {
    fun toFormattedString(): String {
        val sb = StringBuilder()
        sb.append("Status: ").append(statusCode ?: "—").append("\n")
        if (error != null) {
            sb.append("Error: ").append(error).append("\n")
        }
        sb.append("\nResponse Body:\n")
        sb.append(responseBody ?: "(empty)")
        return sb.toString()
    }
}