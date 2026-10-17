#!/usr/bin/env python3
"""Mide en HubSpot el punto de partida del flywheel (sector Instituciones).

    python modelos/ecosistema_credenciales/medir_en_hubspot.py NEGOCIOS.json MAPA.html --hoy 2026-10-17

NEGOCIOS.json: {id: propiedades} de todos los negocios (dealname, dealstage,
pipeline, createdate, closedate, linea_negocio, hs_deal_stage_probability).
MAPA.html: el Mapa de actores, para saber a qué institución pertenece cada
negocio (un negocio que no está en el mapa cuenta como una institución).

Un negocio es POK si está en un pipeline POK (desde el 17-oct-2026) o, en
los pipelines comerciales anteriores, si su línea es credenciales_pok o mixto.

--pipelines 946841908 mide solo POK Colombia; --excluir uniandes.edu.co deja
fuera los negocios de esas instituciones (por ejemplo, los que no vienen del
outbound).
"""
import argparse
import json
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "mapa_actores"))
import sincronizar as S  # noqa: E402

PIPELINES_POK = ("946841908", "946748022", "946745948")
COMERCIALES_ANTES = ("default", "929414991", "942303076")


def es_pok(p):
    if p.get("pipeline") in PIPELINES_POK:
        return True
    return p.get("pipeline") in COMERCIALES_ANTES and p.get("linea_negocio") in ("credenciales_pok", "mixto")


def medir(negocios, D, hoy, mercado, pipelines=None, excluir=()):
    inst_de = {}
    for i in D["instituciones"]:
        for d in i["deals"]:
            inst_de.setdefault(d["id"], set()).add(i["id"])
    pok = []
    for k, p in negocios.items():
        if es_pok(p) and (not pipelines or p.get("pipeline") in pipelines):
            if inst_de.get(k, set()) & set(excluir):
                continue
            d = S.negocio_desde_hubspot(p, {"id": k})
            d["creado"] = datetime.fromisoformat(p["createdate"].replace("Z", "+00:00")).date()
            d["insts"] = inst_de.get(k, {"negocio:" + k})
            pok.append(d)
    clientes = {x for d in pok if d["etapa"].startswith("Ganado credenciales") for x in d["insts"]}
    en_piloto = [d for d in pok if d["estado"] == "abierto" and 3 <= d["paso"] <= 5]
    pilotos = {x for d in en_piloto for x in d["insts"]} - clientes
    salidas = [d for d in pok if d["estado"] in ("ganado", "perdido", "retomar")]
    ganados = [d for d in salidas if d["estado"] == "ganado"]
    meses = (hoy - min(d["creado"] for d in pok)).days / 30.44
    por_mes = len(salidas) / meses
    inicios = (len(en_piloto) + len(ganados)) / meses
    potenciales = mercado - len(clientes) - len(pilotos)
    return {
        "negocios POK": len(pok),
        "clientes iniciales": len(clientes),
        "pilotos iniciales": len(pilotos),
        "negocios en etapas 3 a 5": len(en_piloto),
        "salidas del pipeline": {e: sum(1 for d in salidas if d["estado"] == e) for e in ("ganado", "perdido", "retomar")},
        "meses observados": round(meses, 1),
        "fraccion de conversion de pilotos": round(len(ganados) / len(salidas), 3),
        "duracion del piloto (meses, ley de Little)": round(len(en_piloto) / por_mes, 1),
        "instituciones que llegan a propuesta por mes": round(inicios, 1),
        "potenciales": potenciales,
        "fraccion bruta de inicio de pilotos": round(inicios / potenciales, 4),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("negocios")
    ap.add_argument("mapa")
    ap.add_argument("--hoy", required=True)
    ap.add_argument("--mercado", type=int, default=600, help="instituciones en el mercado (supuesto del modelo)")
    ap.add_argument("--pipelines", nargs="*", help="ids de pipeline a medir (por defecto, todos los POK)")
    ap.add_argument("--excluir", nargs="*", default=[], help="instituciones del mapa que no cuentan")
    args = ap.parse_args()
    negocios = {str(k): v for k, v in json.load(open(args.negocios)).items()}
    _, _, D = S.leer_mapa(args.mapa)
    for k, v in medir(negocios, D, date.fromisoformat(args.hoy), args.mercado, args.pipelines, args.excluir).items():
        print(f"{k}: {v}")


if __name__ == "__main__":
    main()
