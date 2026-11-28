# Cierre de sesión · 11 y 28 nov 2026 · Guía de medidas y formatos de imagen para POK

## Objetivo

Leer la documentación completa de POK ([docs.pok.tech](https://docs.pok.tech/docs/intro)) y armar en Google Sheets una guía con las medidas, formatos y pesos de cada imagen que se sube a la plataforma: certificados, insignias, banners de páginas, correos, billetera y página de aceptación. Después, reescribirla con tono de guía, para que alguien sin contexto pueda seguirla paso a paso.

## Entregable

Hoja de Google: [Instructivo POK: medidas de imágenes y banners](https://docs.google.com/spreadsheets/d/1eEeWM5ylpzFm0wwP740ZOd7nMSV3UL6M51-Fwn6nFSQ/edit). Está en el Drive de la organización, no en el repositorio, porque el equipo la consulta y la completa ahí.

| Pestaña | Qué tiene |
|---|---|
| Instructivo | Guía en 8 secciones: para qué sirve, qué hay en cada pestaña, paso a paso de 7 pasos, cómo leer cada columna, reglas generales, errores frecuentes con su solución, glosario y leyenda de colores |
| Medidas por elemento | 25 piezas, cada una con su ruta en POK, formatos, peso máximo, medida recomendada, proporción, qué hace POK con la imagen, cómo prepararla, notas, si es premium y fuente |
| Certificados por papel | Carta, Legal, Tabloide, A3, A4 y A5 en vertical y horizontal, con proporción y px calculados a 96, 150 y 300 DPI (editables), más una columna amarilla para anotar la medida que muestra POK |
| Límites de texto | Caracteres y cantidades máximas de anuncios, footer, campañas de correo y listados |
| Checklist de entrega | Escribes el N.º de la pieza y sus requisitos aparecen solos (`XLOOKUP`). Tiene 3 casillas por pieza y la fila se pone verde cuando se marcan las tres |
| Fuentes | Enlace a cada página de la documentación usada |

## Medidas clave

| Pieza | Formatos | Peso | Medida |
|---|---|---|---|
| Fondo de certificado | PNG | 4 MB | Depende del papel; la muestra el panel Fondo del editor |
| Fondo de insignia | PNG | 4 MB | Cuadrado; la muestra el panel Fondo |
| Banner de páginas, Tu marca y billetera | PNG, JPG | 2 MB | 1440 × 160 px o 2880 × 320 px (9:1) |
| Imagen lateral de la página de aceptación | JPG, PNG | 2 MB | 443 × 604 px (3:4), se recorta al centro |
| Casi todos los logos e imágenes | PNG, JPG | 2 MB | Sin medida oficial |

SVG solo se acepta en el logo del header y del footer de las páginas personalizadas y en el logo de la página de aceptación. Tu marca, los correos y la billetera no lo aceptan.

## Decisiones

- **Fuente única: la documentación oficial.** Se leyeron las 92 páginas del sitemap en inglés y la versión en español de las páginas de diseño, marca y emisión. El 28 de noviembre se volvió a revisar con el script de esta carpeta: las medidas no cambiaron y apareció una página nueva, [Oferta de cursos](https://docs.pok.tech/docs/help/settings/course-offer), que quedó como la pieza 25.
- **Lo que POK no publica no se inventa.** Esas celdas dicen «Sin dato oficial». Las medidas en px por tamaño de papel son un cálculo de referencia con el tamaño estándar del papel, no medidas de POK. La medida oficial la muestra el panel Fondo del editor y se anota en la columna amarilla.
- **El enlace `docs.pok.tech/en` da 404.** La documentación en inglés está en `docs.pok.tech/docs` y la de español en `docs.pok.tech/es/docs`.
- **Red de la sesión.** `docs.pok.tech` estaba bloqueado en el entorno Default. Se creó el entorno personal «daily-sessions», que solo agrega ese dominio, y la sesión se pasó a él.

## Párrafo para el Playbook de procesos (Guías de HubSpot)

> **Guía de medidas y formatos de imagen para POK**
> Antes de diseñar o subir cualquier pieza gráfica a POK, consulta esta guía. Aplica a fondos de certificados e insignias, banners y logos de páginas, correos, la billetera del receptor, pases de Apple y Google Wallet y la página de aceptación. Para cada pieza indica la medida recomendada, los formatos aceptados, el peso máximo, la ruta exacta en POK donde se sube y cómo prepararla paso a paso. También incluye los límites de texto de anuncios, footers y campañas, y un checklist para revisar cada archivo antes de subirlo. Regla rápida: la mayoría de las imágenes aceptan PNG o JPG de hasta 2 MB, los banners miden 1440 × 160 px (o 2880 × 320 px) y la medida del fondo del certificado depende del tamaño de papel elegido.
> Link: https://docs.google.com/spreadsheets/d/1eEeWM5ylpzFm0wwP740ZOd7nMSV3UL6M51-Fwn6nFSQ/edit

## Pendientes

- [ ] Compartir la hoja como lector con merahki.ai. Hoy solo la abre su dueño, así que el equipo vería «Solicitar acceso» al entrar desde el Playbook.
- [ ] Pegar el párrafo y el link en el Playbook de procesos, en Guías de HubSpot.
- [ ] Completar la columna amarilla de «Certificados por papel» con la medida que muestra el panel Fondo de POK, al menos para los formatos que usa el equipo (por ejemplo, A4 y Carta horizontales).
- [ ] Anotar la medida del lienzo de insignias, que también muestra el panel Fondo.
- [ ] Confirmar en POK el formato y la medida del anuncio de imagen estática. La documentación no los indica.
- [ ] Repetir la revisión con el script cuando POK anuncie cambios en su documentación.

## Cómo repetir la revisión

`revisar_docs_pok.py` descarga todas las páginas del sitemap de docs.pok.tech y lista, página por página, cada línea que menciona píxeles, proporciones, MB o formatos de imagen. Si POK cambia una medida, aparece en la salida y se actualiza la hoja. Solo usa la biblioteca estándar de Python y necesita acceso de red a `docs.pok.tech`, que está permitido en el entorno «daily-sessions».

```bash
python sesiones/2026-11-11_medidas_imagenes_pok/revisar_docs_pok.py --solo-ayuda
python sesiones/2026-11-11_medidas_imagenes_pok/revisar_docs_pok.py --solo-ayuda --es
```

Para ver solo las páginas nuevas, compara la lista de `<loc>` de `https://docs.pok.tech/sitemap.xml` con la de la revisión anterior. El 28 de noviembre había 93 URL.
