# Flywheel de credenciales: modelo v0.1 (hipótesis)

Modelo de dinámica de sistemas del ecosistema de credenciales digitales. Lo forman instituciones (y sus unidades académicas), docentes, estudiantes y empresas. Sirve para ver cómo se conectan los flywheels de cada actor y cuánto pesa cada palanca de adquisición y de growth.

**Simulador interactivo:** https://claude.ai/artifact/5VjtbXGjGgtFBgRnZxrXuJ, con dos pestañas:
- **Lienzo:** se dibujan niveles, flujos, variables y flechas, se escriben las fórmulas y se simula en vivo, como en Vensim.
- **Tablero:** palancas, flywheels y escenarios.

También está como `tablero.html` en esta carpeta, un solo archivo que se abre en cualquier navegador. Ver [`simulador/README.md`](../../simulador/README.md) para el uso del lienzo.

> **Todos los parámetros son supuestos de partida**, elegidos para que el comportamiento sea plausible y no medidos. El valor del modelo hoy está en su **estructura**: qué bucles existen y cómo interactúan. Las cifras cambian en cuanto se reemplacen los supuestos por datos reales (ver [Qué validar](#qué-validar-y-con-qué-datos)).

## Contenido

- [Cómo se traduce la conversación al modelo](#cómo-se-traduce-la-conversación-al-modelo)
- [Estructura por sector](#estructura-por-sector)
- [Los bucles](#los-bucles)
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

## Resultados con los supuestos actuales

**Base (mes 60):** 191 instituciones cliente (de 600 en el mercado; 36 perdidas), 660 unidades activas (43 % de penetración interna), 2,04 M credenciales emitidas, 604 mil titulares activos, 1.312 empresas usuarias y valor percibido 0,81.

**Cuánto se pierde al mes 60 si se apaga cada bucle** (el resto queda igual):

| Bucle | Instituciones | Unidades | Credenciales | Empresas |
|---|---|---|---|---|
| R1 Boca a boca institucional | 33 % | 30 % | 22 % | 5 % |
| R2 Land & expand | 4 % | **62 %** | **51 %** | 18 % |
| R3 Hábito del estudiante | 1 % | 1 % | 9 % | 5 % |
| R4 Compromiso docente | 1 % | 1 % | 17 % | 5 % |
| R5 Talento verificable | 18 % | 15 % | 8 % | **62 %** |
| R6 Credencial como moneda | **47 %** | 39 % | 20 % | 4 % |
| R7 Boca a boca empresarial | 13 % | 11 % | 5 % | 57 % |

**Efecto de algunas palancas (mes 60, contra la base):**

| Palanca | Instituciones | Unidades | Credenciales | Empresas |
|---|---|---|---|---|
| Duplicar la prospección de instituciones (0,3 → 0,6 %/mes) | +18 % | +21 % | +19 % | +4 % |
| Conversión de pilotos de 50 % a 70 % | **+40 %** | +38 % | +27 % | +5 % |
| Duplicar la expansión institucional (decisión central) | +1 % | +13 % | +12 % | +3 % |
| Evidencias por docente de 15 a 30 | +1 % | +1 % | +9 % | +2 % |
| Triplicar la prospección de empresas | **+11 %** | +11 % | +7 % | +23 % |

**Lecturas (válidas solo con estos supuestos):**

1. **El crecimiento de credenciales depende sobre todo de expandirse dentro de cada institución (R2).** Coincide con que las unidades académicas tienen más tracción que la institución como un todo.
2. **Mejorar la conversión de pilotos rinde más que prospectar más.** Cada piloto convertido alimenta después R1 y R6, así que la mejora se compone.
3. **Las empresas mueven a las instituciones.** Traer empresas sube el valor de la credencial y eso atrae universidades (+11 % de instituciones al triplicar la prospección de empresas). Es el efecto de red entre los dos lados del ecosistema.
4. **El flywheel del ecosistema (R6) tarda.** El valor percibido apenas pasa de 0,2 en el mes 24, por el retraso de percepción de 12 meses. Antes de eso el crecimiento lo sostienen la prospección, el boca a boca y la expansión interna.
5. **La capacidad docente limita la emisión en 58 de 60 meses.** Con estos supuestos, generar evidencias es el cuello de botella. Si en la realidad no lo es, hay que subir `evidencias por docente` o `fraccion base de docentes comprometidos`. Si sí lo es, las tácticas que activan docentes valen más que las de adquisición para emitir más.

## Qué validar y con qué datos

| Supuesto | Valor actual | Dato que lo reemplaza |
|---|---|---|
| Tamaño del mercado | 600 instituciones | Universidades e IES objetivo por país |
| Prospección | 0,3 % de potenciales por mes inicia piloto | Pilotos iniciados por mes ÷ cuentas objetivo |
| Piloto | 4 meses, 50 % convierte | Historial de pilotos del CRM |
| Unidades por institución | 8 | Unidades que podrían emitir en un cliente típico |
| Expansión interna | 0,4 %/mes central + contagio 6 %/mes | Unidades activas por cliente a lo largo del tiempo |
| Churn | 1 %/mes instituciones, 1 %/mes unidades | Bajas históricas |
| Emisión por unidad | 120 credenciales/mes | Emisiones mensuales por unidad |
| Docentes | 30 por unidad, 30 % comprometidos, 15 evidencias/mes | Docentes que cargan evidencias y cuántas |
| Estudiantes | 50 % de emisiones van a nuevos titulares, 18 meses de uso activo | Titulares únicos, compartidas y verificaciones por mes |
| Empresas | 3.000 en el mercado, 0,1 %/mes de prospección, 4 búsquedas/mes | Empresas que buscan o verifican en la plataforma |
| Valor de la credencial | Escala de uso 100 mil usos/mes, 300 empresas, 12 meses de percepción | Encuestas de valor percibido; uso y verificaciones |

Pendiente de modelar cuando definas las tácticas de growth: costos y presupuesto por táctica, ingresos (por institución, unidad o credencial), segmentación por país o tipo de institución, y canales de adquisición separados.

## Cómo modificar el modelo

**Desde el lienzo (sin programar).** Edita el modelo en la pestaña Lienzo del artifact y pulsa **Guardar**: eso publica `modelo.mdl` y `tablero_config.json` como nueva versión del artifact. Para pasar esos cambios al repositorio, pídele a Claude «trae los cambios del lienzo». Claude:
1. lee `modelo.mdl` del artifact;
2. lo copia a `ecosistema_credenciales.mdl`;
3. verifica el modelo;
4. rearma el tablero.

**Desde código.** `generar_modelo.py` generó la v0.1 y sigue sirviendo para cambios grandes de estructura. Cuidado: si el modelo ya se editó en el lienzo, regenerarlo con el script pisa esos cambios. En ese caso hay que editar el `.mdl` (o el generador) partiendo de la versión guardada.

```bash
python modelos/ecosistema_credenciales/generar_modelo.py        # escribe el .mdl (usa PySD para las polaridades si está instalado)
node simulador/pruebas/ida_y_vuelta.js modelos/ecosistema_credenciales/ecosistema_credenciales.mdl
python simulador/pruebas/verificar_contra_pysd.py modelos/ecosistema_credenciales/ecosistema_credenciales.mdl
python simulador/construir_tablero.py modelos/ecosistema_credenciales
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
