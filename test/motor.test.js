import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASO } from '../js/caso.js';
import {
  normalizarHash, algoritmoDeHash, compararHash, parsearSumas, verificarContraActa,
  bytesDeHex, detectarTipo, extensionEnganosa, evaluarEleccion, opcionCorrecta,
  evaluarMarcas, evaluarOrden, moverEvento, moverA, ordenValido, probarClave,
  rinocerontesUnicos, rinocerontesPorOrigen, puntosPaso, rango, puntosMaximos,
  logros, fechaDeUnzip, generarInforme,
} from '../js/motor.js';

const muestra = (n) => readFileSync(new URL(`./muestras/${n}`, import.meta.url), 'utf8');
const paso = (id) => CASO.pasos.find((p) => p.id === id);

test('normaliza hashes pegados con espacios, dos puntos o mayúsculas', () => {
  assert.equal(normalizarHash(' 80:34:8C 58-ee '), '80348c58ee');
  assert.equal(normalizarHash(null), '');
});

test('reconoce el algoritmo por la longitud', () => {
  assert.equal(algoritmoDeHash('80348c58eec4c328ef1f7709adc56a54'), 'md5');
  assert.equal(algoritmoDeHash('a'.repeat(64)), 'sha256');
  assert.equal(algoritmoDeHash('a'.repeat(40)), 'sha1');
  assert.equal(algoritmoDeHash('zz'.repeat(16)), null);
  assert.equal(algoritmoDeHash('abc'), null);
});

test('compararHash: igual, y un solo carácter distinto al final', () => {
  const ref = '80348c58eec4c328ef1f7709adc56a54';
  assert.equal(compararHash(ref.toUpperCase(), ref).iguales, true);
  const r = compararHash('80348c58eec4c328ef1f7709adc56a55', ref);
  assert.equal(r.iguales, false);
  assert.equal(r.prefijo, 31);
  assert.deepEqual(r.distintos, [31]);
  assert.equal(compararHash('', ref).iguales, false);
});

test('parsea la salida md5sum real del NIST (modo binario con *)', () => {
  const filas = parsearSumas(muestra('nist-md5.txt'));
  assert.equal(filas.length, 4);
  assert.deepEqual(filas[3], { hash: '80348c58eec4c328ef1f7709adc56a54', binario: true, archivo: 'RHINOUSB.dd' });
  assert.equal(parsearSumas('no es un hash\n\nabc  archivo').length, 0);
  assert.equal(parsearSumas(`${'b'.repeat(64)}  imagen con espacios.dd`)[0].archivo, 'imagen con espacios.dd');
});

test('la muestra del NIST coincide con el acta del caso', () => {
  const v = verificarContraActa(parsearSumas(muestra('nist-md5.txt')), CASO.evidencias);
  assert.ok(v.every((x) => x.estado === 'coincide'));
});

test('la copia de trabajo didáctica NO coincide y el resto sí', () => {
  const v = verificarContraActa(paso('hash').salida, CASO.evidencias);
  const porArchivo = Object.fromEntries(v.map((x) => [x.archivo, x.estado]));
  assert.equal(porArchivo['RHINOUSB.dd'], 'coincide');
  assert.equal(porArchivo['RHINOUSB-trabajo.dd'], 'sin-referencia');
  const trabajo = paso('hash').salida.find((s) => s.didactico);
  assert.equal(compararHash(trabajo.md5, CASO.evidencias[0].md5).iguales, false);
  assert.equal(verificarContraActa([{ archivo: 'rhino.log', md5: '0'.repeat(32) }], CASO.evidencias)[0].estado, 'no-coincide');
});

test('bytesDeHex lee pares hexadecimales y rechaza lo demás', () => {
  assert.deepEqual(bytesDeHex('FF D8 ff e0'), [255, 216, 255, 224]);
  assert.deepEqual(bytesDeHex('(solo caracteres imprimibles)'), []);
  assert.deepEqual(bytesDeHex('F'), []);
});

test('detecta el tipo por la firma, no por el nombre', () => {
  const f = CASO.firmas;
  assert.equal(detectarTipo('FF D8 FF E0', f), 'jpeg');
  assert.equal(detectarTipo('47 49 46 38 39 61', f), 'gif');
  assert.equal(detectarTipo('50 4B 03 04', f), 'zip');
  assert.equal(detectarTipo('D0 CF 11 E0 A1 B1 1A E1', f), 'ole');
  assert.equal(detectarTipo('4D 5A 90 00', f), 'exe');
  assert.equal(detectarTipo('89 50 4E 47 0D 0A 1A 0A', f), 'png');
  assert.equal(detectarTipo('(texto)', f), 'texto');
  assert.equal(detectarTipo('00 00 00 00', f), null);
});

test('cada archivo del paso 4 tiene el tipo que dicen sus bytes', () => {
  for (const a of paso('recuperar').archivos) assert.equal(detectarTipo(a.bytes, CASO.firmas), a.tipo, a.nombre);
});

test('extensión falsa: receta2.txt es un JPEG; rhino.exe no engaña en la extensión', () => {
  assert.equal(extensionEnganosa('receta2.txt', 'jpeg'), true);
  assert.equal(extensionEnganosa('f0004.jpg', 'jpeg'), false);
  assert.equal(extensionEnganosa('rhino.exe', 'exe'), false);
  assert.equal(extensionEnganosa('foto.JPG', 'jpeg'), false);
  const falsos = paso('recuperar').archivos.filter((a) => extensionEnganosa(a.nombre, a.tipo));
  assert.deepEqual(falsos.map((a) => a.id), ['f12']);
  assert.ok(falsos.every((a) => a.didactico), 'la única extensión falsa está marcada como didáctica');
});

test('evaluarEleccion y opcionCorrecta', () => {
  const q = paso('custodia').preguntas[0];
  assert.equal(evaluarEleccion(q, 'b').correcta, true);
  assert.equal(evaluarEleccion(q, 'a').correcta, false);
  assert.ok(evaluarEleccion(q, 'a').porque.length > 10);
  assert.equal(evaluarEleccion(q, 'zz').correcta, false);
  assert.equal(opcionCorrecta(q).id, 'b');
});

test('evaluarMarcas: todo lo relevante y nada más = 1; un falso positivo resta', () => {
  const lineas = paso('historial').fuentes.flatMap((f) => f.lineas);
  const buenas = lineas.filter((l) => l.relevante).map((l) => l.id);
  assert.equal(evaluarMarcas(lineas, buenas).fraccion, 1);
  const conRuido = evaluarMarcas(lineas, [...buenas, 'd1']);
  assert.equal(conRuido.falsos, 1);
  assert.ok(conRuido.fraccion < 1);
  assert.equal(evaluarMarcas(lineas, []).fraccion, 0);
  assert.equal(evaluarMarcas(lineas, ['d1', 'd4', 'l3', 'l7']).fraccion, 0);
});

test('línea de tiempo: el orden inicial está revuelto y el orden válido cumple todo', () => {
  const p = paso('linea');
  const ini = evaluarOrden(p.inicial, p.restricciones);
  assert.ok(ini.cumplidas < ini.total, 'el orden inicial no debe venir resuelto');
  const valido = ordenValido(p.eventos, p.restricciones);
  assert.ok(valido);
  assert.equal(evaluarOrden(valido, p.restricciones).fraccion, 1);
  assert.equal(ordenValido(['a', 'b'], [['a', 'b'], ['b', 'a']]), null);
});

test('evaluarOrden cuenta eventos ausentes como relaciones rotas', () => {
  const r = evaluarOrden(['a'], [['a', 'b'], ['a', 'c']]);
  assert.equal(r.cumplidas, 0);
  assert.equal(r.rotas.length, 2);
  assert.equal(evaluarOrden([], []).fraccion, 1);
});

test('mover eventos no muta el original y respeta los límites', () => {
  const o = ['a', 'b', 'c'];
  assert.deepEqual(moverEvento(o, 'c', -1), ['a', 'c', 'b']);
  assert.deepEqual(moverEvento(o, 'a', -1), ['a', 'b', 'c']);
  assert.deepEqual(moverA(o, 'a', 99), ['b', 'c', 'a']);
  assert.deepEqual(moverA(o, 'x', 0), ['a', 'b', 'c']);
  assert.deepEqual(o, ['a', 'b', 'c']);
});

test('claves: monkey abre el zip; gator o gumbo abren los caimanes (la fuente se contradice)', () => {
  const [zip, a2, a3] = paso('recuperar').cerraduras;
  assert.equal(probarClave(zip, ' MONKEY '), true);
  assert.equal(probarClave(zip, 'gnome'), false);
  for (const c of [a2, a3]) {
    assert.equal(probarClave(c, 'gator'), true);
    assert.equal(probarClave(c, 'gumbo'), true);
    assert.equal(probarClave(c, 'monkey'), false);
  }
});

test('rinocerontes únicos: rhino2 por dos vías cuenta una vez', () => {
  const u = rinocerontesUnicos(['rhino2', 'rhino2', 'rhino8', 'nada'], CASO);
  assert.deepEqual(u.map((r) => r.id), ['rhino2', 'rhino8']);
});

test('el juego permite llegar a los 10 rinocerontes y superar el umbral de 9', () => {
  const ids = new Set();
  for (const f of paso('historial').fuentes) for (const l of f.lineas) if (l.rinoceronte) ids.add(l.rinoceronte);
  const p4 = paso('recuperar');
  for (const a of p4.archivos) if (a.rinoceronte) ids.add(a.rinoceronte);
  for (const c of p4.cerraduras) ids.add(c.rinoceronte);
  assert.equal(rinocerontesUnicos([...ids], CASO).length, 10);
  assert.ok(ids.size >= CASO.umbralLegal);
});

test('rinocerontes por origen suman 10', () => {
  const c = rinocerontesPorOrigen(CASO);
  assert.deepEqual(c, { 'red-ftp': 3, 'red-http': 2, 'usb-tallado': 3, 'usb-estego': 2 });
});

test('puntos: fallos y pistas restan, nunca bajan de cero', () => {
  const P = CASO.puntos;
  assert.equal(puntosPaso({}, P), 100);
  assert.equal(puntosPaso({ fallos: 1, pistas: 1 }, P), 65);
  assert.equal(puntosPaso({ fraccion: 0.5 }, P), 50);
  assert.equal(puntosPaso({ fallos: 9 }, P), 0);
  assert.equal(puntosMaximos(CASO), 600);
});

test('rangos', () => {
  assert.equal(rango(0, CASO.rangos), 'Becario de laboratorio');
  assert.equal(rango(450, CASO.rangos), 'Perito');
  assert.equal(rango(600, CASO.rangos), 'Perito jefe');
});

test('fecha del zip desde la salida real de unzip -v', () => {
  const linea = muestra('unzip-v.txt').split('\n').find((l) => l.includes('rhino2.jpg'));
  assert.equal(fechaDeUnzip(linea), '2004-04-26T17:00');
  assert.equal(fechaDeUnzip('12-31-99 23:59'), '1999-12-31T23:59');
  assert.equal(fechaDeUnzip('sin fecha'), null);
});

test('logros de una partida perfecta', () => {
  const pasos = Object.fromEntries(CASO.pasos.map((p) => [p.id, { puntos: 100, fallos: 0, pistas: 0, fraccion: 1, hecho: true }]));
  const l = logros(CASO, { pasos, rinocerontes: CASO.rinocerontes.map((r) => r.id) });
  assert.deepEqual(l, ['Sin pistas', 'Cadena intacta', '10 de 10 rinocerontes', 'Cronista exacto']);
});

test('el informe incluye hashes, rinocerontes, línea de tiempo, SKRAM y total', () => {
  const p = paso('linea');
  const estado = {
    pasos: { hash: { hecho: true, puntos: 100 }, custodia: { puntos: 80, pistas: 1 } },
    rinocerontes: ['rhino1', 'rhino2'],
    orden: ordenValido(p.eventos, p.restricciones),
    conclusion: { quien: 'b' },
    skram: { s1: 'S', m1: 'M' },
  };
  const t = generarInforme(CASO, estado, '2026-11-10');
  assert.match(t, /80348c58eec4c328ef1f7709adc56a54/);
  assert.match(t, /2 únicas; umbral legal 9/iu);
  assert.match(t, /Relaciones demostradas que se respetan: 10 de 10/);
  assert.match(t, /S · Habilidades: Esconde fotos/);
  assert.match(t, /\(inferencia\)/);
  assert.match(t, /Total: 180 \/ 600/);
  assert.match(t, /Paso 1 · Cadena de custodia: 80 \/ 100 \(1 pista\)/);
  assert.match(t, /no es un peritaje real/);
});
