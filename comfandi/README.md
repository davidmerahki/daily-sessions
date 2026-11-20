# Comfandi: plataformas educativas

Investigación del 20 de noviembre de 2026 sobre las tres plataformas educativas de Comfandi (Click, Crea y el Campus virtual en Moodle 4.5) y sobre DataSAE, la opción hacia la que piensan evolucionar Click.

> **Cómo se hizo.** Con búsquedas web. La red de este entorno no dejó abrir las páginas directamente (comfandi.com.co, datasae.com, sistel.co y moodledev.io quedaron bloqueados), así que los datos salen de lo que tiene indexado el buscador. Lo que no viene de una fuente oficial, o que es una deducción, va marcado **(verificar)**.

## Resumen

| Plataforma | Qué es | Proveedor | Documentación pública |
|---|---|---|---|
| **Click** | El "Sistema Integrado de Gestión Académica" de los colegios Comfandi: notas, módulo para padres ("Mi aula amiga") y pagos escolares | No se dice en ninguna parte. Hay indicios de que es el SIGA de DataSAE **(verificar)** | Casi ninguna: un botón "Ir a Click" en la web de Comfandi y un video tutorial de hace unos 7 años |
| **Crea** | LMS corporativo SENSEI de SISTEL. Lo más probable es que sea la plataforma del programa de emprendimiento Creactívate (`creactivatecomfandi.com`) **(verificar)** | SISTEL (Sistemas Telemáticos SISTEL SAS, Cali) | Solo material comercial; no hay documentación técnica pública |
| **Campus virtual** | "Campus E Virtual" de Comfandi, sobre Moodle 4.5 LTS | Hay una instancia alojada por DataSAE (`moodlecomfandi.datasae.com`) con el mismo texto que el Campus E **(verificar que sea la misma)** | Completa: la documentación oficial de Moodle |
| **DataSAE 360** | Suite académica, administrativa y financiera para colegios, IES, ETDH y cajas de compensación (antes se llamaba SIGA / SAEnlinea) | DATASAE LTDA (Colombia, fundada en 2003) | Material comercial, fichas de directorio y apps; no hay manuales públicos |

## Hallazgo principal: DataSAE ya trabaja para Comfandi

La idea de "evolucionar Click a DataSAE" parece menos un cambio de proveedor que la consolidación de uno que ya está adentro:

1. **El Campus virtual ya lo aloja DataSAE.** `moodlecomfandi.datasae.com` se presenta como el espacio virtual "accesible para los afiliados de la Caja y el ecosistema empresarial del Valle del Cauca", con más de 3 000 cursos de Comfandi y de aliados como Platzi y Crehana. La página del Campus E de Comfandi usa casi las mismas palabras.
2. **También hay un Moodle de colegio en DataSAE.** `moodlecomfandicolegio17.datasae.com` aparece como "Aula virtual colegio adultos Cali".
3. **Comfandi Recreación ya usa DATASAE 360.** `comfandirecreacion.datasae.co/siga_new/...` sirve la preinscripción a servicios de recreación por mensualidades y los términos de turismo y crédito.
4. **DataSAE nombra a los colegios Comfandi como clientes.** Su ficha en ConnectAmericas los menciona junto a Comfacauca.
5. **El nombre de Click coincide con el producto de DataSAE.** Comfandi llama a Click "Sistema Integrado de Gestión Académica", y el producto de DataSAE se llama SIGA ("Software Integrado de Gestión Académica"). Un agregador de baja calidad habla de un "sistema SIGA-Click". Esto es un indicio, no una prueba **(verificar)**.

**Si se confirma** que Click es un SIGA de DataSAE con la marca Comfandi, el proyecto sería migrar de la generación anterior (SIGA / SAEnlinea) a DATASAE 360 con el mismo proveedor. Eso cambia la conversación: menos riesgo de migración de datos y más preguntas sobre la versión, la hoja de ruta y la concentración en un solo proveedor.

---

## 1. Click (SIS actual de los colegios)

**Lo que se sabe**
- La página de Educación de Comfandi tiene una sección "Sistema Integrado de Gestión Académica" con el botón **"Ir a Click"** y dice que los pagos escolares se hacen en línea "desde nuestro portal". El buscador fecha esa página hace unos 1 800 días.
- El video [Click Mi aula amiga](https://www.youtube.com/watch?v=Pmk0TF3Wuac), de hace unos 7 años, explica "el manejo de la plataforma tecnológica de Comfandi Click – Mi aula amiga, módulo para padres de familia".
- Comfandi tiene 11 colegios propios y un Colegio para Jóvenes y Adultos.
- Los pagos de Comfandi se hacen por PSE y, en algunos casos, con tarjeta de crédito. Las empresas en convenio pueden pagar por adelantado las mensualidades de los hijos de sus colaboradores.

**Lo que no se encontró**: el proveedor, el stack, la documentación de usuario actual, la URL directa y las integraciones (SIMAT, Moodle, pagos).

**Ojo con la seguridad.** En los resultados aparecieron dominios que no son de Comfandi pidiendo inicio de sesión para "matrículas escolares" (`sucursalcomfandi.com`), y páginas de spam que copian "click comfandi educación". Conviene que el área de TI de Comfandi los revise, por si se trata de suplantación.

**Homónimo.** *Clickedu* es otro sistema escolar, español, sin relación con Click. Sus manuales salen mucho en las búsquedas.

## 2. DataSAE (DATASAE 360)

**Empresa**
- DATASAE LTDA, Colombia. ConnectAmericas dice que fue fundada en 2003 y que tiene unos 19 empleados. Su sitio habla de "23 años de experiencia", lo que cuadra con esa fecha.
- Ofrece software de gestión académica, el *Datasae Virtual Center* (cursos virtuales sobre Moodle) e infraestructura (hosting).
- Atiende universidades, instituciones técnicas y tecnológicas, institutos de idiomas, ETDH, colegios y cajas de compensación.

**Líneas de producto**

| Producto | Segmento | Notas |
|---|---|---|
| DATASAE 360 – SIGA (antes SIGA Superior) | Educación superior y ETDH | Web y modular. Tiene app para estudiantes en iOS y Android |
| DATASAE 360 – Colegios (antes SAEnlinea / SIGA Colegios) | Preescolar, básica y media | La app de iOS es nueva (`id6803553955`); en Android sigue el paquete `com.datasae.saenlinea` |
| Datasae Virtual Center | Todos | Moodle alojado y administrado por DataSAE |

**Módulos que se declaran** (ficha del proveedor en Guiatic)
- *Académico:* configuración, programación académica, admisiones, registro y control académico, matrícula académica y egresados.
- *Financiero:* matrícula financiera, recaudo en caja, bancos y pasarelas de pago, facturación electrónica ante la DIAN y créditos educativos.
- *Reportes:* SNIES y SPADIES.
- *App de estudiante:* notas, horarios, mensajes institucionales, recibos en PDF con pago en línea, perfil y acceso al aula virtual Moodle. Entre las novedades de la app figura la "Integración con Moodle (aula virtual)".

**Tecnología** (misma ficha): PostgreSQL, PHP 7, JavaScript, PL/pgSQL y Java, en modo cliente/servidor o web. PHP 7 no tiene soporte desde 2022; puede que la ficha esté desactualizada, así que hay que preguntar por el stack actual **(verificar)**.

**Otros clientes con Moodle o SIGA en DataSAE**: Comfenalco Valle (`moodlecomfenalco1.datasae.com`, "Implementado por Datasae"), Uniempresarial, Unicafam (tiene su propia app), Colegiatura, UCEVA y otros subdominios `moodle*.datasae.com`.

**Lo que no se encontró**: reportes SIMAT y SIET, boletines según el Decreto 1290, API pública, SSO, la pasarela de pagos concreta, los acuerdos de servicio (SLA), los precios y un manual de usuario público.

## 3. Crea (SISTEL – LMS SENSEI)

**Empresa**
- Sistemas Telemáticos SISTEL SAS, de Cali (Valle del Cauca). Trabaja desde 1999 construyendo aulas virtuales, escuelas corporativas y universidades corporativas.
- Es B Corp desde mayo de 2024, con 83,2 puntos (la mediana es 50,9).
- ConnectAmericas le atribuye unos 50 empleados y sede en Panamá, lo que choca con la ficha B Corp **(verificar)**.

**Productos**
- **SENSEI LMS**, desarrollado por SISTEL y ofrecido como SaaS ("School as a Service"): sistema de reportes propio para seguir a cada usuario frente a su plan de capacitación, escuelas y rutas por cargo y perfil, programas por grupo, y personalización gráfica y funcional.
- **Caja de Herramientas / cursos LPU ("Listos Para Usar")**: más de 250 cursos en español en formato SCORM, personalizables con el logo del cliente.
- **SENSE IA Studio** (`senseistudio.co`): crea cursos con IA y los publica en SCORM o como URL.
- **Clientes conocidos**: Manuelita (Universidad Manuelita), Siesa (SIESA Innova) y Miami Emprendedores.

**¿Crea = Creactívate?** El dominio `creactivatecomfandi.com` se describe como "plataforma de formación virtual corporativa (e-learning) de SISTEL" y menciona SENSEI. Pero el texto habla de una licencia para Manuelita, como si fuera una plantilla sin adaptar. Creactívate es el programa de emprendimiento de Comfandi (más de 59 000 emprendedores atendidos, modelo "CreActívate 4.0"). Lo más probable es que "Crea" sea esa plataforma **(verificar)**.

**Homónimo.** *Sensei LMS* de Automattic es un plugin de WordPress que no tiene que ver con SISTEL, y copa los resultados de búsqueda. No hay que usar su documentación.

**Lo que no se encontró**: documentación técnica, API, SSO (SAML u OIDC), importación y exportación SCORM o xAPI, LTI, exportación de datos y certificados.

## 4. Campus virtual (Moodle 4.5)

**Campus E Virtual de Comfandi**
- Está en `campusevirtual.comfandi.edu.co` ("Powered by Moodle") y lo presenta la página [Campus E](https://www.comfandi.com.co/personas/educacion/campus-e).
- Es para afiliados y empresas, con formación autónoma, formación virtual asistida con tutor (sesiones sincrónicas y asincrónicas) y contenidos a la medida de cada empresa.
- Tiene rutas para mipymes y emprendedores, las Escuelas de Formación Comfandi y acceso a Platzi y Crehana en planes trimestrales o semestrales.
- Hay precio para afiliados: un curso de Power BI cuesta $30 000 regular y $10 800 para afiliados.
- Comprobar si `campusevirtual.comfandi.edu.co` y `moodlecomfandi.datasae.com` son la misma instancia **(verificar)**.

**Moodle 4.5 LTS** (moodledev.io)
- Salió el 7 de octubre de 2024. El soporte general terminó el 6 de octubre de 2025. **El soporte de seguridad termina el 4 de octubre de 2027.**
- Requiere PHP 8.1 a 8.3, de 64 bits, con la extensión `sodium` y `max_input_vars` de al menos 5000.
- Trae más de 250 mejoras. La principal es un **subsistema de IA**: el administrador decide si usa IA, con qué proveedor y en qué partes del sitio (generar contenido, resumir).

**Hoja de ruta** (fuentes de terceros que citan moodledev.io) **(verificar)**

| Versión | Salida | Notas para quien viene de 4.5 |
|---|---|---|
| 5.0 | Abril de 2025 | PHP 8.2 o superior, Bootstrap 5 (afecta los temas a medida) y deja de soportar Oracle |
| 5.1 | Octubre de 2025 | Los archivos web pasan a la carpeta `/public`: hay que cambiar el *document root* |
| 5.2 | Abril de 2026 | Seguridad hasta octubre de 2027 |
| **5.3 LTS** | 5 de octubre de 2026 | Se actualiza desde 4.4 o posterior, así que **4.5 puede saltar directo**. PHP 8.3 o superior. Seguridad hasta el 1 de octubre de 2029 |

**Qué implica para Comfandi**: 4.5 ya solo recibe parches de seguridad. Lo natural es planear el paso a 5.3 LTS antes de octubre de 2027, revisando el tema y los plugins por Bootstrap 5, el PHP 8.3 y el cambio a `/public`. Si DataSAE es quien aloja el Moodle, esa actualización le toca a DataSAE.

**Integraciones de Moodle que importan aquí**: servicios web REST, LTI 1.3 / Advantage (para conectar SENSEI u otras herramientas), matriculación por base de datos o archivo plano (para sincronizar con el SIS), y SSO por OAuth2 o SAML.

---

## Cómo encajan hoy

```
                     ┌─────────────────────── DataSAE ────────────────────────┐
Familias / alumnos ─▶│ Click (¿SIGA?) ──▶ DATASAE 360 (a donde quieren ir)    │
                     │       │                                                │
                     │       └─ app ──▶ aula virtual ──▶ Moodle 4.5           │
                     │                                   (Campus E y colegio  │
                     │                                    de adultos)         │
                     │ Recreación: DATASAE 360 (ya en uso)                    │
                     └────────────────────────────────────────────────────────┘
Emprendedores / empresas ─▶ Crea (SISTEL SENSEI): sin integración conocida
```

## Preguntas para validar con Comfandi y los proveedores

**Click y DataSAE**
1. ¿Click es un SIGA o SAEnlinea de DataSAE con marca Comfandi, o es otro sistema? ¿En qué versión está?
2. ¿Qué cubre Click hoy (colegios, ETDH, educación superior, jóvenes y adultos) y cuántos usuarios tiene?
3. ¿Qué gana Comfandi con DATASAE 360 frente a lo actual: app, pagos, facturación DIAN, reportes SIMAT, SIET y SNIES, boletines según el Decreto 1290?
4. ¿Qué stack, SLA, respaldo, API y SSO ofrece DATASAE 360? ¿Sigue en PHP 7?
5. ¿Qué tan cómodo está Comfandi concentrando SIS, Moodle y recreación en un proveedor de unos 20 empleados? ¿Qué plan de salida tiene si algo falla?

**Moodle**

6. ¿Quién administra el Moodle 4.5: DataSAE o el equipo interno? ¿Cuándo está prevista la actualización a 5.3 LTS?

**Crea y SISTEL**

7. ¿Crea es la plataforma de Creactívate? ¿Quién la usa: emprendedores, colaboradores, empresas?
8. ¿SENSEI se integra con DataSAE o con Moodle (SSO, LTI, API)? ¿Los cursos LPU se pueden llevar a Moodle en SCORM?
9. ¿Tiene sentido mantener dos LMS (SENSEI y Moodle) o se piensa consolidar?

**Para merahki**

10. ¿Dónde entrarían las credenciales digitales: en el Moodle (insignias, Open Badges), en el SIS (títulos y certificados) o en SENSEI (certificados de cursos)?

## Fuentes

**Comfandi**
- [Educación – Comfandi](https://www.comfandi.com.co/personas/educacion) (sección "Ir a Click")
- [Campus E Virtual – Comfandi](https://www.comfandi.com.co/personas/educacion/campus-e) y [campusevirtual.comfandi.edu.co](https://campusevirtual.comfandi.edu.co/)
- [Colegios Comfandi](https://www.comfandi.com.co/personas/educacion/colegios) y [Colegio para Jóvenes y Adultos](https://www.comfandi.com.co/personas/educacion/colegio-para-jovenes-y-adultos-comfandi)
- [Medios de pago](https://www.comfandi.com.co/personas/medios-de-pago)
- [Creactívate – Comfandi](https://www.comfandi.com.co/personas/fomento-empresarial/creactivate)
- [Video "Click Mi aula amiga"](https://www.youtube.com/watch?v=Pmk0TF3Wuac)

**DataSAE**
- [datasae.com](https://www.datasae.com/en/)
- [Ficha DATASAE 360 en Guiatic](https://guiatic.com/co/240-sistemas-de-gestion-y-control-academico-sector-educativo/1086-datasae-360-software-premium-de-gestion-academica-para-instituciones-educativas-sistema-modular-y-configurable-para-la-gestio)
- [Perfil en ConnectAmericas](https://connectamericas.com/pt/node/193396)
- [App DATASAE 360 – SIGA (iOS)](https://apps.apple.com/us/app/datasae-360-siga/id1594695840), [Google Play](https://play.google.com/store/apps/details?id=com.datasae.siga&hl=en_US)
- [App DATASAE 360 – Colegios (iOS)](https://apps.apple.com/co/app/datasae-360-colegios/id6803553955?l=en-GB), [Google Play](https://play.google.com/store/apps/details?id=com.datasae.saenlinea&hl=en)
- [SAEnlinea](http://www.saenlinea.com/paginas/intro.htm) y [@datasaeltda en X](https://x.com/datasaeltda)
- Instancias para Comfandi: [moodlecomfandi.datasae.com](https://moodlecomfandi.datasae.com/), [moodlecomfandicolegio17.datasae.com](https://moodlecomfandicolegio17.datasae.com/), [Recreación en DATASAE 360](https://comfandirecreacion.datasae.co/siga_new/web/app.php/preinscripcion_comfandirecreacion/)
- Otros clientes: [Comfenalco Valle](https://moodlecomfenalco1.datasae.com/), [Uniempresarial](https://moodleuniempresarial.datasae.com/), [App Unicafam](https://play.google.com/store/apps/details?id=com.datasae.siga.unicafam&hl=en_US)

**SISTEL**
- [sistel.co](https://www.sistel.co/) y [Plataforma SENSEI LMS](https://sistel.co/sensei/)
- [SENSE IA Studio](https://senseistudio.co/)
- [Ficha B Corp](https://www.bcorporation.net/en-us/find-a-b-corp/company/sistemas-telematicos-sistel-sas/), [ConnectAmericas](https://connectamericas.com/company/sistel) y [LinkedIn](https://co.linkedin.com/company/sistel-co)
- [SISTEL y las universidades corporativas (Chilealdia)](https://chilealdia.biz/sistel-lider-en-formacion-virtual-corporativa-lanza-su-nuevo-modelo-de-capacitacion-desarrollo-de-universidades-corporativas/) y [SIESA Innova (Portal ERP)](https://portalerp.com/co/noticia/siesa-impulsa-el-talento-interno-con-el-lanzamiento-de-siesa-innova)
- [creactivatecomfandi.com](http://www.creactivatecomfandi.com/)

**Moodle**
- [Moodle 4.5: notas de la versión](https://moodledev.io/general/releases/4.5) y [documentación para desarrolladores 4.5](https://moodledev.io/docs/4.5)
- [Novedades de 4.5 (MoodleDocs)](https://docs.moodle.org/405/en/New_features)
- [Anuncio de Moodle LMS 4.5 y su IA](https://moodle.org/mod/forum/discuss.php?d=462651)
- [Cambios importantes en Moodle 5.0](https://moodle.org/mod/forum/discuss.php?d=467335) y [actualizar a 5.0](https://docs.moodle.org/500/en/Upgrading)
- [Moodle 5.3: notas de la versión](https://moodledev.io/general/releases/5.3) y [compatibilidad con PHP](https://docs.moodle.org/503/en/PHP)
- Fechas de 5.x según terceros: [ldesignmedia](https://ldesignmedia.nl/en/blog/moodle-5-3-lts-new-standard), [latestat](https://latestat.com/moodle) y [edzlms](https://edzlms.com/moodle-5-0-end-of-support-5-3-lts/)
