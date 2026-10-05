#!/usr/bin/env python3
"""Valida uno o más modelos Vensim (.mdl) traduciéndolos y simulándolos con PySD.

Uso:
    python validar_modelo.py modelo.mdl [otro.mdl ...] [--vars "Var A" "Var B"] [--time-step 0.125]

Para cada modelo informa si PySD lo traduce y simula, cuántos pasos guardó,
si aparecen NaN/inf y el valor inicial, final, mínimo y máximo de los stocks
(o de las variables pedidas con --vars).

Requiere: pip install pysd
Nota: PySD escribe la traducción (modelo.py) junto a cada .mdl.
Un fallo aquí no prueba que el modelo sea inválido en Vensim: PySD no cubre
todas las funciones (p.ej. parte de QUEUE/ALLOCATE, las RC... de Reality Check o funciones DSS).
"""
import argparse
import sys
import warnings

CONTROL = {"INITIAL TIME", "FINAL TIME", "TIME STEP", "SAVEPER", "Time"}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("modelos", nargs="+", help="archivos .mdl")
    ap.add_argument("--vars", nargs="*", help="variables a resumir (por defecto, los stocks)")
    ap.add_argument("--time-step", type=float, help="TIME STEP alternativo (usa run(time_step=...))")
    args = ap.parse_args()

    try:
        import numpy as np
        import pysd
    except ImportError:
        print("Falta PySD: pip install pysd", file=sys.stderr)
        return 2

    warnings.filterwarnings("ignore")
    fallos = 0
    for ruta in args.modelos:
        print(f"== {ruta}")
        try:
            modelo = pysd.read_vensim(ruta)
        except Exception as e:  # error de traducción
            print(f"   ERROR al traducir: {type(e).__name__}: {e}")
            fallos += 1
            continue

        if args.vars:
            columnas = args.vars
        else:
            doc = modelo.doc
            tipo = doc["Type"] if "Type" in doc.columns else None
            columnas = list(doc.loc[tipo == "Stateful", "Real Name"]) if tipo is not None else []
            columnas = [c for c in columnas if c not in CONTROL]

        run_kwargs = {}
        if args.time_step:
            run_kwargs["time_step"] = args.time_step
            run_kwargs["saveper"] = args.time_step
        try:
            res = modelo.run(return_columns=columnas or None, **run_kwargs)
        except Exception as e:  # error de simulación
            print(f"   ERROR al simular: {type(e).__name__}: {e}")
            fallos += 1
            continue

        numeros = res.select_dtypes(include="number")
        no_finitos = int((~np.isfinite(numeros.to_numpy())).sum())
        print(f"   OK: {len(res)} instantes guardados, t = {res.index[0]} .. {res.index[-1]}; valores no finitos: {no_finitos}")
        for c in res.columns:
            s = res[c]
            if s.dtype.kind not in "fi":
                continue
            print(f"   {c:40.40s} inicial={s.iloc[0]:.6g} final={s.iloc[-1]:.6g} min={s.min():.6g} max={s.max():.6g}")
        if no_finitos:
            fallos += 1
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
