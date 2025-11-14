# code4

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sourirettes-projects/v0-code4)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/2oIhWiOvPxI)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/sourirettes-projects/v0-code4](https://vercel.com/sourirettes-projects/v0-code4)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/2oIhWiOvPxI](https://v0.app/chat/2oIhWiOvPxI)**

## Reservation API & Supabase integration

This dashboard now exposes reservation endpoints under `/api/reservations` so that both the clinic calendar and external patient-facing frontends can use the same contract:

- `GET /api/reservations?date=YYYY-MM-DD` – fetch serialized appointments for the specified day.
- `POST /api/reservations` – create a reservation after Zod validation and Supabase conflict checks.
- `PATCH /api/reservations/:id` – update the provided fields and re-run conflict detection.
- `DELETE /api/reservations/:id` – cancel (soft delete) a reservation.

All handlers rely on the server-only Supabase client defined in `lib/supabase/admin.ts`, ensuring the Service Role key never reaches the browser. Client components (for example `components/calendar-view.tsx`) communicate exclusively with these APIs via `fetch`, so the existing layout is preserved while the data flow is production-friendly.

## Securing the dashboard (no layout changes required)

To move closer to a commercial setup without altering the UI, the app now includes a global HTTP Basic Authentication gate implemented in `middleware.ts`. Every page and API route (except static assets) checks the credentials before running any business logic, which prevents unauthenticated access to reservation data even if someone discovers the endpoints.

1. **Set credentials** – Configure the following environment variables in Vercel (and locally) so the middleware can validate incoming requests:
   - `DASHBOARD_BASIC_AUTH_USER`
   - `DASHBOARD_BASIC_AUTH_PASSWORD`
2. **Share the login with staff** – Browsers will automatically prompt for the username/password once and cache it for the session, so the existing layout remains untouched.
3. **External integrations** – Patient-facing services or automation scripts must send the same `Authorization: Basic ...` header when calling `/api/reservations` or `/api/patients`. Manage and rotate the credentials just like any other secret to keep access under control.

If you skip these variables (for example during local prototyping) the middleware logs a warning and allows the request to continue, but production deployments should always define them.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
