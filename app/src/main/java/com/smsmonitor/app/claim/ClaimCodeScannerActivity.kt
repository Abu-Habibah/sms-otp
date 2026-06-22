package com.smsmonitor.app.claim

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.util.Size
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.MultiFormatReader
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.smsmonitor.BuildConfig
import com.smsmonitor.R
import com.smsmonitor.data.repository.ClaimResult
import com.smsmonitor.data.repository.ClaimService
import com.smsmonitor.data.repository.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@AndroidEntryPoint
class ClaimCodeScannerActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "ClaimCodeScanner"
        private const val CLAIM_CODE_REGEX = "^[A-Z0-9]{8}$"
        private const val QR_CODE_REGEX = "^(https?://[^/]+)?/v1/claim\\?code=[A-Z0-9]{8}(&workspaceId=[^&]+)?$"

        fun start(context: Context) {
            context.startActivity(Intent(context, ClaimCodeScannerActivity::class.java))
        }
    }

    @Inject lateinit var claimService: ClaimService
    @Inject lateinit var settingsRepository: SettingsRepository
    @Inject lateinit var keywordSyncService: com.smsmonitor.data.repository.KeywordSyncService
    @Inject lateinit var deviceInfoCollector: com.smsmonitor.util.DeviceInfoCollector

    private lateinit var cameraPreview: PreviewView
    private var isProcessing = false
    private var lastProcessedCode: String? = null

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) startCamera() else {
            Toast.makeText(this, "Camera permission is required", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_claim_scanner)
        cameraPreview = findViewById(R.id.cameraPreview)
        setupViews()
        checkCameraPermission()
    }

    private fun setupViews() {
        findViewById<TextView>(R.id.titleText).text = "Scan Claim Code"
        findViewById<TextView>(R.id.instructionText).text = "Point camera at QR code from web admin"
        findViewById<TextView>(R.id.versionText).text = "v${BuildConfig.VERSION_NAME} (Build: ${BuildConfig.VERSION_CODE})"

        findViewById<MaterialButton>(R.id.manualEntryButton).setOnClickListener {
            ManualCodeEntryActivity.start(this)
            finish()
        }
        findViewById<MaterialButton>(R.id.skipButton).setOnClickListener {
            val intent = Intent(this, com.smsmonitor.app.MainActivity::class.java)
            intent.putExtra("skip_onboarding", true)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }

    private fun checkCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED -> startCamera()
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                Toast.makeText(this, "Camera permission is needed", Toast.LENGTH_LONG).show()
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
            else -> cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        val analysisExecutor = java.util.concurrent.Executors.newSingleThreadExecutor()

        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(cameraPreview.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setTargetResolution(Size(640, 480))
                    .build()

                val multiFormatReader = MultiFormatReader().apply {
                    setHints(
                        mapOf(
                            DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE),
                            DecodeHintType.TRY_HARDER to true
                        )
                    )
                }

                imageAnalysis.setAnalyzer(analysisExecutor) { imageProxy ->
                    try {
                        val plane = imageProxy.planes[0]
                        val buffer = plane.buffer
                        val data = ByteArray(buffer.remaining())
                        buffer.get(data)

                        val source = PlanarYUVLuminanceSource(
                            data,
                            plane.rowStride,
                            imageProxy.height,
                            0, 0,
                            imageProxy.width,
                            imageProxy.height,
                            false
                        )

                        val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
                        val result = multiFormatReader.decode(binaryBitmap)

                        Log.d(TAG, "QR scanned: ${result.text}")
                        if (isValidClaimCode(result.text)) {
                            runOnUiThread {
                                processClaimCode(result.text)
                            }
                        }
                    } catch (e: com.google.zxing.NotFoundException) {
                        // This is expected when no QR code is in frame
                    } catch (e: Exception) {
                        Log.e(TAG, "Error during image analysis", e)
                    } finally {
                        imageProxy.close()
                    }
                }

                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
            } catch (e: Exception) {
                Log.e(TAG, "Camera error: ${e.message}", e)
                Toast.makeText(this, "Failed to start camera", Toast.LENGTH_SHORT).show()
                finish()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun isValidClaimCode(code: String): Boolean = code.matches(CLAIM_CODE_REGEX.toRegex()) || code.matches(QR_CODE_REGEX.toRegex())

    private fun processClaimCode(rawValue: String) {
        if (rawValue == lastProcessedCode || isProcessing) return
        isProcessing = true
        lastProcessedCode = rawValue

        val (serverUrl, claimCode, workspaceId) = when {
            rawValue.matches(QR_CODE_REGEX.toRegex()) -> {
                val uri = Uri.parse(rawValue)
                Triple("${uri.scheme}://${uri.host}${if (uri.port > 0) ":${uri.port}" else ""}", uri.getQueryParameter("code") ?: "", uri.getQueryParameter("workspaceId"))
            }
            rawValue.matches(CLAIM_CODE_REGEX.toRegex()) -> Triple(settingsRepository.backendUrl, rawValue, null)
            else -> { Toast.makeText(this, "Invalid QR code", Toast.LENGTH_SHORT).show(); return }
        }

        if (serverUrl.isNotBlank()) settingsRepository.backendUrl = serverUrl
        workspaceId?.let { settingsRepository.workspaceId = it }

        val effectiveUrl = serverUrl.ifBlank { settingsRepository.backendUrl }
        if (effectiveUrl.isBlank()) {
            Toast.makeText(this, "Server URL is required. Configure in Settings first.", Toast.LENGTH_LONG).show()
            isProcessing = false
            return
        }

        Toast.makeText(this, "Claim: $claimCode", Toast.LENGTH_SHORT).show()

        lifecycleScope.launch(Dispatchers.IO) {
            val result = claimService.claimDevice(claimCode, workspaceId, deviceInfoCollector.collectDeviceInfoWithSim())
            withContext(Dispatchers.Main) {
                when (result) {
                    is ClaimResult.Success -> {
                        Toast.makeText(this@ClaimCodeScannerActivity, "Claimed!", Toast.LENGTH_LONG).show()
                        com.smsmonitor.app.service.HeartbeatService.start(this@ClaimCodeScannerActivity)
                        lifecycleScope.launch { keywordSyncService.syncKeywords() }
                        startActivity(Intent(this@ClaimCodeScannerActivity, com.smsmonitor.app.MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK })
                        finish()
                    }
                    is ClaimResult.Error -> {
                        val toast = Toast.makeText(this@ClaimCodeScannerActivity, "Claim failed: ${result.message}", Toast.LENGTH_LONG)
                        val view = layoutInflater.inflate(R.layout.toast_error, null)
                        view.findViewById<TextView>(R.id.error_message).text = "Claim failed: ${result.message}"
                        toast.view = view
                        toast.show()
                        lastProcessedCode = rawValue
                        isProcessing = false
                    }
                }
            }
        }
    }

    override fun onPause() { super.onPause(); isProcessing = true }
    override fun onResume() { super.onResume(); isProcessing = false }
}
