# Clinic Calendar & Reservation System

A production-ready clinic calendar and reservation dashboard built with Next.js 15, Supabase, and TypeScript. This system provides comprehensive appointment management, patient records, and staff scheduling for healthcare clinics.

## Features

### Core Features
- **📅 Calendar Management**: Visual appointment scheduling with drag-and-drop support
- **👥 Patient Management**: Complete patient records with medical history
- **⚕️ Staff Scheduling**: Multi-staff appointment coordination
- **📊 Reporting**: Analytics and operational insights
- **🔒 Secure**: HTTP Basic Authentication and Supabase Row Level Security
- **📱 Responsive**: Works on desktop and mobile devices

### Advanced Features (New)
- **🔄 Transaction Management**: Atomic operations with automatic rollback for database, calendar, spreadsheet, and notification systems
- **✅ Zero-Conflict Validation**: Comprehensive booking validation considering business hours, holidays, chair capacity, and staff availability
- **🏢 SaaS-Ready Architecture**: Multi-tenant support with dynamic clinic context management
- **🛡️ Enhanced Security**: Rate limiting, CSRF protection, input sanitization, and comprehensive error handling
- **🔌 Integration Framework**: Extensible interfaces for Google Calendar, Google Sheets, LINE, and other external systems

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
   - **`scripts/005_add_treatment_type_field.sql` - Fixes schema inconsistency (REQUIRED)**
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
# Get these from your Supabase project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HTTP Basic Authentication (optional for development, required for production)
DASHBOARD_BASIC_AUTH_USER=admin
DASHBOARD_BASIC_AUTH_PASSWORD=your-secure-password

# Multi-tenant Support (optional, for SaaS deployments)
DEFAULT_CLINIC_ID=00000000-0000-0000-0000-000000000001
REQUIRE_CLINIC_CONTEXT=false

# Security (optional, recommended for production)
CSRF_SECRET=your-random-secret-change-in-production
```

**Important Notes:**
- `NEXT_PUBLIC_SUPABASE_URL` must be a valid URL like `https://<project-ref>.supabase.co` **without a trailing slash**
- `SUPABASE_SERVICE_ROLE_KEY` is the secret service_role key (not the anon/public key) - this app uses server-side only authentication
- The app does NOT require `NEXT_PUBLIC_SUPABASE_ANON_KEY` as all database access is server-side

### 4. Run Locally

```bash
npm run dev
# or
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

This section provides step-by-step instructions for deploying the application to Vercel.

### Prerequisites for Deployment

1. A GitHub account with this repository pushed to GitHub
2. A [Vercel](https://vercel.com/) account
3. A [Supabase](https://supabase.com/) project with the database tables created (see step 2 above)

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Create a new Vercel project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your `v0-calendar-system` repository from GitHub
   - Vercel will auto-detect Next.js and configure build settings

3. **Configure Environment Variables**
   
   Before deploying, add the following environment variables in Vercel:
   
   - Go to your project → Settings → Environment Variables
   - Add each variable for **Production**, **Preview**, and **Development** environments:

   | Variable Name | Value | Required | Notes |
   |---------------|-------|----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | ✅ Yes | Get from Supabase Settings > API. No trailing slash! |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (secret key) | ✅ Yes | Get from Supabase Settings > API. Use service_role key, NOT anon key! |
   | `DASHBOARD_BASIC_AUTH_USER` | `admin` (or your choice) | ⚠️ Recommended | Username for HTTP Basic Auth. Required for production security. |
   | `DASHBOARD_BASIC_AUTH_PASSWORD` | A strong password | ⚠️ Recommended | Password for HTTP Basic Auth. Required for production security. |

   **Security Warning**: Without `DASHBOARD_BASIC_AUTH_USER` and `DASHBOARD_BASIC_AUTH_PASSWORD`, your dashboard will be publicly accessible!

4. **Deploy**
   - Click "Deploy" 
   - Vercel will build and deploy your application
   - Wait for the build to complete (typically 1-3 minutes)

5. **Verify Deployment**
   - Once deployed, visit your production URL (e.g., `https://your-project.vercel.app`)
   - You should be prompted for HTTP Basic Auth credentials (if configured)
   - After logging in, verify the dashboard loads correctly

### Common Deployment Issues

**Build fails with "supabaseUrl is required"**
- This error should only appear at runtime, not during build
- If you see this during build, ensure you're using Next.js 15.5.7 or later
- The build process uses placeholder values; env vars are validated only at runtime

**"Missing required environment variables" at runtime**
- Check that all required env vars are set in Vercel's Environment Variables settings
- Ensure there are no trailing slashes in `NEXT_PUBLIC_SUPABASE_URL`
- Verify you're using the `service_role` key, not the `anon` key

**"データベーステーブルが存在しません" (Database tables don't exist)**
- Run the SQL migration scripts in your Supabase SQL Editor (see step 2 above)
- Verify your `NEXT_PUBLIC_SUPABASE_URL` points to the correct Supabase project

**Dashboard is publicly accessible**
- Set `DASHBOARD_BASIC_AUTH_USER` and `DASHBOARD_BASIC_AUTH_PASSWORD` in Vercel
- Redeploy after adding the environment variables

### Re-deploying After Changes

Vercel automatically redeploys when you push to your GitHub repository:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

For manual redeployment:
- Go to Vercel Dashboard → Your Project → Deployments
- Click "..." menu on the latest deployment → "Redeploy"

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

### Dependencies and Vulnerabilities

This project uses Next.js 15.5.7, which addresses a critical RCE vulnerability (CVE-2025-66478 / GHSA-9qr9-h5gf-34mp) found in earlier 15.5.x versions. We maintain pinned dependency versions and use Renovate to track updates automatically.

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
│   │   ├── reservations/ # Appointment endpoints (with rate limiting)
│   │   ├── patients/     # Patient endpoints
│   │   ├── staff/        # Staff endpoints
│   │   └── notifications/# Notification endpoints
│   └── page.tsx          # Main dashboard page
├── components/           # React components
├── lib/
│   ├── config/          # Configuration management
│   │   └── clinic-context.ts  # Multi-tenant clinic context
│   ├── security/        # Security utilities
│   │   └── api-security.ts    # Rate limiting, CSRF, validation
│   ├── transactions/    # Transaction management
│   │   └── appointment-transaction.ts  # Atomic operations with rollback
│   ├── validations/     # Validation logic
│   │   └── appointment-validation.ts   # Zero-conflict validation
│   ├── supabase/        # Supabase client configuration
│   ├── server/          # Server-side utilities
│   │   └── appointments.ts  # Enhanced appointment operations
│   ├── db.ts            # Database operations
│   └── types.ts         # TypeScript type definitions
├── scripts/             # SQL migration scripts
│   └── 005_add_treatment_type_field.sql  # Required migration
├── docs/                # Documentation
│   ├── AUDIT_AND_REFACTORING_REPORT.md      # Detailed report (Japanese)
│   └── AUDIT_AND_REFACTORING_SUMMARY_EN.md  # Summary (English)
└── middleware.ts        # HTTP Basic Auth middleware
```

## Advanced Features

### Transaction Management

All appointment operations (create, update, cancel) are executed within transactions that coordinate:
- **Database operations** with automatic rollback on failure
- **Calendar integration** (Google Calendar, etc.)
- **Spreadsheet integration** (Google Sheets, etc.)
- **Notification systems** (LINE, email, SMS, etc.)

If any step fails, all completed operations are automatically rolled back to maintain consistency.

**Configuration Example**:
```typescript
import { setIntegrationConfig } from '@/lib/transactions/appointment-transaction'

setIntegrationConfig({
  calendar: googleCalendarIntegration,
  spreadsheet: googleSheetsIntegration,
  notification: lineNotificationIntegration,
  failOnIntegrationError: false  // Commit DB even if integrations fail
})
```

### Zero-Conflict Validation

Comprehensive validation prevents booking conflicts by checking:
- ✅ **Business hours**: Appointments only within clinic operating hours
- ✅ **Holidays**: Automatic rejection of holiday bookings
- ✅ **Chair capacity**: Respects dental unit/chair count limits
- ✅ **Staff availability**: Prevents double-booking of staff members
- ✅ **Advance booking limits**: Configurable maximum booking period
- ✅ **Race conditions**: Database-level conflict detection

### SaaS-Ready Architecture

The system supports multi-tenant deployments through dynamic clinic context management:

**Single-tenant** (current default):
```env
DEFAULT_CLINIC_ID=00000000-0000-0000-0000-000000000001
```

**Multi-tenant** (future expansion):
```typescript
import { setClinicContextConfig } from '@/lib/config/clinic-context'

// Resolve clinic from subdomain
setClinicContextConfig({
  resolver: async (request) => {
    const subdomain = request.headers.get('host').split('.')[0]
    return await getClinicIdBySubdomain(subdomain)
  }
})
```

### Security Features

- **Rate Limiting**: Configurable per-endpoint request limits
  - GET: 200 requests/minute
  - POST: 50 requests/15 minutes
  - PATCH: 50 requests/15 minutes
  - DELETE: 30 requests/15 minutes
- **CSRF Protection**: Token-based protection for state-changing operations
- **Origin Validation**: Prevents cross-origin attacks
- **Input Sanitization**: XSS prevention through automatic sanitization
- **UUID Validation**: Prevents injection attacks

For detailed documentation, see:
- `docs/AUDIT_AND_REFACTORING_REPORT.md` (Japanese)
- `docs/AUDIT_AND_REFACTORING_SUMMARY_EN.md` (English)

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
