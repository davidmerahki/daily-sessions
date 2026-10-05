# 14 — Ejemplos de modelos Vensim completos y validados

> Siete modelos `.mdl` listos para abrir en Vensim (con diagrama), cada uno validado ejecutándolo con **PySD 3.14.3** y contrastado con un segundo motor independiente (**simlin**). Archivos en `kb/examples/`. Todos los valores numéricos de este documento provienen de esas simulaciones (no son estimaciones).

## Tabla de contenidos

1. [Resumen de los modelos](#1-resumen-de-los-modelos)
2. [Cómo se validaron (comandos PySD)](#2-cómo-se-validaron-comandos-pysd)
3. [Anatomía de los archivos .mdl de ejemplo](#3-anatomía-de-los-archivos-mdl-de-ejemplo)
4. [Modelo 1 — `poblacion.mdl`: crecimiento poblacional (R + B)](#4-modelo-1--poblacionmdl-crecimiento-poblacional-r--b)
5. [Modelo 2 — `sir_epidemia.mdl`: epidemia SIR](#5-modelo-2--sir_epidemiamdl-epidemia-sir)
6. [Modelo 3 — `difusion_bass.mdl`: difusión de innovaciones de Bass](#6-modelo-3--difusion_bassmdl-difusión-de-innovaciones-de-bass)
7. [Modelo 4 — `inventario_fuerza_laboral.mdl`: inventario y fuerza laboral (oscilación)](#7-modelo-4--inventario_fuerza_laboralmdl-inventario-y-fuerza-laboral-oscilación)
8. [Modelo 5 — `limites_crecimiento.mdl`: capacidad de carga con lookups normalizados](#8-modelo-5--limites_crecimientomdl-capacidad-de-carga-con-lookups-normalizados)
9. [Modelo 6 — `cadena_envejecimiento.mdl`: cadena de envejecimiento con subíndices](#9-modelo-6--cadena_envejecimientomdl-cadena-de-envejecimiento-con-subíndices)
10. [Modelo 7 — `proyecto_retrabajo.mdl`: ciclo de retrabajo de un proyecto](#10-modelo-7--proyecto_retrabajomdl-ciclo-de-retrabajo-de-un-proyecto)
11. [Plantilla mínima para crear un modelo nuevo](#11-plantilla-mínima-para-crear-un-modelo-nuevo)
12. [Fuentes](#12-fuentes)

---

## 1. Resumen de los modelos

| # | Archivo | Comportamiento de referencia | Estructuras / funciones que ilustra | Unidad de tiempo, horizonte, TIME STEP |
|---|---------|------------------------------|-------------------------------------|----------------------------------------|
| 1 | `poblacion.mdl` | Crecimiento exponencial (o decaimiento / equilibrio) | Stock con entrada y salida de primer orden, bucles R1/B1, `XIDZ`, `LN` | Year, 0–100, 0.125 |
| 2 | `sir_epidemia.mdl` | Pico epidémico (S descendente en Susceptibles, campana en Infecciosos) | Cadena de 3 stocks, bucles R/B no lineales, R0 y Re | Day, 0–120, 0.0625 |
| 3 | `difusion_bass.mdl` | Crecimiento en S | Desplazamiento de dominancia R→B, publicidad + boca a boca | Year, 0–15, 0.015625 |
| 4 | `inventario_fuerza_laboral.mdl` | Oscilación amortiguada | Ajuste de stock, `SMOOTH` (pronóstico), `DELAY3` (contratación), `STEP`, `MIN`/`MAX`, `ZIDZ` | Week, 0–100, 0.0625 |
| 5 | `limites_crecimiento.mdl` | Crecimiento en S; sobrepaso y oscilación con retraso | Lookups normalizados en (1,1), `SMOOTH3`, efecto "f(X/X normal)", variables sombra | Year, 0–200, 0.125 |
| 6 | `cadena_envejecimiento.mdl` | Crecimiento con cambio de estructura etaria | Aging chain, **subíndices** (`Region: norte, sur`), ecuaciones por elemento, `SUM(x[Region!])` | Year, 0–100, 0.25 |
| 7 | `proyecto_retrabajo.mdl` | "Síndrome del 90 %" | Ciclo de retrabajo, control de primer orden con `MIN`, conservación de tareas | Week, 0–200, 0.125 |

Convenciones comunes a los siete archivos:

- Nombres de variables en español **sin tildes ni ñ** (máxima portabilidad hacia PySD, SDEverywhere, scripts y archivos de comandos); los comentarios sí usan UTF-8 (cabecera `{UTF-8}`).
- Stocks con mayúscula inicial (`Poblacion`, `Inventario`); auxiliares y flujos en minúsculas.
- Unidades en inglés para aprovechar las equivalencias que Vensim ya trae (`Person`/`People`/`Persons`, `Year`/`Years`, `Week`/`Weeks`, `Day`/`Days`); unidades propias (`Widget`, `Animal`, `Task`) declaradas como sinónimos singular/plural en la sección de configuración (líneas `22:` del archivo).
- Toda constante tiene nombre, unidades y, cuando procede, un rango `[min,max,paso]` que Vensim usa para los deslizadores de SyntheSim.
- Los stocks se inicializan en equilibrio cuando el experimento es una perturbación (modelo 4) para que cualquier cambio sea atribuible a la perturbación.
- Marcadores de bucle (R/B) y signos de polaridad incluidos en el sketch.
- **Edición de Vensim**: los modelos 1–5 y 7 sólo usan funciones básicas (`INTEG`, `SMOOTH`, `SMOOTH3`, `DELAY3`, `STEP`, `MIN`, `MAX`, `XIDZ`, `ZIDZ`, `LN`, lookups) y deberían funcionar en cualquier edición, incluida PLE **(verificar disponibilidad de cada función en PLE)**; el modelo 6 usa **subíndices**, que requieren Vensim Professional o DSS (ver `01-productos-licencias-versiones.md`).

## 2. Cómo se validaron (comandos PySD)

Intérprete: `scratchpad/venv/bin/python` (PySD 3.14.3). Patrón usado para cada modelo:

```python
import pysd
m = pysd.read_vensim("kb/examples/sir_epidemia.mdl")   # traduce .mdl -> .py y carga
r = m.run()                                            # DataFrame indexado por tiempo
r["Infecciosos"].max(), r["Infecciosos"].idxmax()      # pico y momento del pico
m.run(params={"tasa de contactos": 3})                 # experimento: cambiar una constante
m.run(time_step=0.015625, saveper=0.015625)            # prueba de sensibilidad al TIME STEP
```

Notas prácticas observadas durante la validación:

- `read_vensim` escribe un `.py` (y `__pycache__`) junto al `.mdl`. Para no ensuciar `kb/examples/` se copió cada modelo a `work-ex/val/` antes de traducirlo.
- **Cambiar el paso de integración**: usar `run(time_step=..., saveper=...)`. Pasar `params={"TIME STEP": x}` dio resultados inconsistentes en PySD 3.14.3: con una versión del modelo de Bass guardada con TIME STEP 0.0625, `params={"TIME STEP": 0.015625}` dejó la rejilla en 0.0625 y el resultado sin cambios, y `params={"TIME STEP": 0.25}` dio un pico de 377 781 frente a 379 536 con `time_step=0.25`.
- Si se regenera un `.mdl` y se vuelve a traducir **dentro del mismo segundo** y con el mismo tamaño de archivo, Python puede reutilizar el bytecode en caché del `.py` anterior y devolver resultados obsoletos. Usar nombres de archivo distintos o borrar `__pycache__`.
- Validación cruzada: los siete modelos también se simularon con `simlin simulate archivo.mdl` (motor independiente en Rust, compilado desde `src/simlin`). La máxima diferencia relativa entre PySD y simlin, variable por variable y en todos los instantes, fue ≤ 7e-8 (≤ 2e-12 en seis de los siete modelos). simlin además importó y renderizó el sketch de los siete archivos sin errores, lo que confirma que la sección de diagrama es sintácticamente válida. simlin también hace inferencia y verificación de unidades: **no reportó ningún problema dimensional** en los siete modelos (control negativo: al cambiar a propósito `muertes = Poblacion*esperanza de vida` emite `unit_mismatch -- the equation computes to units 'person*year', but the variable's specified units are 'person/year'`).
- No se dispuso de Vensim para abrir los archivos; el formato se copió de modelos guardados por Vensim (`test-models/samples/*`, `SDEverywhere/examples/sir/model/sir.mdl`). Abrirlos en Vensim y ejecutar *Check Model* y *Units Check* es la verificación final recomendada **(verificar)**.

## 3. Anatomía de los archivos .mdl de ejemplo

Un `.mdl` es texto plano con tres partes. Conocerlas permite generar o reparar modelos sin abrir Vensim.

**(a) Sección de ecuaciones.** Cada registro termina en `|` y tiene la forma `nombre = expresión ~ unidades [rango] ~ comentario |`:

```vensim
{UTF-8}
Poblacion= INTEG (
	nacimientos-muertes,
		poblacion inicial)
	~	Person [0,?]
	~	Stock (nivel) de personas. Acumula nacimientos menos muertes.
	|

tasa de natalidad=
	0.03
	~	1/Year [0,0.1,0.005]
	~	Nacimientos por persona por año (fracción de natalidad).
	|
```

- Una línea terminada en `\` continúa en la siguiente.
- Los grupos se abren con un registro `****...*** .nombre ****...***~ comentario |`; el grupo `.Control` contiene `FINAL TIME`, `INITIAL TIME`, `SAVEPER` y `TIME STEP`.
- Lookups: `nombre( [(xmin,ymin)-(xmax,ymax)],(x1,y1),(x2,y2),... )`.
- Rangos de subíndices: `Region: norte, sur ~ ~ comentario |`. Ecuaciones por elemento: se encadenan registros con `~~|` y sólo el último lleva unidades y comentario.

**(b) Sección de sketch** (desde `\\\---/// Sketch information - do not modify anything except names` hasta `///---\\\`). Cabecera `V300 ...`, `*NombreDeLaVista`, línea de fuente `$192-192-192,0,Times New Roman|12||...`, y un objeto por línea:

| Código | Objeto | Ejemplo en `poblacion.mdl` | Campos relevantes |
|--------|--------|----------------------------|-------------------|
| `10` | Variable (stock, auxiliar, etiqueta de flujo, sombra) | `10,1,Poblacion,400,220,40,20,3,3,0,0,0,0,0,0` | id, nombre, x, y, semiancho, semialto, forma (3 = caja de stock, 8 = auxiliar sin caja, 40 = nombre unido a una válvula), bits (3 = normal; 2 = variable sombra) |
| `11` | Válvula de un flujo | `11,5,48,300,220,6,8,34,3,0,0,1,0,0,0` | forma 34 = flujo horizontal, 33 = vertical |
| `12` | Nube (fuente/sumidero) o comentario | `12,2,48,230,220,10,8,0,3,0,0,-1,0,0,0` | `48` en el 3.er campo = nube; con texto en la línea siguiente = comentario |
| `12` | Marcador de bucle | `12,25,0,330,250,15,15,5,4,0,0,-1,0,0,0` + línea `R` | forma 4 / 5 = icono de bucle en uno u otro sentido de giro (qué valor corresponde a cada sentido: verificar) |
| `1` | Conector (flecha) o tubería | `1,17,1,5,1,0,43,0,0,64,0,-1--1--1,,1\|(345,290)\|` | id, desde, hasta, forma (0 recta, 1 curva por el punto de control), polaridad (43 = `+`, 45 = `-`, 0 = sin signo), …, `64`, 1 = enlace de inicialización; tuberías de flujo: grosor 22 |

Convenciones de tubería observadas en archivos de Vensim: el conector de la válvula al extremo aguas abajo lleva forma `4` y el del extremo aguas arriba forma `100`; las flechas de información hacia un flujo suelen apuntar a la **válvula** (id del objeto `11`), aunque Vensim también acepta la etiqueta del flujo (ambas formas aparecen en `samples/SIR/SIR.mdl`).

**(c) Sección de configuración** (tras `///---\\\`, empieza por `:L<%^E!@`): líneas `1:` (nombre del run por defecto), `22:` (equivalencias de unidades), `4:Time`, `5:` (variable seleccionada en el Control Panel), etc. Vensim la regenera al guardar.

Los siete archivos se generaron con un pequeño script Python (`work-ex/mdlgen.py`) que escribe exactamente este formato; puede reutilizarse para producir modelos con diagrama de forma programática.

---

## 4. Modelo 1 — `poblacion.mdl`: crecimiento poblacional (R + B)

**Propósito.** El modelo más simple con dos bucles: mostrar que el signo de la *fracción neta* (natalidad − mortalidad) determina si el sistema crece exponencialmente, decae o permanece en equilibrio.

**Estructura.** Un stock (`Poblacion`), un flujo de entrada proporcional (`nacimientos = Poblacion * tasa de natalidad`) y un flujo de salida de primer orden (`muertes = Poblacion / esperanza de vida`).

**Bucles.**
- **R1 Nacimientos** (+): Poblacion → (+) nacimientos → (+) Poblacion.
- **B1 Muertes** (−): Poblacion → (+) muertes → (−) Poblacion.
Con `tasa de natalidad = 0.03 1/Year` y `1/esperanza de vida = 0.02 1/Year`, domina R1 y la fracción neta es 0.01 1/Year.

**Ecuaciones** (formato compacto `ecuación ~ unidades [rango]`; el `.mdl` incluye comentarios):

```vensim
Poblacion = INTEG(nacimientos-muertes, poblacion inicial)       ~ Person [0,?]
nacimientos = Poblacion*tasa de natalidad                       ~ Person/Year
muertes = Poblacion/esperanza de vida                           ~ Person/Year
tasa de natalidad = 0.03                                        ~ 1/Year [0,0.1,0.005]
esperanza de vida = 50                                          ~ Year [10,100,1]
poblacion inicial = 1000                                        ~ Person
fraccion neta de crecimiento = tasa de natalidad-1/esperanza de vida
                                                                ~ 1/Year
tiempo de duplicacion = XIDZ(LN(2), fraccion neta de crecimiento, -1)
                                                                ~ Year
FINAL TIME = 100                                                ~ Year
INITIAL TIME = 0                                                ~ Year
SAVEPER = TIME STEP                                             ~ Year [0,?]
TIME STEP = 0.125                                               ~ Year [0,?]
```

**Resultados (PySD, TIME STEP 0.125, Euler).**

| Indicador | Valor simulado | Referencia analítica |
|-----------|----------------|----------------------|
| Poblacion(0) | 1000 | — |
| Poblacion(50) | 1648.21 | 1000·e^0.5 = 1648.72 |
| Poblacion(100) | **2716.58** | 1000·e^1 = 2718.28 (el 0.06 % de diferencia es error de integración de Euler) |
| tiempo de duplicacion | 69.31 años | ln 2 / 0.01 = 69.31 |
| `tasa de natalidad = 0.02` | Poblacion(100) = 1000.00 (equilibrio) | fracción neta 0 |
| `tasa de natalidad = 0.01` | Poblacion(100) = 367.65; `tiempo de duplicacion = -69.31` | 1000·e^−1 ≈ 367.9 |

**Experimentos sugeridos.**
1. En SyntheSim, mover `tasa de natalidad` entre 0.01 y 0.05: el modo cambia de decaimiento a equilibrio y a crecimiento exponencial.
2. Cambiar `esperanza de vida` a 25 años (fracción de mortalidad 0.04): resultado 367.65, idéntico al caso anterior porque sólo importa la fracción neta.
3. Reducir TIME STEP a 0.0625 y comparar con 2718.28 (prueba de error de integración).
4. Añadir una capacidad de carga (ver modelo 5) para convertir el crecimiento exponencial en S.

---

## 5. Modelo 2 — `sir_epidemia.mdl`: epidemia SIR

**Propósito.** Modelo clásico de contagio (Kermack-McKendrick; formulación de Sterman 2000, cap. 9): umbral epidémico, pico, inmunidad de rebaño y tamaño final.

**Estructura.** Cadena de tres stocks conservativa `Susceptibles → Infecciosos → Recuperados` (S + I + R = 10 000 en todo instante; verificado: 10 000.0000 al final). La `tasa de infeccion` es el producto *contactos de los susceptibles × probabilidad de que el contacto sea con un infeccioso × infectividad*.

**Bucles.**
- **R1 Contagio** (+): Infecciosos → tasa de infeccion → Infecciosos.
- **B1 Agotamiento** (−): Susceptibles → tasa de infeccion → (−) Susceptibles.
- **B2 Recuperación** (−): Infecciosos → tasa de recuperacion → (−) Infecciosos.
La dominancia pasa de R1 a B1/B2 cuando el número reproductivo efectivo `Re = R0·S/N` cae por debajo de 1.

**Ecuaciones.**

```vensim
Susceptibles = INTEG(-tasa de infeccion, poblacion total-infecciosos iniciales)
                                                                ~ Person [0,?]
Infecciosos = INTEG(tasa de infeccion-tasa de recuperacion, infecciosos iniciales)
                                                                ~ Person [0,?]
Recuperados = INTEG(tasa de recuperacion, 0)                    ~ Person [0,?]
tasa de infeccion = tasa de contactos*infectividad*Susceptibles*Infecciosos/poblacion total
                                                                ~ Person/Day
tasa de recuperacion = Infecciosos/duracion de la enfermedad    ~ Person/Day
tasa de contactos = 5                                           ~ 1/Day [0,20,0.5]
infectividad = 0.1                                              ~ Dmnl [0,1,0.01]
duracion de la enfermedad = 5                                   ~ Day [1,20,0.5]
poblacion total = 10000                                         ~ Person
infecciosos iniciales = 1                                       ~ Person
numero reproductivo basico = tasa de contactos*infectividad*duracion de la enfermedad
                                                                ~ Dmnl
numero reproductivo efectivo = numero reproductivo basico*Susceptibles/poblacion total
                                                                ~ Dmnl
FINAL TIME = 120                                                ~ Day
INITIAL TIME = 0                                                ~ Day
SAVEPER = TIME STEP                                             ~ Day [0,?]
TIME STEP = 0.0625                                              ~ Day [0,?]
```

Comprobación dimensional de la ecuación clave: `(1/Day)·Dmnl·Person·Person/Person = Person/Day`.

**Resultados (PySD, TIME STEP 0.0625).**

| Indicador | Simulado | Analítico (SIR continuo) |
|-----------|----------|--------------------------|
| R0 = c·i·d | 2.5 | — |
| Pico de Infecciosos | **2344.5 personas en el día 32.31** | fracción pico 1 − (1 + ln R0)/R0 = 23.35 % → 2335 |
| Re en el pico | 0.994 (cruza 1 en t = 32.31, el mismo instante del pico) | Re = 1 en el pico |
| Máxima tasa de infeccion | 588.3 personas/día en el día 28.69 | — |
| Susceptibles finales (t = 120) | 1065.5 | — |
| Recuperados finales | 8934.5 (89.3 %) | z = 1 − e^(−R0·z) → 89.26 % |
| `tasa de contactos = 3` (R0 = 1.5) | pico 632.0 en el día 80.44; Recuperados(120) = 5560 (la epidemia aún no terminó; con FINAL TIME = 400: 5833) | tamaño final 58.28 % |
| `tasa de contactos = 2` (R0 = 1.0) | no hay brote: el pico es el caso inicial (1 persona en t = 0); Recuperados(120) = 23.7 | umbral R0 = 1 |

Sensibilidad al paso de integración (pico de Infecciosos): dt = 0.5 → 2410.8 (t = 34.0); dt = 0.25 → 2372.8 (t = 33.0); dt = 0.0625 → 2344.5 (t = 32.31); dt = 0.015625 → 2337.6 (t = 32.13). Con 0.0625 el error del pico es < 0.3 %.

**Experimentos sugeridos.**
1. Política de distanciamiento: reducir `tasa de contactos` (SyntheSim) y observar cómo baja y se retrasa el pico ("aplanar la curva").
2. Vacunación previa: inicializar `Recuperados` en una fracción de la población y restarla del inicial de `Susceptibles` (p. ej. `poblacion total - infecciosos iniciales - vacunados iniciales`).
3. Pérdida de inmunidad: añadir un flujo `Recuperados → Susceptibles` = `Recuperados / duracion de la inmunidad` (SIRS) para obtener oscilaciones amortiguadas.
4. Sustituir la salida de primer orden por `DELAY3` o una cadena de 3 stocks "infecciosos" para ver el efecto del orden del retraso sobre el pico.

---

## 6. Modelo 3 — `difusion_bass.mdl`: difusión de innovaciones de Bass

**Propósito.** Crecimiento en S de un producto nuevo (Bass 1969; formulación de Sterman 2000, sec. 9.3.3) con dos fuentes de adopción: publicidad (innovadores, coeficiente p) y boca a boca (imitadores, coeficiente q = c·i).

**Estructura.** Dos stocks (`Adoptantes potenciales`, `Adoptantes`) unidos por un único flujo `tasa de adopcion = adopcion por publicidad + adopcion por boca a boca`.

**Bucles.**
- **R1 Boca a boca** (+): Adoptantes → adopcion por boca a boca → Adoptantes.
- **B1 Saturación (publicidad)** y **B2 Saturación (boca a boca)** (−): cuantos menos Adoptantes potenciales quedan, menor la adopción.
La curva cambia de cóncava a convexa cuando la dominancia pasa de R1 a B2 (punto de inflexión ≈ 50 % de penetración cuando p ≪ q).

**Ecuaciones.**

```vensim
Adoptantes potenciales = INTEG(-tasa de adopcion, poblacion total-adoptantes iniciales)
                                                                ~ Person [0,?]
Adoptantes = INTEG(tasa de adopcion, adoptantes iniciales)      ~ Person [0,?]
tasa de adopcion = adopcion por publicidad+adopcion por boca a boca
                                                                ~ Person/Year
adopcion por publicidad = efectividad de la publicidad*Adoptantes potenciales
                                                                ~ Person/Year
adopcion por boca a boca = tasa de contactos*fraccion de adopcion*Adoptantes potenciales*Adoptantes/poblacion total
                                                                ~ Person/Year
efectividad de la publicidad = 0.011                            ~ 1/Year [0,0.1,0.001]
tasa de contactos = 100                                         ~ 1/Year [0,200,5]
fraccion de adopcion = 0.015                                    ~ Dmnl [0,0.1,0.001]
poblacion total = 1e+06                                         ~ Person
adoptantes iniciales = 0                                        ~ Person
fraccion de mercado = Adoptantes/poblacion total                ~ Dmnl
FINAL TIME = 15                                                 ~ Year
INITIAL TIME = 0                                                ~ Year
SAVEPER = TIME STEP                                             ~ Year [0,?]
TIME STEP = 0.015625                                            ~ Year [0,?]
```

**Resultados (PySD, TIME STEP 0.015625).**

| Indicador | Simulado | Analítico (Bass) |
|-----------|----------|------------------|
| Pico de la tasa de adopcion | **380 520 personas/año en t = 3.28 años** | N(p+q)²/(4q) = 380 520; t* = ln(q/p)/(p+q) = 3.25 años |
| Fracción de mercado en el pico | 0.497 | 0.5 − p/(2q) = 0.496 |
| Adoptantes(5) / (10) / (15) | 931 263 / 999 965 / 1 000 000 | — |
| Origen de la adopción en t = 0 | 100 % publicidad (no hay adoptantes iniciales) | — |
| `efectividad de la publicidad = 0` y 0 adoptantes iniciales | Adoptantes(15) = 0: sin "semilla" el bucle R1 no puede arrancar (equilibrio inestable en cero) | — |
| `efectividad de la publicidad = 0`, `adoptantes iniciales = 1` | pico 374 994 en t = 9.31; Adoptantes(15) = 999 820 | modelo logístico puro |

**Sensibilidad al TIME STEP** (un buen ejercicio de la prueba de error de integración):

| TIME STEP | Pico | t del pico | Adoptantes(5) |
|-----------|------|------------|----------------|
| 0.25 | 379 536 | 3.750 | 897 448 |
| 0.125 | 380 337 | 3.500 | 918 054 |
| 0.0625 | 380 488 | 3.375 | 926 033 |
| **0.015625** (valor del archivo) | 380 520 | 3.281 | 931 263 |
| 0.00390625 | 380 519 | 3.262 | 932 483 |

Los resultados dejan de cambiar de forma apreciable por debajo de 1/64 de año; con 0.25 el pico se desplaza medio año. Por eso el archivo usa 0.015625.

**Experimentos sugeridos.**
1. Duplicar `efectividad de la publicidad`: el despegue es más temprano pero el pico apenas cambia.
2. Reducir `fraccion de adopcion` a la mitad: la S se estira en el tiempo (el boca a boca domina la duración).
3. Añadir abandono/reposición (`Adoptantes → Adoptantes potenciales` con una vida útil del producto) para obtener un equilibrio de ventas de reposición.
4. Calibrar p y q contra datos de ventas (*Optimize* con un payoff de calibración; disponible en Vensim Pro/DSS, en PLE Plus: verificar).

---

## 7. Modelo 4 — `inventario_fuerza_laboral.mdl`: inventario y fuerza laboral (oscilación)

**Propósito.** Mostrar cómo una estructura de gestión de stocks razonable localmente (corregir brechas de inventario y de personal) genera **oscilación** cuando hay retrasos (pronóstico suavizado + retraso de contratación). Inspirado en los modelos de inventario/fuerza laboral de la *Vensim User Guide* y Sterman (2000, caps. 17–19), simplificado.

**Estructura.**
- Demanda exógena: `pedidos de clientes` con un `STEP` de +20 % en la semana 10.
- Pronóstico: `pedidos esperados = SMOOTH(pedidos de clientes, 4 semanas)` (retraso de información).
- Stock `Inventario` (entrada `produccion`, salida `envios` protegida con `MIN` para que nunca envíe más de lo disponible).
- Regla de producción deseada = pedidos esperados + corrección de inventario (formulación canónica de ajuste de stock).
- Stock `Fuerza laboral` ajustado hacia la `fuerza laboral deseada`, con la decisión de contratación materializada a través de `DELAY3` (3.er orden, 3 semanas).
- Ambos stocks se inicializan en su valor deseado ⇒ el modelo arranca en **equilibrio** (comprobado: Inventario = 400 y Fuerza laboral = 100 constantes hasta la semana 10).

**Bucles.**
- **B1 Ajuste de inventario**: Inventario → (−) ajuste de inventario → produccion deseada → … → produccion → Inventario.
- **B2 Ajuste de personal**: Fuerza laboral → (−) contratacion neta deseada → contratacion neta → Fuerza laboral.
- **B3 Inventario-personal** (lazo de segundo orden que contiene ambos stocks y el `DELAY3`): es el que oscila.

**Ecuaciones.**

```vensim
pedidos de clientes = demanda base*(1+STEP(incremento de la demanda, tiempo del escalon))
                                                                ~ Widget/Week
demanda base = 100                                              ~ Widget/Week
incremento de la demanda = 0.2                                  ~ Dmnl [-0.5,1,0.05]
tiempo del escalon = 10                                         ~ Week
pedidos esperados = SMOOTH(pedidos de clientes, tiempo para promediar pedidos)
                                                                ~ Widget/Week
tiempo para promediar pedidos = 4                               ~ Week [1,20,1]
Inventario = INTEG(produccion-envios, inventario deseado)       ~ Widget [0,?]
envios = MIN(pedidos de clientes, envios maximos)               ~ Widget/Week
envios maximos = Inventario/tiempo minimo de procesamiento      ~ Widget/Week
tiempo minimo de procesamiento = 1                              ~ Week
inventario deseado = pedidos esperados*cobertura deseada de inventario
                                                                ~ Widget
cobertura deseada de inventario = 4                             ~ Week
ajuste de inventario = (inventario deseado-Inventario)/tiempo de ajuste de inventario
                                                                ~ Widget/Week
tiempo de ajuste de inventario = 8                              ~ Week [1,20,1]
produccion deseada = MAX(0, pedidos esperados+ajuste de inventario)
                                                                ~ Widget/Week
fuerza laboral deseada = produccion deseada/productividad       ~ Person
productividad = 1                                               ~ Widget/(Person*Week)
Fuerza laboral = INTEG(contratacion neta, fuerza laboral deseada)
                                                                ~ Person [0,?]
contratacion neta deseada = (fuerza laboral deseada-Fuerza laboral)/tiempo de ajuste de la fuerza laboral
                                                                ~ Person/Week
tiempo de ajuste de la fuerza laboral = 4                       ~ Week [1,20,1]
contratacion neta = DELAY3(contratacion neta deseada, retraso de contratacion)
                                                                ~ Person/Week
retraso de contratacion = 3                                     ~ Week [1,20,1]
produccion = Fuerza laboral*productividad                       ~ Widget/Week
cobertura de inventario = ZIDZ(Inventario, envios)              ~ Week
FINAL TIME = 100                                                ~ Week
INITIAL TIME = 0                                                ~ Week
SAVEPER = TIME STEP                                             ~ Week [0,?]
TIME STEP = 0.0625                                              ~ Week [0,?]
```

Nota: `contratacion neta = DELAY3(...)` puede ser negativa (despidos). Aplicar `DELAY3` a una magnitud con signo es una simplificación aceptable aquí; un modelo más detallado separaría contrataciones y despidos y usaría un stock de vacantes.

**Resultados (PySD, TIME STEP 0.0625).**

| Indicador | Valor |
|-----------|-------|
| Equilibrio inicial (t < 10) | Inventario 400 Widget, Fuerza laboral 100 Person |
| pedidos esperados | 112.7 (t = 14), 118.4 (t = 20), 119.9 (t = 30) → 120 |
| Mínimo de Inventario | **287.6 Widget en la semana 17.6** (los envíos suben antes que la producción) |
| Máximo de Inventario (sobrepaso) | **509.2 en la semana 32.5** (objetivo final 480) |
| Pico de Fuerza laboral | **144.5 Person en la semana 24.1** (objetivo 120: sobrepaso del 20 %) |
| Valle posterior | 113.3 en la semana 37.1 |
| Valores finales (t = 100) | Inventario 480.2, Fuerza laboral 120.06, cobertura 4.00 semanas |
| Rango de contratacion neta | +5.96 a −3.89 Person/Week |

Experimentos ya ejecutados (muestran la sensibilidad de la estabilidad a los retrasos):

| Cambio | Inventario mín / máx | Fuerza laboral máx / mín | Diagnóstico |
|--------|----------------------|--------------------------|-------------|
| `retraso de contratacion = 1` | 315.2 / 484.8 | 133.6 / 100.0 | casi sin sobrepaso |
| `tiempo de ajuste de inventario = 4` | 302.9 / 614.6 | 160.4 / 80.5 (85.5 en t = 100) | oscilación sostenida, mal amortiguada |
| `tiempo de ajuste de inventario = 4` y `retraso de contratacion = 6` | −131.6 / 2793.8 | 452.1 / −256.6 | **inestable**: oscilación creciente y stocks negativos → el modelo deja de ser físicamente válido |

La última fila es una buena prueba de condiciones extremas: muestra que la protección `MIN` sólo cubre los envíos, mientras que `Fuerza laboral` y la producción pueden volverse negativas. Para un modelo de uso real habría que añadir control de primer orden también en los despidos (ver `13-buenas-practicas-errores-y-depuracion.md`).

**Experimentos sugeridos.**
1. SyntheSim: variar `retraso de contratacion` y `tiempo de ajuste de inventario` y localizar la frontera de estabilidad.
2. Añadir una corrección por la "línea de suministro" (contrataciones en curso = stock implícito del `DELAY3`), como en la estructura de gestión de stocks de Sterman: reduce el sobrepaso.
3. Sustituir `STEP` por `RAMP` o por ruido (`RANDOM NORMAL` suavizado, o `RANDOM PINK NOISE` si su versión de Vensim lo incluye **(verificar)**) para ver la amplificación.
4. Comparar `SMOOTH` con `SMOOTH3` y con `TREND` en el pronóstico.

---

## 8. Modelo 5 — `limites_crecimiento.mdl`: capacidad de carga con lookups normalizados

**Propósito.** Crecimiento en S hacia una capacidad de carga, formulado con la estructura canónica *efecto de X sobre Y = f(X / X normal)* y lookups normalizados que pasan por (1, 1). Con un retraso de percepción largo, el mismo modelo genera **sobrepaso y oscilación**.

**Estructura.**
- `nacimientos = Poblacion · fraccion normal de natalidad · efecto de la densidad sobre la natalidad(densidad percibida)`; ídem para `muertes`.
- `densidad relativa = Poblacion / capacidad de carga` (entrada normalizada). Punto de normalización: en densidad relativa 1 ambos efectos valen 1 y, como `fraccion normal de natalidad = fraccion normal de mortalidad = 0.05`, la capacidad de carga es el equilibrio.
- `densidad percibida = SMOOTH3(densidad relativa, tiempo de percepcion de la densidad)`: retraso de información (1 año por defecto).
- Variables sombra (`<nacimientos>`, `<muertes>`, `<Poblacion>`) para calcular la fracción neta sin cruzar el diagrama.

**Bucles.** **R1 Reproducción** (+); **B1 Hacinamiento-natalidad** (−); **B2 Hacinamiento-mortalidad** (−).

**Ecuaciones.**

```vensim
Poblacion = INTEG(nacimientos-muertes, poblacion inicial)       ~ Animal [0,?]
nacimientos = Poblacion*fraccion normal de natalidad*efecto de la densidad sobre la natalidad(densidad percibida)
                                                                ~ Animal/Year
muertes = Poblacion*fraccion normal de mortalidad*efecto de la densidad sobre la mortalidad(densidad percibida)
                                                                ~ Animal/Year
fraccion normal de natalidad = 0.05                             ~ 1/Year [0,0.2,0.005]
fraccion normal de mortalidad = 0.05                            ~ 1/Year [0,0.2,0.005]
capacidad de carga = 10000                                      ~ Animal [1000,20000,500]
densidad relativa = Poblacion/capacidad de carga                ~ Dmnl
densidad percibida = SMOOTH3(densidad relativa, tiempo de percepcion de la densidad)
                                                                ~ Dmnl
tiempo de percepcion de la densidad = 1                         ~ Year [0.5,30,0.5]
efecto de la densidad sobre la natalidad([(0,0)-(2,2)],(0,2),(0.25,1.9),(0.5,1.7),(0.75,1.4),(1,1),(1.25,0.6),(1.5,0.35),(1.75,0.2),(2,0.1))
                                                                ~ Dmnl
efecto de la densidad sobre la mortalidad([(0,0)-(2,2.8)],(0,0.5),(0.25,0.55),(0.5,0.65),(0.75,0.8),(1,1),(1.25,1.3),(1.5,1.7),(1.75,2.2),(2,2.8))
                                                                ~ Dmnl
poblacion inicial = 100                                         ~ Animal
fraccion neta de crecimiento = ZIDZ(nacimientos-muertes, Poblacion)
                                                                ~ 1/Year
FINAL TIME = 200                                                ~ Year
INITIAL TIME = 0                                                ~ Year
SAVEPER = TIME STEP                                             ~ Year [0,?]
TIME STEP = 0.125                                               ~ Year [0,?]
```

Forma de los lookups: el efecto sobre la natalidad es decreciente (2 → 1 → 0.1) y el de la mortalidad creciente (0.5 → 1 → 2.8); ambos con pendiente suave cerca de los extremos para evitar comportamientos artificiales. A densidad cero la fracción neta máxima es 0.05·2 − 0.05·0.5 = 0.075 1/Year (simulado: 0.0747 en t = 0).

**Resultados (PySD, TIME STEP 0.125).**

| Indicador | Valor |
|-----------|-------|
| Poblacion(25 / 50 / 75 / 100) | 633.6 / 3610 / 9211.3 / 9973 |
| Poblacion(150) y (200) | 10 000.0 (= capacidad de carga) |
| Máximo crecimiento neto | 277.7 Animal/Year en t = 57.6, con Poblacion = 5556 (0.56 × capacidad; en el logístico puro sería 0.5) |
| `capacidad de carga = 5000` | Poblacion(200) = 5000.0 |
| `tiempo de percepcion de la densidad = 10` | sobrepaso: máximo 12 729 en t = 76.4, mínimo 8629 en t = 99.0, Poblacion(200) = 9930 (oscilación amortiguada) |
| `tiempo de percepcion de la densidad = 20` | sobrepaso fuerte: máximo 20 409 en t = 81.2, mínimo 3504 en t = 116.0, Poblacion(200) = 4824 (oscilación de gran amplitud) |

Lectura: la S es el resultado de un desplazamiento de dominancia de R1 a B1/B2 **sin retrasos significativos** en los bucles B. Al introducir un retraso en el bucle de balance aparece el modo "crecimiento en S con sobrepaso y oscilación". Para "sobrepaso y colapso" haría falta además que la capacidad de carga sea erosionable (un stock que la población consume), ver `02-fundamentos-dinamica-de-sistemas.md`.

**Experimentos sugeridos.**
1. Convertir `capacidad de carga` en un stock con regeneración y consumo proporcional a la población → sobrepaso y colapso.
2. Editar los lookups (doble clic → editor gráfico) haciendo uno de ellos plano (=1): el equilibrio sigue en la capacidad, pero la trayectoria cambia.
3. Sustituir la estructura por la logística clásica: `fraccion neta = g max · (1 − Poblacion/capacidad de carga)` y comparar.

---

## 9. Modelo 6 — `cadena_envejecimiento.mdl`: cadena de envejecimiento con subíndices

**Propósito.** Mostrar dos formulaciones canónicas a la vez: la **cadena de envejecimiento** (aging chain) de cohortes y los **subíndices** (arrays) de Vensim para replicar la misma estructura en dos regiones con parámetros distintos. Requiere Vensim Professional o DSS (subíndices).

**Estructura.**
- Rango de subíndices `Region: norte, sur`.
- Tres stocks subindicados `Menores[Region]` (0–15), `Adultos[Region]` (15–65), `Mayores[Region]` (65+), unidos por flujos de primer orden `maduracion = Menores/duracion de la infancia` y `envejecimiento = Adultos/duracion de la adultez`.
- Constantes por región definidas como listas (`fecundidad[Region] = 0.04, 0.025`) y constantes sin subíndice que se aplican a todas las regiones (`mortalidad adulta`).
- **Ecuaciones por elemento**: `migracion neta[norte] = -flujo migratorio` y `migracion neta[sur] = flujo migratorio` (conservación: lo que sale del norte entra al sur).
- Agregación: `poblacion total global = SUM(poblacion total[Region!])`.
- Variables sombra de los tres stocks para calcular los indicadores sin cruzar el diagrama.

**Bucles.** **R1 Reproducción**: Adultos → nacimientos → Menores → maduracion → Adultos (bucle positivo con un retraso material de primer orden de 15 años). Además, cada salida de primer orden forma un bucle B de vaciado.

**Ecuaciones.**

```vensim
Region: norte, sur
Menores[Region] = INTEG(nacimientos[Region]-maduracion[Region]-muertes de menores[Region], menores iniciales[Region])
                                                                ~ Person [0,?]
Adultos[Region] = INTEG(maduracion[Region]+migracion neta[Region]-envejecimiento[Region]-muertes de adultos[Region], adultos iniciales[Region])
                                                                ~ Person [0,?]
Mayores[Region] = INTEG(envejecimiento[Region]-muertes de mayores[Region], mayores iniciales[Region])
                                                                ~ Person [0,?]
nacimientos[Region] = Adultos[Region]*fecundidad[Region]        ~ Person/Year
maduracion[Region] = Menores[Region]/duracion de la infancia    ~ Person/Year
envejecimiento[Region] = Adultos[Region]/duracion de la adultez
                                                                ~ Person/Year
muertes de menores[Region] = Menores[Region]*mortalidad infantil[Region]
                                                                ~ Person/Year
muertes de adultos[Region] = Adultos[Region]*mortalidad adulta  ~ Person/Year
muertes de mayores[Region] = Mayores[Region]/esperanza de vida de los mayores[Region]
                                                                ~ Person/Year
migracion neta[norte] = -flujo migratorio
migracion neta[sur] = flujo migratorio                          ~ Person/Year
flujo migratorio = Adultos[norte]*fraccion de migracion         ~ Person/Year
fraccion de migracion = 0.004                                   ~ 1/Year [0,0.05,0.001]
fecundidad[Region] = 0.04, 0.025                                ~ 1/Year
mortalidad infantil[Region] = 0.004, 0.002                      ~ 1/Year
mortalidad adulta = 0.003                                       ~ 1/Year
esperanza de vida de los mayores[Region] = 12, 16               ~ Year
duracion de la infancia = 15                                    ~ Year
duracion de la adultez = 50                                     ~ Year
menores iniciales[Region] = 300000, 150000                      ~ Person
adultos iniciales[Region] = 600000, 500000                      ~ Person
mayores iniciales[Region] = 80000, 120000                       ~ Person
poblacion total[Region] = Menores[Region]+Adultos[Region]+Mayores[Region]
                                                                ~ Person
poblacion total global = SUM(poblacion total[Region!])          ~ Person
fraccion de mayores[Region] = ZIDZ(Mayores[Region], poblacion total[Region])
                                                                ~ Dmnl
razon de dependencia[Region] = ZIDZ(Menores[Region]+Mayores[Region], Adultos[Region])
                                                                ~ Dmnl
FINAL TIME = 100                                                ~ Year
INITIAL TIME = 0                                                ~ Year
SAVEPER = TIME STEP                                             ~ Year [0,?]
TIME STEP = 0.25                                                ~ Year [0,?]
```

**Resultados (PySD, TIME STEP 0.25).**

| Variable | t = 0 | t = 50 | t = 100 |
|----------|-------|--------|---------|
| Menores[norte] / [sur] | 300 000 / 150 000 | 438 594 / 210 205 | 629 501 / 273 137 |
| Adultos[norte] / [sur] | 600 000 / 500 000 | 854 228 / 620 062 | 1 225 939 / 809 639 |
| Mayores[norte] / [sur] | 80 000 / 120 000 | 187 919 / 182 956 | 270 719 / 238 353 |
| poblacion total global | 1 750 000 | 2 493 964 | 3 447 287 |
| fraccion de mayores[norte] / [sur] | 0.082 / 0.156 | 0.127 / 0.181 | 0.127 / 0.180 |
| razon de dependencia[norte] / [sur] | 0.633 / 0.540 | 0.733 / 0.634 | 0.734 / 0.632 |

Otros valores: en t = 0, `nacimientos[norte]` = 24 000, `maduracion[norte]` = 20 000, `muertes de mayores[norte]` = 6667 personas/año; `flujo migratorio` crece de 2400 a 4904 personas/año. Sin migración (`fraccion de migracion = 0`), en t = 100 el norte tendría 2 803 765 habitantes, el sur 881 169 y el total 3 684 934 (más que con migración, porque la migración traslada adultos a la región de menor fecundidad). La estructura etaria converge a una distribución estable (las fracciones de mayores casi no cambian entre t = 50 y t = 100), un resultado clásico de las cadenas de envejecimiento lineales.

**Experimentos sugeridos.**
1. Añadir un tercer elemento al rango (`Region: norte, sur, este`) y completar las listas de constantes: toda la estructura se replica sin redibujar.
2. Convertir las cohortes en un subíndice (`Cohorte: menores, adultos, mayores`) usando subrangos y mapeos (más compacto, menos legible).
3. Sustituir el primer orden por más etapas (p. ej. cohortes de 5 años) para obtener una distribución de edades más realista (retraso de mayor orden).
4. Agregar un coflujo (p. ej. "años de educación acumulados" por cohorte) para seguir un atributo medio.

---

## 10. Modelo 7 — `proyecto_retrabajo.mdl`: ciclo de retrabajo de un proyecto

**Propósito.** Reproducir el **síndrome del 90 %**: el progreso percibido llega al 90 % mucho antes de que el proyecto termine, porque parte del trabajo "hecho" contiene errores que sólo se descubren más tarde (ciclo de retrabajo de Cooper, Lyneis y Ford).

**Estructura.** Conservación estricta de tareas: `Trabajo por hacer + Trabajo correcto acumulado + Retrabajo no descubierto = alcance del proyecto` (verificado: 1000.000 al final).
- `tasa de trabajo = MIN(capacidad de trabajo, Trabajo por hacer / tiempo minimo por tarea)`: control de primer orden que impide que `Trabajo por hacer` sea negativo.
- La tasa se reparte en `trabajo correcto` (fracción `calidad`) y `trabajo defectuoso` (1 − calidad).
- `descubrimiento de retrabajo = Retrabajo no descubierto / tiempo para descubrir retrabajo` devuelve las tareas defectuosas a `Trabajo por hacer`.

**Bucles.**
- **B1 Agotamiento del trabajo** (−): cuando queda poco trabajo, el `MIN` limita la tasa.
- **R1 Ciclo de retrabajo**: Trabajo por hacer → tasa de trabajo → trabajo defectuoso → Retrabajo no descubierto → descubrimiento → Trabajo por hacer. Por polaridad de enlaces es positivo, pero su ganancia por "vuelta" es (1 − calidad) < 1, de modo que no produce crecimiento: prolonga el proyecto (serie geométrica de retrabajo).

**Ecuaciones.**

```vensim
Trabajo por hacer = INTEG(descubrimiento de retrabajo-trabajo correcto-trabajo defectuoso, alcance del proyecto)
                                                                ~ Task [0,?]
Trabajo correcto acumulado = INTEG(trabajo correcto, 0)         ~ Task [0,?]
Retrabajo no descubierto = INTEG(trabajo defectuoso-descubrimiento de retrabajo, 0)
                                                                ~ Task [0,?]
tasa de trabajo = MIN(capacidad de trabajo, Trabajo por hacer/tiempo minimo por tarea)
                                                                ~ Task/Week
capacidad de trabajo = personal*productividad                   ~ Task/Week
personal = 20                                                   ~ Person [1,40,1]
productividad = 1                                               ~ Task/(Person*Week) [0.2,3,0.1]
tiempo minimo por tarea = 1                                     ~ Week
trabajo correcto = tasa de trabajo*calidad                      ~ Task/Week
trabajo defectuoso = tasa de trabajo*(1-calidad)                ~ Task/Week
calidad = 0.7                                                   ~ Dmnl [0.3,1,0.05]
descubrimiento de retrabajo = Retrabajo no descubierto/tiempo para descubrir retrabajo
                                                                ~ Task/Week
tiempo para descubrir retrabajo = 20                            ~ Week [1,40,1]
alcance del proyecto = 1000                                     ~ Task
progreso percibido = (Trabajo correcto acumulado+Retrabajo no descubierto)/alcance del proyecto
                                                                ~ Dmnl
progreso real = Trabajo correcto acumulado/alcance del proyecto
                                                                ~ Dmnl
brecha de percepcion = progreso percibido-progreso real         ~ Dmnl
FINAL TIME = 200                                                ~ Week
INITIAL TIME = 0                                                ~ Week
SAVEPER = TIME STEP                                             ~ Week [0,?]
TIME STEP = 0.125                                               ~ Week [0,?]
```

**Resultados (PySD, TIME STEP 0.125; personal 20, calidad 0.7, descubrimiento 20 semanas).**

| Indicador | Valor |
|-----------|-------|
| Progreso percibido ≥ 90 % | semana **56.25** |
| Progreso real ≥ 90 % | semana 68.4 |
| Progreso real ≥ 99 % (fin práctico) | semana **135.0** → el último 10 % percibido consume 79 semanas, más que el 90 % inicial |
| Máxima brecha de percepción | 11.5 puntos porcentuales en la semana 62 |
| Progreso real en t = 100 / 200 | 0.967 / 0.9989 |
| `calidad = 1` | percibido 90 % en t = 45.0; real 99 % en t = 49.75 (sin retrabajo) |
| `calidad = 0.5` | percibido 90 % en t = 70.6; el 99 % real no se alcanza en 200 semanas |
| `tiempo para descubrir retrabajo = 5` | real 99 % en t = 78.75; brecha máxima 3.0 puntos |

**Experimentos sugeridos.**
1. Política de calidad: comparar invertir en calidad (0.7 → 0.85) con añadir personal (20 → 25).
2. Pruebas tempranas: reducir `tiempo para descubrir retrabajo` y observar la brecha de percepción.
3. Añadir presión de calendario: `calidad = calidad normal · efecto de la presión sobre la calidad(trabajo pendiente percibido / tiempo restante)` (lookup normalizado) para cerrar un bucle R de "apagar incendios".

---

## 11. Plantilla mínima para crear un modelo nuevo

Esqueleto que Vensim abre sin problemas (sin sketch: Vensim mostrará las variables al crear una vista o se pueden añadir con *Add Variable*; para obtener diagrama, copiar el patrón de la sección 3):

```vensim
{UTF-8}
Stock= INTEG (
	entrada-salida,
		stock inicial)
	~	Unit
	~	Descripción del stock.
	|

entrada=
	Stock*fraccion de entrada
	~	Unit/Year
	~		|

salida=
	Stock/tiempo de residencia
	~	Unit/Year
	~		|

fraccion de entrada=
	0.05
	~	1/Year [0,0.2,0.01]
	~		|

tiempo de residencia=
	10
	~	Year [1,50,1]
	~		|

stock inicial=
	100
	~	Unit
	~		|

********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|

FINAL TIME  = 100
	~	Year
	~	The final time for the simulation.
	|

INITIAL TIME  = 0
	~	Year
	~	The initial time for the simulation.
	|

SAVEPER  =
        TIME STEP
	~	Year [0,?]
	~	The frequency with which output is stored.
	|

TIME STEP  = 0.125
	~	Year [0,?]
	~	The time step for the simulation.
	|
```

Si un archivo no incluye sección de sketch, PySD lo simula igualmente; Vensim lo abre con una vista vacía **(verificar el comportamiento exacto en su versión)**.

---

## 12. Fuentes

- Modelos `.mdl` reales usados como referencia de formato: `src/test-models/samples/` (teacup, SIR, Workforce, Subscripted Population Model), `src/test-models/tests/` (lookups, delays, subscripted_flows, trend) y `src/SDEverywhere/examples/sir/model/sir.mdl` (marcadores de bucle y polaridades guardados por Vensim).
- Lector/escritor de sketch de simlin (`src/simlin/src/simlin-engine/src/mdl/writer.rs`, `view/types.rs`): significado de los campos de los objetos 10/11/12/1 y de las formas 4/100 de las tuberías.
- PySD 3.14.3 (`pysd.read_vensim`, `Model.run`) — validación de los siete modelos; simlin CLI (`simlin simulate`, `simlin render`) — validación cruzada.
- Sterman, J. D. (2000). *Business Dynamics: Systems Thinking and Modeling for a Complex World*. Irwin/McGraw-Hill (caps. 8–9: crecimiento en S, SIR y Bass; caps. 11–12: retrasos y cadenas de envejecimiento; caps. 17–19: gestión de stocks, inventario y fuerza laboral).
- Bass, F. M. (1969). A new product growth model for consumer durables. *Management Science* 15(5).
- Kermack, W. O. & McKendrick, A. G. (1927). A contribution to the mathematical theory of epidemics. *Proc. R. Soc. A* 115.
- Cooper, K. G. (1980). Naval ship production: a claim settled and a framework built. *Interfaces* 10(6); Lyneis, J. M. & Ford, D. N. (2007). System dynamics applied to project management: a survey, assessment, and directions for future research. *System Dynamics Review* 23(2–3).
- Documentación de Vensim (consultada vía extractos de búsqueda; vensim.com no era accesible directamente): TIME STEP (`ref_time_step.html`), Euler y Runge-Kutta (`euler.html`, `rungekutta.html`), DELAY FIXED (`fn_delay_fixed.html`), XIDZ/ZIDZ (`fn_xidz.html`, `fn_zidz.html`).
