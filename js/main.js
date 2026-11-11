// Interfaz del juego. Toda la lógica del caso está en caso.js (datos) y motor.js (reglas puras).
import { CASO } from './caso.js';
import {
  compararHash, normalizarHash, detectarTipo, extensionEnganosa, evaluarEleccion,
  evaluarMarcas, evaluarOrden, moverEvento, moverA, probarClave, rinocerontesUnicos,
  puntosPaso, rango, puntosMaximos, logros, generarInforme,
} from './motor.js';
import { iniciarTema } from './tema.js';
import { iniciarSonido, sonar } from './sonido.js';

// ---------------------------------------------------------------- utilidades DOM
function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of hijos.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}
const $ = (sel) => document.querySelector(sel);
const NOMBRE_TIPO = Object.fromEntries(CASO.firmas.map((f) => [f.tipo, f.nombre]));

// ---------------------------------------------------------------- estado
function estadoNuevo() {
  return {
    actual: 0,
    desbloqueado: 0,
    final: false,
    pasos: {},
    rinocerontes: [],
    resueltas: new Set(),
    hashOk: false,
    marcas: new Set(),
    marcasEntregadas: false,
    clasificados: {},
    abiertas: {},
    orden: [...CASO.pasos.find((p) => p.id === 'linea').inicial],
    ordenEntregado: false,
    conclusion: {},
    skram: {},
    skramOk: false,
    pistasVistas: {},
  };
}
let E = estadoNuevo();

const reg = (id) => (E.pasos[id] ??= { fallos: 0, pistas: 0, fraccion: 1, puntos: 0, hecho: false });
const pasoActual = () => CASO.pasos[E.actual];

let recien = new Set();
function sumarRinos(ids) {
  let nuevos = 0;
  for (const id of ids) if (id && !E.rinocerontes.includes(id)) { E.rinocerontes.push(id); recien.add(id); nuevos++; }
  if (nuevos) { sonar('rino'); pintarHud(); }
}

function fallo(paso) { reg(paso.id).fallos++; sonar('fallo'); pintarHud(); }

function completar(paso, fraccion = 1) {
  const r = reg(paso.id);
  if (r.hecho) return;
  r.hecho = true;
  r.fraccion = fraccion;
  r.puntos = puntosPaso(r, CASO.puntos);
  E.desbloqueado = Math.max(E.desbloqueado, E.actual + 1);
  sonar('paso');
  pintarHud();
  pintarCierre(paso);
}

// ---------------------------------------------------------------- HUD
function pintarHud() {
  const lista = $('#pasos');
  lista.replaceChildren(...CASO.pasos.map((p, i) => {
    const r = E.pasos[p.id];
    const estado = r?.hecho ? 'hecho' : i === E.actual && !E.final ? 'actual' : i <= E.desbloqueado ? 'abierto' : 'cerrado';
    return h('li', { class: `paso-pill ${estado}` },
      h('button', {
        type: 'button',
        disabled: i > E.desbloqueado,
        'aria-current': i === E.actual && !E.final ? 'step' : null,
        'aria-label': `Paso ${p.numero}: ${p.titulo}${r?.hecho ? ' (hecho)' : ''}`,
        onclick: () => irA(i),
      }, h('span', { class: 'num' }, p.numero), h('span', { class: 'nom' }, p.titulo)));
  }));
  const total = Object.values(E.pasos).reduce((s, p) => s + (p.puntos ?? 0), 0);
  $('#puntos').textContent = total;
  $('#pistas').textContent = Object.values(E.pasos).reduce((s, p) => s + (p.pistas ?? 0), 0);
  const unicos = E.rinocerontes.length;
  $('#rinos-n').textContent = unicos;
  const ranuras = $('#ranuras');
  ranuras.replaceChildren(...CASO.rinocerontes.map((_, i) => {
    const id = E.rinocerontes[i];
    const r = id && CASO.rinocerontes.find((x) => x.id === id);
    return h('li', { class: `ranura${r ? ' llena' : ''}${r && recien.has(id) ? ' nueva' : ''}${i === CASO.umbralLegal - 1 ? ' umbral' : ''}`, title: r ? `${r.archivo} · ${r.donde}` : 'sin recuperar' },
      r ? h('span', {}, h('span', { class: 'visual-oculto' }, 'rhino'), r.id.replace('rhino', '')) : h('span', { class: 'visual-oculto' }, 'vacía'));
  }));
  ranuras.classList.toggle('superado', unicos >= CASO.umbralLegal);
  recien = new Set();
}

function irA(i) {
  E.final = false;
  E.actual = i;
  pintarHud();
  pintarPaso();
  $('#mesa').focus({ preventScroll: false });
}

// ---------------------------------------------------------------- piezas comunes
function cabeceraPaso(paso) {
  return h('header', { class: 'mesa-cab' },
    h('p', { class: 'antetitulo' }, `Paso ${paso.numero} de ${CASO.pasos.length} · reemplaza a: ${paso.herramienta}`),
    h('h2', { id: 'paso-titulo' }, paso.titulo),
    h('p', { class: 'intro' }, paso.intro));
}

function botonPista(paso, extra) {
  const r = reg(paso.id);
  const caja = h('p', { class: 'pista-txt', hidden: !E.pistasVistas[paso.id] }, h('b', {}, 'Pista: '), paso.pista);
  const b = h('button', {
    type: 'button', class: 'boton-linea pista-btn',
    disabled: r.hecho || (E.pistasVistas[paso.id] && !extra),
    onclick: () => {
      r.pistas++;
      if (!E.pistasVistas[paso.id]) { E.pistasVistas[paso.id] = true; caja.hidden = false; }
      else if (extra) extra();
      if (!extra) b.disabled = true;
      sonar('clic');
      pintarHud();
    },
  }, `Pista (−${CASO.puntos.pista})`);
  return h('div', { class: 'pista' }, b, caja);
}

/** Pregunta de opción múltiple. Fallar resta; la explicación siempre se muestra. */
function preguntaUI(paso, q, alAcertar) {
  const clave = `${paso.id}:${q.id}`;
  const fb = h('p', { class: 'fb', role: 'status' });
  const botones = q.opciones.map((o) => h('button', {
    type: 'button', class: 'opcion', 'data-op': o.id,
    onclick: (ev) => {
      if (E.resueltas.has(clave)) return;
      const r = evaluarEleccion(q, o.id);
      fb.textContent = r.porque;
      fb.className = `fb ${r.correcta ? 'bien' : 'mal'}`;
      if (r.correcta) {
        E.resueltas.add(clave);
        ev.currentTarget.classList.add('correcta');
        botones.forEach((b) => { b.disabled = true; });
        sonar('acierto');
        alAcertar?.(o);
      } else {
        ev.currentTarget.classList.add('incorrecta');
        ev.currentTarget.disabled = true;
        fallo(paso);
      }
    },
  }, h('span', { class: 'letra' }, o.id.toUpperCase()), h('span', {}, o.texto)));
  if (E.resueltas.has(clave)) {
    const ok = q.opciones.find((o) => o.correcta);
    botones.forEach((b) => { b.disabled = true; if (b.dataset.op === ok.id) b.classList.add('correcta'); });
    fb.textContent = ok.porque; fb.className = 'fb bien';
  }
  return h('fieldset', { class: 'pregunta' }, h('legend', {}, q.enunciado), h('div', { class: 'opciones' }, botones), fb);
}

function pintarCierre(paso) {
  const zona = $('#cierre');
  if (!zona) return;
  const r = reg(paso.id);
  if (!r.hecho) { zona.replaceChildren(); return; }
  const ultimo = E.actual === CASO.pasos.length - 1;
  zona.replaceChildren(h('div', { class: 'cierre' },
    h('span', { class: 'sello', 'aria-hidden': 'true' }, ultimo ? 'CASO CERRADO' : 'VERIFICADO'),
    h('p', {}, h('b', {}, `+${r.puntos} puntos`), ` · fallos ${r.fallos} · pistas ${r.pistas}`),
    h('button', { type: 'button', class: 'boton-tinta', onclick: () => (ultimo ? mostrarFinal() : irA(E.actual + 1)) },
      ultimo ? 'Ver el informe forense' : `Siguiente: ${CASO.pasos[E.actual + 1].titulo}`)));
}

// ---------------------------------------------------------------- paso 1 y 6: elegir
function pasoElegir(paso) {
  const partes = [];
  const revisar = () => {
    const todas = paso.preguntas.every((q) => E.resueltas.has(`${paso.id}:${q.id}`));
    if (todas && (!paso.skram || E.skramOk)) completar(paso);
  };
  for (const q of paso.preguntas) {
    partes.push(preguntaUI(paso, q, (o) => {
      if (paso.id === 'conclusion') E.conclusion[q.id] = o.id;
      revisar();
    }));
  }
  if (paso.skram) partes.push(skramUI(paso, revisar));
  return partes;
}

function skramUI(paso, revisar) {
  const fb = h('p', { class: 'fb', role: 'status' });
  const filas = paso.skram.pistas.map((p) => h('fieldset', { class: 'skram-fila', 'data-id': p.id },
    h('legend', {}, p.texto, p.inferencia ? h('small', {}, ' (inferencia)') : ''),
    h('div', { class: 'letras' }, paso.skram.letras.map((l) => h('label', { class: 'letra-op', title: l.nombre },
      h('input', {
        type: 'radio', name: `skram-${p.id}`, value: l.id, checked: E.skram[p.id] === l.id, disabled: E.skramOk,
        onchange: () => { E.skram[p.id] = l.id; sonar('clic'); },
      }),
      h('span', {}, l.id), h('span', { class: 'visual-oculto' }, ` ${l.nombre}`))))));
  const boton = h('button', {
    type: 'button', class: 'boton-tinta', disabled: E.skramOk,
    onclick: () => {
      const malas = paso.skram.pistas.filter((p) => E.skram[p.id] !== p.letra);
      filas.forEach((f) => f.classList.toggle('mal', malas.some((m) => m.id === f.dataset.id)));
      if (malas.length) {
        fb.textContent = `${paso.skram.pistas.length - malas.length} de ${paso.skram.pistas.length} bien. Revisa las marcadas.`;
        fb.className = 'fb mal';
        fallo(paso);
      } else {
        E.skramOk = true;
        fb.textContent = 'Perfil SKRAM completo.';
        fb.className = 'fb bien';
        boton.disabled = true;
        filas.forEach((f) => f.querySelectorAll('input').forEach((i) => { i.disabled = true; }));
        sonar('acierto');
        revisar();
      }
    },
  }, 'Comprobar perfil');
  if (E.skramOk) { fb.textContent = 'Perfil SKRAM completo.'; fb.className = 'fb bien'; }
  return h('section', { class: 'skram' },
    h('h3', {}, 'Perfil SKRAM del sospechoso'),
    h('p', { class: 'ayuda' }, paso.skram.letras.map((l) => `${l.id} = ${l.nombre}`).join(' · ')),
    filas, boton, fb);
}

// ---------------------------------------------------------------- paso 2: hash
function pasoHash(paso) {
  const objetivo = CASO.evidencias.find((e) => e.id === paso.objetivo);
  const acta = h('table', { class: 'tabla' },
    h('caption', {}, 'Acta: hashes publicados por el NIST'),
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Archivo'), h('th', { scope: 'col' }, 'MD5'))),
    h('tbody', {}, CASO.evidencias.map((e) => h('tr', {}, h('td', {}, e.archivo), h('td', { class: 'mono' }, e.md5)))));
  const terminal = h('pre', { class: 'terminal', 'aria-label': 'Salida de la terminal del laboratorio' },
    h('span', { class: 'prompt' }, `$ ${paso.comando}\n`),
    paso.salida.map((s) => h('span', { class: s.didactico ? 'linea-practica' : null }, `${s.md5}  ${s.archivo}`, s.didactico ? h('span', { class: 'tag-practica' }, 'práctica') : '', '\n')));
  const entrada = h('input', { id: 'hash-in', type: 'text', class: 'mono', autocomplete: 'off', spellcheck: 'false', inputmode: 'text', placeholder: '32 caracteres hexadecimales', value: E.hashOk ? objetivo.md5 : '', disabled: E.hashOk });
  const dif = h('p', { class: 'hash-dif mono', 'aria-hidden': 'true' });
  const fb = h('p', { class: 'fb', role: 'status' });
  const zonaCopia = h('div', {});
  const mostrarCopia = () => zonaCopia.replaceChildren(preguntaUI(paso, paso.preguntaCopia, () => completar(paso)));
  const verificar = () => {
    const r = compararHash(entrada.value, objetivo.md5);
    const escrito = normalizarHash(entrada.value);
    dif.replaceChildren(...[...escrito].map((c, i) => h('span', { class: r.distintos.includes(i) ? 'difiere' : null }, c)));
    if (r.iguales) {
      E.hashOk = true;
      entrada.disabled = true; boton.disabled = true;
      fb.textContent = `COINCIDE: los 32 caracteres son iguales al acta. La copia es idéntica a la evidencia original.`;
      fb.className = 'fb bien';
      sonar('acierto');
      mostrarCopia();
    } else {
      fb.textContent = !escrito ? 'Escribe o pega el hash.' : !r.valido
        ? `Eso no es un MD5: debe tener 32 caracteres hexadecimales (tiene ${escrito.length}).`
        : `NO COINCIDE: iguales los primeros ${r.prefijo} caracteres; difieren ${r.distintos.length}. ¿Copiaste el de la línea correcta?`;
      fb.className = 'fb mal';
      if (escrito && r.valido) fallo(paso); else sonar('fallo');
    }
  };
  const boton = h('button', { type: 'button', class: 'boton-tinta', disabled: E.hashOk, onclick: verificar }, 'Verificar contra el acta');
  entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter') verificar(); });
  if (E.hashOk) { fb.textContent = 'COINCIDE con el acta.'; fb.className = 'fb bien'; mostrarCopia(); }

  return [
    h('div', { class: 'dos' }, h('div', { class: 'scroll-x' }, acta), terminal),
    h('div', { class: 'campo-hash' },
      h('label', { for: 'hash-in', class: 'etiqueta' }, `MD5 que calculó el laboratorio para ${objetivo.archivo}`),
      h('div', { class: 'fila' }, entrada, boton), dif, fb),
    zonaCopia,
    laboratorioAvalancha(),
  ];
}

function laboratorioAvalancha() {
  const a = h('input', { type: 'text', value: 'rhino1.jpg', 'aria-label': 'Texto A' });
  const b = h('input', { type: 'text', value: 'rhino2.jpg', 'aria-label': 'Texto B' });
  const sa = h('code', { class: 'hash-linea' }); const sb = h('code', { class: 'hash-linea' });
  const res = h('p', { class: 'ayuda', 'aria-live': 'polite' });
  const sha = async (t) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  const calc = async () => {
    if (!globalThis.crypto?.subtle) { res.textContent = 'Este navegador no deja calcular SHA-256 aquí (necesita https o localhost).'; return; }
    const [ha, hb] = await Promise.all([sha(a.value), sha(b.value)]);
    sa.textContent = ha; sb.textContent = hb;
    const d = compararHash(ha, hb).distintos.length;
    res.textContent = a.value === b.value ? 'Mismo texto, mismo hash.' : `Cambiaste ${Math.abs(a.value.length - b.value.length) || 'poco'}${Math.abs(a.value.length - b.value.length) ? ' caracteres' : ''} y cambian ${d} de 64 caracteres del hash.`;
  };
  a.addEventListener('input', calc); b.addEventListener('input', calc);
  const det = h('details', { class: 'lab' },
    h('summary', {}, 'Laboratorio libre: cambia una letra y mira el SHA-256 (no puntúa)'),
    h('div', { class: 'lab-filas' }, h('label', {}, 'A ', a), sa, h('label', {}, 'B ', b), sb), res,
    h('p', { class: 'ayuda' }, 'MD5 ya no se considera seguro frente a colisiones provocadas; hoy se anota también SHA-256 (sha256sum). Para comprobar que una copia no cambió por accidente, MD5 sigue sirviendo.'));
  det.addEventListener('toggle', calc, { once: true });
  return det;
}

// ---------------------------------------------------------------- paso 3: marcar
function pasoMarcar(paso) {
  const lineas = paso.fuentes.flatMap((f) => f.lineas);
  const fb = h('p', { class: 'fb', role: 'status' });
  const cerrado = () => E.marcasEntregadas;
  const tarjetas = paso.fuentes.map((f) => h('section', { class: 'fuente-traza' },
    h('h3', {}, f.titulo, f.recreado ? h('small', { class: 'recreado' }, ' · recreación') : ''),
    h('ul', { class: 'lineas' }, f.lineas.map((l) => h('li', {},
      h('button', {
        type: 'button', class: 'linea-btn', 'data-id': l.id, 'aria-pressed': String(E.marcas.has(l.id)), disabled: cerrado(),
        onclick: (ev) => {
          if (E.marcas.has(l.id)) E.marcas.delete(l.id); else E.marcas.add(l.id);
          ev.currentTarget.setAttribute('aria-pressed', String(E.marcas.has(l.id)));
          sonar('clic');
        },
      }, h('span', { class: 'mono' }, l.texto)),
      cerrado() && l.nota && E.marcas.has(l.id) ? h('p', { class: 'nota-linea' }, l.nota) : null)))));
  const entregar = (fraccion) => {
    E.marcasEntregadas = true;
    reg(paso.id).fraccion = fraccion;
    sumarRinos(lineas.filter((l) => l.rinoceronte && E.marcas.has(l.id)).map((l) => l.rinoceronte));
    pintarPaso();
  };
  const comprobar = h('button', {
    type: 'button', class: 'boton-tinta', disabled: cerrado(),
    onclick: () => {
      const r = evaluarMarcas(lineas, E.marcas);
      if (r.fraccion === 1) { sonar('acierto'); entregar(1); return; }
      fallo(paso);
      fb.className = 'fb mal';
      fb.replaceChildren(`Te faltan ${r.omitidas.length} línea${r.omitidas.length === 1 ? '' : 's'} relevante${r.omitidas.length === 1 ? '' : 's'} y marcaste ${r.falsos} de relleno. `,
        h('button', { type: 'button', class: 'mini', onclick: () => { sonar('sello'); entregar(r.fraccion); } }, `Entregar así (${Math.round(r.fraccion * 100)} %)`));
    },
  }, 'Comprobar marcas');
  if (cerrado()) {
    const r = evaluarMarcas(lineas, E.marcas);
    fb.className = r.fraccion === 1 ? 'fb bien' : 'fb mal';
    fb.textContent = r.fraccion === 1 ? 'Marcas correctas: lo relevante y nada más.' : `Entregado con ${r.aciertos} de ${r.relevantes} líneas relevantes y ${r.falsos} de relleno.`;
  }
  const revisar = () => {
    if (E.marcasEntregadas && paso.preguntas.every((q) => E.resueltas.has(`${paso.id}:${q.id}`))) completar(paso, reg(paso.id).fraccion);
  };
  queueMicrotask(revisar);
  return [
    h('p', { class: 'consigna' }, 'Toca las líneas que sirven como evidencia. Luego responde.'),
    h('div', { class: 'fuentes' }, tarjetas),
    h('div', { class: 'fila' }, comprobar), fb,
    h('div', { class: 'preguntas-dos' }, paso.preguntas.map((q) => preguntaUI(paso, q, revisar))),
  ];
}

// ---------------------------------------------------------------- paso 4: clasificar
function pasoClasificar(paso) {
  const zonaCerr = h('div', { class: 'cerraduras' });
  const zonaEnlace = h('div', {});
  const revisar = () => {
    const todos = paso.archivos.every((a) => E.clasificados[a.id]);
    const abiertas = paso.cerraduras.every((c) => E.abiertas[c.id]);
    if (todos && abiertas && !zonaEnlace.firstChild) zonaEnlace.append(preguntaUI(paso, paso.enlace, revisar));
    if (todos && abiertas && E.resueltas.has(`${paso.id}:${paso.enlace.id}`)) completar(paso);
  };
  const tarjeta = (a) => {
    const hecho = E.clasificados[a.id];
    const falsa = extensionEnganosa(a.nombre, a.tipo);
    const sel = h('select', { 'aria-label': `Tipo real de ${a.nombre}`, disabled: hecho },
      h('option', { value: '' }, '¿Qué es?'),
      paso.opcionesTipo.map((t) => h('option', { value: t, selected: hecho && t === a.tipo }, NOMBRE_TIPO[t])));
    const fb = h('p', { class: 'fb-mini', role: 'status' });
    const card = h('li', { class: `archivo${hecho ? ' resuelto' : ''}` },
      h('div', { class: 'archivo-cab' },
        h('span', { class: `estado-chip ${a.estado}` }, a.estado === 'red' ? 'de la red' : a.estado),
        a.didactico ? h('span', { class: 'tag-practica' }, 'práctica') : null),
      h('p', { class: 'archivo-nombre mono' }, a.nombre),
      h('p', { class: 'bytes mono', title: 'Primeros bytes' }, a.bytes),
      sel, fb);
    const revelar = () => {
      card.classList.add('resuelto');
      fb.className = 'fb-mini bien';
      fb.replaceChildren(
        falsa ? h('span', { class: 'sello-mini' }, 'EXTENSIÓN FALSA') : '',
        a.alias ? h('b', {}, `${a.alias}. `) : '', a.revela);
    };
    if (hecho) revelar();
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const real = detectarTipo(a.bytes, CASO.firmas);
      if (sel.value === real) {
        E.clasificados[a.id] = true;
        sel.disabled = true;
        sonar('acierto');
        revelar();
        if (a.rinoceronte) sumarRinos([a.rinoceronte]);
        pintarCerraduras();
        revisar();
      } else {
        fb.className = 'fb-mini mal';
        fb.textContent = `No: esos bytes no son de ${NOMBRE_TIPO[sel.value]}.`;
        card.classList.remove('sacude'); void card.offsetWidth; card.classList.add('sacude');
        sel.value = '';
        fallo(paso);
      }
    });
    return card;
  };
  const pintarCerraduras = () => {
    zonaCerr.replaceChildren(h('h3', {}, 'Lo que está cerrado'),
      h('p', { class: 'ayuda' }, 'Como un crackeador de diccionario: prueba palabras del caso. Probar no resta puntos.'),
      h('ul', { class: 'lista-cerr' }, paso.cerraduras.map((c) => {
        const archivo = paso.archivos.find((a) => a.cerrado === c.id);
        const listo = archivo && E.clasificados[archivo.id];
        const fb = h('p', { class: 'fb-mini', role: 'status' });
        if (E.abiertas[c.id]) { fb.className = 'fb-mini bien'; fb.textContent = `Abierto con «${E.abiertas[c.id]}». ${c.revela}`; }
        else if (!listo) fb.textContent = `Primero identifica ${archivo.nombre} arriba.`;
        return h('li', { class: `cerradura${E.abiertas[c.id] ? ' abierta' : ''}` },
          h('p', {}, h('b', { class: 'mono' }, c.archivo), ` · ${c.metodo}`),
          h('div', { class: 'chips' }, paso.diccionario.map((w) => h('button', {
            type: 'button', class: 'mini mono', disabled: !listo || Boolean(E.abiertas[c.id]),
            onclick: (ev) => {
              if (probarClave(c, w)) {
                E.abiertas[c.id] = w;
                sonar('acierto');
                sumarRinos([c.rinoceronte]);
                pintarCerraduras();
                revisar();
              } else {
                ev.currentTarget.disabled = true;
                ev.currentTarget.classList.add('tachado');
                fb.className = 'fb-mini mal';
                fb.textContent = `«${w}» no abre.`;
                sonar('fallo');
              }
            },
          }, w))), fb);
      })));
  };
  pintarCerraduras();
  queueMicrotask(revisar);
  return [
    h('details', { class: 'chuleta' }, h('summary', {}, 'Chuleta de firmas de archivo'),
      h('ul', {}, CASO.firmas.filter((f) => f.bytes).map((f) => h('li', {}, h('code', {}, f.bytes), ` ${f.nombre}`)))),
    h('ul', { class: 'archivos' }, paso.archivos.map(tarjeta)),
    zonaCerr,
    zonaEnlace,
  ];
}

// ---------------------------------------------------------------- paso 5: ordenar
function pasoOrdenar(paso) {
  const porId = new Map(paso.eventos.map((e) => [e.id, e]));
  const lista = h('ol', { class: 'linea-tiempo', 'aria-label': 'Hechos, de primero a último' });
  const fb = h('p', { class: 'fb', role: 'status' });
  const pistaRota = h('p', { class: 'pista-txt', hidden: true });
  const bloqueado = () => E.ordenEntregado;

  const pintar = (foco) => {
    lista.replaceChildren(...E.orden.map((id, i) => {
      const e = porId.get(id);
      return h('li', { class: 'evento', 'data-id': id },
        h('span', { class: 'asa', 'aria-hidden': 'true', title: 'Arrastra' }, '⋮⋮'),
        h('span', { class: 'pos' }, i + 1),
        h('span', { class: 'ev-txt' }, e.texto, h('small', {}, e.fuente)),
        h('span', { class: 'flechas' },
          h('button', { type: 'button', class: 'mini', 'aria-label': `Subir: ${e.texto}`, disabled: bloqueado() || i === 0, onclick: () => mover(id, -1, 'sube') }, '↑'),
          h('button', { type: 'button', class: 'mini', 'aria-label': `Bajar: ${e.texto}`, disabled: bloqueado() || i === E.orden.length - 1, onclick: () => mover(id, 1, 'baja') }, '↓')));
    }));
    if (foco) lista.querySelector(`[data-id="${foco.id}"] [aria-label^="${foco.dir === 'sube' ? 'Subir' : 'Bajar'}"]`)?.focus();
  };
  const mover = (id, d, dir) => { E.orden = moverEvento(E.orden, id, d); sonar('clic'); pintar({ id, dir }); };

  // Arrastrar con puntero (ratón o dedo) desde el asa.
  lista.addEventListener('pointerdown', (ev) => {
    const asa = ev.target.closest('.asa');
    if (!asa || bloqueado()) return;
    const li = asa.closest('.evento');
    const id = li.dataset.id;
    ev.preventDefault();
    li.classList.add('arrastrando');
    const alMover = (m) => {
      const items = [...lista.children];
      let destino = items.length - 1;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        if (m.clientY < r.top + r.height / 2) { destino = i; break; }
      }
      const actual = E.orden.indexOf(id);
      if (destino !== actual) {
        E.orden = moverA(E.orden, id, destino);
        pintar();
        lista.querySelector(`[data-id="${id}"]`)?.classList.add('arrastrando');
      }
    };
    const soltar = () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      lista.querySelector('.arrastrando')?.classList.remove('arrastrando');
      sonar('clic');
      pintar();
    };
    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  });

  const comprobar = h('button', {
    type: 'button', class: 'boton-tinta', disabled: bloqueado(),
    onclick: () => {
      const r = evaluarOrden(E.orden, paso.restricciones);
      if (r.fraccion === 1) {
        E.ordenEntregado = true; sonar('acierto'); pintar();
        fb.className = 'fb bien'; fb.textContent = `Las ${r.total} relaciones que la evidencia demuestra se cumplen.`;
        comprobar.disabled = true;
        completar(paso, 1);
        return;
      }
      fallo(paso);
      fb.className = 'fb mal';
      fb.replaceChildren(`Se cumplen ${r.cumplidas} de ${r.total} relaciones demostradas. `,
        h('button', {
          type: 'button', class: 'mini',
          onclick: () => { E.ordenEntregado = true; sonar('sello'); pintar(); comprobar.disabled = true; fb.textContent = `Entregado con ${r.cumplidas} de ${r.total}.`; completar(paso, r.fraccion); },
        }, `Entregar así (${r.cumplidas}/${r.total})`));
    },
  }, 'Comprobar línea de tiempo');

  pintar();
  if (bloqueado()) {
    const r = evaluarOrden(E.orden, paso.restricciones);
    fb.className = r.fraccion === 1 ? 'fb bien' : 'fb mal';
    fb.textContent = `Entregado: ${r.cumplidas} de ${r.total} relaciones.`;
  }
  const pista = botonPista(paso, () => {
    const r = evaluarOrden(E.orden, paso.restricciones);
    if (!r.rotas.length) { pistaRota.hidden = false; pistaRota.textContent = 'Ahora mismo no hay relaciones rotas.'; return; }
    const [a, b, porque] = r.rotas[0];
    pistaRota.hidden = false;
    pistaRota.textContent = `«${porId.get(a).texto}» va antes que «${porId.get(b).texto}»: ${porque}`;
  });
  return { partes: [h('p', { class: 'consigna' }, 'Arrastra desde el asa o usa las flechas.'), lista, h('div', { class: 'fila' }, comprobar), fb, pistaRota], pista };
}

// ---------------------------------------------------------------- pintar el paso
function pintarPaso() {
  const paso = pasoActual();
  const mesa = $('#mesa');
  let partes; let pista;
  switch (paso.mecanica) {
    case 'elegir': partes = pasoElegir(paso); break;
    case 'escribir': partes = pasoHash(paso); break;
    case 'marcar': partes = pasoMarcar(paso); break;
    case 'clasificar': partes = pasoClasificar(paso); break;
    case 'ordenar': ({ partes, pista } = pasoOrdenar(paso)); break;
    default: partes = [];
  }
  pista ??= botonPista(paso, paso.mecanica === 'marcar' ? () => pistaMarcar(paso) : null);
  mesa.replaceChildren(cabeceraPaso(paso), ...partes, pista, h('div', { id: 'cierre' }));
  pintarCierre(paso);
}

/** Pista extra del paso 3: señala una línea relevante que falta por marcar. */
function pistaMarcar(paso) {
  const falta = paso.fuentes.flatMap((f) => f.lineas).find((l) => l.relevante && !E.marcas.has(l.id));
  const btn = falta && document.querySelector(`.linea-btn[data-id="${falta.id}"]`);
  if (btn) { btn.classList.add('senalada'); btn.focus(); }
}

// ---------------------------------------------------------------- final e informe
function mostrarFinal() {
  E.final = true;
  pintarHud();
  const total = Object.values(E.pasos).reduce((s, p) => s + (p.puntos ?? 0), 0);
  const max = puntosMaximos(CASO);
  const unicos = rinocerontesUnicos(E.rinocerontes, CASO).length;
  const estado = { ...E, rinocerontes: E.rinocerontes };
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const informe = generarInforme(CASO, estado, fecha);
  const caja = h('textarea', { class: 'informe mono', readonly: true, rows: 18, 'aria-label': 'Informe forense en texto' }, informe);
  const aviso = h('p', { class: 'fb', role: 'status' });
  const copiar = async () => {
    try { await navigator.clipboard.writeText(informe); aviso.textContent = 'Informe copiado.'; aviso.className = 'fb bien'; }
    catch { caja.focus(); caja.select(); aviso.textContent = 'Seleccionado: usa Ctrl+C para copiarlo.'; aviso.className = 'fb'; }
    sonar('clic');
  };
  const url = URL.createObjectURL(new Blob([informe], { type: 'text/plain;charset=utf-8' }));
  const lg = logros(CASO, estado);
  $('#mesa').replaceChildren(
    h('header', { class: 'mesa-cab final-cab' },
      h('p', { class: 'antetitulo' }, `Expediente ${CASO.expediente} · cerrado`),
      h('h2', { id: 'paso-titulo' }, 'Caso cerrado'),
      h('span', { class: 'sello grande', 'aria-hidden': 'true' }, rango(total, CASO.rangos))),
    h('div', { class: 'resumen' },
      h('p', { class: 'cifra' }, h('b', {}, total), h('small', {}, ` / ${max} puntos`)),
      h('p', { class: 'cifra' }, h('b', {}, unicos), h('small', {}, ` / 10 rinocerontes ${unicos >= CASO.umbralLegal ? '(supera el umbral)' : '(no llega a 9)'}`))),
    lg.length ? h('ul', { class: 'logros', 'aria-label': 'Logros' }, lg.map((x) => h('li', {}, x))) : null,
    h('h3', {}, 'Informe forense'),
    caja,
    h('div', { class: 'fila' },
      h('button', { type: 'button', class: 'boton-tinta', onclick: copiar }, 'Copiar informe'),
      h('a', { class: 'boton-linea', href: url, download: 'informe-rhino-hunt.txt' }, 'Descargar .txt'),
      h('button', { type: 'button', class: 'boton-linea', onclick: () => { E = estadoNuevo(); pintarHud(); pintarPaso(); $('#mesa').focus(); } }, 'Jugar de nuevo')),
    aviso,
    h('p', { class: 'ayuda' }, 'El informe está en texto plano para pegarlo donde quieras. Pon tu nombre en «Analista».'));
  sonar('sello');
  $('#mesa').focus();
}

// ---------------------------------------------------------------- ficha del caso
function pintarFicha() {
  $('#escenario').replaceChildren(...CASO.escenario.map((t) => h('li', {}, t)));
  $('#evidencias').replaceChildren(...CASO.evidencias.map((e) => h('li', {},
    h('b', { class: 'mono' }, e.archivo), h('span', {}, ` ${e.tipo}`), h('code', {}, e.md5))));
  if (window.matchMedia('(max-width: 899px)').matches) $('#ficha-det').open = false;
}

iniciarTema($('#tema'));
iniciarSonido($('#sonido'));
pintarFicha();
pintarHud();
pintarPaso();
