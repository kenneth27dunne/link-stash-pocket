package app.dunnewebsolutions.linkstash;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShareHandler")
public class ShareHandlerPlugin extends Plugin {
    private static final String TAG = "LinkStash:ShareHandler";
    
    @PluginMethod
    public void notifyShareHandlerReady(PluginCall call) {
        Log.d(TAG, "notifyShareHandlerReady called from JS");
        MainActivity mainActivity = (MainActivity) getActivity();
        if (mainActivity != null) {
            mainActivity.setShareHandlerInitialized(true);
            mainActivity.checkPendingSharedContent();
        } else {
            Log.e(TAG, "MainActivity is null in notifyShareHandlerReady");
        }
        call.resolve();
    }
} 