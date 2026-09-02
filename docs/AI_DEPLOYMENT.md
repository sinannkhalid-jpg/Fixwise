# Fixwise AI deployment

## Current deployable path (Vercel web application)

The Next.js application exposes a server-only endpoint at:

```text
POST /api/ai/analyze
GET  /api/ai/analyze
```

`POST` sends sanitized report text and optional image evidence to Google AI and validates the structured response before the application uses it. `GET` reports whether the server has an API key without revealing the key.

Set the Vercel project root to `apps/web` and configure:

```text
GEMINI_API_KEY=<secret>
GEMINI_MODEL=gemini-3.8-flash
```

Redeploy after changing environment variables. Verify configuration:

```bash
curl https://YOUR-DEPLOYMENT.vercel.app/api/ai/analyze
```

Expected response:

```json
{
  "configured": true,
  "model": "gemini-3.8-flash",
  "promptVersion": "fixwise-intake-v2"
}
```

If `configured` is false, the Vercel environment variable is missing from the deployment environment (Production/Preview/Development).

## Local web setup

Create `apps/web/.env.local`:

```env
GEMINI_API_KEY="your-key"
GEMINI_MODEL="gemini-3.8-flash"
```

Then run:

```bash
cd apps/web
npm install
npm run dev
```

## Dedicated AI microservice

For a backend → AI-service production topology, deploy `services/ai` separately and configure its `.env` from `.env.example`. The service provides classification, embeddings, duplicate checks, priority inputs, risk assessment, hotspots, recurring-problem analysis and recommendations.

The model is advisory only:

1. AI returns structured analysis.
2. Backend validates ranges and enum values.
3. Backend calculates deterministic priority and geographic ownership.
4. High-risk or uncertain reports go to human review.
5. AI failure falls back to conservative rules and never destroys a report.

## Key security

- Never use `NEXT_PUBLIC_GEMINI_API_KEY`.
- Never commit `.env` or `.env.local`.
- Restrict the Google API key to the required API and rotate it if it was shared publicly.
- Production data should be minimized before sending it to the model.
