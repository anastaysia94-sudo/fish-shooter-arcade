package com.smartpickshop.partyteller;
import android.app.*;import android.os.*;import android.webkit.*;import android.content.*;import android.net.*;import android.provider.MediaStore;import android.view.*;
public class MainActivity extends Activity{
 WebView w; ValueCallback<Uri[]> cb; static final int PICK=8;
 public void onCreate(Bundle b){super.onCreate(b);w=new WebView(this);w.getSettings().setJavaScriptEnabled(true);w.getSettings().setDomStorageEnabled(true);w.setWebViewClient(new WebViewClient());w.setWebChromeClient(new WebChromeClient(){public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> c,FileChooserParams p){cb=c;Intent i=new Intent(Intent.ACTION_CHOOSER);Intent f=new Intent(Intent.ACTION_GET_CONTENT);f.setType("image/*");Intent cam=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);i.putExtra(Intent.EXTRA_INTENT,f);i.putExtra(Intent.EXTRA_INITIAL_INTENTS,new Intent[]{cam});startActivityForResult(i,PICK);return true;}});w.loadUrl("https://partyteller-payroll-work-log-smart-pick-shop-holdings-llc.vercel.app");setContentView(w);}
 protected void onActivityResult(int r,int c,Intent d){super.onActivityResult(r,c,d);if(r==PICK&&cb!=null){cb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(c,d));cb=null;}}
 public void onBackPressed(){if(w.canGoBack())w.goBack();else super.onBackPressed();}
}