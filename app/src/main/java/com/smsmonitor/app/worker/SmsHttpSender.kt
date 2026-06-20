package com.smsmonitor.app.worker

import android.util.Log
import com.google.gson.Gson
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.util.HmacSigner
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Single place that knows how to POST a forwarded SMS to the configured backend.
 * Used by [SmsBroadcastReceiver] (immediate, in-process) and [SmsForwardWorker]
 * (deferred, via WorkManager) so the request format is identical regardless of
 * which path delivers it. The `upsertLog` in the worker (by `smsId`) prevents
 * duplicate log rows even if both paths run.
 *
 * v2.0: Uses /v1/sms endpoint with HMAC authentication.
 */
class SmsHttpSender(
    private val okHttpClient: OkHttpClient,
    private val settingsRepository: SettingsRepository
) {

    companion object {
        private const val TAG = "SmsMonitor"
    }

    private val gson = Gson()

    /**
     * Synchronous HTTP POST. Returns true on 2xx, false otherwise.
     * Callers are responsible for thread context; for the receiver, run on a
     * coroutine launched in a sensible dispatcher; for the worker, run inside
     * `doWork()`.
     */
    fun send(
        smsId: String,
        sender: String,
        message: String,
        matchedKeyword: String
    ): Boolean {
        val baseUrl = settingsRepository.backendUrl
        val apiKey = settingsRepository.apiKey
        val deviceSecret = settingsRepository.deviceSecret
        val deviceId = settingsRepository.deviceId

        if (baseUrl.isBlank() || apiKey.isBlank()) {
            Log.w(TAG, "[HttpSender] Refusing to send: backendUrl or apiKey is blank")
            return false
        }

        // If device is not claimed, use legacy endpoint
        if (deviceId == null || deviceSecret == null) {
            return sendLegacy(baseUrl, apiKey, smsId, sender, message, matchedKeyword)
        }

        // v2.0: Use /v1/sms endpoint with HMAC
        return sendV2(baseUrl, apiKey, deviceSecret, deviceId, smsId, sender, message, matchedKeyword)
    }

    private fun sendLegacy(
        baseUrl: String,
        apiKey: String,
        smsId: String,
        sender: String,
        message: String,
        matchedKeyword: String
    ): Boolean {
        val payload = SmsForwardPayloadLegacy(
            timestamp = formatTimestamp(System.currentTimeMillis()),
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            deviceId = smsId,
            deviceAlias = settingsRepository.deviceName
        )
        val json = gson.toJson(payload)
        val requestBody = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$baseUrl/sms/forward")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $apiKey")
            .build()

        return executeRequest(request, smsId, "legacy")
    }

    private fun sendV2(
        baseUrl: String,
        apiKey: String,
        deviceSecret: String,
        deviceId: String,
        smsId: String,
        sender: String,
        message: String,
        matchedKeyword: String
    ): Boolean {
        val timestamp = HmacSigner.generateTimestamp()
        val signature = HmacSigner.signSmsIngest(
            secret = deviceSecret,
            timestamp = timestamp,
            smsId = smsId,
            sender = sender,
            message = message
        )

        val payload = SmsForwardPayloadV2(
            timestamp = timestamp,
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            smsId = smsId
        )
        val json = gson.toJson(payload)
        val requestBody = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$baseUrl/v1/sms")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("X-Device-ID", deviceId)
            .addHeader("X-Device-Signature", signature)
            .addHeader("X-Device-Timestamp", timestamp)
            .build()

        return executeRequest(request, smsId, "v2")
    }

    private fun executeRequest(request: Request, smsId: String, version: String): Boolean {
        return try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                if (it.isSuccessful) {
                    Log.d(TAG, "[HttpSender] HTTP ${it.code} ($version) smsId=${smsId.take(8)}")
                } else {
                    Log.w(TAG, "[HttpSender] HTTP ${it.code} ($version) smsId=${smsId.take(8)}")
                }
                it.isSuccessful
            }
        } catch (e: Exception) {
            Log.e(TAG, "[HttpSender] HTTP error ($version) smsId=${smsId.take(8)}: ${e.message}", e)
            false
        }
    }

    private fun formatTimestamp(timestamp: Long): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date(timestamp))
    }

    // Legacy payload format (v1.0)
    data class SmsForwardPayloadLegacy(
        val timestamp: String,
        val sender: String,
        val message: String,
        val matchedKeyword: String,
        val deviceId: String,
        val deviceAlias: String
    )

    // v2.0 payload format
    data class SmsForwardPayloadV2(
        val timestamp: String,
        val sender: String,
        val message: String,
        val matchedKeyword: String,
        val smsId: String
    )
}
