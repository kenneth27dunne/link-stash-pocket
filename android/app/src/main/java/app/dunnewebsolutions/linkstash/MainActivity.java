package app.dunnewebsolutions.linkstash;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.Bridge;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LinkStash:ShareHandler";
    private String pendingSharedText = null;
    private boolean isInitialized = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            // Try to ensure WebView is available
            if (WebViewCompat.getCurrentWebViewPackage(this) == null) {
                Log.e(TAG, "No WebView package found. Please install WebView.");
                // You might want to show a dialog here informing the user
            }
            
            // Add plugins before calling super.onCreate
            registerPlugin(ShareHandlerPlugin.class);
            
            // Call super after plugin registration but before handling intent
            super.onCreate(savedInstanceState);
            
            Log.d(TAG, "onCreate called");
            handleIntent(getIntent());
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        try {
            super.onNewIntent(intent);
            Log.d(TAG, "onNewIntent called with action: " + intent.getAction());
            handleIntent(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error in onNewIntent", e);
        }
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        try {
            // Add null check for bridge
            if (bridge != null) {
                bridge.saveInstanceState(outState);
            }
            super.onSaveInstanceState(outState);
        } catch (Exception e) {
            Log.e(TAG, "Error in onSaveInstanceState", e);
            super.onSaveInstanceState(outState);
        }
    }

    private void handleIntent(Intent intent) {
        try {
            String action = intent.getAction();
            String type = intent.getType();
            
            Log.d(TAG, "handleIntent - Action: " + action + ", Type: " + type);

            if (Intent.ACTION_SEND.equals(action) && type != null) {
                if (type.startsWith("text/")) {
                    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                    Log.d(TAG, "Received shared text: " + sharedText);
                    
                    if (sharedText != null) {
                        this.pendingSharedText = sharedText; // Always store it first
                        Log.d(TAG, "Stored shared text into pendingSharedText: " + this.pendingSharedText);
                        
                        // If bridge is ready and JS has already signaled it's initialized, send immediately.
                        // This handles shares when app is already warm and ShareHandler has called notifyShareHandlerReady.
                        if (bridge != null && this.isInitialized) {
                            Log.d(TAG, "Bridge and JS are ready, sending shared content immediately from handleIntent");
                            sendSharedContent(this.pendingSharedText);
                            this.pendingSharedText = null; // Clear after sending
                        } else {
                            Log.d(TAG, "Bridge not ready or JS not yet initialized. Shared text stored. Will send when JS signals ready.");
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling intent", e);
            e.printStackTrace();
        }
    }

    private String extractUrlFromText(String text) {
        // Fixed regex pattern to properly escape square brackets
        // The previous pattern had a closing bracket issue in character class
        String urlPattern = "https?://[\\w\\-\\.]+\\.[a-zA-Z]{2,}(?:/[\\w\\-\\._~:/?#\\[\\]@!\\$&'\\(\\)\\*\\+,;=]*)?";
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(urlPattern);
            java.util.regex.Matcher matcher = pattern.matcher(text);
            
            if (matcher.find()) {
                return matcher.group();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error extracting URL from text", e);
        }
        return text; // Return original text if no URL found or error occurs
    }

    public void sendSharedContent(String sharedText) {
        if (bridge != null) {
            try {
                Log.d(TAG, "Sending shared content to bridge: " + sharedText);
                bridge.getActivity().runOnUiThread(() -> {
                    try {
                        // Escape single quotes and other special characters
                        String escapedText = sharedText.replace("'", "\\'").replace("\n", "\\n");
                        
                        // Use a more reliable way to send the shared content
                        String jsCode = "if (window.linkstashSharedContent) { window.linkstashSharedContent = '" + 
                            escapedText + "'; } else { window.linkstashSharedContent = '" + 
                            escapedText + "'; window.dispatchEvent(new CustomEvent('shareReceived', { detail: { text: '" + 
                            escapedText + "' } })); }";
                        
                        Log.d(TAG, "Executing JS code");
                        bridge.eval(jsCode, null);
                    } catch (Exception e) {
                        Log.e(TAG, "Error executing JS code", e);
                        e.printStackTrace();
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Error in sendSharedContent", e);
                e.printStackTrace();
            }
        } else {
            Log.e(TAG, "Bridge is null, cannot send shared content");
        }
    }
    
    @Override
    public void onResume() {
        try {
            super.onResume();
            Log.d(TAG, "onResume called. isInitialized: " + this.isInitialized + ". Pending text: " + this.pendingSharedText);
            
            if (this.isInitialized && this.pendingSharedText != null && this.bridge != null) {
                Log.d(TAG, "onResume: JS is initialized and pending text exists. Attempting to send.");
                sendSharedContent(this.pendingSharedText);
                this.pendingSharedText = null;
            }

        } catch (Exception e) {
            Log.e(TAG, "Error in onResume", e);
        }
    }

    // These methods will be called by the plugin
    public void setShareHandlerInitialized(boolean initialized) {
        Log.d(TAG, "setShareHandlerInitialized called with: " + initialized);
        this.isInitialized = initialized;
    }
    
    public void checkPendingSharedContent() {
        Log.d(TAG, "checkPendingSharedContent called, pendingSharedText: " + this.pendingSharedText);
        if (this.pendingSharedText != null && this.bridge != null) {
            sendSharedContent(this.pendingSharedText);
            this.pendingSharedText = null;
        }
    }
} 