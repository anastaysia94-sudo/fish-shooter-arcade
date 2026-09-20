package com.smartpickshop.fsa

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class GameActivity : ComponentActivity() {
    private lateinit var root: LinearLayout
    private lateinit var webView: WebView
    private lateinit var topBar: LinearLayout

    private val gameUrl = "https://anastaysia94-sudo.github.io/fish-shooter-arcade/"
    private val allowedHost = "anastaysia94-sudo.github.io"
    private val allowedPath = "/fish-shooter-arcade"
    private val maxMainFrameRetries = 4
    private val canonicalOrigin = "https://anastaysia94-sudo.github.io"
    private val canonicalPathPrefix = "/fish-shooter-arcade/"
    private val gameUrl = "$canonicalOrigin$canonicalPathPrefix"
    private var lastCanonicalUrl = gameUrl
    private var showingOffline = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(2, 8, 14))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        topBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(8), dp(5), dp(8), dp(5))
            setBackgroundColor(Color.rgb(5, 19, 30))
        }

        val brand = TextView(this).apply {
            text = "F.S.A.  •  ANDROID CABINET v12"
            setTextColor(Color.rgb(67, 230, 255))
            textSize = 11f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            gravity = Gravity.CENTER_VERTICAL
        }
        topBar.addView(brand, LinearLayout.LayoutParams(0, dp(42), 1f))

        fun barButton(label: String, action: () -> Unit): Button = Button(this).apply {
            text = label
            textSize = 8f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.rgb(20, 58, 75))
            setPadding(dp(6), 0, dp(6), 0)
            setOnClickListener { action() }
        }

        topBar.addView(barButton("LOBBY") { loadCanonical(gameUrl) }, buttonParams(66))
        topBar.addView(barButton("RETRY") { retryCanonical() }, buttonParams(62))
        topBar.addView(barButton("INFO") {
            startActivity(Intent(this, MainActivity::class.java))
        }, buttonParams(58))
        topBar.addView(barButton("FULL") {
            topBar.visibility = View.GONE
            enterImmersive()
        }, LinearLayout.LayoutParams(dp(58), dp(42)))

        root.addView(
            topBar,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52))
        )

        var mainFrameLoadFailed = false
        var mainFrameRetryCount = 0

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
                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = false
                allowFileAccess = false
                allowContentAccess = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                safeBrowsingEnabled = true
                setGeolocationEnabled(false)
                saveFormData = false
                userAgentString = "$userAgentString FSA-Android-v12"
            }
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setAcceptThirdPartyCookies(this, false)
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return true
                    if (isCanonical(uri)) {
                        lastCanonicalUrl = uri.toString()
                        showingOffline = false
                        return false
                    }
                    if (uri.scheme == "https") {
                        return openExternal(uri)
                    }
                    Toast.makeText(this@GameActivity, "Blocked non-HTTPS navigation", Toast.LENGTH_SHORT).show()
                    return true
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    val uri = url?.let { value -> runCatching { Uri.parse(value) }.getOrNull() }
                    if (uri != null && isTrustedFsaUri(uri)) mainFrameLoadFailed = false
                }

                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame != true) return
                    mainFrameLoadFailed = true
                    val uri = request.url
                    val code = error?.errorCode
                    val description = error?.description
                    if (isTrustedFsaUri(uri) && mainFrameRetryCount < maxMainFrameRetries) {
                        mainFrameRetryCount += 1
                        val delayMs = 1_500L * mainFrameRetryCount
                        Log.w("FSAAndroid", "MAIN_FRAME_RETRY attempt=$mainFrameRetryCount code=$code description=$description delayMs=$delayMs")
                        view?.postDelayed({
                            if (!isFinishing && !isDestroyed) view.loadUrl(gameUrl)
                        }, delayMs)
                    } else {
                        Log.e("FSAAndroid", "MAIN_FRAME_ERROR_FINAL code=$code description=$description")
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    val uri = url?.let { value -> runCatching { Uri.parse(value) }.getOrNull() }
                    if (uri == null || !isTrustedFsaUri(uri) || mainFrameLoadFailed) return
                    // Mark the trusted F.S.A. page as running inside the Android cabinet.
                    val uri = runCatching { Uri.parse(url ?: "") }.getOrNull()
                    if (uri == null || !isCanonical(uri) || showingOffline) return
                    lastCanonicalUrl = uri.toString()
                    view?.evaluateJavascript(
                        """
                        (()=>{
                          document.documentElement.classList.add('fsa-android-cabinet');
                          document.body && document.body.setAttribute('data-fsa-android','v12');
                          try { localStorage.setItem('fsa.android.cabinet','v12'); } catch(e) {}
                          return document.readyState + ':' + (document.body?.getAttribute('data-fsa-android') || 'missing');
                        })();
                        """.trimIndent()
                    ) { result ->
                        mainFrameRetryCount = 0
                        Log.i("FSAAndroid", "TRUSTED_PAGE_FINISHED host=${uri.host} path=${uri.path} cabinet=$result")
                    }
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true && isCanonical(request.url)) {
                        view?.post { showOffline(error?.description?.toString() ?: "Network unavailable") }
                    }
                }

                override fun onReceivedHttpError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    errorResponse: WebResourceResponse?
                ) {
                    super.onReceivedHttpError(view, request, errorResponse)
                    if (
                        request?.isForMainFrame == true &&
                        isCanonical(request.url) &&
                        (errorResponse?.statusCode ?: 0) >= 500
                    ) {
                        view?.post { showOffline("F.S.A. is temporarily unavailable") }
                    }
                }

                override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                    Toast.makeText(this@GameActivity, "Arcade renderer restarted", Toast.LENGTH_SHORT).show()
                    finish()
                    return true
                }
            }
        }

        root.addView(
            webView,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
        )
        setContentView(root)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    topBar.visibility == View.GONE -> {
                        topBar.visibility = View.VISIBLE
                        exitImmersive()
                    }
                    webView.canGoBack() && !showingOffline -> webView.goBack()
                    else -> finish()
                }
            }
        })

        if (savedInstanceState == null) {
            loadCanonical(gameUrl)
        } else if (webView.restoreState(savedInstanceState) == null) {
            loadCanonical(gameUrl)
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
        CookieManager.getInstance().flush()
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.stopLoading()
        webView.loadUrl("about:blank")
        webView.webChromeClient = null
        webView.destroy()
        super.onDestroy()
    }

    private fun buttonParams(widthDp: Int) = LinearLayout.LayoutParams(dp(widthDp), dp(42)).apply {
        marginEnd = dp(4)
    }

    private fun isCanonical(uri: Uri): Boolean =
        uri.scheme == "https" &&
            uri.host == "anastaysia94-sudo.github.io" &&
            (uri.path ?: "/").startsWith(canonicalPathPrefix)

    private fun loadCanonical(url: String) {
        val uri = runCatching { Uri.parse(url) }.getOrNull()
        if (uri == null || !isCanonical(uri)) return
        showingOffline = false
        lastCanonicalUrl = url
        webView.loadUrl(url)
    }

    private fun retryCanonical() {
        topBar.visibility = View.VISIBLE
        exitImmersive()
        webView.stopLoading()
        loadCanonical(lastCanonicalUrl.ifBlank { gameUrl })
    }

    private fun openExternal(uri: Uri): Boolean = runCatching {
        startActivity(Intent(Intent.ACTION_VIEW, uri))
        true
    }.getOrElse {
        Toast.makeText(this, "No browser available for that link", Toast.LENGTH_SHORT).show()
        true
    }

    private fun showOffline(reason: String) {
        if (isFinishing || isDestroyed) return
        showingOffline = true
        topBar.visibility = View.VISIBLE
        exitImmersive()
        val safeReason = reason
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
        val html = """
            <!doctype html>
            <html><head><meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
              body{margin:0;background:#02080e;color:#e9fbff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh}
              main{max-width:34rem;padding:2rem;text-align:center}h1{color:#ffd45f}p{line-height:1.5;color:#a9cad5}
              a{display:inline-block;margin-top:1rem;padding:.8rem 1.1rem;border-radius:.8rem;background:#0a536b;color:#fff;text-decoration:none;font-weight:800}
            </style></head><body><main>
              <div style="font-size:3rem">⚜</div><h1>F.S.A. is offline</h1>
              <p>$safeReason</p>
              <p>The Android cabinet keeps your production account authority on the canonical F.S.A. service. It will not fall back to an arbitrary server.</p>
              <a href="$gameUrl">Retry arcade</a>
            </main></body></html>
        """.trimIndent()
        webView.loadDataWithBaseURL(gameUrl, html, "text/html", "UTF-8", null)
    }

    private fun enterImmersive() {
        WindowCompat.getInsetsController(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    private fun exitImmersive() {
        WindowCompat.getInsetsController(window, window.decorView)
            .show(WindowInsetsCompat.Type.systemBars())
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
