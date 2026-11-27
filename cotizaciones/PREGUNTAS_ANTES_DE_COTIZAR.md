# Preguntas antes de cotizar (regla 25, fija desde el 27-nov-2026)

**Principio.** merahki.ai no escribe el contenido. El cliente entrega textos, conocimiento, guiones, materiales y preguntas de evaluación. merahki.ai hace learning design y diseño instruccional sobre ese material, y después lo produce y lo virtualiza. Hasta ahí.

**Por qué existe.** El 27-nov-2026, David identificó que las cotizaciones salían caras porque asumían que merahki.ai escribía el contenido. En la 26-039, la línea «Construcción de contenidos académicos» y la redacción de preguntas sumaban 47,5 horas de DI que nunca nos tocan.

**Cómo se cumple.**

1. Antes de estimar horas, lee la solicitud y responde con ella todas las preguntas que pueda. Cada respuesta lleva su fuente.
2. Lo que la solicitud no responda se le pregunta a David o, con su visto bueno, al cliente. No se inventa.
3. Si David decide cotizar sin una respuesta, va como supuesto (`"supuesto": true`) y la fuente dice quién lo autorizó. Los supuestos aparecen en ámbar en el análisis interno y se le confirman al cliente.
4. Las respuestas van en el bloque `intake` del escenario. Sin ellas, `cotizaciones/analisis_interno.py` no calcula nada.
5. Cada línea del escenario lleva su `tipo` de trabajo. Las de autoría (`redaccion_contenido`, `guiones` y `banco_preguntas`) solo caben si el intake dice «merahki» y hay una confirmación escrita de David (`confirmacion_autoria_merahki`, con autor y fecha).
6. Si el cliente pide «construcción de contenidos», se cotiza como adaptación didáctica del material que entrega (`adaptacion_contenido`) y se le pregunta. Nunca se asume escritura.

La lista de abajo sale del generador. Para verla en la terminal:

```bash
python cotizaciones/analisis_interno.py --preguntas
```

---

## Contenido

1. **¿Quién entrega el contenido académico: textos, conocimiento y materiales base? Responde «cliente» o «merahki».** (`contenido_fuente`)
   - Por qué mueve el precio: Es lo que más mueve el precio. Lo normal es que lo entregue el cliente. Si lo escribe merahki son horas de autoría, y solo se cotizan con confirmación escrita de David.
2. **¿En qué estado y formato llega ese material, y cuándo? Por ejemplo: documentos terminados, presentaciones, apuntes o grabaciones de clase.** (`contenido_estado`)
   - Por qué mueve el precio: Define las horas de adaptación didáctica del DI y el riesgo de retraso.
3. **¿Quién escribe los guiones de los videos y microvideos? Responde «cliente» o «merahki».** (`guiones_fuente`)
   - Por qué mueve el precio: Si los escribe el cliente, merahki solo los ajusta al formato audiovisual.
4. **¿Quién redacta las preguntas, los casos y las rúbricas de las evaluaciones? Responde «cliente» o «merahki».** (`preguntas_fuente`)
   - Por qué mueve el precio: Si los entrega el cliente, el DI hace revisión pedagógica y configuración, no redacción.
5. **¿Quién es el experto temático del cliente, cuánto tiempo tiene y en cuántos días valida cada entrega?** (`experto_tematico`)
   - Por qué mueve el precio: Sin experto disponible, el cronograma se alarga y crecen las rondas de ajuste.

## Diseño

6. **¿Qué esperan de nuestro learning design y diseño instruccional? Por ejemplo: arquitectura del curso, objetivos, secuencia, storyboard, actividades y adaptación del material al formato digital.** (`alcance_di`)
   - Por qué mueve el precio: Es el alcance real del DI: acompañamiento y diseño sobre el material del cliente, no autoría.

## Producción

7. **¿Quién aparece en los videos, quién graba, dónde y en cuántas sesiones? ¿Hay locución?** (`grabacion`)
   - Por qué mueve el precio: Define las jornadas de estudio, las horas de AV y los terceros (locutor o talento).
8. **¿Cuáles son los tipos y las cantidades de recursos, y cuánto dura cada video?** (`recursos`)
   - Por qué mueve el precio: Las cantidades son las unidades del precio (regla 18).
9. **¿Piden subtítulos, transcripciones, otros idiomas o requisitos de accesibilidad?** (`accesibilidad`)
   - Por qué mueve el precio: Suma horas de MM y AV o terceros de subtitulación.
10. **¿Cuántas rondas de ajuste hay por entrega y quién aprueba?** (`rondas`)
   - Por qué mueve el precio: Cada ronda extra es producción que no está en la cotización.

## Plataforma

11. **¿En qué plataforma se publica, quién la paga y la administra, en qué estándar (SCORM 1.2, SCORM 2004 o xAPI) y con qué límite de peso?** (`plataforma`)
   - Por qué mueve el precio: Define si hay horas de montaje, pruebas en la plataforma o costos de licencia.
12. **¿De quién es la marca del curso y hay manual de identidad?** (`marca`)
   - Por qué mueve el precio: Sin manual, la adaptación gráfica es diseño desde cero.

## Comercial

13. **¿El cliente tiene presupuesto o un rango de referencia?** (`presupuesto`)
   - Por qué mueve el precio: Ubica el precio en la banda antes de armar el alcance.
14. **¿Cuándo empieza, cuándo se entrega y hay hitos fijos?** (`plazo`)
   - Por qué mueve el precio: Define las semanas de gerencia y la necesidad de caja.
15. **¿Es carril A, B o C? ¿Hay un cliente final detrás de un intermediario?** (`carril`)
   - Por qué mueve el precio: Define la banda permitida (regla 23).
16. **¿Cómo paga: anticipo o contra entrega, a cuántos días y con orden de compra?** (`pago`)
   - Por qué mueve el precio: Define la caja (regla 14).
17. **¿Compite con otras propuestas o hay un precio de referencia?** (`competencia`)
   - Por qué mueve el precio: Define cuánto margen se puede ceder.

## Soporte y licencias

18. **¿Qué soporte y garantía esperan, por cuánto tiempo y qué cubren?** (`soporte`)
   - Por qué mueve el precio: Son horas después de la entrega que no se ven en la producción.
19. **¿Qué licencias de terceros hacen falta (stock, música, fuentes o software) y a nombre de quién quedan?** (`licencias`)
   - Por qué mueve el precio: Son terceros que se cobran con recargo.
