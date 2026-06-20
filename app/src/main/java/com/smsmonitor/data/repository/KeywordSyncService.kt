package com.smsmonitor.data.repository

import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.smsmonitor.data.local.dao.KeywordDao
import com.smsmonitor.data.local.entity.KeywordEntity
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.util.HmacSigner
import okhttp3.OkHttpClient
import okhttp3.Request
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Service for syncing keywords from backend.
 * Pulls keywords from GET /v1/keywords and updates local Room database.
 */
@Singleton
class KeywordSyncService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val settingsRepository: SettingsRepository,
    private val keywordDao: KeywordDao
) {

    companion object {
        private const val TAG = "KeywordSyncService"
    }

    private val gson = Gson()

    /**
     * Sync keywords from backend to local database.
     *
     * @return SyncResult with count of synced keywords or error
     */
    suspend fun syncKeywords(): SyncResult {
        val baseUrl = settingsRepository.backendUrl
        val apiKey = settingsRepository.apiKey
        val deviceId = settingsRepository.deviceId
        val deviceSecret = settingsRepository.deviceSecret

        if (baseUrl.isBlank() || apiKey.isBlank()) {
            return SyncResult.Error("Backend URL or API key not configured")
        }

        if (deviceId == null) {
            return SyncResult.Error("Device not claimed")
        }

        val timestamp = HmacSigner.generateTimestamp()
        val signature = deviceSecret?.let {
            HmacSigner.sign(it, timestamp, "GET", "/v1/keywords")
        } ?: ""

        val workspaceId = settingsRepository.workspaceId
        val url = if (workspaceId != null) {
            "$baseUrl/v1/keywords?workspaceId=$workspaceId"
        } else {
            "$baseUrl/v1/keywords"
        }

        val requestBuilder = Request.Builder()
            .url(url)
            .get()
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-Device-ID", deviceId)
            .addHeader("X-Device-Timestamp", timestamp)

        if (signature.isNotBlank()) {
            requestBuilder.addHeader("X-Device-Signature", signature)
        }

        val request = requestBuilder.build()

        return try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                if (it.isSuccessful) {
                    val body = it.body?.string()
                    if (body != null) {
                        val keywords = parseKeywords(body)
                        updateLocalDatabase(keywords)
                        Log.d(TAG, "Synced ${keywords.size} keywords from backend")
                        SyncResult.Success(keywords.size)
                    } else {
                        SyncResult.Error("Empty response from backend")
                    }
                } else {
                    SyncResult.Error("Sync failed with status ${it.code}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sync error: ${e.message}", e)
            SyncResult.Error("Network error: ${e.message}")
        }
    }

    private fun parseKeywords(json: String): List<Keyword> {
        val type = object : TypeToken<BackendKeywordResponse>() {}.type
        val response = gson.fromJson<BackendKeywordResponse>(json, type)
        return response.keywords.map { backendKeyword ->
            Keyword(
                id = backendKeyword.id.hashCode(),
                word = backendKeyword.word,
                matchMode = MatchMode.valueOf(backendKeyword.matchMode),
                enabled = backendKeyword.enabled,
                createdAt = System.currentTimeMillis()
            )
        }
    }

    private suspend fun updateLocalDatabase(keywords: List<Keyword>) {
        // Clear existing keywords and replace with synced ones
        keywordDao.deleteAll()
        keywords.forEach { keyword ->
            keywordDao.insert(
                KeywordEntity(
                    id = keyword.id,
                    word = keyword.word,
                    matchMode = keyword.matchMode.name,
                    enabled = keyword.enabled,
                    createdAt = keyword.createdAt
                )
            )
        }
    }

    /**
     * Get last sync timestamp.
     */
    fun getLastSyncTime(): Long {
        return settingsRepository.lastKeywordSyncTime
    }

}

// Backend response classes
data class BackendKeywordResponse(
    val keywords: List<BackendKeyword>
)

data class BackendKeyword(
    val id: String,
    val word: String,
    val matchMode: String,
    val enabled: Boolean
)

sealed class SyncResult {
    data class Success(val count: Int) : SyncResult()
    data class Error(val message: String) : SyncResult()
}
