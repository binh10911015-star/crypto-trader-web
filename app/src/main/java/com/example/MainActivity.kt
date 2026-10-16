package com.example

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import java.io.File

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Clear window hardware acceleration flag for headless container compatibility
        window.clearFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)

        // Clean stale WebView disk cache to resolve simple_version_upgrade fake index error
        try {
            val wvCache = File(cacheDir, "WebView")
            if (wvCache.exists()) {
                wvCache.deleteRecursively()
            }
        } catch (_: Exception) {
        }

        webView = WebView(this).apply {
            // Force Software layer to eliminate MESA rendernode GPU probing in headless cloud containers
            setLayerType(View.LAYER_TYPE_SOFTWARE, null)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                useWideViewPort = true
                loadWithOverviewMode = true
                // Disabling disk cache eliminates simple_version_upgrade fake index write failure
                cacheMode = WebSettings.LOAD_NO_CACHE
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    return true
                }
            }

            webViewClient = object : WebViewClient() {
                override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                    // Signal to Android OS that process termination is safely handled
                    return true
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                }
            }

            // Load directly via base URL to ensure immediate rendering without disk cache indexing issues
            val htmlContent = try {
                assets.open("index.html").bufferedReader().use { it.readText() }
            } catch (_: Exception) {
                ""
            }

            if (htmlContent.isNotEmpty()) {
                loadDataWithBaseURL("file:///android_asset/", htmlContent, "text/html", "UTF-8", null)
            } else {
                loadUrl("file:///android_asset/index.html")
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView?.canGoBack() == true) {
                    webView?.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        setContentView(webView)
    }

    override fun onDestroy() {
        webView?.apply {
            loadUrl("about:blank")
            clearHistory()
            removeAllViews()
            destroy()
        }
        webView = null
        super.onDestroy()
    }
}
