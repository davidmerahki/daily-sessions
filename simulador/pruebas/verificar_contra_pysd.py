#!/usr/bin/env python3
"""Compara el motor JS (motor.js) con PySD, variable por variable.

Uso: python verificar_contra_pysd.py modelo.mdl [modelo2.mdl ...]
Para cada modelo corre varios escenarios (base y cada constante 0/1 de tipo
interruptor invertida) y reporta la máxima diferencia relativa.
Requiere: pip install pysd ; node en el PATH.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import warnings

import numpy as np

warnings.filterwarnings("ignore")
import pysd  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
norm = lambda c: re.sub(r"[\s_]+", " ", c.replace('"', "").strip().lower())


def motor(ruta, cambios):
    out = subprocess.run(["node", os.path.join(AQUI, "correr_motor.js"), ruta, json.dumps(cambios)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def comparar(ruta):
    tmp = tempfile.mkdtemp()
    copia = shutil.copy(ruta, tmp)
    js = motor(ruta, {})
    if "error" in js:
        return f"{os.path.basename(ruta)}: el motor no lo soporta -> {js['error']}"
    m = pysd.read_vensim(copia)
    interruptores = [c for c in m.doc["Real Name"] if norm(c).startswith("activar ")]
    # cada interruptor invertido: apaga los bucles y enciende las tácticas que empiezan en 0
    escenarios = [{}] + [{c: 1 - round(float(m[c]))} for c in interruptores]
    peor, donde = 0.0, None
    for esc in escenarios:
        js = motor(ruta, esc) if esc else js
        m.reload()
        py = m.run(params=esc)
        py.columns = [norm(c) for c in py.columns]
        for nombre, valores in js["series"].items():
            k = norm(nombre)
            if k not in py.columns:
                continue
            a = np.array(valores, dtype=float)
            b = py[k].reindex(js["tiempo"], method="nearest").to_numpy(dtype=float)
            d = np.nanmax(np.abs(a - b) / (np.abs(b) + 1e-9))
            if d > peor:
                peor, donde = d, (nombre, esc)
    return (f"{os.path.basename(ruta)}: {len(escenarios)} escenarios, {len(js['series'])} variables; "
            f"max dif. relativa = {peor:.1e}" + (f" en {donde[0]!r} {donde[1] or ''}" if donde else ""))


if __name__ == "__main__":
    for r in sys.argv[1:]:
        print(comparar(r))
