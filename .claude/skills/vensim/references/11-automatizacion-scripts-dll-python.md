# 11 · Automatización de Vensim: command scripts, DLL, Python, Venapps y distribución

> Referencia experta para automatizar Vensim (Ventana Systems) y conectarlo con otros programas.
> Convenciones: comandos, menús y funciones en inglés tal como aparecen en Vensim. Lo marcado **(verificar)** no se pudo confirmar con documentación primaria o código y debe comprobarse antes de afirmarlo como hecho.
> Estado del conocimiento: octubre 2026 (Vensim 10.x; PySD 3.14.3 en PyPI).

## Tabla de contenidos

1. [Panorama: ¿qué vía de automatización usar?](#1-panorama-qué-vía-de-automatización-usar)
2. [Command scripts (`.cmd`)](#2-command-scripts-cmd)
   - 2.1 [Qué son y qué edición requieren](#21-qué-son-y-qué-edición-requieren)
   - 2.2 [Cómo se ejecutan](#22-cómo-se-ejecutan)
   - 2.3 [Sintaxis](#23-sintaxis)
   - 2.4 [Catálogo de comandos por categoría](#24-catálogo-de-comandos-por-categoría)
   - 2.5 [Ejemplos completos](#25-ejemplos-completos)
   - 2.6 [Buenas prácticas y errores típicos](#26-buenas-prácticas-y-errores-típicos)
3. [Vensim DLL](#3-vensim-dll)
   - 3.1 [Variantes, instalación y licencia](#31-variantes-instalación-y-licencia)
   - 3.2 [Funciones y firmas](#32-funciones-y-firmas)
   - 3.3 [Códigos y valores de retorno](#33-códigos-y-valores-de-retorno)
   - 3.4 [Python + ctypes (ejemplo completo)](#34-python--ctypes-ejemplo-completo)
   - 3.5 [Simulación por tramos y *gaming*](#35-simulación-por-tramos-y-gaming)
   - 3.6 [VBA / Excel](#36-vba--excel)
   - 3.7 [C / C++](#37-c--c)
   - 3.8 [Otros lenguajes y la DLL multicontexto](#38-otros-lenguajes-y-la-dll-multicontexto)
4. [Python](#4-python)
   - 4.1 [Mapa de opciones](#41-mapa-de-opciones)
   - 4.2 [PySD (traducción .mdl → Python)](#42-pysd-traducción-mdl--python)
   - 4.3 [venpy (envoltorio de la DLL)](#43-venpy-envoltorio-de-la-dll)
   - 4.4 [EMA Workbench](#44-ema-workbench)
   - 4.5 [Integración "nativa" en Vensim 10](#45-integración-nativa-en-vensim-10)
   - 4.6 [Leer `.vdf` sin Vensim: pysimlin](#46-leer-vdf-sin-vensim-pysimlin)
5. [Venapps](#5-venapps)
6. [Distribución: Publish, Model Reader, `.vpm/.vpmx`, contraseñas](#6-distribución-publish-model-reader-vpmvpmx-contraseñas)
7. [Funciones externas (DLL de usuario) vs. macros](#7-funciones-externas-dll-de-usuario-vs-macros)
8. [Excel y otros intercambios de datos](#8-excel-y-otros-intercambios-de-datos)
9. [Guía rápida de decisión](#9-guía-rápida-de-decisión)
10. [Lista de puntos (verificar)](#10-lista-de-puntos-verificar)
11. [Fuentes](#11-fuentes)

---

## 1. Panorama: ¿qué vía de automatización usar?

| Vía | Qué hace | Edición / requisito | Plataforma | Cuándo usarla |
|---|---|---|---|---|
| **Command script** (`.cmd`) | Lista de comandos `CATEGORIA>COMANDO\|args` ejecutados en lote por Vensim | DSS (según documentación) | Windows/macOS (donde corra Vensim DSS) | Lotes de escenarios, exportación de resultados, tareas repetitivas sin programar |
| **Run configuration tool** (desde 9.4) | Guarda configuraciones de corrida y comandos pre/post-simulación | DSS según `01-productos-licencias-versiones.md` (verificar) | Escritorio | Repetir conjuntos de corridas "con un clic"; llamar a Python vía `PROCESS` |
| **Venapp** (`.vcd`) | Interfaz de pantallas/botones construida con los mismos comandos | DSS para crear | Windows (principalmente) | Aplicaciones para usuarios finales sin tocar el modelo |
| **Vensim DLL** (`vendll32/64.dll`) | API C para cargar modelos, simular, leer/escribir valores desde otro programa | DSS (o runtime/redistribuible) | Windows | Acoplar con Python, Excel/VBA, C/C++, Java, SIG, optimizadores externos |
| **PySD** | Traduce el `.mdl` a Python y simula **sin Vensim** | Ninguna (MIT, `pip install pysd`) | Cualquiera | Análisis en Python, Monte Carlo, ML, despliegue en servidores Linux |
| **SDEverywhere** | Transpila `.mdl` a C/JS/WebAssembly | Ninguna (MIT, Node.js) | Cualquiera | Simuladores web de alto rendimiento (ver archivo 15) |
| **External functions** | Funciones definidas por el usuario en una DLL C que el modelo invoca | DSS + compilador C | Windows | Lógica que no cabe en ecuaciones Vensim |
| **"Agentic Vensim"** (servidor MCP local, 10.5) | Agentes de IA editan y ejecutan modelos en Vensim | DSS (según archivo 01) | Escritorio | Asistentes de IA operando Vensim real (verificar herramientas) |

Regla práctica: **si el usuario tiene Vensim DSS y necesita fidelidad exacta con Vensim** (optimizador, sensibilidad, Kalman, gaming, datasets `.vdf`), usar command scripts o la DLL. **Si necesita portabilidad o no tiene licencia**, usar PySD/SDEverywhere y validar contra una corrida de Vensim exportada.

---

## 2. Command scripts (`.cmd`)

### 2.1 Qué son y qué edición requieren

- Un *command script* (también "command file") es un **archivo de texto con extensión `.cmd`** que contiene **un comando por línea**. Los comandos son un **subconjunto de los comandos de Venapps** (misma sintaxis que usa la DLL en `vensim_command`).
- La documentación de Vensim los describe como ejecución "en modo batch" de **Vensim DSS** ("DSS only"). En versiones recientes algunas funciones de scripting podrían estar en otras ediciones **(verificar para la edición concreta)**.

### 2.2 Cómo se ejecutan

Según la documentación de Vensim ("Command Files"), un script se ejecuta:

1. Abriéndolo con **File>Open Model** (seleccionando el tipo `.cmd`).
2. Cargándolo en el **Text Editor** de Vensim y ejecutando **File>Run** desde el editor.
3. **Nombrando el archivo al invocar Vensim** desde la línea de comandos, p. ej.:

```bat
REM Windows: el nombre del ejecutable depende de edición y bits (verificar en la carpeta de instalación)
"C:\Program Files\Vensim\vendss64.exe" "C:\proyectos\teacup\lote.cmd"
```

4. Desde otro script/Venapp/DLL: `SPECIAL>RUNCOMMAND|archivo.cmd` **(categoría y sintaxis: verificar; existe la página "RUNCOMMAND" en la referencia)**.
5. Como comandos *pre/post* en el **Run configuration tool** (desde 9.4; DSS según el archivo 01).

Desde Python (lanzando Vensim como proceso; el `.cmd` debe terminar con `MENU>EXIT` para que el proceso finalice):

```python
import subprocess, pathlib
vensim_exe = r"C:\Program Files\Vensim\vendss64.exe"   # (verificar nombre/ruta)
script = pathlib.Path(r"C:\proyectos\teacup\lote.cmd")
subprocess.run([vensim_exe, str(script)], cwd=script.parent, check=True, timeout=3600)
```

### 2.3 Sintaxis

```text
CATEGORIA>COMANDO|arg1|arg2|...
```

- `CATEGORIA` ∈ `SPECIAL`, `SIMULATE`, `MENU`, `FILE`, `GAME`, `CUSTOM`, `WORKBENCH`, `SKETCH`, `SETTING`, `PRINT`, `EXPORT`… (algunas solo tienen sentido en Venapps).
- Los argumentos se separan con `|`. Las rutas relativas se resuelven respecto del directorio de trabajo (normalmente el del modelo o del script — **verificar** en cada contexto).
- En Venapps (y en botones) varios comandos se encadenan en una sola línea con `&`; en un `.cmd` se recomienda **uno por línea**.
- Un argumento que empieza por `?` hace que Vensim **pregunte** el valor al usuario (p. ej. `SIMULATE>READRUNCHG|?Enter name of scenario`), útil en Venapps, no en lotes desatendidos.
- El sufijo `|O` en `MENU>RUN|O` o `SIMULATE>RUNNAME|nombre|O` se usa para **sobrescribir el dataset sin preguntar** (convención usada por venpy y EMA Workbench; semántica exacta del modo de `RUNNAME`: verificar).

### 2.4 Catálogo de comandos por categoría

Leyenda: ✔ = confirmado en documentación de vensim.com (vía extractos de búsqueda) y/o en código real (venpy, EMA Workbench, Venapp World3); ◐ = nombre confirmado, argumentos/semántica a verificar.

#### SPECIAL>

| Comando | Estado | Uso |
|---|---|---|
| `SPECIAL>LOADMODEL\|archivo` | ✔ | Carga un modelo (`.mdl`, `.vmf`, `.vpm`, `.vpmx`…). Con la DLL, herramientas como EMA Workbench exigen `.vpm/.vpmx`. |
| `SPECIAL>NOINTERACTION\|n` | ✔ | `n=1` suprime mensajes Stop/Inform/Sí-No; se escriben en el log de errores (`vensim.err`) y se asume la respuesta por defecto. Con `n=1` cada comando ejecutado también se registra en `vensim.err`. `n=0` reactiva la interacción. |
| `SPECIAL>CLEARRUNS\|n` | ✔ | Descarga corridas cargadas después de la n-ésima (`CLEARRUNS\|3` quita la 4.ª, 5.ª…). Sin `n`, descarga todas. Evita que se acumulen datasets. |
| `SPECIAL>LOADRUN\|runname` | ✔ | Carga un dataset (`.vdf/.vdfx`) existente para análisis. |
| `SPECIAL>READCUSTOM\|archivo.vgd` | ✔ | Lee definiciones de gráficos personalizados (custom graphs). Visto en la Venapp de World3. |
| `SPECIAL>LOADTOOLSET\|archivo` | ◐ | Carga un *toolset* (conjunto de herramientas de análisis). |
| `SPECIAL>READINI\|archivo` | ◐ | Lee un archivo de configuración `.ini`. |
| `SPECIAL>SETWBITEM\|variable` | ✔ (Venapp) | Fija la *workbench variable* (variable seleccionada en el Control Panel). |
| `SPECIAL>VARSELECT\|título` | ✔ (Venapp) | Abre el diálogo para elegir variable. |
| `SPECIAL>SETTITLE\|...` | ✔ (Venapp) | Cambia el título de la ventana. |
| `SPECIAL>LOADAPPINT\|app.vcd@pantalla` | ◐ (Venapp) | Carga otra Venapp/pantalla (visto en World3). |
| `PROCESS\|<ejecutable>\|WAIT\|<argumentos>` | ◐ | **Nuevo (Vensim 10.1, según el archivo 01):** ejecuta un programa externo (p. ej. Python); con `WAIT` espera a que termine. Devuelve 1 si tuvo éxito (siempre 1 si no se espera). Disponible en Venapps y command scripts. Prefijo de categoría probable `SPECIAL>` (**verificar**). |
| `RUNCOMMAND\|archivo.cmd` | ◐ | Ejecuta otro command script (categoría: verificar). |

#### SIMULATE>

Configuran la **próxima** simulación (los cambios se aplican al lanzar `MENU>RUN…`).

| Comando | Estado | Uso |
|---|---|---|
| `SIMULATE>RUNNAME\|nombre\|modo` | ✔ | Nombre del dataset resultante (`nombre.vdf` o `nombre.vdfx`). |
| `SIMULATE>SETVAL\|var=valor` | ✔ | Cambia una constante (o una variable *gaming* durante un juego). Subíndices: `SIMULATE>SETVAL\|precio[Norte]=12`. Lookups: sintaxis de tabla `nombre((x1,y1),(x2,y2),...)` (**verificar**). |
| `SIMULATE>READCIN\|archivo.cin` | ✔ | Lee un archivo de cambios de constantes/lookups (formato `var = valor`, ver archivo 12). Reemplaza la lista de archivos de cambios. |
| `SIMULATE>ADDCIN\|archivo.cin` | ✔ | Añade otro `.cin` a los ya leídos (uso confirmado en el ejemplo oficial de `VensimOfficial/venpy`). |
| `SIMULATE>WRITECIN\|archivo.cin` | ◐ | Escribe los cambios actuales a un `.cin`. |
| `SIMULATE>DATA\|archivo(s).vdf` | ✔ | Datasets de datos (variables `DATA`) para la simulación. |
| `SIMULATE>ADDDATA\|archivo.vdf` | ✔ | Añade un dataset de datos a la lista. |
| `SIMULATE>SAVELIST\|archivo.lst` | ✔ | Lista de variables a guardar (reduce el tamaño del `.vdf`). |
| `SIMULATE>SENSITIVITY\|archivo.vsc` | ✔ | Archivo de control de sensibilidad (Monte Carlo). |
| `SIMULATE>SENSSAVELIST\|archivo.lst` | ✔ | Variables a guardar en la corrida de sensibilidad. |
| `SIMULATE>OPTPARM\|archivo.voc` | ✔ | Archivo de control de optimización/calibración. |
| `SIMULATE>PAYOFF\|archivo.vpd` | ✔ | Definición de *payoff*. |
| `SIMULATE>READRUNCHG\|runname` | ✔ | Toma los cambios usados en una corrida previa. |
| `SIMULATE>BASED\|runname` | ◐ | Basa la simulación en una corrida previa. |
| `SIMULATE>RESUME` | ◐ | Reanudar/continuar corrida. |
| `SIMULATE>KALMAN\|...` | ◐ | Control de filtrado de Kalman (DSS). |
| `SIMULATE>CHGFILE\|...`, `SIMULATE>MINMEN\|...` | ◐ | Listados como soportados; semántica no confirmada. |
| `SIMULATE>GETCNSTCHG`, `SIMULATE>GETTABCHG` | ✔ (Venapp) | Diálogos interactivos para cambiar constantes / tablas. |

#### MENU>

| Comando | Estado | Uso |
|---|---|---|
| `MENU>RUN\|O` | ✔ | Simulación normal. |
| `MENU>RUN1\|O` | ✔ | Igual, pero carga la corrida **primera** en la lista de corridas. |
| `MENU>RUN_SENSITIVITY\|O` | ✔ | Corrida de sensibilidad (requiere `SIMULATE>SENSITIVITY` y `SENSSAVELIST`). |
| `MENU>RUN_OPTIMIZE\|O` | ✔ | Optimización/calibración (requiere `OPTPARM`, `PAYOFF`). |
| `MENU>GAME\|O` | ✔ | Inicia una simulación en modo *gaming*. |
| `MENU>LOAD_RUN` | ✔ | Diálogo de carga/orden de corridas (interactivo). |
| `MENU>REDO_GRAPHS` | ✔ | Redibuja gráficos. |
| `MENU>EXIT` | ✔ | Cierra Vensim (imprescindible al final de un lote lanzado por línea de comandos). |
| `MENU>VDF2TAB\|vdf\|tabfile\|savelist\|opciones\|frecuencia\|inicio\|fin` | ✔ | Exporta dataset a texto delimitado por tabuladores. |
| `MENU>VDF2CSV\|vdf\|csvfile\|savelist\|opciones\|frecuencia\|inicio\|fin\|codepage` | ✔ | Igual en CSV. Opciones (juntas, sin `\|` entre ellas): `*` tiempo hacia abajo (filas), `!` suprime el eje de tiempo, `+` añade en vez de sobrescribir, `[` subíndices en columna/fila separada. `frecuencia` ≠ SAVEPER; `codepage` vacío ⇒ UTF‑8. |
| `MENU>VDF2DAT`, `MENU>VDF2DLIST`, `MENU>VDF2XLS`, `MENU>VDF2WK1` | ✔ | Otras exportaciones (DAT, lista, Excel, Lotus). |
| `MENU>VDF2TIDY\|vdf\|tabfile` | ✔ | Exporta en formato *tidy* (largo). |
| `MENU>SENS2FILE\|vdf\|outfile\|opciones` | ◐ | Exporta resultados de sensibilidad; opciones: `L` lista relacional, `T` *tidy*, `E` formato numérico europeo, `*` índice de simulación hacia abajo, `!` sin cabecera, `+` añadir, `:texto` columna extra (`!` dentro = nombre de corrida). Prefijo `MENU>`: verificar. |
| `MENU>SENS2TAB` | ◐ | Exportación de sensibilidad (antigua). |
| `MENU>TAB2VDF`, `MENU>DAT2VDF`, `MENU>XLS2VDF`, `MENU>WK12VDF` | ✔ | Importan datos a `.vdf`. |

#### FILE>

| Comando | Estado | Uso |
|---|---|---|
| `FILE>MDL2VMF\|archivo` / `FILE>VMF2MDL\|archivo` | ✔ | Convierte entre texto `.mdl` y binario `.vmf`. |
| `FILE>VCD2VCF\|archivo` / `FILE>VGD2VGF\|archivo` | ✔ | Compila Venapp / custom graphs a binario. |
| `FILE>PUBLISH\|frmfile` | ✔ | Publica el modelo (paquete `.vpm/.vpmx`) usando la configuración guardada (formato de `frmfile`: verificar). |
| `FILE>COPY`, `FILE>CREATE`, `FILE>DELETE`, `FILE>RENAME` | ✔ | Operaciones de archivos. |
| `FILE>ENCRYPT`, `FILE>DECRYPT` | ◐ | Cifrado/descifrado de archivos (detalles: verificar). |

#### GAME> (gaming)

| Comando | Estado | Uso |
|---|---|---|
| `GAME>GAMEINTERVAL\|n` | ✔ | Intervalo (en unidades de tiempo) que avanza cada paso del juego. |
| `GAME>GAMEON` | ✔ | Avanza un intervalo. |
| `GAME>ENDGAME` | ✔ | Termina el juego (la corrida queda guardada). |
| `GAME>BACKUP` | ◐ | Retroceder (verificar). |

Secuencia confirmada (venpy): `SIMULATE>RUNNAME|r` → `MENU>GAME|O` → `GAME>GAMEINTERVAL|k` → (repetir: `SIMULATE>SETVAL|var_gaming=v` + `GAME>GAMEON`) → `GAME>ENDGAME`. Solo las variables definidas con `GAME()` (tipo *Gaming*) pueden cambiarse durante el juego.

#### Categorías de Venapp / herramientas (también usables en algunos scripts)

- `CUSTOM>nombre_grafico` — muestra un custom graph cargado con `READCUSTOM`.
- `WORKBENCH>herramienta` — p. ej. `WORKBENCH>CAUSES TREE` (herramientas de análisis sobre la workbench variable).
- `SKETCH>CHOOSEVIEW|SK1|...`, `SKETCH>NEXTVIEW|SK1`, `SKETCH>PREVVIEW|SK1`, `SKETCH>ZOOM|SK1|100`.
- `PRINT>id`, `EXPORT>id` — imprimir/exportar un objeto de la pantalla.
- `SETTING>SHOWWARNING|0` — visto en World3 (suprime avisos; verificar).

### 2.5 Ejemplos completos

#### a) Lote de escenarios con exportación a CSV

`escenarios.cmd` (un comando por línea; comentarios: no hay sintaxis de comentario confirmada para `.cmd` → **no incluir comentarios en el archivo real**):

```text
SPECIAL>NOINTERACTION|1
SPECIAL>LOADMODEL|teacup.mdl
SPECIAL>CLEARRUNS
SIMULATE>RUNNAME|base|O
MENU>RUN|O
SIMULATE>SETVAL|Room Temperature=20
SIMULATE>RUNNAME|frio|O
MENU>RUN|O
SIMULATE>READCIN|calido.cin
SIMULATE>RUNNAME|calido|O
MENU>RUN|O
MENU>VDF2CSV|base.vdfx|base.csv|salida.lst
MENU>VDF2CSV|frio.vdfx|frio.csv|salida.lst
MENU>VDF2CSV|calido.vdfx|calido.csv|salida.lst
MENU>EXIT
```

`calido.cin`:

```text
Room Temperature = 90
Characteristic Time = 12
```

`salida.lst` (una variable por línea):

```text
Teacup Temperature
Heat Loss to Room
```

Notas:
- Vensim de 64 bits escribe por defecto `.vdfx`; el de 32 bits `.vdf` (EMA Workbench usa `Current.vdfx` vs `Current.vdf`). Ajustar la extensión en `VDF2CSV`.
- Los cambios hechos con `SETVAL`/`READCIN` se aplican a la **siguiente** simulación; en la interfaz, Vensim borra los cambios de constantes tras simular, por lo que hay que repetirlos para cada corrida (comportamiento en scripts: **verificar**, pero repetirlos explícitamente es siempre seguro).
- Usar `CLEARRUNS` en lotes largos para no saturar memoria.

#### b) Sensibilidad Monte Carlo y exportación

```text
SPECIAL>NOINTERACTION|1
SPECIAL>LOADMODEL|epidemia.vpmx
SIMULATE>RUNNAME|sens1|O
SIMULATE>SENSITIVITY|incertidumbre.vsc
SIMULATE>SENSSAVELIST|clave.lst
MENU>RUN_SENSITIVITY|O
MENU>SENS2FILE|sens1.vdfx|sens1.tab|T
MENU>EXIT
```

`incertidumbre.vsc` (formato real tomado de un ejemplo oficial; cabecera = nº de simulaciones, método M=multivariante, semilla, …):

```text
100,M,1234,,0
R0=RANDOM_TRIANGULAR(2.2,5,2.5,3.5,4.5)
Log10 Fatality Rate=RANDOM_NORMAL(-3,-1,-2.3,0.3)
```

#### c) Optimización / calibración

```text
SPECIAL>NOINTERACTION|1
SPECIAL>LOADMODEL|modelo.mdl
SIMULATE>DATA|historico.vdfx
SIMULATE>PAYOFF|ajuste.vpd
SIMULATE>OPTPARM|calib.voc
SIMULATE>RUNNAME|calib|O
MENU>RUN_OPTIMIZE|O
MENU>EXIT
```

Tras la optimización Vensim deja los parámetros óptimos en `calib.out` (formato tipo `.cin`, reutilizable con `READCIN`), el progreso en `calib.log` y, si se pidió, el informe de payoff en `calib.rep`. Formatos de `.voc/.vpd/.vsc` y opciones (MCMC, Kalman): `10-analisis-avanzado-sensibilidad-optimizacion.md`.

### 2.6 Buenas prácticas y errores típicos

- **Siempre** `SPECIAL>NOINTERACTION|1` al inicio de lotes desatendidos; revisar `vensim.err` al terminar.
- Nombres de variables **exactamente** como en el modelo (Vensim no distingue mayúsculas/minúsculas, pero sí espacios y subíndices).
- Rutas con espacios: funcionan como argumento (separador es `|`), pero evite `|` en nombres de archivo.
- Terminar con `MENU>EXIT` cuando el script se lanza desde la línea de comandos/Python.
- Si un comando falla en la DLL, `vensim_command` devuelve 0: en scripts, revisar el log.
- Para corridas muy largas o muchos escenarios, considerar `SAVELIST` para reducir el `.vdf`.

---

## 3. Vensim DLL

### 3.1 Variantes, instalación y licencia

- La DLL **se distribuye con Vensim DSS** y permite controlar modelos desde Visual Basic, C/C++, Delphi, Excel, herramientas multimedia, Python, etc.
- Archivos (según documentación y wrappers):
  - `vendll32.dll` / `vendll32.lib`: DLL completa de 32 bits (también la disponible con el **Vensim Application Runtime**).
  - `vdpdll32.dll`: DLL de **doble precisión** (32 bits; Vensim DP = `vensimdp.exe`).
  - `vendll64.dll`: DLL de **64 bits** (la que cargan venpy y EMA Workbench con Python de 64 bits).
  - DLL **multicontexto** para servidor (p. ej. `vendlstc64`, con `VensimContextAdd`/`VensimContextDrop`, citado en el foro de Ventana) — **verificar**.
- La instalación de DSS ofrece instalar los archivos de soporte de la DLL (cabecera `vendll.h`, ejemplos) en el subdirectorio `DLL` de Vensim; la DLL en sí se instala en `system32` (o `SysWOW64` para 32 bits en Windows de 64). EMA Workbench sugiere buscarla también en `..\AppData\Local\Vensim\`.
- **No renombrar la DLL ni mover/renombrar Vensim** tras instalarla: la DLL dejaría de funcionar.
- `vensim_get_info(1, …)` informa el tipo de DLL: **Minimal, Silent, Full o Redist**.
- La "bitness" de Python/Excel debe coincidir con la de la DLL (Python 64 bits ⇒ `vendll64.dll`).

### 3.2 Funciones y firmas

Prototipos C (macro `VEFCC` = convención de llamada definida en `vendll.h`; en Win32 es `__stdcall`, por eso en Python se usa `ctypes.WinDLL`/`windll` — **verificar** en la cabecera instalada).

| Función | Firma (C) | Propósito |
|---|---|---|
| `vensim_command` | `int vensim_command(char *command)` | Ejecuta un comando (`SPECIAL>…`, `SIMULATE>…`, `MENU>…`). 1 = éxito, 0 = fallo. Solo para comandos sin salida visual. |
| `vensim_tool_command` | `int vensim_tool_command(char *command, HWND window, int aswiptool)` | Como el anterior pero para comandos que crean/copian/imprimen salidas visuales (gráficos, tablas). Tipos de `window`/`aswiptool`: verificar. |
| `vensim_be_quiet` | `int vensim_be_quiet(int quietflag)` | 0 = interacción normal; 1 = sin ventanas de progreso; 2 = además sin diálogos interrogativos. Devuelve `quietflag`. Sin efecto en la DLL mínima. |
| `vensim_check_status` | `int vensim_check_status(void)` | Estado de Vensim (ver §3.3). |
| `vensim_get_val` | `int vensim_get_val(const char *varname, float *varval)` | Valor actual de una variable (durante simulación, juego o preparación). Fuera de simulación puede devolver el valor NA `-1.298074214633707e33`. |
| `vensim_get_dpval` | `int vensim_get_dpval(const char *varname, double *varval)` | Igual en doble precisión (DLL DP). |
| `vensim_get_data` | `int vensim_get_data(char *filename, char *varname, char *tname, float *vval, float *tval, int maxn)` | Serie de una variable desde un dataset. `varname` totalmente subindicado; `tname` normalmente `"Time"`; si `maxn == 0` devuelve el tamaño necesario; `filename` NULL/vacío ⇒ resultados de **SyntheSim** sin guardar. Devuelve nº de puntos (0 = no encontrado). |
| `vensim_get_varnames` | `int vensim_get_varnames(const char *filter, int vartype, char *buf, int maxbuflen)` | Nombres de variables que cumplen `filter` (`"*"` = todas) y `vartype`. `buf` = cadenas terminadas en `\0` con doble `\0` final. Devuelve tamaño necesario (‑1 = error). `buf` NULL o `maxbuflen` 0 ⇒ solo tamaño. |
| `vensim_get_varattrib` | `int vensim_get_varattrib(const char *varname, int attrib, char *buf, int maxbuflen)` | Atributos de una variable (unidades, comentario, ecuación, causas, usos, subíndices…; ver §3.3). |
| `vensim_get_info` | `int vensim_get_info(int infowanted, char *buf, int maxbuflen)` | Información de Vensim/modelo cargado (1 = tipo de DLL, 2 = versión; constantes `INFO_*` en `vendll.h`). |
| `vensim_get_substring` | `int vensim_get_substring(char *fullstring, int frompos, char *buf, int maxbuflen)` | Utilidad para recorrer buffers multi-cadena (firma: verificar). |
| `vensim_get_varoff` | `int vensim_get_varoff(const char *varname)` | Offset de una variable para lecturas vectoriales rápidas. |
| `vensim_get_vecvals` | `int vensim_get_vecvals(int *vecoff, float *vals, int nvals)` | Lee varios valores de una vez con los offsets de `get_varoff`. |
| `vensim_get_dpvecvals` | `int vensim_get_dpvecvals(int *vecoff, double *dpvals, int veclen)` | Igual en doble precisión. |
| `vensim_get_sens_at_time` | `int vensim_get_sens_at_time(const char *filename, const char *varname, const char *timename, const float *attime, float *vals, int maxn)` | Valores de todas las simulaciones de una corrida de sensibilidad en un instante. Devuelve 0 si la corrida no existe/no es de sensibilidad o la variable no se guardó. |
| `vensim_start_simulation` | `int vensim_start_simulation(int loadfirst, int game, int overwrite)` | Inicia simulación por tramos: `loadfirst=1` ⇒ cargar primera (como `RUN1`); `game` 0 normal / 1 nuevo juego / 2 continuar juego; `overwrite=1` ⇒ no preguntar al sobrescribir. 0 = fallo. |
| `vensim_continue_simulation` | `int vensim_continue_simulation(int num_inter)` | Avanza `num_inter` pasos de TIME STEP. 1 = queda más; 0 = terminó (llamar a `finish`); ‑1 = error de coma flotante (según EMA). |
| `vensim_finish_simulation` | `int vensim_finish_simulation(void)` | Cierra la simulación iniciada con `start`. |
| `vensim_synthesim_vals` | `int vensim_synthesim_vals(int offset, float *tval, float *varval)` | Acceso a valores mientras **SyntheSim** está activo (memoria gestionada por Vensim; firma: verificar). |
| `vensim_show_sketch` | `int vensim_show_sketch(int sketchnum, int wantscroll, int zoompercent, HWND pwindow)` | Muestra un diagrama del modelo en una ventana (firma: verificar). |
| `vensim_set_parent_window` | `int vensim_set_parent_window(HWND window, int r1, int r2)` | Ventana propietaria de diálogos/mensajes de Vensim (firma: verificar). |
| `VensimContextAdd` / `VensimContextDrop` | `int VensimContextAdd(int wantcleanup)` / `int VensimContextDrop(int context)` | Solo DLL multicontexto/servidor (verificar). |

### 3.3 Códigos y valores de retorno

**`vensim_get_varnames` – `vartype`**

| Código | Tipo |
|---|---|
| 0 | Todas |
| 1 | Levels (stocks) |
| 2 | Auxiliary |
| 3 | Data |
| 4 | Initial |
| 5 | Constant |
| 6 | Lookup |
| 7 | Group |
| 8 | Subscript Ranges |
| 9 | Constraint (Reality Check) |
| 10 | Test Input |
| 11 | Time Base |
| 12 | Gaming |
| 13 | Subscript Constants |

**`vensim_get_varattrib` – `attrib`** (tabla de la DSS Reference reproducida en EMA Workbench):

| Código | Atributo |
|---|---|
| 1 | Units |
| 2 | Comment |
| 3 | Equation |
| 4 | Causes |
| 5 | Uses |
| 6 | Initial causes only |
| 7 | Active causes only |
| 8 | Subíndices que tiene la variable |
| 9 | Todas las combinaciones de esos subíndices (venpy lo usa para expandir arrays; devuelve tamaño 2 si es escalar) |
| 10 | Combinación de subíndices que usaría una herramienta de gráfico |
| 11 | Mínimo (fijado en el editor de ecuaciones) |
| 12 | Máximo |
| 13 | Rango (incremento) |
| 14 | Tipo de variable (texto, p. ej. "Level") |
| 15 | Grupo principal |

**`vensim_check_status`**: 0 = inactivo (normal); 1 = simulación activa (entre `start_simulation` y `finish_simulation`); 2 = en simulación pero no activa (probable bloqueo). Se suma 16 si SyntheSim está activo y `SETVAL` no dispara simulaciones; 32 si SyntheSim está activo y `SETVAL` sí las dispara. Otros valores indican error.

**Valor NA de Vensim**: `-1.298074E+33` (`:NA:`); venpy lo detecta en `get_val` para avisar "no se puede leer fuera de simulación".

### 3.4 Python + ctypes (ejemplo completo)

> Código **probado en Linux contra una biblioteca *mock* que imita la API** (misma firma de funciones) para validar la lógica de ctypes y de buffers; **no probado contra la DLL real de Vensim** (requiere Windows + DSS).

```python
"""vensim_dll.py — envoltorio mínimo de la DLL de Vensim DSS con ctypes."""
import ctypes, struct, sys

class VensimError(RuntimeError):
    pass

class VensimDLL:
    def __init__(self, path=None, stdcall=None):
        if path is None:   # Python 64 bits -> vendll64.dll; 32 bits -> vendll32.dll
            path = "vendll64.dll" if struct.calcsize("P") == 8 else "vendll32.dll"
        if stdcall is None:
            stdcall = sys.platform == "win32"
        loader = ctypes.WinDLL if stdcall else ctypes.CDLL
        self.dll = d = loader(path)   # si no la encuentra: ruta absoluta a la DLL
        c_int, c_char_p, c_float, P = ctypes.c_int, ctypes.c_char_p, ctypes.c_float, ctypes.POINTER
        sig = {
            "vensim_command":             ([c_char_p], c_int),
            "vensim_be_quiet":            ([c_int], c_int),
            "vensim_check_status":        ([], c_int),
            "vensim_get_val":             ([c_char_p, P(c_float)], c_int),
            "vensim_get_data":            ([c_char_p, c_char_p, c_char_p, P(c_float), P(c_float), c_int], c_int),
            "vensim_get_varnames":        ([c_char_p, c_int, c_char_p, c_int], c_int),
            "vensim_get_varattrib":       ([c_char_p, c_int, c_char_p, c_int], c_int),
            "vensim_get_info":            ([c_int, c_char_p, c_int], c_int),
            "vensim_start_simulation":    ([c_int, c_int, c_int], c_int),
            "vensim_continue_simulation": ([c_int], c_int),
            "vensim_finish_simulation":   ([], c_int),
        }
        for name, (args, res) in sig.items():
            f = getattr(d, name)
            f.argtypes, f.restype = args, res

    @staticmethod
    def _b(s):  # Vensim moderno usa UTF-8 en nombres (verificar en versiones antiguas)
        return s if isinstance(s, bytes) else s.encode("utf-8")

    @staticmethod
    def _split(buf):  # 'a\0b\0\0' -> ['a', 'b']
        return [x.decode("utf-8", "replace") for x in buf.raw.split(b"\0") if x]

    def _strlist(self, func, *args):
        n = func(*args, None, 0)          # 1.ª llamada: tamaño necesario
        if n < 0:
            raise VensimError(f"{func.__name__} devolvió {n}")
        buf = ctypes.create_string_buffer(n + 2)
        func(*args, buf, n + 2)
        return self._split(buf)

    def command(self, cmd):
        if not self.dll.vensim_command(self._b(cmd)):
            raise VensimError(f"Falló el comando: {cmd}")

    def be_quiet(self, flag=2):            return self.dll.vensim_be_quiet(flag)
    def varnames(self, filt="*", vartype=0): return self._strlist(self.dll.vensim_get_varnames, self._b(filt), vartype)
    def varattrib(self, var, attrib):      return self._strlist(self.dll.vensim_get_varattrib, self._b(var), attrib)
    def info(self, what):                  return self._strlist(self.dll.vensim_get_info, what)

    def get_val(self, var):
        v = ctypes.c_float()
        if not self.dll.vensim_get_val(self._b(var), ctypes.byref(v)):
            raise VensimError(f"No se pudo leer {var}")
        return v.value

    def get_data(self, run, var, tname="Time"):
        f = self.dll.vensim_get_data
        n = f(self._b(run), self._b(var), self._b(tname), None, None, 0)
        if n <= 0:
            raise VensimError(f"{var} no está en {run}")
        vv, tv = (ctypes.c_float * n)(), (ctypes.c_float * n)()
        got = f(self._b(run), self._b(var), self._b(tname), vv, tv, n)
        return list(tv[:got]), list(vv[:got])
```

Uso típico (lote de escenarios → pandas):

```python
import pandas as pd
from vensim_dll import VensimDLL

vd = VensimDLL()                                  # Windows + Vensim DSS 64 bits
vd.be_quiet(2)
vd.command("SPECIAL>LOADMODEL|C:/modelos/teacup.vpmx")   # use / o \\ en rutas
print(vd.info(2))                                 # versión de Vensim
print(vd.varnames("*", 1))                        # stocks
print(vd.varattrib("Room Temperature", 1))        # unidades

series = {}
for nombre, temp in {"frio": 20, "base": 70, "calido": 90}.items():
    vd.command(f"SIMULATE>SETVAL|Room Temperature={temp}")
    vd.command(f"SIMULATE>RUNNAME|{nombre}|O")
    vd.command("MENU>RUN|O")
    t, v = vd.get_data(nombre, "Teacup Temperature")   # venpy pasa el nombre de corrida;
    series[nombre] = pd.Series(v, index=t)              # EMA pasa el archivo (p. ej. "frio.vdfx")
df = pd.DataFrame(series)
df.to_csv("escenarios_vensim.csv")
```

### 3.5 Simulación por tramos y *gaming*

Dos mecanismos:

```python
# (1) start/continue/finish: progreso controlado por el programa
d = vd.dll
vd.command("SIMULATE>RUNNAME|paso|O")
if not d.vensim_start_simulation(1, 0, 1):      # loadfirst=1, game=0, overwrite=1
    raise RuntimeError("no arrancó")
while d.vensim_continue_simulation(10) == 1:    # 10 pasos de TIME STEP por llamada
    print("t =", vd.get_val("Time"))            # leer estado intermedio
d.vensim_finish_simulation()

# (2) modo GAME: cambiar variables GAME() entre intervalos (patrón de venpy)
vd.command("SIMULATE>RUNNAME|juego1|O")
vd.command("MENU>GAME|O")
vd.command("GAME>GAMEINTERVAL|1")
t, tf = vd.get_val("INITIAL TIME"), vd.get_val("FINAL TIME")
while t < tf:
    decision = 0.5 * vd.get_val("Inventory")     # política externa (p. ej. un modelo Python)
    vd.command(f"SIMULATE>SETVAL|Order Rate={decision}")   # 'Order Rate' definida con GAME(...)
    vd.command("GAME>GAMEON")
    t += 1
vd.command("GAME>ENDGAME")
```

### 3.6 VBA / Excel

Declaraciones para Office de 64 bits (no probadas aquí; `Declare` en VBA usa `stdcall`, compatible con `VEFCC`):

```vba
Private Declare PtrSafe Function vensim_command Lib "vendll64.dll" (ByVal cmd As String) As Long
Private Declare PtrSafe Function vensim_be_quiet Lib "vendll64.dll" (ByVal quietflag As Long) As Long
Private Declare PtrSafe Function vensim_get_val Lib "vendll64.dll" (ByVal varname As String, ByRef varval As Single) As Long
Private Declare PtrSafe Function vensim_get_data Lib "vendll64.dll" (ByVal filename As String, ByVal varname As String, _
    ByVal tname As String, ByRef vval As Single, ByRef tval As Single, ByVal maxn As Long) As Long

Sub CorrerEscenario()
    Dim n As Long, i As Long, v() As Single, t() As Single
    vensim_be_quiet 2
    If vensim_command("SPECIAL>LOADMODEL|C:\modelos\teacup.vpmx") = 0 Then MsgBox "No cargó": Exit Sub
    vensim_command "SIMULATE>SETVAL|Room Temperature=" & Range("B1").Value
    vensim_command "SIMULATE>RUNNAME|excel|O"
    vensim_command "MENU>RUN|O"
    ReDim v(0 To 999): ReDim t(0 To 999)
    n = vensim_get_data("excel", "Teacup Temperature", "Time", v(0), t(0), 1000)
    For i = 0 To n - 1
        Cells(i + 3, 1).Value = t(i): Cells(i + 3, 2).Value = v(i)
    Next i
End Sub
```

- Las cadenas VBA `ByVal As String` se pasan como ANSI: nombres con caracteres no ASCII pueden fallar (**verificar**).
- La documentación de Vensim incluye un "DLL Visual Basic example" y la DSS trae ejemplos de Excel en la carpeta de la DLL (**verificar** nombres de archivo).

### 3.7 C / C++

```c
/* Compilar enlazando con vendll32.lib / vendll64.lib (incluido con DSS). No probado aquí. */
#include <stdio.h>
#include "vendll.h"

int main(void) {
    float vval[2000], tval[2000];
    vensim_be_quiet(2);
    if (!vensim_command("SPECIAL>LOADMODEL|teacup.vpmx")) return 1;
    vensim_command("SIMULATE>SETVAL|Room Temperature=20");
    vensim_command("SIMULATE>RUNNAME|c_run|O");
    vensim_command("MENU>RUN|O");
    int n = vensim_get_data("c_run", "Teacup Temperature", "Time", vval, tval, 2000);
    for (int i = 0; i < n; i++) printf("%g\t%g\n", tval[i], vval[i]);
    return 0;
}
```

### 3.8 Otros lenguajes y la DLL multicontexto

- **Java**: la documentación tiene una sección "DLL Java" (interfaz vía JNI/clase envoltorio; detalles: verificar).
- **Delphi, multimedia authoring tools**: soportados por ser una DLL estándar de Windows.
- **R**: vía `reticulate` + Python, o paquetes que traducen el modelo (`readsdr`, ver archivo 15).
- **Multicontexto / servidor**: permite varios modelos simultáneos en un proceso (`VensimContextAdd/Drop`); hilos del foro de Ventana reportan problemas al soltar contextos desde Python → probar a fondo.
- **macOS**: la DLL es tecnología Windows; en macOS la automatización se hace con command scripts/Venapps o con PySD/SDEverywhere (soporte de DLL en Mac: **verificar**).

---

## 4. Python

### 4.1 Mapa de opciones

| Herramienta | Necesita Vensim | Lee | Puntos fuertes | Limitaciones |
|---|---|---|---|---|
| **PySD** (`pip install pysd`) | No | `.mdl` (texto), XMILE (`.xmile/.stmx`) | Ejecuta en cualquier SO; pandas/xarray; stepping; CLI | No todas las funciones de Vensim; no lee `.vmf/.vpm/.vdf`; sin optimizador/sensibilidad propios (se hace en Python) |
| **venpy** (GitHub `VensimOfficial/venpy`, fork de `pbreach/venpy`) | Sí, DSS + DLL, Windows | `.vpm/.vpmx` vía DLL | Fidelidad 100 % con Vensim; sensibilidad de Vensim; gaming | Solo Windows; bitness; no está en PyPI con ese nombre |
| **EMA Workbench** (`pip install ema_workbench`) | Conector Vensim: sí (DLL). Conector PySD: no | `.vpm/.vpmx` o `.mdl` vía PySD | Análisis exploratorio, escenarios, MORDM, paralelismo | Conector Vensim solo Windows |
| **pysimlin** (`pip install pysimlin`) | No | `.mdl`, XMILE, **`.vdf` (lectura)** | Lee datasets de Vensim sin Vensim; análisis de dominancia de bucles | Motor propio (diferencias posibles); macOS ARM64/Linux |
| **SDEverywhere** (Node.js) | No | `.mdl`, `.stmx` | C/JS/Wasm muy rápidos; QA | No es Python (ver archivo 15) |
| **ctypes directo** | Sí, DSS | — | Control total de la DLL | Hay que escribir el envoltorio (§3.4) |

> ⚠️ **No confundir**: el paquete `venpy` de **PyPI** (v0.2.3, "Python utilities that Venky likes") **no tiene relación con Vensim**. El envoltorio de Vensim se instala desde GitHub (`pip install git+https://github.com/VensimOfficial/venpy`). No existe un paquete `vensim` ni `pyvensim` en PyPI (comprobado oct‑2026).

### 4.2 PySD (traducción .mdl → Python)

PySD (SDXorg, licencia MIT) traduce modelos de Vensim y XMILE a módulos Python y los simula con su propio motor (integración Euler). Versión en PyPI: **3.14.3**; la rama de desarrollo (3.15, no publicada) añade un *backend* experimental a Julia (`pysd.translate_to_julia()`, ModelingToolkit/OrdinaryDiffEq).

Instalación y carga:

```python
# pip install pysd            (opcionales: netCDF4 para .nc, openpyxl para GET XLS/DIRECT)
import pysd
model = pysd.read_vensim("teacup.mdl")   # crea teacup.py junto al .mdl y lo carga
# Firmas (PySD 3.14.3):
# read_vensim(mdl_file, data_files=None, data_files_encoding=None, initialize=True,
#             missing_values='warning', split_views=False, encoding=None, **kwargs)
# read_xmile(xmile_file, data_files=None, data_files_encoding=None, initialize=True, missing_values='warning')
# load(py_model_file, ...)   -> carga un .py ya traducido (más rápido)
model = pysd.load("teacup.py")
```

Documentación y metadatos:

```python
model.doc          # DataFrame: Real Name, Py Name, Subscripts, Units, Limits, Type, Subtype, Comment
model.get_coords("Room Temperature")   # None si es escalar; (coords, dims) si tiene subíndices
model.get_args("Room Temperature")     # [] ; para lookups ['x']
model["Teacup Temperature"]            # valor actual
model.time()                           # tiempo actual
```

`run()` (firma 3.14.3):

```python
model.run(params=None, return_columns=None, return_timestamps=None,
          initial_condition='original', final_time=None, time_step=None, saveper=None,
          reload=False, progress=False, flatten_output=True, cache_output=True, output_file=None)
```

Ejemplos **probados** con `test-models/samples/teacup/teacup.mdl`:

```python
import pysd, pandas as pd, numpy as np

model = pysd.read_vensim("teacup.mdl")

# 1) Corrida base con columnas seleccionadas (índice = tiempo)
base = model.run(return_columns=["Teacup Temperature", "Heat Loss to Room"])
base.iloc[-1]          # Teacup Temperature 75.374001 en t=30

# 2) Parámetro constante y serie temporal (interpolación lineal)
model.run(params={"Room Temperature": 20})
temp = pd.Series(index=range(31), data=range(20, 82, 2))
model.run(params={"Room Temperature": temp})   # avisa: constante reemplazada por serie

# 3) Condición inicial y tiempos de retorno
model.run(initial_condition=(0, {"Teacup Temperature": 33}),
          return_columns=["Teacup Temperature"], return_timestamps=[0, 10, 20, 30])

# 4) Cambiar componentes sin correr y redefinir control de tiempo
model.reload()                                  # ¡los params persisten entre run()!
model.set_components({"Characteristic Time": 5})   # acepta nombre original o py-name
model.run(final_time=10, time_step=0.25, saveper=1)

# 5) Guardar a archivo (.csv, .tab o .nc)
model.run(output_file="resultados.tab")
```

Lote de escenarios y Monte Carlo (equivalente a `SETVAL`+`RUN` / `RUN_SENSITIVITY`; probado):

```python
model = pysd.load("teacup.py")
escenarios = {"frio": {"Room Temperature": 10}, "base": {}, "calido": {"Room Temperature": 90}}
res = {}
for nombre, p in escenarios.items():
    model.reload()
    res[nombre] = model.run(params=p, return_columns=["Teacup Temperature"])["Teacup Temperature"]
pd.DataFrame(res).to_csv("escenarios.csv")

rng = np.random.default_rng(1)
finales = []
for ct in rng.uniform(5, 15, 200):
    model.reload()
    finales.append(model.run(params={"Characteristic Time": ct},
                             return_columns=["Teacup Temperature"],
                             return_timestamps=[30]).iloc[0, 0])
np.percentile(finales, [5, 50, 95])
```

Stepping / acoplamiento con otros modelos (probado):

```python
from pysd.py_backend.output import ModelOutput
model.reload()
out = ModelOutput()
model.set_stepper(out, step_vars=["room_temperature"], final_time=5)
for _ in range(40):                                   # 40 pasos de TIME STEP (0.125)
    model.step(1, {"room_temperature": model["room_temperature"] + 1})
df = out.collect(model)
```

Reemplazar una ecuación por una función Python (p. ej. un modelo de ML):

```python
def nueva_perdida():
    return 0.1 * (model.components.teacup_temperature() - model.components.room_temperature())
model.set_components({"heat_loss_to_room": nueva_perdida})
```

Otras capacidades:
- Datos externos: `model.run(data_files="datos.tab")` (solo `.tab`/`.csv`; variables `DATA` sin ecuación); `GET XLS/DIRECT DATA/CONSTANTS/LOOKUPS/SUBSCRIPT` se leen de Excel/CSV.
- Vistas a módulos: `read_vensim("m.mdl", split_views=True, subview_sep=["."])`.
- Estado final → inicial: `model.export("estado.pic")` y `run(initial_condition="estado.pic")`.
- Submodelos: `select_submodel(...)`, `get_dependencies(...)`.
- Externos serializados: `serialize_externals(...)` / `initialize_external_data("parametros.nc")` (PySD ≥ 3.8).

CLI (probado):

```bash
python -m pysd -o salida.csv -F 20 -r 'Teacup Temperature, Heat Loss to Room' \
    teacup.mdl 'Room Temperature'=25 'Teacup Temperature':150
# -o archivo (.csv/.tab/.nc)  -p progreso  -t/--translate solo traducir
# -I/-F/-T/-S tiempos de control   -R 'tiempos'   -D 'archivos de datos'
# var=valor (cambia valor)   var:valor (cambia valor inicial de un stock)
# --split-views --subview-sep . -e/-i exportar/importar estado (pickle)
```

Limitaciones verificadas (PySD 3.14.3):
- Funciones no implementadas se traducen como `not_implemented_function(...)` y **fallan al simular** (`NotImplementedError`). Comprobado con `LOOKUP EXTRAPOLATE`, `LOOKUP FORWARD`, `DELAY CONVEYOR`, `RANDOM POISSON`.
- Sí soporta (tablas de la doc): ABS, MIN/MAX, SQRT, EXP, LN, LOG, trigonométricas, INVERT MATRIX, ELMCOUNT, INTEGER, QUANTUM, MODULO, IF THEN ELSE, XIDZ, ZIDZ, VMIN/VMAX/SUM/PROD, PULSE, PULSE TRAIN, RAMP, STEP, GET TIME VALUE, VECTOR SELECT/RANK/REORDER/SORT ORDER, GAME (como paso directo), ALLOCATE AVAILABLE, ALLOCATE BY PRIORITY, INITIAL, ACTIVE INITIAL, SAMPLE IF TRUE, RANDOM 0 1/UNIFORM/NORMAL/EXPONENTIAL, DELAY1(I)/DELAY3(I)/DELAY N/DELAY FIXED, SMOOTH(I)/SMOOTH3(I)/SMOOTH N, FORECAST, TREND, GET XLS/DIRECT *, macros (`:MACRO:` comprobado) y subíndices (mapeos, `:EXCEPT:`, subrangos).
- Solo integración tipo Euler; números aleatorios no reproducen la secuencia de Vensim.
- Necesita el `.mdl` en texto (convertir `.vmf` con `FILE>VMF2MDL` o File>Save As).

### 4.3 venpy (envoltorio de la DLL)

`VensimOfficial/venpy` (fork mantenido por Ventana — último commit de Tom Fiddaman, 2022) sobre `pbreach/venpy`:

```python
import venpy                                   # instalado desde GitHub
model = venpy.load("modelo.vpmx")              # por defecto dll='vendll64.dll'
model["Room Temperature"] = 20                 # -> SIMULATE>SETVAL
model.run(runname="frio")                      # RUNNAME + MENU>RUN|o (be_quiet(1) salvo debug=True)
df = model.result(names=["Teacup Temperature"])   # DataFrame indexado por Time

# Sensibilidad con los archivos de Vensim:
model.run(runname="sens", sensitivity=("control.vsc", "save.lst"))
dfs = model.result(names=["Total Deaths"], sensitivitytime=365)   # una fila por simulación

# Gaming: asignar una función a una variable GAME(); se evalúa cada 'interval'
model["Order Rate"] = lambda: 0.5 * model["Inventory"]
model.run(runname="juego", interval=1)
```

Limitaciones (README): solo Windows; bitness de Python = de la DLL; solo constantes (antes de simular) y variables *Gaming* (durante) se pueden fijar.

### 4.4 EMA Workbench

TU Delft (Jan Kwakkel), `pip install ema_workbench` (2.5.3). Conector `ema_workbench.connectors.vensim` (DLL, **requiere Vensim DSS y Windows**; modelo `.vpm`/`.vpmx`, resultados `Current.vdfx` en 64 bits) y conector `pysd_connector` (sin Vensim).

```python
from ema_workbench import RealParameter, TimeSeriesOutcome, perform_experiments
from ema_workbench.connectors.vensim import VensimModel

m = VensimModel("teacup", wd=r"C:\modelos", model_file="teacup.vpmx")
m.uncertainties = [RealParameter("Room Temperature", 10, 90),
                   RealParameter("Characteristic Time", 5, 15)]
m.outcomes = [TimeSeriesOutcome("Teacup Temperature")]
experiments, outcomes = perform_experiments(m, 200)
```

(API de alto nivel según documentación de EMA; no ejecutado aquí — requiere Windows/DSS.)

### 4.5 Integración "nativa" en Vensim 10

Lo confirmado en vensim.com:
- **Run configuration tool** (introducido en 9.4 según las notas de versión del archivo 01; DSS): guarda conjuntos de instrucciones para correr el modelo varias veces y ejecutar todas o algunas configuraciones con un clic; admite **comandos pre/post simulación** para exportar/importar datos "o ejecutar cosas como Python para procesar resultados".
- **Comando `PROCESS|<ejecutable>|WAIT|<argumentos>`** (Venapps y command scripts): lanza p. ej. `python.exe` con un script, esperando a que termine si se indica `WAIT`.

```text
SIMULATE>RUNNAME|base|O
MENU>RUN|O
MENU>VDF2CSV|base.vdfx|base.csv|
SPECIAL>PROCESS|C:\Python312\python.exe|WAIT|analiza.py base.csv
```
(prefijo `SPECIAL>` de PROCESS: verificar.)

- **Exportación a WebAssembly** (Vensim 10.x): la documentación incluye pasos "Install the Emscripten SDK", "Create files for hosting on a server" (con un `webserver.py` de prueba usando el servidor HTTP de Python), "API" y "Limitations and common problems" → Vensim puede compilar modelos para la web (edición/versión exactas: **verificar**).
- **Servidor HTTP integrado (10.4, DSS)** para probar publicaciones web, y **"Agentic Vensim" (10.5, jun‑2026, DSS)**: servidor **MCP local** que permite a agentes de IA **editar y ejecutar modelos** (información recogida en `01-productos-licencias-versiones.md`; API/herramientas expuestas: **verificar**). Es la vía más directa para que un asistente de IA opere Vensim real.
- No se encontró evidencia de un **intérprete Python embebido** ni de un paquete oficial `pip install vensim` (oct‑2026). La vía oficial Python↔Vensim sigue siendo la DLL (venpy) y los comandos `PROCESS`/run configurations; para agentes de IA, el servidor MCP de 10.5.

### 4.6 Leer `.vdf` sin Vensim: pysimlin

`pysimlin` (Simlin, Apache‑2.0) incluye un lector del formato binario **no documentado** de Vensim, obtenido por ingeniería inversa:

```python
import simlin                                  # pip install pysimlin  (Python ≥ 3.11)
df = simlin.load_vdf("SCEN01.VDF")             # DataFrame (tiempo × variables), probado con World3
m = simlin.load("teacup.mdl"); run = m.run()   # también simula .mdl/XMILE con su motor
run.results["teacup_temperature"].iloc[-1]     # 75.374 (igual a Vensim)
```

Los nombres internos de SMOOTH/DELAY aparecen como columnas tipo `#DL<SMOOTH3(...)#`.

---

## 5. Venapps

- **Qué son**: aplicaciones (pantallas, botones, menús, entradas de valores, gráficos) construidas sobre un modelo con **Vensim DSS**, para usuarios que no deben editar el modelo.
- **Archivo**: `.vcd` (texto, *Vensim Custom Description*); se compila a `.vcf` (binario) con `FILE>VCD2VCF`. Publicada, una Venapp se distribuye como `.vpa`, que **Model Reader** puede ejecutar (según `01-productos-licencias-versiones.md`; verificar).
- **Ejecución**: abriendo el `.vcd/.vcf` desde Vensim (DSS) o con el runtime de aplicaciones de Vensim (**verificar** mecanismo exacto en cada versión); `SPECIAL>LOADAPPINT|app.vcd@pantalla` salta entre apps.
- **Estructura real** (extracto de la Venapp de World3‑03, © Ventana Systems):

```text
! comentario
:SCREEN WELCOME
SCREENFONT,Times New Roman|12||0-0-0|-1--1--1
PIXELPOS,0
COMMAND,"",0,0,0,0,,,SPECIAL>LOADMODEL|wrld3-03.vmf
COMMAND,"",0,0,0,0,,,SPECIAL>READCUSTOM|wrld3-03.vgd
TEXTONLY,"World3-03 Explorer",0,10,100,,C||24|B|255-0-0,,"",
ANYKEY,"",0,0,0,0,0,,,MAIN
:SCREEN MAIN
BUTTON,"Run a scenario",50,26,35,5,C,Rr,"",BASED
TOOL,"SP1",0,50,100,45,,,CUSTOM>COMM1
:SCREEN BASED
TEXTMENU,"2 - Scenario 2 = ...",5,20,0,0,L,2,SIMULATE>READCIN|W303S02&SIMULATE>RUNNAME|scen02,RUN
:SCREEN RUN
MODRUNNAME,"",55,15,20,0,L,
MODVAR,"initial nonrenewable resources|Descripción",5,15,15,0,L
MODTABLE,"crowding multiplier from industry table|Descripción",5,29,15,5,L
:SCREEN GRAPH1
WIPTOOL,"GR1",10,10,80,80,,,CUSTOM>WIP_STATE_OF_WORLD
COMMAND,"",0,0,0,0,,,SPECIAL>CLEARRUNS|7&MENU>RUN1|O
BUTTON,"Print",20,95,20,0,L,Pp,PRINT>GR1
```

  - `:SCREEN nombre` abre una pantalla; `!` comenta; una línea que termina en `\` continúa en la siguiente.
  - Objetos observados: `SCREENFONT`, `PIXELPOS`, `COMMAND` (se ejecuta al entrar), `TEXTONLY`, `RECTANGLE`, `BUTTON`, `TEXTMENU`, `ANYKEY`, `TOOL`, `WIPTOOL` (salida que se actualiza durante la simulación), `SKETCH`, `MODRUNNAME`, `MODVAR`, `MODTABLE`, `PROMPT`, `WBVAR`.
  - Campos típicos de `BUTTON`: `"texto",x,y,ancho,alto,justificación,teclas_rápidas,comandos(&),pantalla_siguiente` (posiciones en % de pantalla salvo `PIXELPOS`; detalle: verificar).
- Para interfaces modernas, muchos usuarios prefieren hoy **SyntheSim + Control Panel**, publicar a Model Reader, o webs con SDEverywhere/WebAssembly.

---

## 6. Distribución: Publish, Model Reader, `.vpm/.vpmx`, contraseñas

- **File>Publish** (con el modelo en primer plano) crea un **packaged model** `.vpm` (o `.vpmx` en versiones recientes/64 bits): binario que contiene el modelo y archivos de soporte (datasets, custom graphs, Venapps…). La publicación controla **qué puede ver** el destinatario (p. ej. ocultar ecuaciones/estructura) — opciones exactas: verificar en la versión. Equivalente por comando: `FILE>PUBLISH|frmfile`.
- **Vensim Model Reader**: aplicación **gratuita**, de solo lectura, para ejecutar y analizar modelos publicados **sin comprar Vensim**; puede copiarse libremente junto con el modelo. Lee paquetes `.vpm` (y `.vpmx` en versiones recientes) y modelos binarios `.vmf`. Similar a PLE pero **sin herramientas de sketch ni posibilidad de cambiar/guardar el modelo**.
- La DLL y herramientas como EMA Workbench trabajan con `.vpm/.vpmx`.
- **Protección**: pestaña **Info/Password** de Model Settings permite establecer contraseña del modelo (alcance exacto — ver/editar — verificar); los paquetes publicados son binarios no documentados (cabecera observada `CD DE 3D 5A` en `.vpm` y `.vpmx`). Comandos `FILE>ENCRYPT/DECRYPT` existen (verificar uso).
- Alternativas de distribución: XMILE para otros programas (archivo 12), simuladores web (SDEverywhere, exportación WebAssembly de Vensim 10), o `.mdl` abierto con PySD.

---

## 7. Funciones externas (DLL de usuario) vs. macros

| | `:MACRO:` | External functions |
|---|---|---|
| Dónde se define | En el propio `.mdl`, con ecuaciones Vensim | En una DLL Windows compilada (C/C++ u otro lenguaje que genere DLL con tipos C) |
| Edición | Pro/DSS (PLE y PLE Plus no definen macros; ver `01-productos-licencias-versiones.md` y `04-lenguaje-de-ecuaciones.md` §10.2; verificar para Pro) | DSS |
| Portabilidad | Viaja con el modelo; PySD las soporta (SDEverywhere no: hay que reescribirlas) | Solo donde esté la DLL; PySD/SDE no las ejecutan |
| Uso típico | Reutilizar estructura (p. ej. un retraso a medida, un stock con lógica) | Algoritmos externos, librerías numéricas, acceso a sistemas |

Macro (sintaxis real, de `test-models`):

```text
:MACRO: EXPRESSION MACRO(input, parameter)
EXPRESSION MACRO = INTEG(input, parameter)
	~	input
	~	tests basic macro containing a stock but no output
	|

:END OF MACRO:
```
Varias salidas: `:MACRO: NOMBRE(entradas : salidas_adicionales)`; se invoca `x = NOMBRE(a, b : y2)`.

External functions (DSS):
- Al cargar la librería, Vensim llama a **`version_info`** (exportada; devuelve `int` con la versión) y a **`user_definition`** para obtener la lista de funciones y sus atributos (argumentos, vectores, lookups…).
- Durante la simulación, cada llamada del modelo pasa por **`vensim_external`** en la DLL, que convierte argumentos y llama a la función.
- Hay rutinas de arranque/terminación y *callbacks* (p. ej. un puntero `get_val` del tipo `int (VEFCC *get_val)(const char *name, float *val)`) — detalles en "Startup and Terminate Routines" (verificar).
- Ejemplos de partida: `venext.c` y `venext.def` (archivo de definición para el *linker*).
- Se configuran como "External Function Library" (en Options; ubicación exacta del ajuste: verificar) y existen notas específicas para usarlas con la DLL, Venapps y **simulaciones compiladas** (DSS puede compilar el modelo a C para acelerar; requiere compilador — verificar).

---

## 8. Excel y otros intercambios de datos

- **Funciones en ecuaciones** (ver archivo de funciones): `GET XLS DATA/CONSTANTS/LOOKUPS/SUBSCRIPT` (usan Excel instalado; Windows) y `GET DIRECT DATA/CONSTANTS/LOOKUPS/SUBSCRIPT` (leen `.xlsx/.csv/.tab` directamente, multiplataforma). Alias de archivo `?nombre` resueltos en la sección de settings del `.mdl` (`30:?inputs.xlsx=inputs.xlsx`).
- **`GET VDF DATA/CONSTANTS/LOOKUPS`**: leen valores desde otro dataset `.vdf`.
- **Importar/exportar datasets**: menú de importación de datos (`.xls/.tab/.dat` → `.vdf`) y **Model>Export Dataset** (`.vdf` → `.tab/.csv/.xls/.dat`); por comando: `XLS2VDF`, `TAB2VDF`, `DAT2VDF`, `VDF2TAB`, `VDF2CSV`, `VDF2XLS`, `VDF2DAT`, `VDF2TIDY`.
- **DLL desde Excel/VBA** (§3.6) para "modelo dentro de la hoja".
- **DDE**: mecanismo histórico de Windows; considerarlo obsoleto y preferir DLL o `GET DIRECT` (soporte actual: verificar).
- **Otros lenguajes**: C/C++/Delphi/Java por la DLL; R vía Python o traductores; JavaScript vía SDEverywhere; Julia vía PySD (backend experimental) o `Vensim2MTK`.

---

## 9. Guía rápida de decisión

- "Quiero correr 50 escenarios y tener CSV" → **command script** (§2.5a) o PySD (§4.2) si el modelo usa funciones soportadas.
- "Quiero optimizar/calibrar con el optimizador de Vensim desde Python" → DLL (venpy/ctypes) + `OPTPARM/PAYOFF` + `RUN_OPTIMIZE`.
- "Quiero acoplar Vensim con un modelo Python paso a paso" → DLL `start/continue/finish` o modo GAME; sin licencia DSS → PySD `set_stepper/step`.
- "Quiero leer `.vdf` en Linux" → `pysimlin.load_vdf`; alternativa: exportar con `VDF2CSV`.
- "Quiero distribuir el modelo a gente sin Vensim" → Publish + **Model Reader**; web → SDEverywhere o exportación Wasm de Vensim 10.
- "Quiero lógica en C dentro del modelo" → External functions (DSS).

---

## 10. Lista de puntos (verificar)

1. Edición mínima para command scripts en Vensim 10 (documentación: DSS).
2. Nombre del ejecutable de Vensim para línea de comandos (`vendss64.exe`, `vensim.exe`…).
3. Prefijo de categoría de `PROCESS` y `RUNCOMMAND`.
4. Semántica del `modo` en `SIMULATE>RUNNAME|nombre|modo` y si `SETVAL` persiste entre corridas en scripts.
5. Comandos ◐ de la tabla (BASED, RESUME, KALMAN, CHGFILE, MINMEN, WRITECIN, ENCRYPT/DECRYPT, LOADTOOLSET, READINI, GAME>BACKUP).
6. Firmas de `vensim_tool_command`, `vensim_get_substring`, `vensim_show_sketch`, `vensim_set_parent_window`, `vensim_synthesim_vals`; convención `VEFCC`.
7. Nombre de la DLL multicontexto y su API.
8. Opciones exactas de File>Publish y alcance de la contraseña (Info/Password).
9. Edición/versión que incluye la exportación a WebAssembly.
10. Herramientas expuestas por el servidor MCP "Agentic Vensim" (10.5) y requisitos de edición.

---

## 11. Fuentes

**Documentación de Vensim (vía extractos de búsqueda; vensim.com bloqueado para descarga directa):**
- Command Files: https://vensim.com/documentation/25670.html · Command Scripts: http://vensim.com/documentation/dss_command.html · Supported Commands: https://www.vensim.com/documentation/ref_cmd_supported.html · Command Descriptions: http://vensim.com/documentation/5_command_descriptions.html · Venapp Command Use Summary: http://vensim.com/documentation/ref_cmd_table.html · Examples: https://www.vensim.com/documentation/25710.html
- Comandos: RUNNAME https://www.vensim.com/documentation/25350.html · LOADRUN https://www.vensim.com/documentation/25455.html · LOADMODEL https://www.vensim.com/documentation/25450.html · NOINTERACTION https://www.vensim.com/documentation/25470.html · CLEARRUNS https://www.vensim.com/documentation/25425.html · RUNCOMMAND https://vensim.com/documentation/25487.html · PROCESS https://vensim.com/documentation/25435_2.html · SENSITIVITY https://www.vensim.com/documentation/25360.html · SAVELIST https://www.vensim.com/documentation/25355.html · SETVAL https://www.vensim.com/documentation/25370.html · ADDDATA https://vensim.com/documentation/25290.html · VDF2CSV https://vensim.com/documentation/vdf2csv.html · VDF2TAB https://www.vensim.com/documentation/vdf2tab.html · VDF2DLIST https://www.vensim.com/documentation/vdf2dlist.html · VDF2TIDY https://www.vensim.com/documentation/vdf2tidy.html · SENS2FILE https://www.vensim.com/documentation/sens2file.html · GAME https://www.vensim.com/documentation/25140.html · FILE>PUBLISH https://www.vensim.com/documentation/25033.html · MDL2VMF https://www.vensim.com/documentation/25030.html · VMF2MDL https://www.vensim.com/documentation/25050.html
- DLL: https://www.vensim.com/documentation/dss_dll.html · Available DLL Functions https://www.vensim.com/documentation/dll_function_synopsis.html · vensim_command https://www.vensim.com/documentation/26170.html · vensim_tool_command https://www.vensim.com/documentation/26255.html · vensim_check_status https://www.vensim.com/documentation/26165.html · vensim_be_quiet https://www.vensim.com/documentation/26160.html · vensim_start_simulation https://www.vensim.com/documentation/26250.html · vensim_continue_simulation https://www.vensim.com/documentation/26175.html · vensim_get_info https://www.vensim.com/documentation/26200.html · vensim_get_varnames https://www.vensim.com/documentation/26225.html · vensim_get_data http://vensim.com/documentation/vensim_get_data.html · vensim_get_sens_at_time https://www.vensim.com/documentation/26205.html · vensim_get_vecvals https://www.vensim.com/documentation/26235.html · Installation Notes https://www.vensim.com/documentation/26045.html · DLL Visual Basic example https://www.vensim.com/documentation/26075.html · DLL Java http://vensim.com/documentation/26140.html · DLL Venapp and Command Changes http://vensim.com/documentation/dll_venapp_and_command_changes.html
- External functions: https://www.vensim.com/documentation/25720.html · https://www.vensim.com/documentation/25725.html · https://www.vensim.com/documentation/25830.html · https://www.vensim.com/documentation/25840.html · https://www.vensim.com/documentation/25845.html · http://vensim.com/documentation/external_compiled.html · https://www.vensim.com/documentation/25745.html · https://www.vensim.com/documentation/25750.html · https://www.vensim.com/documentation/25825.html
- Publicación / Model Reader: https://vensim.com/vensim-model-reader/ · https://www.vensim.com/documentation/vensim_model_reader.html · https://www.vensim.com/documentation/usr19_saving_to_a_binary_file.html · https://www.vensim.com/documentation/ug_publishing.html · Info/Password http://vensim.com/documentation/22170.html
- Vensim 10: https://vensim.com/documentation/vensim-10.html · https://vensim.com/documentation/vensim-10_0_1.html · https://vensim.com/documentation/vensim-10_2_0.html · https://vensim.com/documentation/vensim-10_3.html · Run configuration tool https://www.vensim.com/documentation/run-configuration-tool.html · Emscripten https://vensim.com/documentation/1_-install-the-emscripten-sdk_.html · Hosting https://www.vensim.com/documentation/4_-create-files-for-hosting-on.html · API https://www.vensim.com/documentation/api.html · Limitations https://www.vensim.com/documentation/limitations.html · Workbench/Python tools https://vensim.com/workbench/
- Foro de Ventana: https://www.ventanasystems.co.uk/forum/viewtopic.php?t=7797 · https://www.ventanasystems.co.uk/forum/viewtopic.php?t=8375

**Código y repositorios inspeccionados localmente:**
- `VensimOfficial/venpy` (git clone, `venpy/venpy.py`, `SDMconsequence/` con `.vsc`, `.lst`, `.cin`, `.vpmx` reales) y `pbreach/venpy`.
- `ema_workbench` 2.5.3 (PyPI): `connectors/vensimDLLwrapper.py`, `connectors/vensim.py` (tablas de `vartype`/`attrib`, comandos usados).
- PySD 3.14.3 (PyPI) y repo `pysd/docs/*.rst`; ejemplos ejecutados con `test-models/samples/teacup/teacup.mdl`.
- `simlin/test/metasd/WRLD3-03/WRLD3-03.VCD` (Venapp real), `.VGD`, `.CIN`, `SCEN01.VDF`; `pysimlin` 0.8.5 (`load_vdf` probado).
- Mock C de la API de la DLL (no incluido) para validar el envoltorio ctypes.
- PyPI: `venpy` 0.2.3 (paquete no relacionado), ausencia de `vensim`/`pyvensim`.
