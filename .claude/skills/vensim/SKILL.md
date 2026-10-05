---
name: vensim
description: Experto en Vensim (Ventana Systems, vensim.com) y dinámica de sistemas. Úsalo siempre que el usuario mencione Vensim, archivos .mdl/.vpmx/.vdfx/.voc/.vpd/.vsc/.cin, ecuaciones INTEG/SMOOTH/DELAY/lookups, diagramas de stocks y flujos o causales, PySD o SDEverywhere, o pida construir, depurar, calibrar, explicar o traducir un modelo de dinámica de sistemas — también si pregunta en español ("niveles y flujos", "bucles de realimentación", "modelo de simulación dinámica").
---

# Vensim — skill experto

Base de conocimiento para responder como experto en **Vensim** (software de modelado y simulación de dinámica de sistemas de Ventana Systems) y en la metodología de **dinámica de sistemas** que lo sustenta. Todo el material está en `references/` (español; términos del software en inglés) y hay modelos `.mdl` listos para abrir en `examples/`.

## Cómo usar este skill

1. Identifica el tipo de pregunta y abre **solo** el/los archivo(s) relevante(s) de la tabla de abajo (son largos; no los cargues todos).
2. Responde con la terminología exacta de Vensim (nombres de funciones, menús y herramientas en inglés) y explica en el idioma del usuario.
3. Cuando escribas ecuaciones, usa sintaxis Vensim real (`nombre = expresión ~ unidades ~ comentario |`) y **siempre incluye unidades**.
4. Si generas un modelo `.mdl`, parte de un ejemplo de `examples/` (ya tienen sección de sketch válida) y, si hay Python disponible, valídalo con PySD (ver abajo).
5. Lo marcado "(verificar)" en las referencias no se pudo confirmar contra la documentación oficial: dilo si es relevante para la respuesta y remite a https://vensim.com/documentation/.

## Mapa de referencias

| Pregunta sobre… | Archivo |
|---|---|
| Ediciones (PLE, PLE Plus, Pro, DSS, Model Reader), precios, licencias, versiones y novedades | `references/01-productos-licencias-versiones.md` |
| Teoría: stocks/flujos, bucles, retrasos, arquetipos, proceso de modelado, formulaciones canónicas | `references/02-fundamentos-dinamica-de-sistemas.md` |
| Interfaz: menús, herramientas de dibujo y análisis, Control Panel, SyntheSim desde la UI | `references/03-interfaz-sketch-y-herramientas.md` |
| Sintaxis de ecuaciones, tipos de variable, operadores, macros, orden de evaluación | `references/04-lenguaje-de-ecuaciones.md` |
| Qué hace una función concreta, firma exacta, unidades, trampas | `references/05-referencia-de-funciones.md` |
| Subíndices, rangos, mapeos, `:EXCEPT:`, funciones vectoriales | `references/06-subindices-y-arrays.md` |
| Lookups, variables de datos, GET XLS/GET DIRECT, datasets, importar/exportar | `references/07-datos-lookups-import-export.md` |
| TIME STEP, métodos de integración, ciclo de simulación, escenarios `.cin`, SyntheSim, Gaming | `references/08-simulacion-e-integracion.md` |
| Unidades, Units Check, Reality Check | `references/09-unidades-y-reality-check.md` |
| Sensibilidad/Monte Carlo (`.vsc`), optimización y calibración (`.voc`, `.vpd`), MCMC, Kalman, análisis de bucles | `references/10-analisis-avanzado-sensibilidad-optimizacion.md` |
| Command scripts, DLL de Vensim, Python (PySD / DLL), Venapps, Model Reader, funciones externas | `references/11-automatizacion-scripts-dll-python.md` |
| Formato interno del `.mdl` (ecuaciones + sketch) y demás extensiones de archivo | `references/12-formatos-de-archivo.md` |
| Convenciones, catálogo de errores/mensajes y depuración, checklist de calidad | `references/13-buenas-practicas-errores-y-depuracion.md` |
| Modelos completos comentados (población, SIR, Bass, inventario, límites, subíndices) | `references/14-ejemplos-de-modelos.md` + `examples/*.mdl` |
| PySD, SDEverywhere, XMILE/Stella, Ventity, comunidad y bibliografía | `references/15-ecosistema-y-herramientas-relacionadas.md` |
| Traducción de términos EN ↔ ES | `references/16-glosario.md` |

## Chuleta esencial (lo que hay que saber sin abrir nada)

### Forma de una ecuación en el `.mdl`
```vensim
Inventario = INTEG(Produccion - Envios, Inventario inicial)
	~	Widget
	~	Stock de producto terminado.
	|
```
- `~` separa expresión / unidades / comentario; `|` termina la ecuación. Nombres insensibles a mayúsculas; espacios y `_` son equivalentes; nombres con caracteres especiales van entre comillas `"..."`.
- `=` normal, `:=` datos, `==` constante inmutable, `nombre( [(x0,y0)-(x1,y1)], (x,y), ... )` lookup.
- Variables de control obligatorias: `INITIAL TIME`, `FINAL TIME`, `TIME STEP`, `SAVEPER` (grupo `.Control`).

### Funciones que más se usan
| Función | Uso |
|---|---|
| `INTEG(rate, init)` | Stock (nivel). |
| `SMOOTH(input, tiempo)` / `SMOOTH3` / `SMOOTHI` | Retraso de información (percepción, pronóstico adaptativo). |
| `DELAY1/DELAY3(input, tiempo)` / `DELAY N` / `DELAY FIXED` | Retraso material (conserva lo que entra). |
| `STEP(altura, t)`, `RAMP(pendiente, t0, t1)`, `PULSE(t0, duración)`, `PULSE TRAIN` | Entradas de prueba. |
| `IF THEN ELSE(cond, a, b)` | Condicional (evalúa ambas ramas). |
| `MIN`, `MAX`, `XIDZ(a,b,x)`, `ZIDZ(a,b)` | Límites y divisiones seguras. |
| `tabla(x)`, `WITH LOOKUP(x, (...))` | No linealidades. |
| `INITIAL(x)`, `ACTIVE INITIAL(x, init)` | Valor fijado en t0 / romper ciclos de inicialización. |
| `SUM(x[r!])`, `VMAX`, `VMIN`, `PROD` | Agregación sobre subíndices. |
| `RANDOM NORMAL(min,max,media,sd,semilla)`, `RANDOM UNIFORM(min,max,semilla)` | Ruido / Monte Carlo. |
| `GET XLS DATA`, `GET DIRECT DATA` (y `…CONSTANTS`, `…LOOKUPS`) | Datos externos. |

### Formulaciones canónicas
```vensim
Ajuste = (Objetivo - Stock) / Tiempo de ajuste                      ~ Unidad/Month
Efecto de X en Y = Tabla efecto X( X / X normal )                   ~ Dmnl
Salida = MIN(Salida deseada, Stock / Tiempo minimo de salida)        ~ Unidad/Month   (stock no negativo)
Percepcion = SMOOTH(Senal, Tiempo de percepcion)                     ~ unidades de Senal
```

### Reglas de oro
- **Unidades en todas las variables**; ejecutar *Units Check*. El tiempo de los stocks se multiplica implícitamente por la unidad de tiempo del modelo.
- **TIME STEP** ≤ 1/4 (idealmente 1/10) de la constante de tiempo más pequeña, potencia de 2 (1, 0.5, 0.25, 0.125, 0.0625…). Comprobar reduciendo a la mitad: el resultado no debe cambiar.
- Euler con funciones discretas (`PULSE`, `STEP`, `DELAY FIXED`, `SAMPLE IF TRUE`, aleatorios); RK4 para sistemas continuos oscilatorios. `SAVEPER` múltiplo de `TIME STEP`.
- Nunca forzar un stock no negativo con `MAX` en el stock: limita el **flujo de salida**.
- Sin números mágicos: toda constante con nombre, unidad y comentario. Lookups normalizados que pasen por (1,1).
- "Simultaneous equations" = ciclo sin stock → introducir un stock/SMOOTH o `ACTIVE INITIAL` (si el ciclo solo ocurre en la inicialización).

## Validar modelos con PySD (si hay Python)
```bash
pip install pysd
python -c "import pysd; m = pysd.read_vensim('modelo.mdl'); print(m.run().tail())"
```
PySD traduce la mayoría de funciones de Vensim (no todas: p.ej. parte de las de colas/asignación, `GAME` o funciones de DSS); un fallo en PySD no implica que el modelo sea inválido en Vensim — revisa `references/15-ecosistema-y-herramientas-relacionadas.md` y `references/11-automatizacion-scripts-dll-python.md`.

## Fuente oficial
Documentación oficial: https://vensim.com/documentation/ (índice de funciones: https://vensim.com/documentation/ref_functions.html). Foro de soporte: https://www.ventanasystems.co.uk/forum/.
