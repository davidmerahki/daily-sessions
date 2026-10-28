# Cierre de sesión · 27-28 oct 2026 · Propuesta Confa: piloto de 1.000 credenciales

## Objetivo

Actualizar la propuesta POK para Confa (Caja de Compensación Familiar de Caldas) del 13 de octubre de 2026, que era un piloto de 500 microcertificaciones con Blockchain Verify, para que sea de **1.000 credenciales** con la **TRM acordada de $3.250**.

## Entregable

`POK_Propuesta_Confa_2026_-_Piloto_1000_credenciales_27-oct.pdf`: 9 páginas con el mismo diseño, las mismas fuentes y los mismos colores del original. Se entregó en el chat de la sesión. No está en el repositorio porque lleva los datos de contacto del cliente.

| Concepto | Versión 13-oct (500) | Versión 27-oct (1.000) |
|---|---|---|
| Precio por credencial | USD 0,30 + IVA = $975 + IVA | USD 0,30 + IVA = $975 + IVA |
| Valor antes de IVA | $487.500 | **$975.000** |
| IVA (19 %) | $92.625 | **$185.250** |
| **Total del piloto** | $580.125 | **$1.160.250** |

## Qué cambió en el PDF

| Página | Cambio |
|---|---|
| 1 · Portada | «Piloto de 1.000 microcertificaciones»; fecha 27 de octubre de 2026; «Reemplaza las propuestas del 1 de septiembre y del 13 de octubre de 2026» |
| 2 · Qué cambió | Alcance ajustado: 1.000 microcertificaciones · 3 meses · emisión hasta el 31 de enero de 2027 |
| 3 · Alcance | Cifra grande 1.000; «Las 1.000 se emiten según el calendario de cada programa» |
| 4 · Inversión | Total, desglose, línea «USD 0,30 c/u + IVA ($975 a TRM fija de $3.250)» y nota al pie «(USD 0,30 por credencial + IVA)». La cifra grande baja de 40 a 35,7 pt para que quepa junto a «COP · IVA incluido» |
| 5 a 9 | Sin cambios: condiciones comerciales, requerimientos, qué incluye Blockchain Verify, próximos pasos y contraportada |

También cambiaron los metadatos del PDF: título «Piloto ajustado (27-oct-2026)» y asunto «1.000 microcertificaciones».

## Decisiones

- **Precio:** USD 0,30 + IVA por credencial, según Planes y precios POK 2026. En el chat se pidió «0.3 centavos de dólar»; se leyó como 30 centavos. Si fuera USD 0,003, el total sería de unos $11.600 con IVA.
- **TRM:** fija de $3.250, la misma de la versión del 13-oct.
- **Fecha:** la propuesta pasa al 27-oct-2026 y deja claro que reemplaza las dos anteriores, para que Compras no confunda versiones.
- **Se mantienen** la vigencia de las órdenes de compra (hasta el 30-nov-2026), los 3 meses de piloto y la fecha máxima de emisión (31-ene-2027).

## Pendientes

- [ ] Enviar la versión del 27-oct al Área de Compras de Confa.
- [ ] Confirmar con Confa que las 1.000 emisiones caben en los 3 meses del piloto (máximo hasta el 31-ene-2027). El volumen es el doble y el plazo sigue igual.
- [ ] Actualizar el monto del negocio de Confa en HubSpot: $975.000 antes de IVA y $1.160.250 con IVA.
- [ ] Si cambia otra cifra (volumen, TRM o fecha), volver a generar el PDF con el script de esta carpeta.

## Cómo se generó

`actualizar_propuesta.py` edita el PDF original en vez de rehacerlo:

1. Borra solo el texto de las líneas que cambian. Los fondos, las tarjetas y los gráficos quedan intactos.
2. Vuelve a escribir esas líneas con Poppins y Lato (los TTF de Google Fonts), con la misma fuente, tamaño, color y línea base del original.

Las cifras salen de las constantes del inicio: `CREDENCIALES`, `USD_POR_CREDENCIAL`, `TRM` y `FECHA`.

```bash
pip install pymupdf
python sesiones/2026-10-27_propuesta_confa/actualizar_propuesta.py ORIGINAL_13-oct.pdf NUEVA.pdf CARPETA_FUENTES
```

El docstring del script explica cómo descargar las fuentes. El script reproduce el PDF entregado de forma idéntica: el texto es el mismo y las 9 páginas son iguales píxel por píxel.
