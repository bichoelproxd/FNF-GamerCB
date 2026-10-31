/* =====================================================================
   prepare-web.mjs — copia el juego web a www/ (la carpeta que empaqueta Capacitor en el APK)
   y BAJA la sintaxis moderna de los JS (?. ?? ...) para que corra también en el WebView
   viejo de Android 9 (Chrome 66). Si esbuild no puede con un archivo, se copia tal cual.
   Uso: node scripts/prepare-web.mjs
   ===================================================================== */
import { cpSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'www');
const TARGET = 'chrome66';   // WebView de fábrica de Android 9

// Lo que NO va dentro del APK (el resto de carpetas/archivos del repo sí: assets, songs, weeks, shared…)
const EXCLUDE = new Set([
  'node_modules', 'www', 'android', 'dist', 'scripts', 'resources', 'herramientas',
  'package.json', 'package-lock.json', 'capacitor.config.json', 'README.md', 'LICENSE',
]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const name of readdirSync(ROOT)) {
  if (EXCLUDE.has(name) || name.startsWith('.')) continue;
  cpSync(join(ROOT, name), join(OUT, name), { recursive: true });
  copied++;
}
if (!existsSync(join(OUT, 'index.html'))) { console.error('✘ No se encontró index.html en la raíz del repo'); process.exit(1); }
console.log(`✔ ${copied} elementos copiados a www/`);

let esbuild = null;
try { esbuild = await import('esbuild'); } catch { console.warn('⚠ esbuild no está instalado: los JS se copian sin bajar la sintaxis (Android 9 con WebView viejo podría fallar)'); }

if (esbuild) {
  const dir = join(OUT, 'js');
  let ok = 0, skipped = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;                 // js/vendor/ (fengari) ya es ES5
    const p = join(dir, f);
    try {
      const r = esbuild.transformSync(readFileSync(p, 'utf8'), { loader: 'js', target: TARGET, legalComments: 'none' });
      writeFileSync(p, r.code);
      ok++;
    } catch (e) {
      skipped.push(f);
      console.warn(`⚠ ${f}: esbuild no pudo bajarlo a ${TARGET} (${String(e.message).split('\n')[0]}); se deja el original`);
    }
  }
  console.log(`✔ JS compatibles con ${TARGET}: ${ok} archivo(s)${skipped.length ? ' · sin cambios: ' + skipped.join(', ') : ''}`);
}
