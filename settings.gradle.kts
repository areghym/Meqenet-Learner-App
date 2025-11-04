// settings.gradle.kts - Project level configuration
pluginManagement {
    repositories {
        google { allowInsecureProtocol = true }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google { allowInsecureProtocol = true }
        mavenCentral()
    }
}

// Defines the root project and includes the 'app' module
rootProject.name = "MeqenetLearner"
include(":app")
