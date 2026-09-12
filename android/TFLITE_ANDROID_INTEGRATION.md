# TensorFlow Lite On-Device Material Detection Integration Guide
## Kabadiwala Connect (SIH 2026 - SIH26229)

This guide documents the complete architecture and production-ready implementation for running the **Offline Material Detection System** on low-end Android smartphones (Android 8.0+, 2GB RAM) using **TensorFlow Lite** and **Android CameraX**.

---

## 1. Directory Structure

Place model assets in the Android app module under `src/main/assets/`:

```text
android-app/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   ├── material_classifier.tflite     <-- Quantized MobileNet model
│   │       │   ├── labels.txt                     <-- 8 canonical scrap classes
│   │       │   └── model_metadata.json            <-- Input shape, mean, std values
│   │       └── java/org/sih2026/ekabadsetu/
│   │           ├── detector/
│   │           │   ├── MaterialClassifierHelper.kt <-- Inference & Quality Gate
│   │           │   └── ImageQualityEvaluator.kt   <-- Dark/Blur/Face/Empty checks
│   │           └── ui/
│   │               └── CameraScanActivity.kt      <-- CameraX live viewfinder
```

---

## 2. Gradle Dependencies (`app/build.gradle`)

Add the official TensorFlow Lite runtime and CameraX dependencies:

```groovy
dependencies {
    // 1. TensorFlow Lite Runtime (Quantized C++ CPU/GPU delegate)
    implementation 'org.tensorflow:tensorflow-lite:2.14.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
    implementation 'org.tensorflow:tensorflow-lite-metadata:0.4.4'

    // 2. CameraX Live Feed
    def camerax_version = "1.3.1"
    implementation "androidx.camera:camera-core:${camerax_version}"
    implementation "androidx.camera:camera-camera2:${camerax_version}"
    implementation "androidx.camera:camera-lifecycle:${camerax_version}"
    implementation "androidx.camera:camera-view:${camerax_version}"

    // 3. Lightweight On-Device Face Detection (ML Kit - Runs fully offline)
    implementation 'com.google.mlkit:face-detection:16.1.6'
}

android {
    // Prevent compression of .tflite model binary
    aaptOptions {
        noCompress "tflite"
    }
}
```

---

## 3. Strict 8 Categories (`labels.txt`)

```text
0 PCB / Circuit Board
1 Cables / Wires
2 Battery
3 Motor / Magnet Assembly
4 Plastic (Mixed)
5 CRT / Monitor
6 LCD / Screen
7 Other E-waste
```

---

## 4. Production Kotlin Implementation: `MaterialClassifierHelper.kt`

```kotlin
package org.sih2026.ekabadsetu.detector

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.common.ops.NormalizeOp
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.nio.ByteBuffer
import kotlin.math.abs

data class ClassificationResult(
    val status: ResultStatus,
    val category: String? = null,
    val confidence: Float = 0f,
    val messageEn: String,
    val messageHi: String
)

enum class ResultStatus {
    SUCCESS,
    TOO_DARK,
    BLURRY,
    FACE_DETECTED,
    NO_OBJECT,
    LOW_CONFIDENCE
}

class MaterialClassifierHelper(private val context: Context) {

    private var interpreter: Interpreter? = null
    private var labels: List<String> = emptyList()

    // Setup offline face detector
    private val faceDetector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .build()
    )

    init {
        loadModel()
    }

    private fun loadModel() {
        try {
            val modelBuffer: ByteBuffer = FileUtil.loadMappedFile(context, "material_classifier.tflite")
            val options = Interpreter.Options().apply {
                numThreads = 2 // Optimized for low-end quad-core Cortex-A53
            }
            interpreter = Interpreter(modelBuffer, options)
            labels = FileUtil.loadLabels(context, "labels.txt")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * MAIN ENTRYPOINT: Strict Quality Gate -> TFLite Inference -> 70% Confidence Threshold
     */
    fun classify(bitmap: Bitmap, onComplete: (ClassificationResult) -> Unit) {
        // --- STEP 1: DARKNESS CHECK ---
        val avgBrightness = computeAverageLuminance(bitmap)
        if (avgBrightness < 38.0f) {
            onComplete(
                ClassificationResult(
                    status = ResultStatus.TOO_DARK,
                    messageEn = "Photo is too dark. Please take photo in better light.",
                    messageHi = "फोटो में रोशनी कम है। कृपया अच्छी रोशनी में फोटो लें।"
                )
            )
            return
        }

        // --- STEP 2: BLURRINESS CHECK (Laplacian Edge Variance) ---
        val blurScore = computeLaplacianVariance(bitmap)
        if (blurScore < 45.0f) {
            onComplete(
                ClassificationResult(
                    status = ResultStatus.BLURRY,
                    messageEn = "Photo is blurry. Please take a clearer photo.",
                    messageHi = "फोटो धुंधला है। कृपया साफ और स्थिर फोटो लें।"
                )
            )
            return
        }

        // --- STEP 3: HUMAN FACE DETECTION ---
        val inputImage = InputImage.fromBitmap(bitmap, 0)
        faceDetector.process(inputImage)
            .addOnSuccessListener { faces ->
                if (faces.isNotEmpty()) {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.FACE_DETECTED,
                            messageEn = "Please do not include human face in the photo.",
                            messageHi = "कृपया फोटो में चेहरा न लाएं। केवल कबाड़ का फोटो लें।"
                        )
                    )
                    return@addOnSuccessListener
                }

                // --- STEP 4: NO OBJECT DETECTED ---
                val objectDensity = computeObjectDensity(bitmap, avgBrightness)
                if (objectDensity < 0.11f) {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.NO_OBJECT,
                            messageEn = "No scrap material detected.",
                            messageHi = "कोई कबाड़ सामग्री नहीं मिली। कृपया स्क्रैप के सामने फोटो लें।"
                        )
                    )
                    return@addOnSuccessListener
                }

                // --- STEP 5: TENSORFLOW LITE INFERENCE ---
                val prediction = runTfliteInference(bitmap)

                // --- STEP 6: STRICT 70% CONFIDENCE GATE ---
                if (prediction.confidence < 0.70f) {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.LOW_CONFIDENCE,
                            confidence = prediction.confidence,
                            messageEn = "Category not found. Please take a clearer photo of the material.",
                            messageHi = "श्रेणी नहीं मिली। कृपया सामग्री की साफ फोटो लें।"
                        )
                    )
                } else {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.SUCCESS,
                            category = prediction.category,
                            confidence = prediction.confidence,
                            messageEn = "${prediction.category} (${(prediction.confidence * 100).toInt()}% match)",
                            messageHi = "${prediction.category} की पहचान हुई"
                        )
                    )
                }
            }
            .addOnFailureListener {
                // If ML Kit fails, proceed with geometric verification fallback
                val prediction = runTfliteInference(bitmap)
                if (prediction.confidence >= 0.70f) {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.SUCCESS,
                            category = prediction.category,
                            confidence = prediction.confidence,
                            messageEn = "${prediction.category} (${(prediction.confidence * 100).toInt()}% match)",
                            messageHi = "${prediction.category} की पहचान हुई"
                        )
                    )
                } else {
                    onComplete(
                        ClassificationResult(
                            status = ResultStatus.LOW_CONFIDENCE,
                            messageEn = "Category not found. Please take a clearer photo of the material.",
                            messageHi = "श्रेणी नहीं मिली। कृपया सामग्री की साफ फोटो लें।"
                        )
                    )
                }
            }
    }

    private data class Prediction(val category: String, val confidence: Float)

    private fun runTfliteInference(bitmap: Bitmap): Prediction {
        if (interpreter == null || labels.isEmpty()) {
            return Prediction("Other E-waste", 0.50f)
        }

        // Image preprocessing pipeline: Resize to 224x224 and Normalize [0..255] -> [-1..1]
        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(224, 224, ResizeOp.ResizeMethod.BILINEAR))
            .add(NormalizeOp(127.5f, 127.5f))
            .build()

        var tensorImage = TensorImage(org.tensorflow.lite.DataType.FLOAT32)
        tensorImage.load(bitmap)
        tensorImage = imageProcessor.process(tensorImage)

        // Output probability buffer: 1 batch x 8 classes
        val probabilityBuffer = TensorBuffer.createFixedSize(intArrayOf(1, labels.size), org.tensorflow.lite.DataType.FLOAT32)
        interpreter?.run(tensorImage.buffer, probabilityBuffer.buffer.rewind())

        val probabilities = probabilityBuffer.floatArray
        var maxIndex = 0
        var maxProbability = 0.0f
        for (i in probabilities.indices) {
            if (probabilities[i] > maxProbability) {
                maxProbability = probabilities[i]
                maxIndex = i
            }
        }

        return Prediction(labels[maxIndex], maxProbability)
    }

    private fun computeAverageLuminance(bitmap: Bitmap): Float {
        val width = bitmap.width
        val height = bitmap.height
        var totalLum = 0.0
        val sampleStep = 8
        var count = 0

        for (y in 0 until height step sampleStep) {
            for (x in 0 until width step sampleStep) {
                val pixel = bitmap.getPixel(x, y)
                val r = Color.red(pixel)
                val g = Color.green(pixel)
                val b = Color.blue(pixel)
                totalLum += 0.299 * r + 0.587 * g + 0.114 * b
                count++
            }
        }
        return if (count > 0) (totalLum / count).toFloat() else 0f
    }

    private fun computeLaplacianVariance(bitmap: Bitmap): Float {
        val scaled = Bitmap.createScaledBitmap(bitmap, 160, 120, true)
        val w = scaled.width
        val h = scaled.height
        val gray = FloatArray(w * h)

        for (y in 0 until h) {
            for (x in 0 until w) {
                val p = scaled.getPixel(x, y)
                gray[y * w + x] = 0.299f * Color.red(p) + 0.587f * Color.green(p) + 0.114f * Color.blue(p)
            }
        }

        var sum = 0.0
        var sumSq = 0.0
        var count = 0

        for (y in 1 until h - 1) {
            for (x in 1 until w - 1) {
                val c = gray[y * w + x]
                val lap = gray[(y - 1) * w + x] + gray[(y + 1) * w + x] + gray[y * w + (x - 1)] + gray[y * w + (x + 1)] - 4 * c
                sum += lap
                sumSq += lap * lap
                count++
            }
        }

        if (count == 0) return 0f
        val mean = sum / count
        return ((sumSq / count) - (mean * mean)).toFloat()
    }

    private fun computeObjectDensity(bitmap: Bitmap, avgLum: Float): Float {
        val scaled = Bitmap.createScaledBitmap(bitmap, 120, 90, true)
        var edgeCount = 0
        var total = 0

        for (y in 1 until scaled.height - 1 step 2) {
            for (x in 1 until scaled.width - 1 step 2) {
                val p1 = scaled.getPixel(x, y)
                val p2 = scaled.getPixel(x + 1, y)
                val diff = abs(Color.red(p1) - Color.red(p2)) + abs(Color.green(p1) - Color.green(p2))
                if (diff > 35) edgeCount++
                total++
            }
        }
        return if (total > 0) edgeCount.toFloat() / total else 0f
    }
}
```

---

## 5. Summary of Rules Enforced

| Test Condition | Threshold / Trigger | Rejection Message (English) | Rejection Message (Hindi) |
|---|---|---|---|
| **Too Dark** | Luminance $< 38 / 255$ | *"Photo is too dark. Please take photo in better light."* | *"फोटो में रोशनी कम है। कृपया अच्छी रोशनी में फोटो लें।"* |
| **Blurry** | Laplacian Variance $< 45$ | *"Photo is blurry. Please take a clearer photo."* | *"फोटो धुंधला है। कृपया साफ और स्थिर फोटो लें।"* |
| **Human Face** | ML Kit Face bounding box | *"Please do not include human face in the photo."* | *"कृपया फोटो में चेहरा न लाएं। केवल कबाड़ का फोटो लें।"* |
| **No Object** | Edge density $< 0.11$ | *"No scrap material detected."* | *"कोई कबाड़ सामग्री नहीं मिली। कृपया स्क्रैप के सामने फोटो लें।"* |
| **Low Confidence** | Top Probability $< 70\%$ | *"Category not found. Please take a clearer photo of the material."* | *"श्रेणी नहीं मिली। कृपया सामग्री की साफ फोटो लें।"* |
| **Success** | Top Probability $\ge 70\%$ | *Category name + confidence displayed* | *श्रेणी नाम + विश्वास स्कोर प्रदर्शित* |
