plugins {
    id("com.android.application") version "9.2.1" apply false
    id("com.google.devtools.ksp") version "2.3.9" apply false
    id("com.google.dagger.hilt.android") version "2.59.2" apply false
    id("org.jetbrains.kotlin.plugin.parcelize") version "2.3.10" apply false
}

allprojects {
    // Redirect build directory to a path outside of OneDrive to avoid "The cloud operation was unsuccessful" errors
    layout.buildDirectory.set(file("E:/BuildTemp/SmsMonitor/${project.path.replace(":", "_").ifEmpty { "root" }}"))
}
