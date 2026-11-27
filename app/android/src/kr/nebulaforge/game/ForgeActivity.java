package kr.nebulaforge.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.text.InputType;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import kr.nebulaforge.game.test.R;

/**
 * The app is a window onto the game server: it opens the server's address and stays on it.
 * The game, its files and the player's account all live on the server, so the app and the web
 * version always show the same game and an update on the server reaches both at once.
 */
public final class ForgeActivity extends Activity {
    private static final int OPEN_SAVE = 1, CREATE_SAVE = 2;
    private static final String PREFS = "forge", KEY_SERVER = "server";
    // Asks the game to close whatever is open. Returns true when it closed something.
    private static final String BACK_SCRIPT =
        "(function(){try{" +
        "if(typeof miniStageOpen==='function'&&miniStageOpen()){closeMinigame();return true}" +
        "if(typeof view!=='undefined'&&(view||activeScreen!=='home')){closeMenu();return true}" +
        "}catch(e){}return false})()";
    private static final String SAVE_SCRIPT =
        "(function(){try{if(typeof saveGuard!=='undefined'&&saveGuard.sync)saveGuard.sync(true);" +
        "else if(typeof save==='function'&&typeof s!=='undefined'&&s)save()}catch(e){}})()";

    private WebView game;
    private View splash;
    private TextView percent, label;
    private ProgressBar progress;
    private Button retry, address;
    private int shown;
    private boolean failed;
    private Uri home;
    private String exportData;
    private ValueCallback<Uri[]> fileCallback;
    private final Handler timer = new Handler(android.os.Looper.getMainLooper());
    private final Runnable timeout = () -> showError("서버가 응답하지 않습니다");

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        fullscreen();
        setContentView(R.layout.game);
        game = findViewById(R.id.game);
        splash = findViewById(R.id.splash);
        percent = findViewById(R.id.percent);
        progress = findViewById(R.id.progress);
        label = findViewById(R.id.loadingLabel);
        retry = findViewById(R.id.retry);
        address = findViewById(R.id.address);
        retry.setOnClickListener(v -> launch());
        address.setOnClickListener(v -> askAddress());
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptCookie(true);
        game.setBackgroundColor(Color.rgb(19, 18, 29));
        // The bridge is only ever offered to pages of the game server: every other address opens outside the app.
        game.addJavascriptInterface(new MobileHost(), "ForgeApp");
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest request) {
                Uri target = request.getUrl();
                if (sameServer(target)) return false;
                if (request.isForMainFrame() && ("https".equals(target.getScheme()) || "http".equals(target.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, target)); }
                    catch (android.content.ActivityNotFoundException ignored) { /* no browser installed */ }
                }
                return true;
            }
            @Override public void onPageFinished(WebView w, String url) {
                if (failed || !sameServer(Uri.parse(url))) return;
                // The page is in; give the game a moment to draw its first frame before the cover lifts.
                timer.postDelayed(() -> { if (!failed) ready(); }, 600);
            }
            @Override public void onReceivedError(WebView w, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showError("서버에 연결하지 못했습니다");
            }
            @Override public void onReceivedHttpError(WebView w, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showError("서버가 점검 중이거나 응답하지 않습니다");
            }
        });
        game.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView w, int value) {
                if (splash.getVisibility() == View.VISIBLE) updateProgress(value * 95 / 100);
            }
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> result, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = result;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try { startActivityForResult(intent, OPEN_SAVE); }
                catch (android.content.ActivityNotFoundException e) { fileCallback.onReceiveValue(null); fileCallback = null; }
                return true;
            }
        });
        home = serverAddress();
        if (home == null) askAddress(); else launch();
    }

    /** The address built into the app, or failing that the one typed in on a test build. */
    private Uri serverAddress() {
        String built = getString(R.string.server_url).trim();
        String typed = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER, "");
        return parseAddress(built.isEmpty() ? typed : built);
    }
    private Uri parseAddress(String text) {
        if (text == null) return null;
        text = text.trim();
        if (text.isEmpty()) return null;
        if (!text.contains("://")) text = (getResources().getBoolean(R.bool.allow_http) ? "http://" : "https://") + text;
        Uri uri = Uri.parse(text);
        boolean https = "https".equals(uri.getScheme());
        boolean http = "http".equals(uri.getScheme()) && getResources().getBoolean(R.bool.allow_http);
        if (!(https || http) || uri.getHost() == null || uri.getHost().isEmpty()) return null;
        return uri.buildUpon().path("/").clearQuery().fragment(null).build();
    }
    private boolean sameServer(Uri uri) {
        return home != null && uri != null && home.getScheme().equals(uri.getScheme())
            && home.getHost().equalsIgnoreCase(uri.getHost() == null ? "" : uri.getHost()) && home.getPort() == uri.getPort();
    }
    /** Test builds have no address built in; the tester types the server's address once. */
    private void askAddress() {
        if (!getString(R.string.server_url).trim().isEmpty()) return;
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setHint(getResources().getBoolean(R.bool.allow_http) ? "예: 13.125.0.10 또는 game.example.com" : "예: game.example.com");
        input.setText(getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER, ""));
        new AlertDialog.Builder(this).setTitle("게임 서버 주소").setView(input).setCancelable(home != null)
            .setPositiveButton("접속", (dialog, which) -> {
                Uri typed = parseAddress(input.getText().toString());
                if (typed == null) { message("주소를 확인해 주세요"); askAddress(); return; }
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_SERVER, typed.toString()).apply();
                home = typed;
                game.clearHistory();
                launch();
            }).show();
    }

    private void fullscreen() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) fullscreen();
    }
    private void launch() {
        if (home == null) { askAddress(); return; }
        shown = 0; failed = false;
        splash.setVisibility(View.VISIBLE);
        retry.setVisibility(View.GONE);
        address.setVisibility(View.GONE);
        label.setText("게임 불러오는 중");
        progress.setProgress(0);
        percent.setText("0%");
        timer.removeCallbacksAndMessages(null);
        timer.postDelayed(timeout, 60000);
        game.loadUrl(home.toString());
    }
    private void ready() {
        if (isFinishing() || isDestroyed()) return;
        timer.removeCallbacks(timeout);
        updateProgress(100);
        splash.setVisibility(View.GONE);
        game.requestFocus();
    }
    private void updateProgress(int value) {
        if (failed || value <= shown) return;
        shown = Math.min(100, value);
        progress.setProgress(shown);
        percent.setText(shown + "%");
    }
    private void showError(String text) {
        timer.removeCallbacksAndMessages(null);
        failed = true;
        splash.setVisibility(View.VISIBLE);
        label.setText(text + "\n인터넷 연결을 확인한 뒤 다시 시도해 주세요");
        retry.setVisibility(View.VISIBLE);
        address.setVisibility(getString(R.string.server_url).trim().isEmpty() ? View.VISIBLE : View.GONE);
    }

    /** What the game's page may ask of the app. */
    public final class MobileHost {
        @JavascriptInterface public void ready() { runOnUiThread(() -> { if (!failed) ForgeActivity.this.ready(); }); }
        @JavascriptInterface public void exportJson(String json) {
            if (json == null || json.length() > 8000000) return;
            runOnUiThread(() -> {
                if (exportData != null) return;
                exportData = json;
                Intent pick = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("application/json").putExtra(Intent.EXTRA_TITLE, "성운의모루_저장.json");
                try { startActivityForResult(pick, CREATE_SAVE); }
                catch (android.content.ActivityNotFoundException e) { exportData = null; message("파일 저장 앱을 열 수 없습니다"); }
            });
        }
    }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        Uri file = result == RESULT_OK && data != null ? data.getData() : null;
        if (code == OPEN_SAVE && fileCallback != null) {
            fileCallback.onReceiveValue(file != null && "content".equals(file.getScheme()) ? new Uri[]{file} : null);
            fileCallback = null;
        } else if (code == CREATE_SAVE) {
            String contents = exportData;
            exportData = null;
            if (contents == null || file == null || !"content".equals(file.getScheme())) return;
            try (OutputStream stream = getContentResolver().openOutputStream(file, "wt")) {
                if (stream == null) throw new IOException();
                stream.write(contents.getBytes(StandardCharsets.UTF_8));
                message("저장 파일을 내보냈습니다");
            } catch (IOException | SecurityException e) { message("파일을 저장하지 못했습니다"); }
        }
    }
    private void message(String text) { Toast.makeText(this, text, Toast.LENGTH_SHORT).show(); }

    @Override public void onBackPressed() {
        if (splash.getVisibility() == View.VISIBLE) { finish(); return; }
        game.evaluateJavascript(BACK_SCRIPT, handled -> {
            if (isFinishing() || "true".equals(handled)) return;
            new AlertDialog.Builder(this).setMessage("게임을 종료할까요?").setNegativeButton("계속하기", null)
                .setPositiveButton("종료", (dialog, which) -> game.evaluateJavascript(SAVE_SCRIPT, ignored -> finish())).show();
        });
    }
    @Override protected void onPause() {
        game.evaluateJavascript(SAVE_SCRIPT, null);
        CookieManager.getInstance().flush();
        game.onPause(); super.onPause();
    }
    @Override protected void onResume() { super.onResume(); game.onResume(); }
    @Override protected void onDestroy() {
        timer.removeCallbacksAndMessages(null);
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        game.removeJavascriptInterface("ForgeApp");
        ((android.view.ViewGroup) game.getParent()).removeView(game);
        game.destroy();
        super.onDestroy();
    }
}
