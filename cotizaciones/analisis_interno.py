"""Hoja «Análisis Interno» de una cotización de merahki.ai, con las reglas de la regla 24.

Uso:
    python cotizaciones/analisis_interno.py escenario.json salida.xlsx [--cliente hoja_cliente.xlsx]

- `escenario.json` describe la cotización: opciones, líneas con horas por perfil, jornadas,
  terceros, precio de lista o descuento, y los textos de decisiones, flags y supuestos.
- Si se pasa `--cliente`, la hoja interna se agrega a ese libro (que trae la «Propuesta Comercial»)
  y se verifica que la hoja cliente no tenga valores por producto y que su valor final coincida.
- El script se niega a escribir el archivo si alguna verificación falla (sale con código 1).

Todas las cifras clave van como números en celdas y las derivadas como fórmulas, para que el
análisis se pueda auditar y recalcular en Google Sheets.
"""
import json
import math
import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------- estilo merahki (tema oscuro)
BG, BAND, LBL, R1, R2 = "0A0A12", "2D1B69", "111118", "1C1C2E", "14141F"
BORDER, TXT, PURPLE, PINK, AMBER = "2A2A3A", "B3B3B3", "7C5CFC", "E879A8", "F59E0B"
MUTED, WHITE, RED, REDBG, GREEN, BLUE = "666666", "FFFFFF", "F87171", "2E0F0F", "34D399", "60A5FA"
THIN = Border(*(Side("thin", color=BORDER),) * 4)
SECT = Border(bottom=Side("medium", color=PURPLE))
MONEY, PCT, NUM = "#,##0;-#,##0", "0.0%", "#,##0.0"


def _f(c):
    return PatternFill("solid", fgColor=c)


def _font(sz=10, b=False, color=TXT):
    return Font(name="Arial", size=sz, bold=b, color=color)


def up(x, step=50000):
    return int(math.ceil(round(x, 6) / step) * step)


# ---------------------------------------------------------------- escenario
REQUERIDOS = ["codigo", "version", "cliente", "proyecto", "fecha", "carril", "tarifas_reales", "tarifas_modelo",
              "jornada", "parametros", "opciones", "decisiones", "flags", "supuestos"]
PARAMS = ["margen_lista", "margen_competitivo", "margen_piso", "contrib_min", "recargo_terceros", "comision", "ica",
          "gmf", "iva", "retenciones", "capa2"]


def validar_escenario(esc):
    """Falla con un mensaje claro si al escenario le falta algo que la regla 24 exige."""
    errores = [f"falta «{k}»" for k in REQUERIDOS if k not in esc]
    errores += [f"falta parametros.{k}" for k in PARAMS if k not in esc.get("parametros", {})]
    for tabla in ("tarifas_reales", "tarifas_modelo"):
        for k, v in (esc.get(tabla) or {}).items():
            if not isinstance(v, (int, float)) or v <= 0:
                errores.append(f"{tabla}.{k} debe ser un número tomado de la hoja Tarifas del modelo vigente")
    if set(esc.get("tarifas_reales", {})) != set(esc.get("tarifas_modelo", {})):
        errores.append("tarifas_reales y tarifas_modelo deben traer los mismos perfiles")
    for op in esc.get("opciones", []):
        if not op.get("lineas"):
            errores.append(f"la opción «{op.get('nombre')}» no tiene líneas")
        for ln in op.get("lineas", []):
            extra = set(ln.get("horas", {})) - set(esc.get("tarifas_reales", {}))
            if extra:
                errores.append(f"«{ln.get('nombre')}» usa perfiles sin tarifa: {sorted(extra)}")
        if (op.get("descuento_pct", 0) or op.get("margen_objetivo") is not None) and not esc.get("decisiones"):
            errores.append(f"la opción «{op.get('nombre')}» tiene descuento sin decisión escrita")
    if errores:
        raise SystemExit("Escenario incompleto:\n- " + "\n- ".join(errores))


# ---------------------------------------------------------------- cálculo
def calcular(esc):
    """Costo real por capa, costo del modelo, banda y precio cobrado de cada opción."""
    p = esc["parametros"]
    real, mod, jor = esc["tarifas_reales"], esc["tarifas_modelo"], esc["jornada"]
    capa2 = set(p["capa2"])
    out = []
    for op in esc["opciones"]:
        perf = {k: 0.0 for k in real}
        jornadas = terceros = lista = comp = piso = 0
        lineas = []
        for ln in op["lineas"]:
            h, j, t = ln["horas"], ln.get("jornadas", 0), ln.get("terceros_cop", 0)
            for k, v in h.items():
                perf[k] += v
            jornadas += j
            terceros += t
            own_r = sum(v * real[k] for k, v in h.items()) + j * jor
            own_m = sum(v * mod[k] for k, v in h.items()) + j * jor
            lista += up(own_m / (1 - p["margen_lista"]) + t * (1 + p["recargo_terceros"]))
            comp += up(own_r / (1 - p["margen_competitivo"]) + t * (1 + p["recargo_terceros"]))
            piso += up(own_r / (1 - p["margen_piso"]) + t * (1 + p["recargo_terceros"]))
            lineas.append(dict(nombre=ln["nombre"], cantidad=ln.get("cantidad", ""), costo_real=own_r + t,
                               horas=sum(h.values())))
        costo_perfil = {k: perf[k] * real[k] for k in real}
        capa1 = sum(v for k, v in costo_perfil.items() if k not in capa2)
        capa2c = sum(v for k, v in costo_perfil.items() if k in capa2)
        estudio = jornadas * jor
        costo_real = capa1 + capa2c + estudio + terceros
        costo_modelo = sum(perf[k] * mod[k] for k in mod) + estudio + terceros
        precio_lista = op.get("precio_lista") or lista
        if op.get("margen_objetivo") is not None:
            # precio fijado por un margen sobre el costo real (decisión de David): costo ÷ (1 − margen), hacia arriba a 50.000
            precio = up((costo_real - terceros) / (1 - op["margen_objetivo"]) + terceros * (1 + p["recargo_terceros"])) \
                if op.get("margen_objetivo_con_recargo") else up(costo_real / (1 - op["margen_objetivo"]))
            dcto = 1 - precio / precio_lista
        else:
            dcto = op.get("descuento_pct", 0) / 100
            precio = round(precio_lista * (1 - dcto))
        out.append(dict(nombre=op["nombre"], perf=perf, costo_perfil=costo_perfil, jornadas=jornadas, terceros=terceros,
                        capa1=capa1, capa2=capa2c, estudio=estudio, costo_real=costo_real, costo_modelo=costo_modelo,
                        lista_modelo=lista, competitivo=comp, piso=piso, precio_lista=precio_lista, dcto=dcto,
                        precio=precio, lineas=lineas, semanas=op.get("semanas", 8)))
    return out


# ---------------------------------------------------------------- verificaciones de la regla 24
def verificar(esc, res, cliente_xlsx=None):
    p = esc["parametros"]
    checks = []

    def chk(nombre, ok, detalle=""):
        checks.append((nombre, bool(ok), detalle))

    for r in res:
        n = r["nombre"]
        suma = r["capa1"] + r["capa2"] + r["estudio"] + r["terceros"]
        chk(f"{n}: capa 1 + capa 2 + estudio + terceros = costo real", abs(suma - r["costo_real"]) < 1)
        chk(f"{n}: costo por perfil suma lo mismo que el costo por producto",
            abs(sum(l["costo_real"] for l in r["lineas"]) - r["costo_real"]) < 1)
        mb = (r["precio"] - r["costo_real"]) / r["precio"]
        exc = esc.get("excepcion_piso")
        chk(f"{n}: margen real ≥ piso del {p['margen_piso']:.0%} (o excepción escrita de David)",
            mb >= p["margen_piso"] or bool(exc), f"margen real {mb:.1%}" + (f" · EXCEPCIÓN: {exc}" if mb < p["margen_piso"] and exc else ""))
        chk(f"{n}: banda calculada (lista ≥ competitivo ≥ piso)", r["lista_modelo"] >= r["competitivo"] >= r["piso"] > 0)
        if r["dcto"] > 0:
            chk(f"{n}: el descuento tiene decisión escrita", bool(esc.get("decisiones")))
    if cliente_xlsx:
        ws = openpyxl.load_workbook(cliente_xlsx).worksheets[0]
        grandes = [c.value for row in ws.iter_rows() for c in row if isinstance(c.value, (int, float)) and abs(c.value) >= 1000]
        esperados = set()
        for r in res:
            lista_iva = round(r["precio_lista"] * (1 + p["iva"]))
            total = r["precio"] + round(r["precio"] * p["iva"])
            esperados |= {lista_iva, -(lista_iva - total), total}
        extra = [v for v in grandes if v not in esperados]
        chk("Hoja cliente: sin valores por producto (solo valores del proyecto)", not extra, f"valores no esperados: {extra[:5]}")
        for r in res:
            total = r["precio"] + round(r["precio"] * p["iva"])
            chk(f"Hoja cliente: muestra el valor final de {r['nombre']} ({total:,.0f})", total in grandes)
    return checks


# ---------------------------------------------------------------- hoja
class Hoja:
    def __init__(self, ws, widths):
        self.ws, self.r, self.widths = ws, 0, widths
        self.cols = [get_column_letter(i) for i in range(1, len(widths) + 1)]
        for c, w in zip(self.cols, widths):
            ws.column_dimensions[c].width = w
        ws.sheet_view.showGridLines = False

    def fila(self, h=None, bg=BG):
        self.r += 1
        for c in self.cols:
            self.ws[f"{c}{self.r}"].fill = _f(bg)
        if h:
            self.ws.row_dimensions[self.r].height = h
        return self.r

    def put(self, ref, v, sz=10, b=False, color=TXT, bg=None, al="left", fmt=None, border=True, wrap=True):
        c = self.ws[ref]
        c.value = v
        c.font = _font(sz, b, color)
        if bg:
            c.fill = _f(bg)
        c.alignment = Alignment(horizontal=al, vertical="center", wrap_text=wrap)
        if border:
            c.border = THIN
        if fmt:
            c.number_format = fmt
        return c

    def merge(self, a, b, r=None):
        r = r or self.r
        self.ws.merge_cells(f"{a}{r}:{b}{r}")

    def seccion(self, titulo, nota=None):
        self.fila(8)
        r = self.fila(22)
        self.put(f"B{r}", titulo, 12, True, PURPLE, BG, border=False)
        for c in self.cols[1:-1]:
            self.ws[f"{c}{r}"].border = SECT
        self.merge("B", self.cols[-2])
        if nota:
            r = self.fila(self._alto(nota, 120, 9))
            self.put(f"B{r}", nota, 9, False, MUTED, BG, border=False)
            self.merge("B", self.cols[-2])

    @staticmethod
    def _alto(txt, ancho, sz):
        cpl = ancho * (1.18 if sz <= 9 else 1.05)
        return round(max(1, sum(math.ceil(len(p) / cpl) or 1 for p in str(txt).split("\n"))) * (12.5 if sz <= 9 else 13.5) + 7, 1)


def construir(esc, res, checks, wb):
    p = esc["parametros"]
    ws = wb.create_sheet("Análisis Interno")
    n = len(res)
    oc = [get_column_letter(3 + i) for i in range(n)]          # columnas de las opciones
    widths = [3, 50] + [19] * max(n, 5) + [34, 3]
    H = Hoja(ws, widths)
    last = H.cols[-2]
    note = H.cols[-2]
    nfirst = get_column_letter(3 + n)                         # la nota ocupa desde aquí hasta `note`
    nwidth = sum(widths[2 + n:-1])

    r = H.fila(28, REDBG)
    H.put(f"A{r}", "⚠ DOCUMENTO INTERNO — NO COMPARTIR CON CLIENTE", 13, True, RED, REDBG, "center", border=False)
    H.merge("A", H.cols[-1])
    r = H.fila(20)
    H.put(f"B{r}", f"{esc['codigo']} {esc['version']} · {esc['cliente']} · {esc['proyecto']} · {esc['fecha']} · carril {esc['carril']}", 10, True, WHITE, BG, border=False)
    H.merge("B", last)

    def header(*titulos, h=34):
        r = H.fila(h)
        for col, t in titulos:
            if col == note and nfirst != note:
                H.put(f"{nfirst}{r}", t, 10, True, WHITE, BAND, "center")
                for c in H.cols[3 + n:-1]:
                    H.put(f"{c}{r}", None, bg=BAND)
                H.merge(nfirst, note, r)
            else:
                H.put(f"{col}{r}", t, 10, True, WHITE, BAND, "center" if col != "B" else "left")
        return r

    def fila_val(etq, valores, fmt=MONEY, b=False, color=TXT, bg=R1, nota="", etq_color=None, sz=10):
        r = H.fila(max(22, H._alto(nota, nwidth, 9)) if nota else 22)
        H.put(f"B{r}", etq, sz, b, etq_color or (WHITE if b else TXT), bg)
        for col, v in zip(oc, valores):
            H.put(f"{col}{r}", v, sz, b, color, bg, "right", fmt)
        H.put(f"{nfirst}{r}", nota, 9, False, MUTED, bg)
        for col in H.cols[3 + n:-1]:
            H.put(f"{col}{r}", None, bg=bg)
        if nfirst != note:
            H.merge(nfirst, note, r)
        return r

    # ------------------------------------------------ 1 · resumen del negocio
    H.seccion("1 · RESUMEN DEL NEGOCIO: COBRADO, COSTO Y GANANCIA",
              "Precio sin IVA: el IVA no es ingreso de merahki, se cobra y se paga a la DIAN. Costo real = capa 1 (producción a tarifa freelance) "
              "+ capa 2 (dirección y gerencia a lo que hoy cuestan) + jornadas de estudio + terceros.")
    header(("B", "Concepto (COP)"), *[(c, r_["nombre"]) for c, r_ in zip(oc, res)], (note, "Cómo se calcula / umbral"))
    R = {}
    R["lista"] = fila_val("Precio de lista (sin IVA)", [r_["precio_lista"] for r_ in res], nota="Lista del modelo: costo del modelo ÷ 0,40 + terceros × 1,2, por línea, redondeado a 50.000")
    R["dpct"] = fila_val("Descuento", [r_["dcto"] for r_ in res], PCT, nota="Solo con decisión de David escrita (ver sección 7)")
    R["dval"] = fila_val("Valor del descuento", [f"=-{c}{R['lista']}*{c}{R['dpct']}" for c in oc], color=PINK)
    R["precio"] = fila_val("PRECIO COBRADO AL CLIENTE (sin IVA) = ingreso de merahki", [f"=ROUND({c}{R['lista']}+{c}{R['dval']},0)" for c in oc], b=True, color=WHITE, bg=BAND)
    R["iva"] = fila_val("IVA 19 % (no es ingreso)", [f"=ROUND({c}{R['precio']}*{p['iva']},0)" for c in oc], color=MUTED)
    R["total"] = fila_val("Total que paga el cliente (con IVA)", [f"={c}{R['precio']}+{c}{R['iva']}" for c in oc], nota="Debe ser igual al valor final de la hoja cliente")
    # placeholders: se llenan después con referencias a la sección 2
    R["c1"] = fila_val("Capa 1 · producción a tarifa freelance (DI, AV, MM, DEV)", [0] * n)
    R["c2"] = fila_val("Capa 2 · dirección y gerencia a costo real (DIR, PM)", [0] * n)
    R["est"] = fila_val("Jornadas de estudio", [0] * n)
    R["ter"] = fila_val("Terceros (licencias y servicios)", [0] * n)
    R["creal"] = fila_val("COSTO REAL DEL PROYECTO", [f"=SUM({c}{R['c1']}:{c}{R['ter']})" for c in oc], b=True, color=WHITE, bg=LBL)
    R["ub"] = fila_val("UTILIDAD BRUTA (cobrado − costo real)", [f"={c}{R['precio']}-{c}{R['creal']}" for c in oc], b=True, color=GREEN, bg=LBL)
    R["mb"] = fila_val("MARGEN BRUTO REAL", [f"={c}{R['ub']}/{c}{R['precio']}" for c in oc], PCT, b=True, color=GREEN, bg=LBL,
                       nota=f"Piso {p['margen_piso']:.0%} (debajo no se firma) · competitivo {p['margen_competitivo']:.0%}")
    var = p["comision"] + p["ica"] + p["gmf"]
    R["var"] = fila_val(f"Costos variables ({var:.1%}: comisión {p['comision']:.0%}, ICA {p['ica']:.1%}, GMF {p['gmf']:.1%})",
                        [f"=ROUND({c}{R['precio']}*{var},0)" for c in oc], color=PINK)
    R["up"] = fila_val("GANANCIA DEL PROYECTO (utilidad bruta − variables)", [f"={c}{R['ub']}-{c}{R['var']}" for c in oc], b=True, color=GREEN, bg=BAND)
    R["mc"] = fila_val("MARGEN DE CONTRIBUCIÓN", [f"={c}{R['up']}/{c}{R['precio']}" for c in oc], PCT, b=True, color=GREEN, bg=BAND)
    R["cc"] = fila_val("Contribución en caja (sin la capa 2, que ya es costo fijo)",
                       [f"=({c}{R['precio']}-{c}{R['c1']}-{c}{R['ter']}-{c}{R['var']})/{c}{R['precio']}" for c in oc], PCT,
                       nota="La métrica de caja del modelo: (precio − capa 1 − terceros − variables) ÷ precio")
    R["cmod"] = fila_val("Costo del modelo (referencia de la lista)", [r_["costo_modelo"] for r_ in res], color=MUTED)
    R["mmod"] = fila_val("Margen sobre el costo del modelo", [f"=({c}{R['precio']}-{c}{R['cmod']})/{c}{R['precio']}" for c in oc], PCT, color=MUTED,
                         nota=f"La lista deja {p['margen_lista']:.0%} sobre este costo")

    # ------------------------------------------------ 2 · costo por perfil
    H.seccion("2 · COSTO REAL POR PERFIL (horas × costo real por hora)")
    hdr = [("B", "Perfil")] + [(get_column_letter(3 + i), f"Horas · {r_['nombre']}") for i, r_ in enumerate(res)]
    tcol = get_column_letter(3 + n)
    ccols = [get_column_letter(4 + n + i) for i in range(n)]
    if 4 + 2 * n - 1 > len(widths) - 2:
        raise SystemExit("Demasiadas opciones para el ancho de la hoja")
    hdr += [(tcol, "Costo real por hora")] + [(cc, f"Costo · {r_['nombre']}") for cc, r_ in zip(ccols, res)]
    header(*hdr)
    nombres = {"DIR": "DIR · dirección (capa 2)", "PM": "PM · gerencia (capa 2)", "DI": "DI · diseño instruccional (capa 1)",
               "AV": "AV · producción audiovisual (capa 1)", "MM": "MM · multimedia (capa 1)", "DEV": "DEV · desarrollo (capa 1)"}
    rows = {}
    for i, k in enumerate(esc["tarifas_reales"]):
        r = H.fila(22)
        bg = R1 if i % 2 == 0 else R2
        H.put(f"B{r}", nombres.get(k, k), 10, False, TXT, bg)
        for j, r_ in enumerate(res):
            H.put(f"{get_column_letter(3 + j)}{r}", r_["perf"][k], 10, False, TXT, bg, "right", NUM)
        H.put(f"{tcol}{r}", esc["tarifas_reales"][k], 10, False, BLUE, bg, "right", MONEY)
        for j, cc in enumerate(ccols):
            H.put(f"{cc}{r}", f"={get_column_letter(3 + j)}{r}*{tcol}{r}", 10, False, WHITE, bg, "right", MONEY)
        rows[k] = r
    r = H.fila(22)
    H.put(f"B{r}", "Jornadas de estudio (unidades × costo por jornada)", 10, False, TXT, R1)
    for j, r_ in enumerate(res):
        H.put(f"{get_column_letter(3 + j)}{r}", r_["jornadas"], 10, False, TXT, R1, "right", NUM)
    H.put(f"{tcol}{r}", esc["jornada"], 10, False, BLUE, R1, "right", MONEY)
    for j, cc in enumerate(ccols):
        H.put(f"{cc}{r}", f"={get_column_letter(3 + j)}{r}*{tcol}{r}", 10, False, WHITE, R1, "right", MONEY)
    rows["jor"] = r
    r = H.fila(22)
    H.put(f"B{r}", "Terceros (COP, a precio de lista público)", 10, False, TXT, R2)
    for j, r_ in enumerate(res):
        H.put(f"{get_column_letter(3 + j)}{r}", None, bg=R2)
        H.put(f"{ccols[j]}{r}", round(r_["terceros"]), 10, False, WHITE, R2, "right", MONEY)
    H.put(f"{tcol}{r}", None, bg=R2)
    rows["ter"] = r
    r = H.fila(22)
    H.put(f"B{r}", "Total", 10, True, WHITE, LBL)
    for j in range(n):
        hc = get_column_letter(3 + j)
        H.put(f"{hc}{r}", f"=SUM({hc}{rows['DIR']}:{hc}{rows['DEV']})", 10, True, WHITE, LBL, "right", NUM)
        H.put(f"{ccols[j]}{r}", f"=SUM({ccols[j]}{rows['DIR']}:{ccols[j]}{rows['ter']})", 10, True, WHITE, LBL, "right", MONEY)
    H.put(f"{tcol}{r}", None, bg=LBL)
    rows["tot"] = r
    # enlaza el resumen con esta tabla
    capa2 = set(p["capa2"])
    for j, c in enumerate(oc):
        cc = ccols[j]
        c1 = "+".join(f"{cc}{rows[k]}" for k in esc["tarifas_reales"] if k not in capa2)
        c2 = "+".join(f"{cc}{rows[k]}" for k in esc["tarifas_reales"] if k in capa2)
        ws[f"{c}{R['c1']}"].value = f"={c1}"
        ws[f"{c}{R['c2']}"].value = f"={c2}"
        ws[f"{c}{R['est']}"].value = f"={cc}{rows['jor']}"
        ws[f"{c}{R['ter']}"].value = f"={cc}{rows['ter']}"

    # ------------------------------------------------ 3 · banda de precio
    H.seccion("3 · BANDA DE PRECIO Y POSICIÓN DEL PRECIO COBRADO",
              f"Lista: {p['margen_lista']:.0%} sobre el costo del modelo (siempre en carril C). Competitivo: {p['margen_competitivo']:.0%} sobre el costo real, con motivo escrito, nunca en carril C. "
              f"Piso: {p['margen_piso']:.0%} sobre el costo real, solo carril A privado con autorización. Regla 23.")
    header(("B", "Concepto (COP, sin IVA)"), *[(c, r_["nombre"]) for c, r_ in zip(oc, res)], (note, "Lectura"))
    R["bl"] = fila_val("Lista del modelo", [r_["lista_modelo"] for r_ in res])
    R["bc"] = fila_val("Competitivo", [r_["competitivo"] for r_ in res])
    R["bp"] = fila_val("Piso (debajo no se firma)", [r_["piso"] for r_ in res])
    R["col"] = fila_val("Colchón del precio cobrado sobre el piso", [f"={c}{R['precio']}-{c}{R['bp']}" for c in oc], color=GREEN)
    fila_val("Posición del precio cobrado",
             [f'=IF({c}{R["precio"]}>={c}{R["bl"]},"En lista",IF({c}{R["precio"]}>={c}{R["bc"]},"Entre competitivo y lista",IF({c}{R["precio"]}>={c}{R["bp"]},"Entre piso y competitivo","BAJO EL PISO")))' for c in oc],
             fmt=None, color=AMBER)

    # ------------------------------------------------ 4 · semáforo
    H.seccion("4 · SEMÁFORO (umbrales de la política de precio)")
    header(("B", "Regla"), *[(c, r_["nombre"]) for c, r_ in zip(oc, res)], (note, "Umbral"))
    def sem(etq, cond, umbral):
        fila_val(etq, [f'=IF({cond(c)},"✓ Cumple","✗ NO CUMPLE")' for c in oc], fmt=None, color=WHITE, nota=umbral)
    sem("Margen bruto real ≥ piso", lambda c: f"{c}{R['mb']}>={p['margen_piso']}", f"{p['margen_piso']:.0%}: debajo no se firma")
    sem("Margen de contribución ≥ piso de entrada estratégica", lambda c: f"{c}{R['mc']}>={p['contrib_min']}", f"{p['contrib_min']:.0%}")
    sem("Margen bruto real ≥ competitivo", lambda c: f"{c}{R['mb']}>={p['margen_competitivo']}", f"{p['margen_competitivo']:.0%}: si no cumple, la baja necesita motivo")
    sem("Precio cobrado ≥ piso de la banda", lambda c: f"{c}{R['precio']}>={c}{R['bp']}", "Regla 23")

    # ------------------------------------------------ 5 · costo por producto
    H.seccion("5 · COSTO REAL POR PRODUCTO Y PRECIO IMPLÍCITO",
              "Precio implícito = reparto interno del precio cobrado según el costo de cada producto. Sirve para saber cuánto deja cada producto; nunca va a la hoja cliente (regla 15).")
    hdr = [("B", "Producto")]
    for j, r_ in enumerate(res):
        hdr += [(get_column_letter(3 + 2 * j), f"Costo real · {r_['nombre']}"), (get_column_letter(4 + 2 * j), f"Precio implícito · {r_['nombre']}")]
    header(*hdr)
    todos = []
    for r_ in res:
        for l in r_["lineas"]:
            if l["nombre"] not in todos:
                todos.append(l["nombre"])
    first = H.r + 1
    for i, nom in enumerate(todos):
        r = H.fila(22)
        bg = R1 if i % 2 == 0 else R2
        H.put(f"B{r}", nom, 9, False, TXT, bg)
        for j, r_ in enumerate(res):
            cc, pc = get_column_letter(3 + 2 * j), get_column_letter(4 + 2 * j)
            l = next((x for x in r_["lineas"] if x["nombre"] == nom), None)
            if l:
                H.put(f"{cc}{r}", round(l["costo_real"]), 9, False, TXT, bg, "right", MONEY)
                H.put(f"{pc}{r}", f"={cc}{r}/{cc}$TOT$*{oc[j]}{R['precio']}", 9, False, WHITE, bg, "right", MONEY)
            else:
                H.put(f"{cc}{r}", "—", 9, False, MUTED, bg, "right")
                H.put(f"{pc}{r}", "—", 9, False, MUTED, bg, "right")
    lastp = H.r
    r = H.fila(22)
    H.put(f"B{r}", "Total", 10, True, WHITE, LBL)
    for j in range(n):
        cc, pc = get_column_letter(3 + 2 * j), get_column_letter(4 + 2 * j)
        H.put(f"{cc}{r}", f"=SUM({cc}{first}:{cc}{lastp})", 10, True, WHITE, LBL, "right", MONEY)
        H.put(f"{pc}{r}", f"=SUM({pc}{first}:{pc}{lastp})", 10, True, WHITE, LBL, "right", MONEY)
    for row in ws.iter_rows(min_row=first, max_row=lastp):
        for c in row:
            if isinstance(c.value, str) and "$TOT$" in c.value:
                c.value = c.value.replace("$TOT$", f"${r}")

    # ------------------------------------------------ 6 · sensibilidad y caja
    H.seccion("6 · SENSIBILIDAD A LAS HORAS Y FLUJO DE CAJA",
              "Si las horas reales superan las estimadas, el costo de capa 1 y capa 2 sube en la misma proporción; estudio y terceros no cambian.")
    hdr = [("B", "Escenario")]
    for j, r_ in enumerate(res):
        hdr += [(get_column_letter(3 + 2 * j), f"Margen real · {r_['nombre']}"), (get_column_letter(4 + 2 * j), f"Ganancia · {r_['nombre']}")]
    header(*hdr)
    for i, x in enumerate([0, 0.1, 0.2, 0.3]):
        r = H.fila(22)
        bg = R1 if i % 2 == 0 else R2
        H.put(f"B{r}", f"Horas +{x:.0%}" if x else "Horas estimadas", 10, False, TXT, bg)
        for j, c in enumerate(oc):
            costo = f"(({c}{R['c1']}+{c}{R['c2']})*{1 + x}+{c}{R['est']}+{c}{R['ter']})"
            H.put(f"{get_column_letter(3 + 2 * j)}{r}", f"=({c}{R['precio']}-{costo})/{c}{R['precio']}", 10, False, WHITE, bg, "right", PCT)
            H.put(f"{get_column_letter(4 + 2 * j)}{r}", f"={c}{R['precio']}-{costo}-{c}{R['var']}", 10, False, WHITE, bg, "right", MONEY)
    fila_val("Horas extra que aguanta antes del piso",
             [f"=({c}{R['precio']}*(1-{p['margen_piso']})-{c}{R['est']}-{c}{R['ter']})/({c}{R['c1']}+{c}{R['c2']})-1" for c in oc], PCT, color=AMBER,
             nota="Por encima de este sobrecosto de horas, el proyecto queda bajo el piso")
    pago = esc.get("pago_dias", 30)
    fila_val("Caja que sale por el proyecto (capa 1 + terceros + variables)", [f"={c}{R['c1']}+{c}{R['ter']}+{c}{R['var']}" for c in oc], color=PINK,
             nota=f"Se paga a lo largo de {res[0]['semanas']} semanas")
    fila_val(f"Retenciones estimadas ({p['retenciones']:.1%} del precio)", [f"=ROUND({c}{R['precio']}*{p['retenciones']},0)" for c in oc], color=MUTED,
             nota="Anticipo de renta: se recupera en la declaración")
    fila_val("Caja que entra (total − retenciones − IVA a pagar)", [f"={c}{R['precio']}-ROUND({c}{R['precio']}*{p['retenciones']},0)" for c in oc],
             nota=f"Entra a los {pago} días de la factura (regla 14)")
    fila_val("Necesidad máxima de caja antes de cobrar", [f"=-({c}{R['c1']}+{c}{R['ter']})*MIN(1,{pago}/({res[0]['semanas']}*7))" for c in oc], color=PINK,
             nota="Producción pagada antes de que entre el pago, si se factura al inicio")

    # ------------------------------------------------ 7 · decisiones, flags y supuestos
    for titulo, items, color in (("7 · DECISIONES Y EXCEPCIONES (con su registro)", esc.get("decisiones", []), AMBER),
                                 ("8 · FLAGS", esc.get("flags", []), RED),
                                 ("9 · SUPUESTOS", esc.get("supuestos", []), TXT)):
        H.seccion(titulo)
        for t in items or ["(ninguna)"]:
            r = H.fila(max(20, H._alto(t, sum(widths[1:-1]), 9)))
            H.put(f"B{r}", t, 9, False, color, BG, border=False)
            H.merge("B", last)

    # ------------------------------------------------ 10 · verificaciones
    H.seccion("10 · VERIFICACIONES DE LA REGLA 24 (el análisis no se entrega si alguna falla)")
    for nombre, ok, det in checks:
        r = H.fila(20)
        H.put(f"B{r}", ("✓ " if ok else "✗ ") + nombre + (f" · {det}" if det else ""), 9, True, GREEN if ok else RED, BG, border=False)
        H.merge("B", last)
    for c, r_ in zip(oc, res):
        r = H.fila(20)
        H.put(f"B{r}", f"Fórmula: costo real del resumen = total de la tabla de perfiles · {r_['nombre']}", 9, False, TXT, BG, border=False)
        cc = ccols[oc.index(c)]
        H.put(f"{c}{r}", f'=IF(ABS({c}{R["creal"]}-{cc}{rows["tot"]})<1,"✓","✗")', 10, True, GREEN, BG, "center", border=False)
    for _ in range(3):
        H.fila()
    ws.freeze_panes = "C4"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    return ws


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    esc = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    out = argv[2]
    cliente = argv[argv.index("--cliente") + 1] if "--cliente" in argv else None
    validar_escenario(esc)
    res = calcular(esc)
    checks = verificar(esc, res, cliente)
    fallas = [c for c in checks if not c[1]]
    for nombre, ok, det in checks:
        print(("OK   " if ok else "FALLA"), nombre, det)
    if fallas:
        print(f"\n{len(fallas)} verificación(es) fallaron: no se escribe el análisis.")
        return 1
    if cliente:
        wb = openpyxl.load_workbook(cliente)
        if "Análisis Interno" in wb.sheetnames:
            del wb["Análisis Interno"]
    else:
        wb = openpyxl.Workbook()
        wb.remove(wb.active)
    construir(esc, res, checks, wb)
    wb.save(out)
    for r_ in res:
        mb = (r_["precio"] - r_["costo_real"]) / r_["precio"]
        var = esc["parametros"]["comision"] + esc["parametros"]["ica"] + esc["parametros"]["gmf"]
        print(f"{r_['nombre']}: cobrado {r_['precio']:,.0f} · costo real {r_['costo_real']:,.0f} · utilidad bruta {r_['precio'] - r_['costo_real']:,.0f} "
              f"({mb:.1%}) · ganancia {r_['precio'] * (1 - var) - r_['costo_real']:,.0f}")
    print("escrito:", out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
