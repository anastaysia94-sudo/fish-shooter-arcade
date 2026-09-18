package com.smartpickshop.partyteller;

import android.Manifest;
import android.app.*;
import android.os.*;
import android.webkit.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.*;
import android.provider.MediaStore;
import android.print.PrintManager;
import android.speech.*;
import android.widget.Toast;
import android.util.Base64;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import androidx.core.content.FileProvider;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri pendingCameraUri;
    private static final int PICK_FILE = 8;
    private static final int REQ_AUDIO = 31;
    private static final int REQ_LOCATION = 32;

    private SpeechRecognizer speechRecognizer;
    private boolean voicePending = false;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                fileCallback = callback;

                Intent gallery = new Intent(Intent.ACTION_GET_CONTENT);
                gallery.addCategory(Intent.CATEGORY_OPENABLE);
                gallery.setType("image/*");
                gallery.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                ArrayList<Intent> initial = new ArrayList<>();
                try {
                    File pictures = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
                    File photo = File.createTempFile("partyteller_photo_", ".jpg", pictures);
                    pendingCameraUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            photo);
                    Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    camera.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraUri);
                    camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    if (camera.resolveActivity(getPackageManager()) != null) initial.add(camera);
                } catch (Exception ignored) {
                    pendingCameraUri = null;
                }

                Intent chooser = Intent.createChooser(gallery, "Receipt / work photo");
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, initial.toArray(new Intent[0]));
                startActivityForResult(chooser, PICK_FILE);
                return true;
            }

            @Override public void onGeolocationPermissionsShowPrompt(
                    String origin, GeolocationPermissions.Callback callback) {
                if (Build.VERSION.SDK_INT < 23 ||
                        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                        checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    geoCallback = callback;
                    geoOrigin = origin;
                    requestPermissions(new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                    }, REQ_LOCATION);
                }
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILE || fileCallback == null) return;

        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (data == null && pendingCameraUri != null) {
                result = new Uri[]{pendingCameraUri};
            } else if (data != null && data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else {
                result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
        pendingCameraUri = null;
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (ok && voicePending) startVoiceRecognition();
            else js("window.onNativeVoiceError && window.onNativeVoiceError('Microphone permission was not granted.')");
            voicePending = false;
        } else if (requestCode == REQ_LOCATION) {
            boolean ok = false;
            for (int g : grantResults) if (g == PackageManager.PERMISSION_GRANTED) ok = true;
            if (geoCallback != null) geoCallback.invoke(geoOrigin, ok, false);
            geoCallback = null;
            geoOrigin = null;
        }
    }

    private void js(String script) {
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void requestVoice() {
        if (Build.VERSION.SDK_INT >= 23 &&
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            voicePending = true;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            return;
        }
        startVoiceRecognition();
    }

    private void startVoiceRecognition() {
        runOnUiThread(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(MainActivity.this)) {
                    js("window.onNativeVoiceError && window.onNativeVoiceError('Speech recognition is not available on this phone.')");
                    return;
                }
                if (speechRecognizer != null) speechRecognizer.destroy();
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle params) {
                        js("window.onNativeVoiceStatus && window.onNativeVoiceStatus('Listening…')");
                    }
                    @Override public void onBeginningOfSpeech() {}
                    @Override public void onRmsChanged(float rmsdB) {}
                    @Override public void onBufferReceived(byte[] buffer) {}
                    @Override public void onEndOfSpeech() {
                        js("window.onNativeVoiceStatus && window.onNativeVoiceStatus('Processing…')");
                    }
                    @Override public void onError(int error) {
                        js("window.onNativeVoiceError && window.onNativeVoiceError('Voice entry did not complete. Tap the microphone and try once more.')");
                    }
                    @Override public void onResults(Bundle results) {
                        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        String text = matches != null && !matches.isEmpty() ? matches.get(0) : "";
                        js("window.onNativeVoiceResult && window.onNativeVoiceResult(" + JSONObject.quote(text) + ")");
                    }
                    @Override public void onPartialResults(Bundle partialResults) {}
                    @Override public void onEvent(int eventType, Bundle params) {}
                });
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                speechRecognizer.startListening(intent);
            } catch (Exception e) {
                js("window.onNativeVoiceError && window.onNativeVoiceError('Voice entry could not start.')");
            }
        });
    }

    private static String xml(String value) {
        if (value == null) return "";
        return value.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&apos;");
    }

    private void zipEntry(ZipOutputStream z, String name, String body) throws IOException {
        z.putNextEntry(new ZipEntry(name));
        z.write(body.getBytes(StandardCharsets.UTF_8));
        z.closeEntry();
    }

    private String colName(int n) {
        StringBuilder out = new StringBuilder();
        while (n > 0) {
            n--;
            out.insert(0, (char)('A' + (n % 26)));
            n /= 26;
        }
        return out.toString();
    }

    private String sheetXml(JSONArray rows) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
        sb.append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
        for (int r = 0; r < rows.length(); r++) {
            JSONArray row = rows.optJSONArray(r);
            if (row == null) continue;
            int rowNum = r + 1;
            sb.append("<row r=\"").append(rowNum).append("\">");
            for (int c = 0; c < row.length(); c++) {
                String ref = colName(c + 1) + rowNum;
                String value = row.optString(c, "");
                sb.append("<c r=\"").append(ref).append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
                        .append(xml(value)).append("</t></is></c>");
            }
            sb.append("</row>");
        }
        sb.append("</sheetData></worksheet>");
        return sb.toString();
    }

    private void createXlsx(File file, JSONObject payload) throws Exception {
        JSONArray work = payload.optJSONArray("work");
        JSONArray expenses = payload.optJSONArray("expenses");
        if (work == null) work = new JSONArray();
        if (expenses == null) expenses = new JSONArray();

        try (ZipOutputStream z = new ZipOutputStream(new FileOutputStream(file))) {
            zipEntry(z, "[Content_Types].xml",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
                    "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
                    "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
                    "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
                    "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                    "<Override PartName=\"/xl/worksheets/sheet2.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                    "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>" +
                    "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>" +
                    "</Types>");
            zipEntry(z, "_rels/.rels",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
                    "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>" +
                    "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>" +
                    "</Relationships>");
            zipEntry(z, "xl/workbook.xml",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
                    "<sheets><sheet name=\"Work Log\" sheetId=\"1\" r:id=\"rId1\"/><sheet name=\"Expenses\" sheetId=\"2\" r:id=\"rId2\"/></sheets></workbook>");
            zipEntry(z, "xl/_rels/workbook.xml.rels",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
                    "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet2.xml\"/>" +
                    "</Relationships>");
            zipEntry(z, "xl/worksheets/sheet1.xml", sheetXml(work));
            zipEntry(z, "xl/worksheets/sheet2.xml", sheetXml(expenses));
            zipEntry(z, "docProps/app.xml",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"><Application>PartyTeller</Application></Properties>");
            zipEntry(z, "docProps/core.xml",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:title>PartyTeller Work Log</dc:title></cp:coreProperties>");
        }
    }

    private void shareFile(File file, String mime, String title) throws Exception {
        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType(mime);
        send.putExtra(Intent.EXTRA_STREAM, uri);
        send.putExtra(Intent.EXTRA_SUBJECT, title);
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(Intent.createChooser(send, title));
    }

    private class AndroidBridge {
        @JavascriptInterface public void toast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
        }

        @JavascriptInterface public void startVoiceInput() {
            requestVoice();
        }

        @JavascriptInterface public void ocrReceipt(String dataUrl) {
            try {
                int comma = dataUrl.indexOf(',');
                String encoded = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
                byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) {
                    js("window.onNativeOcrError && window.onNativeOcrError('The receipt image could not be read.')");
                    return;
                }
                InputImage image = InputImage.fromBitmap(bitmap, 0);
                TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                        .process(image)
                        .addOnSuccessListener(result ->
                                js("window.onNativeOcrResult && window.onNativeOcrResult(" + JSONObject.quote(result.getText()) + ")"))
                        .addOnFailureListener(e ->
                                js("window.onNativeOcrError && window.onNativeOcrError('OCR could not read this receipt. You can still enter it manually.')"));
            } catch (Exception e) {
                js("window.onNativeOcrError && window.onNativeOcrError('OCR could not start.')");
            }
        }

        @JavascriptInterface public void exportXlsx(String payloadJson) {
            try {
                File dir = new File(getCacheDir(), "partyteller_share");
                if (!dir.exists()) dir.mkdirs();
                File file = new File(dir, "PartyTeller_Work_Log.xlsx");
                createXlsx(file, new JSONObject(payloadJson));
                shareFile(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "PartyTeller Excel Work Log");
            } catch (Exception e) {
                toast("Excel export could not be prepared. Your work is still saved.");
            }
        }

        @JavascriptInterface public void printReport() {
            runOnUiThread(() -> {
                PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
                manager.print(
                        "PartyTeller_Matthew_Boss_Report",
                        webView.createPrintDocumentAdapter("PartyTeller Boss Report"),
                        null);
            });
        }

        @JavascriptInterface public void shareBackup(String payload) {
            try {
                File dir = new File(getCacheDir(), "partyteller_share");
                if (!dir.exists()) dir.mkdirs();
                File backup = new File(dir, "PartyTeller_WorkLog_Backup.json");
                try (FileOutputStream out = new FileOutputStream(backup)) {
                    out.write(payload.getBytes(StandardCharsets.UTF_8));
                }
                shareFile(backup, "application/json", "Save PartyTeller Backup to Drive / OneDrive / Dropbox");
            } catch (Exception e) {
                toast("Backup could not be prepared yet. Your saved work was not deleted.");
            }
        }

        @JavascriptInterface public void shareReport(
                String subject,
                String body,
                String email,
                String receiptsJson) {
            try {
                File dir = new File(getCacheDir(), "partyteller_share");
                if (!dir.exists()) dir.mkdirs();

                ArrayList<Uri> attachments = new ArrayList<>();
                JSONArray receipts = new JSONArray(receiptsJson == null ? "[]" : receiptsJson);
                for (int i = 0; i < receipts.length(); i++) {
                    JSONObject item = receipts.getJSONObject(i);
                    String dataUrl = item.optString("dataUrl", "");
                    int comma = dataUrl.indexOf(',');
                    if (comma < 0) continue;
                    String header = dataUrl.substring(0, comma);
                    String encoded = dataUrl.substring(comma + 1);
                    byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
                    String ext = header.contains("png") ? ".png" : ".jpg";
                    File file = new File(dir, "Original_Receipt_" + (i + 1) + ext);
                    try (FileOutputStream out = new FileOutputStream(file)) {
                        out.write(bytes);
                    }
                    attachments.add(FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            file));
                }

                Intent send;
                if (attachments.isEmpty()) {
                    send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                } else {
                    send = new Intent(Intent.ACTION_SEND_MULTIPLE);
                    send.setType("image/*");
                    send.putParcelableArrayListExtra(Intent.EXTRA_STREAM, attachments);
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
                send.putExtra(Intent.EXTRA_SUBJECT, subject);
                send.putExtra(Intent.EXTRA_TEXT, body);
                if (email != null && !email.trim().isEmpty()) {
                    send.putExtra(Intent.EXTRA_EMAIL, new String[]{email.trim()});
                }
                startActivity(Intent.createChooser(send, "Send boss report"));
            } catch (Exception e) {
                toast("The report is still saved. Sharing did not open, so try again once.");
            }
        }
    }

    @Override protected void onDestroy() {
        if (speechRecognizer != null) speechRecognizer.destroy();
        super.onDestroy();
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
