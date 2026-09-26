import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [game, info, manifest, gradle, workflow, selftest] = await Promise.all([
  read('android-fsa/app/src/main/java/com/smartpickshop/fsa/GameActivity.kt'),
  read('android-fsa/app/src/main/java/com/smartpickshop/fsa/MainActivity.kt'),
  read('android-fsa/app/src/main/AndroidManifest.xml'),
  read('android-fsa/app/build.gradle.kts'),
  read('.github/workflows/build-fsa-android.yml'),
  read('android-fsa/release-selftest.py'),
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
  'FSA_ANDROID_KEYSTORE_PATH',
  'FSA_ANDROID_KEYSTORE_PASSWORD',
  'FSA_ANDROID_KEY_ALIAS',
  'FSA_ANDROID_KEY_PASSWORD',
  'signingConfigs',
]) must(gradle, marker);

for (const marker of [
  'node tests/android-release-contract.mjs',
  'python3 android-fsa/release-selftest.py',
  ':app:lintRelease',
  ':app:testDebugUnitTest',
  ':app:assembleDebug',
  ':app:assembleRelease',
  ':app:bundleRelease',
  'FSA-v12-debug.apk',
  'FSA-v12-unsigned-release.apk',
  'FSA-v12-signed-release.apk',
  'app-release.aab',
  'BUILD-STATUS.txt',
  'SHA256SUMS.txt',
  'FSA_ANDROID_KEYSTORE_B64',
]) must(workflow, marker);

for (const marker of [
  'versionName=0.12.0-release-hardening',
  'release apk task',
  'optional signing secrets',
]) must(selftest, marker);

console.log('FSA_ANDROID_RELEASE_V12_CONTRACT=PASS');
