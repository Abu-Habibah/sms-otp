package com.smsmonitor.domain.model

data class Keyword(
    val id: Int = 0,
    val word: String,
    val matchMode: MatchMode,
    val enabled: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

enum class MatchMode {
    EXACT,
    CONTAINS,
    REGEX,
    AT_START,
    AT_END
}
