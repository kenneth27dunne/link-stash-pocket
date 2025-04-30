package app.dunnewebsolutions.linkstash;

import android.app.Application;
import android.content.Context;
import android.util.Log;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;

public class MainApplication extends Application {
    private static final String TAG = "LinkStash:MainApp";
    
    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        try {
            // Try to initialize WebView early
            WebView.setDataDirectorySuffix("linkstash_webview");
            Log.d(TAG, "WebView data directory set");
        } catch (Exception e) {
            Log.e(TAG, "Error setting WebView data directory", e);
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        try {
            // Initialize WebView early
            new WebView(this).destroy();
            Log.d(TAG, "WebView initialized early");
            
            // Check WebView package
            try {
                if (WebViewCompat.getCurrentWebViewPackage(this) != null) {
                    Log.d(TAG, "WebView package: " + WebViewCompat.getCurrentWebViewPackage(this).packageName);
                } else {
                    Log.e(TAG, "No WebView package found");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error getting WebView package", e);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing WebView early", e);
        }
    }
} 