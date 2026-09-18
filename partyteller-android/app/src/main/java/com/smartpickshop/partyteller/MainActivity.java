package com.smartpickshop.partyteller;

import android.app.*;
import android.os.*;
import android.webkit.*;
import android.content.*;
import android.net.*;
import android.provider.MediaStore;
import android.print.PrintManager;
import android.widget.Toast;
import android.util.Base64;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri pendingCameraUri;
    private static final int PICK_FILE = 8;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);

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

                ArrayList<Intent> initial = new ArrayList<>();
                try {
                    File pictures = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
                    File photo = File.createTempFile("partyteller_receipt_", ".jpg", pictures);
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
            } else {
                result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
        pendingCameraUri = null;
    }

    private class AndroidBridge {
        @JavascriptInterface public void toast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
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
                    out.write(payload.getBytes("UTF-8"));
                }
                Uri uri = FileProvider.getUriForFile(
                        MainActivity.this,
                        getPackageName() + ".fileprovider",
                        backup);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("application/json");
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.putExtra(Intent.EXTRA_SUBJECT, "PartyTeller Work Log Backup");
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(send, "Save / share backup"));
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

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
