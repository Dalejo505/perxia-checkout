# Implementación

Vertical slice: API v1 para catálogo, cotizaciones, pedidos, checkout, facturación, portal y webhook; rutas es/en/pt-BR; autenticación Entra con registro/login local de desarrollo y contraseñas derivadas con salt en memoria volátil; repositorio en memoria de desarrollo; precios versionados en fixture no comercial; contratos OpenAPI; pruebas Vitest y especificaciones Playwright. Stripe está condicionado a credenciales sandbox y el webhook verifica firma y estado remoto. Los pedidos no se activan por redirección.

Rediseño frontend: identidad oficial de Periferia en fuentes y logotipo locales, cabecera negra, hero editorial, primitivas reutilizables, selección de frecuencia independiente por trabajador (mismos priceId y contrato de cotización), resumen sticky con desglose semanal/mensual/único, acceso y registro, facturación y revisión de pedido. Añadidas cadenas localizadas es/en/pt-BR para nuevas etiquetas de interfaz y enlace de salto; API, persistencia y comportamiento del pago no cambian.

Pendientes: adaptador persistente, catálogo comercial, provisión de servicios/créditos, pruebas de integración reales contra Stripe sandbox y manejo operacional de conciliación/reintentos antes de producción.
