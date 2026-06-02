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

> 💡 Si tienes apuntes y quieres convertirlos automáticamente al formato, usa el prompt [`IAconvertMD.md`](./IAconvertMD.md) con tu IA favorita.

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
│   ├── verifyOutputs.mjs    # valida bancos de mdsIA/output
│   └── verifyMultiFile.mjs  # simula la concatenación
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
