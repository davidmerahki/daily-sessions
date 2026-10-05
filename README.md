# daily-sessions

## Vensim: base de conocimiento experta

Documentación completa sobre **[Vensim](https://vensim.com/)**, el software de modelado y simulación de dinámica de sistemas de Ventana Systems, organizada como un **skill de Claude Code**. Al trabajar en este repositorio, Claude carga el skill automáticamente cuando la conversación trata de Vensim, de modelos `.mdl` o de dinámica de sistemas.

```
.claude/skills/vensim/
├── SKILL.md            # índice, chuleta esencial y reglas de oro (lo que se carga siempre)
├── references/         # 16 documentos de referencia en español (~700 KB)
├── examples/           # 7 modelos .mdl completos, con diagrama, validados
└── scripts/
    ├── validar_modelo.py   # traduce y simula un .mdl con PySD y resume los stocks
    └── mdlgen.py           # genera .mdl con diagrama (stocks, flujos, conectores, bucles) desde Python
```

### Contenido de `references/`

| # | Documento | Tema |
|---|---|---|
| 01 | [Productos, licencias y versiones](.claude/skills/vensim/references/01-productos-licencias-versiones.md) | PLE, PLE Plus, Professional, DSS y Model Reader; tabla de características, precios, plataformas e historial de versiones hasta la 10.5 |
| 02 | [Fundamentos de dinámica de sistemas](.claude/skills/vensim/references/02-fundamentos-dinamica-de-sistemas.md) | Stocks y flujos, bucles, retrasos, arquetipos, proceso de modelado, formulaciones canónicas |
| 03 | [Interfaz, sketch y herramientas](.claude/skills/vensim/references/03-interfaz-sketch-y-herramientas.md) | Menús, herramientas de dibujo y de análisis, Control Panel, editor de ecuaciones |
| 04 | [Lenguaje de ecuaciones](.claude/skills/vensim/references/04-lenguaje-de-ecuaciones.md) | Sintaxis completa, tipos de variable, operadores, macros, orden de evaluación, chuleta |
| 05 | [Referencia de funciones](.claude/skills/vensim/references/05-referencia-de-funciones.md) | ~120 funciones con firma, semántica, unidades, trampas y equivalencias |
| 06 | [Subíndices y arrays](.claude/skills/vensim/references/06-subindices-y-arrays.md) | Rangos, subrangos, mapeos, `:EXCEPT:`, funciones vectoriales |
| 07 | [Datos, lookups, importación y exportación](.claude/skills/vensim/references/07-datos-lookups-import-export.md) | Lookups, variables de datos, GET XLS/GET DIRECT, datasets |
| 08 | [Simulación e integración](.claude/skills/vensim/references/08-simulacion-e-integracion.md) | TIME STEP, métodos de integración, ciclo de simulación, SyntheSim, Gaming |
| 09 | [Unidades y Reality Check](.claude/skills/vensim/references/09-unidades-y-reality-check.md) | Consistencia dimensional y pruebas de condiciones extremas |
| 10 | [Análisis avanzado](.claude/skills/vensim/references/10-analisis-avanzado-sensibilidad-optimizacion.md) | Sensibilidad/Monte Carlo (`.vsc`), optimización y calibración (`.voc`, `.vpd`), MCMC, Kalman |
| 11 | [Automatización: scripts, DLL y Python](.claude/skills/vensim/references/11-automatizacion-scripts-dll-python.md) | Command scripts, DLL de Vensim, PySD, venpy, Venapps, Model Reader |
| 12 | [Formatos de archivo](.claude/skills/vensim/references/12-formatos-de-archivo.md) | Estructura interna del `.mdl` (ecuaciones y sketch) y demás extensiones |
| 13 | [Buenas prácticas, errores y depuración](.claude/skills/vensim/references/13-buenas-practicas-errores-y-depuracion.md) | Convenciones, catálogo de errores, metodología de depuración y checklist |
| 14 | [Ejemplos de modelos](.claude/skills/vensim/references/14-ejemplos-de-modelos.md) | Explicación completa de los 7 modelos de `examples/` |
| 15 | [Ecosistema](.claude/skills/vensim/references/15-ecosistema-y-herramientas-relacionadas.md) | PySD, SDEverywhere, Simlin, XMILE/Stella, Ventity, comunidad y bibliografía |
| 16 | [Glosario EN ↔ ES](.claude/skills/vensim/references/16-glosario.md) | Terminología de Vensim y de dinámica de sistemas |

### Modelos de ejemplo

| Modelo | Comportamiento | Edición mínima |
|---|---|---|
| `poblacion.mdl` | Crecimiento exponencial | PLE |
| `sir_epidemia.mdl` | Pico epidémico | PLE |
| `difusion_bass.mdl` | Crecimiento en S (difusión de Bass) | PLE |
| `inventario_fuerza_laboral.mdl` | Oscilación amortiguada | PLE |
| `limites_crecimiento.mdl` | Curva en S; sobrepaso con retraso de percepción | PLE |
| `proyecto_retrabajo.mdl` | "Síndrome del 90 %" | PLE |
| `cadena_envejecimiento.mdl` | Cadena de envejecimiento con subíndices | Professional / DSS |

Todos se simularon con PySD 3.14.3 y con Simlin, un segundo motor independiente (diferencias ≤ 7e-8). Falta abrirlos en Vensim. Para revalidarlos:

```bash
pip install pysd
python .claude/skills/vensim/scripts/validar_modelo.py ruta/al/modelo.mdl
```

PySD escribe un `.py` junto a cada `.mdl` que traduce; esos archivos están en `.gitignore`.

### Usar el skill fuera de este repositorio

Copia la carpeta a tu directorio personal de skills para tenerla en cualquier proyecto:

```bash
cp -r .claude/skills/vensim ~/.claude/skills/
```

### Fuentes y limitaciones

- vensim.com no era accesible desde el entorno en que se escribió esta documentación. El contenido se basa en:
  - extractos de la documentación oficial (vensim.com/documentation) obtenidos mediante búsqueda web;
  - implementaciones abiertas que reproducen Vensim: [PySD](https://github.com/SDXorg/pysd), [SDEverywhere](https://github.com/climateinteractive/SDEverywhere), [Simlin](https://github.com/bpowers/simlin) y xmutil, de Bob Eberlein;
  - cientos de modelos `.mdl` reales con salidas generadas por Vensim, de [SDXorg/test-models](https://github.com/SDXorg/test-models);
  - experimentos propios con PySD.
- Lo que no se pudo confirmar contra la documentación oficial va marcado **(verificar)** en el texto. La referencia de autoridad es siempre https://vensim.com/documentation/.
