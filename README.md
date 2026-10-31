# Test Song · Chart Editor GCD

Aquí podrás jugar Mods de FNF dependiendo de que tan bueno sea tu PC o Celular compatible con Psych Engine, Codename Engine, V-Slice y Kade Engine que por cierto esta pagina te garantiza también un FNF que será compatible con el Chart Editor GCD un herramienta que te permite chartear en FNF V-Slice específicamente para móviles de ese modo podrán probar su mod o su chart

# Algunos Avances De Este Proyecto

1. Se ha podido implementar mods de V-Slice
2. Se puede Implementar mods de Psych, Codename, Kade engine
3. se implementa song, chart y eventos (dependiendo de el engine)
4. Se carga los assets de el mod con seleccionar la carpeta
5. Hay compatibilidad con .hxc
6. Próximamente se va a integrar los personajes oficiales de FNF
7. Próximamente se implementara la compatibilidad con el Chart Editor GCD
8. Este FNF GCD contiene optimización desde el mismo juego
9. Este FNF GCD es compatible con varios dispositivos tras ser algo liviano
10. **v4.1.0:** APK universal para Android (armeabi-v7a + arm64-v8a) compilado por GitHub Actions y publicado en Releases
11. **v4.1.0:** Pantalla completa inmersiva en todos los Android (incluido Android 9, con notch) y pantalla siempre encendida
12. **v4.1.0:** Mods por **.zip** en Android (el navegador de Android no deja elegir carpetas), lector de .zip con ZIP64 y sin cargar el archivo entero en memoria
13. **v4.1.0:** Compatible con WebView viejo de Android 9 (sintaxis bajada con esbuild + polyfills + inflate de respaldo)
14. **v4.1.0:** Calidad gráfica inicial automática en celulares con poca RAM

# MIS REDES SOCIALES:
- YouTube (Principal): https://www.youtube.com/@GamerCB2026
- Instagram: https://www.instagram.com/deiby123rodriguez/
- X (Twitter): https://x.com/GamerCB2025
- Grupo De Discord: https://discord.gg/GXyxff8sQM
- TikTok: https://www.tiktok.com/@gamer_countryballs

# 📱 APK para Android

## Descargar
En la pestaña **Releases** del repo está el archivo `FNF-GamerCB-<versión>-universal.apk` (sirve para celulares de 32 y 64 bits, Android 5.1 o superior).

## Cómo se genera un release
1. Cambia `VERSION` en `js/config.js` (y `version` en `package.json`) si quieres un número nuevo.
2. Sube una etiqueta: `git tag v4.1.0 && git push origin v4.1.0`
   (o entra a **Actions → APK Universal (Android) → Run workflow**).
3. El workflow (`.github/workflows/android-apk.yml`) empaqueta el juego con Capacitor, compila el APK y lo publica en **Releases**.

## Firma del APK (para poder actualizar sin desinstalar)
Sin configuración, cada compilación genera una clave nueva y Android pedirá desinstalar la versión anterior.
Para mantener siempre la misma clave crea estos **Secrets** en *Settings → Secrets and variables → Actions*:

| Secret | Contenido |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | tu `.keystore` en base64 (`base64 -w0 release.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del keystore |
| `ANDROID_KEY_ALIAS` | alias de la clave |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave |

Para crear el keystore: `keytool -genkeypair -keystore release.keystore -alias gamercb -keyalg RSA -keysize 2048 -validity 10000`
(guárdalo bien y **no lo subas al repo**).

## Notas
- **Mods en Android:** Pausa → *Chart y modo* → elige el motor → **🗜 .zip del mod**.
- **Pantalla completa:** en el APK es nativa (barra de estado y navegación ocultas, usa también la zona del notch). En el navegador de Android se activa con el primer toque; con *Añadir a pantalla de inicio* se abre ya a pantalla completa y en horizontal.
- El proyecto Android **no** se guarda en el repo: se genera en cada build (`android/` y `www/` están en `.gitignore`).
