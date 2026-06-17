# LYM|LYN

> Premium T-shirts and lower clothing with virtual try-on. See how it fits before you buy.

---

## Project Structure

```
lymlyn/
├── frontend/     React + Vite + Tailwind CSS
├── backend/      Node.js + Express
├── assets/       Avatar SVGs, product cutouts
├── docs/         schema.sql, seed.sql, project plan
└── scripts/      Avatar generator (Phase 5)
```

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express |
| Database / Auth / Storage | Supabase |
| Payments | Razorpay |
| Try-on engine | MediaPipe (client-side) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd lymlyn
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `docs/schema.sql`
3. Then run `docs/seed.sql` for placeholder products
4. Note your **Project URL**, **anon key**, and **service role key**

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 4. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Fill in RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` — API calls to `/api/*` are proxied to the backend at `http://localhost:4000`.

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo in Vercel, set root to `frontend/`
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Backend (Render)

1. Create a new **Web Service** on Render pointing to the `backend/` directory
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all env vars from `backend/.env.example`

---

## Making yourself an admin

After signing up for the first time, run this in Supabase SQL editor (replace the email):

```sql
update profiles
set is_admin = true
where id = (select id from auth.users where email = 'your@email.com');
```

Then access `/admin` in the browser.

---

## Implementation Phases

| Phase | Description | Status |
|---|---|---|
| 0 | Scaffolding & Infrastructure | ✅ Done |
| 1 | Database & Auth | ⏳ Next |
| 2 | Product Catalog | ⏳ Pending |
| 3 | Cart & Checkout | ⏳ Pending |
| 4 | Admin Panel | ⏳ Pending |
| 5 | Virtual Try-On | ⏳ Pending |
| 6 | Polish & Launch | ⏳ Pending |
