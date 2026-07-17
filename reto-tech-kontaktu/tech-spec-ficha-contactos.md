# Reto técnico Kontaktu — Ficha de contactos

## Contexto

Kontaktu es un CRM inmobiliario AI-first. Nuestros agentes de IA atienden llamadas telefónicas y conversaciones de WhatsApp de personas interesadas en comprar o alquilar vivienda, las cualifican y las registran en el CRM. Además, entran contactos por formularios web, campañas de Meta, importaciones de otros CRM y alta manual.

Eso nos crea el problema real que queremos que resuelvas: **la heterogeneidad**. Cada canal escribe campos distintos. Un contacto que viene de una llamada trae una cualificación rica (presupuesto, zona, habitaciones, financiación…) extraída por la IA de la conversación; uno de WhatsApp puede ser solo un teléfono y tres mensajes; uno de un formulario trae email pero no teléfono; uno importado trae los datos como los tenía el CRM anterior. Los teléfonos llegan en cuatro formatos, los nombres a veces en mayúsculas, a veces no llegan, y la cualificación es un conjunto de «hechos» que puede tener claves que no conocías ayer.

Tu tarea: construir la **ficha de contacto** (la pantalla de detalle) que un agente inmobiliario abriría antes de llamar a esa persona — y que se vea digna con CUALQUIERA de los contactos del dataset adjunto, del más rico al más vacío.

## Material adjunto

| Fichero | Qué es |
|---|---|
| `contactos.json` | Dataset de contactos con sus interacciones, tal y como salen de nuestro mundo real (con sus miserias) |
| `guia-diseno-kontaktu.md` | Nuestra guía de diseño — queremos que la pantalla parezca de Kontaktu |
| `diseno-referencia-ficha-contacto.png` | **Nuestra ficha de contacto actual.** Úsala como referencia de estructura y de lenguaje visual — pero ojo: el dataset trae problemas que esta pantalla todavía no resuelve. Queremos ver tus decisiones, no una fotocopia |
| `diseno-referencia-contactos.png` | Captura de nuestro listado de contactos, misma referencia visual |
| `diseno-referencia-dashboard.png` | Captura de nuestro panel de control, misma referencia |
| `kb-propiedades-voz.json` | Catálogo de 6 propiedades — para el bonus de voz y para la user story de matching |

## Requisitos core

Stack: **Next.js** (App Router recomendado) + **TypeScript**. Estilos con lo que domines (Tailwind recomendado; shadcn/ui bienvenido).

- **R1 — Listado navegable (auxiliar).** Un listado simple de contactos (identidad, origen, última interacción) desde el que se abre la ficha. Sin paginación ni florituras: es solo la puerta de entrada — **el protagonista del reto es la ficha de detalle**, no el listado.
- **R2 — Cabecera de identidad robusta.** Nombre con fallbacks sensatos cuando no hay (teléfono legible → email → algo digno), avatar con iniciales, badge de canal de origen **normalizado**, teléfono en formato legible, fecha de alta.
- **R3 — Cualificación renderizada dinámicamente.** Es el corazón del reto. La sección de cualificación no puede ser un formulario con campos fijos: debe pintar las claves que vengan (también las que no conocías), agrupadas por operación (compra / alquiler / comunes), soportando tipos mixtos sin romperse. Cada hecho muestra su **procedencia** (dicho por el cliente en conversación vs editado por un humano) y su fecha. Pista: cuando un humano ha corregido un dato, eso es lo que manda.
- **R4 — Timeline de interacciones.** Llamadas (con resumen visible y transcripción plegable), mensajes de WhatsApp y envíos de formulario, mezclados en orden cronológico real — aunque las fechas vengan en formatos dispares.
- **R5 — Estados.** Cargando, error, contacto no encontrado, y — importante — una ficha **digna** para el contacto que apenas tiene datos.
- **R6 — Decisiones documentadas.** Los datos vienen como vienen. No hay una respuesta única para cada caso raro; hay decisiones defendibles. Toma las tuyas y déjalas escritas (README o en la propia UI).
- **R7 — Diseño Kontaktu.** Sigue la guía adjunta: tokens, escala tipográfica, colores de estado. Que parezca una pantalla nuestra, no un template.
- **R8 — El JSON se sirve como una API.** Cárgalo a través de un route handler o server action (con una pequeña latencia simulada si quieres), no importándolo directamente en el componente — así los estados de carga son reales.
- **R9 — Código para el siguiente.** Organizado como si mañana lo tocara otra persona del equipo.

## User stories abiertas — elige 2 o 3

Estas historias están sin resolver a propósito. Elige **2 o 3** (no más), las que a ti te parezcan más valiosas, e implémentalas a tu manera. Qué eliges y por qué nos dice tanto como el código.

1. **Salud del dato.** Un indicador de completitud de la ficha: qué le falta a este contacto para poder trabajarlo bien.
2. **Posibles duplicados.** Detectar y señalar contactos que probablemente son la misma persona (hay al menos un caso en el dataset). Propón cómo sería la fusión.
3. **Teléfonos siempre bien.** Normalización a formato internacional, y acciones de llamar / abrir WhatsApp desde la ficha.
4. **Siguiente mejor acción.** Para cada contacto, sugerir qué haría un buen agente ahora (llamar, escribir, pedir documentación…) — por reglas o con LLM.
5. **Editar un hecho de cualificación.** Edición manual de un dato con su validación — y decide qué pasa con el valor que había dicho la IA.
6. **Búsqueda que funciona de verdad.** Búsqueda/filtros en el listado que funcionen sobre estos datos heterogéneos (por zona, presupuesto, origen…).
7. **Resumen ejecutivo con LLM.** Un resumen del contacto generado a partir de la ficha y la transcripción de la llamada — con su manejo de errores.
8. **Matching con el catálogo.** Cruzar la cualificación del contacto con las 6 propiedades de `kb-propiedades-voz.json` y mostrar las que encajan y por qué.
9. **Vista «antes de llamar».** Una tarjeta compacta con lo esencial que un agente necesita leer en 10 segundos antes de descolgar.
10. **Cumplimiento.** Hay contactos que no han dado consentimiento o han pedido no ser llamados: cómo lo señalizas y qué acciones bloqueas.

## Bonus (100 % opcional): agente de voz en LiveKit

Si te apetece y te queda tiempo dentro del tope: con el plan free de LiveKit, un agente de voz que atienda la llamada de la agencia usando `kb-propiedades-voz.json` como base de conocimiento, con **al menos una tool** (por ejemplo, `buscar_propiedades(zona, presupuesto)` que filtre el catálogo). Punto extra si se despide y cuelga él solo.

No hacerlo no penaliza en absoluto. Si lo intentas y te quedas a medias, cuéntanos hasta dónde llegaste — esa conversación nos vale igual.

## Qué evaluamos

- Cómo dirigiste a tu IA (qué le pediste, con qué specs) y **cómo verificaste** lo que te devolvió.
- Las decisiones que tomaste con los datos sucios — y que estén escritas.
- Tu criterio de priorización: qué hiciste, qué descartaste y por qué.
- Fidelidad a la guía de diseño.
- La calidad de lo entregado, no la cantidad. Preferimos 3 cosas bien resueltas que 10 a medias.

## Entrega

- Repo (GitHub) con README: decisiones tomadas, qué priorizaste y por qué, dónde se equivocó la IA y cómo lo cazaste, y qué harías con un día más.
- Instrucciones para correrlo en local (o deploy en Vercel si te apetece — el plan free sobra).
- Después cuadramos una sesión en directo para que nos lo enseñes y te pediremos algún cambio pequeño en vivo.

## Reglas del juego

- **Tiempo máximo: entre 1 y 2 horas en total** (bonus incluido si lo haces). No le dediques más bajo ningún concepto.
- Apóyate en Claude Code, Codex o la herramienta de IA que uses — somos una compañía AI-native.
- **No esperamos que llegues a todo.** Elegir bien con tiempo limitado es exactamente el trabajo.
