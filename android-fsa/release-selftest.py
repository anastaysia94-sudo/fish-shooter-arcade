#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
REPO = ROOT.parent


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path.relative_to(REPO)}")
    return path.read_text(encoding="utf-8")


gradle = read(APP / "build.gradle.kts")
manifest = read(APP / "src/main/AndroidManifest.xml")
game = read(APP / "src/main/java/com/smartpickshop/fsa/GameActivity.kt")
workflow = read(REPO / ".github/workflows/build-fsa-android.yml")

checks = {
    "application id": 'applicationId = "com.smartpickshop.fsa"' in gradle,
    "namespace": 'namespace = "com.smartpickshop.fsa"' in gradle,
    "compile sdk 36": re.search(r"compileSdk\s*=\s*36", gradle) is not None,
    "target sdk 36": re.search(r"targetSdk\s*=\s*36", gradle) is not None,
    "minimum sdk 26": re.search(r"minSdk\s*=\s*26", gradle) is not None,
    "version code 12": re.search(r"versionCode\s*=\s*12", gradle) is not None,
    "version name rc1": 'versionName = "0.12.0-android-rc1"' in gradle,
    "optional release signing": all(marker in gradle for marker in [
        "FSA_ANDROID_KEYSTORE_PATH",
        "FSA_ANDROID_KEYSTORE_PASSWORD",
        "FSA_ANDROID_KEY_ALIAS",
        "FSA_ANDROID_KEY_PASSWORD",
    ]),
    "internet permission": 'android.permission.INTERNET' in manifest,
    "cleartext disabled": 'android:usesCleartextTraffic="false"' in manifest,
    "backup disabled": 'android:allowBackup="false"' in manifest,
    "game category": 'android:appCategory="game"' in manifest,
    "launcher exported": 'android:name=".GameActivity"' in manifest and 'android:exported="true"' in manifest,
    "trusted https origin": 'https://anastaysia94-sudo.github.io/fish-shooter-arcade/' in game,
    "trusted path boundary": 'private val allowedPath = "/fish-shooter-arcade"' in game and 'isTrustedFsaUri' in game,
    "file access disabled": 'allowFileAccess = false' in game,
    "content access disabled": 'allowContentAccess = false' in game,
    "mixed content blocked": 'WebSettings.MIXED_CONTENT_NEVER_ALLOW' in game,
    "safe browsing enabled": 'safeBrowsingEnabled = true' in game,
    "webview debugging disabled": 'WebView.setWebContentsDebuggingEnabled(false)' in game,
    "android cabinet v12": 'FSA-Android-v12' in game and "data-fsa-android','v12" in game,
    "debug apk task": ':app:assembleDebug' in workflow,
    "release apk task": ':app:assembleRelease' in workflow,
    "release bundle task": ':app:bundleRelease' in workflow,
    "release artifacts": 'FSA-Android-v12-release-candidate' in workflow,
}

for name, ok in checks.items():
    require(ok, f"Android release contract failed: {name}")

secret_like = []
for pattern in ("*.jks", "*.keystore", "*.p12", "*.pfx"):
    secret_like.extend(ROOT.rglob(pattern))
require(not secret_like, "Signing key material must not be committed under android-fsa")

print(f"FSA_ANDROID_RELEASE_SELFTEST=PASS checks={len(checks)} versionCode=12 package=com.smartpickshop.fsa")
