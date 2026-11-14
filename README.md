# endoville_frontend
Endoville Health, E-commerce NextJS Frontend
Rest API
Use API

## Geo availability

Production (Netlify) sets `GEO_BLOCK_ENABLED=true` via `netlify.toml`. Visitors outside **Kenya** (`KE`) and the **USA** (`US`) are redirected to `/unavailable` by [`proxy.ts`](proxy.ts).

Local development leaves the block off by default. To test:

```bash
GEO_BLOCK_ENABLED=true npm run dev
curl -I -H "x-geo-country: FR" http://localhost:3000/
curl -I -H "x-geo-country: KE" http://localhost:3000/
```
