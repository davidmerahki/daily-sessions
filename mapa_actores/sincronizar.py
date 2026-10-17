#!/usr/bin/env python3
"""Pone al día el Mapa de actores merahki × POK con HubSpot como fuente de verdad.

El mapa es una página HTML con todos sus datos en `const D = {...};`. Este
script no lo regenera desde cero: toma esa foto, le aplica lo que cambió en
HubSpot después de descargarla y vuelve a escribir la página.

    python mapa_actores/sincronizar.py MAPA.html --verificar
    python mapa_actores/sincronizar.py MAPA.html --hubspot CARPETA --delta DELTA.json \
        --hoy 2026-10-17 --descargado "2026-10-17 11:30" -o MAPA_NUEVO.html \
        --plantilla mapa_actores/plantilla.html

Con --plantilla, la página nueva lleva el código de la plantilla del
repositorio (la versión vigente del mapa) y los datos puestos al día.

--verificar recalcula los campos derivados (estado, negocios por línea, calor
y cifras del panel de control) sin cambiar nada y dice si reproducen la foto.
Es la prueba de que las reglas de este script son las mismas del mapa.

CARPETA tiene lo descargado de HubSpot con el conector:
  negocios.json   {id: propiedades} de todos los negocios (dealname, dealstage,
                  pipeline, amount, closedate, hubspot_owner_id, hs_priority,
                  linea_negocio, hs_deal_stage_probability)
  tareas*.json, notas*.json, correos*.json, reuniones*.json
                  salida de get_crm_objects ({"objects": [{id, properties}]})

DELTA.json dice qué registros entran al mapa y con quién se asocian; los
textos, fechas, responsables y etapas salen de los archivos de HubSpot:
  instituciones  [{id, nombre, pais, fuente_pais, ciudad, fuente_ciudad, tipo,
                   tier, dominio, empresas_hs, empresa, responsable,
                   fuente_responsable}]
  personas       [{id, nombre, inst, cargo, fuente_cargo, unidad, fuente_unidad,
                   nivel, fuente_nivel, etapa, owner}]   owner: id de HubSpot
  negocios       [{deal, inst?, canal?, personas: [ids]}]   negocio que se suma
                   a una institución (solo si está asociado a su empresa en
                   HubSpot, como hace el mapa) y a la lista de negocios de esas
                   personas. canal: institución por la que llega (asociación con
                   la etiqueta «Canal» en HubSpot); el negocio queda en las dos
  acciones       [{objeto: nota|correo|reunion, id, tipo?, personas, inst}]
                   inst solo para acciones sin persona en el mapa
  tareas         [{id, personas, inst}]   tareas abiertas nuevas
  excluidas      {instituciones, personas}   conteo nuevo de lo que no aparece

Los negocios y las tareas que ya están en el mapa se refrescan solos: etapa,
monto, fecha de cierre, dueño, pipeline, tareas completadas o con nueva fecha.
Desde el 17-oct-2026 POK y merahki tienen pipelines separados; la línea de un
negocio sale de su pipeline.
"""
import argparse
import glob
import html as html_mod
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta

PATRON_D = re.compile(r"const D = (\{.*?\});\n", re.S)
DUENOS = {
    "79256369": ("David", "David Mauricio González Roa"),
    "91292997": ("JD", "Jesus David Sequeda Segovia"),
    "97146305": ("Francely", "Francely Santiago"),
    "90536041": ("Abraham", "Abraham Avinu"),
}
PIPELINES = {
    "946841908": "POK Colombia",
    "946841907": "merahki Colombia",
    "946748022": "POK México",
    "946745948": "POK España",
    "default": "Pipeline Comercial merahki × POK",
    "929414991": "México Pipeline Comercial merahki x POK",
    "942303076": "España Pipeline Comercial merahki x POK",
    "917209518": "Alianzas y Eventos",
    "934854468": "PMI B2B",
    "934854467": "PMI B2C",
    "934854469": "PMI PATROCINADORES POTENCIALES",
}
_COMERCIAL = {
    "1": "1. Investigar y contactar", "2": "2. Discovery Agendado", "3": "3. Enviar propuesta",
    "4": "4. Seguimiento semanal de propuesta", "5": "5. Sesión de cierre", "R": "Retomar en 3-6 meses",
    "GP": "Ganado credenciales POK — facturar misma semana", "P": "Perdido — registrar motivo",
    "GM": "Ganado merahki.ai — facturar misma semana",
}
ETAPAS = {
    # Pipeline Comercial (Colombia), México y España: mismas etapas
    **dict(zip(["1397879374", "1397845381", "1397879375", "1397845382", "1397879376", "1399747876",
                "1397845383", "1397845384", "1409905932"], _COMERCIAL.values())),
    **dict(zip([str(n) for n in range(1426717096, 1426717105)],
               [_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GP", "P", "GM"]])),
    **dict(zip([str(n) for n in range(1452913062, 1452913071)],
               [_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GP", "P", "GM"]])),
    # Pipelines por línea (desde el 17-oct-2026): POK Colombia, merahki Colombia, POK México, POK España
    **{str(1461254764 + n): e for n, e in enumerate(_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GP", "P"])},
    **{str(1461254756 + n): e for n, e in enumerate(_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GM", "P"])},
    **{str(1461310741 + n): e for n, e in enumerate(_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GP", "P"])},
    **{str(1461256250 + n): e for n, e in enumerate(_COMERCIAL[k] for k in ["1", "2", "3", "4", "5", "R", "GP", "P"])},
    # PMI B2B
    "1437026949": "1. Cuenta identificada", "1437026950": "2. Campeón contactado",
    "1437026951": "3. Decisor contactado", "1445371534": "4. Cotización en elaboración y aprobación",
    "1437026952": "5. Propuesta corporativa enviada", "1437026953": "6. Negociación — pago/OC en trámite",
    "1437026954": "7. Pagado — factura por emitir", "1445371535": "8. Factura emitida — boletas asignadas",
    "1437026955": "Descartado — registrar motivo",
    # Alianzas y Eventos
    "1397879377": "Explorar", "1397879378": "Activa", "1397879379": "Cerrada", "1456806043": "Descartada",
    # PMI B2C
    "1437026943": "1. Lead identificado", "1437026944": "2. Contactado (correo/WhatsApp/llamada)",
    "1437026945": "3. Interesado — pidió info o tarifa", "1437026946": "4. Abono 50 % recibido",
    "1437026947": "5. Pagado 100 % — boleta emitida", "1437026948": "Perdido — registrar motivo",
    # PMI patrocinadores
    "1437026956": "1. Identificado", "1437026957": "2. Contactado", "1437026958": "3. Brochure enviado",
    "1437026959": "4. Reunión hecha", "1437026961": "6. Confirmado — OC/contrato firmado",
}
LIM_ACC = {"inst": 5, "persona": 3}
LIM_PEND = {"inst": 8, "persona": 3}


# ───────── lectura y escritura de la página ─────────

def leer_mapa(ruta):
    pagina = open(ruta, encoding="utf-8").read()
    m = PATRON_D.search(pagina)
    if not m:
        sys.exit(f"{ruta}: no encuentro `const D = {{...}};`")
    return pagina, m.span(1), json.loads(m.group(1))


def escribir_mapa(pagina, tramo, D, ruta):
    datos = json.dumps(D, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    open(ruta, "w", encoding="utf-8").write(pagina[:tramo[0]] + datos + pagina[tramo[1]:])


def cargar_hubspot(carpeta):
    negocios = {str(k): v for k, v in json.load(open(os.path.join(carpeta, "negocios.json"))).items()}
    objetos = {}
    for tipo in ("tareas", "notas", "correos", "reuniones"):
        objetos[tipo] = {}
        for ruta in sorted(glob.glob(os.path.join(carpeta, f"{tipo}*.json"))):
            for o in json.load(open(ruta))["objects"]:
                objetos[tipo][str(o["id"])] = o["properties"]
    return negocios, objetos


# ───────── reglas del mapa ─────────

def fecha_bogota(iso):
    if not iso:
        return ""
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")) - timedelta(hours=5)
    return dt.strftime("%Y-%m-%d")


LINEA_DEL_PIPELINE = {"946841908": "POK", "946748022": "POK", "946745948": "POK", "946841907": "merahki"}


def linea(p):
    if p["pipeline"] in LINEA_DEL_PIPELINE:
        return LINEA_DEL_PIPELINE[p["pipeline"]]
    if p["pipeline"] in ("934854468", "934854469", "934854467"):
        return "PMI"
    if p["pipeline"] == "917209518":
        return "Alianza"
    return {"credenciales_pok": "POK", "virtualizacion": "merahki", "mixto": "Mixto"}.get(
        p.get("linea_negocio") or "", "Sin clasificar")


def estado_y_paso(etapa, prob):
    m = re.match(r"(\d+)\.", etapa)
    paso = int(m.group(1)) if m else 0
    if etapa.startswith("Ganado") or prob >= 1:
        return "ganado", paso
    if etapa.startswith("Retomar"):
        return "retomar", 0
    if etapa.startswith(("Perdido", "Descartad")) or prob == 0:
        return "perdido", 0
    return "abierto", paso


def negocio_desde_hubspot(p, previo=None):
    previo = previo or {}
    etapa = ETAPAS.get(p["dealstage"], previo.get("etapa", ""))
    estado, paso = estado_y_paso(etapa, float(p.get("hs_deal_stage_probability") or 0))
    return {
        "id": previo.get("id", ""),
        "nombre": (p.get("dealname") or "").strip(),
        "etapa": etapa, "paso": paso,
        # En los pipelines por línea, la línea es la del pipeline. En los demás se
        # respeta la que el mapa ya tenía (algunos negocios mixtos se reclasificaron
        # a mano al generarlo); los nuevos la toman de HubSpot.
        "linea": linea(p) if p["pipeline"] in LINEA_DEL_PIPELINE else previo.get("linea") or linea(p),
        "estado": estado,
        "monto": float(p["amount"]) if p.get("amount") else 0.0,
        "cierre": fecha_bogota(p.get("closedate")),
        "prioridad": p.get("hs_priority") or "",
        "owner": DUENOS.get(p.get("hubspot_owner_id") or "", ("", ""))[0],
        "via": previo.get("via", ""), "cliente": previo.get("cliente", ""),
    }


def calor(ultimo, hoy):
    if not ultimo:
        return "sin"
    dias = (hoy - date.fromisoformat(ultimo)).days
    return "activo" if dias <= 30 else "tibio" if dias <= 90 else "frio"


def estado_inst(i):
    ds = i["deals"]
    if any(d["estado"] == "ganado" for d in ds):
        return "cliente"
    abiertos = [d for d in ds if d["estado"] == "abierto"]
    if any(d["paso"] >= 2 for d in abiertos):
        return "negociacion"
    if abiertos or any(d["estado"] == "retomar" for d in ds):
        return "prospeccion"
    return "contacto" if (i["ultimo"] or i["n_acc"]) else "sin_contacto"


def negocios_por_linea(deals):
    cuenta = {}
    for d in deals:
        por_estado = cuenta.setdefault(d["linea"], {})
        por_estado[d["estado"]] = por_estado.get(d["estado"], 0) + 1
    return cuenta


def grupo(linea_):
    return linea_ if linea_ in ("merahki", "POK") else "otros"


COMERCIALES = ("946841908", "946841907", "946748022", "946745948", "default", "929414991", "942303076")


def fuera_del_mapa(D, negocios, hasta=None):
    """Negocios de los pipelines comerciales que no cuelgan de ninguna institución
    del mapa (sin empresa o con una empresa sin actividad). El panel los cuenta.
    Con `hasta` (UTC) quedan solo los que ya existían en esa etapa a esa hora."""
    en_mapa = {d["id"] for i in D["instituciones"] for d in i["deals"]}
    lista = []
    for did, p in negocios.items():
        if did in en_mapa or p.get("pipeline") not in COMERCIALES:
            continue
        if hasta and max(p.get("createdate") or "", p.get("hs_v2_date_entered_current_stage") or "") > hasta:
            continue
        lista.append(negocio_desde_hubspot(p, {"id": did}))
    return lista


def kpis_pipeline(D, hoy, prob_etapa, fuera=()):
    """Cifras de pipeline del panel de control (las de actividad se conservan)."""
    unicos = {d["id"]: d for d in fuera}
    for i in D["instituciones"]:
        for d in i["deals"]:
            unicos[d["id"]] = d
    mes_ini = (hoy.month - 1) // 3 * 3 + 1
    sig_q = date(hoy.year + 1, 1, 1) if mes_ini == 10 else date(hoy.year, mes_ini + 3, 1)
    ini_q, fin_q = date(hoy.year, mes_ini, 1).isoformat(), (sig_q - timedelta(days=1)).isoformat()
    G = ("merahki", "POK", "otros")
    k = {c: {g: 0.0 for g in G} for c in ("ganado_q4", "pipeline_bruto", "pipeline_ponderado",
                                           "pipeline_en_cierre", "pronostico_fechas")}
    k["n_cierre_q4"] = {g: 0 for g in G}
    k["fechas_cierre"] = {"vigente": 0, "vencida": 0, "sin_fecha": 0}
    for d in unicos.values():
        g = grupo(d["linea"])
        en_q = bool(d["cierre"]) and ini_q <= d["cierre"] <= fin_q
        if d["estado"] == "ganado" and en_q:
            k["ganado_q4"][g] += d["monto"]
        if d["estado"] != "abierto" or d["paso"] < 2:
            continue
        ponderado = d["monto"] * prob_etapa.get(d["etapa"], 0.0)
        k["pipeline_bruto"][g] += d["monto"]
        k["pipeline_ponderado"][g] += ponderado
        if d["paso"] >= 4:
            k["pipeline_en_cierre"][g] += d["monto"]
        if en_q:
            k["n_cierre_q4"][g] += 1
            k["pronostico_fechas"][g] += ponderado
        if not d["cierre"]:
            k["fechas_cierre"]["sin_fecha"] += 1
        elif d["cierre"] < hoy.isoformat():
            k["fechas_cierre"]["vencida"] += 1
        else:
            k["fechas_cierre"]["vigente"] += 1
    for g in G:
        # el pronóstico del trimestre suma lo ya ganado
        k["pronostico_fechas"][g] += k["ganado_q4"][g]
    return k


def probabilidades(negocios):
    prob = {}
    for p in negocios.values():
        etapa = ETAPAS.get(p["dealstage"])
        if etapa and p.get("hs_deal_stage_probability") not in (None, ""):
            prob.setdefault(etapa, float(p["hs_deal_stage_probability"]))
    return prob


# ───────── acciones y pendientes ─────────

def texto(s, n=130):
    """Como el mapa: sin HTML, números largos (órdenes de compra, teléfonos)
    tapados y cortado en palabra completa (130 caracteres; 150 en notas)."""
    s = html_mod.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    s = re.sub(r"\d{7,}", "[número]", re.sub(r"\s+", " ", s).strip())
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


def accion(tipo_obj, oid, props, tipo, hoy):
    q = DUENOS.get(props.get("hubspot_owner_id") or "", ("", ""))[0]
    if tipo_obj == "nota":
        a = {"id": "no" + oid, "tipo": tipo or "Nota", "x": texto(props.get("hs_note_body"), 150)}
    elif tipo_obj == "correo":
        entrante = props.get("hs_email_direction") == "INCOMING_EMAIL"
        a = {"id": "em" + oid, "tipo": tipo or ("Correo recibido" if entrante else "Correo enviado"),
             "x": texto(props.get("hs_email_subject"))}
        q = "" if entrante else q
    elif tipo_obj == "reunion":
        a = {"id": "me" + oid, "tipo": tipo or "Reunión", "x": texto(props.get("hs_meeting_title"))}
    else:
        sys.exit(f"objeto desconocido: {tipo_obj}")
    f = fecha_bogota(props.get("hs_meeting_start_time") or props.get("hs_timestamp"))
    pend = tipo_obj == "reunion" and f >= hoy.isoformat()
    if pend:
        a["tipo"] = "Reunión programada"
    return {"id": a["id"], "tipo": a["tipo"], "f": f, "q": q, "x": a["x"], "pend": pend,
            "venc": False, "origen": "", "prio": ""}


def tarea(oid, props, hoy):
    f = fecha_bogota(props.get("hs_timestamp"))
    return {"id": "ta" + oid, "tipo": "Tarea", "f": f,
            "q": DUENOS.get(props.get("hubspot_owner_id") or "", ("", ""))[0],
            "x": texto(props.get("hs_task_subject")), "pend": True, "venc": f < hoy.isoformat(),
            "origen": "", "prio": "alta" if props.get("hs_task_priority") == "HIGH" else ""}


def poner_accion(ent, nivel, a, hoy):
    """Suma una acción (o reunión programada) a una persona o institución."""
    if a["pend"]:
        return poner_pendiente(ent, nivel, a)
    if any(x["id"] == a["id"] for x in ent["acciones"]):
        return False
    ent["acciones"].insert(0, a)
    ent["acciones"].sort(key=lambda x: x["f"], reverse=True)
    del ent["acciones"][LIM_ACC[nivel]:]
    ent["n_acc"] += 1
    if nivel == "persona":
        ent["n_inter"] += 1
    if a["f"] <= hoy.isoformat() and a["f"] > (ent["ultimo"] or ""):
        ent["ultimo"] = a["f"]
    return True


def poner_pendiente(ent, nivel, a):
    if any(x["id"] == a["id"] for x in ent["pendientes"]):
        return False
    ent["pendientes"].append(a)
    ent["pendientes"].sort(key=lambda x: x["f"])
    del ent["pendientes"][LIM_PEND[nivel]:]
    ent["n_pend"] += 1
    if nivel == "inst":
        ent["n_venc"] += a["venc"]
    return True


def refrescar_tareas(D, tareas, hoy, informe):
    """Tareas que ya están en el mapa: completadas, con nueva fecha o con otro texto."""
    insts = {i["id"]: i for i in D["instituciones"]}
    donde = {}
    for nivel, ents in (("inst", D["instituciones"]), ("persona", D["personas"])):
        for e in ents:
            for a in e["pendientes"]:
                if a["tipo"] == "Tarea":
                    donde.setdefault(a["id"], {})[(nivel, e["id"])] = e
                    if nivel == "persona":
                        # la tarea cuenta en su institución aunque allá no quepa en la lista
                        donde[a["id"]].setdefault(("inst", e["inst"]), insts[e["inst"]])
    for tid, ents in donde.items():
        props = tareas.get(tid[2:])
        if props is None:
            continue
        completa = props.get("hs_task_status") == "COMPLETED"
        nueva = tarea(tid[2:], props, hoy)
        antes = next(a for e in ents.values() for a in e["pendientes"] if a["id"] == tid)["venc"]
        for (nivel, _), e in ents.items():
            vieja = next((a for a in e["pendientes"] if a["id"] == tid), None)
            if vieja is None:
                # cuenta en su institución aunque no quepa en la lista visible
                e["n_pend"] -= completa
                e["n_venc"] -= antes if completa else antes - nueva["venc"]
                continue
            if completa:
                e["pendientes"].remove(vieja)
                e["n_pend"] -= 1
                if nivel == "inst":
                    e["n_venc"] -= vieja["venc"]
                informe.append(f"tarea completada {tid} · {e.get('nombre')}")
                continue
            if nueva["f"] != vieja["f"] or nueva["x"] != vieja["x"] or nueva["prio"] != vieja["prio"]:
                informe.append(f"tarea {tid} {vieja['f']}→{nueva['f']} · {e.get('nombre')}")
            if nivel == "inst":
                e["n_venc"] += nueva["venc"] - vieja["venc"]
            vieja.update({k: nueva[k] for k in ("f", "q", "x", "venc", "prio")})
            e["pendientes"].sort(key=lambda x: x["f"])


def refrescar_negocios(D, negocios, informe):
    nombres = {}
    for i in D["instituciones"]:
        for n, d in enumerate(i["deals"]):
            p = negocios.get(d["id"])
            if p is None:
                informe.append(f"negocio {d['id']} ya no está en HubSpot · {i['nombre']}")
                continue
            nuevo = negocio_desde_hubspot(p, d)
            cambios = [c for c in ("nombre", "etapa", "monto", "cierre", "owner", "prioridad") if nuevo[c] != d[c]]
            if cambios and d["id"] not in nombres:
                informe.append(f"negocio {d['id']} {d['nombre'][:60]}: "
                               + ", ".join(f"{c} {d[c]!r}→{nuevo[c]!r}" for c in cambios))
            if nuevo["linea"] != d["linea"] and d["id"] not in nombres:
                informe.append(f"negocio {d['id']} línea {d['linea']} → {nuevo['linea']}")
            nombres.setdefault(d["id"], (d["nombre"], nuevo))
            i["deals"][n] = nuevo
    return {viejo: (did, nuevo) for did, (viejo, nuevo) in nombres.items()}


def negocio_persona(d, p):
    return {"nombre": d["nombre"], "etapa": d["etapa"], "linea": d["linea"], "estado": d["estado"],
            "pipeline": PIPELINES.get(p["pipeline"], "")}


def refrescar_negocios_personas(D, por_nombre, negocios):
    # Los negocios que solo están en la ficha de una persona (sin empresa en el
    # mapa) se buscan en HubSpot por nombre, si el nombre es único.
    por_nombre_hs = {}
    for did, p in negocios.items():
        por_nombre_hs.setdefault((p.get("dealname") or "").strip(), []).append(did)
    for per in D["personas"]:
        for n, x in enumerate(per["negocios"]):
            if x["nombre"] in por_nombre:
                did, d = por_nombre[x["nombre"]]
            elif len(por_nombre_hs.get(x["nombre"], [])) == 1:
                did = por_nombre_hs[x["nombre"]][0]
                d = negocio_desde_hubspot(negocios[did], {"linea": x["linea"]})
            else:
                continue
            nuevo = negocio_persona(d, negocios[did])
            per["negocios"][n] = {**nuevo, "pipeline": nuevo["pipeline"] or x["pipeline"]}


# ───────── delta ─────────

def aplicar_delta(D, delta, negocios, objetos, hoy, informe):
    insts = {i["id"]: i for i in D["instituciones"]}
    pers = {p["id"]: p for p in D["personas"]}
    for x in delta.get("instituciones", []):
        if x["id"] in insts:
            sys.exit(f"la institución {x['id']} ya está en el mapa")
        i = {"id": x["id"], "nombre": x["nombre"], "pais": x["pais"], "fuente_pais": x["fuente_pais"],
             "ciudad": x["ciudad"], "fuente_ciudad": x["fuente_ciudad"], "tipo": x["tipo"],
             "tier": x.get("tier", ""), "dominio": x.get("dominio", x["id"]), "estado": "", "ultimo": "",
             "calor": "sin", "empresas_hs": x["empresas_hs"], "negocios": {}, "deals": [],
             "responsable": x.get("responsable", ""), "fuente_responsable": x.get("fuente_responsable", ""),
             "empresa": x.get("empresa", False), "sin_nombre": 0, "buzones": [], "acciones": [], "n_acc": 0,
             "pendientes": [], "n_pend": 0, "n_venc": 0, "n_fuera": 0}
        insts[i["id"]] = i
        pos = next((n for n, y in enumerate(D["instituciones"]) if orden(y["nombre"]) > orden(i["nombre"])),
                   len(D["instituciones"]))
        D["instituciones"].insert(pos, i)
        informe.append(f"institución nueva {i['nombre']}")
    for x in delta.get("personas", []):
        if x["id"] in pers:
            sys.exit(f"la persona {x['id']} ya está en el mapa")
        if x["inst"] not in insts:
            sys.exit(f"la persona {x['nombre']} apunta a {x['inst']}, que no está en el mapa")
        corto, completo = DUENOS.get(x.get("owner") or "", ("", ""))
        p = {"id": x["id"], "ids": [x["id"]], "nombre": x["nombre"], "inst": x["inst"],
             "cargo": x.get("cargo", ""), "fuente_cargo": x.get("fuente_cargo", ""),
             "unidad": x.get("unidad", "Unidad por identificar"), "fuente_unidad": x.get("fuente_unidad", ""),
             "nivel": x.get("nivel", "Sin cargo"), "fuente_nivel": x.get("fuente_nivel", ""),
             "etapa": x.get("etapa", "Lead"), "ultimo": "", "calor": "sin", "owner": completo,
             "owner_corto": corto, "negocios": [], "alertas": [], "n_inter": 0, "n_fuera": 0,
             "acciones": [], "n_acc": 0, "pendientes": [], "n_pend": 0}
        pers[p["id"]] = p
        D["personas"].append(p)
        informe.append(f"persona nueva {p['nombre']} ({insts[p['inst']]['nombre']})")
    for x in delta.get("negocios", []):
        p = negocios[x["deal"]]
        d = negocio_desde_hubspot(p, {"id": x["deal"]})
        i, canal = insts.get(x.get("inst")), insts.get(x.get("canal"))
        if i and canal:
            d["via"] = canal["id"]
            c = next((c for c in D["canales"] if c["canal"] == canal["id"] and c["cliente"] == i["id"]), None)
            if c is None:
                c = {"canal": canal["id"], "cliente": i["id"], "negocios": []}
                D["canales"].append(c)
            if all(y["id"] != d["id"] for y in c["negocios"]):
                c["negocios"].append({"id": d["id"], "nombre": d["nombre"]})
            en_canal = next((y for y in canal["deals"] if y["id"] == d["id"]), None)
            if en_canal is None:
                canal["deals"].append({**d, "via": "", "cliente": i["id"]})
            else:
                en_canal["cliente"] = i["id"]
            informe.append(f"negocio {d['id']} en {canal['nombre']} con cliente final {i['nombre']}")
        if i and all(y["id"] != d["id"] for y in i["deals"]):
            i["deals"].append(d)
            informe.append(f"negocio {d['id']} → {i['nombre']}: {d['nombre'][:70]} ({d['etapa']})")
        for pid in x.get("personas", []):
            if all(y["nombre"] != d["nombre"] for y in pers[pid]["negocios"]):
                pers[pid]["negocios"].append(negocio_persona(d, p))
    tipos = {"nota": "notas", "correo": "correos", "reunion": "reuniones"}
    for x in delta.get("acciones", []):
        a = accion(x["objeto"], x["id"], objetos[tipos[x["objeto"]]][x["id"]], x.get("tipo"), hoy)
        poner_en(a, x, insts, pers, hoy, informe)
    for x in delta.get("tareas", []):
        props = objetos["tareas"][x["id"]]
        if props.get("hs_task_status") == "COMPLETED":
            continue
        poner_en(tarea(x["id"], props, hoy), x, insts, pers, hoy, informe)
    if "excluidas" in delta:
        D["excluidas"] = delta["excluidas"]


def orden(nombre):
    return "".join(c for c in unicodedata.normalize("NFD", nombre) if not unicodedata.combining(c)).casefold()


def poner_en(a, x, insts, pers, hoy, informe):
    puesta = set()
    for pid in x.get("personas", []):
        p = pers[pid]
        poner_accion(p, "persona", dict(a), hoy)
        if p["inst"] not in puesta:
            poner_accion(insts[p["inst"]], "inst", {**a, "con": p["nombre"]}, hoy)
            puesta.add(p["inst"])
    for iid in x.get("inst", []):
        if iid not in puesta:
            poner_accion(insts[iid], "inst", {**a, "con": ""}, hoy)
            puesta.add(iid)
    informe.append(f"{a['tipo']} {a['f']} {a['id']} → {', '.join(insts[i]['nombre'] for i in puesta)}")


# ───────── recálculo y verificación ─────────

def recalcular(D, hoy, negocios):
    for i in D["instituciones"]:
        i["negocios"] = negocios_por_linea(i["deals"])
        i["estado"] = estado_inst(i)
    for e in D["instituciones"] + D["personas"]:
        e["calor"] = calor(e["ultimo"], hoy)
    D["kpis"].update(kpis_pipeline(D, hoy, probabilidades(negocios), fuera_del_mapa(D, negocios)))


def verificar(D, negocios):
    hoy = date.fromisoformat(D["descargado"][:10])
    hoy_kpi = date.fromisoformat(D["kpis"]["generado"][:10])
    utc = (datetime.fromisoformat(D["descargado"]) + timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M")
    prob_etapa = probabilidades(negocios)
    fuera = fuera_del_mapa(D, negocios, hasta=utc)
    malos = []
    for i in D["instituciones"]:
        if negocios_por_linea(i["deals"]) != i["negocios"]:
            malos.append(f"negocios {i['id']}")
        if estado_inst(i) != i["estado"]:
            malos.append(f"estado {i['id']}: {i['estado']} → {estado_inst(i)}")
    for e in D["instituciones"] + D["personas"]:
        if calor(e["ultimo"], hoy) != e["calor"]:
            malos.append(f"calor {e['id']}: {e['calor']} → {calor(e['ultimo'], hoy)}")
    k = kpis_pipeline(D, hoy_kpi, prob_etapa, fuera)
    for c, v in k.items():
        orig = D["kpis"][c]
        if any(abs(v[g] - orig[g]) > 0.5 for g in v):
            malos.append(f"kpi {c}: mapa {orig} · script {v}")
    return malos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mapa")
    ap.add_argument("--verificar", action="store_true")
    ap.add_argument("--hubspot")
    ap.add_argument("--delta")
    ap.add_argument("--hoy")
    ap.add_argument("--descargado")
    ap.add_argument("-o", "--salida")
    ap.add_argument("--plantilla", help="página del mapa sin datos (código vigente) para la salida")
    args = ap.parse_args()
    pagina, tramo, D = leer_mapa(args.mapa)
    if args.verificar:
        if not args.hubspot:
            ap.error("--verificar necesita --hubspot (probabilidades por etapa y negocios fuera del mapa)")
        malos = verificar(D, cargar_hubspot(args.hubspot)[0])
        print("\n".join(malos) or "Las reglas del script reproducen la foto del mapa.")
        sys.exit(1 if malos else 0)
    if not (args.hubspot and args.hoy and args.descargado and args.salida):
        ap.error("para sincronizar hacen falta --hubspot, --hoy, --descargado y -o")
    hoy = date.fromisoformat(args.hoy)
    negocios, objetos = cargar_hubspot(args.hubspot)
    informe = []
    por_nombre = refrescar_negocios(D, negocios, informe)
    refrescar_negocios_personas(D, por_nombre, negocios)
    refrescar_tareas(D, objetos["tareas"], hoy, informe)
    if args.delta:
        aplicar_delta(D, json.load(open(args.delta)), negocios, objetos, hoy, informe)
    recalcular(D, hoy, negocios)
    D["generado"] = D["descargado"] = D["kpis"]["generado"] = args.descargado
    if args.plantilla:
        pagina, tramo, _ = leer_mapa(args.plantilla)
    escribir_mapa(pagina, tramo, D, args.salida)
    print("\n".join(informe))


if __name__ == "__main__":
    main()
