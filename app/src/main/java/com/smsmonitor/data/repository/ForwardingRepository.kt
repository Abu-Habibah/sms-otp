package com.smsmonitor.data.repository

import com.smsmonitor.data.local.dao.ForwardingLogDao
import com.smsmonitor.data.local.dao.PendingForwardDao
import com.smsmonitor.data.local.entity.ForwardingLogEntity
import com.smsmonitor.data.local.entity.PendingForwardEntity
import com.smsmonitor.domain.model.ForwardingLog
import com.smsmonitor.domain.model.ForwardingStatus
import com.smsmonitor.domain.model.PendingForward
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ForwardingRepository @Inject constructor(
    private val forwardingLogDao: ForwardingLogDao,
    private val pendingForwardDao: PendingForwardDao
) {

    fun getAllLogs(): Flow<List<ForwardingLog>> {
        return forwardingLogDao.getAllLogs().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    fun getLogsByStatus(status: ForwardingStatus): Flow<List<ForwardingLog>> {
        return forwardingLogDao.getLogsByStatus(status.name).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    suspend fun getLogById(id: Int): ForwardingLog? {
        return forwardingLogDao.getLogById(id)?.toDomain()
    }

    suspend fun getLogBySmsId(smsId: String): ForwardingLog? {
        return forwardingLogDao.getLogBySmsId(smsId)?.toDomain()
    }

    suspend fun insertLog(log: ForwardingLog): Long {
        return forwardingLogDao.insert(log.toEntity())
    }

    suspend fun updateLog(log: ForwardingLog) {
        forwardingLogDao.update(log.toEntity())
    }

    /**
     * Insert the log if no row exists for [ForwardingLog.smsId]; otherwise
     * update the existing row. Guarantees one log row per SMS — the
     * SmsForwardWorker uses this to flip a PENDING row to SUCCESS/FAILED
     * without leaving a duplicate.
     */
    suspend fun upsertLog(log: ForwardingLog) {
        val existing = forwardingLogDao.getLogBySmsId(log.smsId)
        if (existing != null) {
            forwardingLogDao.update(log.copy(id = existing.id).toEntity())
        } else {
            forwardingLogDao.insert(log.toEntity())
        }
    }

    suspend fun deleteLogById(id: Int) {
        forwardingLogDao.deleteById(id)
    }

    suspend fun pruneOldLogs(keepCount: Int = 1000) {
        val count = forwardingLogDao.getLogCount()
        if (count > keepCount) {
            forwardingLogDao.pruneOldLogs(count - keepCount)
        }
    }

    suspend fun getAllPending(): List<PendingForward> {
        return pendingForwardDao.getAllPending().map { it.toDomain() }
    }

    suspend fun getPendingById(id: Int): PendingForward? {
        return pendingForwardDao.getPendingById(id)?.toDomain()
    }

    suspend fun getPendingBySmsId(smsId: String): PendingForward? {
        return pendingForwardDao.getPendingBySmsId(smsId)?.toDomain()
    }

    suspend fun insertPending(pending: PendingForward): Long {
        return pendingForwardDao.insert(pending.toEntity())
    }

    suspend fun updatePending(pending: PendingForward) {
        pendingForwardDao.update(pending.toEntity())
    }

    suspend fun deletePendingById(id: Int) {
        pendingForwardDao.deleteById(id)
    }

    suspend fun deletePendingBySmsId(smsId: String) {
        pendingForwardDao.deleteBySmsId(smsId)
    }

    private fun ForwardingLogEntity.toDomain(): ForwardingLog {
        return ForwardingLog(
            id = id,
            smsId = smsId,
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            status = ForwardingStatus.valueOf(status),
            retryCount = retryCount,
            timestamp = timestamp,
            lastAttempt = lastAttempt,
            errorMessage = errorMessage
        )
    }

    private fun ForwardingLog.toEntity(): ForwardingLogEntity {
        return ForwardingLogEntity(
            id = id,
            smsId = smsId,
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            status = status.name,
            retryCount = retryCount,
            timestamp = timestamp,
            lastAttempt = lastAttempt,
            errorMessage = errorMessage
        )
    }

    private fun PendingForwardEntity.toDomain(): PendingForward {
        return PendingForward(
            id = id,
            smsId = smsId,
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            retryCount = retryCount,
            createdAt = createdAt,
            lastAttempt = lastAttempt
        )
    }

    private fun PendingForward.toEntity(): PendingForwardEntity {
        return PendingForwardEntity(
            id = id,
            smsId = smsId,
            sender = sender,
            message = message,
            matchedKeyword = matchedKeyword,
            retryCount = retryCount,
            createdAt = createdAt,
            lastAttempt = lastAttempt
        )
    }
}
