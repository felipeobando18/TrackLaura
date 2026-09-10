# TrackLaura

Dashboard de leads de Meta Ads para las cuentas de Laura.

## Conectar Meta Ads en Vercel

La integración usa una Function de Vercel en `api/meta-insights.js`. El token no se envía al navegador.

Añade estas variables en **Vercel > Project Settings > Environment Variables**:

```env
META_ACCESS_TOKEN=EAAB...
META_SCULPTOR_ACCESS_TOKEN=EAAB...
META_AD_ACCOUNTS=[{"name":"Iam light","id":"act_123456789"},{"name":"Sculptor clinic","id":"act_987654321"}]
```

`META_ACCESS_TOKEN` debe ser un token de acceso de Meta con permisos de lectura de anuncios, normalmente `ads_read`.

`META_AD_ACCOUNTS` es un JSON en una sola línea. Los nombres deben coincidir exactamente con las cuentas mostradas en el menú lateral. `META_ACCESS_TOKEN` se usa para Iam light y `META_SCULPTOR_ACCESS_TOKEN` para Sculptor clinic.

Después de guardar las variables, haz un nuevo deploy. El indicador del lateral cambiará de `Meta Ads · modo demo` a `Meta Ads · datos en vivo` cuando la consulta funcione.

## Desarrollo local

La app estática funciona con cualquier servidor HTTP. Para probar la Function localmente usa el entorno de Vercel:

```bash
npx vercel dev
```

No guardes tokens en `app.js`, `index.html` ni en el repositorio.
