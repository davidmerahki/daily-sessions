"""Revisa la documentación de POK y lista cada mención de medidas, formatos y pesos.

Sirve para mantener al día la hoja «Instructivo POK: medidas de imágenes y banners»:
descarga todas las páginas del sitemap de docs.pok.tech, extrae el texto de cada
artículo y muestra las líneas que hablan de píxeles, proporciones, MB o formatos
de imagen. Si POK cambia una medida, aparece aquí.

Uso:
    python revisar_docs_pok.py                 # documentación en inglés
    python revisar_docs_pok.py --es            # documentación en español
    python revisar_docs_pok.py --solo-ayuda    # omite las páginas de la API

Necesita acceso de red a docs.pok.tech. Solo usa la biblioteca estándar.
"""

import argparse
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

SITEMAP = "https://docs.pok.tech/sitemap.xml"

PATRON = re.compile(
    r"\d\s?px|p[ií]xel|\d\s?[x×]\s?\d{2,}|\d\s?MB\b|\d+:\d+\b|ratio|proporci"
    r"|\bsvg\b|\bpng\b|\bjpe?g\b|cuadrad|square|landscape|portrait",
    re.IGNORECASE,
)


class TextoDelArticulo(HTMLParser):
    """Junta el texto de <article>, un bloque por párrafo, ítem o encabezado."""

    BLOQUES = {"p", "li", "h1", "h2", "h3", "h4", "td", "th"}

    def __init__(self):
        super().__init__()
        self.dentro = 0
        self.ignorar = 0
        self.lineas = []
        self.actual = []

    def handle_starttag(self, tag, attrs):
        if tag == "article":
            self.dentro += 1
        elif tag in ("script", "style", "nav"):
            self.ignorar += 1
        elif tag in self.BLOQUES:
            self._cerrar()

    def handle_endtag(self, tag):
        if tag == "article":
            self.dentro -= 1
        elif tag in ("script", "style", "nav"):
            self.ignorar -= 1
        elif tag in self.BLOQUES:
            self._cerrar()

    def handle_data(self, data):
        if self.dentro and not self.ignorar:
            self.actual.append(data)

    def _cerrar(self):
        texto = " ".join("".join(self.actual).split())
        if texto:
            self.lineas.append(texto)
        self.actual = []


def descargar(url):
    with urllib.request.urlopen(url, timeout=30) as respuesta:
        return respuesta.read().decode("utf-8", errors="replace")


def lineas_relevantes(url):
    parser = TextoDelArticulo()
    parser.feed(descargar(url))
    vistas = []
    for linea in parser.lineas:
        if PATRON.search(linea) and linea not in vistas:
            vistas.append(linea)
    return url, vistas


def main():
    args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    args.add_argument("--es", action="store_true", help="usa la versión en español")
    args.add_argument("--solo-ayuda", action="store_true", help="omite /docs/spec (API)")
    opciones = args.parse_args()

    urls = re.findall(r"<loc>([^<]+)</loc>", descargar(SITEMAP))
    if opciones.solo_ayuda:
        urls = [u for u in urls if "/docs/spec/" not in u]
    if opciones.es:
        urls = [u.replace("docs.pok.tech/docs/", "docs.pok.tech/es/docs/") for u in urls]

    with ThreadPoolExecutor(max_workers=8) as grupo:
        resultados = list(grupo.map(lineas_relevantes, urls))

    paginas = 0
    for url, lineas in sorted(resultados):
        if not lineas:
            continue
        paginas += 1
        print(f"\n== {url}")
        for linea in lineas:
            print(f"   - {linea[:300]}")
    print(f"\n{len(urls)} páginas revisadas, {paginas} con menciones de medidas o formatos.",
          file=sys.stderr)


if __name__ == "__main__":
    main()
