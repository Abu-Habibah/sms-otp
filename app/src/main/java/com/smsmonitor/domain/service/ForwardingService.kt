package com.smsmonitor.domain.service

import android.content.Context
import android.util.Log
import com.smsmonitor.app.worker.SmsForwardWorker
import com.smsmonitor.data.repository.ForwardingRepository
import com.smsmonitor.domain.model.ForwardingLog
import com.smsmonitor.domain.model.ForwardingStatus
import com.smsmonitor.domain.model.PendingForward
import com.smsmonitor.domain.model.SmsMessage
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Persists the matched SMS to the pending queue and the logs table, then hands
 * delivery to [SmsForwardWorker] via WorkManager. WorkManager is the **single**
 * delivery path — there is no direct HTTP send here, to avoid duplicate
 * log rows (one PENDING from this method, one SUCCESS from the worker) for
 * the same SMS.
 */
@Singleton
class ForwardingService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val forwardingRepository: ForwardingRepository
) : SmsForwarder {

    private val TAG = "SmsMonitor"

    override suspend fun forward(sms: SmsMessage, matchedKeyword: String): Result<Unit> {
        Log.d(TAG, "[ForwardingService] forward() CALLED for SMS ${sms.id.take(8)} keyword=$matchedKeyword")

        // Idempotency: if a pending row already exists for this SMS, the worker
        // (or a previous run) is already on the case. Do not enqueue again.
        val existingPending = forwardingRepository.getPendingBySmsId(sms.id)
        if (existingPending != null) {
            Log.d(TAG, "[ForwardingService] Pending row already exists for SMS ${sms.id.take(8)} — skipping enqueue")
            return Result.success(Unit)
        }

        val pendingForward = PendingForward(
            smsId = sms.id,
            sender = sms.sender,
            message = sms.body,
            matchedKeyword = matchedKeyword
        )
        forwardingRepository.insertPending(pendingForward)

        // Insert a single PENDING log row. The worker will UPDATE this row's
        // status when delivery completes (instead of inserting a new row),
        // so the log table ends up with exactly one row per SMS.
        val log = ForwardingLog(
            smsId = sms.id,
            sender = sms.sender,
            message = sms.body,
            matchedKeyword = matchedKeyword,
            status = ForwardingStatus.PENDING
        )
        forwardingRepository.insertLog(log)

        SmsForwardWorker.enqueue(context)
        return Result.success(Unit)
    }
}

