# Continuar Crafted en Codex

## Primer mensaje sugerido
Lee CONTINUAR_EN_CODEX.md y README.md. Este es el proyecto existente de Crafted. No lo reconstruyas ni crees otro Site. Revisa el código, confirma qué puedes ejecutar en este entorno y conserva el sitio publicado y sus datos. Antes de editar, informa brevemente qué encontraste. Espera el siguiente cambio de Jou.

## Estado y procedencia
- Código exportado del commit: ae57cf2fd1f2f9fe65645e9ddf60c565b4333b64. La carpeta contiene el código fuente y las imágenes versionadas; no incluye el historial Git.
- Sitio: https://barra-menu-dym.arciniegajou.chatgpt.site
- Administrador: https://barra-menu-dym.arciniegajou.chatgpt.site/admin
- Site project_id: appgprj_6ae438d926b48191b6024875aef1d9c9, también en .openai/hosting.json. Reutilizarlo.
- El usuario autorizó acceso público al menú. El administrador debe seguir exigiendo identidad para editar. No cambiar la audiencia al publicar.
- Este ZIP no mueve esta conversación, no crea un proyecto de Codex y no conecta automáticamente el entorno nuevo al sitio.
- No incluye los registros de producción de D1, los archivos subidos a R2, credenciales ni secretos. Esos recursos permanecen en el sitio actual. No sustituirlos por datos de ejemplo.

## Lo implementado
Aplicación móvil de menú para Crafted Kitchen and Taps, Katy, Texas. React/TypeScript sobre Vinext y Cloudflare Workers; D1 DB, R2 BUCKET. Catálogo inicial: 123 productos, 23 categorías, 26 fotos oficiales y logo original. Precios base USD; MXN/EUR de referencia.

Inicio minimalista con foto de pared como fondo, capa oscura moderada, Instagram y reseñas Google. Símbolo monetario pequeño y elevado antes del importe. Descripciones ES/EN/FR/ZH/RU. Elegir y controles +/− por presentación. Isla inferior Ordenar abre resumen, exige nombre, permite mesa y notas y abre WhatsApp con líneas en blanco entre bloques. Número actual: +1 832 316 5870 (18323165870), editable en el panel. No enviar pedidos de prueba ni declarar recibido un pedido por abrir WhatsApp.

El panel /admin edita ingredientes, preparación, alérgenos, precios, presentaciones, fotos, traducciones, disponibilidad, identidad, divisas y asistente. Los datos guardados se leen en /b/<slug>; / lee crafted. La API valida dueño, origen y revisión para evitar sobrescrituras. No exponer cabeceras simuladas de identidad fuera del desarrollo local.

Mesas y pedidos configura hasta 100 mesas (12 por defecto), genera SVG de QR en el navegador y copia el enlace para NFC. Todos apuntan al mismo menú /b/<slug>?mesa=N. El menú toma la mesa del enlace y la conserva en la sesión; el cliente puede corregirla. No verifica ubicación física. No cambiar el slug tras imprimir placas.

## Archivos clave
- app/menu-client.tsx: menú, asistente y resumen del pedido.
- app/admin/panel.tsx: edición y configuración del negocio.
- lib/order.ts: cantidades, subtotal, texto y enlace WhatsApp.
- lib/tables.ts y components/table-manager.tsx: enlaces y QR por mesa.
- lib/crafted-data.json, lib/crafted-translations.json: catálogo inicial y traducciones de respaldo.
- lib/server.ts y app/api/: identidad, D1/R2, catálogo y servicios.
- lib/validation.ts: validación del catálogo.
- tests/: pruebas de reglas y Worker con D1/R2 efímeros.

## Entorno y ejecución
Requisitos declarados: Node >=22.13 y pnpm 11.25.0. Leer package.json, pnpm-workspace.yaml, scripts/install-pnpm.sh y scripts/execution-profile.mjs antes de instalar. No copiar node_modules del entorno anterior.

Con el plugin Sites disponible, leer su skill y usar sus ayudantes de instalación, vista previa y publicación. Abrir primero el Site existente con su credencial temporal; obtener del servicio la URL del repositorio y el estado actual. Las rutas /root/.codex/plugins/... de README pertenecían al entorno anterior: localizar la instalación vigente, no asumirlas. Nunca guardar tokens en el proyecto.

Sin Sites, se puede trabajar con el código local. La selección portable se aplica cuando falta .sites-runtime/execution-profile.json. Instalar dependencias con el flujo del proyecto, después ejecutar pnpm dev. La base local es distinta de producción y puede requerir las migraciones de drizzle/. Revisar los mensajes reales del entorno antes de afirmar que funciona. No usar wrangler deploy con identificadores de ejemplo de vite.config.ts: para cambiar de alojamiento haría falta configurar recursos y migrar datos e identidad de forma expresa.

Verificación: pnpm typecheck; pnpm test; pnpm build; pnpm test:integration (después de compilar). Última validación del commit: 28 pruebas funcionales y 16 comprobaciones de integración aprobadas. No se han vuelto a ejecutar para esta exportación, que no modifica el código.

## Pendientes y límites
- Confirmar número real de mesas, grabar chips NFC y probar QR/WhatsApp en teléfonos reales.
- Revisar ingredientes completos, alérgenos y precios con el bar; no inventar datos ausentes. La fuente tiene inconsistencias en Old Rasputin y las dos opciones Crowler de Art Car.
- El asistente tiene reglas locales; IA generativa y traducción automática necesitan la clave Gemini del servidor. No asumir que está configurada actualmente.
- No incluye cobro, POS, inventario por unidades, confirmación de entrega de WhatsApp ni bandeja de pedidos recibidos.
- Si se desea otro proveedor, mantener el sitio actual hasta validar base de datos, archivos, acceso e identidad en el destino.

## Preferencias de Jou
Responder en español breve y claro. Ejecutar los cambios solicitados y verificar con pruebas acordes. Mantener logo original, estilo limpio y enfoque móvil. No inventar avances ni cambiar el destino de los pedidos sin autorización.
