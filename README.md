# Quix

This is a beginner-friendly starter for Quix using Next.js and Supabase.

## What the app already includes

- Student sign up and login
- Admin-only lecture and question management
- Lecture quiz page with points
- Leaderboard for top students
- Supabase SQL schema with row-level security

## Step 1: Create your Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor**.
3. Copy everything from [supabase/schema.sql](./supabase/schema.sql).
4. Replace `your-email@example.com` inside the `is_admin()` function with your real email.
5. Run the SQL.

## Step 2: Get your Supabase keys

1. In Supabase, open **Project Settings**.
2. Open **API**.
3. Copy:
   - Project URL
   - `anon` public key

## Step 3: Add environment variables

1. Copy `.env.example` to `.env.local`.
2. Fill in your real values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ADMIN_EMAIL=your-email@example.com
```

## Step 4: Install packages

```bash
npm install
```

## Step 5: Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Step 6: Create your admin account

1. Sign up with the same email you used in:
   - `NEXT_PUBLIC_ADMIN_EMAIL`
   - `public.is_admin()` in the SQL file
2. Login with that account.
3. Open the **Admin** page.

## Step 7: Add your first lecture and questions

1. Create a lecture.
2. Add questions for that lecture.
3. Log out.
4. Create a student account.
5. Test the quiz and leaderboard.

## Important note

Right now this starter includes:

- Create lecture
- Create question
- Delete lecture
- Delete question

The next beginner-friendly improvements would be:

1. Edit lectures and questions
2. Prevent students from repeating the same lecture quiz
3. Add lecture images or files
4. Show each student's quiz history
