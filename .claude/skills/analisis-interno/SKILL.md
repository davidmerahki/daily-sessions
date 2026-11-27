---
name: analisis-interno
description: Reglas 24 y 25 de merahki.ai. Úsalo siempre que armes, ajustes, recotices o revises una cotización o propuesta económica de merahki.ai (solicitud de un cliente, estimación de horas, hoja «Propuesta Comercial», «Análisis Interno», precio, descuento, margen, banda de precio, /cfo). Primero hace las preguntas de alcance (el contenido lo pone el cliente, merahki no lo escribe), después genera el análisis interno con costo real frente a lo cobrado, margen, ganancia del proyecto, banda, semáforo, sensibilidad y caja, y bloquea el envío si algo no cuadra.
---

# Cotizaciones de merahki.ai: alcance y análisis interno (reglas 24 y 25)

Toda cotización de merahki.ai lleva su análisis interno en Google Sheets. Sin ese análisis, con todas sus verificaciones en ✓, la hoja cliente no se comparte ni se envía. Las reglas completas están en `cotizaciones/REGLAS_ANALISIS_INTERNO.md`. Léelas antes de empezar.

**merahki.ai no escribe el contenido (regla 25).** El cliente entrega textos, conocimiento, guiones, materiales y preguntas. merahki.ai hace learning design y diseño instruccional sobre ese material, y después lo produce y lo virtualiza. Nunca estimes horas de autoría por defecto.

## Pasos obligatorios

0. **Preguntas de alcance, antes de cualquier hora o precio.**
   1. Corre `python cotizaciones/analisis_interno.py --preguntas`, o lee `cotizaciones/PREGUNTAS_ANTES_DE_COTIZAR.md`.
   2. Responde con la solicitud del cliente todo lo que puedas, citando la fuente.
   3. Pregúntale a David, en un solo mensaje y en lista, lo que la solicitud no responda. Empieza siempre por quién entrega el contenido, los guiones y las preguntas, por el experto temático y por quién aparece en los videos. Ofrece redactarle esas preguntas al cliente.
   4. No sigas al paso 1 hasta tener respuesta, o hasta que David diga qué asumir. Lo asumido va con `"supuesto": true` y la fuente dice quién lo autorizó.
   5. Si la solicitud pide «construcción de contenidos», cotízala como adaptación didáctica del material del cliente y confírmalo. Nunca asumas que merahki escribe.
1. **Escenario.** Copia `cotizaciones/escenario_plantilla.json` a la carpeta de trabajo, nunca al repositorio. Llénalo con:
   - el bloque `intake` con las respuestas del paso 0;
   - las líneas, cada una con su `tipo` de trabajo y sus horas por perfil;
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

   Señala también cualquier semáforo en ✗, las excepciones pendientes de registrar y los supuestos de alcance que falta confirmar con el cliente.

## Lo que nunca se hace

- Estimar horas sin haber respondido las preguntas de alcance.
- Cotizar la redacción de contenido, guiones o preguntas que entrega el cliente, o llamar «construcción de contenidos» a una adaptación.
- Cifras clave escritas dentro de frases en vez de celdas.
- Contar el IVA como ingreso o como margen.
- Dar el costo del modelo como si fuera el costo real.
- Enviar la hoja cliente sin el análisis en ✓.
- Poner valores por producto en la hoja cliente (regla 15).
- Aplicar descuentos sin una decisión escrita de David.
