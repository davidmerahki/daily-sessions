# Flywheel de credenciales: modelo v0.2 (hipótesis con punto de partida de HubSpot)

Modelo de dinámica de sistemas del ecosistema de credenciales digitales. Lo forman instituciones (y sus unidades académicas), docentes, estudiantes y empresas. Sirve para ver cómo se conectan los flywheels de cada actor y cuánto pesa cada palanca de adquisición y de growth.

**Simulador interactivo:** https://claude.ai/artifact/5VjtbXGjGgtFBgRnZxrXuJ, con dos pestañas:
- **Lienzo:** se dibujan niveles, flujos, variables y flechas, se escriben las fórmulas y se simula en vivo, como en Vensim.
- **Tablero:** palancas, flywheels y escenarios.

También está como `tablero.html` en esta carpeta, un solo archivo que se abre en cualquier navegador. Ver [`simulador/README.md`](../../simulador/README.md) para el uso del lienzo.

> **HubSpot es la fuente de verdad del punto de partida.** Seis valores salen de HubSpot al 17-oct-2026: clientes, pilotos, prospección, conversión y duración de los pilotos, y unidades iniciales (ver [Punto de partida con datos de HubSpot](#punto-de-partida-con-datos-de-hubspot)). **El resto siguen siendo supuestos**, elegidos para que el comportamiento sea plausible y no medidos. El valor del modelo hoy está en su **estructura**: qué bucles existen y cómo interactúan (ver [Qué validar](#qué-validar-y-con-qué-datos)).

## Contenido

- [Cómo se traduce la conversación al modelo](#cómo-se-traduce-la-conversación-al-modelo)
- [Estructura por sector](#estructura-por-sector)
- [Los bucles](#los-bucles)
- [Punto de partida con datos de HubSpot](#punto-de-partida-con-datos-de-hubspot)
- [Resultados con los supuestos actuales](#resultados-con-los-supuestos-actuales)
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

El archivo `.mdl` tiene una vista por sector (6 vistas). Las variables de otros sectores aparecen como variables sombra, y las flechas llevan la polaridad calculada a partir de las ecuaciones.

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

Cada bucle R tiene un interruptor (`activar …` = 1/0) para medir cuánto crecimiento depende de él.

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
1. Descarga de HubSpot los negocios POK de los pipelines comerciales.
2. Recalcula las seis cifras de la tabla.
3. Cámbialas en `generar_modelo.py` y regenera el modelo (ver [Cómo modificar el modelo](#cómo-modificar-el-modelo)).
4. Corre `node modelos/ecosistema_credenciales/resultados.js` para rehacer las tablas de abajo.

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

Pendiente de modelar cuando definas las tácticas de growth: costos y presupuesto por táctica, ingresos (por institución, unidad o credencial), segmentación por país o tipo de institución, y canales de adquisición separados.

## Cómo modificar el modelo

**Desde el lienzo (sin programar).** Edita el modelo en la pestaña Lienzo del artifact y pulsa **Guardar**: eso publica `modelo.mdl` y `tablero_config.json` como nueva versión del artifact. Para pasar esos cambios al repositorio, pídele a Claude «trae los cambios del lienzo». Claude:
1. lee `modelo.mdl` del artifact;
2. lo copia a `ecosistema_credenciales.mdl`;
3. verifica el modelo;
4. rearma el tablero.

**Desde código.** `generar_modelo.py` generó la v0.1 (y la v0.2 con los datos de HubSpot) y sigue sirviendo para cambios grandes de estructura. Cuidado: si el modelo ya se editó en el lienzo, regenerarlo con el script pisa esos cambios. En ese caso hay que editar el `.mdl` (o el generador) partiendo de la versión guardada.

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
