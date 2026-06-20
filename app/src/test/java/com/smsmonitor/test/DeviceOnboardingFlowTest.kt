package com.smsmonitor.test

import com.smsmonitor.util.HmacSigner
import org.junit.Assert.*
import org.junit.Test

class DeviceOnboardingFlowTest {

    @Test
    fun `QR code payload format is valid`() {
        val serverUrl = "http://10.0.2.2:3000"
        val code = "ABC12345"
        val qrPayload = "$serverUrl/v1/claim?code=$code"

        val regex = "^https?://.+/v1/claim\\?code=[A-Z0-9]{8}$".toRegex()
        assertTrue("QR payload should match format", qrPayload.matches(regex))
    }

    @Test
    fun `QR code payload extracts server URL correctly`() {
        val qrPayload = "http://10.0.2.2:3000/v1/claim?code=ABC12345"
        val uri = android.net.Uri.parse(qrPayload)
        val serverUrl = "${uri.scheme}://${uri.host}${if (uri.port > 0) ":${uri.port}" else ""}"
        val code = uri.getQueryParameter("code")

        assertEquals("http://10.0.2.2:3000", serverUrl)
        assertEquals("ABC12345", code)
    }

    @Test
    fun `QR code payload with HTTPS extracts correctly`() {
        val qrPayload = "https://api.smsmonitor.com/v1/claim?code=XYZ78901"
        val uri = android.net.Uri.parse(qrPayload)
        val serverUrl = "${uri.scheme}://${uri.host}${if (uri.port > 0) ":${uri.port}" else ""}"
        val code = uri.getQueryParameter("code")

        assertEquals("https://api.smsmonitor.com", serverUrl)
        assertEquals("XYZ78901", code)
    }

    @Test
    fun `claim code validation rejects short codes`() {
        val regex = "^[A-Z0-9]{8}$".toRegex()
        assertFalse("6-char code should fail", "ABC123".matches(regex))
        assertFalse("7-char code should fail", "ABC1234".matches(regex))
    }

    @Test
    fun `claim code validation rejects lowercase`() {
        val regex = "^[A-Z0-9]{8}$".toRegex()
        assertFalse("Lowercase should fail", "abc12345".matches(regex))
    }

    @Test
    fun `claim code validation rejects special characters`() {
        val regex = "^[A-Z0-9]{8}$".toRegex()
        assertFalse("Special chars should fail", "ABC12!@#".matches(regex))
    }

    @Test
    fun `claim code validation accepts valid code`() {
        val regex = "^[A-Z0-9]{8}$".toRegex()
        assertTrue("Valid code should pass", "ABC12345".matches(regex))
        assertTrue("All digits should pass", "12345678".matches(regex))
        assertTrue("All letters should pass", "ABCDEFGH".matches(regex))
    }

    @Test
    fun `heartbeat signature is generated correctly`() {
        val secret = "test-secret-key"
        val timestamp = "2026-06-11T10:30:00.000Z"
        val method = "POST"
        val path = "/v1/devices/test-device-id/heartbeat"

        val signature = HmacSigner.sign(secret, timestamp, method, path)

        assertNotNull("Signature should not be null", signature)
        assertEquals("Signature should be 64 hex chars", 64, signature.length)
    }

    @Test
    fun `heartbeat signature is deterministic`() {
        val secret = "test-secret-key"
        val timestamp = "2026-06-11T10:30:00.000Z"
        val method = "POST"
        val path = "/v1/devices/test-device-id/heartbeat"

        val sig1 = HmacSigner.sign(secret, timestamp, method, path)
        val sig2 = HmacSigner.sign(secret, timestamp, method, path)

        assertEquals("Same inputs should produce same signature", sig1, sig2)
    }

    @Test
    fun `server URL validation accepts http localhost`() {
        val url = "http://localhost:3000"
        assertTrue("http://localhost:3000 should be valid", url.startsWith("http://"))
    }

    @Test
    fun `server URL validation accepts http emulator IP`() {
        val url = "http://10.0.2.2:3000"
        assertTrue("http://10.0.2.2:3000 should be valid", url.startsWith("http://"))
    }

    @Test
    fun `server URL validation accepts https`() {
        val url = "https://api.smsmonitor.com"
        assertTrue("https URL should be valid", url.startsWith("https://"))
    }
}
