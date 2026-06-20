import java.util.Properties

plugins {
    id("com.android.application")
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.plugin.parcelize")
}

// Read build counter from local.properties (or default to 1 for v2.0)
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
val buildCounter: Int = (localProps.getProperty("build.counter") ?: "1").toInt()
val versionNameString: String = "2.0"

android {
    namespace = "com.smsmonitor"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.smsmonitor"
        minSdk = 26
        targetSdk = 34
        versionCode = buildCounter
        versionName = versionNameString

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("boolean", "USE_MOCK_FORWARDER", "true")
    }

    buildTypes {
        debug {
            buildConfigField("boolean", "USE_MOCK_FORWARDER", "false")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            buildConfigField("boolean", "USE_MOCK_FORWARDER", "false")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }
}

// Auto-increment build counter after each successful build
tasks.register("incrementBuildCounter") {
    doLast {
        val f = rootProject.file("local.properties")
        val props = Properties().apply {
            if (f.exists()) f.inputStream().use { load(it) }
        }
        val current = (props.getProperty("build.counter") ?: "1").toInt()
        props.setProperty("build.counter", (current + 1).toString())
        f.outputStream().use { props.store(it, null) }
        println("Build counter incremented to ${current + 1}")
    }
}

afterEvaluate {
    tasks.named("assembleDebug").configure { finalizedBy("incrementBuildCounter") }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-process:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")

    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")

    implementation("com.google.dagger:hilt-android:2.59.2")
    ksp("com.google.dagger:hilt-android-compiler:2.59.2")

    implementation("com.google.code.gson:gson:2.10.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("androidx.hilt:hilt-work:1.3.0")
    ksp("androidx.hilt:hilt-compiler:1.3.0")

    // EncryptedSharedPreferences for secure storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // CameraX for QR scanner
    implementation("androidx.camera:camera-core:1.3.1")
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")

    // Barcode scanning (ZXing - more compatible than ML Kit on some devices)
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.9")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
