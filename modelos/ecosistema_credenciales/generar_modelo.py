#!/usr/bin/env python3
"""Genera ecosistema_credenciales.mdl: modelo de dinámica de sistemas del
ecosistema de credenciales digitales (instituciones, docentes, estudiantes y
empresas) con sus flywheels.

Este script es la fuente de verdad: para cambiar el modelo, edita las
ecuaciones o el diagrama aquí y vuelve a ejecutarlo:

    python generar_modelo.py            # escribe ecosistema_credenciales.mdl

Todos los valores de los parámetros son SUPUESTOS de partida (hipótesis), no
datos: están pensados para reemplazarse por cifras reales.
"""
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "..", ".claude", "skills", "vensim", "scripts"))
from mdlgen import Sketch, build, eq, level, group, join  # noqa: E402

SALIDA = os.path.join(AQUI, "ecosistema_credenciales.mdl")

UNIDADES = (
    "Institucion,Instituciones",
    "Unidad,Unidades",
    "Docente,Docentes",
    "Credencial,Credenciales",
    "Persona,Personas",
    "Empresa,Empresas",
    "Busqueda,Busquedas",
    "Uso,Usos",
    "Contratacion,Contrataciones",
    "Dia,Dias",
)

# ---------------------------------------------------------------------------
# 1. Instituciones: adquisición (land) por pilotos
# ---------------------------------------------------------------------------
INSTITUCIONES = join(
    group("instituciones", "Adquisicion de instituciones: prospeccion, pilotos, clientes y churn."),
    level("Instituciones potenciales",
          "pilotos no convertidos-inicio de pilotos-inicio de virtualizaciones gratis",
          "instituciones en el mercado-clientes iniciales-pilotos iniciales", "Institucion",
          "Universidades e IES del mercado objetivo que aun no usan la plataforma.", "[0,?]"),
    level("Instituciones en piloto",
          "inicio de pilotos+virtualizaciones que pasan al pipeline-conversion de pilotos-pilotos no convertidos",
          "pilotos iniciales", "Institucion",
          "Instituciones probando la plataforma, normalmente desde una unidad academica "
          "(educacion continua o innovacion).", "[0,?]"),
    level("Instituciones cliente", "conversion de pilotos+compras al terminar la virtualizacion-churn de instituciones",
          "clientes iniciales", "Institucion",
          "Instituciones con contrato activo (al menos una unidad academica emitiendo).", "[0,?]"),
    level("Instituciones perdidas", "churn de instituciones", "0", "Institucion",
          "Instituciones que fueron clientes y se fueron (no vuelven al mercado en el horizonte).", "[0,?]"),
    eq("inicio de pilotos",
       "Instituciones potenciales*(fraccion de prospeccion+contagio institucional+atraccion del ecosistema)"
       "+propuestas de paid media sin cupo",
       "Institucion/Month",
       "Nuevos pilotos: prospeccion propia (outbound, eventos, marketing), boca a boca entre "
       "instituciones (R1), atraccion porque la credencial ya es moneda de movilidad (R6) y leads "
       "de la tactica de paid media."),
    eq("contagio institucional",
       "activar boca a boca institucional*efectividad del boca a boca institucional"
       "*Instituciones cliente/instituciones en el mercado",
       "1/Month", "Fraccion mensual de potenciales que inician piloto por referencia de clientes (Bass)."),
    eq("atraccion del ecosistema",
       "activar flywheel del ecosistema*atraccion maxima por valor de la credencial*Valor percibido de la credencial",
       "1/Month",
       "Fraccion mensual de potenciales que buscan la plataforma porque estudiantes y empresas ya "
       "piden la credencial (bucle R6)."),
    eq("conversion de pilotos", "Instituciones en piloto/duracion del piloto*fraccion de conversion de pilotos",
       "Institucion/Month", "Pilotos que firman contrato."),
    eq("pilotos no convertidos",
       "Instituciones en piloto/duracion del piloto*(1-fraccion de conversion de pilotos)",
       "Institucion/Month", "Pilotos que no convierten y vuelven al mercado potencial."),
    eq("churn de instituciones",
       "Instituciones cliente*fraccion de churn institucional*(1-activar flywheel del ecosistema"
       "*reduccion maxima del churn por valor*Valor percibido de la credencial)",
       "Institucion/Month",
       "Instituciones que dejan la plataforma. Cuanto mas vale la credencial (datos de "
       "competencias, empleabilidad, marketing), menos churn."),
    eq("instituciones en el mercado", "600", "Institucion", "SUPUESTO: tamano del mercado objetivo. En HubSpot (17-oct-2026) ya hay 401 instituciones "
       "educativas con actividad y 542 instituciones sin actividad.",
       "[100,3000,50]"),
    eq("clientes iniciales", "11", "Institucion",
       "DATO HubSpot 17-oct-2026: instituciones con negocio en Ganado credenciales POK (8 IES y cajas "
       "de compensacion, PMI Bogota, Connect Bogota y Team Rush).", "[0,200,1]"),
    eq("pilotos iniciales", "60", "Institucion",
       "DATO HubSpot 17-oct-2026: instituciones que aun no son clientes con negocio POK abierto entre "
       "propuesta enviada y sesion de cierre (etapas 3 a 5).", "[0,200,1]"),
    eq("fraccion de prospeccion", "0.024", "1/Month",
       "DATO HubSpot / PALANCA: unas 13 instituciones por mes llegan a propuesta POK entre "
       "abril y octubre de 2026, sobre 529 potenciales; 0.024 = 2.4 % al mes.", "[0,0.06,0.001]"),
    eq("efectividad del boca a boca institucional", "0.05", "1/Month",
       "SUPUESTO: inicio de pilotos por mes y por potencial si todo el mercado fuera cliente.",
       "[0,0.3,0.01]"),
    eq("atraccion maxima por valor de la credencial", "0.02", "1/Month",
       "SUPUESTO: fraccion mensual de potenciales que llega sola cuando la credencial vale el maximo.",
       "[0,0.05,0.001]"),
    eq("duracion del piloto", "10.7", "Month",
       "DATO HubSpot 17-oct-2026: meses desde la propuesta hasta la decision. 66 negocios POK en etapas "
       "3 a 5 / 6.2 negocios que salen del pipeline por mes (ley de Little).", "[1,24,0.5]"),
    eq("fraccion de conversion de pilotos", "0.33", "Dmnl",
       "DATO HubSpot / PALANCA: de 36 negocios POK que salieron del pipeline entre abril y "
       "octubre de 2026, 12 se ganaron, 18 se perdieron y 6 quedaron para retomar.", "[0,1,0.01]"),
    eq("fraccion de churn institucional", "0.01", "1/Month",
       "SUPUESTO: churn mensual de instituciones sin efecto del valor (0.01 ~ 11 % al ano).",
       "[0,0.05,0.001]"),
    eq("reduccion maxima del churn por valor", "0.6", "Dmnl",
       "SUPUESTO: cuanto se reduce el churn cuando la credencial vale el maximo.", "[0,1,0.05]"),
)

# ---------------------------------------------------------------------------
# 2. Unidades académicas: expansión dentro de cada institución (land & expand)
# ---------------------------------------------------------------------------
UNIDADES_ACADEMICAS = join(
    group("unidades academicas",
          "Land and expand: cada institucion cliente entra por una unidad y se expande a otras."),
    level("Unidades activas",
          "unidades por nuevos clientes+expansion interna-churn de unidades-unidades perdidas con instituciones",
          "unidades iniciales", "Unidad",
          "Unidades academicas emitiendo credenciales (educacion continua, innovacion, facultades...).",
          "[0,?]"),
    eq("unidades por nuevos clientes",
       "(conversion de pilotos+compras al terminar la virtualizacion)*unidades de entrada por cliente", "Unidad/Month",
       "Cada nuevo cliente entra con su unidad de entrada."),
    eq("unidades sin activar en clientes",
       "MAX(0,Instituciones cliente*unidades academicas por institucion-Unidades activas)", "Unidad",
       "Unidades de las instituciones cliente que todavia no emiten: el espacio de expansion."),
    eq("penetracion interna",
       "ZIDZ(Unidades activas,Instituciones cliente*unidades academicas por institucion)", "Dmnl",
       "Fraccion de las unidades de los clientes que ya emiten."),
    eq("expansion interna",
       "unidades sin activar en clientes*(fraccion de expansion institucional+activar expansion interna"
       "*efectividad del contagio interno*penetracion interna)",
       "Unidad/Month",
       "Nuevas unidades dentro de clientes: por decision central (vicerrectoria/rectoria) y por "
       "contagio entre unidades (bucle R2)."),
    eq("churn de unidades", "Unidades activas*fraccion de churn de unidades", "Unidad/Month",
       "Unidades que dejan de emitir aunque la institucion siga siendo cliente."),
    eq("unidades perdidas con instituciones",
       "churn de instituciones*ZIDZ(Unidades activas,Instituciones cliente)", "Unidad/Month",
       "Unidades que se van cuando su institucion abandona."),
    eq("unidades iniciales", "11", "Unidad",
       "DATO HubSpot 17-oct-2026: una unidad por negocio Ganado credenciales POK.", "[0,500,1]"),
    eq("unidades academicas por institucion", "8", "Unidad/Institucion",
       "SUPUESTO: unidades potenciales por institucion (educacion continua, innovacion, facultades, "
       "talento humano...).", "[1,30,1]"),
    eq("unidades de entrada por cliente", "1", "Unidad/Institucion",
       "Unidades con las que entra un cliente nuevo.", "[1,5,1]"),
    eq("fraccion de expansion institucional", "0.004", "1/Month",
       "SUPUESTO / PALANCA: expansion por decision central (vicerrectores, rectores) por mes.",
       "[0,0.05,0.001]"),
    eq("efectividad del contagio interno", "0.06", "1/Month",
       "SUPUESTO: expansion por contagio entre unidades si toda la institucion ya emitiera.",
       "[0,0.3,0.01]"),
    eq("fraccion de churn de unidades", "0.01", "1/Month", "SUPUESTO: churn mensual de unidades.",
       "[0,0.05,0.001]"),
)

# ---------------------------------------------------------------------------
# 3. Docentes: generan las evidencias y también se certifican
# ---------------------------------------------------------------------------
DOCENTES = join(
    group("docentes", "Los docentes generan las evidencias de emision y tambien se certifican."),
    level("Docentes activos", "incorporacion neta de docentes",
          "unidades iniciales*docentes por unidad*fraccion base de docentes comprometidos", "Docente",
          "Docentes que generan evidencias en la plataforma.", "[0,?]"),
    level("Docentes certificados", "certificacion de docentes-salida de docentes certificados", "0",
          "Docente", "Docentes con credenciales propias de competencias (talento de la universidad).",
          "[0,?]"),
    eq("incorporacion neta de docentes", "(docentes comprometidos deseados-Docentes activos)/tiempo de adopcion docente",
       "Docente/Month", "Ajuste gradual hacia los docentes que deberian estar usando la plataforma."),
    eq("docentes comprometidos deseados", "Unidades activas*docentes por unidad*fraccion de docentes comprometidos",
       "Docente", ""),
    eq("fraccion de docentes comprometidos",
       "MIN(fraccion maxima de docentes comprometidos,fraccion base de docentes comprometidos"
       "*(1+activar compromiso docente*efecto de la certificacion en el compromiso*fraccion de docentes certificados))",
       "Dmnl",
       "Los docentes que se certifican se vuelven promotores y comprometen a mas colegas (bucle R4)."),
    eq("fraccion de docentes certificados", "ZIDZ(MIN(Docentes certificados,Docentes activos),Docentes activos)",
       "Dmnl", ""),
    eq("certificacion de docentes",
       "MAX(0,Docentes activos-Docentes certificados)*fraccion mensual de certificacion docente",
       "Docente/Month", "Docentes que certifican sus propias competencias."),
    eq("salida de docentes certificados", "Docentes certificados/permanencia de docentes", "Docente/Month",
       "Rotacion de docentes certificados."),
    eq("capacidad de emision", "Docentes activos*evidencias por docente", "Credencial/Month",
       "Credenciales que los docentes pueden respaldar con evidencias por mes (bucle B4)."),
    eq("docentes por unidad", "30", "Docente/Unidad", "SUPUESTO.", "[5,200,5]"),
    eq("fraccion base de docentes comprometidos", "0.3", "Dmnl", "SUPUESTO / PALANCA.", "[0,1,0.05]"),
    eq("fraccion maxima de docentes comprometidos", "0.9", "Dmnl", "SUPUESTO.", "[0,1,0.05]"),
    eq("efecto de la certificacion en el compromiso", "1", "Dmnl",
       "SUPUESTO: con todos los docentes certificados el compromiso se duplica (1 = +100 %).", "[0,3,0.1]"),
    eq("tiempo de adopcion docente", "6", "Month", "SUPUESTO / PALANCA (capacitacion, onboarding).",
       "[1,24,1]"),
    eq("fraccion mensual de certificacion docente", "0.02", "1/Month", "SUPUESTO / PALANCA.",
       "[0,0.2,0.005]"),
    eq("permanencia de docentes", "60", "Month", "SUPUESTO.", "[12,240,12]"),
    eq("evidencias por docente", "15", "Credencial/(Docente*Month)",
       "SUPUESTO: credenciales por docente y mes que se pueden respaldar con evidencias.", "[1,100,1]"),
)

# ---------------------------------------------------------------------------
# 4. Estudiantes: credenciales emitidas y hábito
# ---------------------------------------------------------------------------
ESTUDIANTES = join(
    group("estudiantes", "Emision de credenciales y habito de los estudiantes."),
    level("Credenciales emitidas", "emision de credenciales+credenciales docentes", "credenciales iniciales",
          "Credencial", "Acumulado de credenciales emitidas.", "[0,?]"),
    level("Titulares activos", "nuevos titulares-desactivacion de titulares", "titulares iniciales", "Persona",
          "Estudiantes y egresados que usan o comparten activamente sus credenciales.", "[0,?]"),
    eq("demanda institucional de credenciales", "Unidades activas*emision programada por unidad",
       "Credencial/Month", "Emisiones que las unidades planean (cursos, programas, eventos)."),
    eq("demanda estudiantil de credenciales",
       "activar habito estudiantil*Titulares activos*solicitudes por titular*Valor percibido de la credencial",
       "Credencial/Month",
       "Disparador del habito: necesito demostrar una competencia y pido la credencial (bucle R3)."),
    eq("demanda de credenciales", "demanda institucional de credenciales+demanda estudiantil de credenciales",
       "Credencial/Month", ""),
    eq("emision de credenciales", "MIN(demanda de credenciales,capacidad de emision)", "Credencial/Month",
       "Lo que se emite: la demanda, salvo que falten docentes que generen evidencias."),
    eq("credenciales docentes", "certificacion de docentes*credenciales por docente certificado",
       "Credencial/Month", ""),
    eq("nuevos titulares", "emision de credenciales*fraccion de emisiones a nuevos titulares/credenciales por titular nuevo",
       "Persona/Month", "Personas que reciben su primera credencial."),
    eq("desactivacion de titulares", "Titulares activos/tiempo de uso activo", "Persona/Month",
       "Titulares que dejan de usar sus credenciales."),
    eq("tiempo de uso activo",
       "tiempo base de uso activo*(1+activar habito estudiantil*extension del uso por valor*Valor percibido de la credencial)",
       "Month", "Recompensa del habito: si la credencial sirve, se sigue usando por mas tiempo."),
    eq("compartidas por titulares", "Titulares activos*usos por titular", "Uso/Month",
       "Credenciales compartidas o presentadas (LinkedIn, wallets, postulaciones)."),
    eq("credenciales iniciales", "50000", "Credencial", "SUPUESTO.", "[0,1e+06,10000]"),
    eq("titulares iniciales", "20000", "Persona", "SUPUESTO.", "[0,500000,5000]"),
    eq("emision programada por unidad", "120", "Credencial/(Unidad*Month)", "SUPUESTO / PALANCA.",
       "[10,1000,10]"),
    eq("solicitudes por titular", "0.05", "Credencial/(Persona*Month)",
       "SUPUESTO: credenciales adicionales que un titular pide por mes cuando la credencial vale el maximo.",
       "[0,0.5,0.01]"),
    eq("fraccion de emisiones a nuevos titulares", "0.5", "Dmnl",
       "SUPUESTO: parte de las credenciales que va a personas sin credenciales previas.", "[0,1,0.05]"),
    eq("credenciales por titular nuevo", "1", "Credencial/Persona", "", "[1,5,1]"),
    eq("credenciales por docente certificado", "3", "Credencial/Docente", "SUPUESTO.", "[1,10,1]"),
    eq("tiempo base de uso activo", "18", "Month", "SUPUESTO.", "[3,60,1]"),
    eq("extension del uso por valor", "1", "Dmnl",
       "SUPUESTO: con valor maximo el tiempo de uso activo se duplica.", "[0,3,0.1]"),
    eq("usos por titular", "0.1", "Uso/(Persona*Month)", "SUPUESTO.", "[0,1,0.01]"),
)

# ---------------------------------------------------------------------------
# 5. Empresas: búsqueda de talento por competencias
# ---------------------------------------------------------------------------
EMPRESAS = join(
    group("empresas", "Sector productivo: busqueda de talento por credenciales y competencias."),
    level("Empresas potenciales", "churn de empresas-adopcion de empresas", "empresas en el mercado-empresas iniciales",
          "Empresa", "Empresas (talento humano) que aun no buscan talento por credenciales.", "[0,?]"),
    level("Empresas usuarias", "adopcion de empresas-churn de empresas", "empresas iniciales", "Empresa",
          "Empresas que buscan y verifican talento por credenciales.", "[0,?]"),
    eq("adopcion de empresas",
       "Empresas potenciales*(fraccion de prospeccion de empresas+contagio empresarial+atraccion por talento)",
       "Empresa/Month", ""),
    eq("contagio empresarial",
       "activar boca a boca empresarial*efectividad del boca a boca empresarial*Empresas usuarias/empresas en el mercado",
       "1/Month", "Bucle R7."),
    eq("atraccion por talento",
       "activar flywheel empresas*atraccion maxima por talento*probabilidad de encontrar talento", "1/Month",
       "Cuanto mas talento verificable hay, mas empresas buscan por credenciales (bucle R5)."),
    eq("probabilidad de encontrar talento", "Titulares activos/(Titulares activos+talento de referencia)", "Dmnl",
       "Probabilidad de que una busqueda encuentre un candidato con la competencia (saturante)."),
    eq("churn de empresas",
       "Empresas usuarias*fraccion de churn de empresas*(1-reduccion del churn por exito*probabilidad de encontrar talento)",
       "Empresa/Month", "Las empresas que no encuentran talento abandonan."),
    eq("busquedas de talento", "Empresas usuarias*busquedas por empresa", "Busqueda/Month", ""),
    eq("contrataciones por credencial",
       "busquedas de talento*probabilidad de encontrar talento*contrataciones por busqueda exitosa",
       "Contratacion/Month", ""),
    eq("verificaciones de empresas", "busquedas de talento*verificaciones por busqueda", "Uso/Month",
       "Credenciales verificadas por reclutadores."),
    eq("dias de contratacion ahorrados", "contrataciones por credencial*dias ahorrados por contratacion",
       "Dia/Month", "Recompensa para la empresa: menor tiempo de contratacion."),
    eq("empresas en el mercado", "3000", "Empresa", "SUPUESTO.", "[100,50000,100]"),
    eq("empresas iniciales", "15", "Empresa", "SUPUESTO.", "[0,500,5]"),
    eq("fraccion de prospeccion de empresas", "0.001", "1/Month", "SUPUESTO / PALANCA.", "[0,0.02,0.0005]"),
    eq("efectividad del boca a boca empresarial", "0.05", "1/Month", "SUPUESTO.", "[0,0.3,0.01]"),
    eq("atraccion maxima por talento", "0.01", "1/Month", "SUPUESTO.", "[0,0.05,0.001]"),
    eq("talento de referencia", "200000", "Persona",
       "SUPUESTO: titulares activos con los que la mitad de las busquedas encuentra candidato.",
       "[10000,2e+06,10000]"),
    eq("fraccion de churn de empresas", "0.03", "1/Month", "SUPUESTO.", "[0,0.1,0.005]"),
    eq("reduccion del churn por exito", "0.8", "Dmnl", "SUPUESTO.", "[0,1,0.05]"),
    eq("busquedas por empresa", "4", "Busqueda/(Empresa*Month)", "SUPUESTO.", "[0,50,1]"),
    eq("contrataciones por busqueda exitosa", "0.3", "Contratacion/Busqueda", "SUPUESTO.", "[0,1,0.05]"),
    eq("verificaciones por busqueda", "5", "Uso/Busqueda", "SUPUESTO.", "[0,50,1]"),
    eq("dias ahorrados por contratacion", "15", "Dia/Contratacion", "SUPUESTO.", "[0,60,1]"),
)

# ---------------------------------------------------------------------------
# 6. Ecosistema: la credencial como moneda de movilidad académica y laboral
# ---------------------------------------------------------------------------
ECOSISTEMA = join(
    group("ecosistema", "Valor de la credencial como moneda de movilidad academica y laboral."),
    eq("uso de credenciales", "compartidas por titulares+verificaciones de empresas", "Uso/Month",
       "Cuanto se usan las credenciales en el mercado."),
    eq("valor indicado de la credencial",
       "1-EXP(-(peso del uso*uso de credenciales/uso de referencia+(1-peso del uso)*Empresas usuarias/empresas de referencia))",
       "Dmnl",
       "Valor de la credencial (0 a 1) segun su uso y cuantas empresas la reconocen; satura en 1."),
    eq("Valor percibido de la credencial", "SMOOTH3(valor indicado de la credencial,tiempo de percepcion del valor)",
       "Dmnl", "El mercado tarda en notar el valor (retraso de percepcion)."),
    eq("uso de referencia", "100000", "Uso/Month", "SUPUESTO: uso mensual con el que la credencial es moneda.",
       "[10000,1e+06,10000]"),
    eq("empresas de referencia", "300", "Empresa", "SUPUESTO: empresas que hacen de la credencial un estandar.",
       "[50,5000,50]"),
    eq("peso del uso", "0.5", "Dmnl", "SUPUESTO.", "[0,1,0.1]"),
    eq("tiempo de percepcion del valor", "12", "Month", "SUPUESTO.", "[1,36,1]"),
)

# ---------------------------------------------------------------------------
# 7. Interruptores de bucles (1 = activo, 0 = apagado) para medir su aporte
# ---------------------------------------------------------------------------
INTERRUPTORES = join(
    group("interruptores", "Apagar un bucle (0) muestra cuanto aporta al crecimiento."),
    eq("activar boca a boca institucional", "1", "Dmnl", "Bucle R1.", "[0,1,1]"),
    eq("activar expansion interna", "1", "Dmnl", "Bucle R2 (contagio entre unidades).", "[0,1,1]"),
    eq("activar habito estudiantil", "1", "Dmnl", "Bucle R3.", "[0,1,1]"),
    eq("activar compromiso docente", "1", "Dmnl", "Bucle R4.", "[0,1,1]"),
    eq("activar flywheel empresas", "1", "Dmnl", "Bucle R5.", "[0,1,1]"),
    eq("activar flywheel del ecosistema", "1", "Dmnl", "Bucle R6 (atraccion y retencion por valor).", "[0,1,1]"),
    eq("activar boca a boca empresarial", "1", "Dmnl", "Bucle R7.", "[0,1,1]"),
)

# ---------------------------------------------------------------------------
# 8. Táctica de paid media "caballo de Troya" (apagada en la base)
# ---------------------------------------------------------------------------
PAID_MEDIA = join(
    group("tactica paid media",
          "Tactica de paid media (caballo de Troya): merahki abre una convocatoria para virtualizar gratis "
          "un curso corto de 10 horas. Todos los que se registran participan, uno por mes gana, y POK "
          "trabaja al resto de los leads."),
    eq("activar paid media", "0", "Dmnl",
       "INTERRUPTOR de la tactica: 1 la enciende (convocatoria de merahki dirigida a instituciones que "
       "emiten con Certifie o Acredita: un curso corto virtualizado gratis por mes). 0 = la base de "
       "HubSpot, sin la tactica.",
       "[0,1,1]"),
    eq("fraccion de potenciales con emisor competidor", "0.3", "Dmnl",
       "SUPUESTO: parte de las instituciones potenciales que ya emite con otro proveedor. En las "
       "llamadas, unas 16 de 50 cuentas tenian emisor (caso de uso UC1).", "[0,1,0.05]"),
    eq("instituciones con emisor competidor",
       "Instituciones potenciales*fraccion de potenciales con emisor competidor", "Institucion",
       "Publico del anuncio. Se agota a medida que esas instituciones pasan a POK (bucle B5)."),
    eq("presupuesto base de paid media", "1500", "USD/Month",
       "SUPUESTO / PALANCA: pauta mensual (LinkedIn, Meta, Google).", "[0,10000,250]"),
    eq("costo por lead", "60", "USD/Institucion",
       "SUPUESTO: costo de que una institucion deje sus datos para pedir la virtualizacion "
       "gratis.", "[10,300,5]"),
    eq("fraccion de leads calificados", "0.4", "Dmnl",
       "SUPUESTO: leads que de verdad emiten con Certifie o Acredita y pueden decidir.", "[0,1,0.05]"),
    eq("alcance maximo mensual", "0.1", "1/Month",
       "SUPUESTO: parte de las instituciones con emisor competidor que la pauta puede volver lead "
       "calificado en un mes, por mucho que se invierta.", "[0,0.5,0.01]"),
    eq("leads calificados de paid media",
       "activar paid media*MIN(presupuesto de paid media/costo por lead*fraccion de leads calificados,"
       "instituciones con emisor competidor*alcance maximo mensual)",
       "Institucion/Month", "Instituciones que emiten con un competidor y se registran en la convocatoria."),
    eq("cupos de virtualizacion gratis por mes", "1", "Institucion/Month",
       "DECISION / PALANCA: una virtualizacion gratis por mes entre todos los registrados; el cupo "
       "unico es el mensaje de escasez.", "[0,10,1]"),
    eq("inicio de virtualizaciones gratis",
       "MIN(leads calificados de paid media,cupos de virtualizacion gratis por mes)", "Institucion/Month",
       "Ganadoras de la convocatoria: reciben la virtualizacion gratis y el curso se certifica con POK."),
    level("Virtualizaciones gratis en curso",
          "inicio de virtualizaciones gratis-compras al terminar la virtualizacion"
          "-virtualizaciones que pasan al pipeline", "0", "Institucion",
          "Instituciones con un curso en virtualizacion gratis por merahki.", "[0,?]"),
    eq("duracion de la virtualizacion", "2", "Month", "SUPUESTO: promesa de 8 semanas de merahki.",
       "[1,6,0.5]"),
    eq("fraccion que compra al terminar la virtualizacion", "0.4", "Dmnl",
       "SUPUESTO: instituciones ganadoras que compran POK al terminar, con el curso ya certificado "
       "con POK. Algo mas que el 33 % de los pilotos, por reciprocidad y porque ya vieron sus "
       "credenciales verificadas.", "[0,1,0.05]"),
    eq("compras al terminar la virtualizacion",
       "Virtualizaciones gratis en curso/duracion de la virtualizacion"
       "*fraccion que compra al terminar la virtualizacion", "Institucion/Month", "Pasan directo a cliente."),
    eq("virtualizaciones que pasan al pipeline",
       "Virtualizaciones gratis en curso/duracion de la virtualizacion"
       "*(1-fraccion que compra al terminar la virtualizacion)", "Institucion/Month",
       "No compran de inmediato y siguen en el pipeline de POK como pilotos."),
    eq("fraccion de leads sin cupo que llegan a propuesta", "0.3", "Dmnl",
       "SUPUESTO: registrados que no ganan el cupo y que JD o Francely llevan hasta una propuesta de "
       "POK.", "[0,1,0.05]"),
    eq("propuestas de paid media sin cupo",
       "(leads calificados de paid media-inicio de virtualizaciones gratis)"
       "*fraccion de leads sin cupo que llegan a propuesta", "Institucion/Month",
       "Registrados que no ganan el cupo y entran al pipeline de POK como pilotos."),
    level("Propuestas de paid media en curso",
          "entrada de propuestas de paid media-salida de propuestas de paid media", "0", "Institucion",
          "Seguimiento de los pilotos que vinieron de la tactica (ya estan contados en Instituciones "
          "en piloto); sirve para atribuirle clientes y costo.", "[0,?]"),
    eq("entrada de propuestas de paid media",
       "propuestas de paid media sin cupo+virtualizaciones que pasan al pipeline", "Institucion/Month", ""),
    eq("salida de propuestas de paid media", "Propuestas de paid media en curso/duracion del piloto",
       "Institucion/Month", "Se deciden al mismo ritmo que el resto del pipeline."),
    eq("clientes nuevos de paid media",
       "compras al terminar la virtualizacion+salida de propuestas de paid media*fraccion de conversion de pilotos",
       "Institucion/Month", ""),
    level("Clientes ganados con paid media", "clientes nuevos de paid media", "0", "Institucion",
          "Acumulado de clientes que trajo la tactica, sin descontar churn.", "[0,?]"),
    eq("ingreso anual por cliente nuevo", "2000", "USD/Institucion",
       "SUPUESTO: ingreso del primer ano de un cliente POK nuevo. En HubSpot el promedio sin "
       "Uniandes es de unos USD 1.960; el paquete tipico es NFT de 1.000 credenciales por USD 1.500.",
       "[500,10000,250]"),
    eq("meses por ano", "12", "Month", ""),
    eq("ingreso mensual de clientes de paid media",
       "Clientes ganados con paid media*ingreso anual por cliente nuevo/meses por ano", "USD/Month", ""),
    eq("fraccion de ingresos reinvertida", "0", "Dmnl",
       "SUPUESTO: parte del ingreso de los clientes ganados que vuelve a la pauta (bucle R8). "
       "0 = presupuesto fijo.", "[0,1,0.05]"),
    eq("presupuesto de paid media",
       "activar paid media*(presupuesto base de paid media+fraccion de ingresos reinvertida"
       "*ingreso mensual de clientes de paid media)", "USD/Month", ""),
    eq("costo de una virtualizacion gratis", "1500", "USD/Institucion",
       "SUPUESTO / PALANCA: costo para merahki de virtualizar un curso corto de 10 horas (no el precio: "
       "merahki vendio un curso de 10 h a Uniandes en COP 12 M, unos USD 3.700).", "[0,6000,250]"),
    eq("gasto de la tactica",
       "presupuesto de paid media+inicio de virtualizaciones gratis*costo de una virtualizacion gratis",
       "USD/Month", "Pauta mas virtualizaciones regaladas."),
    level("Gasto acumulado de la tactica", "gasto de la tactica", "0", "USD", "", "[0,?]"),
    eq("costo por cliente de paid media",
       "ZIDZ(Gasto acumulado de la tactica,Clientes ganados con paid media)", "USD/Institucion",
       "CAC de la tactica."),
    eq("retorno anual por dolar invertido",
       "ZIDZ(Clientes ganados con paid media*ingreso anual por cliente nuevo,Gasto acumulado de la tactica)",
       "Dmnl",
       "Ingreso del primer ano de los clientes ganados por cada dolar gastado. Mayor que 1: la tactica "
       "se paga en el primer ano."),
)

ECUACIONES = join(INSTITUCIONES, UNIDADES_ACADEMICAS, DOCENTES, ESTUDIANTES, EMPRESAS, ECOSISTEMA,
                  INTERRUPTORES, PAID_MEDIA)


# ---------------------------------------------------------------------------
# Diagrama: una vista por sector. Solo se fijan posiciones; las flechas salen
# de las ecuaciones y su polaridad se calcula numéricamente con una corrida.
# ---------------------------------------------------------------------------
VISTAS = [
    dict(
        titulo="1 instituciones",
        stocks={"Instituciones potenciales": (170, 300), "Instituciones en piloto": (480, 300),
                "Instituciones cliente": (790, 300), "Instituciones perdidas": (1100, 300),
                "Virtualizaciones gratis en curso": (480, 640)},
        flujos=[("inicio de pilotos", "Instituciones potenciales", "Instituciones en piloto", 325, 288, "above"),
                ("pilotos no convertidos", "Instituciones en piloto", "Instituciones potenciales", 325, 313, "below"),
                ("conversion de pilotos", "Instituciones en piloto", "Instituciones cliente", 635, 300, "below"),
                ("churn de instituciones", "Instituciones cliente", "Instituciones perdidas", 945, 300, "below"),
                # táctica de paid media: tuberías en L por debajo de la cadena principal
                ("inicio de virtualizaciones gratis", "Instituciones potenciales", "Virtualizaciones gratis en curso",
                 170, 640, "below"),
                ("virtualizaciones que pasan al pipeline", "Virtualizaciones gratis en curso", "Instituciones en piloto",
                 480, 530, "right", True),
                ("compras al terminar la virtualizacion", "Virtualizaciones gratis en curso", "Instituciones cliente",
                 790, 640, "below")],
        aux={"fraccion de prospeccion": (170, 175), "contagio institucional": (325, 175),
             "atraccion del ecosistema": (480, 175),
             "activar boca a boca institucional": (190, 85), "efectividad del boca a boca institucional": (340, 50),
             "instituciones en el mercado": (60, 420),
             "atraccion maxima por valor de la credencial": (470, 60),
             "activar flywheel del ecosistema": (800, 45),
             "duracion del piloto": (580, 420), "fraccion de conversion de pilotos": (700, 450),
             "pilotos iniciales": (350, 420), "clientes iniciales": (870, 390),
             "fraccion de churn institucional": (950, 450), "reduccion maxima del churn por valor": (1130, 420),
             "propuestas de paid media sin cupo": (330, 560),
             "fraccion de leads sin cupo que llegan a propuesta": (250, 480),
             "cupos de virtualizacion gratis por mes": (300, 740),
             "duracion de la virtualizacion": (560, 750),
             "fraccion que compra al terminar la virtualizacion": (680, 560)},
        sombras={"Valor percibido de la credencial": (760, 170), "leads calificados de paid media": (60, 560)},
        bucles=[("R", 400, 230, "R1 boca a boca", False), ("R", 600, 230, "R6 ecosistema", False),
                ("B", 250, 245, "B1 saturacion", True)],
    ),
    dict(
        titulo="2 unidades academicas",
        stocks={"Unidades activas": (520, 320)},
        flujos=[("unidades por nuevos clientes", (220, 320), "Unidades activas", 360, 320, "below"),
                ("expansion interna", (520, 90), "Unidades activas", 520, 200, "right", True),
                ("churn de unidades", "Unidades activas", (840, 320), 690, 320, "below"),
                ("unidades perdidas con instituciones", "Unidades activas", (520, 560), 520, 450, "right", True)],
        aux={"unidades sin activar en clientes": (330, 140), "penetracion interna": (760, 200),
             "fraccion de expansion institucional": (330, 60), "activar expansion interna": (700, 60),
             "efectividad del contagio interno": (760, 125), "unidades academicas por institucion": (980, 140),
             "unidades de entrada por cliente": (250, 430), "unidades iniciales": (420, 420),
             "fraccion de churn de unidades": (820, 410)},
        sombras={"conversion de pilotos": (200, 230), "Instituciones cliente": (980, 260),
                 "churn de instituciones": (300, 540), "compras al terminar la virtualizacion": (130, 170)},
        bucles=[("R", 640, 260, "R2 land and expand", False), ("B", 420, 240, "B2 saturacion interna", True)],
    ),
    dict(
        titulo="3 docentes",
        stocks={"Docentes activos": (380, 300), "Docentes certificados": (800, 300)},
        flujos=[("incorporacion neta de docentes", (120, 300), "Docentes activos", 240, 300, "below"),
                ("certificacion de docentes", (800, 90), "Docentes certificados", 800, 190, "right", True),
                ("salida de docentes certificados", "Docentes certificados", (1080, 300), 950, 300, "below")],
        aux={"docentes comprometidos deseados": (240, 160), "fraccion de docentes comprometidos": (430, 120),
             "fraccion maxima de docentes comprometidos": (430, 30), "fraccion base de docentes comprometidos": (240, 60),
             "activar compromiso docente": (640, 40), "efecto de la certificacion en el compromiso": (640, 110),
             "fraccion de docentes certificados": (600, 210), "docentes por unidad": (90, 120),
             "tiempo de adopcion docente": (200, 430), "fraccion mensual de certificacion docente": (980, 120),
             "permanencia de docentes": (950, 420), "capacidad de emision": (380, 470),
             "evidencias por docente": (560, 500)},
        sombras={"Unidades activas": (70, 220), "unidades iniciales": (580, 400)},
        bucles=[("R", 520, 270, "R4 compromiso docente", False), ("B", 300, 230, "B3 ajuste", True)],
    ),
    dict(
        titulo="4 estudiantes",
        stocks={"Credenciales emitidas": (720, 200), "Titulares activos": (720, 480)},
        flujos=[("emision de credenciales", (380, 200), "Credenciales emitidas", 550, 200, "above"),
                ("credenciales docentes", (1000, 200), "Credenciales emitidas", 870, 200, "above"),
                ("nuevos titulares", (380, 480), "Titulares activos", 550, 480, "below"),
                ("desactivacion de titulares", "Titulares activos", (1060, 480), 890, 480, "below")],
        aux={"demanda institucional de credenciales": (230, 110), "emision programada por unidad": (230, 30),
             "demanda estudiantil de credenciales": (300, 360), "demanda de credenciales": (380, 280),
             "activar habito estudiantil": (110, 420), "solicitudes por titular": (150, 330),
             "credenciales docentes": (870, 230),
             "credenciales por docente certificado": (1040, 110), "fraccion de emisiones a nuevos titulares": (470, 580),
             "credenciales por titular nuevo": (640, 600), "tiempo de uso activo": (890, 590),
             "tiempo base de uso activo": (800, 660), "extension del uso por valor": (1000, 660),
             "compartidas por titulares": (1000, 380), "usos por titular": (1080, 300),
             "credenciales iniciales": (720, 90), "titulares iniciales": (640, 380)},
        sombras={"Unidades activas": (60, 60), "capacidad de emision": (550, 90),
                 "certificacion de docentes": (1000, 40), "Valor percibido de la credencial": (430, 420)},
        bucles=[("R", 480, 400, "R3 habito estudiantil", False)],
    ),
    dict(
        titulo="5 empresas",
        stocks={"Empresas potenciales": (200, 320), "Empresas usuarias": (620, 320)},
        flujos=[("adopcion de empresas", "Empresas potenciales", "Empresas usuarias", 410, 308, "above"),
                ("churn de empresas", "Empresas usuarias", "Empresas potenciales", 410, 333, "below")],
        aux={"fraccion de prospeccion de empresas": (200, 190), "contagio empresarial": (360, 180),
             "atraccion por talento": (530, 180), "activar boca a boca empresarial": (230, 90),
             "efectividad del boca a boca empresarial": (380, 50), "empresas en el mercado": (80, 440),
             "activar flywheel empresas": (560, 60), "atraccion maxima por talento": (720, 70),
             "probabilidad de encontrar talento": (820, 220), "talento de referencia": (1000, 200),
             "fraccion de churn de empresas": (300, 470), "reduccion del churn por exito": (500, 480),
             "empresas iniciales": (620, 440), "busquedas de talento": (840, 360), "busquedas por empresa": (1010, 320),
             "contrataciones por credencial": (840, 470), "contrataciones por busqueda exitosa": (1030, 440),
             "verificaciones de empresas": (840, 570), "verificaciones por busqueda": (1030, 560),
             "dias de contratacion ahorrados": (650, 600), "dias ahorrados por contratacion": (450, 620)},
        sombras={"Titulares activos": (1000, 110)},
        bucles=[("R", 480, 250, "R7 boca a boca", False), ("R", 700, 260, "R5 talento", True)],
    ),
    dict(
        titulo="6 ecosistema",
        stocks={}, flujos=[],
        aux={"uso de credenciales": (330, 250), "valor indicado de la credencial": (580, 250),
             "Valor percibido de la credencial": (840, 250), "uso de referencia": (450, 380),
             "peso del uso": (600, 400), "empresas de referencia": (760, 380),
             "tiempo de percepcion del valor": (840, 140)},
        sombras={"compartidas por titulares": (120, 180), "verificaciones de empresas": (120, 320),
                 "Empresas usuarias": (580, 120)},
        bucles=[],
    ),
    dict(
        titulo="7 paid media",
        stocks={"Propuestas de paid media en curso": (500, 400), "Clientes ganados con paid media": (1000, 400),
                "Gasto acumulado de la tactica": (800, 640)},
        flujos=[("entrada de propuestas de paid media", (220, 400), "Propuestas de paid media en curso",
                 350, 400, "below"),
                ("salida de propuestas de paid media", "Propuestas de paid media en curso", (700, 400),
                 610, 400, "below"),
                ("clientes nuevos de paid media", (860, 400), "Clientes ganados con paid media", 920, 400, "above"),
                ("gasto de la tactica", (560, 640), "Gasto acumulado de la tactica", 680, 640, "below")],
        aux={"activar paid media": (420, 50), "fraccion de potenciales con emisor competidor": (230, 40),
             "instituciones con emisor competidor": (180, 130), "alcance maximo mensual": (80, 230),
             "leads calificados de paid media": (400, 190), "costo por lead": (610, 60),
             "fraccion de leads calificados": (630, 130), "presupuesto de paid media": (640, 250),
             "presupuesto base de paid media": (820, 170), "fraccion de ingresos reinvertida": (1010, 120),
             "ingreso mensual de clientes de paid media": (1000, 250), "ingreso anual por cliente nuevo": (1180, 300),
             "meses por ano": (1180, 200), "costo de una virtualizacion gratis": (520, 740),
             "costo por cliente de paid media": (1060, 600), "retorno anual por dolar invertido": (1060, 720)},
        sombras={"Instituciones potenciales": (60, 60), "propuestas de paid media sin cupo": (150, 330),
                 "virtualizaciones que pasan al pipeline": (150, 480), "duracion del piloto": (560, 300),
                 "compras al terminar la virtualizacion": (780, 500), "fraccion de conversion de pilotos": (700, 330),
                 "inicio de virtualizaciones gratis": (380, 640)},
        bucles=[("R", 820, 320, "R8 pauta pagada", True), ("B", 300, 120, "B5 publico se agota", False)],
    ),
]


def _entradas(texto):
    """name -> (tipo, expresion, valor inicial) a partir del texto de ecuaciones."""
    res = {}
    for bloque in texto.split("|"):
        lineas = [l for l in bloque.split("\n") if l.strip() and not l.strip().startswith("*")]
        cuerpo = " ".join(l.strip() for l in lineas).split("~")[0].replace("\\ ", "")
        if "=" not in cuerpo:
            continue
        nombre, expr = cuerpo.split("=", 1)
        nombre, expr = nombre.strip(), expr.strip()
        if expr.startswith("INTEG"):
            interior = expr[expr.index("(") + 1:expr.rindex(")")]
            nivel, partes, actual = 0, [], ""
            for c in interior:
                if c == "," and nivel == 0:
                    partes.append(actual); actual = ""
                    continue
                nivel += c == "("; nivel -= c == ")"
                actual += c
            partes.append(actual)
            res[nombre] = ("stock", partes[0].strip(), partes[1].strip())
        else:
            res[nombre] = ("aux", expr, None)
    return res


def _patron(nombres):
    import re
    alts = "|".join(re.escape(n).replace(r"\ ", r"\s+") for n in sorted(nombres, key=len, reverse=True))
    return re.compile(r"(?<![\w])(" + alts + r")(?![\w])", re.IGNORECASE)


def _dependencias(expr, patron, canon):
    return list(dict.fromkeys(canon[m.group(1).lower()] for m in patron.finditer(expr)))


def _polaridades(ecs, patron, canon, valores):
    """Signo de d(destino)/d(origen) evaluando cada ecuacion con los valores de una corrida."""
    import math
    funcs = {"MIN": min, "MAX": max, "EXP": math.exp, "ZIDZ": lambda a, b: a / b if abs(b) > 1e-6 else 0.0,
             "SMOOTH3": lambda x, t: x}
    pol = {}
    for destino, (tipo, expr, _) in ecs.items():
        if tipo != "aux":
            continue
        deps = _dependencias(expr, patron, canon)
        py = patron.sub(lambda m: f"V[{canon[m.group(1).lower()]!r}]", expr).replace("^", "**")
        for origen in deps:
            signos = set()
            for V in valores:
                try:
                    f0 = eval(py, dict(funcs), {"V": V})
                    W = dict(V); W[origen] = V[origen] * 1.0001 if V[origen] else 1e-4
                    f1 = eval(py, dict(funcs), {"V": W})
                except (ZeroDivisionError, OverflowError, ValueError):
                    continue
                if abs(f1 - f0) > 1e-12 * max(1.0, abs(f0)):
                    signos.add("+" if f1 > f0 else "-")
            if len(signos) == 1:
                pol[(origen, destino)] = signos.pop()
    return pol


def diagrama(valores=None):
    ecs = _entradas(ECUACIONES)
    canon = {n.lower(): n for n in ecs}
    patron = _patron(ecs)
    pol = _polaridades(ecs, patron, canon, valores) if valores else {}
    colocadas = {}
    vistas = []
    for v in VISTAS:
        s = Sketch(v["titulo"])
        # orden fijo (stocks, flujos, auxiliares) para que el .mdl generado sea reproducible
        orden = list(dict.fromkeys(list(v["stocks"]) + [f[0] for f in v["flujos"]] + list(v["aux"])))
        propias = set(orden)
        for n in orden:
            assert n in ecs, f"{n!r} no tiene ecuacion"
            assert n not in colocadas, f"{n!r} esta en dos vistas"
            colocadas[n] = v["titulo"]
        for n, (x, y) in v["stocks"].items():
            s.stock(n, x, y)
        for f in v["flujos"]:
            nombre, de, a, x, y, lado = f[:6]
            s.flow(nombre, de, a, x=x, y=y, vertical=len(f) > 6 and f[6], label_side=lado)
        for n, (x, y) in v["aux"].items():
            if n not in s.ids:
                s.aux(n, x, y)
        sombras = {}

        def origen(dep, destino):
            if dep in propias:
                return dep
            if dep not in sombras:
                if dep in v["sombras"]:
                    x, y = v["sombras"][dep]
                else:
                    dx, dy = s.pos[s.ids[destino]]
                    x, y = dx - 140, dy - 70 - 25 * len(sombras)
                s.shadow(dep, x, y)
                sombras[dep] = "~" + dep
            return sombras[dep]

        for n in orden:
            tipo, expr, ini = ecs[n]
            if tipo == "stock":
                for dep in _dependencias(ini, patron, canon):
                    s.link(origen(dep, n), n, init=True)
            else:
                for dep in _dependencias(expr, patron, canon):
                    if dep == n:
                        continue
                    s.link(origen(dep, n), n, pol.get((dep, n)))
        for b in v["bucles"]:
            s.loop(*b[:4], clockwise=b[4])
        vistas.append(s)
    faltan = set(ecs) - set(colocadas)
    assert not faltan, f"variables sin vista: {sorted(faltan)}"
    return vistas


def _valores_de_corrida():
    """Valores de todas las variables en varios instantes (para las polaridades)."""
    try:
        import warnings
        warnings.filterwarnings("ignore")
        import pysd
    except ImportError:
        print("PySD no disponible: el diagrama se genera sin polaridades")
        return None
    import shutil
    import tempfile
    tmp = tempfile.mkdtemp()
    ruta = shutil.copy(SALIDA, tmp)
    nombres = list(_entradas(ECUACIONES))
    r = pysd.read_vensim(ruta).run(return_columns=nombres)
    return [{n: float(r.loc[t, n]) for n in nombres} for t in (0, 6, 12, 24, 36, 48, 60)]


def main():
    args = dict(final=60, step=0.125, unit="Month", first_var="Instituciones cliente",
                extra_units=UNIDADES, saveper="1")
    build(SALIDA, ECUACIONES, diagrama(), **args)          # 1.ª pasada: sin polaridades
    valores = _valores_de_corrida()
    if valores:
        build(SALIDA, ECUACIONES, diagrama(valores), **args)  # 2.ª pasada: con polaridades
    print("escrito", SALIDA)


if __name__ == "__main__":
    main()
