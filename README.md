# DSeq-JEPA Project Page

Static research project page for:

**DSeq-JEPA: Discriminative Sequential Joint-Embedding Predictive Architecture**

Accepted at ECCV 2026 main conference.

## Local Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Railway Deployment

This repository is Railway-ready. The app uses `server.mjs` to serve static files and reads Railway's `PORT` environment variable automatically.

```bash
railway login
railway init
railway up
```

Railway will use `railway.json` and run:

```bash
npm run start
```

## Project Assets

- Web figures: `assets/figs/`
- Paper link: `https://arxiv.org/abs/2511.17354`
- Original figure sources: `figs/`
- Original TeX sources: `docs/ECCV_2026_DSeq_JEPA/`
