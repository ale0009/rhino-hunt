// Sonido opcional con Web Audio: tonos cortos generados, sin archivos. Apagado por defecto.
const CLAVE = 'rhino-hunt-sonido';
let ctx = null;
let activo = false;

function leer() {
  try { return localStorage.getItem(CLAVE) === 'si'; } catch { return false; }
}

/** Notas: [frecuencia Hz, inicio s, duración s]. */
const EFECTOS = {
  acierto: [[660, 0, 0.09], [990, 0.09, 0.14]],
  fallo: [[196, 0, 0.18], [147, 0.16, 0.22]],
  paso: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.22]],
  clic: [[1200, 0, 0.03]],
  sello: [[110, 0, 0.12], [82, 0.05, 0.2]],
  rino: [[784, 0, 0.07], [1175, 0.07, 0.12]],
};

export function sonar(nombre) {
  if (!activo || !EFECTOS[nombre]) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime + 0.01;
    for (const [f, ini, dur] of EFECTOS[nombre]) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = nombre === 'fallo' || nombre === 'sello' ? 'triangle' : 'square';
      osc.frequency.value = f;
      vol.gain.setValueAtTime(0.0001, t0 + ini);
      vol.gain.exponentialRampToValueAtTime(0.06, t0 + ini + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
      osc.connect(vol).connect(ctx.destination);
      osc.start(t0 + ini);
      osc.stop(t0 + ini + dur + 0.02);
    }
  } catch { /* sin audio: el juego sigue igual */ }
}

export function iniciarSonido(boton) {
  activo = leer();
  if (!boton) return;
  const pintar = () => {
    boton.textContent = `Sonido: ${activo ? 'sí' : 'no'}`;
    boton.setAttribute('aria-pressed', String(activo));
  };
  pintar();
  boton.addEventListener('click', () => {
    activo = !activo;
    try { localStorage.setItem(CLAVE, activo ? 'si' : 'no'); } catch { /* nada */ }
    pintar();
    sonar('clic');
  });
}
