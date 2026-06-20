package com.smsmonitor.domain.service

import com.smsmonitor.data.repository.KeywordRepository
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import com.smsmonitor.domain.model.SmsMessage
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class KeywordServiceTest {

    private lateinit var keywordRepository: KeywordRepository
    private lateinit var mockForwarder: MockForwardingService
    private lateinit var keywordService: KeywordService

    @Before
    fun setup() {
        keywordRepository = mockk(relaxed = true)
        mockForwarder = MockForwardingService()
        keywordService = KeywordService(keywordRepository, mockForwarder)
    }

    @Test
    fun `EXACT match - returns keyword when message contains exact word`() = runTest {
        val keyword = Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP is 123456")
        assertNotNull(result)
        assertEquals("OTP", result?.word)
    }

    @Test
    fun `EXACT match - returns null when exact word not found`() = runTest {
        val keyword = Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your verification code is 123456")
        assertNull(result)
    }

    @Test
    fun `CONTAINS match - returns keyword when message contains word case insensitive`() = runTest {
        val keyword = Keyword(id = 1, word = "otp", matchMode = MatchMode.CONTAINS)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP code is 123456")
        assertNotNull(result)
        assertEquals("otp", result?.word)
    }

    @Test
    fun `CONTAINS match - is case insensitive`() = runTest {
        val keyword = Keyword(id = 1, word = "otp", matchMode = MatchMode.CONTAINS)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP CODE is 123456")
        assertNotNull(result)
    }

    @Test
    fun `CONTAINS match - returns null when word not present`() = runTest {
        val keyword = Keyword(id = 1, word = "otp", matchMode = MatchMode.CONTAINS)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your verification code is 123456")
        assertNull(result)
    }

    @Test
    fun `REGEX match - returns keyword when message matches pattern`() = runTest {
        val keyword = Keyword(id = 1, word = "\\d{6}", matchMode = MatchMode.REGEX)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP is 123456")
        assertNotNull(result)
        assertEquals("\\d{6}", result?.word)
    }

    @Test
    fun `REGEX match - returns null when pattern does not match`() = runTest {
        val keyword = Keyword(id = 1, word = "\\d{6}", matchMode = MatchMode.REGEX)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP is abc123")
        assertNull(result)
    }

    @Test
    fun `REGEX match - invalid regex returns false`() = runTest {
        val keyword = Keyword(id = 1, word = "[invalid", matchMode = MatchMode.REGEX)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val result = keywordService.findMatch("Your OTP is 123456")
        assertNull(result)
    }

    @Test
    fun `process - forwards SMS when keyword matches`() = runTest {
        val keyword = Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))
        coEvery { keywordRepository.getKeywordCount() } returns 0
        coEvery { keywordRepository.getKeywordByWord("OTP") } returns null

        keywordService.loadKeywords()

        val sms = SmsMessage(id = "1", sender = "+1234567890", body = "Your OTP is 123456", timestamp = System.currentTimeMillis())
        val result = keywordService.process(sms)

        assertNotNull(result)
        assertEquals("OTP", result?.word)
        assertEquals(1, mockForwarder.forwardingLogs.value.size)
    }

    @Test
    fun `process - does not forward when no keyword matches`() = runTest {
        val keyword = Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(keyword))

        keywordService.loadKeywords()

        val sms = SmsMessage(id = "1", sender = "+1234567890", body = "Your verification code is 123456", timestamp = System.currentTimeMillis())
        val result = keywordService.process(sms)

        assertNull(result)
        assertEquals(0, mockForwarder.forwardingLogs.value.size)
    }

    @Test
    fun `disabled keywords are not used for matching`() = runTest {
        val enabledKeyword = Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT, enabled = true)
        val disabledKeyword = Keyword(id = 2, word = "CODE", matchMode = MatchMode.EXACT, enabled = false)
        every { keywordRepository.getAllKeywords() } returns flowOf(listOf(enabledKeyword, disabledKeyword))

        keywordService.loadKeywords()

        val resultEnabled = keywordService.findMatch("Your OTP is 123456")
        assertNotNull(resultEnabled)

        val resultDisabled = keywordService.findMatch("Your CODE is 123456")
        assertNull(resultDisabled)
    }

    @Test
    fun `validateKeyword - returns true for valid length`() {
        assertTrue(keywordService.validateKeyword("OTP"))
        assertTrue(keywordService.validateKeyword("12345678"))
    }

    @Test
    fun `validateKeyword - returns false for too short`() {
        assertFalse(keywordService.validateKeyword("A"))
    }

    @Test
    fun `validateKeyword - returns false for too long`() {
        assertFalse(keywordService.validateKeyword("A".repeat(51)))
    }

    @Test
    fun `addKeyword - returns failure for invalid length`() = runTest {
        coEvery { keywordRepository.getKeywordCount() } returns 0

        val result = keywordService.addKeyword("A", MatchMode.EXACT)
        assertTrue(result.isFailure)
    }

    @Test
    fun `addKeyword - returns failure when keyword already exists`() = runTest {
        coEvery { keywordRepository.getKeywordCount() } returns 0
        coEvery { keywordRepository.getKeywordByWord("OTP") } returns Keyword(id = 1, word = "OTP", matchMode = MatchMode.EXACT)

        val result = keywordService.addKeyword("OTP", MatchMode.EXACT)
        assertTrue(result.isFailure)
    }

    @Test
    fun `addKeyword - returns success for valid new keyword`() = runTest {
        coEvery { keywordRepository.getKeywordCount() } returns 0
        coEvery { keywordRepository.getKeywordByWord("OTP") } returns null
        coEvery { keywordRepository.insert(any()) } returns 1L

        val result = keywordService.addKeyword("OTP", MatchMode.EXACT)
        assertTrue(result.isSuccess)
        assertEquals("OTP", result.getOrNull()?.word)
    }

    @Test
    fun `addKeyword - returns failure when maximum keywords reached`() = runTest {
        coEvery { keywordRepository.getKeywordCount() } returns 100

        val result = keywordService.addKeyword("OTP", MatchMode.EXACT)
        assertTrue(result.isFailure)
    }
}