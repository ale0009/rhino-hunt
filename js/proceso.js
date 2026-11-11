// Página /proceso/: tema y gráficas hechas desde los mismos datos del juego (js/caso.js).
import { CASO } from './caso.js';
import { rinocerontesPorOrigen, ordenValido, puntosMaximos } from './motor.js';
import { iniciarTema } from './tema.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, texto) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/** Barra apilada: de dónde salen los 10 rinocerontes, con la marca del umbral legal (9). */
function graficaOrigenes(svg) {
  const cuenta = rinocerontesPorOrigen(CASO);
  const total = CASO.rinocerontes.length;
  const W = 640; const x0 = 10; const ancho = W - 20; const paso = ancho / total;
  svg.setAttribute('viewBox', `0 0 ${W} 190`);
  const clases = { 'red-ftp': 'g-barra', 'red-http': 'g-barra g-claro', 'usb-tallado': 'g-barra g-dest', 'usb-estego': 'g-barra g-dest g-rayas' };
  let i = 0;
  const leyenda = [];
  for (const [origen, n] of Object.entries(cuenta)) {
    const xi = x0 + i * paso;
    svg.append(s('rect', { x: xi, y: 30, width: n * paso, height: 56, class: clases[origen] }));
    leyenda.push([origen, n]);
    i += n;
  }
  const xu = x0 + CASO.umbralLegal * paso;
  svg.append(s('line', { x1: xu, x2: xu, y1: 18, y2: 98, class: 'g-umbral' }));
  svg.append(s('text', { x: xu, y: 13, 'text-anchor': 'middle', class: 'g-eje' }, `umbral legal: ${CASO.umbralLegal}`));
  for (let k = 0; k <= total; k++) svg.append(s('text', { x: x0 + k * paso, y: 114, 'text-anchor': 'middle', class: 'g-eje' }, String(k)));
  leyenda.forEach(([origen, n], j) => {
    const lx = x0 + (j % 2) * 320; const ly = 140 + Math.floor(j / 2) * 24;
    svg.append(s('rect', { x: lx, y: ly - 12, width: 16, height: 16, class: clases[origen] }));
    svg.append(s('text', { x: lx + 24, y: ly + 1, class: 'g-txt' }, `${CASO.origenes[origen]}: ${n}`));
  });
}

/** Línea de tiempo válida con los arcos de las relaciones que puntúan. */
function graficaRestricciones(svg) {
  const p = CASO.pasos.find((x) => x.id === 'linea');
  const orden = ordenValido(p.eventos, p.restricciones);
  const W = 640; const n = orden.length; const paso = (W - 60) / (n - 1); const y = 150;
  svg.setAttribute('viewBox', `0 0 ${W} 210`);
  const xDe = (id) => 30 + orden.indexOf(id) * paso;
  svg.append(s('line', { x1: 30, x2: W - 30, y1: y, y2: y, class: 'g-base' }));
  for (const [a, b] of p.restricciones) {
    const xa = xDe(a); const xb = xDe(b); const alto = Math.min(120, 18 + (xb - xa) * 0.28);
    svg.append(s('path', { d: `M${xa} ${y} C ${xa} ${y - alto}, ${xb} ${y - alto}, ${xb} ${y}`, class: 'g-linea g-arco' }));
  }
  orden.forEach((id, i) => {
    const x = 30 + i * paso;
    svg.append(s('circle', { cx: x, cy: y, r: 9, class: 'g-caja' }));
    svg.append(s('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'g-num g-peq' }, String(i + 1)));
    svg.append(s('line', { x1: x, x2: x, y1: y + 10, y2: y + (i % 2 ? 36 : 18), class: 'g-reji' }));
    svg.append(s('text', { x: i === n - 1 ? x + 10 : i === 0 ? x - 10 : x, y: y + (i % 2 ? 50 : 30), 'text-anchor': i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle', class: 'g-eje' }, id));
  });
}

function tablaPasos(tbody) {
  const MEC = { elegir: 'Elegir', escribir: 'Escribir el hash', marcar: 'Marcar líneas', clasificar: 'Clasificar por firma y probar claves', ordenar: 'Arrastrar y ordenar' };
  for (const p of CASO.pasos) {
    const tr = document.createElement('tr');
    for (const t of [p.numero, p.titulo, MEC[p.mecanica], p.herramienta]) {
      const td = document.createElement('td'); td.textContent = t; tr.append(td);
    }
    tbody.append(tr);
  }
}

iniciarTema(document.getElementById('tema'));
const g1 = document.getElementById('g-origenes'); if (g1) graficaOrigenes(g1);
const g2 = document.getElementById('g-restricciones'); if (g2) graficaRestricciones(g2);
const tb = document.getElementById('t-pasos'); if (tb) tablaPasos(tb);
const max = document.getElementById('c-max'); if (max) max.textContent = puntosMaximos(CASO);
