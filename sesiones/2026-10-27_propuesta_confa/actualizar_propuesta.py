#!/usr/bin/env python3
"""Actualiza la propuesta POK para Confa (versión del 13-oct-2026, piloto de 500)
a un piloto de 1.000 credenciales a USD 0,30 + IVA c/u con TRM fija de $3.250.

No regenera el documento: quita el texto de cada línea que cambia (sin tocar
fondos ni gráficos) y lo vuelve a escribir con la misma fuente, tamaño, color
y línea base. Las páginas 5 a 9 no se tocan.

    pip install pymupdf
    python actualizar_propuesta.py ORIGINAL.pdf NUEVA.pdf CARPETA_FUENTES

CARPETA_FUENTES tiene los TTF de Google Fonts que usa el PDF original:
Poppins-Bold, Poppins-Medium, Poppins-Regular, Lato-Regular, Lato-Bold y
Lato-Italic (.ttf). Las URL salen de
https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&family=Lato:ital,wght@0,400;0,700;1,400
pedida con un User-Agent que no sea de navegador (por ejemplo "Wget/1.21").

Las coordenadas son las del PDF del 13-oct; con otra versión del original hay
que volver a medirlas con page.get_text("dict").
"""
import sys
import pymupdf

SRC, DST, FONTS = sys.argv[1], sys.argv[2], sys.argv[3]

# --- Cálculo ---------------------------------------------------------------
CREDENCIALES = 1000
USD_POR_CREDENCIAL = 0.30
TRM = 3250
FECHA, FECHA_CORTA = "27 de octubre de 2026", "27-oct-2026"
precio_unit = round(USD_POR_CREDENCIAL * TRM)          # 975
subtotal = CREDENCIALES * precio_unit                  # 975.000
iva = round(subtotal * 0.19)                           # 185.250
total = subtotal + iva                                 # 1.160.250


def cop(v):
    return "$" + f"{v:,}".replace(",", ".")


N = f"{CREDENCIALES:,}".replace(",", ".")              # "1.000"
print("unitario", cop(precio_unit), "subtotal", cop(subtotal), "IVA", cop(iva), "total", cop(total))

# --- Estilos del original ----------------------------------------------------
FONT_FILES = {
    "PopB": "Poppins-Bold.ttf", "PopM": "Poppins-Medium.ttf", "PopR": "Poppins-Regular.ttf",
    "LatoR": "Lato-Regular.ttf", "LatoB": "Lato-Bold.ttf", "LatoI": "Lato-Italic.ttf",
}
FONT = {k: pymupdf.Font(fontfile=f"{FONTS}/{v}") for k, v in FONT_FILES.items()}


def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def width(font, text, size):
    return FONT[font].text_length(text, size)


def texto_linea(page, base):
    """Texto original de la línea que tiene esa línea base."""
    return "".join(s["text"] for b in page.get_text("dict")["blocks"] for l in b.get("lines", [])
                   for s in l["spans"] if abs(s["origin"][1] - base) < 0.5)


def borrar(page, x0, x1, base, size):
    """Redacta solo la franja de la línea (de la línea base hacia arriba), para no tocar líneas vecinas."""
    page.add_redact_annot(pymupdf.Rect(x0 - 0.5, base - 0.55 * size, x1 + 0.5, base - 0.5), fill=False)


def escribir(page, x, base, text, font, size, color):
    page.insert_text((x, base), text, fontname=font, fontfile=f"{FONTS}/{FONT_FILES[font]}",
                     fontsize=size, color=rgb(color))


def aplicar(page):
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                          graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                          text=pymupdf.PDF_REDACT_TEXT_REMOVE)


doc = pymupdf.open(SRC)

# --- Página 1 · portada -------------------------------------------------------
p = doc[0]
atencion = texto_linea(p, 279.0).replace("13 de octubre de 2026", FECHA)
borrar(p, 48.0, 441.0, 234.8, 12.49)
borrar(p, 48.0, 532.0, 279.0, 8.5)
borrar(p, 48.0, 249.0, 293.2, 7.5)
aplicar(p)
escribir(p, 48.0, 234.8, f"Caja de Compensación Familiar de Caldas · Piloto de {N} microcertificaciones",
         "LatoI", 12.49, "6e6b86")
escribir(p, 48.0, 279.0, atencion, "PopM", 8.5, "3a3550")
escribir(p, 48.0, 293.2, "Reemplaza las propuestas del 1 de septiembre y del 13 de octubre de 2026.",
         "PopR", 7.5, "6e6b86")

# --- Página 2 · qué cambió ------------------------------------------------------
p = doc[1]
borrar(p, 413.0, 658.0, 156.8, 8.6)
borrar(p, 413.0, 500.0, 168.0, 8.6)
aplicar(p)
escribir(p, 413.0, 156.8, f"{N} microcertificaciones · 3 meses desde el inicio · emisión",
         "LatoB", 8.6, "3d1a80")
escribir(p, 413.0, 168.0, "hasta el 31 de enero de 2027", "LatoB", 8.6, "3d1a80")

# --- Página 3 · alcance ----------------------------------------------------------
p = doc[2]
borrar(p, 66.8, 114.0, 147.0, 24.0)
borrar(p, 172.7, 331.5, 292.5, 9.0)
borrar(p, 172.7, 233.0, 304.5, 9.0)
aplicar(p)
escribir(p, 66.8, 147.0, N, "PopB", 24.0, "3d1a80")
escribir(p, 172.7, 292.5, f"Las {N} se emiten según el calendario", "LatoR", 9.0, "3a3550")
escribir(p, 172.7, 304.5, "de cada programa.", "LatoR", 9.0, "3a3550")

# --- Página 4 · inversión -------------------------------------------------------
p = doc[3]
DER = 343.7                      # borde derecho de las cifras en la tarjeta
borrar(p, 69.5, 342.0, 169.5, 40.0)     # cifra grande + "COP · IVA incluido"
borrar(p, 69.5, 314.0, 190.5, 9.0)
borrar(p, 300.0, DER, 237.0, 9.19)
borrar(p, 307.1, DER, 258.0, 9.19)
borrar(p, 302.5, DER, 288.8, 9.19)
borrar(p, 48.0, 513.0, 372.8, 6.29)     # 2.ª línea de la nota al pie
aplicar(p)

# La cifra grande se reduce lo justo para que quepa con "COP · IVA incluido" en la misma línea.
etiqueta = " COP · IVA incluido"
w_etq = width("PopM", etiqueta, 10.0)
hero = cop(total)
size = min(40.0, 40.0 * (DER - 69.5 - w_etq) / width("PopB", hero, 40.0))
print("tamaño cifra grande", round(size, 2))
escribir(p, 69.5, 169.5, hero, "PopB", size, "3d1a80")
escribir(p, 69.5 + width("PopB", hero, size), 169.5, etiqueta, "PopM", 10.0, "6e6b86")

escribir(p, 69.5, 190.5, f"{N} microcertificaciones · USD 0,30 c/u + IVA ({cop(precio_unit)} a TRM fija",
         "LatoR", 9.0, "6e6b86")
escribir(p, 48.0, 372.8, "0,30 por credencial + IVA). Referencia para el servicio anual 2027: la misma tarifa por "
         "credencial o la licencia anual; el volumen, la TRM y las condiciones se fijan en esa propuesta.",
         "LatoR", 6.29, "9a97ad")
for valor, base in ((subtotal, 237.0), (iva, 258.0), (total, 288.8)):
    t = cop(valor)
    escribir(p, DER - width("PopB", t, 9.19), base, t, "PopB", 9.19, "3d1a80")

# --- Metadatos ---------------------------------------------------------------------
meta = doc.metadata
meta["title"] = f"Propuesta POK para Confa — Piloto ajustado ({FECHA_CORTA})"
meta["subject"] = f"Piloto Blockchain Verify · {N} microcertificaciones"
doc.set_metadata(meta)

doc.subset_fonts()
doc.save(DST, garbage=3, deflate=True)
print("guardado", DST)
