# Validación

Ejecutar `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` tras el último ajuste. Pruebas Vitest cubren cotización, validación, aislamiento de tenants, expiración, deduplicación y activación condicionada a sesión Stripe pagada. Especificaciones Playwright cubren rechazo de API sin sesión, webhook sin firma y registro/login local aislado por cuenta; cobro exitoso se omite sin credenciales sandbox.

Rediseño: `npm run lint` OK; `npm run typecheck` OK; `npm run test` OK (4 archivos, 10 pruebas); `npm run build` OK. Vitest informa advertencias de configuración Vite preexistentes. Pendiente de inspección visual manual en móvil/tablet y de pruebas E2E con sesión real.

El selector semanal/mensual se valida en Playwright con cambio de URL, precio y resumen semanal. Abierto: pruebas reales de Stripe test webhook/portal y persistencia multiinstancia requieren credenciales e integración de BD. No afirmar pago real ni habilitación productiva.
