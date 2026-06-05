# picoTester

App web para subir baterías de preguntas en Markdown y hacer simulacros de test configurables, con revisión de fallos y persistencia entre sesiones.

Desarrollada con React + Vite + Tailwind. No requiere backend: todo se ejecuta en el navegador y se persiste en `localStorage`.

🌐 **Demo en vivo:** [https://ahuertam.github.io/picoTester/](https://ahuertam.github.io/picoTester/)

## Características

- 📄 **Subida de uno o varios archivos `.md`** a la vez, con concatenación automática.
- ✂️ **Parser estricto** que valida cada pregunta (mín. 2 opciones, 1+ correcta, formato).
- 🎯 **Modo edición**: marca con checkboxes las preguntas que quieras excluir, o elimínalas con la papelera.
- ⚙️ **Configuración flexible**: tiempo, número de preguntas, orden aleatorio, feedback inmediato, navegación libre/secuencial.
- 📊 **Resultados completos**: nota 0-10, porcentaje, aciertos/fallos/en blanco, tiempo, revisión detallada pregunta a pregunta.
- 🔁 **Cola de repasos**: las preguntas falladas se acumulan; un clic genera un examen solo con esos fallos.
- 💾 **Persistencia**: el banco y las exclusiones sobreviven a F5. La cola de repasos y la configuración también.
- ⏱️ **Timer opcional** con auto-submit al expirar.
- ♿ **Accesibilidad**: `aria-label`, `htmlFor`, `role="progressbar"`, foco visible, contraste AA.

## Stack

| Capa | Tecnología |
|---|---|
| Build | Vite 5 |
| UI | React 18 (JavaScript vanilla) |
| Estilos | Tailwind CSS 3 |
| Tests | Vitest |
| Lint / Format | ESLint + Prettier |
| Persistencia | `localStorage` |
| Deploy | GitHub Pages |

## Formato del `.md`

Cada pregunta es un bloque `##` seguido de opciones con `- [ ]` / `- [x]`:

```markdown
## ¿Cuál es la capital de Francia?
- [ ] Madrid
- [x] París
- [ ] Roma
- [ ] Berlín
```

Reglas:
- `[x]` = correcta, `[ ]` = incorrecta. Mayúsculas equivalentes (`[X]`).
- 1 `[x]` → pregunta **single**. 2+ → pregunta **multi-respuesta** (todo o nada).
- Mínimo 2 opciones por pregunta.
- Encoding UTF-8 (con o sin BOM), saltos de línea LF o CRLF.

Hay una [plantilla de ejemplo](./public/plantilla-ejemplo.md) en `public/` que puedes usar como base.

## Crear bancos de preguntas desde apuntes

El repo incluye un mini-workflow para convertir apuntes (en texto, fotos o capturas) en bancos listos para subir a la app, sin salir del repositorio. La cadena tiene tres pasos y cuatro scripts de apoyo en `scripts/`:

```
[Apuntes .jpg/.png]               [Apuntes texto]                [Banco .md]
        │                                  │                              │
        ▼                                  ▼                              ▼
 scripts/ocrImages.mjs              IAconvertMD.md             scripts/verifyOutputs.mjs
 (extrae texto por OCR)         (prompt para tu LLM)           (valida el parser)
        │                                  │                              │
        └───► mdsIA/raw/*.txt ──────────────┘                              │
                       │                                                    │
                       └──────────► mdsIA/output/*-questions.md ◄───────────┘
```

`mdsIA/` está en `.gitignore` (es material de trabajo, no se publica).

### Paso 1 · OCR de imágenes (opcional)

Solo si tus apuntes están en fotos, capturas o scans:

```bash
node scripts/ocrImages.mjs apuntes/p1.jpg apuntes/p2.png
# → mdsIA/raw/p1.txt, mdsIA/raw/p2.txt
```

Por defecto genera **un `.txt` por imagen** en `mdsIA/raw/`. Idiomas por defecto `spa+eng`, configurable con `-l`. Acepta `.jpg`, `.jpeg`, `.png`, `.webp`. Más opciones en `node scripts/ocrImages.mjs --help`.

### Paso 2 · Convertir texto a banco con un LLM

Copia el contenido de los `.txt` de `mdsIA/raw/` (o tus apuntes en texto) y pégalo junto al prompt de [`IAconvertMD.md`](./IAconvertMD.md) en tu IA favorita (Claude, GPT, Gemini, local…). El prompt es estricto: le indica al LLM el formato exacto y las reglas de validación que aplica el parser de picoTester. Sigue la plantilla de la [sección 9](./IAconvertMD.md#9-plantilla-de-inicio-referencia-rápida).

Guarda la respuesta del LLM en `mdsIA/output/<tema>-questions.md` siguiendo el formato del paso anterior.

### Paso 3 · Validar el banco antes de subirlo

```bash
node scripts/verifyOutputs.mjs
```

Parsea cada `.md` de `mdsIA/output/`, reporta errores fatales y warnings del parser, y resume singles/multi. **Ejecútalo siempre** antes de subir a la app: si una pregunta sale sin `[x]` o con menos de 2 opciones, la app la rechazará al cargarla.

Para simular qué pasa cuando subes varios bancos a la vez (concatenación + re-indexado de IDs), usa `node scripts/verifyMultiFile.mjs`. Es el mismo código que ejecuta `FileDropzone` internamente, así que te anticipa colisiones antes de que la app lo detecte.

### `reproFlow.mjs` (diagnóstico, no parte del workflow)

Script de Puppeteer que automatiza el flujo end-to-end contra la versión desplegada en GitHub Pages. Útil para reproducir bugs en producción; no interviene en la creación de bancos.

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (Vite + HMR)
npm run build      # build de producción en dist/
npm run preview    # previsualizar el build
npm test           # correr tests (Vitest)
npm run test:watch # tests en modo watch
npm run lint       # ESLint
npm run format     # Prettier (escribir)
npm run deploy     # build + push a rama gh-pages
```

## Flujo de uso

```
[Subir .md(s)] → [Configurar] → [Revisar banco] → [Examen] → [Resultados]
                  ↑       ↑        │                              │
                  │       └────────┘                              │
                  │   excluir/eliminar preguntas                   │
                  └──── [Nuevo examen] ◄────────── [Repasar] ◄────┘
```

1. **Subir** — arrastra o selecciona uno o varios `.md`. Se valida el formato y se reportan errores por archivo.
2. **Configurar** — tiempo, número de preguntas, orden aleatorio, feedback inmediato, navegación. El banco se cachea automáticamente.
3. **Revisar banco** *(opcional)* — excluye preguntas con checkbox o elimínalas con la papelera. Búsqueda integrada.
4. **Examen** — preguntas con confirmación de respuesta, feedback inmediato (opcional) y timer con auto-submit. Botón «Parar» para volver a config.
5. **Resultados** — nota, porcentaje, revisión detallada y cola de repasos.

## Persistencia

| Clave | Qué guarda |
|---|---|
| `picotester:config` | Configuración del usuario (tiempo, nº preguntas, etc.) |
| `picotester:retryQueue` | Cola de preguntas falladas con su contador de intentos |
| `picotester:questions` | Banco de preguntas cargado (sobrevive a F5) |
| `picotester:excluded` | IDs de preguntas excluidas |
| `picotester:lastUploadAt` | Timestamp ISO de la última carga |

El examen en curso y los resultados no se persisten: si recargas a mitad de un examen, lo pierdes (decisión consciente para evitar inconsistencias con el timer).

## Estructura del proyecto

```
picoTester/
├── index.html
├── package.json
├── vite.config.js          # base: '/picoTester/' para gh-pages
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── public/
│   └── plantilla-ejemplo.md
├── scripts/
│   ├── ocrImages.mjs        # OCR de imágenes a .txt crudo (paso previo a IAconvertMD.md)
│   ├── reproFlow.mjs        # diagnóstico del flujo con Puppeteer
│   ├── verifyMultiFile.mjs  # simula la concatenación multi-archivo
│   └── verifyOutputs.mjs    # valida bancos de mdsIA/output
└── src/
    ├── main.jsx
    ├── App.jsx              # provider + state machine de vistas
    ├── index.css
    ├── constants.js         # claves de localStorage y config por defecto
    ├── context/
    │   └── ExamContext.jsx  # provider con questions, excluded, config, retryQueue
    ├── hooks/
    │   ├── useLocalStorage.js
    │   ├── useTimer.js
    │   └── useExam.js       # hook para consumir el contexto
    ├── utils/
    │   ├── markdownParser.js      # + tests (16)
    │   ├── shuffle.js             # + tests (5)
    │   ├── examLogic.js           # + tests (18) — nota, cola, etc.
    │   ├── format.js              # + tests (11) — tiempo relativo, duración
    │   └── __tests__/
    └── components/
        ├── Header.jsx
        ├── FileDropzone.jsx       # multi-file, drag&drop, validación
        ├── ConfigPanel.jsx        # 5 campos + "Revisar banco" + "Limpiar"
        ├── QuestionBankEditor.jsx # checkboxes, papelera, búsqueda
        ├── QuestionCard.jsx       # single/multi, feedback
        ├── ProgressBar.jsx
        ├── Timer.jsx
        ├── ExamView.jsx           # orquesta todo + botón "Parar"
        ├── ResultsView.jsx
        └── RetryPanel.jsx
```

## Accesibilidad

- `htmlFor` en todos los `<label>` asociados a inputs.
- `aria-label` en controles interactivos (dropzone, timer, papelera, checkbox).
- `role="progressbar"` con `aria-valuenow/min/max` en la barra de progreso.
- `aria-live="polite"` en textos que cambian (ayuda de la pregunta, resultado).
- Foco visible con `focus:ring-2 focus:ring-indigo-500` (o `red-500` en acciones destructivas).
- Contraste AA mínimo en la paleta principal.
- Navegación completa por teclado.

## Despliegue

El proyecto está configurado para desplegar en **GitHub Pages** bajo la URL `https://<usuario>.github.io/picoTester/`.

```bash
npm run deploy
```

Esto ejecuta `npm run build` y publica la carpeta `dist/` en la rama `gh-pages` usando el paquete [`gh-pages`](https://www.npmjs.com/package/gh-pages). La configuración de `base` en `vite.config.js` se ajusta automáticamente al nombre del repo.

Si tu repo tiene otro nombre, edita `vite.config.js`:

```js
export default defineConfig({
  base: '/<nombre-de-tu-repo>/',
  // ...
})
```

## Tests

```bash
npm test
```

50 tests unitarios en `src/utils/__tests__/`:

- `markdownParser.test.js` (16): casos buenos, errores fatales, warnings, CRLF, mezclas.
- `examLogic.test.js` (18): `isAnswerCorrect`, `generateExamSession`, `computeResult`, `updateRetryQueue`, `getRetryQueueQuestions`.
- `shuffle.test.js` (5): inmutabilidad, distribución, casos borde.
- `format.test.js` (11): `formatRelative` y `formatDuration`.

## Licencia

MIT
