#!/usr/bin/env python3
"""Arma un tablero HTML autocontenido para un modelo Vensim (.mdl).

    python construir_tablero.py ../modelos/ecosistema_credenciales

Lee de la carpeta del modelo:
  - el único .mdl de la carpeta (o el indicado con --mdl),
  - tablero_config.json (títulos, gráficos, KPIs, nombres de los bucles...),
  - el SVG del diagrama si la configuración lo nombra ("diagrama").
y escribe tablero.html en esa misma carpeta, con motor.js, modelo.js, app.js,
el modelo y la configuración incrustados: un solo archivo que funciona sin
servidor. Publicado como artifact, la página lee además modelo.mdl y
tablero_config.json publicados junto a ella (y los reescribe al guardar).
"""
import argparse
import glob
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))


def _sin_cierre(texto):
    """Evita que un '</script' dentro del contenido cierre la etiqueta."""
    return texto.replace("</script", "<\\/script").replace("</SCRIPT", "<\\/SCRIPT")


def construir(carpeta, mdl=None, salida=None):
    if mdl is None:
        mdls = sorted(glob.glob(os.path.join(carpeta, "*.mdl")))
        if len(mdls) != 1:
            raise SystemExit(f"se esperaba un único .mdl en {carpeta}, hay {len(mdls)}: usa --mdl")
        mdl = mdls[0]
    with open(os.path.join(carpeta, "tablero_config.json"), encoding="utf-8") as f:
        config = json.load(f)
    with open(mdl, encoding="utf-8") as f:
        modelo = f.read()
    with open(os.path.join(AQUI, "motor.js"), encoding="utf-8") as f:
        motor = f.read()
    with open(os.path.join(AQUI, "modelo.js"), encoding="utf-8") as f:
        modelo_js = f.read()
    with open(os.path.join(AQUI, "app.js"), encoding="utf-8") as f:
        app = f.read()
    with open(os.path.join(AQUI, "plantilla_tablero.html"), encoding="utf-8") as f:
        html = f.read()
    diagrama = ""
    if config.get("diagrama"):
        with open(os.path.join(carpeta, config["diagrama"]), encoding="utf-8") as f:
            diagrama = f.read()

    html = (html.replace("__TITULO__", config.get("titulo", "Simulador"))
                .replace("/*__MOTOR__*/", _sin_cierre(motor))
                .replace("/*__MODELO_JS__*/", _sin_cierre(modelo_js))
                .replace("/*__APP__*/", _sin_cierre(app))
                .replace("__MODELO__", _sin_cierre(modelo))
                .replace("__CONFIG__", _sin_cierre(json.dumps(config, ensure_ascii=False)))
                .replace("<!--__DIAGRAMA__-->", diagrama))
    salida = salida or os.path.join(carpeta, "tablero.html")
    with open(salida, "w", encoding="utf-8") as f:
        f.write(html)
    return salida


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("carpeta", help="carpeta del modelo (con el .mdl y tablero_config.json)")
    ap.add_argument("--mdl", help="ruta del .mdl si la carpeta tiene varios")
    ap.add_argument("--salida", help="archivo HTML de salida (por defecto <carpeta>/tablero.html)")
    a = ap.parse_args()
    print("escrito", construir(a.carpeta, a.mdl, a.salida))
