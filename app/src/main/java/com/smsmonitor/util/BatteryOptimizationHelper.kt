package com.smsmonitor.util

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log

/**
 * Helper for managing battery optimization exemptions.
 * Prompts users to whitelist the app from Doze/standby buckets.
 */
object BatteryOptimizationHelper {

    private const val TAG = "BatteryOptimizationHelper"

    /**
     * Check if the app is ignoring battery optimizations.
     */
    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    /**
     * Request battery optimization exemption.
     * Opens system settings for the user to whitelist the app.
     */
    fun requestBatteryExemption(activity: Activity) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:${activity.packageName}")
            activity.startActivity(intent)
            Log.d(TAG, "Requested battery optimization exemption")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to request battery exemption: ${e.message}", e)
            // Fallback to app settings
            openAppSettings(activity)
        }
    }

    /**
     * Open app settings page.
     */
    fun openAppSettings(activity: Activity) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.fromParts("package", activity.packageName, null)
            activity.startActivity(intent)
            Log.d(TAG, "Opened app settings")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open app settings: ${e.message}", e)
        }
    }

    /**
     * Check if the device is in power save mode.
     */
    fun isPowerSaveMode(context: Context): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return powerManager.isPowerSaveMode
    }

    /**
     * Check if the app is in standby bucket (Android 9+).
     * Returns true if the app is in a restricted bucket.
     */
    fun isInRestrictedBucket(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            return false
        }
        // This would require UsageStatsManager permission
        // For now, return false and rely on isIgnoringBatteryOptimizations
        return false
    }

    /**
     * Get a human-readable status of battery optimization.
     */
    fun getBatteryOptimizationStatus(context: Context): BatteryStatus {
        return when {
            isIgnoringBatteryOptimizations(context) -> BatteryStatus.EXEMPT
            isPowerSaveMode(context) -> BatteryStatus.RESTRICTED
            else -> BatteryStatus.NORMAL
        }
    }
}

enum class BatteryStatus {
    EXEMPT,    // App is whitelisted from battery optimization
    NORMAL,    // App is in normal state
    RESTRICTED // App is in power save mode or restricted
}
