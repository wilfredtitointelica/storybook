# mirrors/

Copia fiel de pantallas/componentes tal como están **hoy en producción**, tomadas de los
repos reales (Fee External, Menu, Header, Auth). Sirve como baseline para QA visual.

Reglas:

- **Nunca se edita a mano.** Si necesitas aplicar una mejora, cópialo primero a `../prototypes/`
  y edita ahí.
- Se actualiza únicamente vía `npm run sync:mirrors` (ver `scripts/sync-mirrors.mjs` en la raíz
  del repo), que vuelve a copiar los archivos listados en el manifiesto desde los repos reales.
- Si el componente real cambia su contrato (props, DTOs), correr el sync puede requerir además
  actualizar los fixtures en `src/mocks/`.

## Checklist después de cada `npm run sync:mirrors`

- **No tocar el HTML ni el CSS/SCSS sincronizados** — se copian tal cual vienen del repo real,
  aunque cambien de estructura (ej. rutas eliminadas, pipes nuevos). Si algo se ve mal, el problema
  está en el wiring (mocks/shell.ts), no en el markup.
- **Revisar el `.ts` sincronizado por nuevos imports/dependencias que puedan pegarle a un backend
  real**: sobre todo cambios de paquete (ej. `intelica-library-base` -> `intelica-library-components`,
  visto en Menu), servicios `providedIn: 'root'` no cubiertos por un provider mock en `shell.ts`, o
  un `HttpClient` inyectado directo sin pasar por un servicio ya mockeado. Si el token cambia de
  paquete pero la clase es equivalente, alias vía `useExisting` en `shellProviders()` hacia el mock
  ya existente (no dupliques el mock) — ver el bloque de imports de `intelica-library-components` en
  `../stories/shell.ts` como ejemplo.
- **Si el componente pide datos nuevos** (un campo nuevo en el DTO, un método nuevo en un servicio),
  agregar/ajustar el fixture correspondiente en `src/mocks/` en vez de dejar que llegue a inventar
  una respuesta real — nunca debe quedar una llamada HTTP real sin mockear en ninguna story.
