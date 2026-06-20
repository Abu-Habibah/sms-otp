package com.smsmonitor.util

import android.content.Context
import android.os.Build
import android.util.Log
import com.smsmonitor.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Utility class to collect device hardware information.
 */
@Singleton
class DeviceInfoCollector @Inject constructor(
    @ApplicationContext private val context: Context
) {

    companion object {
        private const val TAG = "DeviceInfoCollector"
    }

    /**
     * Collect device information.
     * Returns DeviceInfo with available fields, nulls for unavailable info.
     */
    fun collectDeviceInfo(): DeviceInfo {
        return try {
            DeviceInfo(
                manufacturer = Build.MANUFACTURER,
                model = Build.MODEL,
                osVersion = Build.VERSION.RELEASE,
                sdkInt = Build.VERSION.SDK_INT,
                appVersion = BuildConfig.VERSION_NAME,
                device = Build.DEVICE,
                product = Build.PRODUCT,
                hardware = Build.HARDWARE
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error collecting device info: ${e.message}")
            DeviceInfo()
        }
    }

    /**
     * Collect device info with SIM information.
     * Requires READ_PHONE_STATE permission for SIM data.
     */
    fun collectDeviceInfoWithSim(): DeviceInfo {
        val baseInfo = collectDeviceInfo()

        return try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager

            val simSlot1Number = try {
                @Suppress("MissingPermission")
                telephonyManager.line1Number
            } catch (e: SecurityException) {
                Log.w(TAG, "READ_PHONE_STATE permission denied for SIM 1")
                null
            }

            val simSlot2Number = try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as android.telephony.SubscriptionManager
                    val subscriptions = subscriptionManager.activeSubscriptionInfoList
                    if (subscriptions != null && subscriptions.size > 1) {
                        val sim2Info = subscriptions[1]
                        sim2Info.number
                    } else {
                        null
                    }
                } else {
                    null
                }
            } catch (e: SecurityException) {
                Log.w(TAG, "READ_PHONE_STATE permission denied for SIM 2")
                null
            }

            baseInfo.copy(
                simSlot1Number = simSlot1Number,
                simSlot2Number = simSlot2Number
            )
        } catch (e: Exception) {
            Log.w(TAG, "Error collecting SIM info: ${e.message}")
            baseInfo
        }
    }
}

/**
 * Device information data class.
 */
data class DeviceInfo(
    val manufacturer: String? = null,
    val model: String? = null,
    val osVersion: String? = null,
    val sdkInt: Int? = null,
    val appVersion: String? = null,
    val device: String? = null,
    val product: String? = null,
    val hardware: String? = null,
    val simSlot1Number: String? = null,
    val simSlot2Number: String? = null
) {
    fun toMap(): Map<String, Any?> {
        return mapOf(
            "manufacturer" to manufacturer,
            "model" to model,
            "osVersion" to osVersion,
            "sdkInt" to sdkInt,
            "appVersion" to appVersion,
            "device" to device,
            "product" to product,
            "hardware" to hardware,
            "simSlot1Number" to simSlot1Number,
            "simSlot2Number" to simSlot2Number
        )
    }
}
