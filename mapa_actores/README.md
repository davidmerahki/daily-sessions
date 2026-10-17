# Mapa de actores: sincronización con HubSpot

El [Mapa de actores merahki × POK](https://claude.ai/artifact/QBcF7LRqi5fQhaqnJb42ab) muestra las instituciones y empresas contactadas, quién las lleva y qué negocios tienen. Todos sus datos viven en la página, en `const D = {...};`. HubSpot es la fuente de verdad.

`sincronizar.py` pone al día esa foto con lo que cambió en HubSpot después de descargarla, sin regenerar el mapa desde cero:
- **Negocios:** etapa, monto, fecha de cierre, dueño y prioridad.
- **Tareas:** las completadas, las que cambiaron de fecha y su texto.
- **Registros nuevos:** instituciones, personas, negocios, notas, correos, reuniones y tareas.
- **Recálculos:** estado de cada institución, calor, conteos y cifras de pipeline del panel de control.

```bash
# 1. Comprobar que las reglas del script reproducen la foto actual
python mapa_actores/sincronizar.py mapa.html --verificar --hubspot CARPETA

# 2. Sincronizar y escribir la página nueva con el código vigente del mapa
python mapa_actores/sincronizar.py mapa.html --hubspot CARPETA --delta delta.json \
    --hoy 2026-10-17 --descargado "2026-10-17 11:30" -o mapa_nuevo.html \
    --plantilla mapa_actores/plantilla.html
```

`plantilla.html` es la página del mapa sin datos (`const D = {};`): el código que se publica. Los cambios de diseño se hacen ahí y se publican en la siguiente sincronización.

El docstring del script describe `CARPETA` (lo descargado de HubSpot) y `delta.json` (qué registros entran y con quién se asocian). Ninguno de los dos va al repositorio, porque tienen datos personales de contactos. Se guardan en el scratchpad de la sesión.

## Reglas del mapa

`--verificar` las comprueba contra la foto. Con la del 16-oct-2026 reprodujo exactamente:
- el estado y los negocios por línea de 438 instituciones;
- el calor de 1.663 instituciones y personas;
- las cifras de pipeline del panel.

| Campo | Regla |
|---|---|
| Estado de la institución | **Cliente** si tiene un negocio ganado. **En negociación** si tiene uno abierto en etapa 2 o más. **Prospección** si solo tiene abiertos en etapa 1 o negocios para retomar. Si no, **solo contacto** |
| Negocios de una institución | Solo los asociados a su empresa en HubSpot. Los asociados solo a un contacto aparecen en la ficha de la persona, no en la institución |
| Calor | Activo si el último contacto fue hace 30 días o menos, tibio entre 31 y 90 días y frío desde 91 días. Se cuenta desde la fecha de descarga |
| Pipeline del panel | Negocios abiertos en etapa 2 o más de los pipelines comerciales (POK Colombia, POK México, POK España y merahki Colombia), estén o no en el mapa, más los del mapa en otros pipelines. El ponderado usa la probabilidad de la etapa. El pronóstico del trimestre suma lo ya ganado |
| Grupos del panel | merahki, POK y otros (PMI y alianzas; antes del 17-oct-2026 también los negocios mixtos y sin línea) |
| Línea del negocio | Sale del pipeline. Desde el 17-oct-2026 cada línea tiene sus pipelines: POK Colombia, POK México, POK España y merahki Colombia. Ya no hay negocios mixtos. En los demás pipelines (PMI, alianzas) se conserva la del mapa |
| Canal | Un negocio asociado a dos empresas, una con la etiqueta «Canal», aparece en las dos instituciones: en el canal con su cliente final y en el cliente con «llega por». Ejemplo: Fundación Ábacos × Uniandes |
| Textos | Sin HTML y cortados en palabra completa: 130 caracteres, 150 en notas. Los números de 7 cifras o más se tapan con «[número]» |

## Vista por línea

El selector **Línea** (Todas, POK, merahki) cambia todo el mapa:
- El estado de cada institución, sus negocios y su responsable se calculan solo con los negocios de esa línea.
- Las instituciones sin negocios de esa línea quedan como «solo contacto».
- El panel de control pasa a la misma línea.

La vista elegida se recuerda en el navegador de cada persona.

## Límites

- **Cifras de actividad del panel** (toques, reuniones, propuestas del mes, ritmo): se conservan las de la foto, que muestran su propia fecha. Recalcularlas exige todas las actividades del día en HubSpot.
- **Listas truncadas:** el mapa guarda las 5 acciones y 8 pendientes más recientes de cada institución (3 por persona). Si se completa una tarea visible, la lista se acorta en uno: la siguiente tarea oculta no se conoce. Los conteos sí quedan bien.
- **Instituciones o personas que entran al mapa:** se agregan por el delta, con los campos que el generador deduce (país, ciudad, unidad, nivel) escritos a mano.
