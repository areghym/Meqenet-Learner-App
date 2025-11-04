// app/build.gradle.kts - Module level configuration
plugins {
    // Standard Android application plugin
    id("com.android.application")

    // Kotlin Android plugin
    kotlin("android")
}

android {
    // The target SDK version for the app (currently 34 is standard)
    compileSdk = 34

    defaultConfig {
        // Application ID (must match the package name in MainActivity.kt)
        applicationId = "com.arselam.meqenetlearner"
        minSdk = 24 // Minimum API level to run the app (supports wide range of devices)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    // Standard build types (debug and release)
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    // Use Java 17 compatibility for modern Kotlin features
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Set up Kotlin options
    kotlinOptions {
        jvmTarget = "17"
    }

    // Configure the resource directory (important for locating res/layout/activity_main.xml)
    sourceSets.getByName("main").res.srcDirs("src/main/res")
}

// --- Dependencies ---
dependencies {
    // Kotlin standard library support
    implementation("androidx.core:core-ktx:1.13.1")

    // AppCompat and UI libraries (required for the Activity and the WebView)
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")

    // Constraint Layout (often used by default, good to keep)
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // Testing dependencies (standard boilerplate)
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
