# Estado

Etapa: implementación y validación local del vertical slice de checkout; rediseño visual de marca Periferia integrado en el frontend.

Decisión: memoria de desarrollo tras `CheckoutRepository`; producción bloqueada hasta implementar persistencia transaccional real. Pagos exclusivamente Stripe sandbox con eventos firmados; identidad Entra o acceso local explícito no productivo.

Validación del rediseño: lint, typecheck, 10 pruebas Vitest y build correctos. Sigue pendiente inspección visual y E2E con sesión real.

Siguiente: conectar repositorio transaccional, catálogo/precios comerciales aprobados y provisión de trabajadores/créditos; validar webhook y portal end-to-end con credenciales sandbox reales.
