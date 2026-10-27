# Arquitectura

Next.js App Router expone UI localizada y API `/api/v1`. `src/lib/domain.ts` calcula cotizaciones solo desde el catálogo backend; `service.ts` crea pedidos tenant-scoped; `repository.ts` abstrae persistencia; `payments.ts` abstrae Stripe; `webhook.ts` gobierna activación. Auth.js deriva tenant/account desde sesión firmada. Contrato OpenAPI en `src/lib/openapi.ts`.

ADR 001: almacenamiento dev-only, producción bloqueada hasta BD transaccional. ADR 002: webhook firmado y verificación remota Stripe; retorno UI no acredita pago. Alternativas descartadas: confiar en montos/tenant del cliente, simular pagos, confiar en redirect, usar memoria en producción. Restricciones: precios USD cents versionados; fixture no comercial; sin tarjetas persistidas; Stripe test-only.
