# Configuración pendiente en GitHub

Estos cambios requieren permisos administrativos sobre el repositorio y no se aplican desde los archivos del proyecto.

## Información del repositorio

- Descripción: `Recursos y temario de las clases de Upfunnel para 2026`.
- Sitio web: `https://recursos.upfunnel.click/`.
- Temas: `upfunnel`, `ai`, `automation`, `education`, `pwa`.
- Eliminar cualquier referencia pública a un despliegue de Vercel que responda `404`.

## Protección de `main`

- Exigir pull request antes de integrar cambios.
- Exigir una aprobación cuando haya más colaboradores.
- Exigir que pase el check `quality` del workflow `Calidad`.
- Exigir que la rama esté actualizada antes de integrar.
- Bloquear force pushes y eliminación de la rama.
- Aplicar las reglas también a administradores si el flujo de trabajo lo permite.

## Seguridad

- Activar secret scanning y push protection.
- Activar Dependabot alerts y security updates.
- Mantener permisos predeterminados de Actions en solo lectura.
- Permitir escritura únicamente a workflows que la necesiten explícitamente.

## Despliegue

- Confirmar que Vercel sirve la raíz sin comando de compilación.
- Configurar `recursos.upfunnel.click` como dominio de producción.
- Confirmar HTTPS y la redirección desde cualquier dominio alternativo.
- Ejecutar una vista previa antes de promover a producción.
