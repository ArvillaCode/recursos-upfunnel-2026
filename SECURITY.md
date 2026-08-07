# Seguridad

## Reportar un problema

No publiques vulnerabilidades ni datos personales en Issues. Envía el reporte a `gabriel@upfunnel.click` con los pasos para reproducirlo y el impacto observado.

## Controles incluidos

- Lista cerrada de recursos aceptados por el flujo exportado.
- Límites de longitud y normalización en navegador y n8n.
- Campo honeypot y restricción CORS como capas auxiliares.
- WhatsApp opcional y consentimiento explícito.
- Persistencia de ejecuciones desactivada en la plantilla del workflow.
- Encabezados de seguridad para el sitio estático.

## Controles operativos obligatorios

Estos controles no pueden resolverse de forma segura desde un repositorio estático:

- Rate limiting por IP en Cloudflare, el reverse proxy o el gateway de n8n.
- Límite pequeño para el cuerpo del webhook, por ejemplo 16 KB.
- Protección automatizada como Turnstile validada dentro de n8n si aparece abuso.
- Timeouts, reintentos limitados y alertas para descargas y SMTP.
- Pruning global de ejecuciones, logs y copias de seguridad.
- SPF, DKIM y DMARC para el dominio remitente.
- Rotación del enlace de invitación de WhatsApp si se comparte fuera de contexto.
- URLs firmadas y autorización real si algún material deja de ser público.

`allowedOrigins`, `ignoreBots` y el honeypot no sustituyen rate limiting ni una validación del lado del servidor.

## Lista de verificación de producción

- Una solicitud sin consentimiento responde `400`.
- Un recurso desconocido responde `400` y no envía correo.
- Un nombre con HTML se trata como texto.
- Más solicitudes que el umbral configurado responden `429`.
- Un fallo SMTP o de descarga no responde éxito.
- Las ejecuciones no conservan nombre, correo o WhatsApp.
- Ningún secreto aparece en el repositorio ni en el historial de Git.
