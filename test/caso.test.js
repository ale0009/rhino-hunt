import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASO } from '../js/caso.js';
import { algoritmoDeHash } from '../js/motor.js';

test('seis pasos numerados del 1 al 6 con mecánica conocida', () => {
  assert.deepEqual(CASO.pasos.map((p) => p.numero), [1, 2, 3, 4, 5, 6]);
  for (const p of CASO.pasos) assert.ok(['elegir', 'escribir', 'marcar', 'clasificar', 'ordenar'].includes(p.mecanica), p.id);
});

test('los MD5 de las evidencias son los publicados por el NIST', () => {
  const m = Object.fromEntries(CASO.evidencias.map((e) => [e.archivo, e.md5]));
  assert.equal(m['RHINOUSB.dd'], '80348c58eec4c328ef1f7709adc56a54');
  assert.equal(m['rhino.log'], 'c0d0093eb1664cd7b73f3a5225ae3f30');
  assert.equal(m['rhino2.log'], 'cd21eaf4acfb50f71ffff857d7968341');
  assert.equal(m['rhino3.log'], '7e29f9d67346df25faaf18efcd95fc30');
});

test('todos los hashes del caso son MD5 válidos', () => {
  for (const e of CASO.evidencias) assert.equal(algoritmoDeHash(e.md5), 'md5');
  for (const r of CASO.rinocerontes) if (r.md5) assert.equal(algoritmoDeHash(r.md5), 'md5', r.id);
  for (const s of CASO.pasos.find((p) => p.id === 'hash').salida) assert.equal(algoritmoDeHash(s.md5), 'md5');
});

test('10 rinocerontes únicos con id y MD5 distintos', () => {
  assert.equal(CASO.rinocerontes.length, 10);
  assert.equal(new Set(CASO.rinocerontes.map((r) => r.id)).size, 10);
  const md5 = CASO.rinocerontes.map((r) => r.md5).filter(Boolean);
  assert.equal(new Set(md5).size, md5.length);
  for (const r of CASO.rinocerontes) assert.ok(CASO.origenes[r.origen], r.id);
});

test('cada pregunta tiene exactamente una respuesta correcta y explica las demás', () => {
  const preguntas = CASO.pasos.flatMap((p) => [...(p.preguntas ?? []), p.preguntaCopia, p.enlace].filter(Boolean));
  assert.ok(preguntas.length >= 10);
  for (const q of preguntas) {
    assert.equal(q.opciones.filter((o) => o.correcta).length, 1, q.id);
    for (const o of q.opciones) assert.ok(o.porque, `${q.id}/${o.id} sin explicación`);
  }
});

test('la respuesta correcta no está siempre en la misma posición', () => {
  const pos = CASO.pasos.flatMap((p) => p.preguntas ?? []).map((q) => q.opciones.findIndex((o) => o.correcta));
  assert.ok(new Set(pos).size >= 2);
});

test('las restricciones de la línea de tiempo apuntan a eventos que existen', () => {
  const p = CASO.pasos.find((x) => x.id === 'linea');
  const ids = new Set(p.eventos.map((e) => e.id));
  for (const [a, b, porque] of p.restricciones) {
    assert.ok(ids.has(a) && ids.has(b), `${a}→${b}`);
    assert.ok(porque.length > 10);
  }
  assert.deepEqual([...p.inicial].sort(), [...ids].sort());
});

test('las referencias a rinocerontes y cerraduras existen', () => {
  const rinos = new Set(CASO.rinocerontes.map((r) => r.id));
  const p3 = CASO.pasos.find((p) => p.id === 'historial');
  const p4 = CASO.pasos.find((p) => p.id === 'recuperar');
  for (const l of p3.fuentes.flatMap((f) => f.lineas)) if (l.rinoceronte) assert.ok(rinos.has(l.rinoceronte));
  const cerr = new Set(p4.cerraduras.map((c) => c.id));
  for (const a of p4.archivos) {
    if (a.rinoceronte) assert.ok(rinos.has(a.rinoceronte));
    if (a.cerrado) assert.ok(cerr.has(a.cerrado), a.id);
    assert.ok(p4.opcionesTipo.includes(a.tipo), a.id);
  }
  for (const c of p4.cerraduras) for (const k of c.claves) assert.ok(p4.diccionario.includes(k), k);
});

test('SKRAM: cinco pistas, una por letra', () => {
  const s = CASO.pasos.find((p) => p.id === 'conclusion').skram;
  assert.deepEqual(s.letras.map((l) => l.id), ['S', 'K', 'R', 'A', 'M']);
  assert.deepEqual(s.pistas.map((p) => p.letra).sort(), ['A', 'K', 'M', 'R', 'S']);
});

test('los datos del caso no traen nombres de empresas ajenas del trabajo de clase', () => {
  const texto = JSON.stringify(CASO).toLowerCase();
  // Escritos al revés para que los nombres no queden en el repositorio.
  for (const alReves of ['pura', 'ekalfwons', 'retsamtekcit', 'rednatnas']) {
    const nombre = [...alReves].reverse().join('');
    assert.ok(!texto.includes(nombre), alReves);
  }
});
