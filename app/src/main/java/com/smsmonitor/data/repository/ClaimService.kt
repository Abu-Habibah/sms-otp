package com.smsmonitor.data.repository

import android.util.Log
import com.google.gson.Gson
import com.smsmonitor.data.repository.SettingsRepository
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Service for device claim flow.
 * Handles calling POST /v1/claim-codes/claim to onboard a device.
 */
@Singleton
class ClaimService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val settingsRepository: SettingsRepository
) {

    private val gson = Gson()

    companion object {
        private const val TAG = "ClaimService"
    }

    /**
     * Claim a device using a claim code.
     *
     * @param code The 8-character claim code from QR or manual entry
     * @return ClaimResult with device info or error
     */
    suspend fun claimDevice(code: String, workspaceId: String? = null, deviceInfo: com.smsmonitor.util.DeviceInfo? = null): ClaimResult {
        val baseUrl = settingsRepository.backendUrl
        if (baseUrl.isBlank()) {
            return ClaimResult.Error("Backend URL not configured")
        }

        val claimDeviceInfo = deviceInfo?.let {
            ClaimDeviceInfo(
                manufacturer = it.manufacturer,
                model = it.model,
                osVersion = it.osVersion,
                appVersion = it.appVersion,
                simSlot1Number = it.simSlot1Number,
                simSlot2Number = it.simSlot2Number,
                androidVersion = it.osVersion
            )
        }

        val payload = ClaimRequest(code = code, workspaceId = workspaceId, deviceInfo = claimDeviceInfo)
        val json = gson.toJson(payload)
        val requestBody = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$baseUrl/v1/claim-codes/claim")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer ${settingsRepository.apiKey}")
            .build()

        return try {
            val response = okHttpClient.newCall(request).execute()
            response.use {
                val body = it.body?.string()

                if (it.isSuccessful && body != null) {
                    val claimResponse = gson.fromJson(body, ClaimResponse::class.java)
                    Log.d(TAG, "Device claimed successfully: ${claimResponse.device.id}")

                    // Store device info in SettingsRepository
                    settingsRepository.tenantId = claimResponse.device.tenantId
                    settingsRepository.deviceId = claimResponse.device.id
                    settingsRepository.apiKey = claimResponse.apiKey
                    claimResponse.device.deviceSecret?.let {
                        settingsRepository.deviceSecret = it
                    }
                    // Store workspace info if present
                    claimResponse.workspaceId?.let {
                        settingsRepository.workspaceId = it
                    }
                    claimResponse.workspaceName?.let {
                        settingsRepository.workspaceName = it
                    }

                    ClaimResult.Success(claimResponse)
                } else {
                    val errorMessage = when (it.code) {
                        400 -> "Invalid claim code format"
                        404 -> "Claim code not found or expired"
                        409 -> "Claim code already used"
                        429 -> "Too many attempts. Please try again later"
                        else -> "Claim failed with status ${it.code}"
                    }
                    Log.w(TAG, "Claim failed: $errorMessage")
                    ClaimResult.Error(errorMessage)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Claim error: ${e.message}", e)
            ClaimResult.Error("Network error: ${e.message}")
        }
    }

    /**
     * Check if device is already claimed.
     */
    fun isDeviceClaimed(): Boolean {
        return settingsRepository.isClaimed
    }

    /**
     * Get current device info.
     */
    fun getDeviceInfo(): DeviceInfo? {
        val deviceId = settingsRepository.deviceId ?: return null
        val tenantId = settingsRepository.tenantId ?: return null
        return DeviceInfo(
            id = deviceId,
            tenantId = tenantId
        )
    }
}

// Data classes for claim flow
data class ClaimRequest(
    val code: String,
    val publicKey: String = "",
    val workspaceId: String? = null,
    val deviceInfo: ClaimDeviceInfo? = null
)

data class ClaimDeviceInfo(
    val manufacturer: String?,
    val model: String?,
    val osVersion: String?,
    val appVersion: String?,
    val simSlot1Number: String?,
    val simSlot2Number: String?,
    val androidVersion: String?
)

data class ClaimResponse(
    val apiKey: String,
    val device: ClaimDevice,
    val workspaceId: String?,
    val workspaceName: String?
)

data class ClaimDevice(
    val id: String,
    val tenantId: String,
    val name: String,
    val status: String,
    val deviceSecret: String?,
    val workspaceId: String?,
    val workspaceName: String?
)

data class DeviceInfo(
    val id: String,
    val tenantId: String
)

sealed class ClaimResult {
    data class Success(val response: ClaimResponse) : ClaimResult()
    data class Error(val message: String) : ClaimResult()
}
