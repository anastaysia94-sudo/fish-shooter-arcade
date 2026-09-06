package com.smartpickshop.fsa

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class GameActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var topBar: LinearLayout

    private val gameUrl = "https://anastaysia94-sudo.github.io/fish-shooter-arcade/"
    private val allowedHost = "anastaysia94-sudo.github.io"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.rgb(2, 8, 14)
        window.navigationBarColor = Color.rgb(2, 8, 14)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(2, 8, 14))
        }

        topBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(8), dp(5), dp(8), dp(5))
            setBackgroundColor(Color.rgb(5, 19, 30))
        }

        val brand = TextView(this).apply {
            text = "F.S.A.  •  TABLE ENGINE v5"
            setTextColor(Color.rgb(67, 230, 255))
            textSize = 12f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            gravity = Gravity.CENTER_VERTICAL
        }
        topBar.addView(brand, LinearLayout.LayoutParams(0, dp(42), 1f))

        fun barButton(label: String, action: () -> Unit): Button = Button(this).apply {
            text = label
            textSize = 9f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.rgb(20, 58, 75))
            setPadding(dp(8), 0, dp(8), 0)
            setOnClickListener { action() }
        }

        topBar.addView(barButton("LOBBY") {
            webView.loadUrl(gameUrl)
        }, LinearLayout.LayoutParams(dp(74), dp(42)).apply { marginEnd = dp(5) })

        topBar.addView(barButton("CONSOLE") {
            startActivity(Intent(this, MainActivity::class.java))
        }, LinearLayout.LayoutParams(dp(82), dp(42)).apply { marginEnd = dp(5) })

        topBar.addView(barButton("FULL") {
            topBar.visibility = View.GONE
            enterImmersive()
        }, LinearLayout.LayoutParams(dp(62), dp(42)))

        root.addView(topBar, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)))

        webView = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            isFocusable = true
            isFocusableInTouchMode = true
            overScrollMode = View.OVER_SCROLL_NEVER
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                loadsImagesAutomatically = true
                builtInZoomControls = false
                displayZoomControls = false
                setSupportZoom(false)
                allowFileAccess = false
                allowContentAccess = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                userAgentString = "$userAgentString FSA-Android-v11"
            }
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    if (uri.scheme == "https" && uri.host == allowedHost) return false
                    return runCatching {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                        true
                    }.getOrDefault(true)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // Mark the trusted F.S.A. page as running inside the Android cabinet.
                    view?.evaluateJavascript(
                        """
                        (()=>{
                          document.documentElement.classList.add('fsa-android-cabinet');
                          document.body && document.body.setAttribute('data-fsa-android','v11');
                          try { localStorage.setItem('fsa.android.cabinet','v11'); } catch(e) {}
                        })();
                        """.trimIndent(),
                        null
                    )
                }
            }
        }

        root.addView(webView, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            0,
            1f
        ))

        setContentView(root)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    topBar.visibility == View.GONE -> {
                        topBar.visibility = View.VISIBLE
                        exitImmersive()
                    }
                    webView.canGoBack() -> webView.goBack()
                    else -> finish()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(gameUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.webChromeClient = null
        webView.destroy()
        super.onDestroy()
    }

    private fun enterImmersive() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
    }

    private fun exitImmersive() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
