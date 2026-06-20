package com.smsmonitor.app.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.smsmonitor.data.repository.ForwardingRepository
import com.smsmonitor.domain.model.ForwardingLog
import com.smsmonitor.domain.model.ForwardingStatus
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class SmsForwardWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted workerParams: WorkerParameters,
    private val forwardingRepository: ForwardingRepository,
    private val smsHttpSender: SmsHttpSender
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SmsMonitor"
        const val WORK_NAME = "sms_forward_work"
        const val MAX_RETRY_COUNT = 5

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = OneTimeWorkRequestBuilder<SmsForwardWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    10,
                    TimeUnit.SECONDS
                )
                .build()

            val workManager = WorkManager.getInstance(context)
            workManager.enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.KEEP,
                workRequest
            )
            Log.d(TAG, "[Worker] enqueued: $WORK_NAME (network=CONNECTED, policy=KEEP, backoff=10s)")
        }
    }

    init {
        Log.d(TAG, "[Worker] Instantiated: dependencies injected OK")
    }

    override suspend fun doWork(): Result {
        val pendingForwards = forwardingRepository.getAllPending()
        Log.d(TAG, "[Worker] doWork: found ${pendingForwards.size} pending forward(s)")
        if (pendingForwards.isEmpty()) {
            return Result.success()
        }

        var allSuccessful = true
        for (pending in pendingForwards) {
            val result = forwardMessage(pending)
            if (!result) {
                allSuccessful = false
            }
        }
        val finalResult = if (allSuccessful) Result.success() else Result.retry()
        Log.d(TAG, "[Worker] doWork: finished, allSuccessful=$allSuccessful -> $finalResult")
        return finalResult
    }

    private suspend fun forwardMessage(pending: com.smsmonitor.domain.model.PendingForward): Boolean {
        val updatedPending = pending.copy(
            retryCount = pending.retryCount + 1,
            lastAttempt = System.currentTimeMillis()
        )
        forwardingRepository.updatePending(updatedPending)
        Log.d(TAG, "[Worker] Forwarding attempt #${updatedPending.retryCount} for SMS ${pending.smsId.take(8)}")

        val success = smsHttpSender.send(
            smsId = pending.smsId,
            sender = pending.sender,
            message = pending.message,
            matchedKeyword = pending.matchedKeyword
        )

        if (success) {
            Log.d(TAG, "[Worker] ✓ Forwarded SMS ${pending.smsId.take(8)} on attempt ${updatedPending.retryCount}")
            val log = ForwardingLog(
                smsId = pending.smsId,
                sender = pending.sender,
                message = pending.message,
                matchedKeyword = pending.matchedKeyword,
                status = ForwardingStatus.SUCCESS,
                retryCount = pending.retryCount
            )
            forwardingRepository.upsertLog(log)
            forwardingRepository.deletePendingById(pending.id)
            forwardingRepository.pruneOldLogs()
            return true
        } else {
            if (pending.retryCount >= MAX_RETRY_COUNT) {
                Log.e(TAG, "[Worker] ✗ FAILED SMS ${pending.smsId.take(8)} after ${pending.retryCount} attempts")
                val log = ForwardingLog(
                    smsId = pending.smsId,
                    sender = pending.sender,
                    message = pending.message,
                    matchedKeyword = pending.matchedKeyword,
                    status = ForwardingStatus.FAILED,
                    retryCount = pending.retryCount,
                    errorMessage = "Max retry attempts exceeded"
                )
                forwardingRepository.upsertLog(log)
                forwardingRepository.deletePendingById(pending.id)
                return true
            } else {
                Log.w(TAG, "[Worker] Retry needed for SMS ${pending.smsId.take(8)} (attempt ${pending.retryCount}/$MAX_RETRY_COUNT)")
                val log = ForwardingLog(
                    smsId = pending.smsId,
                    sender = pending.sender,
                    message = pending.message,
                    matchedKeyword = pending.matchedKeyword,
                    status = ForwardingStatus.PENDING,
                    retryCount = pending.retryCount,
                    lastAttempt = System.currentTimeMillis()
                )
                forwardingRepository.upsertLog(log)
                return false
            }
        }
    }
}
