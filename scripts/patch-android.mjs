/* =====================================================================
   patch-android.mjs — ajusta el proyecto Android que genera `npx cap add android`.
   Ejecutar DESPUÉS de `cap sync`, desde la raíz del repo. Es idempotente.
     · MainActivity: pantalla completa inmersiva en TODOS los Android (API 22+, incluido Android 9),
       zona del notch incluida y pantalla siempre encendida
     · AndroidManifest: solo horizontal (sensor), largeHeap
     · app/build.gradle: versión, ABIs armeabi-v7a + arm64-v8a (APK universal), firma por variables
       de entorno, androidx.core, lint sin bloquear el release
     · gradle.properties: memoria para Gradle (el APK lleva ~130 MB de assets)
     · iconos de resources/android/res
   Variables: APP_VERSION_NAME, APP_VERSION_CODE, ANDROID_KEYSTORE_PATH / _PASSWORD, ANDROID_KEY_ALIAS / _PASSWORD
   ===================================================================== */
import { readFileSync, writeFileSync, existsSync, readdirSync, cpSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();
const APP = join(ROOT, 'android', 'app');
const MAIN = join(APP, 'src', 'main');
const cfg = JSON.parse(readFileSync(join(ROOT, 'capacitor.config.json'), 'utf8'));
const appId = cfg.appId;
const versionName = process.env.APP_VERSION_NAME || '1.0';
const versionCode = process.env.APP_VERSION_CODE || '1';
const BG = '#1b1230';   // fondo del icono adaptable

const fail = m => { console.error('✘ patch-android: ' + m); process.exit(1); };
const rd = p => readFileSync(p, 'utf8');
if (!existsSync(APP)) fail('no existe android/app (¿falta `npx cap add android`?)');

/* ---------- 1) MainActivity.java: pantalla completa inmersiva ---------- */
function findFile(dir, name) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (e === name) return p;
  }
  return null;
}
const javaDir = join(MAIN, 'java');
let activityPath = findFile(javaDir, 'MainActivity.java');
if (!activityPath) { activityPath = join(javaDir, ...appId.split('.'), 'MainActivity.java'); mkdirSync(dirname(activityPath), { recursive: true }); }
writeFileSync(activityPath, `package ${appId};

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * FNF GamerCB: pantalla completa inmersiva en todos los Android.
 *  - API 30+ : WindowInsetsController (oculta barra de estado y de navegación; reaparecen con un deslizamiento y se vuelven a ocultar).
 *  - API 21-29 (incluido Android 9 / API 28): banderas SYSTEM_UI_FLAG_IMMERSIVE_STICKY.
 *  - API 28+ : la pantalla usa también la zona del notch / recorte (layoutInDisplayCutoutMode).
 *  - La pantalla se mantiene encendida mientras se juega.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        enterFullscreen();
    }

    @Override
    public void onResume() {
        super.onResume();
        enterFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterFullscreen();
    }

    private void enterFullscreen() {
        final Window window = getWindow();

        // Usar también la zona del notch (Android 9+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                    : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }

        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        WindowCompat.setDecorFitsSystemWindows(window, false);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            controller.hide(WindowInsetsCompat.Type.systemBars());
        }

        // Android 5 - 10: refuerzo con las banderas clásicas (en Android 9 son las que mandan)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }
}
`);
console.log('✔ MainActivity.java (pantalla completa inmersiva) →', activityPath.replace(ROOT + '/', ''));

/* ---------- 2) AndroidManifest.xml ---------- */
const manPath = join(MAIN, 'AndroidManifest.xml');
let man = rd(manPath);
man = man.replace(/<activity\b([^>]*)>/, (all, attrs) => attrs.includes('android:screenOrientation') ? all : `<activity${attrs}\n            android:screenOrientation="sensorLandscape">`);
man = man.replace(/<application\b([^>]*)>/, (all, attrs) => {
  if (!attrs.includes('android:largeHeap')) attrs += '\n        android:largeHeap="true"';
  if (!attrs.includes('android:hardwareAccelerated')) attrs += '\n        android:hardwareAccelerated="true"';
  return `<application${attrs}>`;
});
if (!man.includes('sensorLandscape')) fail('no pude fijar la orientación en AndroidManifest.xml');
writeFileSync(manPath, man);
console.log('✔ AndroidManifest.xml (horizontal, largeHeap)');

/* ---------- 3) app/build.gradle ---------- */
const gPath = join(APP, 'build.gradle');
let g = rd(gPath);
const before = g;
g = g.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`).replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
if (!/versionCode\s+\d+/.test(g) || !g.includes(`versionName "${versionName}"`)) fail('no encontré versionCode/versionName en app/build.gradle');
if (!g.includes('abiFilters')) {
  g = g.replace(/(versionName\s+"[^"]*"[^\n]*\n)/, (m) => `${m}        ndk { abiFilters 'armeabi-v7a', 'arm64-v8a' }\n`);
  if (!g.includes('abiFilters')) fail('no pude añadir abiFilters');
}
if (!g.includes('signingConfigs')) {
  const block = `    signingConfigs {
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
    lint {
        abortOnError false
        checkReleaseBuilds false
    }
`;
  g = g.replace(/(\n[ \t]*)buildTypes\s*\{/, (m, ws) => `\n${block}${ws}buildTypes {`);
  g = g.replace(/(buildTypes\s*\{\s*release\s*\{)/, (m) => `${m}\n            if (System.getenv("ANDROID_KEYSTORE_PATH")) {\n                signingConfig signingConfigs.release\n            }`);
  if (!g.includes('signingConfig signingConfigs.release')) fail('no pude añadir la firma al buildType release');
}
if (!g.includes('androidx.core:core:')) g = g.replace(/dependencies\s*\{/, (m) => `${m}\n    implementation "androidx.core:core:1.12.0"`);
if (g !== before) writeFileSync(gPath, g);
console.log(`✔ app/build.gradle (versión ${versionName} / ${versionCode}, ABIs armeabi-v7a + arm64-v8a, firma)`);

/* ---------- 4) gradle.properties ---------- */
const gpPath = join(ROOT, 'android', 'gradle.properties');
if (existsSync(gpPath)) {
  let gp = rd(gpPath);
  const jvm = 'org.gradle.jvmargs=-Xmx3072m -Dfile.encoding=UTF-8';
  gp = /^org\.gradle\.jvmargs=.*$/m.test(gp) ? gp.replace(/^org\.gradle\.jvmargs=.*$/m, jvm) : gp.trimEnd() + '\n' + jvm + '\n';
  writeFileSync(gpPath, gp);
  console.log('✔ gradle.properties (memoria de Gradle)');
}

/* ---------- 5) iconos ---------- */
const resSrc = join(ROOT, 'resources', 'android', 'res');
if (existsSync(resSrc)) {
  cpSync(resSrc, join(MAIN, 'res'), { recursive: true, force: true });
  const bgPath = join(MAIN, 'res', 'values', 'ic_launcher_background.xml');
  mkdirSync(dirname(bgPath), { recursive: true });
  writeFileSync(bgPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);
  console.log('✔ iconos del launcher');
}
console.log('✔ proyecto Android listo para: cd android && ./gradlew assembleRelease');
