package com.smsmonitor.util

import android.util.Log
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * HMAC signing utility for device authentication.
 * Used to sign requests with X-Device-Signature and X-Device-Timestamp headers.
 */
object HmacSigner {

    private const val TAG = "HmacSigner"
    private const val HMAC_ALGORITHM = "HmacSHA256"

    /**
     * Generate HMAC signature for a request.
     *
     * @param secret The device secret key (from claim response)
     * @param timestamp The request timestamp in ISO 8601 format
     * @param method HTTP method (POST, GET, etc.)
     * @param path Request path (e.g., /v1/sms)
     * @param body Request body (optional, for POST requests)
     * @return HMAC signature as hex string
     */
    fun sign(
        secret: String,
        timestamp: String,
        method: String,
        path: String,
        body: String? = null
    ): String {
        val payload = buildString {
            append(method.uppercase())
            append("\n")
            append(path)
            append("\n")
            append(timestamp)
            if (body != null) {
                append("\n")
                append(body)
            }
        }

        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val secretKeySpec = SecretKeySpec(secret.toByteArray(), HMAC_ALGORITHM)
        mac.init(secretKeySpec)
        val signatureBytes = mac.doFinal(payload.toByteArray())
        val signature = signatureBytes.joinToString("") { "%02x".format(it) }

        Log.d(TAG, "Signed request: $method $path at $timestamp")
        return signature
    }

    /**
     * Generate current timestamp in ISO 8601 format.
     */
    fun generateTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    /**
     * Generate SMS ingest signature.
     *
     * @param secret The device secret key
     * @param timestamp The request timestamp
     * @param smsId The SMS ID
     * @param sender The sender address
     * @param message The SMS body
     * @return HMAC signature
     */
    fun signSmsIngest(
        secret: String,
        timestamp: String,
        smsId: String,
        sender: String,
        message: String
    ): String {
        val payload = "POST\n/v1/sms\n$timestamp\n$smsId\n$sender\n$message"
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val secretKeySpec = SecretKeySpec(secret.toByteArray(), HMAC_ALGORITHM)
        mac.init(secretKeySpec)
        val signatureBytes = mac.doFinal(payload.toByteArray())
        return signatureBytes.joinToString("") { "%02x".format(it) }
    }
}
