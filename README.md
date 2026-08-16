# RIFQ (رِفْق) — Personal Productivity & Habit Telegram Bot

**RIFQ (رِفْق)** is an Arabic-first personal Telegram assistant designed for calm, pressure-free daily productivity. It integrates smart task reminders, structured course/book progress tracking with daily pacing math, interactive authentic morning & evening Adhkar sessions, daily goals, quick searchable notes, and timezone-aware habit streaks.

Built with modern **Node.js (ES Modules)**, **Telegraf**, **Prisma ORM**, and **PostgreSQL** (with native support for Supabase connection pooling and transaction poolers), fully containerized with **Docker** and ready for one-command deployment on **AWS EC2**.

---

## Features

* **📅 Daily Plan ("خطتي اليوم"):** Automatically aggregates today's due reminders, daily goals, course reading/lesson targets, and morning/evening Adhkar status into a single cohesive view.
* **⏰ Smart Reminders:** One-time (`ONCE`), daily (`DAILY`), weekly (`WEEKLY`), and custom interval recurrences. Built-in 10-minute / 1-hour snooze buttons and atomic concurrency locking to prevent double notifications.
* **📚 Course & Learning Tracker:** Create learning tracks with lesson counts and target completion dates. Automatically computes required daily lessons pace (`lessons/day`) and alerts if falling behind schedule.
* **🕌 Interactive Adhkar Sessions:** Verified authentic morning and evening Adhkar from Hisn al-Muslim with interactive repetition counters, navigation, and completion recording.
* **🎯 Daily Goals:** Quick daily goal tracking with instant checkmark toggle.
* **📝 Notes & Search:** Capture thoughts and notes with instant keyword search and pagination.
* **🔥 Habit Streaks & Activity Logs:** Timezone-aware streak engine with single-increment per day safety and missed-day reset logic.
* **👑 Admin Control Panel:** Real-time system metrics, user moderation (ban/unban), audit logging, and broadcast messaging.

---

## Architecture

The project cleanly separates the interactive Telegram Bot from the background Cron Worker:

```
                          ┌──────────────────────────┐
                          │  Telegram Bot Platform   │
                          └─────────────┬────────────┘
                                        │
                         Telegram Webhook / Long Polling
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           AWS EC2 / Docker Host                           │
│                                                                           │
│   ┌───────────────────────────┐           ┌───────────────────────────┐   │
│   │         rifq-bot          │           │        rifq-worker        │   │
│   │    (Interactive Bot)      │           │    (Background Cron)      │   │
│   └─────────────┬─────────────┘           └─────────────┬─────────────┘   │
│                 │                                       │                 │
│                 └───────────────────┬───────────────────┘                 │
│                                     │ (Prisma Client)                     │
└─────────────────────────────────────┼─────────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   PostgreSQL / Supabase   │
                        │    (Cloud Database)       │
                        └───────────────────────────┘
```

---

## Project Structure

```
RIFQ/
├── src/
│   ├── app.js                                 # Bot process entrypoint
│   ├── config/
│   │   └── env.js                             # Zod-validated environment config
│   ├── database/
│   │   └── prisma.js                          # Prisma Client connection manager
│   ├── data/
│   │   └── adhkar.data.js                     # Authentic Adhkar dataset
│   ├── integrations/
│   │   └── prayer-times/
│   │       └── prayer-times.client.js         # Prayer times integration with caching
│   ├── services/                              # Domain Services (Business Logic)
│   │   ├── user.service.js
│   │   ├── reminder.service.js
│   │   ├── course.service.js
│   │   ├── adhkar.service.js
│   │   ├── goals.service.js
│   │   ├── notes.service.js
│   │   ├── plan.service.js
│   │   ├── streak.service.js
│   │   ├── statistics.service.js
│   │   └── settings.service.js
│   ├── admin/                                 # Admin management layer
│   │   ├── handlers/admin.handler.js
│   │   └── services/admin.service.js
│   ├── bot/                                   # Telegram presentation layer
│   │   ├── commands/index.js                  # Slash command handlers
│   │   ├── handlers/                          # Callback & text handlers
│   │   │   ├── menu.handler.js
│   │   │   ├── reminders.handler.js
│   │   │   ├── courses.handler.js
│   │   │   ├── adhkar.handler.js
│   │   │   ├── goals.handler.js
│   │   │   ├── notes.handler.js
│   │   │   ├── settings.handler.js
│   │   │   ├── text.handler.js
│   │   │   └── index.js
│   │   ├── keyboards/                         # Reusable inline keyboards
│   │   │   ├── main.keyboard.js
│   │   │   ├── reminders.keyboard.js
│   │   │   ├── courses.keyboard.js
│   │   │   ├── adhkar.keyboard.js
│   │   │   ├── goals.keyboard.js
│   │   │   ├── notes.keyboard.js
│   │   │   ├── settings.keyboard.js
│   │   │   └── admin.keyboard.js
│   │   └── middleware/                        # Auth, session TTL, error boundary
│   │       ├── auth.middleware.js
│   │       ├── session.middleware.js
│   │       └── error.middleware.js
│   ├── scheduler/                             # Independent Worker process
│   │   ├── worker.js                          # Standalone cron scheduler
│   │   └── jobs/
│   │       ├── reminders.job.js
│   │       ├── adhkar.job.js
│   │       ├── summary.job.js
│   │       └── streak.job.js
│   └── utils/
│       ├── health.js                          # Diagnostic health checks
│       ├── logger.js                          # Structured ISO timestamp logger
│       ├── timezone.js                        # Luxon timezone and recurrence math
│       └── validation.js                      # Relative/exact time input parser
├── prisma/
│   └── schema.prisma                          # PostgreSQL schema definition
├── tests/                                     # Automated test suite (23 unit tests)
│   ├── adhkar.test.js
│   ├── admin.test.js
│   ├── course.test.js
│   ├── streak.test.js
│   ├── timezone.test.js
│   └── validation.test.js
├── Dockerfile                                 # Multi-stage production container
├── docker-compose.yml                         # Orchestration for bot & worker
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Requirements

* **Node.js**: 20 LTS or newer
* **PostgreSQL**: 14+ or Supabase Cloud PostgreSQL
* **Telegram Bot Token**: Created via [@BotFather](https://t.me/BotFather)
* **Docker & Docker Compose** (for containerized deployment)

---

## Environment Variables

Copy `.env.example` to create `.env`:

```env
BOT_TOKEN=8513238118:AAGMpI5DEF8pWId_L2IapxLmkEae7Vqc-RI
DATABASE_URL="postgresql://postgres.wroeevueatkghzugdmbn:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=30"
DIRECT_URL="postgresql://postgres.wroeevueatkghzugdmbn:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=30"
ADMIN_TELEGRAM_IDS=123456789
PRAYER_API_URL=
NODE_ENV=production
LOG_LEVEL=info
```

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Generate Prisma Client and push schema:**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

3. **Run tests & verification:**
   ```bash
   npm run check
   ```

4. **Start the bot in watch mode:**
   ```bash
   npm run dev
   ```

5. **Start the background worker in watch mode (separate terminal):**
   ```bash
   npm run worker:dev
   ```

---

## Database Setup

* To sync Prisma schema to your PostgreSQL database:
  ```bash
  npm run prisma:push
  ```
* For managed migrations:
  ```bash
  npm run prisma:deploy
  ```

---

## Docker

Build and run both the Telegram bot and the background worker as independent, auto-restarting containers:

```bash
# Build and start all services in detached mode
docker compose up -d --build

# View container status
docker compose ps

# View live logs
docker compose logs -f
```

---

## AWS EC2 Deployment

Follow these steps to deploy on a clean Ubuntu 22.04 / 24.04 EC2 instance:

1. **Connect to your EC2 instance and install Docker:**
   ```bash
   sudo apt update && sudo apt install -y git curl
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Clone the repository:**
   ```bash
   git clone <YOUR_GIT_REPO_URL> /opt/rifq
   cd /opt/rifq
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   nano .env
   # Fill in BOT_TOKEN and DATABASE_URL
   ```

4. **Start Application Containers:**
   ```bash
   docker compose up -d --build
   ```

5. **Update to a new release:**
   ```bash
   git pull origin main
   docker compose up -d --build
   ```

---

## Logs

```bash
# Bot logs
docker compose logs -f bot

# Worker logs
docker compose logs -f worker
```

---

## Development Commands

| Command | Action |
| :--- | :--- |
| `npm run start:bot` | Starts the bot in production mode |
| `npm run start:worker` | Starts the background worker in production mode |
| `npm run dev` | Starts the bot in watch mode |
| `npm run worker:dev` | Starts the worker in watch mode |
| `npm run prisma:generate` | Generates the Prisma client |
| `npm run prisma:push` | Synchronizes Prisma schema directly to DB |
| `npm run prisma:deploy` | Applies pending database migrations |
| `npm run lint` | Runs ESLint syntax and code style checks |
| `npm test` | Runs the Node.js test suite |
| `npm run check` | Runs Prisma generation, ESLint, and all unit tests |

---

## Troubleshooting

1. **Database Connection Timeout / Pool Exhaustion**:
   Ensure `connect_timeout=30` and `sslmode=require` are present in `DATABASE_URL` when connecting through Supabase poolers.
2. **Bot Token Invalid / Unauthorized**:
   Verify that `BOT_TOKEN` in `.env` is copied accurately from [@BotFather](https://t.me/BotFather) without extra spaces.
3. **Worker Not Triggering Reminders**:
   Ensure both `rifq-bot` and `rifq-worker` containers are running simultaneously via `docker compose ps`.
