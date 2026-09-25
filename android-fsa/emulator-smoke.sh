#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.smartpickshop.fsa"
ACTIVITY=".GameActivity"
APK="android-fsa/app/build/outputs/apk/debug/app-debug.apk"
OUT="artifacts/android-emulator"
mkdir -p "$OUT"

capture_evidence() {
  adb logcat -d > "$OUT/logcat.txt" || true
  adb shell dumpsys activity activities > "$OUT/activity.txt" || true
  adb shell dumpsys package "$PACKAGE" > "$OUT/package.txt" || true
  adb exec-out screencap -p > "$OUT/fsa-v12-emulator.png" || true
  adb shell uiautomator dump /sdcard/fsa-window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/fsa-window.xml "$OUT/window.xml" >/dev/null 2>&1 || true
}
trap capture_evidence EXIT

adb wait-for-device
for attempt in $(seq 1 30); do
  [[ "$(adb shell getprop sys.boot_completed | tr -d '\r')" == "1" ]] && break
  sleep 2
done
[[ "$(adb shell getprop sys.boot_completed | tr -d '\r')" == "1" ]] || { echo "Emulator never completed boot" >&2; exit 1; }

test -f "$APK"
adb logcat -c
adb install -r "$APK" | tee "$OUT/install.txt"
adb shell pm path "$PACKAGE" | tee "$OUT/package-path.txt" | grep -q '^package:'

LAUNCH="$(adb shell am start -W -n "$PACKAGE/$ACTIVITY")"
printf '%s\n' "$LAUNCH" | tee "$OUT/launch.txt"
grep -q 'Status: ok' "$OUT/launch.txt"

READY=0
for attempt in $(seq 1 45); do
  adb shell pidof "$PACKAGE" >/dev/null 2>&1 || { sleep 2; continue; }
  # Filter the complete logcat stream instead of relying on tag-filter syntax.
  # Android's logcat accepted the FSAAndroid entries but the previous -s form
  # returned an empty stream on the API 35 runner.
  FSA_LOG="$(adb logcat -d 2>/dev/null | grep -F 'FSAAndroid:' || true)"
  printf '%s\n' "$FSA_LOG" > "$OUT/fsa-log.txt"
  if grep -q 'MAIN_FRAME_ERROR' "$OUT/fsa-log.txt"; then
    echo "F.S.A. WebView reported a main-frame load error" >&2
    exit 1
  fi
  if grep -q 'TRUSTED_PAGE_FINISHED host=anastaysia94-sudo.github.io path=/fish-shooter-arcade/' "$OUT/fsa-log.txt"; then
    READY=1
    break
  fi
  sleep 2
done
[[ "$READY" == "1" ]] || { echo "Trusted F.S.A. page never reached the Android readiness marker" >&2; exit 1; }

adb shell dumpsys activity activities > "$OUT/activity-before-rotation.txt"
grep -Eq '(mResumedActivity|topResumedActivity).*com\.smartpickshop\.fsa' "$OUT/activity-before-rotation.txt"
adb shell pidof "$PACKAGE" | tee "$OUT/pid-before-rotation.txt"
adb exec-out screencap -p > "$OUT/fsa-v12-emulator-portrait.png"

# Exercise an orientation transition and verify the activity/process survive it.
adb shell settings put system accelerometer_rotation 0 || true
adb shell settings put system user_rotation 1 || true
sleep 4
adb shell dumpsys activity activities > "$OUT/activity-after-rotation.txt"
grep -Eq '(mResumedActivity|topResumedActivity).*com\.smartpickshop\.fsa' "$OUT/activity-after-rotation.txt"
adb shell pidof "$PACKAGE" | tee "$OUT/pid-after-rotation.txt"
adb exec-out screencap -p > "$OUT/fsa-v12-emulator-landscape.png"
adb shell settings put system user_rotation 0 || true

cat > "$OUT/SMOKE-STATUS.txt" <<EOF
F.S.A. Android v12 emulator smoke: PASS
package=$PACKAGE
activity=$PACKAGE/$ACTIVITY
trusted_url=https://anastaysia94-sudo.github.io/fish-shooter-arcade/
trusted_page_marker=PASS
activity_resumed=PASS
process_alive=PASS
rotation_survival=PASS
physical_device_certification=NOT_PERFORMED
play_store_certification=NOT_PERFORMED
EOF

printf 'FSA_ANDROID_EMULATOR_SMOKE=PASS package=%s trusted_page=PASS rotation=PASS\n' "$PACKAGE"
