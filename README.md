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

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
