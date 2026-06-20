package com.smsmonitor.data.repository

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val securePrefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        SECURE_PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // Plain prefs for migration check
    private val plainPrefs: SharedPreferences = context.getSharedPreferences(
        PLAIN_PREFS_NAME,
        Context.MODE_PRIVATE
    )

    init {
        // Migrate from plain SharedPreferences if needed
        migrateFromPlainPrefs()

        // Auto-generate API key on first launch if not present
        if (securePrefs.getString(KEY_API_KEY, null).isNullOrEmpty()) {
            val newKey = UUID.randomUUID().toString()
            securePrefs.edit().putString(KEY_API_KEY, newKey).apply()
        }
    }

    private fun migrateFromPlainPrefs() {
        val migrated = securePrefs.getBoolean(KEY_MIGRATED, false)
        if (!migrated) {
            // Migrate backend URL
            val oldUrl = plainPrefs.getString(KEY_BACKEND_URL, null)
            if (!oldUrl.isNullOrEmpty()) {
                securePrefs.edit().putString(KEY_BACKEND_URL, oldUrl).apply()
            }

            // Migrate API key
            val oldApiKey = plainPrefs.getString(KEY_API_KEY, null)
            if (!oldApiKey.isNullOrEmpty()) {
                securePrefs.edit().putString(KEY_API_KEY, oldApiKey).apply()
            }

            // Mark as migrated
            securePrefs.edit().putBoolean(KEY_MIGRATED, true).apply()

            // Clear plain prefs (optional, for security)
            plainPrefs.edit().clear().apply()
        }
    }

    var backendUrl: String
        get() = securePrefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
        set(value) = securePrefs.edit().putString(KEY_BACKEND_URL, value).apply()

    var apiKey: String
        get() = securePrefs.getString(KEY_API_KEY, "") ?: ""
        set(value) = securePrefs.edit().putString(KEY_API_KEY, value).apply()

    var tenantId: String?
        get() = securePrefs.getString(KEY_TENANT_ID, null)
        set(value) = securePrefs.edit().putString(KEY_TENANT_ID, value).apply()

    var deviceId: String?
        get() = securePrefs.getString(KEY_DEVICE_ID, null)
        set(value) = securePrefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceSecret: String?
        get() = securePrefs.getString(KEY_DEVICE_SECRET, null)
        set(value) = securePrefs.edit().putString(KEY_DEVICE_SECRET, value).apply()

    var deviceName: String
        get() = securePrefs.getString(KEY_DEVICE_NAME, DEFAULT_DEVICE_NAME) ?: DEFAULT_DEVICE_NAME
        set(value) = securePrefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    var workspaceId: String?
        get() = securePrefs.getString(KEY_WORKSPACE_ID, null)
        set(value) = securePrefs.edit().putString(KEY_WORKSPACE_ID, value).apply()

    var workspaceName: String?
        get() = securePrefs.getString(KEY_WORKSPACE_NAME, null)
        set(value) = securePrefs.edit().putString(KEY_WORKSPACE_NAME, value).apply()

    val isConfigured: Boolean
        get() = backendUrl.isNotBlank() && apiKey.isNotBlank()

    val isClaimed: Boolean
        get() = tenantId != null && deviceId != null && deviceSecret != null

    fun clearDeviceData() {
        securePrefs.edit()
            .remove(KEY_TENANT_ID)
            .remove(KEY_DEVICE_ID)
            .remove(KEY_DEVICE_SECRET)
            .apply()
    }

    var lastKeywordSyncTime: Long
        get() = securePrefs.getLong(KEY_LAST_KEYWORD_SYNC, 0)
        set(value) = securePrefs.edit().putLong(KEY_LAST_KEYWORD_SYNC, value).apply()

    companion object {
        private const val SECURE_PREFS_NAME = "sms_monitor_secure_settings"
        private const val PLAIN_PREFS_NAME = "sms_monitor_settings"
        private const val KEY_BACKEND_URL = "backend_url"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_TENANT_ID = "tenant_id"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_SECRET = "device_secret"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_WORKSPACE_ID = "workspace_id"
        private const val KEY_WORKSPACE_NAME = "workspace_name"
        private const val KEY_MIGRATED = "migrated_to_encrypted"
        private const val KEY_LAST_KEYWORD_SYNC = "last_keyword_sync"
        private const val DEFAULT_DEVICE_NAME = "SMS Monitor Device"
        private const val DEFAULT_BACKEND_URL = "http://10.0.2.2:3000"
    }
}
