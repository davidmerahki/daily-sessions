# Flywheel de credenciales: modelo v0.3 (hipótesis con punto de partida de HubSpot)

Modelo de dinámica de sistemas del ecosistema de credenciales digitales. Lo forman instituciones (y sus unidades académicas), docentes, estudiantes y empresas. Sirve para ver cómo se conectan los flywheels de cada actor y cuánto pesa cada palanca de adquisición y de growth.

**Simulador interactivo:** https://claude.ai/artifact/5VjtbXGjGgtFBgRnZxrXuJ, con dos pestañas:
- **Lienzo:** se dibujan niveles, flujos, variables y flechas, se escriben las fórmulas y se simula en vivo, como en Vensim.
- **Tablero:** palancas, flywheels y escenarios.

También está como `tablero.html` en esta carpeta, un solo archivo que se abre en cualquier navegador. Ver [`simulador/README.md`](../../simulador/README.md) para el uso del lienzo.

> **HubSpot es la fuente de verdad del punto de partida.** Seis valores salen de HubSpot al 17-oct-2026: clientes, pilotos, prospección, conversión y duración de los pilotos, y unidades iniciales (ver [Punto de partida con datos de HubSpot](#punto-de-partida-con-datos-de-hubspot)). **El resto siguen siendo supuestos**, elegidos para que el comportamiento sea plausible y no medidos. El valor del modelo hoy está en su **estructura**: qué bucles existen y cómo interactúan (ver [Qué validar](#qué-validar-y-con-qué-datos)).

> **v0.3 agrega la primera táctica, T1: paid media «caballo de Troya»** (convocatoria con un cupo de virtualización gratis por mes). Está apagada en la base, así que los resultados de la base no cambian. Se enciende en el tablero (sección *Flywheels y tácticas*). Ver [Táctica T1](#táctica-t1-paid-media-caballo-de-troya).

## Contenido

- [Cómo se traduce la conversación al modelo](#cómo-se-traduce-la-conversación-al-modelo)
- [Estructura por sector](#estructura-por-sector)
- [Los bucles](#los-bucles)
- [Punto de partida con datos de HubSpot](#punto-de-partida-con-datos-de-hubspot)
- [Resultados con los supuestos actuales](#resultados-con-los-supuestos-actuales)
- [Táctica T1: paid media «caballo de Troya»](#táctica-t1-paid-media-caballo-de-troya)
- [Qué validar y con qué datos](#qué-validar-y-con-qué-datos)
- [Cómo modificar el modelo](#cómo-modificar-el-modelo)
- [Archivos](#archivos)

## Cómo se traduce la conversación al modelo

| Lo que describiste | Cómo está en el modelo |
|---|---|
| La institución adquiere, pero la tracción está en **unidades académicas** (educación continua, innovación, decanatos de innovación) | *Land & expand*: cada institución entra por **una unidad** y se expande a otras dentro de la misma institución (bucle R2) o por decisión central de vicerrectores y rectores (`fraccion de expansion institucional`) |
| Los **profesores** generan las evidencias para emitir | `capacidad de emision` = docentes activos × evidencias por docente. Si la demanda supera esa capacidad, la emisión queda limitada (B4) |
| Los profesores (y el talento de la universidad) **también se certifican** | Stock `Docentes certificados`. Los docentes certificados aumentan el compromiso de sus colegas (R4) |
| **Flywheel del estudiante**: necesito demostrar una competencia → infraestructura → credencial (wallets, NFT, Open Badges 3.0, CLR, Europass) | `demanda estudiantil de credenciales` (titulares que piden más credenciales) y `tiempo de uso activo` (si la credencial sirve, se sigue usando). Bucle R3 |
| **Flywheel de la institución**: necesito emitir → plataforma → datos centralizados, mapa de competencias, empleabilidad, marketing | El valor que recibe la institución **reduce su churn** (`reduccion maxima del churn por valor`) y **atrae nuevas** (R6) |
| **Flywheel de la empresa (RR. HH.)**: busco por competencias → búsqueda más precisa → menos tiempo de contratación y menos rotación | `Empresas usuarias`, `probabilidad de encontrar talento` (crece con los titulares), `contrataciones por credencial`, `dias de contratacion ahorrados`. Bucles R5 y R7 |
| **Flywheel completo**: más certificados emitidos y usados → la credencial se vuelve moneda de movilidad académica y laboral → más instituciones quieren emitir | `Valor percibido de la credencial` (0 a 1), que depende del uso (compartidas + verificaciones) y de cuántas empresas la reconocen, con un retraso de percepción de 12 meses. Alimenta R3, R5 y R6 |

## Estructura por sector

Unidad de tiempo: **mes**. Horizonte: 60 meses. Integración: Euler, `TIME STEP` = 0.125.

| Sector | Stocks | Flujos principales |
|---|---|---|
| 1. Instituciones | Potenciales → En piloto → Cliente → Perdidas | inicio de pilotos (prospección + boca a boca + atracción por valor), conversión de pilotos, pilotos no convertidos (vuelven a potenciales), churn |
| 2. Unidades académicas | Unidades activas | entrada con cada cliente nuevo, expansión interna, churn de unidades, unidades perdidas con su institución |
| 3. Docentes | Docentes activos, Docentes certificados | ajuste hacia los docentes comprometidos deseados; certificación y rotación |
| 4. Estudiantes | Credenciales emitidas (acumulado), Titulares activos | emisión = MIN(demanda, capacidad docente); nuevos titulares; desactivación |
| 5. Empresas | Potenciales ↔ Usuarias | adopción (prospección + boca a boca + atracción por talento), churn (menor si encuentran talento) |
| 6. Ecosistema | — | `valor indicado = 1 − e^−(uso y reconocimiento normalizados)` y su percepción con `SMOOTH3` |
| 7. Táctica T1: paid media | Virtualizaciones gratis en curso. Para atribuir: Propuestas de paid media en curso, Clientes ganados con paid media, Gasto acumulado de la táctica | leads calificados (pauta ÷ costo por lead, con tope por público), virtualizaciones (con tope de cupos), compras al terminar la virtualización, paso al pipeline |

El archivo `.mdl` tiene una vista por sector (7 vistas; las virtualizaciones de T1 están en la vista 1, junto al embudo de instituciones). Las variables de otros sectores aparecen como variables sombra, y las flechas llevan la polaridad calculada a partir de las ecuaciones.

## Los bucles

| Código | Bucle | Mecanismo |
|---|---|---|
| R1 | Boca a boca institucional | clientes → referidos → pilotos → clientes |
| R2 | Land & expand | unidades activas → penetración interna → contagio a otras unidades → unidades activas |
| R3 | Hábito del estudiante | titulares → piden credenciales → emisión → titulares; el valor alarga el uso |
| R4 | Compromiso docente | docentes certificados → compromiso → docentes activos → más certificados |
| R5 | Talento verificable | titulares → probabilidad de encontrar talento → empresas usuarias → verificaciones → valor → titulares |
| R6 | Credencial como moneda | valor → atrae y retiene instituciones → unidades → emisión → titulares → uso → valor |
| R7 | Boca a boca empresarial | empresas usuarias → referidos → adopción → empresas usuarias |
| B1 | Saturación del mercado | se agotan las instituciones potenciales |
| B2 | Saturación interna | se agotan las unidades sin activar de cada cliente |
| B3 | Ajuste docente | los docentes activos se acercan a los deseados |
| B4 | Capacidad docente | la emisión no puede superar las evidencias que generan los docentes |
| R8 | Pauta pagada (T1) | clientes ganados → ingreso → presupuesto de pauta → leads → virtualizaciones → clientes ganados. Solo actúa si `fraccion de ingresos reinvertida` > 0 |
| B5 | Público de T1 se agota | cada institución que pasa a POK deja de emitir con un competidor y sale del público del anuncio |

Cada bucle R1 a R7 tiene un interruptor (`activar …` = 1/0) para medir cuánto crecimiento depende de él. La táctica T1 tiene el suyo (`activar paid media`), que empieza en 0.

## Punto de partida con datos de HubSpot

Corte del 17-oct-2026. Cuenta los negocios de credenciales POK (línea `credenciales_pok` o `mixto`) de los pipelines comerciales de Colombia, México y España. El mismo corte alimenta el [Mapa de actores](../../mapa_actores/README.md).

| Variable del modelo | Antes (supuesto) | HubSpot | Cómo se mide |
|---|---|---|---|
| `clientes iniciales` | 25 | **11** | Instituciones con un negocio en «Ganado credenciales POK»: Uniandes, Unicafam, Polisalle, Politécnico Internacional, Fundación U. Páez, Confa, Comfandi, UniverMilenium (MX), PMI Bogotá, Connect Bogotá y Team Rush (SV) |
| `pilotos iniciales` | 5 | **60** | Instituciones que aún no son clientes y tienen un negocio POK abierto en las etapas 3 a 5: propuesta enviada, seguimiento o sesión de cierre (66 negocios) |
| `fraccion de conversion de pilotos` | 50 % | **33 %** | De los 36 negocios POK que salieron del pipeline entre abril y octubre, 12 se ganaron, 18 se perdieron y 6 quedaron para retomar |
| `duracion del piloto` | 4 meses | **10,7 meses** | Ley de Little: 66 negocios en etapas 3 a 5 ÷ 6,2 negocios que salen del pipeline por mes |
| `fraccion de prospeccion` | 0,3 %/mes | **2,4 %/mes** | Unas 13 instituciones por mes llegan a propuesta (66 abiertas + 12 ganadas en 5,8 meses), sobre 529 potenciales |
| `unidades iniciales` | 40 | **11** | Una unidad por negocio ganado; HubSpot no registra qué unidad emite |

**Prueba de consistencia.** Con estos valores, el modelo arranca con 1,9 clientes nuevos por mes. HubSpot registra 2,1 (12 en 5,8 meses). También arranca con 3,8 pilotos no convertidos por mes, frente a 4,1 en HubSpot.

**Límites del dato:**
- La conexión con HubSpot no trae el historial de etapas. Por eso no se sabe en qué etapa se perdió cada negocio.
- El 33 % es un piso: entre los perdidos hay negocios que nunca llegaron a propuesta, como la lista de empresas cargada en abril. Si se descuentan, la conversión sube.
- La duración de 10,7 meses supone un pipeline estable. Como el pipeline todavía crece, la duración real puede ser menor. Los negocios abiertos en etapas 3 a 5 llevan 3,5 meses en promedio y siguen abiertos.

**Lo que HubSpot no tiene** y sigue como supuesto:
- Credenciales emitidas, titulares y uso: son datos de la plataforma POK.
- Empresas que buscan por competencias.
- Unidades por institución, docentes y churn: aún no hay bajas de clientes.
- Tamaño del mercado. HubSpot ya tiene 401 instituciones educativas con actividad y otras 542 instituciones sin actividad. El supuesto de 600 podría quedarse corto.

**Para repetir la medición:**
1. Descarga de HubSpot todos los negocios (con `createdate` y la probabilidad de la etapa) y toma el Mapa de actores al día.
2. Corre `python modelos/ecosistema_credenciales/medir_en_hubspot.py NEGOCIOS.json MAPA.html --hoy AAAA-MM-DD`. Imprime las cifras de la tabla.
3. Cámbialas en `generar_modelo.py` y regenera el modelo (ver [Cómo modificar el modelo](#cómo-modificar-el-modelo)). La fracción de prospección es la fracción bruta menos lo que ya aportan el boca a boca y la atracción por valor al inicio.
4. Corre `node modelos/ecosistema_credenciales/resultados.js` para rehacer las tablas de abajo. También imprime la tabla de la [Táctica T1](#táctica-t1-paid-media-caballo-de-troya), su público y su costo de equilibrio: cópialos a esa sección, porque la base de la tabla (42 y 120 clientes) y el público (159 instituciones) cambian con la calibración.

## Resultados con los supuestos actuales

**Base (mes 60):** 199 instituciones cliente (de 600 en el mercado; 44 perdidas y 138 en piloto), 725 unidades activas (46 % de penetración interna), 2,15 M credenciales emitidas, 662 mil titulares activos, 1.253 empresas usuarias y valor percibido 0,79. Al mes 36: 120 instituciones cliente.

**Cuánto se pierde al mes 60 si se apaga cada bucle** (el resto queda igual):

| Bucle | Instituciones | Unidades | Credenciales | Empresas |
|---|---|---|---|---|
| R1 Boca a boca institucional | 12 % | 10 % | 7 % | 2 % |
| R2 Land & expand | 1 % | **63 %** | **50 %** | 16 % |
| R3 Hábito del estudiante | 0 % | 0 % | 7 % | 4 % |
| R4 Compromiso docente | 0 % | 0 % | 16 % | 4 % |
| R5 Talento verificable | 6 % | 5 % | 3 % | **60 %** |
| R6 Credencial como moneda | **16 %** | 15 % | 7 % | 1 % |
| R7 Boca a boca empresarial | 5 % | 5 % | 2 % | 56 % |

**Efecto de algunas palancas (mes 60, contra la base):**

| Palanca | Instituciones | Unidades | Credenciales | Empresas |
|---|---|---|---|---|
| Duplicar la prospección de instituciones (2,4 → 4,8 %/mes) | +30 % | +35 % | +37 % | +9 % |
| Conversión de pilotos de 33 % a 53 % | **+49 %** | **+52 %** | **+50 %** | +11 % |
| Decidir los pilotos en la mitad del tiempo (10,7 → 5,35 meses) | +20 % | +23 % | +27 % | +8 % |
| Duplicar la expansión institucional (decisión central) | +0 % | +14 % | +15 % | +4 % |
| Evidencias por docente de 15 a 30 | +1 % | +1 % | +12 % | +5 % |
| Triplicar la prospección de empresas | +5 % | +5 % | +3 % | **+25 %** |

**Lecturas (válidas solo con estos supuestos):**

1. **El cuello de botella comercial es la decisión, no la prospección.**
   - Hoy hay 60 instituciones en piloto y 11 clientes.
   - Subir la conversión 20 puntos rinde más que duplicar la prospección: +49 % frente a +30 % de instituciones.
   - Cerrar los pilotos en la mitad del tiempo suma +20 %.
2. **El crecimiento de credenciales sigue dependiendo de expandirse dentro de cada institución (R2).** Explica la mitad de las credenciales del mes 60.
3. **La prospección propia pesa más que el boca a boca.** El equipo lleva unas 13 instituciones por mes a propuesta. Por eso apagar R1 o R6 resta menos que en la v0.1 (12 % y 16 % frente a 33 % y 47 %).
4. **Las empresas siguen moviendo a las instituciones, pero menos.** Triplicar la prospección de empresas suma +5 % de instituciones (+11 % en la v0.1).
5. **La capacidad docente limita la emisión en los 60 meses.** Si en la realidad no es el cuello de botella, hay que subir `evidencias por docente` o `fraccion base de docentes comprometidos`.

## Táctica T1: paid media «caballo de Troya»

**La idea (David, 17-oct-2026).** merahki pauta una convocatoria dirigida a instituciones que emiten con Certifie o Acredita: *«Virtualizamos gratis un curso corto de 10 horas. Un cupo por mes»*. Todos los que se registran participan y uno por mes gana. El objetivo es juntar leads de instituciones que hoy emiten con otro proveedor y trabajarlos desde POK (caso de uso UC1, reemplazar un emisor cautivo). El cupo único es el mensaje de escasez.

**Cómo está en el modelo:**
1. **Público:** el 30 % de las instituciones potenciales emite con un competidor (159 al inicio). Se agota a medida que pasan a POK (B5).
2. **Registros calificados:** pauta ÷ costo por lead × fracción calificada. Tienen un tope: la pauta no puede volver lead a más del 10 % del público por mes.
3. **Ganador del mes:** 1 virtualización gratis por mes. Dura 2 meses y el curso sale certificado con POK. Al terminar, el 40 % de los ganadores compra POK y el resto sigue en el pipeline como piloto.
4. **Los que no ganan** son 9 de cada 10 registros calificados. El 30 % llega a una propuesta de POK y sigue el pipeline normal (33 % de conversión en 10,7 meses).
5. **Atribución y costo:** un stock de seguimiento cuenta los pilotos que vinieron de T1. Así se calculan los clientes ganados, el gasto (pauta + costo de cada virtualización), el costo por cliente y el ingreso del primer año por dólar.
6. **R8:** con `fraccion de ingresos reinvertida` > 0, parte del ingreso de esos clientes vuelve a la pauta.

**Supuestos de T1** (los cambia el tablero):

| Supuesto | Valor | Dato que lo reemplaza |
|---|---|---|
| Cupos | 1 por mes | Decisión del equipo (17-oct-2026) |
| Costo de virtualizar el curso de 10 h | USD 1.500 | Costo interno de merahki. Como referencia de precio, merahki vendió a Uniandes un curso de 10 h asincrónicas en COP 12 M (unos USD 3.700) |
| Potenciales que emiten con un competidor | 30 % | En las llamadas, unas 16 de 50 cuentas ya tenían emisor (UC1). Mejor: contar en LinkedIn las instituciones colombianas cuyas insignias muestran Certifie o Acredita |
| Pauta | USD 1.500/mes | Presupuesto aprobado |
| Costo por lead y fracción calificada | USD 60; 40 % | Las primeras 4 semanas de campaña. La escasez puede bajar el costo por lead y también la calidad |
| Tope de alcance | 10 % del público por mes | Las primeras 4 semanas de campaña |
| Duración y compra del ganador al terminar | 2 meses; 40 % | Los primeros ganadores |
| Registrados sin cupo que llegan a propuesta | 30 % | HubSpot, con el campo «Estrategia y táctica» (`#paid-media`) |
| Ingreso del primer año por cliente nuevo | USD 2.000 | HubSpot: el promedio ganado sin Uniandes es de unos USD 1.960 |

**Resultados** (`node modelos/ecosistema_credenciales/resultados.js`):

| Escenario con T1 encendida | Clientes mes 12 (base 42) | Clientes mes 36 (base 120) | Clientes ganados por T1 (mes 36) | Gasto acumulado (mes 36) | Costo por cliente (mes 36) | Ingreso del 1.er año por dólar (mes 36) |
|---|---|---|---|---|---|---|
| Diseño decidido: 1 cupo al mes, curso de 10 h que cuesta USD 1.500 | 50 (+19 %) | 151 (+25 %) | 41 | USD 108.000 | USD 2.647 | 0,76 |
| El curso cuesta USD 500 | 50 (+19 %) | 151 (+25 %) | 41 | USD 72.000 | USD 1.764 | 1,13 |
| El curso cuesta USD 3.700 (lo que se cobró a Uniandes) | 50 (+19 %) | 151 (+25 %) | 41 | USD 187.200 | USD 4.588 | 0,44 |
| Todos los registrados reciben algo: 50 % llega a propuesta | 53 (+25 %) | 160 (+34 %) | 55 | USD 108.000 | USD 1.956 | 1,02 |
| Ganador elegido por criterios: compra el 60 % | 52 (+23 %) | 155 (+29 %) | 46 | USD 108.000 | USD 2.348 | 0,85 |
| Las dos anteriores juntas | 54 (+29 %) | 165 (+37 %) | 60 | USD 108.000 | USD 1.789 | 1,12 |
| Escasez: lead a USD 40, pero solo 30 % calificado | 51 (+21 %) | 152 (+27 %) | 43 | USD 108.000 | USD 2.513 | 0,80 |
| Versión anterior (v0.3): 2 cupos a USD 2.000 | 54 (+29 %) | 163 (+36 %) | 56 | USD 198.000 | USD 3.514 | 0,57 |

**Lecturas (válidas solo con estos supuestos):**
1. **Con un cupo, T1 suma +19 % de clientes al mes 12 y +25 % al mes 36.** Cuesta la mitad que la versión de 2 cupos.
2. **El que pesa es el que no gana.** Son 9 de cada 10 registros. Si todos reciben algo que los lleve a una propuesta (de 30 % a 50 %), T1 suma +34 % al mes 36 y se paga en el primer año.
3. **El costo real del curso decide si T1 se paga.** Con los supuestos del diseño, se paga en el primer año si virtualizar cuesta menos de USD 767. Si además todos reciben algo y el ganador se elige por criterios, el límite sube a USD 1.853.
4. **El público es chico y se agota.** De 159 instituciones con emisor competidor quedan 80 al mes 36. Es una campaña de 12 a 18 meses, no un canal permanente.
5. **Reinvertir el ingreso en pauta no ayuda.** Con el cupo y el público como freno, más pauta solo sube el costo por cliente.

## Qué validar y con qué datos

| Supuesto | Valor actual | Dato que lo reemplaza |
|---|---|---|
| Clientes, pilotos y unidades al inicio | 11, 60 y 11 | ✅ HubSpot, 17-oct-2026. Falta saber qué unidades emiten en cada cliente |
| Prospección | 2,4 % de potenciales por mes llega a propuesta | ✅ HubSpot, 17-oct-2026 |
| Piloto | 10,7 meses, 33 % convierte | ✅ HubSpot, 17-oct-2026, con los límites de arriba. Mejoraría con el historial de etapas (en qué etapa se perdió cada negocio) |
| Tamaño del mercado | 600 instituciones | Universidades e IES objetivo por país. HubSpot ya tiene 401 educativas con actividad y 542 instituciones más sin actividad |
| Unidades por institución | 8 | Unidades que podrían emitir en un cliente típico |
| Expansión interna | 0,4 %/mes central + contagio 6 %/mes | Unidades activas por cliente a lo largo del tiempo |
| Churn | 1 %/mes instituciones, 1 %/mes unidades | Bajas históricas. En HubSpot todavía no hay clientes POK perdidos |
| Emisión por unidad | 120 credenciales/mes | Emisiones mensuales por unidad |
| Docentes | 30 por unidad, 30 % comprometidos, 15 evidencias/mes | Docentes que cargan evidencias y cuántas |
| Estudiantes | 50 % de emisiones van a nuevos titulares, 18 meses de uso activo; 50.000 credenciales y 20.000 titulares al inicio | Titulares únicos, compartidas y verificaciones por mes (plataforma POK, no HubSpot). Con 11 clientes, el punto de partida de 50.000 credenciales puede ser alto |
| Empresas | 3.000 en el mercado, 0,1 %/mes de prospección, 4 búsquedas/mes | Empresas que buscan o verifican en la plataforma |
| Valor de la credencial | Escala de uso 100 mil usos/mes, 300 empresas, 12 meses de percepción | Encuestas de valor percibido; uso y verificaciones |

Pendiente de modelar: el resto de las tácticas de growth (T1 ya está), ingresos de toda la base de clientes (por institución, unidad o credencial), segmentación por país o tipo de institución, y canales de adquisición separados.

## Cómo modificar el modelo

**Desde el lienzo (sin programar).** Edita el modelo en la pestaña Lienzo del artifact y pulsa **Guardar**: eso publica `modelo.mdl` y `tablero_config.json` como nueva versión del artifact. Para pasar esos cambios al repositorio, pídele a Claude «trae los cambios del lienzo». Claude:
1. lee `modelo.mdl` del artifact;
2. lo copia a `ecosistema_credenciales.mdl`;
3. verifica el modelo;
4. rearma el tablero.

**Desde código.** `generar_modelo.py` generó la v0.1, la v0.2 (datos de HubSpot) y la v0.3 (táctica T1), y sigue sirviendo para cambios grandes de estructura. Cuidado: si el modelo ya se editó en el lienzo, regenerarlo con el script pisa esos cambios. En ese caso hay que editar el `.mdl` (o el generador) partiendo de la versión guardada.

```bash
python modelos/ecosistema_credenciales/generar_modelo.py        # escribe el .mdl (usa PySD para las polaridades si está instalado)
node simulador/pruebas/ida_y_vuelta.js modelos/ecosistema_credenciales/ecosistema_credenciales.mdl
python simulador/pruebas/verificar_contra_pysd.py modelos/ecosistema_credenciales/ecosistema_credenciales.mdl
python simulador/construir_tablero.py modelos/ecosistema_credenciales
node modelos/ecosistema_credenciales/resultados.js               # tablas de «Resultados» (mes 60; pasa otro mes como argumento)
```

Para publicar, el artifact lleva `tablero.html` como página y, junto a ella, `modelo.mdl` (copia de `ecosistema_credenciales.mdl`) y `tablero_config.json`.

El `.mdl` se abre en Vensim (necesita PLE Plus o superior por tener varias vistas). También lo leen PySD y Simlin.

## Archivos

| Archivo | Qué es |
|---|---|
| `generar_modelo.py` | Fuente de verdad: ecuaciones, supuestos, posiciones del diagrama |
| `ecosistema_credenciales.mdl` | Modelo en formato Vensim, generado |
| `tablero_config.json` | Qué muestra el tablero: KPIs, gráficos, nombres de los bucles |
| `diagrama_bucles.svg` | Mapa de bucles del tablero |
| `tablero.html` | Simulador autocontenido (lienzo + tablero), generado |
| `resultados.js` | Recalcula las tablas de «Resultados» con el motor del simulador |
| `medir_en_hubspot.py` | Mide en HubSpot el punto de partida del sector Instituciones |
