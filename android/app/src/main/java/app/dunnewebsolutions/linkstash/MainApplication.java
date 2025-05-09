package app.dunnewebsolutions.linkstash;

import android.app.Application;
import android.content.Context;
import android.util.Log;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import android.annotation.TargetApi;
import android.os.Build;

import com.getcapacitor.Bridge;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainApplication extends Application {
    private static final String TAG = "LinkStash:MainApp";
    
    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        try {
            // Try to initialize WebView early
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                setWebViewDataDirectory();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting WebView data directory", e);
        }
    }
    
    @TargetApi(Build.VERSION_CODES.P)
    private void setWebViewDataDirectory() {
        WebView.setDataDirectorySuffix("linkstash_webview");
        Log.d(TAG, "WebView data directory set");
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        // Initializes the Bridge
        // registerPlugins will be called automatically Bridge.initialize() is called.
        // However, if you are having problems with plugins not being found, you can manually register them here.
        // Bridge.registerPlugins(this, new ArrayList<Class<? extends Plugin>>() {{
        //     add(MainActivity.class); // Register MainActivity as a plugin
        // }});
        // The above is one way, but for Capacitor 3+ using the Application's onCreate is preferred for bridge init.

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