/* =====================================================================
   polyfills.js — v4.1.0
   APIs modernas que usa el juego y que un WebView viejo no trae (Android 9 con
   el WebView de fábrica, Chrome 66-75). Se carga PRIMERO. Si el navegador ya
   las tiene, no hace nada. (La sintaxis moderna — ?. ?? — la baja el APK al compilar.)
   ===================================================================== */
(function () {
  'use strict';
  const def = (o, k, f) => { if (o && !o[k]) Object.defineProperty(o, k, { value: f, writable: true, configurable: true }); };

  if (typeof globalThis === 'undefined') window.globalThis = window;

  /* Array */
  const flatten = (a, d, out) => { for (let i = 0; i < a.length; i++) { const v = a[i]; if (Array.isArray(v) && d > 0) flatten(v, d - 1, out); else if (i in a) out.push(v); } return out; };
  def(Array.prototype, 'flat', function (d) { return flatten(this, d === undefined ? 1 : Math.floor(d), []); });
  def(Array.prototype, 'flatMap', function (fn, th) { return flatten(this.map(fn, th), 1, []); });

  /* .at() de Array, String y arrays tipados */
  const at = function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; };
  [Array, String, Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array].forEach(C => def(C.prototype, 'at', at));

  /* Object */
  def(Object, 'fromEntries', function (it) { const o = {}; for (const [k, v] of it) o[k] = v; return o; });
  def(Object, 'hasOwn', function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); });

  /* String */
  def(String.prototype, 'matchAll', function (re) {
    if (!(re instanceof RegExp)) re = new RegExp(re, 'g');
    else if (!re.global) throw new TypeError('String.prototype.matchAll called with a non-global RegExp argument');
    const r = new RegExp(re.source, re.flags), s = String(this), out = []; r.lastIndex = re.lastIndex;
    let m; while ((m = r.exec(s))) { out.push(m); if (m[0] === '') r.lastIndex++; }
    return out[Symbol.iterator]();
  });
  def(String.prototype, 'replaceAll', function (a, b) {
    const s = String(this);
    if (a instanceof RegExp) { if (!a.global) throw new TypeError('replaceAll must be called with a global RegExp'); return s.replace(a, b); }
    return s.replace(new RegExp(String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), b);
  });
  def(String.prototype, 'trimStart', String.prototype.trimLeft);
  def(String.prototype, 'trimEnd', String.prototype.trimRight);

  /* Promise */
  def(Promise, 'allSettled', function (ps) {
    return Promise.all(Array.from(ps, p => Promise.resolve(p).then(value => ({ status: 'fulfilled', value }), reason => ({ status: 'rejected', reason }))));
  });

  /* Blob.arrayBuffer() / .text() (Chrome < 76): se usan para leer mods, audio y .zip */
  if (typeof Blob !== 'undefined') {
    const read = (blob, how) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r[how](blob); });
    def(Blob.prototype, 'arrayBuffer', function () { return read(this, 'readAsArrayBuffer'); });
    def(Blob.prototype, 'text', function () { return read(this, 'readAsText'); });
  }
})();
