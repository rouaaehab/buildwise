# Buildwise – Engineering Rental & Consultation Platform

Connect clients with engineers for consultations. See [PRD.md](./PRD.md) for full product spec.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database / Realtime:** Supabase (PostgreSQL)

## Project structure

```
buildwise/
├── client/     # React frontend
├── server/     # Express API
└── PRD.md
```

## Setup (Phase 1)

### 1. Git (optional)

```bash
git init
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the script in `supabase/migrations/001_profiles_and_roles.sql` (creates `profiles` table and trigger for role on signup).
3. Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env`.
4. Fill in your Supabase URL and keys (server: service role key; client: anon key).

### 3. Backend

```bash
cd server
cp .env.example .env   # then edit .env
npm run dev
```

API runs at **http://localhost:5000** (or set `PORT=5001` in `server/.env` if 5000 is in use). Health check: [http://localhost:5000/health](http://localhost:5000/health).

### 4. Frontend

```bash
cd client
cp .env.example .env   # then edit .env
npm run dev
```

App runs at **http://localhost:5173**.

### 5. Demo data (optional)

To see the app with sample content (engineer profile, projects, bookings, reviews, messages):

1. Sign up **two users** in the app: one as **Engineer**, one as **Client** (and open the engineer’s dashboard once so they get an engineer profile).
2. In Supabase go to **Database → SQL Editor**, open `supabase/seed_demo_data.sql`, and run it.
3. Refresh the app: **Browse engineers** shows the engineer with bio and projects, **My bookings** and **Messages** show the demo data. Log in as client to see bookings and chat; as engineer to see incoming booking and chat.

## Scripts

| Location | Command   | Description        |
| -------- | --------- | ------------------ |
| server/  | `npm run dev`  | Start API with watch |
| server/  | `npm start`    | Start API (production) |
| client/  | `npm run dev`  | Start Vite dev server |
| client/  | `npm run build`| Production build     |

## Phase 2 – Auth (done)

- Sign up / Log in with Supabase Auth; choose role (Client or Engineer) on signup.
- Profiles table stores `name` and `role`; backend middleware `requireAuth` and `requireRole` protect API routes.
- Use `/api/me` with `Authorization: Bearer <supabase_access_token>` to get current user and profile.

## Phase 3 – Engineer module (done)

- Run `supabase/migrations/002_engineer_profiles_and_projects.sql` in the Supabase SQL Editor.
- Engineers get a **dashboard** at `/dashboard/engineer`: edit **profile** (bio, skills, experience, availability) and manage **portfolio projects** (title, description, media/3D link). API: `GET/PUT /api/engineer/profile`, `GET/POST /api/engineer/projects`, `PUT/DELETE /api/engineer/projects/:id`.

## Phase 4 – Client module (done)

- **Browse engineers** at `/engineers`: list all engineers with filters (skill, min rating) and sort (rating, experience, name). Click a card to view full profile.
- **Engineer profile** at `/engineers/:id`: full bio, skills, experience, rating, availability, and portfolio projects.
- API: `GET /api/engineers?skill=&minRating=&sort=rating|experience|name`, `GET /api/engineers/:id`.

## Phase 5 – Booking system (done)

- Run `supabase/migrations/003_bookings.sql` in the Supabase SQL Editor.
- **Clients:** On an engineer’s profile, use “Request consultation” (date & time). View all requests under **My bookings**.
- **Engineers:** Open **Bookings** (from home or dashboard) to see incoming requests; **Accept** (optional Zoom link) or **Reject**. Accepted bookings show the Zoom link to the client.
- API: `GET /api/bookings` (my list), `POST /api/bookings` (client: engineer_id, datetime), `PATCH /api/bookings/:id` (engineer: status, zoom_link).

## Phase 6 – Chat system (done)

- Run `supabase/migrations/004_messages.sql` in the Supabase SQL Editor. If `alter publication supabase_realtime add table` fails (e.g. already added), enable Realtime for `messages` in Supabase Dashboard → Database → Replication.
- **Messages** at `/chat`: list of conversations; click to open a thread at `/chat/:userId`.
- **Thread**: load history, send messages; new messages appear in real time (Supabase Realtime).
- **Message** links: on engineer profile (header) and on each booking row.
- API: `GET /api/messages/conversations`, `GET /api/messages?with=userId`, `POST /api/messages` (receiver_id, message).

## Phase 7 – Rating & review (done)

- Run `supabase/migrations/005_reviews.sql` in the Supabase SQL Editor.
- **Clients:** For **accepted** or **completed** bookings, use **Leave review** on the Bookings page (rating 1–5, optional comment). Each booking can have only one review.
- **Engineer profile:** Shows average rating (updated automatically from reviews) and a **Reviews** section with all reviews.
- API: `GET /api/reviews?engineer_id=`, `POST /api/reviews` (booking_id, rating, comment), `GET /api/reviews/booking/:bookingId`. Bookings list includes a `review` field when present.

## Phase 8 – Admin (done)

- Run `supabase/migrations/006_admin_approval_and_suspend.sql` in the Supabase SQL Editor.
- **Engineer approval:** New engineer profiles start with `approved = false` and do not appear in Browse engineers until an admin approves them. Existing rows are set to approved in the migration.
- **Admin dashboard** at `/dashboard/admin` (role must be `admin`): **Overview** (users, engineers, bookings, pending count), **Pending engineers** (Approve / Reject), **Users** (Suspend / Unsuspend), **Recent reviews** (Delete for moderation).
- **Suspended users** are excluded from the public engineers list and from engineer detail view. Set an account as admin by updating `profiles.role` to `admin` in Supabase for that user.
- API: `GET /api/admin/overview`, `GET /api/admin/engineers/pending`, `PATCH /api/admin/engineers/:id/approve`, `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/admin/reviews`, `DELETE /api/admin/reviews/:id`.

## Next (Phase 9)

Testing & deployment.
