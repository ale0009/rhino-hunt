// «The Rhino Hunt» como DATOS: el caso, sus evidencias y las respuestas de cada paso.
// No toca el DOM. Otro juego (p. ej. la biblioteca de Jisseki) puede importar CASO y el motor
// (js/motor.js) y pintarlo a su manera.
//
// Origen de los datos:
//  - Escenario, MD5 de las evidencias y preguntas: NIST CFReDS, cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html
//    (imagen aportada por Golden G. Richard III para el DFRWS 2005 Rodeo Challenge).
//  - Respuestas, nombres y MD5 de los archivos recuperados, fecha del zip: DFRWS2005-answers.pdf (mismo sitio).
//  - Trabajo de clase de Mario Puerta y David Rincón (2025): orden de los pasos y herramientas.
// Las evidencias NO se redistribuyen: aquí solo hay nombres, firmas de archivo y hashes publicados.
// Todo lo marcado `didactico: true` es una variante inventada para practicar y no está en el caso original.

export const CASO = {
  id: 'rhino-hunt',
  titulo: '¿Resuelves The Rhino Hunt?',
  expediente: 'DFRWS-2005 · RHINO',
  fuente: {
    nombre: 'NIST CFReDS · The Rhino Hunt (DFRWS 2005 Rodeo Challenge)',
    url: 'https://cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html',
    respuestas: 'https://cfreds-archive.nist.gov/dfrws/DFRWS2005-answers.pdf',
    autor: 'Golden G. Richard III',
  },
  escenario: [
    'En 2004 la ciudad de Nueva Orleans aprobó una ley que vuelve delito grave poseer nueve o más imágenes únicas de rinocerontes.',
    'El administrador de red de la Universidad de Nueva Orleans avisó a la policía cuando su detector RHINOVORE marcó tráfico ilegal de rinocerontes.',
    'Se incautaron un computador y una memoria USB de un laboratorio de la universidad. El computador no tenía disco duro.',
    'El sospechoso es el usuario principal de esa máquina: lleva haciendo el doctorado en la universidad desde 1972.',
  ],
  umbralLegal: 9,

  /** Evidencias tal como las entrega el NIST, con su MD5 oficial. */
  evidencias: [
    { id: 'usb', archivo: 'RHINOUSB.dd', tipo: 'Imagen dd de la memoria USB', md5: '80348c58eec4c328ef1f7709adc56a54' },
    { id: 'log1', archivo: 'rhino.log', tipo: 'Traza de red · Telnet y FTP', md5: 'c0d0093eb1664cd7b73f3a5225ae3f30' },
    { id: 'log2', archivo: 'rhino2.log', tipo: 'Traza de red · HTTP', md5: 'cd21eaf4acfb50f71ffff857d7968341' },
    { id: 'log3', archivo: 'rhino3.log', tipo: 'Traza de red · HTTP', md5: '7e29f9d67346df25faaf18efcd95fc30' },
  ],

  /** Las 10 imágenes únicas de rinoceronte que se pueden recuperar (PDF oficial). md5 null = no publicado. */
  rinocerontes: [
    { id: 'rhino1', archivo: 'rhino1.jpg', origen: 'red-ftp', md5: 'd5a83cde0131c3a034e5a0d3bd94b3c9', donde: 'rhino.log · subida FTP' },
    { id: 'rhino2', archivo: 'rhino2.jpg', origen: 'red-ftp', md5: 'ed870202082ea4fd8f5488533a561b35', donde: 'contraband.zip (rhino.log) y también tallada de la USB' },
    { id: 'rhino3', archivo: 'rhino3.jpg', origen: 'red-ftp', md5: 'b058218ea0060092d4e01ef3d7a3b815', donde: 'rhino.log · subida FTP' },
    { id: 'rhino4', archivo: 'rhino4.jpg', origen: 'red-http', md5: null, donde: 'rhino2.log · descarga HTTP' },
    { id: 'rhino5', archivo: 'rhino5.gif', origen: 'red-http', md5: null, donde: 'rhino2.log · descarga HTTP' },
    { id: 'rhino6', archivo: 'rhino6.jpg', origen: 'usb-estego', md5: '87018ef0cfdb91e818d92efeb9c19338', donde: 'escondida en alligator2.jpg (jphide)' },
    { id: 'rhino7', archivo: 'rhino7.jpg', origen: 'usb-estego', md5: '63a39823f80b321c2dcd112158b55011', donde: 'escondida en alligator3.jpg (jphide)' },
    { id: 'rhino8', archivo: 'rhino8.gif', origen: 'usb-tallado', md5: '76610b7bdb85e5f65e96df3f7e417a74', donde: 'tallada del espacio libre de la USB' },
    { id: 'rhino9', archivo: 'rhino9.gif', origen: 'usb-tallado', md5: 'd03dc23d4ec39e4d16da3c46d2932d62', donde: 'tallada del espacio libre de la USB' },
    { id: 'rhino10', archivo: 'rhino10.jpg', origen: 'usb-tallado', md5: 'ca03f2eed3db06a82a8a31b3a3defa24', donde: 'tallada del espacio libre de la USB' },
  ],

  origenes: {
    'red-ftp': 'Red · FTP (rhino.log)',
    'red-http': 'Red · HTTP (rhino2.log)',
    'usb-tallado': 'USB · tallado de archivos',
    'usb-estego': 'USB · esteganografía',
  },

  /** Firmas de archivo («números mágicos»): los primeros bytes dicen qué es un archivo, diga lo que diga la extensión. */
  firmas: [
    { tipo: 'jpeg', nombre: 'Imagen JPEG', bytes: 'FF D8 FF' },
    { tipo: 'gif', nombre: 'Imagen GIF', bytes: '47 49 46 38' },
    { tipo: 'png', nombre: 'Imagen PNG', bytes: '89 50 4E 47 0D 0A 1A 0A' },
    { tipo: 'bmp', nombre: 'Imagen BMP', bytes: '42 4D' },
    { tipo: 'zip', nombre: 'Archivo ZIP', bytes: '50 4B 03 04' },
    { tipo: 'ole', nombre: 'Documento Word 97-2003 (OLE2)', bytes: 'D0 CF 11 E0 A1 B1 1A E1' },
    { tipo: 'exe', nombre: 'Ejecutable de Windows', bytes: '4D 5A' },
    { tipo: 'texto', nombre: 'Texto plano', bytes: '' },
  ],

  pasos: [
    // ------------------------------------------------------------------ 1
    {
      id: 'custodia',
      numero: 1,
      titulo: 'Cadena de custodia',
      herramienta: 'Formato de cadena de custodia',
      mecanica: 'elegir',
      intro: 'Te entregan la memoria USB y el computador sin disco. Antes de mirar nada, la evidencia tiene que quedar registrada: si no, en un juicio no vale.',
      preguntas: [
        {
          id: 'recibir',
          enunciado: 'Recibes la USB en una bolsa rotulada. ¿Qué haces primero?',
          opciones: [
            { id: 'a', texto: 'La conecto a mi portátil para ver si de verdad hay fotos.', porque: 'Conectarla la modifica (fechas de acceso, archivos del sistema). Primero se registra; luego se copia sin escribir en ella.' },
            { id: 'b', texto: 'Anoto en el acta qué es, quién la entrega, fecha, hora, estado del rótulo y del embalaje, y firmamos los dos.', correcta: true, porque: 'Así empieza la cadena: identidad, estado original y cada persona que tuvo la evidencia.' },
            { id: 'c', texto: 'Le pido al administrador de red que me cuente qué vio y la guardo en mi cajón.', porque: 'El testimonio sirve, pero una evidencia sin registro ni custodia controlada pierde su valor probatorio.' },
          ],
          pista: 'La pregunta no es «qué hay dentro», sino «cómo pruebo después que nadie la cambió».',
        },
        {
          id: 'copiar',
          enunciado: '¿Sobre qué haces el análisis?',
          opciones: [
            { id: 'a', texto: 'Sobre la USB original: es la prueba de verdad.', porque: 'Cualquier error de una herramienta dañaría la única prueba. El original se guarda sellado.' },
            { id: 'b', texto: 'Sobre una imagen bit a bit (dd) sacada con bloqueador de escritura, con su hash anotado.', correcta: true, porque: 'Es lo que hace el NIST en este caso: entrega RHINOUSB.dd y su MD5. Si el hash de tu copia coincide, trabajas sobre algo idéntico.' },
            { id: 'c', texto: 'Sobre una copia de los archivos visibles arrastrados al escritorio.', porque: 'Copiar archivos deja fuera lo borrado y el espacio libre, justo donde se esconde la evidencia en este caso.' },
          ],
          pista: 'Lo borrado vive en el espacio libre del disco. ¿Qué tipo de copia lo conserva?',
        },
        {
          id: 'sindisco',
          enunciado: 'El computador llegó sin disco duro. ¿Cómo queda en el acta?',
          opciones: [
            { id: 'a', texto: 'No lo registro: sin disco no es evidencia.', porque: 'La ausencia también es un hecho. Más adelante el diario explica qué pasó con ese disco.' },
            { id: 'b', texto: 'Le pongo un disco nuevo para poder encenderlo.', porque: 'Eso altera el estado original del equipo.' },
            { id: 'c', texto: 'Lo registro tal cual: «equipo sin disco duro», con fotos, rótulo y número de serie.', correcta: true, porque: 'La cadena registra el estado original de cada elemento, incluso lo que falta.' },
          ],
          pista: 'La cadena de custodia documenta el estado en que llega cada cosa, no el que debería tener.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'hash',
      numero: 2,
      titulo: 'Verificar el hash',
      herramienta: 'md5sum / sha256sum',
      mecanica: 'escribir',
      intro: 'Un hash es la «huella digital» de un archivo: cambia un solo bit y la huella cambia por completo. El NIST publicó el MD5 de cada evidencia; el laboratorio acaba de calcular el de tus copias.',
      comando: 'md5sum RHINOUSB.dd RHINOUSB-trabajo.dd rhino.log rhino2.log rhino3.log',
      /** Salida del laboratorio. La copia «-trabajo» es inventada: alguien la abrió en Windows y cambió. */
      salida: [
        { archivo: 'RHINOUSB.dd', md5: '80348c58eec4c328ef1f7709adc56a54' },
        { archivo: 'RHINOUSB-trabajo.dd', md5: '80348c58eec4c328ef1f7709adc56a55', didactico: true, nota: 'Copia que un compañero abrió en su equipo: cambió un byte y su hash ya no coincide.' },
        { archivo: 'rhino.log', md5: 'c0d0093eb1664cd7b73f3a5225ae3f30' },
        { archivo: 'rhino2.log', md5: 'cd21eaf4acfb50f71ffff857d7968341' },
        { archivo: 'rhino3.log', md5: '7e29f9d67346df25faaf18efcd95fc30' },
      ],
      objetivo: 'usb',
      preguntaCopia: {
        id: 'copia',
        enunciado: 'Dos copias de la USB. ¿Con cuál trabajas?',
        opciones: [
          { id: 'a', texto: 'RHINOUSB.dd: su MD5 coincide con el acta del NIST.', correcta: true, porque: 'Coincide carácter por carácter: es idéntica a la imagen original.' },
          { id: 'b', texto: 'RHINOUSB-trabajo.dd: solo cambia el último carácter, es casi igual.', porque: 'En un hash no existe «casi igual». Un carácter distinto significa que el archivo cambió.' },
        ],
        pista: 'Compara el final de cada hash con el del acta.',
      },
      pista: 'Copia el hash que sale en la terminal junto a RHINOUSB.dd. El juego lo compara con el del acta.',
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'historial',
      numero: 3,
      titulo: 'Historial y conversaciones',
      herramienta: 'Wireshark (antes Ethereal)',
      mecanica: 'marcar',
      intro: 'No hay disco, así que no hay historial del navegador. Lo más parecido son las trazas de red: la sesión Telnet/FTP es la «conversación» con el servidor y las peticiones HTTP son lo que se descargó. Además, en la USB apareció un diario borrado.',
      fuentes: [
        {
          id: 'log1', titulo: 'rhino.log · sesión Telnet / FTP', recreado: true,
          lineas: [
            { id: 'l1', texto: 'telnet · login: gnome', relevante: true, revela: 'usuario', nota: 'Usuario de la cuenta (paquetes Telnet 1203–1247 según el PDF oficial).' },
            { id: 'l2', texto: 'telnet · Password: (la escribe en texto plano)', relevante: true, nota: 'Telnet no cifra: la contraseña viaja legible.' },
            { id: 'l3', texto: 'FTP · SYST / TYPE I', relevante: false },
            { id: 'l4', texto: 'FTP · STOR rhino1.jpg', relevante: true, rinoceronte: 'rhino1' },
            { id: 'l5', texto: 'FTP · STOR rhino3.jpg', relevante: true, rinoceronte: 'rhino3' },
            { id: 'l6', texto: 'FTP · STOR contraband.zip', relevante: true, nota: 'Zip cifrado: se abre en el paso 4.' },
            { id: 'l7', texto: 'FTP · QUIT', relevante: false },
          ],
        },
        {
          id: 'log23', titulo: 'rhino2.log y rhino3.log · lo que se descargó por HTTP', recreado: true,
          lineas: [
            { id: 'h1', texto: 'rhino2.log · GET rhino4.jpg', relevante: true, rinoceronte: 'rhino4' },
            { id: 'h2', texto: 'rhino2.log · GET rhino5.gif', relevante: true, rinoceronte: 'rhino5' },
            { id: 'h3', texto: 'rhino3.log · GET rhino.exe', relevante: true, nota: 'Se llama «rhino» pero es un ejecutable: una versión vieja de Microsoft DiskPart. No es una foto.' },
          ],
        },
        {
          id: 'diario', titulo: 'diary.doc · diario recuperado (resumen en español)', recreado: true,
          lineas: [
            { id: 'd1', texto: 'Fuimos caminando del restaurante al pub irlandés.', relevante: false },
            { id: 'd2', texto: '¿Fotos de rinoceronte ilegales? Me enferma. «Escondí» las fotos, jejeje.', relevante: true },
            { id: 'd3', texto: 'Por lo visto, con menos de 10 fotos no pasa nada.', relevante: true },
            { id: 'd4', texto: 'Tuve sesión con mi terapeuta el lunes, como siempre.', relevante: false },
            { id: 'd5', texto: 'Borré el disco duro y luego lo tiré al río Misisipi.', relevante: true },
            { id: 'd6', texto: 'Voy a reformatear la USB después de esta entrada, sin destruir lo bueno.', relevante: true },
            { id: 'd7', texto: 'Tengo que cambiar la contraseña de la cuenta «gnome» que me dio Jeremy.', relevante: true, revela: 'quien' },
          ],
        },
      ],
      preguntas: [
        {
          id: 'quien',
          enunciado: '¿Quién le dio al sospechoso la cuenta Telnet/FTP?',
          opciones: [
            { id: 'a', texto: 'Jeremy', correcta: true, porque: 'Lo dice el diario: «la cuenta gnome que me dio Jeremy».' },
            { id: 'b', texto: 'El administrador de red', porque: 'El administrador detectó el tráfico; no le dio la cuenta.' },
            { id: 'c', texto: 'Lynn', porque: 'Lynn aparece en el diario, pero en otra historia.' },
          ],
          pista: 'Busca «gnome» en el diario.',
        },
        {
          id: 'usuario',
          enunciado: '¿Con qué usuario entra?',
          opciones: [
            { id: 'a', texto: 'root', porque: 'No aparece en la traza.' },
            { id: 'b', texto: 'gnome', correcta: true, porque: 'Aparece en el login de Telnet de rhino.log y en el diario.' },
            { id: 'c', texto: 'rhinovore', porque: 'RHINOVORE es el detector del administrador.' },
          ],
          pista: 'Mira la primera línea de rhino.log.',
        },
      ],
      pista: 'Marca solo lo que responde una pregunta del caso: cuentas, transferencias de rinocerontes, destino del disco y de la USB.',
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'recuperar',
      numero: 4,
      titulo: 'Recuperar lo borrado',
      herramienta: 'Autopsy / PhotoRec / Foremost',
      mecanica: 'clasificar',
      intro: 'La USB se reformateó, pero formatear no borra los datos: solo el índice. El tallado (carving) busca firmas de archivo en el espacio libre. Mira los primeros bytes y di qué es cada cosa, aunque el nombre diga otra.',
      archivos: [
        { id: 'f1', nombre: 'gumbo1.txt', estado: 'visible', bytes: '(solo caracteres imprimibles)', tipo: 'texto', revela: 'Una receta de gumbo. Lo único «directamente» visible en la USB.' },
        { id: 'f2', nombre: 'f0001.jpg', estado: 'tallado', bytes: 'FF D8 FF E0', tipo: 'jpeg', alias: 'alligator1.jpg', revela: 'Un caimán. Irrelevante para el caso.' },
        { id: 'f3', nombre: 'f0002.jpg', estado: 'tallado', bytes: 'FF D8 FF E0', tipo: 'jpeg', alias: 'alligator2.jpg', revela: 'Un caimán… pero stegdetect dice «jphide»: tiene algo escondido.', cerrado: 'estego2' },
        { id: 'f4', nombre: 'f0003.jpg', estado: 'tallado', bytes: 'FF D8 FF E0', tipo: 'jpeg', alias: 'alligator3.jpg', revela: 'Otro caimán con contenido oculto (jphide).', cerrado: 'estego3' },
        { id: 'f5', nombre: 'f0004.jpg', estado: 'tallado', bytes: 'FF D8 FF E0', tipo: 'jpeg', alias: 'rhino2.jpg', revela: 'Rinoceronte. MD5 ed870202…1b35.', rinoceronte: 'rhino2' },
        { id: 'f6', nombre: 'f0005.gif', estado: 'tallado', bytes: '47 49 46 38 39 61', tipo: 'gif', alias: 'rhino8.gif', revela: 'Rinoceronte.', rinoceronte: 'rhino8' },
        { id: 'f7', nombre: 'f0006.gif', estado: 'tallado', bytes: '47 49 46 38 39 61', tipo: 'gif', alias: 'rhino9.gif', revela: 'Rinoceronte.', rinoceronte: 'rhino9' },
        { id: 'f8', nombre: 'f0007.jpg', estado: 'tallado', bytes: 'FF D8 FF E0', tipo: 'jpeg', alias: 'rhino10.jpg', revela: 'Rinoceronte.', rinoceronte: 'rhino10' },
        { id: 'f9', nombre: 'f0008.doc', estado: 'tallado', bytes: 'D0 CF 11 E0 A1 B1 1A E1', tipo: 'ole', alias: 'diary.doc', revela: 'El diario del sospechoso (lo leíste en el paso 3).' },
        { id: 'f10', nombre: 'rhino.exe', estado: 'red', bytes: '4D 5A 90 00', tipo: 'exe', revela: 'Ejecutable de verdad (Microsoft DiskPart). El nombre engaña: no es una foto.' },
        { id: 'f11', nombre: 'contraband.zip', estado: 'red', bytes: '50 4B 03 04', tipo: 'zip', revela: 'Zip cifrado capturado en la subida FTP.', cerrado: 'zip' },
        { id: 'f12', nombre: 'receta2.txt', estado: 'tallado', bytes: 'FF D8 FF E1', tipo: 'jpeg', didactico: true, revela: 'Práctica: dice «.txt» pero empieza como un JPEG. Extensión falsa: se abre como imagen.' },
      ],
      opcionesTipo: ['jpeg', 'gif', 'zip', 'ole', 'exe', 'texto'],
      /** Cerraduras: palabras halladas en el caso. El PDF oficial se contradice en cuál clave abre cada caimán; se aceptan las dos. */
      diccionario: ['gnome', 'monkey', 'gator', 'gumbo', 'rhino', 'jeremy'],
      cerraduras: [
        { id: 'zip', archivo: 'contraband.zip', metodo: 'Zip con contraseña', claves: ['monkey'], rinoceronte: 'rhino2', fecha: '26-04-2004 17:00', revela: 'Dentro: rhino2.jpg (230 665 bytes), con fecha interna 26-04-2004 17:00.' },
        { id: 'estego2', archivo: 'alligator2.jpg', metodo: 'Esteganografía jphide', claves: ['gator', 'gumbo'], rinoceronte: 'rhino6', revela: 'jpseek extrae rhino6.jpg de dentro del caimán.' },
        { id: 'estego3', archivo: 'alligator3.jpg', metodo: 'Esteganografía jphide', claves: ['gator', 'gumbo'], rinoceronte: 'rhino7', revela: 'jpseek extrae rhino7.jpg de dentro del caimán.' },
      ],
      enlace: {
        id: 'enlace',
        enunciado: 'rhino2.jpg tallada de la USB y rhino2.jpg sacada del zip de la traza FTP tienen el mismo MD5 (ed870202082ea4fd8f5488533a561b35). ¿Qué prueba eso?',
        opciones: [
          { id: 'a', texto: 'Nada: dos fotos con el mismo nombre pasan todo el tiempo.', porque: 'El nombre no importa; el hash sí. Mismo MD5 = mismo contenido.' },
          { id: 'b', texto: 'Que la imagen de la USB es la misma que viajó por la red: une la USB con las trazas.', correcta: true, porque: 'Es la respuesta oficial a «¿qué conecta la USB con las trazas?».' },
          { id: 'c', texto: 'Que el zip estaba dañado.', porque: 'Si estuviera dañado, el hash no coincidiría.' },
        ],
        pista: 'Un hash identifica el contenido, no el nombre.',
      },
      pista: 'FF D8 FF es JPEG, 47 49 46 38 («GIF8») es GIF, 50 4B («PK») es ZIP, D0 CF 11 E0 es Word antiguo y 4D 5A («MZ») es un ejecutable.',
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'linea',
      numero: 5,
      titulo: 'Línea de tiempo',
      herramienta: 'Autopsy (Timeline) / plaso',
      mecanica: 'ordenar',
      intro: 'Ordena los hechos de primero a último. Solo puntúan las relaciones que la evidencia demuestra; donde el caso no dice nada, cualquier orden vale.',
      eventos: [
        { id: 'cuenta', texto: 'Jeremy le presta la cuenta «gnome»', fuente: 'diario' },
        { id: 'login', texto: 'Entra por Telnet/FTP como «gnome»', fuente: 'rhino.log' },
        { id: 'zip', texto: 'Cifra rhino2.jpg dentro de contraband.zip (fecha interna 26-04-2004 17:00)', fuente: 'contraband.zip' },
        { id: 'subida', texto: 'Sube rhino1, rhino3 y contraband.zip por FTP', fuente: 'rhino.log' },
        { id: 'descarga', texto: 'Descarga rhino4, rhino5 y rhino.exe por HTTP', fuente: 'rhino2.log y rhino3.log' },
        { id: 'estego', texto: 'Esconde dos rinocerontes dentro de fotos de caimanes', fuente: 'USB (jphide)' },
        { id: 'disco', texto: 'Borra el disco duro y lo tira al Misisipi', fuente: 'diario' },
        { id: 'entrada', texto: 'Escribe la última entrada del diario', fuente: 'diario' },
        { id: 'formateo', texto: 'Reformatea la USB', fuente: 'diario' },
        { id: 'incautacion', texto: 'La policía incauta el equipo sin disco y la USB', fuente: 'escenario NIST' },
      ],
      /** [antes, después, por qué]. Solo relaciones que la evidencia sostiene. */
      restricciones: [
        ['cuenta', 'login', 'No puede entrar con una cuenta que aún no tiene.'],
        ['login', 'subida', 'El FTP exige iniciar sesión antes de subir (STOR).'],
        ['zip', 'subida', 'El zip tiene que existir antes de subirlo.'],
        ['estego', 'formateo', 'Las fotos ocultas sobrevivieron en la USB: se escribieron antes del formateo.'],
        ['disco', 'entrada', 'El diario cuenta lo del disco en pasado.'],
        ['entrada', 'formateo', 'Diario: «voy a reformatear la USB después de esta entrada».'],
        ['subida', 'incautacion', 'Las trazas son anteriores al aviso del administrador.'],
        ['descarga', 'incautacion', 'Las trazas son anteriores al aviso del administrador.'],
        ['disco', 'incautacion', 'El equipo llegó sin disco.'],
        ['formateo', 'incautacion', 'La USB llegó ya reformateada.'],
      ],
      /** Orden inicial revuelto (fijo, para que la partida sea reproducible). */
      inicial: ['formateo', 'subida', 'disco', 'cuenta', 'incautacion', 'estego', 'login', 'entrada', 'descarga', 'zip'],
      pista: 'Empieza por los extremos: ¿qué tuvo que pasar antes de todo y qué cierra el caso? Luego usa las frases del diario.',
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'conclusion',
      numero: 6,
      titulo: 'Quién, qué y cuándo',
      herramienta: 'Informe pericial · modelo SKRAM',
      mecanica: 'elegir',
      intro: 'Cierra el caso con lo que la evidencia sostiene, y perfila al sospechoso con el modelo SKRAM (habilidades, conocimiento, recursos, autoridad y motivo).',
      preguntas: [
        {
          id: 'quien',
          enunciado: '¿Quién?',
          opciones: [
            { id: 'a', texto: 'Jeremy, porque la cuenta era suya.', porque: 'Jeremy le dio acceso, pero quien sube, descarga, esconde y destruye es el usuario de la máquina.' },
            { id: 'b', texto: 'El usuario principal del equipo del laboratorio: el doctorando (desde 1972).', correcta: true, porque: 'El escenario lo señala como usuario principal y el diario confirma que actuó él.' },
            { id: 'c', texto: 'No se puede saber: el disco duro desapareció.', porque: 'Sin disco hay trazas, la USB y el diario: alcanza para atribuir.' },
          ],
          pista: '¿Quién escribe el diario y usa la máquina?',
        },
        {
          id: 'que',
          enunciado: '¿Qué?',
          opciones: [
            { id: 'a', texto: 'Posesión de 4 imágenes: no llega al umbral de la ley.', porque: 'Es la cifra que se ve si solo se mira la USB sin tallar ni abrir lo oculto.' },
            { id: 'b', texto: 'Posesión de al menos 9 imágenes únicas (se recuperan 10) e intento de destruir evidencia.', correcta: true, porque: '10 rinocerontes únicos entre la red y la USB; y borró el disco y formateó la USB.' },
            { id: 'c', texto: 'Ataque informático contra la universidad.', porque: 'No hay rastro de ataque: usa una cuenta prestada para mover fotos.' },
          ],
          pista: 'Cuenta los rinocerontes únicos de tu colección.',
        },
        {
          id: 'cuando',
          enunciado: '¿Cuándo?',
          opciones: [
            { id: 'a', texto: 'En 1972, cuando empezó el doctorado.', porque: 'Es solo un dato del sospechoso.' },
            { id: 'b', texto: 'En 2005, el año del reto.', porque: '2005 es el año del DFRWS, no de los hechos.' },
            { id: 'c', texto: 'En 2004, después de la ley: el zip lleva fecha 26-04-2004 17:00.', correcta: true, porque: 'La fecha interna del zip es la marca de tiempo más firme que publica el NIST.' },
          ],
          pista: 'Busca una fecha dentro de un archivo, no en el escenario.',
        },
      ],
      skram: {
        letras: [
          { id: 'S', nombre: 'Habilidades' },
          { id: 'K', nombre: 'Conocimiento' },
          { id: 'R', nombre: 'Recursos' },
          { id: 'A', nombre: 'Autoridad (acceso)' },
          { id: 'M', nombre: 'Motivo' },
        ],
        pistas: [
          { id: 's1', texto: 'Esconde fotos con jphide y cifra un zip', letra: 'S' },
          { id: 'k1', texto: 'Sabe que con menos de 10 fotos «no pasa nada»', letra: 'K' },
          { id: 'r1', texto: 'Una USB, la red de la universidad y una cuenta prestada', letra: 'R' },
          { id: 'a1', texto: 'Usuario principal del equipo del laboratorio', letra: 'A' },
          { id: 'm1', texto: 'La ley le parece absurda y quiere quedarse con las fotos', letra: 'M', inferencia: true },
        ],
      },
      pista: 'SKRAM: S de skills, K de knowledge, R de resources, A de authority, M de motive.',
    },
  ],

  puntos: { porPaso: 100, pista: 15, fallo: 20 },
  rangos: [
    { desde: 0, nombre: 'Becario de laboratorio' },
    { desde: 300, nombre: 'Analista junior' },
    { desde: 450, nombre: 'Perito' },
    { desde: 560, nombre: 'Perito jefe' },
  ],
};

export default CASO;
