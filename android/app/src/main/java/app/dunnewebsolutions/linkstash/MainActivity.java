package app.dunnewebsolutions.linkstash;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.Bridge;

@CapacitorPlugin(name = "ShareHandler")
public class MainActivity extends BridgeActivity {
    private static final String TAG = "LinkStash:ShareHandler";
    private String pendingSharedText = null;
    private boolean isInitialized = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate called");
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "onNewIntent called with action: " + intent.getAction());
        handleIntent(intent);
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
                        // Store the original text first
                        pendingSharedText = sharedText;
                        Log.d(TAG, "Stored original shared text: " + pendingSharedText);
                        
                        // If the bridge is ready and initialized, send the event immediately
                        if (bridge != null && isInitialized) {
                            Log.d(TAG, "Bridge is ready, sending shared content immediately");
                            sendSharedContent(sharedText);
                        } else {
                            Log.d(TAG, "Bridge not ready or not initialized, will send later");
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
        // Regular expression to match URLs
        String urlPattern = "https?://[\\w\\-\\.]+\\.[a-zA-Z]{2,}(?:/[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=]*)?";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(urlPattern);
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private void sendSharedContent(String sharedText) {
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
        super.onResume();
        Log.d(TAG, "onResume called, isInitialized: " + isInitialized);
        
        // Check if we have pending shared content and the bridge is ready
        if (pendingSharedText != null && bridge != null) {
            Log.d(TAG, "Found pending shared text: " + pendingSharedText);
            // Wait a bit to ensure the app is fully initialized
            bridge.getActivity().runOnUiThread(() -> {
                try {
                    Log.d(TAG, "Waiting for app initialization...");
                    Thread.sleep(1000); // Give the app time to initialize
                    isInitialized = true;
                    Log.d(TAG, "App initialized, sending pending shared content");
                    sendSharedContent(pendingSharedText);
                    pendingSharedText = null;
                } catch (InterruptedException e) {
                    Log.e(TAG, "Error while waiting for initialization", e);
                    e.printStackTrace();
                }
            });
        }
    }
} 