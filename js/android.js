/* =====================================================================
   android.js — v4.1.0: integración con Android
   · APK (Capacitor): pantalla completa inmersiva NATIVA (MainActivity.java: oculta barra de estado y
     de navegación, usa toda la pantalla incluida la zona del notch, pantalla siempre encendida) —
     funciona desde Android 5 hasta Android 15, incluido Android 9 (API 28).
   · Navegador de Android (Chrome / WebView): pantalla completa con el primer toque, bloqueo horizontal
     y pantalla siempre encendida (Wake Lock). Con "Añadir a pantalla de inicio" se abre ya en
     pantalla completa (manifest.webmanifest, display: fullscreen).
   · Botón "Atrás" de Android: abre la pausa / vuelve en los menús (no cierra el juego sin querer).
   ===================================================================== */
'use strict';

(function () {
  if (!Platform.android && !Platform.native) return;
  document.body.classList.add('android');
  if (Platform.native) document.body.classList.add('app-android');

  /* ---------- pantalla completa ---------- */
  if (Platform.native || Platform.standalone) {
    // ya es pantalla completa (la hace la app / el icono instalado): sin botón ni petición del navegador
    const baseSync = Movil.syncFs.bind(Movil);
    Movil.syncFs = function () { baseSync(); const b = $('fsBtn'); if (b) b.hidden = true; };
    Movil.fullscreen = async function () { setTimeout(resize, 250); return true; };
    Movil.syncFs();
  } else if (!Movil.isIOS() && params.get('fs') !== '0') {
    // navegador de Android: el navegador exige un gesto del usuario → se pide con el PRIMER toque
    const first = () => { if (!Movil.isFs() && !Movil.portrait) Movil.fullscreen(); };
    document.addEventListener('touchend', first, { once: true, capture: true });
  }

  /* ---------- pantalla siempre encendida (navegador): Wake Lock ---------- */
  if (!Platform.native && navigator.wakeLock && navigator.wakeLock.request) {
    let lock = null;
    const ask = async () => { try { if (!lock && document.visibilityState === 'visible') { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; } };
    document.addEventListener('touchend', ask, { once: true, capture: true });
    document.addEventListener('visibilitychange', ask);
  }

  /* ---------- botón "Atrás" del APK ---------- */
  if (Platform.native && window.Capacitor && typeof Capacitor.registerPlugin === 'function') {
    try {
      const App = Capacitor.registerPlugin('App');
      App.addListener('backButton', () => {
        if (Loader.active) return;
        if (ModUI.open) { ModUI.hide(); return; }
        if (G.overlayKind) goBack(); else togglePause();
      });
    } catch (e) { console.warn('[android] botón Atrás:', e); }
  }
})();
