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
