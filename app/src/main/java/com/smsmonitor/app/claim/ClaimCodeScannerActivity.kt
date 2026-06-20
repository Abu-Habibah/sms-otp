package com.smsmonitor.app.claim

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.zxing.BarcodeFormat
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.RGBLuminanceSource
import com.google.zxing.common.HybridBinarizer
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
        findViewById<android.widget.TextView>(R.id.titleText).text = "Scan Claim Code"
        findViewById<android.widget.TextView>(R.id.instructionText).text = "Point camera at QR code from web admin"
        findViewById<android.widget.TextView>(R.id.versionText).text = "v${com.smsmonitor.BuildConfig.VERSION_NAME} (Build: ${com.smsmonitor.BuildConfig.VERSION_CODE})"

        findViewById<com.google.android.material.button.MaterialButton>(R.id.manualEntryButton).setOnClickListener {
            ManualCodeEntryActivity.start(this)
            finish()
        }
        findViewById<com.google.android.material.button.MaterialButton>(R.id.skipButton).setOnClickListener {
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
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(cameraPreview.surfaceProvider) }

                val imageAnalysis = androidx.camera.core.ImageAnalysis.Builder()
                    .setBackpressureStrategy(androidx.camera.core.ImageAnalysis.STRATEGY_BLOCK_PRODUCER)
                    .setTargetResolution(android.util.Size(640, 480))
                    .setOutputImageFormat(androidx.camera.core.ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                    .build()

                val multiFormatReader = MultiFormatReader().apply {
                    setHints(
                        mapOf(
                            com.google.zxing.DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE),
                            com.google.zxing.DecodeHintType.TRY_HARDER to true
                        )
                    )
                }

                imageAnalysis.setAnalyzer(ContextCompat.getMainExecutor(this)) { imageProxy ->
                    try {
                        val planes = imageProxy.planes
                        val yBuffer = planes[0].buffer
                        val uBuffer = planes[1].buffer
                        val vBuffer = planes[2].buffer

                        val ySize = yBuffer.remaining()
                        val yBytes = ByteArray(ySize)
                        yBuffer.get(yBytes)

                        val width = imageProxy.width
                        val height = imageProxy.height

                        val pixels = IntArray(width * height)
                        for (y in 0 until height) {
                            for (x in 0 until width) {
                                val yIndex = y * width + x
                                val yValue = yBytes[yIndex].toInt() and 0xFF
                                pixels[yIndex] = android.graphics.Color.rgb(yValue, yValue, yValue)
                            }
                        }

                        val source = RGBLuminanceSource(width, height, pixels)
                        val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
                        val result = multiFormatReader.decode(binaryBitmap)
                        Log.d(TAG, "QR scanned: ${result.text}")
                        if (isValidClaimCode(result.text)) processClaimCode(result.text)
                    } catch (e: Exception) {
                        Log.d(TAG, "No QR code in frame")
                    } finally {
                        imageProxy.close()
                    }
                }

                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
                Toast.makeText(this, "Camera ready", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e(TAG, "Camera error: ${e.message}", e)
                finish()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun isValidClaimCode(code: String): Boolean = code.matches(CLAIM_CODE_REGEX.toRegex()) || code.matches(QR_CODE_REGEX.toRegex())

    private fun processClaimCode(rawValue: String) {
        if (rawValue == lastProcessedCode) return
        lastProcessedCode = rawValue

        val (serverUrl, claimCode, workspaceId) = when {
            rawValue.matches(QR_CODE_REGEX.toRegex()) -> {
                val uri = android.net.Uri.parse(rawValue)
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

        CoroutineScope(Dispatchers.IO).launch {
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
                        view.findViewById<android.widget.TextView>(R.id.error_message).text = "Claim failed: ${result.message}"
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
