# 15 · Ecosistema de Vensim y herramientas relacionadas

> Mapa de herramientas que leen, ejecutan o complementan modelos Vensim, software alternativo de dinámica de sistemas (SD), y recursos de la comunidad.
> Versiones comprobadas en PyPI/repositorios a **octubre de 2026**. Lo marcado **(verificar)** proviene de conocimiento general no contrastado con fuente primaria en esta sesión.

## Tabla de contenidos

1. [Mapa rápido](#1-mapa-rápido)
2. [Herramientas abiertas que leen modelos Vensim](#2-herramientas-abiertas-que-leen-modelos-vensim)
   - 2.1 [PySD](#21-pysd)
   - 2.2 [SDEverywhere](#22-sdeverywhere)
   - 2.3 [Simlin / pysimlin](#23-simlin--pysimlin)
   - 2.4 [EMA Workbench](#24-ema-workbench)
   - 2.5 [venpy](#25-venpy)
   - 2.6 [Otras: xmutil, readsdr, Vensim2MTK, BPTK-Py, test-models](#26-otras-xmutil-readsdr-vensim2mtk-bptk-py-test-models)
3. [La familia de productos de Ventana](#3-la-familia-de-productos-de-ventana)
4. [Software alternativo de SD](#4-software-alternativo-de-sd)
5. [Comparación Vensim vs. alternativas](#5-comparación-vensim-vs-alternativas)
6. [Comunidad](#6-comunidad)
7. [Libros clave](#7-libros-clave)
8. [Cursos y formación](#8-cursos-y-formación)
9. [Bibliotecas de modelos](#9-bibliotecas-de-modelos)
10. [Lista de puntos (verificar)](#10-lista-de-puntos-verificar)
11. [Fuentes](#11-fuentes)

---

## 1. Mapa rápido

| Necesidad | Herramienta recomendada |
|---|---|
| Ejecutar un `.mdl` en Python sin licencia de Vensim | **PySD** |
| Publicar un simulador web rápido a partir de un `.mdl` | **SDEverywhere** (o exportación WebAssembly de Vensim 10 — verificar edición) |
| Controlar Vensim real desde Python (optimizador, sensibilidad, gaming) | **venpy** / ctypes sobre la DLL (Vensim DSS, Windows) |
| Análisis exploratorio / robust decision making | **EMA Workbench** (conector Vensim-DLL o PySD) |
| Leer `.vdf` sin Vensim; editar `.mdl`/XMILE desde Python o un agente IA | **Simlin** (`pysimlin`, `@simlin/mcp`) |
| Convertir `.mdl` → XMILE | **xmutil**, Simlin (`simlin-cli convert`), exportación de Vensim |
| Modelos SD+ABM en Python a partir de Stella | **BPTK-Py** (solo XMILE) |
| Modelos SD en R / Julia | `readsdr` (R), PySD backend Julia (experimental), `Vensim2MTK` |
| Probar un traductor contra resultados canónicos | **SDXorg/test-models** |
| Que un agente de IA opere Vensim real | **"Agentic Vensim"**: servidor MCP local de Vensim 10.5 (DSS; ver archivo 01 — verificar herramientas) |

---

## 2. Herramientas abiertas que leen modelos Vensim

### 2.1 PySD

- **Qué es**: biblioteca Python (organización **SDXorg**, licencia **MIT**) que traduce modelos Vensim (`.mdl`) y XMILE (`.xmile`, `.stmx`) a módulos Python y los simula con su propio motor (Euler) sobre **pandas/xarray**.
- **Versión**: 3.14.3 en PyPI (historial desde 0.1.0; serie 3.x desde 2022). La rama de desarrollo (3.15, no publicada) incluye un **backend Julia experimental** (`pysd.translate_to_julia()`, ModelingToolkit/OrdinaryDiffEq; backends `"ode"` y `"mtk"`).
- **Instalar**: `pip install pysd` (opcionales: `netCDF4` para salidas `.nc`, `openpyxl` para Excel).
- **Qué soporta**: la mayoría de funciones comunes (retardos, suavizados, lookups, `GET XLS/DIRECT`, `ALLOCATE…`, `VECTOR…`, subíndices con mapeos y `:EXCEPT:`, macros); ejecución por pasos (`set_stepper/step`), reemplazo de componentes por funciones Python, división por vistas, CLI `python -m pysd`.
- **No soporta (comprobado en 3.14.3)**: p. ej. `LOOKUP EXTRAPOLATE`, `LOOKUP FORWARD`, `DELAY CONVEYOR`, `RANDOM POISSON` (se traducen pero fallan al simular con `NotImplementedError`); otros métodos de integración; formatos binarios de Vensim.
- **Documentación**: pysd.readthedocs.io; recetas en *PySD cookbook*. Detalle de API y ejemplos probados en el archivo 11 §4.2.

### 2.2 SDEverywhere

- **Qué es**: conjunto de bibliotecas y CLI (`sde`) de **Climate Interactive** (creado por Todd Fincannon; licencia **MIT**) que **transpila modelos Vensim (`.mdl`) y Stella (XMILE/`.stmx`) a C, JavaScript y WebAssembly**, con herramientas de QA.
- **En producción**: Climate Interactive lo usa desde 2019 en **En-ROADS** y **C-ROADS**; Energy Innovation en el **Energy Policy Simulator**.
- **Requisitos**: Node.js ≥ 22 (recomendado 24 LTS); macOS, Windows o Linux.
- **Flujo de trabajo**:

```bash
mkdir mi-proyecto && cd mi-proyecto      # con el .mdl dentro (o vacío para el ejemplo SIR)
npm create @sdeverywhere@latest          # asistente: crea sde.config.js, config/*.csv, app
npm run dev                              # = sde dev: reconstruye y re-ejecuta checks al guardar en Vensim
npm run build                            # = sde bundle: app lista para desplegar
```

  `sde.config.js` mínimo (ejemplo `hello-world` del repo):

```js
import { checkPlugin } from '@sdeverywhere/plugin-check'
import { workerPlugin } from '@sdeverywhere/plugin-worker'

export async function config() {
  return {
    modelFiles: ['model/sample.mdl'],
    modelSpec: async () => ({
      inputs: [
        { varName: 'Production slope', defaultValue: 1, minValue: 1, maxValue: 10 },
        { varName: 'Production start year', defaultValue: 2020, minValue: 2020, maxValue: 2070 }
      ],
      outputs: [{ varName: 'Total inventory' }]
    }),
    plugins: [workerPlugin(), checkPlugin()]
  }
}
```

- **Comandos avanzados** (`@sdeverywhere/cli` 0.7.49): `sde generate --genc [--spec modelo_spec.json] modelo`, `sde generate --list`, `sde generate --preprocess`, `sde compile`, `sde exec`, `sde build`, `sde run`, `sde test` (compara con un `.dat` exportado de Vensim), `sde compare a.dat b.dat`, `sde log --dat`, `sde causes`, `sde names`, `sde clean`, `sde which`. Spec JSON: `{"inputVarNames": [...], "outputVarNames": ["Time", ...]}`.
- **Paquetes/plugins**: `create`, `cli`, `build`, `compile`, `parse`, `runtime`, `runtime-async`, `plugin-config` (configuración por CSV), `plugin-wasm` (Emscripten), `plugin-worker`, `plugin-vite`, `plugin-check` (checks y comparaciones entre versiones del modelo), `plugin-deploy` (GitHub Pages).
- **Limitaciones** (README): no convierte el sketch; solo funciones comunes (lista en la wiki "Supported Vensim Functions"); **solo integración Euler**; sin cadenas; *tabbed arrays* y **macros deben reescribirse** (el preprocesador los elimina).

### 2.3 Simlin / pysimlin

- **Qué es**: herramienta SD **open source** (Apache‑2.0; autor principal Bobby Powers) con editor web (simlin.com) y motor en **Rust/WebAssembly**. Su lector `.mdl` es un port a Rust de **xmutil**; también escribe `.mdl`.
- **pysimlin** (`pip install pysimlin`, 0.8.5; Python ≥ 3.11; macOS ARM64 y Linux): carga `.stmx/.xmile/.mdl`, simula con DataFrames, análisis de dominancia de bucles (*Loops that Matter*), edición transaccional del modelo, diagramas SVG/PNG y **`simlin.load_vdf()` para leer datasets `.vdf` de Vensim** (probado con World3).
- **simlin-cli**: `simulate`, `convert --to xmile|mdl`, `equations` (LaTeX), `render` (SVG), `vdf-dump`.
- **@simlin/mcp**: servidor MCP para que asistentes de IA lean/creen/editen modelos (soporta `.mdl` con lectura y edición, avisando de construcciones que Vensim no puede expresar).

### 2.4 EMA Workbench

- **Qué es**: *Exploratory Modeling and Analysis* (TU Delft, Jan Kwakkel), `pip install ema_workbench` (2.5.3). Diseño de experimentos, escenarios, PRIM/CART, MORDM, ejecución paralela.
- **Conectores**: `connectors.vensim` (DLL; **Windows + Vensim DSS**; modelos `.vpm/.vpmx`) y `connectors.pysd_connector` (sin Vensim). Vensim enlaza la herramienta desde su página "Workbench".

### 2.5 venpy

- **Qué es**: envoltorio Python puro de la DLL de Vensim (Patrick Breach, `pbreach/venpy`), con fork mantenido por Ventana (**`VensimOfficial/venpy`**, aportes de Tom Fiddaman: sensibilidad, ejemplos de tablas de consecuencias).
- **Instalar desde GitHub**; el `venpy` de PyPI es **otro paquete sin relación**.
- Ver API en el archivo 11 §4.3.

### 2.6 Otras: xmutil, readsdr, Vensim2MTK, BPTK-Py, test-models

| Herramienta | Qué hace | Notas |
|---|---|---|
| **xmutil** (Bob Eberlein) | Conversor C++ Vensim `.mdl` → XMILE (incluye diagrama) | Base del lector de Simlin; usado por `test-models` (producto "Vensim, xmutil") |
| **readsdr** (R, CRAN; Jair Andrade) | Traduce modelos Stella y Vensim a R (usa XMILE exportado por Vensim) | Calibración/inferencia en R |
| **Vensim2MTK** (Julia) | Vensim → ModelingToolkit | Paquete comunitario (verificar mantenimiento) |
| **BPTK-Py** (transentis, 3.2.0) | SD + ABM en Python (DSL propio, motor Rust, Pyodide); **compilador XMILE** (`pip install "bptk-py[xmile]"`) | Para modelos de Stella/iThink; **no lee `.mdl`** (solo parser XMILE en el paquete) |
| **SDXorg/test-models** | Colección de modelos de prueba (`tests/`, `samples/`) con salida canónica (`output.csv/.tab`) en `.mdl`, `.xmile`, `.stmx` | Referencia para validar traductores; incluye capturas de Vensim/Stella |

---

## 3. La familia de productos de Ventana

| Producto | Descripción |
|---|---|
| **Vensim PLE** | Edición gratuita para uso personal/educativo, funciones básicas (limitaciones exactas: archivo 01) |
| **Vensim PLE Plus** | Puente entre PLE y Pro: datos, múltiples vistas, sensibilidad Monte Carlo, gaming, controles de E/S (según archivo 01) |
| **Vensim Pro** | Subíndices, optimización/calibración (`.voc/.vpd` "Pro/DSS only"), sensibilidad, Reality Check, macros… |
| **Vensim DSS** | Todo lo de Pro + **DLL**, **command scripts**, **Venapps**, **funciones externas** y herramientas para aplicaciones |
| **Vensim Model Reader** | Gratuito; ejecuta y analiza modelos publicados (`.vpm/.vpmx`) sin poder editarlos |
| **Vensim Application Runtime / Redist DLL** | Distribución de aplicaciones basadas en la DLL (tipo de DLL "Redist"; condiciones de licencia: verificar) |
| **Ventity** | Producto hermano de Ventana para **modelado basado en entidades** (colecciones de entidades con estructura SD propia, creación/destrucción dinámica, relaciones) — intermedio entre SD agregada y ABM (beta pública 2015, Ventity 3 en 2019; suscripción incluida con Pro/DSS con mantenimiento vigente — según archivo 01) |

- **Versiones recientes**: Vensim 10 (10.1.x, 10.2.0, 10.3 de febrero de 2025, 10.4.x en 2025 y **10.5 en junio de 2026** con publicación web por plantillas y el servidor MCP "Agentic Vensim"; cronología detallada en `01-productos-licencias-versiones.md`).

---

## 4. Software alternativo de SD

| Software | Empresa / origen | Rasgos clave | Interoperabilidad con Vensim |
|---|---|---|---|
| **Stella Architect / Professional / Designer, Stella Online** (antes también **iThink**) | isee systems (antes High Performance Systems); STELLA desde 1985 (Barry Richmond) | Interfaz muy visual, módulos, *conveyors*, *queues*, *ovens*, constructor de interfaces y publicación web (isee Exchange) | Formato nativo XMILE (`.stmx`); importa `.mdl` (vía xmutil — verificar); Vensim lee XMILE desde 7.3.4 |
| **AnyLogic** | The AnyLogic Company (antes XJ Technologies) | **Multimétodo**: SD + agentes + eventos discretos, Java | Importación de modelos Vensim (verificar edición/versión) |
| **Powersim Studio** | Powersim Software (Noruega) | Fuerte en unidades y arrays, aplicaciones de negocio | Sin import directo de `.mdl` conocido (verificar) |
| **Insight Maker** | Proyecto web gratuito/abierto (Scott Fortmann‑Roe) | SD + ABM en el navegador, colaboración | Import de Vensim: verificar |
| **Simlin** | Open source (ver §2.3) | Editor web, LTM, MCP | Lee/escribe `.mdl` |
| **BPTK-Py** | transentis | SD/ABM como código Python | XMILE |
| **Otros** | Berkeley Madonna (ODEs), Simile, Minsky (economía monetaria), Kumu/LOOPY (diagramas causales), Forio Epicenter (hospedaje web de modelos, con soporte Vensim — verificar) | | |

---

## 5. Comparación Vensim vs. alternativas

| Criterio | Vensim | Stella | AnyLogic | PySD / SDEverywhere |
|---|---|---|---|---|
| Enfoque | SD "pura" con énfasis en rigor, calibración y análisis | SD con énfasis en comunicación/interfaces | Multimétodo | Ejecución abierta de modelos existentes |
| Arrays/subíndices | Muy potentes (mapeos, subrangos, `:EXCEPT:`, vectores) | Arrays + módulos | Arrays de Java/SD | Amplio soporte del dialecto Vensim |
| Calibración / optimización | Optimizador Powell integrado, payoff, MCMC/Kalman (Pro/DSS) | Optimización (en ediciones superiores; verificar) | Optimizador OptQuest | Vía librerías Python/JS |
| Sensibilidad Monte Carlo | Integrada (`.vsc`) | Integrada | Experimentos | En Python/JS |
| Análisis estructural | Causes/Uses trees, Loops, SyntheSim, Reality Check, unidades | Loops That Matter (versiones recientes — verificar), unidades | Limitado para SD | — |
| Automatización | Scripts `.cmd`, DLL, Venapps (DSS) | Scripting limitado (verificar) | API Java completa | Nativa (código) |
| Formato abierto | `.mdl` texto (no estándar) + exporta/lee XMILE | XMILE nativo | Propietario | Lee `.mdl`/XMILE |
| Costo | PLE gratis; Pro/DSS de pago | De pago | De pago (PLE gratis) | Gratis (MIT) |

Recomendación: Vensim cuando se necesitan **calibración rigurosa, análisis de sensibilidad, arrays complejos y verificación de unidades**; Stella para **comunicación e interfaces**; AnyLogic cuando el problema exige **agentes o eventos discretos**; PySD/SDEverywhere para **integración y despliegue** sin licencias.

---

## 6. Comunidad

- **System Dynamics Society** (systemdynamics.org): conferencia internacional anual (*International System Dynamics Conference*), revista **System Dynamics Review** (Wiley), capítulos regionales y grupos de interés (SIGs), recursos "What is SD" (enlazados también desde el README de SDEverywhere).
- **Foro de soporte de Ventana**: "Ventana software support forum" en `ventanasystems.co.uk/forum` — preguntas de Vensim, DLL/Python (hilos citados: contextos multicontexto, error 977 al integrar Python).
- **MetaSD** (metasd.com): blog de **Tom Fiddaman** (Ventana Systems) con una amplia **biblioteca de modelos** (muchos en Vensim: World3‑03, *bathtub statistics*, *beer game*, COVID‑19 US, *industrial dynamics*, *theil statistics*, *thyroid dynamics*, *FREE*…) y artículos sobre modelado, calibración y uso avanzado de Vensim. Simlin incluye una copia de varios en `test/metasd/`.
- **Climate Interactive**: modelos C‑ROADS/En‑ROADS (Vensim + SDEverywhere) y materiales docentes.
- **SDXorg** (GitHub): PySD, test-models y estándares de intercambio.
- **Vensim.com**: tutoriales, guía del usuario y referencia en línea (`vensim.com/documentation`), newsletter (p. ej. junio 2024), página de herramientas Python ("Workbench").

---

## 7. Libros clave

| Libro | Autor(es) | Por qué |
|---|---|---|
| *Business Dynamics: Systems Thinking and Modeling for a Complex World* (2000) | John D. Sterman | Texto de referencia; muchos modelos en Vensim |
| *Industrial Dynamics* (1961), *Urban Dynamics* (1969), *World Dynamics* (1971) | Jay W. Forrester | Fundacionales |
| *The Limits to Growth* (1972) y *Limits to Growth: The 30-Year Update* (2004) | D. Meadows, D. Meadows, J. Randers (y W. Behrens III) | World3; World3‑03 disponible como modelo/Venapp de Vensim |
| *Thinking in Systems: A Primer* (2008) | Donella Meadows | Introducción conceptual |
| *Strategic Modelling and Business Dynamics* | John Morecroft | Aplicaciones de negocio |
| *Modeling the Environment* | Andrew Ford | Modelos ambientales (Stella/Vensim) |
| *Introduction to System Dynamics Modeling with DYNAMO* | Richardson & Pugh | Clásico metodológico |
| *System Dynamics Modeling with R* | Jim Duggan | SD programada, puente a R |

(Ediciones y años de los títulos sin fecha: verificar.)

---

## 8. Cursos y formación

- **MIT Sloan**: 15.871 *Introduction to System Dynamics* y 15.872 *System Dynamics II* (material en MIT OpenCourseWare; usan Vensim) — códigos/años: verificar.
- **Programas universitarios**: University of Bergen (SD), WPI (Worcester Polytechnic Institute), **European Master in System Dynamics** (consorcio con Radboud/Bergen/Lisboa/Palermo — verificar composición actual), Universidad de Albany (Rockefeller College).
- **Ventana Systems**: tutoriales y guías en vensim.com ("Tutorial", guía de usuario, ejemplos con modelos `sales.mdl`, `electric.mdl`, `cfc.mdl`), seminarios de calibración (p. ej. *Calibration with Vensim*, Tom Fiddaman, 2022, PDF en vensim.com).
- **System Dynamics Society**: escuelas de verano, webinars y talleres en la conferencia.
- **Climate Interactive**: guías para facilitar talleres con En‑ROADS.

---

## 9. Bibliotecas de modelos

| Fuente | Contenido |
|---|---|
| Modelos de ejemplo instalados con Vensim y los de la guía del usuario | Modelos tutoriales y de referencia |
| **MetaSD model library** | Decenas de modelos documentados (Vensim, a veces Stella/XMILE) |
| **SDXorg/test-models** | Casos mínimos por función + `samples/` (teacup, SIR, Lotka‑Volterra, Population, Workforce…) con salidas canónicas |
| **SDEverywhere `models/`** | ~60 modelos Vensim de prueba (con `.dat` de Vensim) |
| **Simlin `test/`** | Corpus que incluye C‑LEARN y modelos de MetaSD, World3‑03 con Venapp, `.vgd`, `.cin`, `.vdf` |
| **Climate Interactive** | C‑ROADS/En‑ROADS (simuladores web; modelos bajo condiciones propias) |
| **Insight Maker / isee Exchange** | Modelos públicos de otras plataformas (formatos propios/XMILE) |

---

## 10. Lista de puntos (verificar)

1. Diferencias de funcionalidades exactas entre PLE / PLE Plus / Pro / DSS en Vensim 10.5 (ver archivo 01).
2. Versión más reciente de Model Reader y de Ventity.
3. Herramientas que expone "Agentic Vensim" (MCP).
4. Importación de `.mdl` en Stella (vía xmutil) y en AnyLogic; import en Insight Maker y Powersim.
5. Soporte de Vensim en Forio Epicenter.
6. Códigos de cursos MIT y composición del European Master in SD.
7. Estado de mantenimiento de Vensim2MTK.

---

## 11. Fuentes

**Repositorios y paquetes inspeccionados localmente:**
- PySD (`pysd/docs/*.rst`, `whats_new.rst`, `julia_builder.rst`), PyPI `pysd` 3.14.3 (probado).
- SDEverywhere (`README.md`, `packages/cli/README.md`, `examples/hello-world/sde.config.js`, `package.json` de cada paquete, `LICENSE`).
- Simlin (`README.md`, `src/pysimlin/README.md`, `src/simlin-cli/CLAUDE.md`, `src/simlin-mcp/README.md`, `docs/design/*.md`, `test/metasd/`); PyPI `pysimlin` 0.8.5 (probado `load`, `run`, `load_vdf`).
- EMA Workbench 2.5.3 (PyPI, `connectors/`), `VensimOfficial/venpy` y `pbreach/venpy` (git), BPTK-Py 3.2.0 (PyPI, METADATA y estructura del paquete), PyPI `venpy` 0.2.3 (no relacionado).
- SDXorg/test-models (`README.md`, `xmile.bash`, READMEs con versiones de Vensim).

**Web (extractos de búsqueda):**
- Vensim: https://vensim.com/software/ · https://vensim.com/download/ · https://vensim.com/workbench/ · https://vensim.com/tudelft-exploratory-modeling-and-analysis-workbench/ · https://vensim.com/vensim-model-reader/ · https://vensim.com/documentation/vensim-10.html · https://vensim.com/documentation/vensim-10_3.html · https://vensim.com/documentation/release_notes.html · https://vensim.com/2024/07/vensim-newsletter-june-2024/ · https://vensim.com/faq/ · https://vensim.com/vensim-brochure/ · https://www.vensim.com/documentation/file_types.html · Calibration with Vensim (2022): https://vensim.com/wp-content/uploads/2022/07/CalibrationWithVensim2022-pt1.pdf · Tutorial: https://www.vensim.com/documentation/tutorial.html
- Foro de Ventana: https://www.ventanasystems.co.uk/forum/viewtopic.php?t=7797 · https://www.ventanasystems.co.uk/forum/viewtopic.php?t=8375 · https://www.ventanasystems.co.uk/forum/viewtopic.php?t=4444
- EMA Workbench (DLL wrapper): https://github.com/quaquel/EMAworkbench/blob/master/ema_workbench/connectors/vensimDLLwrapper.py · venpy: https://github.com/VensimOfficial/venpy · https://github.com/pbreach/venpy
- readsdr: https://cran.r-project.org/web/packages/readsdr/readsdr.pdf · https://github.com/jandraor/readsdr · Vensim2MTK: https://juliapackages.com/p/vensim2mtk · Simlin docs: https://simlin.com/docs · PySD structure: https://pysd.readthedocs.io/en/master/structure/structure_index.html · test-models: https://github.com/SDXorg/test-models
- Conocimiento general (marcado "verificar" donde aplica): System Dynamics Society, MetaSD, libros y cursos.
