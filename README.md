# Clinic Calendar & Reservation System

A production-ready clinic calendar and reservation dashboard built with Next.js 15, Supabase, and TypeScript. This system provides comprehensive appointment management, patient records, and staff scheduling for healthcare clinics.

## Features

- **📅 Calendar Management**: Visual appointment scheduling with drag-and-drop support
- **👥 Patient Management**: Complete patient records with medical history
- **⚕️ Staff Scheduling**: Multi-staff appointment coordination
- **📊 Reporting**: Analytics and operational insights
- **🔒 Secure**: HTTP Basic Authentication and Supabase Row Level Security
- **📱 Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI**: React 19, Tailwind CSS, Radix UI
- **Validation**: Zod
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ and npm (or pnpm)
- A [Supabase](https://supabase.com/) account and project
- (Optional) A [Vercel](https://vercel.com/) account for deployment

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd v0-calendar-system
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Get your project URL and service role key from **Settings > API**
3. Run the SQL migration scripts in order using the Supabase SQL Editor:
   - `scripts/001_create_tables.sql` - Creates all tables and indexes
   - `scripts/002_add_resecon_settings.sql` - Adds integration settings
   - `scripts/003_add_reminder_settings.sql` - Adds reminder configuration
   - (Optional) `scripts/004_reset_and_seed_data.sql` - Seeds demo data

**Alternative using Supabase CLI:**
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HTTP Basic Authentication (optional for development, required for production)
DASHBOARD_BASIC_AUTH_USER=admin
DASHBOARD_BASIC_AUTH_PASSWORD=your-secure-password
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/)
3. Add the environment variables from step 3
4. Deploy!

**Important**: Always set `DASHBOARD_BASIC_AUTH_USER` and `DASHBOARD_BASIC_AUTH_PASSWORD` in production to secure your dashboard.

## API Endpoints

The dashboard exposes RESTful API endpoints for programmatic access:

### Reservations

- `GET /api/reservations?date=YYYY-MM-DD` - Fetch appointments for a specific date
- `POST /api/reservations` - Create a new appointment
- `PATCH /api/reservations/:id` - Update an appointment
- `DELETE /api/reservations/:id` - Cancel an appointment (soft delete)

### Patients

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create a new patient
- `PATCH /api/patients/:id` - Update patient information

### Staff

- `GET /api/staff` - List all staff members
- `POST /api/staff` - Create a new staff member
- `PATCH /api/staff/:id` - Update staff information

All API endpoints use the server-side Supabase client (`lib/supabase/admin.ts`) with the service role key, ensuring secure database access without exposing credentials to the client.

## Security

### HTTP Basic Authentication

The dashboard uses HTTP Basic Authentication to protect all pages and API routes (except static assets). This is configured via middleware and controlled by environment variables:

- `DASHBOARD_BASIC_AUTH_USER` - Username for authentication
- `DASHBOARD_BASIC_AUTH_PASSWORD` - Password for authentication

**Behavior:**
- **Development**: If credentials are not set, access is allowed with a warning logged
- **Production**: If credentials are not set, a warning is logged but access is still allowed (you should always set these!)

### External Integrations

External services or patient-facing applications can call the API endpoints by including the Basic Auth credentials in the `Authorization` header:

```bash
curl -u username:password https://your-app.vercel.app/api/reservations?date=2024-12-01
```

### Supabase Row Level Security

While the dashboard uses the service role key to bypass RLS, you should configure RLS policies in Supabase for any client-side access or additional security layers.

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Management

Initialize or reset the database:
```bash
# Using Supabase SQL Editor - run these scripts in order:
# 1. scripts/001_create_tables.sql
# 2. scripts/002_add_resecon_settings.sql
# 3. scripts/003_add_reminder_settings.sql
# 4. scripts/004_reset_and_seed_data.sql (optional, for demo data)
```

### Project Structure

```
├── app/
│   ├── api/              # API route handlers
│   │   ├── reservations/ # Appointment endpoints
│   │   ├── patients/     # Patient endpoints
│   │   └── staff/        # Staff endpoints
│   └── page.tsx          # Main dashboard page
├── components/           # React components
├── lib/
│   ├── supabase/        # Supabase client configuration
│   ├── server/          # Server-side utilities
│   ├── db.ts            # Database operations
│   └── types.ts         # TypeScript type definitions
├── scripts/             # SQL migration scripts
└── middleware.ts        # HTTP Basic Auth middleware
```

## Dependency Management

This project uses pinned (exact) dependency versions for reproducible builds:

- All dependencies in `package.json` are locked to specific versions (no `^`, `~`, or `latest`)
- [Renovate](https://docs.renovatebot.com/) automatically creates PRs for dependency updates
- Updates are scheduled weekly on Mondays
- Radix UI packages are grouped for easier review

To install dependencies:
```bash
npm install
# or
pnpm install
```

## Troubleshooting

### "Missing required environment variables"

Make sure you've set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file or deployment environment.

### "データベーステーブルが存在しません"

Run the SQL migration scripts in the Supabase SQL Editor in order (001, 002, 003).

### "JSON Parse error: Unexpected identifier"

This usually indicates invalid environment variables. Check that your Supabase URL and service role key are correct and properly formatted.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license here]
