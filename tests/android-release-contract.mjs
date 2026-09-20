import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [game, info, manifest, gradle, workflow] = await Promise.all([
  read('android-fsa/app/src/main/java/com/smartpickshop/fsa/GameActivity.kt'),
  read('android-fsa/app/src/main/java/com/smartpickshop/fsa/MainActivity.kt'),
  read('android-fsa/app/src/main/AndroidManifest.xml'),
  read('android-fsa/app/build.gradle.kts'),
  read('.github/workflows/build-fsa-android.yml'),
]);

function must(text, marker, label = marker) {
  if (!text.includes(marker)) throw new Error(`Missing Android release marker: ${label}`);
}
function mustNot(text, marker, label = marker) {
  if (text.includes(marker)) throw new Error(`Forbidden Android release marker remains: ${label}`);
}

for (const marker of [
  'https://anastaysia94-sudo.github.io',
  '/fish-shooter-arcade/',
  'WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)',
  'setAcceptThirdPartyCookies',
  'allowFileAccess = false',
  'allowContentAccess = false',
  'WebSettings.MIXED_CONTENT_NEVER_ALLOW',
  'safeBrowsingEnabled = true',
  'setSupportMultipleWindows(true)',
  'javaScriptCanOpenWindowsAutomatically = false',
  'loadDataWithBaseURL',
  'Blocked non-HTTPS navigation',
]) must(game, marker);

if (!/setAcceptThirdPartyCookies\([^,]+,\s*false\)/s.test(game)) {
  throw new Error('Third-party WebView cookies must be explicitly disabled.');
}
mustNot(game, 'addJavascriptInterface', 'native JavaScript interface');
mustNot(game, 'MIXED_CONTENT_ALWAYS_ALLOW', 'mixed-content bypass');
mustNot(game, 'proceed()', 'SSL error bypass');

for (const stale of [
  'OutlinedTextField(server',
  'OutlinedTextField(user',
  'OutlinedTextField(pass',
  '"/login"',
  '"/telemetry"',
  '"/session/start"',
  'sessionKey',
]) mustNot(info, stale, `legacy arbitrary-server shell: ${stale}`);

for (const marker of [
  'Native Cabinet v12',
  'Production Rules',
  'Arbitrary server login/telemetry endpoint',
  'Removed',
  'virtual/non-cash entertainment',
]) must(info, marker);

for (const marker of [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android:allowBackup="false"',
  'android:usesCleartextTraffic="false"',
  'android:resizeableActivity="true"',
]) must(manifest, marker);

for (const marker of [
  'compileSdk = 36',
  'targetSdk = 36',
  'versionCode = 12',
  'versionName = "0.12.0-release-hardening"',
  'buildConfig = true',
  'checkReleaseBuilds = true',
]) must(gradle, marker);

for (const marker of [
  'node tests/android-release-contract.mjs',
  ':app:lintRelease',
  ':app:testDebugUnitTest',
  ':app:assembleDebug',
  ':app:bundleRelease',
  'app-debug.apk',
  'app-release.aab',
  'SHA256SUMS.txt',
]) must(workflow, marker);

console.log('FSA_ANDROID_RELEASE_V12_CONTRACT=PASS');
