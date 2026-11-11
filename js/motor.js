// Motor del juego forense: funciones puras, sin DOM. Recibe el caso (js/caso.js) y el estado de la partida.

/** Deja un hash en minúsculas y sin espacios, dos puntos ni guiones. */
export function normalizarHash(texto) {
  return String(texto ?? '').toLowerCase().replace(/[\s:\-]/g, '');
}

const LARGOS = { 32: 'md5', 40: 'sha1', 64: 'sha256' };

/** 'md5' | 'sha1' | 'sha256' si parece un hash hexadecimal válido; null si no. */
export function algoritmoDeHash(texto) {
  const h = normalizarHash(texto);
  if (!/^[0-9a-f]+$/.test(h)) return null;
  return LARGOS[h.length] ?? null;
}

/**
 * Compara un hash escrito con el de referencia.
 * Devuelve { iguales, valido, prefijo (caracteres iguales desde el inicio), distintos (posiciones que difieren) }.
 */
export function compararHash(escrito, referencia) {
  const a = normalizarHash(escrito);
  const b = normalizarHash(referencia);
  let prefijo = 0;
  while (prefijo < a.length && prefijo < b.length && a[prefijo] === b[prefijo]) prefijo++;
  const distintos = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) distintos.push(i);
  return { iguales: a.length > 0 && a === b, valido: algoritmoDeHash(a) !== null, prefijo, distintos };
}

/**
 * Lee la salida de md5sum / sha256sum: «<hash> *archivo» (modo binario) o «<hash>  archivo».
 * Ignora líneas vacías o que no tengan forma de hash.
 */
export function parsearSumas(texto) {
  const filas = [];
  for (const linea of String(texto).split(/\r?\n/)) {
    const m = linea.trim().match(/^([0-9a-fA-F]{32}|[0-9a-fA-F]{40}|[0-9a-fA-F]{64})\s+(\*?)(.+)$/);
    if (!m) continue;
    filas.push({ hash: m[1].toLowerCase(), binario: m[2] === '*', archivo: m[3].trim() });
  }
  return filas;
}

/** Cruza lo calculado con el acta. Estado por archivo: 'coincide' | 'no-coincide' | 'sin-referencia'. */
export function verificarContraActa(calculados, acta) {
  const ref = new Map(acta.map((e) => [e.archivo, normalizarHash(e.md5)]));
  return calculados.map((c) => {
    const esperado = ref.get(c.archivo);
    const hash = normalizarHash(c.md5 ?? c.hash);
    const estado = esperado === undefined ? 'sin-referencia' : esperado === hash ? 'coincide' : 'no-coincide';
    return { archivo: c.archivo, hash, esperado: esperado ?? null, estado };
  });
}

/** Pasa «FF D8 ff e0» a [255, 216, 255, 224]. Devuelve [] si no es hexadecimal. */
export function bytesDeHex(texto) {
  const limpio = String(texto ?? '').trim();
  if (!/^([0-9a-fA-F]{2}\s*)+$/.test(limpio)) return [];
  return limpio.split(/\s+/).join('').match(/../g).map((p) => parseInt(p, 16));
}

/** Identifica el tipo real por la firma («número mágico»). Sin bytes hexadecimales → 'texto'. Sin firma conocida → null. */
export function detectarTipo(bytesTexto, firmas) {
  const bytes = bytesDeHex(bytesTexto);
  if (!bytes.length) return 'texto';
  const candidatas = firmas
    .filter((f) => f.bytes)
    .map((f) => ({ tipo: f.tipo, firma: bytesDeHex(f.bytes) }))
    .sort((x, y) => y.firma.length - x.firma.length);
  for (const { tipo, firma } of candidatas) {
    if (firma.length <= bytes.length && firma.every((b, i) => bytes[i] === b)) return tipo;
  }
  return null;
}

const EXTENSIONES = {
  jpeg: ['jpg', 'jpeg', 'jpe', 'jfif'],
  gif: ['gif'],
  png: ['png'],
  bmp: ['bmp'],
  zip: ['zip'],
  ole: ['doc', 'xls', 'ppt', 'msg'],
  exe: ['exe', 'dll', 'sys'],
  texto: ['txt', 'log', 'csv', 'md'],
};

/** true si la extensión del nombre no corresponde al tipo real (extensión falsa). */
export function extensionEnganosa(nombre, tipoReal) {
  const ext = String(nombre).split('.').pop().toLowerCase();
  const validas = EXTENSIONES[tipoReal];
  if (!validas) return false;
  return !validas.includes(ext);
}

/** Evalúa una pregunta de opción múltiple. */
export function evaluarEleccion(pregunta, opcionId) {
  const op = pregunta.opciones.find((o) => o.id === opcionId);
  if (!op) return { correcta: false, porque: 'Opción desconocida.' };
  return { correcta: Boolean(op.correcta), porque: op.porque ?? '' };
}

/** Respuesta correcta de una pregunta. */
export function opcionCorrecta(pregunta) {
  return pregunta.opciones.find((o) => o.correcta) ?? null;
}

/**
 * Evalúa las líneas marcadas como relevantes.
 * fraccion = (aciertos − falsos) / relevantes, acotada a [0, 1].
 */
export function evaluarMarcas(lineas, marcadas) {
  const set = new Set(marcadas);
  let aciertos = 0; let falsos = 0; let relevantes = 0;
  const omitidas = [];
  for (const l of lineas) {
    if (l.relevante) {
      relevantes++;
      if (set.has(l.id)) aciertos++; else omitidas.push(l.id);
    } else if (set.has(l.id)) falsos++;
  }
  const fraccion = relevantes ? Math.max(0, Math.min(1, (aciertos - falsos) / relevantes)) : 0;
  return { aciertos, falsos, relevantes, omitidas, fraccion };
}

/** Cuántas restricciones de precedencia cumple un orden. Un evento que falte rompe sus restricciones. */
export function evaluarOrden(orden, restricciones) {
  const pos = new Map(orden.map((id, i) => [id, i]));
  const rotas = [];
  for (const r of restricciones) {
    const [antes, despues] = r;
    if (!pos.has(antes) || !pos.has(despues) || pos.get(antes) >= pos.get(despues)) rotas.push(r);
  }
  const total = restricciones.length;
  return { cumplidas: total - rotas.length, total, rotas, fraccion: total ? (total - rotas.length) / total : 1 };
}

/** Mueve un evento `delta` posiciones (−1 sube, +1 baja). Devuelve un orden nuevo. */
export function moverEvento(orden, id, delta) {
  const i = orden.indexOf(id);
  if (i < 0) return [...orden];
  return moverA(orden, id, i + delta);
}

/** Lleva un evento a la posición `destino` (se acota a los límites). Devuelve un orden nuevo. */
export function moverA(orden, id, destino) {
  const copia = orden.filter((x) => x !== id);
  if (copia.length === orden.length) return [...orden];
  const j = Math.max(0, Math.min(copia.length, destino));
  copia.splice(j, 0, id);
  return copia;
}

/** Un orden que cumple todas las restricciones (orden topológico estable respecto a `eventos`), o null si hay un ciclo. */
export function ordenValido(eventos, restricciones) {
  const ids = eventos.map((e) => (typeof e === 'string' ? e : e.id));
  const entrantes = new Map(ids.map((id) => [id, 0]));
  const salientes = new Map(ids.map((id) => [id, []]));
  for (const [a, b] of restricciones) { salientes.get(a).push(b); entrantes.set(b, entrantes.get(b) + 1); }
  const resultado = [];
  const libres = ids.filter((id) => entrantes.get(id) === 0);
  while (libres.length) {
    libres.sort((x, y) => ids.indexOf(x) - ids.indexOf(y));
    const n = libres.shift();
    resultado.push(n);
    for (const m of salientes.get(n)) {
      entrantes.set(m, entrantes.get(m) - 1);
      if (entrantes.get(m) === 0) libres.push(m);
    }
  }
  return resultado.length === ids.length ? resultado : null;
}

/** ¿Abre la clave la cerradura? Sin distinguir mayúsculas ni espacios. */
export function probarClave(cerradura, clave) {
  const c = String(clave ?? '').trim().toLowerCase();
  return cerradura.claves.some((k) => k.toLowerCase() === c);
}

/** Rinocerontes únicos (por id) en el orden del caso. */
export function rinocerontesUnicos(ids, caso) {
  const set = new Set(ids);
  return caso.rinocerontes.filter((r) => set.has(r.id));
}

/** Cuenta por origen (red-ftp, usb-tallado…) para una gráfica. */
export function rinocerontesPorOrigen(caso) {
  const cuenta = {};
  for (const k of Object.keys(caso.origenes)) cuenta[k] = 0;
  for (const r of caso.rinocerontes) cuenta[r.origen] = (cuenta[r.origen] ?? 0) + 1;
  return cuenta;
}

/** Puntos de un paso: base × fracción − fallos − pistas, nunca negativo. */
export function puntosPaso({ fraccion = 1, fallos = 0, pistas = 0 }, puntos) {
  const base = Math.round(puntos.porPaso * Math.max(0, Math.min(1, fraccion)));
  return Math.max(0, base - fallos * puntos.fallo - pistas * puntos.pista);
}

/** Rango según el total. */
export function rango(total, rangos) {
  let r = rangos[0];
  for (const x of rangos) if (total >= x.desde) r = x;
  return r.nombre;
}

/** Puntuación máxima posible del caso. */
export function puntosMaximos(caso) {
  return caso.pasos.length * caso.puntos.porPaso;
}

/** Logros obtenidos. */
export function logros(caso, estado) {
  const res = [];
  const pasos = Object.values(estado.pasos ?? {});
  const rinos = rinocerontesUnicos(estado.rinocerontes ?? [], caso).length;
  if (pasos.length === caso.pasos.length && pasos.every((p) => (p.pistas ?? 0) === 0)) res.push('Sin pistas');
  if ((estado.pasos?.custodia?.fallos ?? 1) === 0) res.push('Cadena intacta');
  if (rinos === caso.rinocerontes.length) res.push(`${rinos} de ${caso.rinocerontes.length} rinocerontes`);
  if (estado.pasos?.linea && estado.pasos.linea.fraccion === 1) res.push('Cronista exacto');
  return res;
}

/** Lee la fecha de una línea de `unzip -v` («04-26-04 17:00» → «2004-04-26T17:00»). Años de 2 dígitos: 70–99 → 19xx. */
export function fechaDeUnzip(linea) {
  const m = String(linea).match(/(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, mes, dia, aa, hh, mm] = m;
  const anio = Number(aa) >= 70 ? `19${aa}` : `20${aa}`;
  return `${anio}-${mes}-${dia}T${hh}:${mm}`;
}

function linea(texto = '') { return `${texto}\n`; }
function titulo(t) { return `\n${t.toUpperCase()}\n${'-'.repeat(t.length)}\n`; }

/**
 * Informe forense en texto plano a partir del caso y del estado de la partida.
 * `fecha` se pasa desde fuera para que la función sea pura.
 */
export function generarInforme(caso, estado, fecha = '') {
  const total = Object.values(estado.pasos ?? {}).reduce((s, p) => s + (p.puntos ?? 0), 0);
  const max = puntosMaximos(caso);
  const rinos = rinocerontesUnicos(estado.rinocerontes ?? [], caso);
  let t = '';
  t += linea(`INFORME FORENSE · ${caso.expediente}`);
  t += linea(`Caso: ${caso.fuente.nombre}`);
  if (fecha) t += linea(`Fecha del informe: ${fecha}`);
  t += linea('Analista: (tu nombre)');
  t += linea('Naturaleza: ejercicio de formación sobre un caso público del NIST; no es un peritaje real.');

  t += titulo('1. Evidencias y cadena de custodia');
  for (const e of caso.evidencias) t += linea(`- ${e.archivo} · ${e.tipo} · MD5 ${e.md5}`);
  const hash = estado.pasos?.hash;
  t += linea(hash?.hecho
    ? '- MD5 de RHINOUSB.dd verificado contra el acta del NIST: coincide. Se descarta la copia de trabajo alterada.'
    : '- Integridad: pendiente de verificar.');

  t += titulo('2. Hallazgos en trazas y diario');
  t += linea('- Cuenta Telnet/FTP «gnome», prestada por Jeremy (diario recuperado).');
  t += linea('- rhino.log (FTP): subidas de rhino1.jpg, rhino3.jpg y contraband.zip.');
  t += linea('- rhino2.log (HTTP): descargas de rhino4.jpg y rhino5.gif.');
  t += linea('- rhino3.log (HTTP): descarga de rhino.exe (Microsoft DiskPart, no es una imagen).');
  t += linea('- Diario: borró el disco duro y lo tiró al río Misisipi; reformateó la USB después de escribir.');

  t += titulo(`3. Imágenes de rinoceronte recuperadas (${rinos.length} únicas; umbral legal ${caso.umbralLegal})`);
  for (const r of rinos) t += linea(`- ${r.archivo} · ${r.donde}${r.md5 ? ` · MD5 ${r.md5}` : ''}`);
  if (!rinos.length) t += linea('- Ninguna todavía.');
  t += linea('- Enlace USB ↔ red: rhino2.jpg tallada de la USB y la del zip FTP tienen el mismo MD5.');

  t += titulo('4. Línea de tiempo (orden propuesto)');
  const orden = estado.orden ?? [];
  const nombres = new Map(caso.pasos.find((p) => p.id === 'linea').eventos.map((e) => [e.id, e]));
  orden.forEach((id, i) => {
    const e = nombres.get(id);
    if (e) t += linea(`${String(i + 1).padStart(2, ' ')}. ${e.texto} [${e.fuente}]`);
  });
  if (orden.length) {
    const ev = evaluarOrden(orden, caso.pasos.find((p) => p.id === 'linea').restricciones);
    t += linea(`   Relaciones demostradas que se respetan: ${ev.cumplidas} de ${ev.total}.`);
  }

  t += titulo('5. Conclusión');
  const concl = caso.pasos.find((p) => p.id === 'conclusion');
  for (const q of concl.preguntas) {
    const elegida = q.opciones.find((o) => o.id === estado.conclusion?.[q.id]);
    t += linea(`- ${q.enunciado} ${elegida ? elegida.texto : '(sin responder)'}`);
  }
  t += linea('- Perfil SKRAM:');
  for (const l of concl.skram.letras) {
    const pistas = concl.skram.pistas.filter((p) => estado.skram?.[p.id] === l.id).map((p) => p.texto + (p.inferencia ? ' (inferencia)' : ''));
    t += linea(`    ${l.id} · ${l.nombre}: ${pistas.length ? pistas.join('; ') : '—'}`);
  }

  t += titulo('6. Puntuación');
  for (const p of caso.pasos) {
    const s = estado.pasos?.[p.id];
    t += linea(`- Paso ${p.numero} · ${p.titulo}: ${s?.puntos ?? 0} / ${caso.puntos.porPaso}${s?.pistas ? ` (${s.pistas} pista${s.pistas > 1 ? 's' : ''})` : ''}`);
  }
  t += linea(`Total: ${total} / ${max} · Rango: ${rango(total, caso.rangos)}`);
  const lg = logros(caso, estado);
  if (lg.length) t += linea(`Logros: ${lg.join(', ')}`);

  t += linea();
  t += linea(`Fuente del caso: ${caso.fuente.url} (imagen de ${caso.fuente.autor}, DFRWS 2005).`);
  return t;
}
