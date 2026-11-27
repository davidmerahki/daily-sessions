---
name: analisis-interno
description: Regla 24 de merahki.ai. Úsalo siempre que armes, ajustes, recotices o revises una cotización o propuesta económica de merahki.ai (hoja «Propuesta Comercial», «Análisis Interno», precio, descuento, margen, banda de precio, /cfo). Genera el análisis interno con costo real frente a lo cobrado, margen, ganancia del proyecto, banda, semáforo, sensibilidad y caja, y bloquea el envío si algo no cuadra.
---

# Análisis interno de cotizaciones (regla 24)

Toda cotización de merahki.ai lleva su análisis interno en Google Sheets. Sin ese análisis, con todas sus verificaciones en ✓, la hoja cliente no se comparte ni se envía. Las reglas completas están en `cotizaciones/REGLAS_ANALISIS_INTERNO.md`. Léelas antes de empezar.

## Pasos obligatorios

1. **Escenario.** Copia `cotizaciones/escenario_plantilla.json` a la carpeta de trabajo, nunca al repositorio. Llénalo con:
   - las líneas y horas por perfil;
   - las jornadas y los terceros;
   - el descuento;
   - las decisiones, flags y supuestos.

   Las tarifas reales y las del modelo salen de la hoja Tarifas del modelo financiero vigente. Las jornadas, los márgenes y la capa 2 salen de la hoja Supuestos. Nunca uses tarifas de memoria.
2. **Generación.** Corre el generador:
   ```bash
   python cotizaciones/analisis_interno.py escenario.json salida.xlsx --cliente hoja_cliente.xlsx
   ```
   Si una verificación falla, corrige el escenario o la hoja cliente y vuelve a correr. No edites el resultado a mano para que pase.
3. **Revisión visual.** Renderiza la hoja con LibreOffice y confirma tres cosas: que las fórmulas calculan, que el costo real del resumen es igual al total por perfil y que el valor final es el mismo de la hoja cliente.
4. **Drive.** Sube el libro convertido a Google Sheets a «2 · Interno — no enviar». El título es `<código> <versión> · Análisis interno · NO COMPARTIR`. La versión anterior se renombra `[REEMPLAZADA]` y se mueve a la carpeta interna.
5. **Reporte.** En la respuesta al usuario, da por cada opción:
   - el precio cobrado sin IVA;
   - el costo real;
   - la utilidad bruta con su porcentaje;
   - la ganancia del proyecto con su porcentaje;
   - la posición en la banda.

   Señala también cualquier semáforo en ✗ y las excepciones pendientes de registrar.

## Lo que nunca se hace

- Cifras clave escritas dentro de frases en vez de celdas.
- Contar el IVA como ingreso o como margen.
- Dar el costo del modelo como si fuera el costo real.
- Enviar la hoja cliente sin el análisis en ✓.
- Poner valores por producto en la hoja cliente (regla 15).
- Aplicar descuentos sin una decisión escrita de David.
