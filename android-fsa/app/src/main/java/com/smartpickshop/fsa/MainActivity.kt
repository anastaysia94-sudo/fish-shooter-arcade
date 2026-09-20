package com.smartpickshop.fsa

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Deep = Color(0xFF02080E)
private val Panel = Color(0xED081B29)
private val Line = Color(0xFF285B72)
private val Cyan = Color(0xFF43E6FF)
private val Teal = Color(0xFF4DE8B9)
private val Gold = Color(0xFFFFC95F)
private val Muted = Color(0xFF96B5C2)
private val Danger = Color(0xFFFF6E78)

private const val ARCADE_URL = "https://anastaysia94-sudo.github.io/fish-shooter-arcade/"
private const val GUIDE_URL = "https://anastaysia94-sudo.github.io/fish-shooter-arcade/guide.html"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { NativeCabinetInfo() }
    }
}

private data class NetworkSnapshot(
    val state: String,
    val transport: String,
    val detail: String,
    val healthy: Boolean
)

private fun networkSnapshot(context: Context): NetworkSnapshot {
    val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = manager.activeNetwork
        ?: return NetworkSnapshot("OFFLINE", "NONE", "No active network", false)
    val caps = manager.getNetworkCapabilities(network)
        ?: return NetworkSnapshot("UNKNOWN", "NONE", "Network capabilities unavailable", false)
    val transport = when {
        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WI-FI"
        caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
        caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ETHERNET"
        caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "VPN"
        else -> "OTHER"
    }
    val validated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    val metered = manager.isActiveNetworkMetered
    return NetworkSnapshot(
        state = if (validated) "ONLINE" else "LIMITED",
        transport = transport,
        detail = buildString {
            append(if (validated) "Internet validated" else "Internet not yet validated")
            append(" · ")
            append(if (metered) "metered/data-aware" else "unmetered")
        },
        healthy = validated
    )
}

@Composable
private fun NativeCabinetInfo() {
    val context = LocalContext.current
    var network by remember { mutableStateOf(networkSnapshot(context)) }

    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Cyan,
            secondary = Teal,
            tertiary = Gold,
            background = Deep,
            surface = Panel
        )
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF07344A), Deep, Color.Black)
                    )
                )
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    NativePanel("F.S.A. ANDROID", "Native Cabinet v12") {
                        Text(
                            "The Android app is a hardened cabinet for the canonical F.S.A. web/PWA runtime. Production player identity, wallet authority and game access stay on F.S.A.'s server-side authority model.",
                            color = Muted,
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Metric("VERSION", BuildConfig.VERSION_NAME, Gold, Modifier.weight(1f))
                            Metric("BUILD", BuildConfig.VERSION_CODE.toString(), Cyan, Modifier.weight(1f))
                        }
                        Button(
                            onClick = {
                                context.startActivity(
                                    Intent(context, GameActivity::class.java)
                                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                                )
                                (context as? ComponentActivity)?.finish()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("RETURN TO ARCADE")
                        }
                    }
                }

                item {
                    NativePanel("CONNECTIVITY", "Cabinet Network") {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Metric(
                                "STATE",
                                network.state,
                                if (network.healthy) Teal else Danger,
                                Modifier.weight(1f)
                            )
                            Metric("TRANSPORT", network.transport, Cyan, Modifier.weight(1f))
                        }
                        Text(network.detail, color = Muted, fontSize = 11.sp)
                        OutlinedButton(
                            onClick = { network = networkSnapshot(context) },
                            modifier = Modifier.fillMaxWidth(),
                            border = BorderStroke(1.dp, Line)
                        ) {
                            Text("REFRESH NETWORK STATUS")
                        }
                    }
                }

                item {
                    NativePanel("SECURITY BOUNDARY", "Production Rules") {
                        SecurityRow("HTTPS-only canonical runtime", true)
                        SecurityRow("Canonical GitHub Pages path allowlist", true)
                        SecurityRow("Third-party WebView cookies blocked", true)
                        SecurityRow("File/content URL access blocked", true)
                        SecurityRow("Mixed HTTP content blocked", true)
                        SecurityRow("WebView debugging limited to debug builds", true)
                        SecurityRow("Native JavaScript bridge", false, "Not exposed")
                        SecurityRow("Arbitrary server login/telemetry endpoint", false, "Removed")
                    }
                }

                item {
                    NativePanel("LOW-DATA PATH", "Android + 2G") {
                        Text(
                            "The canonical web runtime still owns Save-Data/2G detection and Lite rendering. The native cabinet does not bypass or replace that fallback.",
                            color = Muted,
                            fontSize = 11.sp,
                            lineHeight = 17.sp
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { openHttps(context, GUIDE_URL) },
                                modifier = Modifier.weight(1f),
                                border = BorderStroke(1.dp, Cyan)
                            ) { Text("PUBLIC GUIDE") }
                            OutlinedButton(
                                onClick = { openHttps(context, ARCADE_URL) },
                                modifier = Modifier.weight(1f),
                                border = BorderStroke(1.dp, Gold)
                            ) { Text("OPEN IN BROWSER") }
                        }
                    }
                }

                item {
                    Surface(
                        color = Color(0xDD031018),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Line)
                    ) {
                        Text(
                            "F.S.A. remains virtual/non-cash entertainment. This cabinet does not add deposits, withdrawals, redemption, outcome guarantees, third-party credential interception, or hidden balance manipulation.",
                            color = Muted,
                            fontSize = 10.sp,
                            lineHeight = 15.sp,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NativePanel(kicker: String, title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Panel),
        border = BorderStroke(1.dp, Line),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(kicker, color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            Text(title, fontSize = 21.sp, fontWeight = FontWeight.Black)
            content()
        }
    }
}

@Composable
private fun Metric(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = Color(0xFF061620),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Line)
    ) {
        Column(Modifier.padding(10.dp)) {
            Text(label, color = Muted, fontSize = 8.sp, fontWeight = FontWeight.Bold)
            Text(value, color = color, fontSize = 13.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun SecurityRow(label: String, enabled: Boolean, alternate: String? = null) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(if (enabled) "✓" else "•", color = if (enabled) Teal else Gold, fontWeight = FontWeight.Black)
        Spacer(Modifier.width(8.dp))
        Text(label, color = Color(0xFFE8F9FF), fontSize = 11.sp, modifier = Modifier.weight(1f))
        Text(alternate ?: "ON", color = if (enabled) Teal else Muted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}

private fun openHttps(context: Context, url: String) {
    val uri = Uri.parse(url)
    if (uri.scheme != "https") return
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) }
}
