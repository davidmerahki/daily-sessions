# 02 — Fundamentos de dinámica de sistemas (y cómo se implementan en Vensim)

> Conceptos que un modelador experto en Vensim domina, cada uno mapeado a su implementación concreta en Vensim (iconos del sketch, tipos de variable, funciones y herramientas). Los fragmentos marcados "validado" se ejecutaron con PySD 3.14.3; los números citados provienen de esas simulaciones. Lo no confirmado se marca **(verificar)**.

## Tabla de contenidos

1. [La perspectiva de la dinámica de sistemas](#1-la-perspectiva-de-la-dinámica-de-sistemas)
2. [Stocks (niveles) y flujos](#2-stocks-niveles-y-flujos)
3. [Realimentación: polaridad de enlaces y bucles R/B](#3-realimentación-polaridad-de-enlaces-y-bucles-rb)
4. [Retrasos](#4-retrasos)
5. [No linealidades y funciones de tabla (lookups)](#5-no-linealidades-y-funciones-de-tabla-lookups)
6. [Modos de comportamiento de referencia y la estructura que los genera](#6-modos-de-comportamiento-de-referencia-y-la-estructura-que-los-genera)
7. [Arquetipos sistémicos](#7-arquetipos-sistémicos)
8. [El proceso de modelado](#8-el-proceso-de-modelado)
9. [Modos de referencia](#9-modos-de-referencia)
10. [Límites del modelo: endógeno, exógeno, excluido](#10-límites-del-modelo-endógeno-exógeno-excluido)
11. [Pruebas de confianza del modelo](#11-pruebas-de-confianza-del-modelo)
12. [Formulaciones canónicas](#12-formulaciones-canónicas)
13. [Tabla resumen concepto → Vensim](#13-tabla-resumen-concepto--vensim)
14. [Fuentes](#14-fuentes)

---

## 1. La perspectiva de la dinámica de sistemas

La dinámica de sistemas (DS), creada por Jay W. Forrester en el MIT a fines de los años 50, explica el comportamiento de sistemas complejos a partir de su **estructura**: stocks, flujos, realimentación, retrasos y no linealidades. Principios que guían el trabajo de un experto:

| Principio | Significado práctico |
|-----------|----------------------|
| **La estructura genera el comportamiento** | Para cambiar un patrón persistente hay que cambiar la estructura (reglas de decisión, información disponible, retrasos), no sólo los parámetros. |
| **Punto de vista endógeno** | Se busca explicar la dinámica desde dentro de la frontera del modelo; las variables exógenas son la excepción justificada. |
| **Realimentación** | Las decisiones alteran el estado del sistema, que a su vez condiciona decisiones futuras. Todo comportamiento dinámico interesante proviene de la interacción de bucles. |
| **Acumulación** | Los stocks dan inercia y memoria; desacoplan entradas y salidas y son la fuente del desequilibrio y de los retrasos. |
| **Racionalidad limitada** | Las reglas de decisión del modelo deben reflejar la información realmente disponible para los actores (percepciones retrasadas, heurísticas), no la decisión óptima. |
| **Resistencia a las políticas** | Las intervenciones bien intencionadas suelen ser compensadas por bucles B que el decisor no ve (ver arquetipos, sección 7). |
| **Propósito** | Un modelo se construye para un problema concreto; su validez se juzga respecto de ese propósito, no en abstracto. |

**En Vensim** se trabaja en dos representaciones que pueden convivir en el mismo sketch:
- **Diagrama causal** (*causal loop diagram*, CLD): variables unidas por flechas con polaridad; se dibuja con la herramienta *Variable* y *Arrow*. Sirve para la hipótesis dinámica; no simula si las variables no tienen ecuaciones.
- **Diagrama de stocks y flujos**: herramientas *Box Variable* (Level/stock), *Rate* (flujo con válvula y nubes), *Variable* (auxiliares y constantes), *Arrow* (enlace de información) y *Shadow Variable* (variable sombra, que reutiliza una variable definida en otra parte del diagrama).

---

## 2. Stocks (niveles) y flujos

### 2.1 Definiciones

- **Stock (nivel, Level)**: acumulación; describe el estado del sistema. Es lo que "quedaría" si se congelara el tiempo (prueba de la instantánea). Unidades: *cosa* (Person, Widget, $).
- **Flujo (rate)**: tasa de cambio de un stock. Unidades: *cosa/tiempo* (Person/Year).
- **Auxiliar**: cálculo intermedio instantáneo (no acumula).
- **Constante**: parámetro que no cambia durante la simulación.

Matemáticamente un stock es la integral de su flujo neto:

  Stock(t) = Stock(t₀) + ∫ₜ₀ᵗ [entradas(s) − salidas(s)] ds,  equivalente a  d(Stock)/dt = entradas − salidas.

Consecuencias que el experto aplica siempre:
1. **Sólo los flujos cambian un stock.** Un stock nunca depende directamente de otro stock sin un flujo intermedio.
2. **Las unidades del flujo neto deben ser las del stock por unidad de tiempo** (Vensim lo comprueba con *Units Check*).
3. **Los stocks desacoplan** entradas y salidas: pueden diferir durante un tiempo, generando inventarios, colas o retrasos.
4. **Conservación**: en una cadena de stocks (material), lo que sale de uno entra en el siguiente; las **nubes** (fuentes/sumideros) marcan la frontera del modelo.
5. **El valor inicial es parte de la estructura**: un stock sin valor inicial no simula.

### 2.2 Implementación en Vensim

```vensim
Poblacion = INTEG(nacimientos - muertes, poblacion inicial)    ~ Person
nacimientos = Poblacion * tasa de natalidad                     ~ Person/Year
muertes = Poblacion / esperanza de vida                         ~ Person/Year
```

- `INTEG(flujo neto, valor inicial)` debe ir **inmediatamente después del signo igual** y no puede formar parte de una expresión mayor (documentación de INTEG). En el *Equation Editor* el tipo es *Level* y hay una casilla separada para el valor inicial (*Initial Value*).
- El valor inicial puede ser una constante, una expresión o una variable; se evalúa una única vez al inicio. Si para calcularlo hace falta otro stock que a su vez depende del primero, aparece el error *Simultaneous initial value equations* (ver `13-buenas-practicas-errores-y-depuracion.md`).
- Integración: Vensim calcula en cada `TIME STEP` primero auxiliares y flujos con los stocks actuales y luego actualiza los stocks. Por defecto usa **Euler**: `Stock(t+dt) = Stock(t) + dt·flujo neto(t)`. También ofrece Runge-Kutta (RK4 y RK2, de paso fijo o automático) y *Difference* en *Model > Settings* (nombres exactos de las opciones: verificar en su versión; detalle en `08-simulacion-e-integracion.md` §3). El error de Euler por paso es proporcional a dt² y sobre toda la simulación a dt; el de RK4 a dt⁴ sobre la simulación (documentación de Vensim, "Euler Integration" y "Runge-Kutta Integration").
- Tipos de variable del *Equation Editor*: Auxiliary, Constant, Level, Data, Initial, Lookup, Subscript range, Reality Check (Constraint / Test Input), entre otros **(verificar la lista exacta según versión)**.
- Funciones de prueba exógenas típicas: `STEP(altura, tiempo)`, `RAMP(pendiente, inicio, fin)`, `PULSE(inicio, duración)`, `PULSE TRAIN(inicio, duración, intervalo, fin)`.

### 2.3 Dinámica de la bañera (intuición gráfica)

| Si … | entonces el stock … |
|------|---------------------|
| entradas > salidas | crece (pendiente = flujo neto) |
| entradas = salidas | está en equilibrio (puede estar en equilibrio con flujos grandes) |
| flujo neto máximo | tiene su punto de inflexión (máxima pendiente) |
| flujo neto cambia de signo | alcanza un máximo o mínimo |

---

## 3. Realimentación: polaridad de enlaces y bucles R/B

### 3.1 Polaridad de enlaces

Para un enlace causal X → Y (Sterman 2000):
- **Positivo (+)**: si X aumenta (todo lo demás igual), Y queda por encima de lo que habría estado: ∂Y/∂X > 0. Para un flujo de **entrada** a un stock: el enlace flujo → stock es +.
- **Negativo (−)**: si X aumenta, Y queda por debajo de lo que habría estado: ∂Y/∂X < 0. El enlace **salida** → stock es −.

"Habría estado" importa: un flujo de entrada positivo pero decreciente sigue haciendo crecer el stock; la polaridad describe el efecto marginal, no la dirección del cambio en el tiempo.

### 3.2 Polaridad de bucles

- **Bucle de refuerzo (R, positivo)**: número par de enlaces negativos. Amplifica desviaciones: crecimiento o colapso exponencial, círculos virtuosos/viciosos.
- **Bucle de balance (B, negativo)**: número impar de enlaces negativos. Contrarresta desviaciones: busca un objetivo (explícito o implícito).
- La **dominancia** de bucles puede cambiar con el tiempo (por no linealidades): la curva en S es el paso de dominancia R → B.
- Un bucle con ganancia positiva pero menor que 1 por "vuelta" (p. ej. el ciclo de retrabajo) no genera crecimiento, sino amplificación finita (ver `14-ejemplos-de-modelos.md`, modelo 7).

### 3.3 En Vensim

- **Polaridad de flechas**: en las propiedades de la flecha (clic derecho) se elige el signo (`+`, `−`) o la notación con letras `S`/`O`. En el `.mdl` se guarda como código ASCII en el registro de la flecha: 43 = `+`, 45 = `-` (83 = `S`, 79 = `O`).
- **Identificadores de bucle**: comentarios con forma de flecha circular (sentido horario/antihorario) con texto `R`, `B`, `R1`, `B2`… (herramienta *Comment*, eligiendo como forma el icono de bucle; rótulos exactos del diálogo: verificar). En el `.mdl` son registros `12` con forma 4 o 5 seguidos de una línea con el texto (`R`, `B`…).
- **Herramientas de análisis**: *Loops* (lista todos los bucles que pasan por la variable seleccionada y su longitud), *Causes Tree* y *Uses Tree* (árboles de causas y usos), *Causes Strip* (gráficos de la variable y sus causas directas, ideal para seguir la causalidad en el tiempo), *Document*.
- Vensim no calcula automáticamente la polaridad de los bucles a partir de las ecuaciones en el diagrama: los signos que se dibujan son documentación y deben verificarse (con *Causes Strip* o pruebas parciales) **(verificar si su versión ofrece análisis automático de dominancia de bucles)**. Fuera de Vensim existen implementaciones de *Loops That Matter* (p. ej. `simlin simulate --ltm`).

---

## 4. Retrasos

Un retraso es un proceso cuya salida va rezagada respecto de su entrada. Todo retraso contiene al menos un stock.

### 4.1 Material vs. de información

| Tipo | Qué retrasa | Conserva | Vensim |
|------|-------------|----------|--------|
| **Material** | Un flujo físico (pedidos en tránsito, personas en formación, productos en fabricación) | Sí: lo que entra acaba saliendo; el contenido en tránsito es un stock real | `DELAY1`, `DELAY1I`, `DELAY3`, `DELAY3I`, `DELAY N`, `DELAY FIXED`, `DELAYP` (además entrega el contenido de la tubería), `DELAY MATERIAL` (firma: verificar) |
| **De información** | Una percepción o expectativa (demanda percibida, calidad percibida) | No: se ajusta gradualmente una creencia | `SMOOTH`, `SMOOTHI`, `SMOOTH3`, `SMOOTH3I`, `SMOOTH N`, `DELAY INFORMATION` (verificar firma), `TREND`, `FORECAST` |

Con tiempo de retraso constante, `DELAY1` y `SMOOTH` producen la misma salida (comprobado: idénticos en la tabla 4.3); difieren cuando el tiempo de retraso varía: el retraso material conserva lo que está en tránsito, el de información no.

### 4.2 Estructura interna (equivalencias exactas)

```vensim
{ DELAY1(entrada, D) equivale a: }
En transito = INTEG(entrada - salida, entrada * D)      ~ Unit
salida = En transito / D                                ~ Unit/Year

{ DELAY3(entrada, D): cascada de 3 stocks, cada uno con D/3 }
{ SMOOTH(entrada, D) equivale a: }
Percepcion = INTEG((entrada - Percepcion) / D, entrada) ~ Unit/Year
```

`DELAY3`/`SMOOTH3` encadenan tres etapas de primer orden con tiempo D/3; `DELAY N`/`SMOOTH N` generalizan a orden n. Las variantes `...I` permiten fijar el valor inicial de la salida; las demás inicializan la salida igual a la entrada inicial (equilibrio). Los comentarios entre llaves `{ }` son comentarios en línea de Vensim.

### 4.3 Respuesta a un escalón según el orden (validado)

Escalón de 0 a 100 en t = 1, D = 10, dt = 0.0625 (simulado con PySD):

| t | `DELAY1` = `SMOOTH` | `DELAY3` = `SMOOTH3` | `DELAY N` orden 6 | `DELAY FIXED` |
|---|---------------------|----------------------|-------------------|---------------|
| 6 (D/2 tras el escalón) | 39.4 | 19.0 | 8.0 | 0 |
| 11 (= D tras el escalón) | 63.3 (teórico 63.2) | 57.9 (teórico 57.7) | 55.7 (teórico 55.4) | 100 |
| 21 (2D) | 86.6 | 94.0 | 98.1 | 100 |
| 31 (3D) | 95.1 | 99.4 | 99.97 | 100 |

Lecturas clave:
- Primer orden: respuesta inmediata y exponencial (63 % tras una constante de tiempo, 95 % tras 3, 98 % tras 4).
- Mayor orden: respuesta en S, con un periodo inicial casi sin respuesta; en el límite (orden infinito) se convierte en el retraso de tubería (*pipeline*) `DELAY FIXED`.
- Ante un pulso, la salida de primer orden tiene su máximo inmediatamente; la de tercer orden, cerca de (n−1)/n·D después (simulado: pico a t = 8.2 para un pulso de 1 año que empieza en t = 1).
- **Elección del orden**: primer orden si la salida empieza a responder enseguida (desgaste, vaciado); tercer orden si hay un tiempo mínimo antes de que algo salga (fabricación, formación); `DELAY FIXED` sólo para procesos con duración realmente fija (maduración de un producto financiero, tiempo de tránsito programado). La varianza de la distribución de salida es D²/n.
- `DELAY FIXED(entrada, D, valor inicial)`: usa únicamente el **valor inicial** de D, el retraso mínimo es TIME STEP, actúa en intervalos de TIME STEP y debe ir directamente tras el signo igual (documentación de Vensim). Es discreta: con RK4 puede comportarse peor que las exponenciales.

### 4.4 Retrasos y oscilación

Un bucle B con retrasos suficientes **sobrecorrige**: el decisor sigue actuando sobre una brecha que ya fue corregida pero cuyo efecto aún no se ve. Es la causa estructural de la oscilación en cadenas de suministro (ver modelo 4 de `14-ejemplos-de-modelos.md`: sobrepaso del 20 % en la fuerza laboral; con más retraso, inestabilidad).

---

## 5. No linealidades y funciones de tabla (lookups)

### 5.1 Por qué importan

Las no linealidades hacen que la dominancia de bucles cambie con el estado del sistema (saturaciones, umbrales, rendimientos decrecientes). En DS se modelan sobre todo con **funciones de tabla** (lookups) y con `MIN`/`MAX`.

### 5.2 Sintaxis en Vensim

```vensim
{ Lookup independiente: [(xmin,ymin)-(xmax,ymax)] y luego los puntos }
efecto de la densidad sobre la natalidad(
	[(0,0)-(2,2)],(0,2),(0.25,1.9),(0.5,1.7),(0.75,1.4),(1,1),(1.25,0.6),(1.5,0.35),(1.75,0.2),(2,0.1))
	~	Dmnl
	~	|

{ Uso: el nombre del lookup aplicado a una entrada }
nacimientos = Poblacion*fraccion normal de natalidad*efecto de la densidad sobre la natalidad(densidad percibida)

{ Lookup incrustado }
efecto = WITH LOOKUP(entrada normalizada, ([(0,0)-(2,2)],(0,0),(1,1),(2,1.5)))
```

- El corchete `[(xmin,ymin)-(xmax,ymax)]` sólo define los ejes del editor gráfico; la interpolación entre puntos es lineal.
- **Fuera de rango**: Vensim mantiene el primer/último valor (extrapolación plana) y emite una advertencia; `LOOKUP EXTRAPOLATE(tabla, x)` extrapola linealmente con los dos últimos puntos y suprime la advertencia (documentación de Vensim). También existen `LOOKUP FORWARD`, `LOOKUP BACKWARD` y `GET XLS LOOKUPS`/`GET DIRECT LOOKUPS` para leer tablas de hojas de cálculo.
- Edición: en el *Equation Editor*, tipo *Lookup*, botón *As Graph* para dibujar/editar los puntos **(verificar el rótulo exacto del botón)**.
- Las unidades de la entrada de un lookup deberían ser adimensionales (Vensim advierte si se usa una variable con dimensiones como entrada de un lookup, documentación "Units and Lookup Functions").

### 5.3 Formulación normalizada "efecto de X sobre Y"

La forma canónica (Sterman 2000, cap. 14):

  Y = Y normal × efecto₁(X₁ / X₁ normal) × efecto₂(X₂ / X₂ normal) × …

con cada lookup **normalizado**: entrada adimensional (X / X normal) y **f(1) = 1**, de modo que en condiciones normales el efecto es neutro y `Y normal` conserva su significado. Guía de diseño de un lookup:

1. Normalizar entrada y salida (pasar por (1,1)).
2. Identificar puntos de referencia y valores extremos razonables (¿qué ocurre si X = 0? ¿si X → ∞?).
3. Decidir la forma plausible (monótona, saturante, en S) y la pendiente en el punto normal.
4. Evitar quiebres bruscos; pendientes suaves cerca de los extremos.
5. Cubrir con el eje X todo el rango que la simulación pueda visitar (o usar `LOOKUP EXTRAPOLATE` conscientemente).
6. Hacer análisis de sensibilidad sobre la forma.

Implementación completa y validada: modelo 5 de `14-ejemplos-de-modelos.md` (efectos de densidad que pasan por (1,1)).

---

## 6. Modos de comportamiento de referencia y la estructura que los genera

| Modo | Estructura mínima | Formulación Vensim mínima | Ejemplo validado (doc 14) |
|------|-------------------|---------------------------|---------------------------|
| **Crecimiento exponencial** | Bucle R dominante | `S = INTEG(S*g, S0)` | Modelo 1: 1000 → 2716.6 en 100 años con g = 0.01 |
| **Búsqueda de objetivo** | Bucle B de primer orden | `S = INTEG((objetivo - S)/tiempo de ajuste, S0)` | Ajuste de inventario del modelo 4 |
| **Oscilación** | Bucle B con retrasos (≥ 2 stocks en el bucle) | Ajuste de stock + `SMOOTH`/`DELAY3` | Modelo 4: Fuerza laboral 100 → 144.5 → 113.3 → 120 |
| **Crecimiento en S** | R + B con no linealidad, sin retrasos importantes en B | Efecto de densidad con lookup | Modelo 5 (S hacia 10 000); modelo 3 (Bass) |
| **S con sobrepaso (y oscilación)** | Como S pero con retraso en el bucle B | `SMOOTH3` sobre la densidad percibida | Modelo 5 con retraso de 10 años: máximo 12 729 |
| **Sobrepaso y colapso** | R + B donde el límite es un recurso erosionable (stock que se consume) | Capacidad como stock con regeneración y consumo | Tragedia de los comunes (sección 7.4): recurso 1000 → 55.7 |
| **Decaimiento exponencial** | Bucle B de vaciado | `S = INTEG(-S/tau, S0)` | Modelo 1 con tasa de natalidad 0.01 |
| **Equilibrio** | Bucles en balance | Inicializar en equilibrio | Modelo 4 antes de t = 10 |

Magnitudes de referencia para leer gráficos:
- Tiempo de duplicación ≈ 70 / (crecimiento en %/periodo) (exacto: ln 2 / g).
- Primer orden: 63 % del ajuste tras una constante de tiempo, 86 % tras 2, 95 % tras 3.
- Bass/logístico: máxima tasa de adopción con ≈ 50 % del mercado (Bass: 0.5 − p/2q).

---

## 7. Arquetipos sistémicos

Estructuras genéricas recurrentes (Senge 1990; Kim 1992). Para cada una: estructura de bucles, comportamiento característico, punto de apalancamiento y esqueleto Vensim. Los esqueletos de 7.2–7.6 se **validaron con PySD** como modelos independientes (TIME STEP 0.0625 o 0.125); para copiarlos a un `.mdl` añadir `~ unidades ~ comentario |` a cada ecuación, como en `14-ejemplos-de-modelos.md`.

### 7.1 Límites al crecimiento (*Limits to Growth*)
- **Estructura**: un R de crecimiento acoplado a un B que se intensifica al acercarse a un límite.
- **Comportamiento**: crecimiento en S, estancamiento o sobrepaso.
- **Apalancamiento**: actuar sobre la restricción (el B), no empujar más el R.
- **Vensim**: modelo 5 (`limites_crecimiento.mdl`) y modelo 3 (Bass) en `14-ejemplos-de-modelos.md`.

### 7.2 Soluciones que fallan (*Fixes that Fail*)
- **Estructura**: un B rápido (la solución alivia el síntoma) y un R lento por un efecto secundario retrasado.
- **Comportamiento**: "mejor antes de peor".
- **Apalancamiento**: anticipar el efecto secundario; atacar la causa raíz.

```vensim
Problema = INTEG(generacion del problema + efecto secundario - resolucion natural - alivio, 100)
generacion del problema = 10                                   { Unit/Year }
resolucion natural = Problema/tiempo de resolucion             { tiempo de resolucion = 10 Year }
alivio = Problema*intensidad de la solucion*STEP(1, 5)         { intensidad = 0.2 1/Year; la solucion empieza en t=5 }
efecto secundario = DELAY3(alivio*fraccion de efecto secundario, retraso del efecto secundario)
fraccion de efecto secundario = 1.3                            { Dmnl }
retraso del efecto secundario = 5                              { Year }
```
Resultado: el Problema baja de 100 a 63.2 (t = 9) y luego sube a 93.8 (t = 20) y 170.3 (t = 60). Con `fraccion de efecto secundario = 0.5` la solución sí funciona: 50.0 en t = 60.

### 7.3 Desplazamiento de la carga (*Shifting the Burden*)
- **Estructura**: dos B que compiten por resolver el mismo problema: uno sintomático (rápido) y otro fundamental (lento); un efecto secundario del sintomático erosiona la capacidad fundamental (R de dependencia). Variante: *adicción*.
- **Comportamiento**: el síntoma se controla, pero el sistema se vuelve dependiente del parche.

```vensim
Problema = INTEG(presion externa - solucion sintomatica - solucion fundamental, 50)
presion externa = 10                                                     { Unit/Year }
solucion sintomatica = Problema*intensidad del parche*STEP(1, 5)         { intensidad 0.3 1/Year }
solucion fundamental = Problema*Capacidad fundamental*efectividad fundamental   { 0.4 1/Year }
Capacidad fundamental = INTEG(construccion de capacidad - erosion de capacidad, 0.5)   { Dmnl }
construccion de capacidad = (1 - Capacidad fundamental)*Problema/problema de referencia/tiempo de construccion
problema de referencia = 50                                              { Unit }
tiempo de construccion = 10                                              { Year }
erosion de capacidad = Capacidad fundamental*solucion sintomatica*sensibilidad a la dependencia
sensibilidad a la dependencia = 0.02                                     { 1/Unit }
```
Resultado en t = 60: con parche, Problema 25.0 pero Capacidad fundamental 0.25 (el parche resuelve 7.5 de 10 unidades/año); sin parche (`intensidad del parche = 0`), Problema 25.4 y Capacidad 0.99. El síntoma es casi igual; la diferencia es la dependencia.

### 7.4 Tragedia de los comunes (*Tragedy of the Commons*)
- **Estructura**: varios R de expansión individual (cada actor reinvierte sus ganancias) que comparten un recurso común; el B de agotamiento es colectivo y retrasado.
- **Comportamiento**: sobreexplotación, sobrepaso y colapso (o equilibrio pobre).
- **Apalancamiento**: gobernanza del recurso común (cuotas, derechos), información sobre el estado del recurso.

```vensim
Recurso = INTEG(regeneracion - captura A - captura B, capacidad del recurso)       { Fish }
regeneracion = tasa de regeneracion*Recurso*(1 - Recurso/capacidad del recurso)    { r = 0.5 1/Year; capacidad 1000 }
captura A = Flota A*captura por barco                                              { idem B }
captura por barco = captura maxima por barco*Recurso/capacidad del recurso         { max 10 Fish/(Boat*Year) }
Flota A = INTEG(inversion A - desguace A, 2)                                       { idem B }
inversion A = Flota A*fraccion de reinversion*MAX(0, captura por barco/captura rentable - 1)
fraccion de reinversion = 0.5                                                      { 1/Year }
captura rentable = 3                                                               { Fish/(Boat*Year) }
desguace A = Flota A/vida de los barcos                                            { 20 Year }
```
Resultado: cada flota crece de 2 a 39.1 barcos (t = 4.5); la captura total llega a 352 peces/año (t = 3.25), muy por encima del máximo sostenible (r·K/4 = 125); el recurso cae de 1000 a 55.7 (t = 14.7) y se recupera sólo hasta ≈ 333 (t = 80), por debajo del nivel de máximo rendimiento (500).

### 7.5 Escalada (*Escalation*)
- **Estructura**: dos B locales (cada actor busca superar al otro) que juntos forman un R global.
- **Comportamiento**: crecimiento exponencial de ambos (carrera armamentista, guerra de precios a la baja).
- **Apalancamiento**: acuerdos que rompan la referencia al otro; reducir el "factor de seguridad".

```vensim
Armamento A = INTEG((objetivo de A - Armamento A)/tiempo de ajuste, 100)
Armamento B = INTEG((objetivo de B - Armamento B)/tiempo de ajuste, 100)
objetivo de A = factor de seguridad*Armamento B
objetivo de B = factor de seguridad*Armamento A
factor de seguridad = 1.2                                      { Dmnl }
tiempo de ajuste = 2                                           { Year }
```
Resultado: 100 → 164.6 (t = 5) → 271.0 (t = 10) → 734.3 (t = 20): crecimiento a tasa (1.2 − 1)/2 = 0.1/año. Con factor 0.8 ambos decaen (36.7 en t = 10).

### 7.6 Éxito para el exitoso (*Success to the Successful*)
- **Estructura**: dos R acoplados por una asignación de recursos que favorece al que más éxito tiene.
- **Comportamiento**: una ventaja inicial pequeña se convierte en dominio total (*lock-in*).
- **Apalancamiento**: criterios de asignación que no dependan del éxito pasado; metas de diversificación.

```vensim
Exito A = INTEG(asignacion a A - Exito A/tiempo de obsolescencia, 55)
Exito B = INTEG(asignacion a B - Exito B/tiempo de obsolescencia, 45)
fraccion para A = Exito A^sesgo/(Exito A^sesgo + Exito B^sesgo)
asignacion a A = recursos totales*fraccion para A
asignacion a B = recursos totales*(1 - fraccion para A)
recursos totales = 10                                          { Unit/Year }
tiempo de obsolescencia = 10                                   { Year }
sesgo = 2                                                      { 1 = reparto proporcional neutro }
```
Resultado: fracción para A 0.60 → 0.74 (t = 10) → 0.91 (t = 20) → 1.00 (t = 40); Exito B cae de 45 a 0.6 en t = 60. Con `sesgo = 1` el reparto queda congelado en 55/45.

### 7.7 Otros arquetipos (descripción)
- **Erosión de metas** (*Drifting/Eroding Goals*): la meta se ajusta hacia el desempeño real (`meta = SMOOTH(desempeno, tiempo de ajuste de la meta)`) y la brecha se cierra bajando la meta.
- **Crecimiento y subinversión**: el límite es una capacidad que se podría ampliar, pero la inversión se decide según un estándar que se erosiona; combina límites al crecimiento y erosión de metas.
- **Adversarios accidentales**: dos socios con R de cooperación cuyas soluciones locales (B) perjudican al otro.
- **Atractivo** (*attractiveness principle*): varios límites al crecimiento simultáneos; hay que elegir cuál aliviar.

---

## 8. El proceso de modelado

Sterman (2000, cap. 3) describe un proceso **iterativo** de cinco etapas; cada etapa puede obligar a revisar las anteriores.

| Etapa | Preguntas / productos | Herramientas en Vensim |
|-------|-----------------------|------------------------|
| **1. Articulación del problema** (selección de la frontera) | ¿Cuál es el problema y por qué es un problema? Variables clave, horizonte temporal (suficiente para ver causas y efectos retrasados), modos de referencia (pasado y futuros temidos/deseados). | Gráficos de datos (*Data* + datasets `.vdf`), comentarios en el sketch, vistas de texto. |
| **2. Hipótesis dinámica** | Explicación endógena del comportamiento problemático en términos de estructura: diagrama de frontera del modelo (endógeno/exógeno/excluido), diagrama de subsistemas, diagramas causales, mapas de stocks y flujos. | Sketch: CLD con polaridades e identificadores de bucle; *Loops*, *Causes Tree*. |
| **3. Formulación** | Ecuaciones, reglas de decisión, parámetros, relaciones de comportamiento, condiciones iniciales; prueba de consistencia con el propósito y la frontera. | *Equation Editor*, unidades en cada variable, lookups, *Check Model*, *Units Check*. |
| **4. Pruebas** | Reproducción del comportamiento de referencia, robustez en condiciones extremas, sensibilidad, otras pruebas (sección 11). | *SyntheSim*, *Reality Check*, *Sensitivity* (Monte Carlo), calibración (*Optimize*; Professional/DSS según `01-productos-licencias-versiones.md`), *Runs Compare*. |
| **5. Diseño y evaluación de políticas** | Especificación de escenarios, diseño de políticas (nuevas reglas de decisión, estructura e información, no sólo parámetros), análisis "qué pasa si", sensibilidad de las políticas, interacciones entre políticas. | Archivos de cambios (`.cin`), múltiples runs, *Sensitivity*, *Optimize* con payoff de política. |

Principios de práctica: modelar un **problema**, no un sistema; involucrar a los usuarios del modelo desde el principio; empezar simple e ir añadiendo estructura; documentar supuestos; versionar el modelo.

---

## 9. Modos de referencia

Un **modo de referencia** es un gráfico (con o sin datos) del comportamiento de las variables clave en el tiempo: el patrón histórico y los futuros posibles. Sirve para:
- Fijar el horizonte temporal (debe abarcar las causas pasadas del problema y los efectos retrasados de las políticas).
- Expresar la hipótesis dinámica: "¿qué estructura generaría este patrón?" (sección 6).
- Evaluar el modelo: el criterio es reproducir el **patrón** (modo, periodo, fase, amplitud relativa), no necesariamente cada punto.

En Vensim: importar los datos como variables *Data* (o con `GET XLS DATA`/`GET DIRECT DATA`) en un dataset y graficarlos junto a la variable simulada (las variables de datos se comparan con la simulación en *Graph*/*Runs Compare*; la calibración usa un payoff que compara ambas series) **(verificar el flujo exacto de importación según edición)**.

---

## 10. Límites del modelo: endógeno, exógeno, excluido

El **diagrama de frontera del modelo** (*model boundary chart*) lista:
- **Endógenas**: variables calculadas por la estructura de realimentación del modelo.
- **Exógenas**: variables que afectan al modelo pero no son afectadas por él (escenarios, datos, funciones de prueba).
- **Excluidas**: conceptos deliberadamente fuera del modelo, con su justificación.

Señales de alerta: demasiadas variables exógenas (el modelo "explica" el problema con supuestos externos), o una variable exógena clave que en la realidad responde al sistema (bucle omitido).

En Vensim:
- Las **constantes**, **datos** y funciones de tiempo (`STEP`, `RAMP`, series temporales) son las entradas exógenas; las **nubes** de los flujos marcan la frontera física.
- *Causes Tree* de una variable endógena termina siempre en constantes/datos/stocks; *Loops* confirma que una variable pertenece a algún bucle (si no, es puramente exógena o "de salida").
- *Check Model* informa variables no usadas y no definidas, útil para detectar fronteras mal cerradas.

---

## 11. Pruebas de confianza del modelo

Ningún modelo es "verdadero"; se construye confianza mediante pruebas múltiples (Forrester & Senge 1980; Barlas 1996; Sterman 2000, cap. 21):

| Prueba | Pregunta | Cómo hacerla en Vensim |
|--------|----------|------------------------|
| **Adecuación de la frontera** | ¿Están endógenos los conceptos importantes para el propósito? ¿Cambia el comportamiento/las políticas si se relaja un supuesto de frontera? | Diagrama de frontera; añadir estructura y comparar runs. |
| **Evaluación de la estructura** | ¿Es consistente con el conocimiento del sistema? ¿Respeta leyes de conservación? ¿Las reglas de decisión usan sólo información disponible? | *Causes Tree*, revisión de ecuaciones con expertos, verificación de conservación (sumas de stocks). |
| **Consistencia dimensional** | ¿Son coherentes las unidades sin parámetros "de ajuste" sin significado? | *Units Check* (mensaje "Units are A.O.K." si todo es coherente). |
| **Evaluación de parámetros** | ¿Tienen los parámetros significado real y valores plausibles? | Comentarios y rangos en el *Equation Editor*; calibración. |
| **Condiciones extremas** | ¿Se comporta razonablemente con entradas extremas (0, ∞, shocks)? ¿Stocks negativos imposibles? | *SyntheSim* (mover deslizadores a los extremos); *Reality Check* con `:THE CONDITION:` / `:IMPLIES:` (ver doc 09 §11 y doc 13 §3.11). |
| **Error de integración** | ¿Cambian los resultados al reducir TIME STEP o cambiar el método? | Reducir TIME STEP a la mitad y comparar (doc 14: Bass con dt 0.25 desplaza el pico medio año). |
| **Reproducción del comportamiento** | ¿Reproduce los modos de referencia (cualitativa y cuantitativamente)? | *Graph* con datos; estadísticas de ajuste; calibración con *Optimize*. |
| **Anomalías de comportamiento** | ¿Aparecen comportamientos anómalos al eliminar un supuesto? | Desactivar bucles (fijar un efecto en 1) y comparar runs. |
| **Familia** | ¿Reproduce el comportamiento de otros casos de la misma clase con otros parámetros? | Archivos de cambios (`.cin`) por caso. |
| **Comportamiento sorpresa** | ¿Aparece algo inesperado que luego se confirma en la realidad? | Análisis de runs; *Causes Strip*. |
| **Sensibilidad** | ¿Cambian las conclusiones (numéricas, de modo de comportamiento o de política) ante la incertidumbre de los parámetros? | *Sensitivity* (Monte Carlo) con distribuciones (`RANDOM UNIFORM` etc. en el control de sensibilidad); disponible en ediciones PLE Plus/Pro/DSS **(verificar)**. |
| **Mejora del sistema** | ¿Ayudó el proceso de modelado a mejorar el sistema real? | — |

---

## 12. Formulaciones canónicas

Estructuras de uso diario. Todas están en uso dentro de los modelos validados de `14-ejemplos-de-modelos.md`.

### 12.1 Ajuste de stock hacia un objetivo (*stock adjustment*, búsqueda de objetivo)

```vensim
ajuste = (Stock deseado - Stock) / tiempo de ajuste            ~ Unit/Year
```
Primer orden, bucle B. El tiempo de ajuste es la constante de tiempo (63 % de la brecha cerrada tras un tiempo de ajuste). Combinado con reposición de pérdidas esperadas: `entrada deseada = MAX(0, perdidas esperadas + ajuste)` (modelo 4).

### 12.2 Fracción de flujo y tiempo de residencia

```vensim
entrada = Stock * fraccion                                     ~ Unit/Year
salida  = Stock / tiempo medio de residencia                   ~ Unit/Year
```
Elegir la que tenga significado medible (una tasa de natalidad se mide como fracción; una vida útil como tiempo).

### 12.3 Cadena de envejecimiento (*aging chain*) y cohortes

Stocks en serie, cada uno con salida de primer orden `Stock_i / tiempo en la etapa i` y salidas laterales (muertes, abandonos). Captura la composición (edad, experiencia, antigüedad) y genera retrasos de orden igual al número de etapas.

```vensim
Menores[Region] = INTEG(nacimientos[Region] - maduracion[Region] - muertes de menores[Region], menores iniciales[Region])
maduracion[Region] = Menores[Region] / duracion de la infancia
```
Modelo 6 de `14-ejemplos-de-modelos.md` (tres cohortes × dos regiones con subíndices).

### 12.4 Coflujo (*coflow*)

Acompaña un stock principal con un stock de un **atributo total** (p. ej. experiencia total de los empleados) para calcular su promedio:

```vensim
Empleados = INTEG(contratacion - salidas, empleados iniciales)                       ~ Person
Experiencia total = INTEG(experiencia de nuevos - experiencia perdida + aprendizaje, experiencia total inicial)   ~ Person*Year
experiencia de nuevos = contratacion * experiencia media de los nuevos              ~ Person   { (Person/Year)*Year }
experiencia perdida = salidas * experiencia media                                   ~ Person
aprendizaje = Empleados * 1                                                         ~ Person   { cada empleado gana 1 año de experiencia por año; el 1 tiene unidades Year/Year }
experiencia media = ZIDZ(Experiencia total, Empleados)                              ~ Year
```
Regla: el flujo del atributo es el flujo principal multiplicado por el atributo medio del stock de origen (o del nuevo ingreso). Las unidades de este fragmento: `Experiencia total` en Person·Year, sus flujos en Person (= Person·Year/Year). (Fragmento ilustrativo, no simulado.)

### 12.5 Percepción y expectativas (SMOOTH)

```vensim
demanda percibida = SMOOTH(demanda, tiempo de percepcion)                  { expectativas adaptativas }
tendencia percibida = TREND(demanda, tiempo de promedio, tendencia inicial) { tasa fraccional de cambio }
```
Las decisiones se basan en **percepciones**, no en valores reales. `SMOOTH` es un retraso de información de primer orden; `SMOOTH3` si la percepción pasa por varias etapas.

### 12.6 Capacidad y utilización

```vensim
produccion = MIN(produccion deseada, capacidad)                              { límite duro }
{ alternativa suave: }
produccion = capacidad * utilizacion
utilizacion = efecto de la demanda sobre la utilizacion(produccion deseada / capacidad)
{ lookup creciente y saturante: f(0)=0, f(1) cercano a 1, f(x>>1)=1 }
```
El `MIN` es un "mínimo duro" y crea discontinuidades de pendiente; la versión con lookup ("fuzzy MIN") suele ser más realista.

### 12.7 Efecto normalizado (multiplicadores)

```vensim
Y = Y normal * efecto de X1 sobre Y(X1 / X1 normal) * efecto de X2 sobre Y(X2 / X2 normal)
```
Cada lookup pasa por (1,1). Ver sección 5.3 y modelo 5.

### 12.8 Gestión de stocks con línea de suministro (*stock management*)

```vensim
pedidos = MAX(0, perdidas esperadas + (Stock deseado - Stock)/tiempo de ajuste del stock
                 + (Linea de suministro deseada - Linea de suministro)/tiempo de ajuste de la linea)
Linea de suministro deseada = perdidas esperadas * retraso de adquisicion esperado
```
Omitir (o infra-ponderar) la corrección de la línea de suministro es la causa más común de oscilación y amplificación en cadenas de suministro (juego de la cerveza).

### 12.9 Control de primer orden para stocks no negativos

```vensim
salida = MIN(salida deseada, Stock / tiempo minimo de salida)
```
El stock se aproxima a cero exponencialmente en lugar de volverse negativo. Preferible a recortar el stock con `MAX(0, ...)` dentro de un `INTEG`, que no conserva el material. Modelos 4 y 7 de `14-ejemplos-de-modelos.md`.

### 12.10 Divisiones seguras

```vensim
promedio = ZIDZ(total, cantidad)                 { 0 si cantidad ≈ 0 }
cobertura = XIDZ(inventario, envios, cobertura maxima)   { valor alternativo si envios ≈ 0 }
```
`XIDZ`/`ZIDZ` devuelven el valor alternativo cuando el divisor es menor que 1E-6 en valor absoluto (documentación de Vensim).

---

## 13. Tabla resumen concepto → Vensim

| Concepto | Implementación en Vensim |
|----------|--------------------------|
| Stock / nivel | *Box Variable*; `INTEG(flujo neto, valor inicial)` |
| Flujo | *Rate* (válvula + tuberías; nubes como frontera) |
| Auxiliar / constante | *Variable*; tipo *Auxiliary*/*Constant* |
| Enlace causal y polaridad | *Arrow*; polaridad `+`/`−` (o `S`/`O`) en propiedades |
| Bucle R/B | Comentario con forma de bucle; análisis con *Loops* |
| Variable sombra | *Shadow Variable* (`<nombre>` en gris) |
| Retraso material | `DELAY1(I)`, `DELAY3(I)`, `DELAY N`, `DELAY FIXED`, `DELAYP` |
| Retraso de información | `SMOOTH(I)`, `SMOOTH3(I)`, `SMOOTH N`, `TREND`, `FORECAST` |
| No linealidad | Lookups (`nombre(x)`, `WITH LOOKUP`, `LOOKUP EXTRAPOLATE`), `MIN`, `MAX` |
| Entradas de prueba | `STEP`, `RAMP`, `PULSE`, `PULSE TRAIN`, `RANDOM ...` |
| Condiciones iniciales en equilibrio | Valor inicial del `INTEG` = valor deseado; `INITIAL(...)`; `ACTIVE INITIAL(...)` para romper ciclos de inicialización |
| Subíndices (arrays) | Rango `Region: norte, sur`; `x[Region]`; `SUM(x[Region!])` |
| Unidades | Campo *Units*; `Dmnl` para adimensional; *Units Check* |
| Pruebas extremas | *SyntheSim*; *Reality Check* |
| Sensibilidad / calibración | *Sensitivity* (Monte Carlo); *Optimize* (payoff) |
| Seguimiento de causalidad | *Causes Tree*, *Uses Tree*, *Causes Strip*, *Table Time Down* |

---

## 14. Fuentes

- Forrester, J. W. (1961). *Industrial Dynamics*. MIT Press.
- Sterman, J. D. (2000). *Business Dynamics: Systems Thinking and Modeling for a Complex World*. Irwin/McGraw-Hill (caps. 1–3: perspectiva y proceso; 4–5: modos de comportamiento y diagramas causales; 6–7: stocks y flujos; 11: retrasos; 12: cadenas de envejecimiento y coflujos; 13–15: formulación y lookups; 17–19: gestión de stocks; 21: validación).
- Senge, P. M. (1990). *The Fifth Discipline*. Doubleday (arquetipos). Kim, D. H. (1992). *Systems Archetypes I*. Pegasus Communications. Braun, W. (2002). *The System Archetypes*.
- Forrester, J. W. & Senge, P. M. (1980). Tests for building confidence in system dynamics models. *TIMS Studies in the Management Sciences* 14. Barlas, Y. (1996). Formal aspects of model validity and validation in system dynamics. *System Dynamics Review* 12(3).
- Meadows, D. H. (2008). *Thinking in Systems: A Primer*. Chelsea Green.
- Documentación de Vensim (extractos obtenidos vía búsqueda; vensim.com no accesible directamente desde este entorno): INTEG (`fn_integ.html`), DELAY FIXED (`fn_delay_fixed.html`), DELAYP (`fn_delayp.html`), "Material and Information Delays" (`mgu09_material_and_information_delays.html`), LOOKUP EXTRAPOLATE (`fn_lookup_extrapolate.html`), "Units and Lookup Functions" (`22280.html`), XIDZ/ZIDZ (`fn_xidz.html`, `fn_zidz.html`), Euler/Runge-Kutta (`euler.html`, `rungekutta.html`), Constraints/Reality Check (`20970.html`, `fn_rc.html`), "Units Check" ("Units are A.O.K.", `20405.html`).
- Simulaciones propias con PySD 3.14.3: respuestas de retrasos (sección 4.3) y esqueletos de arquetipos (sección 7) (scripts no incluidos); modelos completos en `examples/` (doc 14).
- Codificación de polaridades en el `.mdl` (43/45/83/79): `src/simlin/src/simlin-engine/src/mdl/writer.rs`; marcadores de bucle: `src/SDEverywhere/examples/sir/model/sir.mdl`.
