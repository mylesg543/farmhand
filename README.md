# 🌾 FarmHand — Complete Setup Guide

## Overview
FarmHand is your farm management app. This guide takes you from zero to a live, working app with a real database.

All database tables are prefixed with `fh_` so they will NEVER conflict with anything else in your Supabase project.

---

## STEP 1 — Create your Supabase project (10 mins)

1. Go to **supabase.com** → click **Start your project** → sign up (free)
2. Click **New project**
3. Fill in:
   - **Name:** farmhand (or anything you like)
   - **Database password:** choose a strong password and save it somewhere
   - **Region:** pick the one closest to you
4. Click **Create new project** — wait about 2 minutes for it to spin up

### Create the database tables

5. In the left sidebar, click **SQL Editor**
6. Click **New query**
7. Open `farmhand-setup.sql` from this project folder
8. Copy ALL of it and paste it into the editor
9. Click **Run** — you should see: *Success. No rows returned*
10. Click **Table Editor** in the sidebar — you should see `fh_animals`, `fh_animal_events`, and `fh_feed_costs`

### Create the photo storage bucket

11. Click **Storage** in the left sidebar
12. Click **New bucket**
13. Name it exactly: `fh-animal-photos`
14. Toggle **Public bucket** ON
15. Click **Create bucket**
16. Go back to **SQL Editor**, create a new query, and run:
```sql
create policy "Public photo read"
  on storage.objects for select
  using ( bucket_id = 'fh-animal-photos' );

create policy "Allow photo uploads"
  on storage.objects for insert
  with check ( bucket_id = 'fh-animal-photos' );
```

### Get your credentials

17. Click **Project Settings** (gear icon ⚙️) in the left sidebar
18. Click **API**
19. Copy two things:
    - **Project URL** — looks like `https://abcdefgh.supabase.co`
    - **anon / public key** — long string starting with `eyJ...`

---

## STEP 2 — Set up the project on your computer (15 mins)

### Install Node.js (if you haven't already)

1. Go to **nodejs.org**
2. Download and install the **LTS** version
3. Restart your computer after installing

### Set up the project

1. Unzip the farmhand project folder somewhere on your computer
   (e.g. `C:\Users\YourName\Documents\farmhand`)

2. Open a terminal inside the folder:
   - **Windows:** Open the folder in File Explorer → click the address bar → type `cmd` → Enter
   - **Mac:** Right-click the folder → "New Terminal at Folder"

3. Create your `.env` file:
   ```
   copy .env.example .env
   ```
   (on Mac use: `cp .env.example .env`)

4. Open `.env` in any text editor (Notepad is fine) and fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

5. Install dependencies:
   ```
   npm install
   ```
   This downloads everything needed. Takes 1-2 minutes.

6. Start the app:
   ```
   npm run dev
   ```

7. Open your browser and go to: **http://localhost:5173**

Your app is now running locally with a real Supabase database behind it!

---

## STEP 3 — Put it on the internet with Vercel (10 mins)

### Push to GitHub first

1. Go to **github.com** → sign up for a free account
2. Click the **+** icon → **New repository**
3. Name it `farmhand` → click **Create repository**
4. Follow the instructions GitHub shows to push your code
   (it will show you exact commands to copy/paste into your terminal)
   
   Important: your `.env` file is in `.gitignore` so it will NOT be uploaded — your credentials stay safe.

### Deploy on Vercel

5. Go to **vercel.com** → sign up with your GitHub account
6. Click **Add New Project**
7. Find and import your `farmhand` repository
8. Before clicking Deploy, go to **Environment Variables** and add:
   - Name: `VITE_SUPABASE_URL` → Value: your Supabase project URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your Supabase anon key
9. Click **Deploy**

Vercel builds and deploys your app. In about 60 seconds you'll get a live URL like:
`https://farmhand-yourname.vercel.app`

**Every time you push code changes to GitHub, Vercel redeploys automatically.**

---

## STEP 4 — Ongoing workflow

To add new features or fix things:
1. Describe the change to Claude
2. Claude updates the relevant file(s)
3. Download the updated file and replace it in your project folder
4. Push to GitHub (`git add . && git commit -m "update" && git push`)
5. Vercel redeploys automatically — usually done in under 60 seconds

---

## File structure

```
farmhand/
├── src/
│   ├── components/
│   │   ├── animals/
│   │   │   ├── AnimalList.jsx     — flock list page with hero strip
│   │   │   ├── AnimalDetail.jsx   — individual animal profile
│   │   │   └── AnimalForm.jsx     — add/edit animal form
│   │   ├── events/
│   │   │   └── EventList.jsx      — event history + add event
│   │   ├── costs/
│   │   │   └── CostsPage.jsx      — feed cost tracker
│   │   └── ui/
│   │       └── shared.jsx         — reusable components and styles
│   ├── hooks/
│   │   ├── useAnimals.js          — fh_animals database operations
│   │   ├── useAnimalEvents.js     — fh_animal_events operations
│   │   ├── useFeedCosts.js        — fh_feed_costs operations
│   │   └── usePhotoUpload.js      — Supabase Storage photo upload
│   ├── lib/
│   │   └── supabase.js            — Supabase client (reads .env)
│   ├── App.jsx                    — routing and navigation
│   └── main.jsx                   — entry point
├── farmhand-setup.sql             ← Run this in Supabase SQL Editor
├── .env.example                   ← Copy to .env and fill in credentials
├── .gitignore                     ← Keeps your .env safe from GitHub
└── package.json
```

---

## Database tables (all prefixed fh_ — no conflicts possible)

| Table | What it stores |
|---|---|
| `fh_animals` | Every animal on your farm (all species) |
| `fh_animal_events` | Event history for each animal |
| `fh_feed_costs` | Feed and food costs per species |

Storage bucket: `fh-animal-photos` — stores all uploaded animal photos

---

## Cost to run

| Service | Free tier | Paid if you exceed |
|---|---|---|
| Supabase | 500MB database, 1GB storage, 50k users/month | $25/month |
| Vercel | Unlimited deploys, 100GB bandwidth | $20/month |
| GitHub | Unlimited public/private repos | $4/month |

**Total to start: $0/month.** A farm management app will almost certainly never need to upgrade.
