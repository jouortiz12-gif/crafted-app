# Crafted Kitchen and Taps · actualización

Menú móvil simplificado con 123 productos en 23 categorías, logo original y 26 fotografías oficiales. Inicio compacto con Instagram y acceso a reseñas de Google. Precios con símbolo pequeño elevado.

Cada presentación permite Elegir y ajustar cantidades. La isla Ordenar abre WhatsApp con productos, presentaciones, cantidades y subtotal en USD. El resumen permite añadir mesa y notas. Número de pedidos: +1 832 316 5870, editable en Mesas y pedidos. El cliente indica su nombre antes de abrir WhatsApp. El mensaje separa los bloques con líneas en blanco e incluye nombre y mesa. El cliente pulsa Enviar; no existe envío automático ni confirmación de recepción. El borrador se conserva solo durante la sesión del navegador.

Descripciones del catálogo disponibles en español, inglés, francés, chino y ruso. Se usan resúmenes fieles; marcas permanecen originales. Ingredientes completos y alérgenos requieren confirmación del personal. Traducciones de respaldo solo se aplican a productos importados cuyo nombre y descripción original coinciden. Grilled Cheese & Tomato Bisque publica sus precios en la descripción: mitad y taza USD10; completo y tazón USD14.

Fuentes: https://craftedkt.com/katy-firethorne-crafted-kitchen-and-taps-food-menu y https://craftedkt.com/katy-firethorne-crafted-kitchen-and-taps-drink-menu

Acceso a reseñas obtenido con Google Review Link & QR; Google permite que cada visitante elija su calificación. Se retiró el modal con notas internas de importación. El panel incluye edición de productos, ingredientes, alérgenos, precios, presentaciones, disponibilidad y medios; Mesas y pedidos permite configurar hasta 100 mesas, copiar los enlaces para NFC y descargar cada QR como SVG. Todos usan /b/<slug>?mesa=N; un escaneo posterior sustituye la mesa guardada durante la sesión. La mesa indica el enlace utilizado y no verifica presencia física. El enlace del menú queda fijo en el panel para conservar los QR. La publicación conserva el acceso privado; antes de usar placas con clientes se debe habilitar el acceso correspondiente. Old Rasputin y las dos presentaciones Crowler de Art Car requieren confirmación del bar por inconsistencias de la fuente.

---

# Barra - Menú digital para bares

Aplicación para teléfonos con catálogo público por negocio y panel del dueño. El sitio se entrega privado para revisión; el acceso público a clientes se habilita por separado.

## Puesta en marcha

1. Abrir `/admin` e iniciar sesión con ChatGPT.
2. Pulsar **Crear mi menú**. Esta operación crea un catálogo propio en D1; no usa el almacenamiento del navegador para los registros del negocio.
3. Reemplazar los productos, precios, recetas y fotos de ejemplo.
4. Editar identidad, categorías, traducciones y divisas.
5. Guardar cambios. Compartir `/b/<slug>` cuando se habilite el acceso de clientes.

El botón **Explorar el panel con datos de ejemplo** abre una prueba temporal. No guarda datos del negocio.

## Arquitectura

- Vinext/React, TypeScript y CSS adaptable.
- Cloudflare Workers con D1 y R2 gestionados por Sites.
- Autenticación de ChatGPT y autorización de escritura por `owner_id`.
- Catálogo JSON por negocio, revisiones optimistas y categorías/productos validados en servidor.
- Asistente de reglas siempre disponible; Gemini opcional para selección de IDs del catálogo y traducción.
- Cloudinary opcional para optimización de entrega; subida R2 disponible sin él.
- Precios base MXN; USD/EUR manuales o consultados mediante Frankfurter.
- PWA con manifest, iconos, preferencia local de idioma/divisa y favoritos por dispositivo. Sin conexión se muestra una página informativa; no se presentan existencias antiguas como actuales.

## Estructura

| Ruta | Función |
| --- | --- |
| `app/menu-client.tsx` | Experiencia del cliente, tarjetas, filtros, favoritos y chat |
| `app/admin/panel.tsx` | Catálogo, categorías, identidad, divisas y estadísticas |
| `app/b/[slug]/page.tsx` | Menú de cada negocio |
| `app/preview/page.tsx` | Vista de teléfono dentro de un marco de 390 px |
| `app/api/*/route.ts` | Operaciones de catálogo, acceso, métricas, chat y archivos |
| `lib/validation.ts` | Reglas de validación y referencias entre productos |
| `lib/server.ts` | Acceso a D1, identidad, permisos, guardado e IA |
| `lib/menu.ts` | Recomendaciones de reglas, moneda y contraste |
| `lib/i18n.ts` | Textos de interfaz en cinco idiomas |
| `lib/seed.ts`, `lib/demo-translations.ts` | 16 productos y 8 categorías de ejemplo |
| `lib/media.ts`, `lib/media-validation.ts` | Subidas, firma de Cloudinary y validación de formato |
| `lib/rates.ts` | Tasas externas con caché y respaldo en tasa guardada |
| `db/schema.ts`, `drizzle/` | Modelo y migración de D1 |
| `public/` | Fotografías ilustrativas, iconos, manifest y service worker |
| `tests/` | Pruebas de reglas, validación e integración del Worker |

## Variables opcionales

Registrar los valores como secretos del servidor, nunca en el navegador ni en Git. `.env.example` incluye solo nombres.

| Variable | Uso |
| --- | --- |
| `GEMINI_API_KEY` | IA y traducciones automáticas |
| `GEMINI_MODEL` | Modelo; valor predeterminado `gemini-2.5-flash` |
| `CLOUDINARY_CLOUD_NAME` | Entorno multimedia |
| `CLOUDINARY_API_KEY` | Clave del servicio multimedia |
| `CLOUDINARY_API_SECRET` | Firma privada de subidas |

Si no hay IA, la aplicación muestra recomendaciones de reglas y avisa que falta la conexión para traducir. Las respuestas generativas solo pueden seleccionar IDs válidos: los precios e ingredientes se muestran desde los registros reales. Las preguntas de alergias no producen sugerencias declaradas seguras. Las propuestas grupales con presupuesto suman los precios en código.

Las imágenes se reducen a un máximo de 1600 px y se convierten a WebP antes de subir. Sin Cloudinary, el video se guarda tal como se recibe (MP4/WebM, máximo 15 MB). Con Cloudinary se entrega con `q_auto` y `f_auto`, sin exponer la clave privada.

## Datos y acceso

Cada identidad tiene un negocio y cada negocio tiene un catálogo. No se incluye facturación de suscripciones, asignación de varios empleados ni varias sucursales por dueño. Estas funciones no se detallan como módulos en el PRD y requieren una fase adicional si se desean.

El panel se puede visitar sin sesión para conocer el producto, pero toda lectura privada y escritura exige identidad en el servidor. Las cabeceras `oai-authenticated-user-*` las provee la plataforma; no deben aceptarse directamente desde Internet en una instalación propia sin una capa de autenticación que las valide.

Se valida origen en cambios, formato de archivos y límites de campos. Los guardados con una revisión antigua reciben HTTP 409 para evitar sobrescribir cambios. El catálogo público omite notas internas. La lectura del menú detecta cambios cada 3 segundos mientras la pestaña está visible; no usa WebSocket.

El navegador conserva preferencias, favoritos y el borrador temporal del pedido. No almacena credenciales, registros del negocio ni texto de conversaciones. Las métricas guardan categorías de preguntas, no transcripciones. Las vistas se deduplican con una huella diaria; las métricas no equivalen a ventas ni a visitantes únicos auditados.

## Desarrollo y pruebas

```bash
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/install-dependencies.mjs
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
```

La prueba de integración usa Miniflare con D1/R2 efímeros y dos identidades ficticias. No escribe en datos de producción. Debe ejecutarse tras compilar. Cubre creación de negocios, persistencia, separación de dueños, conflictos de revisión, métricas, controles de origen, errores de conexión IA y archivos.

Para cambios de esquema, ejecutar `pnpm db:generate`, inspeccionar y guardar las nuevas migraciones. No modificar migraciones aplicadas ni crear tablas en los manejadores HTTP.

En este entorno la vista previa se administra mediante `sites-preview start <ruta-del-proyecto>`. La publicación utiliza el flujo de Sites; su código y versiones permanecen unidos al repositorio del sitio.

## Límites de esta entrega

- Los nombres, recetas, fotos y precios iniciales son de ejemplo. Requieren sustitución y revisión del bar.
- No se configuraron claves externas ni se hicieron llamadas pagadas a IA o Cloudinary.
- Las notas del dueño influyen en selección de productos cuando se conecta Gemini; las respuestas libres sobre políticas no se generan automáticamente.
- El buscador de reglas entiende las consultas previstas; no sustituye la comprensión general de un modelo.
- El catálogo se limita a 300 productos y 40 categorías por negocio para mantener las cargas acotadas.
- Las traducciones automáticas requieren revisión humana; los campos sin traducir muestran el original.
- La venta adicional del 15-25% es una meta del PRD, no un resultado probado.
- El pedido se prepara como mensaje de WhatsApp; no incluye cobro, punto de venta ni inventario por cantidades. La disponibilidad es un interruptor, como pide el PRD.
- Instalación PWA, reproducción de video y apariencia requieren una prueba final en teléfonos físicos Android/iPhone con los archivos reales.

## Referencias de las integraciones

- Gemini: https://ai.google.dev/api/generate-content
- Divisas: https://frankfurter.dev/v1/
- Cloudinary: https://cloudinary.com/documentation/upload_images
- Optimización: https://cloudinary.com/documentation/video_optimization

Fotos de ejemplo de Unsplash descargadas para la entrega. No representan recetas reales ni productos del futuro cliente.
