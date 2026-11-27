# Regla 24 · Análisis interno de toda cotización (regla fija, 27-nov-2026)

**Por qué existe.** El 27-nov-2026, el análisis interno de la 26-039 no mostraba el costo frente a lo cobrado, ni el margen, ni la ganancia del proyecto. Las cifras estaban escritas dentro de frases. Ninguna cotización vuelve a salir así. Esta regla dice qué debe traer siempre el análisis interno y cómo se verifica antes de enviar nada.

**Cómo se cumple.** El análisis se genera con `cotizaciones/analisis_interno.py`, que aplica todas las reglas de abajo. El script se niega a escribir el archivo si falta un dato o si una verificación falla. Prohibido armar el análisis interno a mano o copiarlo de otra cotización.

## Las reglas

1. **Toda cotización y toda versión lleva su análisis interno.** Va en Google Sheets, en la carpeta «2 · Interno — no enviar» de la cotización, con el título `<código> <versión> · Análisis interno · NO COMPARTIR`.
2. **Sin análisis aprobado no se envía nada.** La hoja cliente no se comparte ni se envía hasta que el análisis pase todas sus verificaciones (sección 10 en ✓).
3. **El bloque 1, «Resumen del negocio», es obligatorio.** Lleva una columna por opción y estas filas, en este orden:
   1. Precio de lista sin IVA.
   2. Descuento en porcentaje y en valor.
   3. Precio cobrado al cliente sin IVA, que es el ingreso de merahki.
   4. IVA y total con IVA.
   5. Capa 1: producción a tarifa freelance (DI, AV, MM y DEV).
   6. Capa 2: dirección y gerencia a costo real (DIR y PM).
   7. Jornadas de estudio.
   8. Terceros.
   9. Costo real del proyecto.
   10. Utilidad bruta y margen bruto real.
   11. Costos variables (comisión, ICA y GMF).
   12. Ganancia del proyecto y margen de contribución.
   13. Contribución en caja.
   14. Costo del modelo y margen sobre él.
4. **Las cifras van como números en celdas y las derivadas como fórmulas.** Prohibido escribir cifras clave dentro de frases, por ejemplo «COP 20,454,780 · 52,7 %». Todo cálculo debe poder auditarse y recalcularse en Google Sheets.
5. **El IVA nunca es ingreso ni margen.** El precio se calcula sin IVA y el IVA se suma encima. Los márgenes se calculan sobre el precio cobrado sin IVA.
6. **El costo es el costo real del modelo de dos capas.**
   - Capa 1: producción a tarifa freelance.
   - Capa 2: dirección y gerencia a lo que hoy cuestan.
   - Jornadas de estudio.
   - Terceros a su precio.

   El costo del modelo, a tarifa de lista, aparece solo como referencia de la lista. Las tarifas salen de la hoja Tarifas del modelo vigente, nunca de memoria.
7. **Tabla de costo por perfil.** Muestra horas × costo real por hora, con fórmulas. Su total debe ser igual al costo real del bloque 1.
8. **Tabla de costo por producto.** Muestra cuánto cuesta cada producto y su precio implícito, que es el reparto interno del precio cobrado según el costo. Su total debe ser igual al costo real y al precio cobrado. El precio implícito nunca va a la hoja cliente (regla 15).
9. **Banda de precio.** Muestra la lista, el competitivo y el piso de cada opción (regla 23), dónde queda el precio cobrado y su colchón sobre el piso.
10. **Semáforo.** Cada opción se compara con cuatro umbrales:
    - Margen bruto real de 40 % o más: es el piso y debajo no se firma.
    - Margen de contribución de 40 % o más.
    - Margen bruto real de 55 % o más: si no se cumple, la baja necesita motivo escrito.
    - Precio cobrado igual o mayor que el piso de la banda.
11. **Sensibilidad.** Muestra el margen y la ganancia con horas reales +10 %, +20 % y +30 %, y el sobrecosto de horas que aguanta el proyecto antes de quedar bajo el piso.
12. **Caja.** Muestra:
    - lo que sale por el proyecto (capa 1, terceros y variables);
    - las retenciones;
    - lo que entra y cuándo entra (regla 14);
    - la necesidad máxima de caja antes de cobrar.
13. **Decisiones, flags y supuestos.**
    - Cada descuento o excepción lleva autor, fecha y su registro en `⚙️ Meta/Decisions`.
    - Cada supuesto lleva su fuente.
    - Los flags dicen qué puede salir mal y qué falta decidir.
14. **Verificaciones automáticas.** El script no entrega el análisis si alguna falla:
    - capa 1 + capa 2 + estudio + terceros = costo real;
    - costo por perfil = costo por producto;
    - margen real igual o mayor que el piso, o una excepción escrita de David;
    - banda coherente: lista ≥ competitivo ≥ piso;
    - descuento con decisión escrita;
    - hoja cliente sin valores por producto (regla 15);
    - el valor final de la hoja cliente es igual al total del análisis.
15. **Las opciones van todas en el mismo análisis.** Llevan las mismas filas y una línea que explica la diferencia entre ellas, por ejemplo el impacto de las simulaciones en el precio.
16. **Cada versión nueva regenera el análisis.** La versión anterior se renombra `[REEMPLAZADA]` y se mueve a la carpeta interna.
17. **El reporte al usuario trae siempre estas cifras por opción:** precio cobrado sin IVA, costo real, utilidad bruta con su porcentaje y ganancia del proyecto con su porcentaje. Un reporte de cotización sin esas cifras está incompleto.

## Cómo se usa

```bash
python cotizaciones/analisis_interno.py escenario.json salida.xlsx --cliente hoja_cliente.xlsx
```

- `escenario.json` sigue la plantilla `cotizaciones/escenario_plantilla.json`: opciones, líneas con horas por perfil, jornadas, terceros, descuento, decisiones, flags y supuestos.
- Las tarifas se copian de la hoja Tarifas del modelo vigente. La plantilla las trae vacías a propósito, y el script no corre hasta que estén.
- Con `--cliente`, la hoja interna se agrega al libro de la propuesta y el script revisa la hoja cliente.
- Si David fija el precio por margen («baja el margen a 25 %»), se usa `margen_objetivo` en la opción en vez de `descuento_pct`. Bajo el piso del 40 %, el escenario debe traer `excepcion_piso` con autor y fecha, o el script no escribe el análisis.
- La salida se sube a Drive como Google Sheets en «2 · Interno — no enviar».
- Los escenarios con costos reales no se suben al repositorio. Viven en la carpeta interna de la cotización.

## Dónde más debe vivir esta regla

Esta regla se escribió en `daily-sessions` porque esta sesión no tenía acceso al vault ni a `claude-skills`. Para que rija en todas las cotizaciones, también debe estar en dos lugares más:

- **`vault-david/CLAUDE.md`, como regla 24**, con este texto: «Análisis interno de toda cotización (regla fija, 2026-11-27). Ninguna cotización se comparte sin su análisis interno en Google Sheets generado con `cotizaciones/analisis_interno.py` (o `/cfo` cuando lo adopte), con las verificaciones en ✓. El análisis muestra por opción: precio de lista, descuento, precio cobrado sin IVA, costo real por capa, utilidad bruta y margen, variables, ganancia del proyecto y margen de contribución, contribución en caja, banda y semáforo, costo por perfil y por producto, sensibilidad de horas y caja. Cifras como números y fórmulas, nunca dentro de frases. Detalle: `daily-sessions/cotizaciones/REGLAS_ANALISIS_INTERNO.md`.»
- **`claude-skills/cfo/SKILL.md`:** que el paso final de `/cfo` llame a este generador, o que reproduzca sus 10 secciones y sus verificaciones.
