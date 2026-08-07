# Recursos Upfunnel 2026

Sitio estático de clases, recursos y herramientas de Upfunnel. La versión pública vive en [recursos.upfunnel.click](https://recursos.upfunnel.click/).

## Arquitectura

- `index.html`: estructura y contenido principal.
- `assets/css/styles.css`: identidad visual y estilos adaptables.
- `assets/js/app.js`: navegación, menú, formulario, modal y registro de la PWA.
- `privacidad.html`: política de tratamiento de datos.
- `manifest.json` y `sw.js`: instalación y funcionamiento básico sin conexión.
- `n8n-guia-skills.json`: plantilla exportable del flujo de entrega. No contiene credenciales reales.
- `clases/`: materiales organizados por fecha.
- `tests/`: pruebas de comportamiento y accesibilidad.

Los archivos multimedia permanecen en la raíz para conservar las URLs públicas utilizadas por correos y automatizaciones.

## Desarrollo local

Requisitos: Node.js 22 o una versión LTS compatible.

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:4173`. No abras `index.html` directamente porque el service worker y algunas APIs necesitan un origen HTTP.

## Verificación

```bash
npm run check
npm test
```

`npm run check` valida formato, JavaScript, CSS, HTML, JSON y enlaces internos. `npm test` ejecuta las pruebas de navegador.

## Actualizar contenido

1. Edita el contenido en `index.html`.
2. Añade el material bajo `clases/AAAA-MM-DD/`.
3. Añade el identificador del recurso a la lista cerrada de `n8n-guia-skills.json`.
4. Configura la rama correspondiente del flujo en n8n.
5. Incrementa `CACHE_NAME` en `sw.js` cuando cambien archivos del app shell.
6. Ejecuta `npm run check` y `npm test`.

## Configurar n8n

1. Importa `n8n-guia-skills.json`.
2. Asigna una credencial SMTP de mínimo privilegio a los nodos de correo.
3. Activa el workflow y confirma que CORS solo permite `https://recursos.upfunnel.click`.
4. Configura rate limiting y límite de cuerpo en el proxy que publica n8n.
5. Desactiva la persistencia de datos de ejecución y activa el pruning global.
6. Prueba recursos válidos, identificadores desconocidos, campos largos y fallos SMTP.

No guardes IDs de credenciales, tokens, contraseñas ni claves dentro del archivo exportado.

## Despliegue

El proyecto no requiere compilación. Vercel puede servir la raíz directamente. `vercel.json` añade encabezados de seguridad y caché.

El dominio canónico es `https://recursos.upfunnel.click/`. Si se crea otro despliegue, debe redirigir al dominio canónico o permanecer fuera del índice.

Los ajustes administrativos recomendados para el repositorio están documentados en `docs/GITHUB-SETTINGS.md`.

## Privacidad y seguridad

- WhatsApp es opcional.
- El formulario exige autorización para entregar el material.
- El flujo solo acepta identificadores de recursos conocidos.
- No se almacenan ejecuciones en la plantilla exportada.
- Los controles externos pendientes están documentados en `SECURITY.md`.

## Licencia

El contenido, diseño, marca y código están protegidos. Consulta `LICENSE` antes de reutilizarlos.
