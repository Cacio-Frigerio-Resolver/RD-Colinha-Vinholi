# RD-Colinha-Vinholi

Colinha eleitoral interativa - Marco Vinholi 1002 (Dep. Federal SP, 2026).

Dados: TSE (Dados Abertos). Fotos e candidatos.json gerados por `tools/extrair_tse.py`.

## Integração no site (RD-Site-Vinholi)
- Copiar esta pasta para `colinha/` (sem `tools/` e `.git`); liberar `/colinha/` em `api/lib/estatico.js` (pasta pública e `.js`/`.json`/`.webmanifest`/`.ico` dentro dela) e no `.gitignore` (allowlist).
- Incluir `https://www.marcovinholi.com.br/colinha/` no sitemap do site (modelo em `sitemap-colinha.xml`).
- `og:image`, canonical e JSON-LD já apontam para `https://www.marcovinholi.com.br/colinha/`.
- Fotos: `fotos/` é servida pelo jsDelivr (`@v2`), não precisa subir para a VPS.
