package com.arselam.meqenetlearner // CRITICAL: CHANGE THIS TO YOUR PROJECT'S PACKAGE NAME

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Set the layout defined in activity_main.xml
        // This is where the WebView component lives.
        setContentView(R.layout.activity_main) 

        // 2. Find the WebView element by its ID
        val webView: WebView = findViewById(R.id.webView)
        val webSettings: WebSettings = webView.settings
        
        // 3. CRITICAL: Enable JavaScript for the React application to run
        webSettings.javaScriptEnabled = true 
        
        // 4. Important for performance and modern web features
        webSettings.domStorageEnabled = true 
        webSettings.databaseEnabled = true 
        
        // 5. Load the local HTML file from the 'assets' folder
        // The path must use 'file:///android_asset/'
        webView.loadUrl("file:///android_asset/MeqenetLearnerApp.html") 
        
        // 6. Ensures all internal links/navigation stay inside the WebView, not opening in an external browser
        webView.webViewClient = WebViewClient()
        
        // 7. Allows debugging of the WebView content using Chrome DevTools when the device is plugged in
        WebView.setWebContentsDebuggingEnabled(true)
    }
}
