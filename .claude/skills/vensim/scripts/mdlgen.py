"""Generador minimo de archivos .mdl de Vensim (ecuaciones + sketch V300).

Sigue el formato observado en modelos reales guardados por Vensim
(SDXorg/test-models samples/*, SDEverywhere examples/sir/model/sir.mdl).
Produce modelos que Vensim abre con diagrama (stocks, flujos con valvula y
nubes, conectores con polaridad, marcadores de bucle R/B, variables sombra).

Uso (genera examples/poblacion.mdl):

    from mdlgen import Sketch, build, eq, level, group, join

    ecuaciones = join(
        group("poblacion", "Crecimiento con un bucle R y un bucle B."),
        level("Poblacion", "nacimientos-muertes", "poblacion inicial", "Person",
              "Stock de personas.", "[0,?]"),
        eq("nacimientos", "Poblacion*tasa de natalidad", "Person/Year"),
        eq("muertes", "Poblacion/esperanza de vida", "Person/Year"),
        eq("tasa de natalidad", "0.03", "1/Year", "", "[0,0.1,0.005]"),
        eq("esperanza de vida", "50", "Year", "", "[10,100,1]"),
        eq("poblacion inicial", "1000", "Person"),
    )
    s = Sketch("poblacion")
    s.stock("Poblacion", 400, 220)
    s.flow("nacimientos", (230, 220), "Poblacion", x=300)   # (x, y) = nube
    s.flow("muertes", "Poblacion", (570, 220), x=500)
    s.aux("tasa de natalidad", 230, 320)
    s.aux("esperanza de vida", 570, 320)
    s.aux("poblacion inicial", 400, 120)
    s.link("Poblacion", "nacimientos", "+", curve=(345, 290))
    s.link("tasa de natalidad", "nacimientos", "+")
    s.link("Poblacion", "muertes", "+", curve=(455, 290))
    s.link("esperanza de vida", "muertes", "-")
    s.link("poblacion inicial", "Poblacion", init=True)
    s.loop("R", 330, 250, "R1 Nacimientos", clockwise=False)
    s.loop("B", 470, 250, "B1 Muertes")
    build("poblacion.mdl", ecuaciones, s, final=100, step=0.125,
          unit="Year", first_var="Poblacion")

Notas:
- Las ecuaciones de control (.Control) y la seccion de settings se anaden solas.
- `extra_units` en build() declara sinonimos de unidades propias, p.ej. ("Widget,Widgets",).
- Valida el resultado con validar_modelo.py (PySD) y, si es posible, abriendolo en Vensim.
"""
import math
import textwrap


def _wrap(name, width=18):
    return textwrap.wrap(name, width) or [name]


def _size(name):
    lines = _wrap(name)
    w = max(16, int(math.ceil(2.9 * max(len(l) for l in lines))))
    h = {1: 8, 2: 14, 3: 20}.get(len(lines), 26)
    return w, h


def _q(name):
    """Nombre tal como aparece en el sketch (entre comillas si hace falta)."""
    if any(c in name for c in ',"|'):
        return '"' + name.replace('"', '\\"') + '"'
    return name


class Sketch:
    def __init__(self, title="View 1"):
        self.title = title
        self.lines = []
        self.n = 0
        self.ids = {}       # nombre -> id del elemento principal
        self.valve = {}     # nombre de flujo -> id de la valvula
        self.pos = {}       # id -> (x, y)
        self.kind = {}      # id -> 'stock' | 'aux' | 'valve' | 'cloud' | 'flow'

    def _id(self):
        self.n += 1
        return self.n

    # ---------------- elementos -----------------
    def stock(self, name, x, y):
        i = self._id()
        self.lines.append(f"10,{i},{_q(name)},{x},{y},40,20,3,3,0,0,0,0,0,0")
        self.ids[name] = i
        self.pos[i] = (x, y)
        self.kind[i] = "stock"
        return i

    def aux(self, name, x, y):
        i = self._id()
        w, h = _size(name)
        self.lines.append(f"10,{i},{_q(name)},{x},{y},{w},{h},8,3,0,0,0,0,0,0")
        self.ids[name] = i
        self.pos[i] = (x, y)
        self.kind[i] = "aux"
        return i

    def shadow(self, name, x, y, key=None):
        """Variable sombra (shadow / ghost): bits=2, texto gris."""
        i = self._id()
        w, h = _size(name)
        self.lines.append(
            f"10,{i},{_q(name)},{x},{y},{w},{h},8,2,0,3,-1,0,0,0,"
            "128-128-128,0-0-0,|12||128-128-128")
        self.ids[key or ("~" + name)] = i
        self.pos[i] = (x, y)
        self.kind[i] = "aux"
        return i

    def cloud(self, x, y):
        i = self._id()
        self.lines.append(f"12,{i},48,{x},{y},10,8,0,3,0,0,-1,0,0,0")
        self.pos[i] = (x, y)
        self.kind[i] = "cloud"
        return i

    def flow(self, name, frm, to, x=None, y=None, vertical=False, label_side=None):
        """Flujo de `frm` a `to`. Cada extremo es el nombre de un stock o una
        tupla (x, y) donde se dibuja una nube (fuente/sumidero)."""
        def end(e):
            if isinstance(e, tuple):
                return self.cloud(*e)
            return self.ids[e]
        src = end(frm)
        dst = end(to)
        sx, sy = self.pos[src]
        dx, dy = self.pos[dst]
        if x is None:
            x = (sx + dx) // 2
        if y is None:
            y = (sy + dy) // 2
        valve = self.n + 3
        # punto de anclaje de cada tuberia: borde del stock / centro de nube
        def anchor(eid, ex, ey):
            if self.kind[eid] == "stock":
                if vertical:
                    return (x, ey + (22 if y > ey else -22))
                return (ex + (42 if x > ex else -42), y)
            return (ex, ey) if not vertical else (x, ey)
        ax, ay = anchor(dst, dx, dy)
        bx, by = anchor(src, sx, sy)
        p1 = self._id()
        self.lines.append(f"1,{p1},{valve},{dst},4,0,0,22,0,0,0,-1--1--1,,1|({ax},{ay})|")
        p2 = self._id()
        self.lines.append(f"1,{p2},{valve},{src},100,0,0,22,0,0,0,-1--1--1,,1|({bx},{by})|")
        v = self._id()
        assert v == valve
        if vertical:
            self.lines.append(f"11,{v},48,{x},{y},8,6,33,3,0,0,4,0,0,0")
        else:
            self.lines.append(f"11,{v},48,{x},{y},6,8,34,3,0,0,1,0,0,0")
        f = self._id()
        w, h = _size(name)
        side = label_side or ("right" if vertical else "below")
        lx, ly = {"right": (x + w + 8, y), "left": (x - w - 8, y),
                  "below": (x, y + 8 + h), "above": (x, y - 8 - h)}[side]
        self.lines.append(f"10,{f},{_q(name)},{lx},{ly},{w},{h},40,3,0,0,-1,0,0,0")
        self.ids[name] = f
        self.valve[name] = v
        self.pos[v] = (x, y)
        self.pos[f] = (lx, ly)
        self.kind[v] = "valve"
        self.kind[f] = "flow"
        return f

    def link(self, frm, to, pol=None, curve=None, init=False):
        """Conector de informacion. `to` puede ser un flujo (se une a la
        valvula). pol: '+', '-' o None. curve: punto de control (x, y)."""
        a = self.ids[frm]
        b = self.valve.get(to, self.ids.get(to))
        if frm in self.valve and self.kind[a] == "flow":
            a = self.valve[frm]
        p = {"+": 43, "-": 45, None: 0}[pol]
        if curve is None:
            (x1, y1), (x2, y2) = self.pos[a], self.pos[b]
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            shape = 0
        else:
            cx, cy = curve
            shape = 1
        i = self._id()
        self.lines.append(
            f"1,{i},{a},{b},{shape},0,{p},0,0,64,{1 if init else 0},-1--1--1,,1|({cx},{cy})|")
        return i

    def loop(self, kind, x, y, label=None, clockwise=True):
        """Marcador de bucle (R/B) + etiqueta opcional, como en sir.mdl de Sterman."""
        i = self._id()
        shape = 4 if clockwise else 5
        self.lines.append(f"12,{i},0,{x},{y},15,15,{shape},4,0,0,-1,0,0,0")
        self.lines.append(kind)
        if label:
            j = self._id()
            w = max(20, int(2.6 * len(label)))
            self.lines.append(
                f"12,{j},0,{x},{y + 22},{w},9,8,4,0,8,-1,0,0,0,0-0-0,0-0-0,|8|B|0-0-0")
            self.lines.append(label)

    def text(self, text, x, y, w=120, h=20):
        i = self._id()
        self.lines.append(
            f"12,{i},0,{x},{y},{w},{h},8,135,0,18,-1,0,0,0,-1--1--1,0-0-0,|12|B|128-0-0")
        self.lines.append(text)

    def render(self):
        out = ["\\\\\\---/// Sketch information - do not modify anything except names",
               "V300  Do not put anything below this section - it will be ignored",
               f"*{self.title}",
               "$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|96,96,100,0"]
        out += self.lines
        out.append("///---\\\\\\")
        return "\n".join(out)


def control(final, step, unit, initial=0, saveper="TIME STEP"):
    sp = f"\n        {saveper}" if saveper == "TIME STEP" else f" {saveper}"
    return f"""********************************************************
	.Control
********************************************************~
		Simulation Control Parameters
	|

FINAL TIME  = {final}
	~	{unit}
	~	The final time for the simulation.
	|

INITIAL TIME  = {initial}
	~	{unit}
	~	The initial time for the simulation.
	|

SAVEPER  ={sp}
	~	{unit} [0,?]
	~	The frequency with which output is stored.
	|

TIME STEP  = {step}
	~	{unit} [0,?]
	~	The time step for the simulation.
	|
"""


def settings(final, first_var, extra_units=()):
    units = ["$,Dollar,Dollars,$s", "Hour,Hours", "Month,Months",
             "Person,People,Persons", "Unit,Units", "Week,Weeks",
             "Year,Years", "Day,Days"] + list(extra_units)
    lines = [":L<%^E!@", "1:Current.vdf", "9:Current"]
    lines += [f"22:{u}" for u in units]
    lines += ["15:0,0,0,0,0,0", "19:100,0", "27:2,", "34:0,", "4:Time",
              f"5:{first_var}", "35:Date", "36:YYYY-MM-DD", "37:2000", "38:1",
              "39:1", "40:2", "41:0", "42:1", "24:0", f"25:{final}", f"26:{final}"]
    return "\n".join(lines)


def build(path, equations, sketch, final, step, unit, first_var,
          extra_units=(), saveper="TIME STEP"):
    eq = equations.strip("\n")
    text = "{UTF-8}\n" + eq + "\n\n" + control(final, step, unit, saveper=saveper) + "\n" + \
        sketch.render() + "\n" + settings(final, first_var, extra_units) + "\n"
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return path


# ---------------- helpers de ecuaciones -----------------
def _comment(text):
    if not text:
        return "\t"
    parts = []
    for para in text.split("\n"):
        parts.append(" \\\n\t\t".join(textwrap.wrap(para, 74)) or "")
    return "\t" + "\n\t\t".join(parts)


def eq(name, expr, units, comment="", rng=""):
    u = units + (" " + rng if rng else "")
    return f"{name}=\n\t{expr}\n\t~\t{u}\n\t~{_comment(comment)}\n\t|\n"


def level(name, flows, init, units, comment="", rng=""):
    u = units + (" " + rng if rng else "")
    return (f"{name}= INTEG (\n\t{flows},\n\t\t{init})\n\t~\t{u}\n"
            f"\t~{_comment(comment)}\n\t|\n")


def lookup(name, points, units="Dmnl", comment=""):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    rng = f"[({min(xs)},{min(0, min(ys))})-({max(xs)},{max(ys)})]"
    pts = ",".join(f"({x},{y})" for x, y in points)
    return f"{name}(\n\t{rng},{pts})\n\t~\t{units}\n\t~{_comment(comment)}\n\t|\n"


def group(name, comment=""):
    return ("********************************************************\n"
            f"\t.{name}\n"
            "********************************************************~\n"
            f"\t\t{comment}\n\t|\n")


def join(*blocks):
    return "\n".join(blocks)
