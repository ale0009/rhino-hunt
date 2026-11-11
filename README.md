# ¿Resuelves The Rhino Hunt?

*[English](README.en.md)*

Juego forense de un solo caso en el navegador. Eres analista junior en **«The Rhino Hunt»**, el caso público de práctica del NIST (CFReDS, DFRWS 2005): una ley castiga tener nueve o más fotos únicas de rinocerontes, el sospechoso borró su disco y reformateó su USB, y tú tienes que demostrarlo.

## Cómo se juega

Seis pasos, cada uno con una mecánica simple:

1. **Cadena de custodia** · elegir cómo se registra y se copia la evidencia.
2. **Verificar el hash** · escribir el MD5 que dio el laboratorio y compararlo con el acta del NIST.
3. **Historial y conversaciones** · marcar en las trazas de red y en el diario lo que sirve como evidencia.
4. **Recuperar lo borrado** · decir qué es cada archivo por su firma (extensiones falsas incluidas) y abrir lo cifrado.
5. **Línea de tiempo** · arrastrar los hechos en orden.
6. **Quién, qué y cuándo** · concluir y perfilar al sospechoso con el modelo SKRAM.

Hay pistas (que restan puntos), una colección de rinocerontes recuperados con el umbral legal a la vista, sonido opcional y un **informe forense en texto** al final para copiar o descargar.

Abre `index.html` con cualquier servidor estático (`python3 -m http.server`). Pruebas: `node --test`.

## Para integrarlo en otro juego

- `js/caso.js`: el caso completo como datos (evidencias, preguntas, archivos, restricciones de la línea de tiempo, puntos).
- `js/motor.js`: reglas puras (comparar hashes, detectar firmas, evaluar marcas y órdenes, puntuar, generar el informe).
- `js/main.js`: la interfaz. Es lo único que toca el DOM.

## De dónde sale

Del trabajo de clase de informática forense de Mario y David (2025), que resolvió el caso con Kali Linux, Autopsy, PhotoRec y Wireshark, y de otro trabajo del mismo curso sobre el modelo SKRAM. La página `/proceso/` explica el caso, el diseño, las herramientas reales que reemplaza (Autopsy, FTK, sha256sum…), el marco legal colombiano (Ley 906 de 2004, Ley 527 de 1999, Ley 1273 de 2009) y una fe de erratas.

**No se redistribuyen** las imágenes de disco ni las trazas del NIST: el juego usa solo nombres, firmas de archivo y hashes publicados. Fuente: [cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html](https://cfreds-archive.nist.gov/dfrws/Rhino_Hunt.html) (imagen aportada por Golden G. Richard III).

## Créditos

[Mario Puerta «ale0009»](https://github.com/ale0009) × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) · Licencia MIT.
