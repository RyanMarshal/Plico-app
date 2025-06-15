# Plico - Quick Poll Application

**Plico: The fastest, most fun way to get to a final answer. Stop arguing. Just send a Plico.**

A Next.js application for creating and sharing instant polls.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:

### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker Compose
docker compose up -d
```
The `.env` file is already configured for this setup.

### Option B: Local PostgreSQL Installation
Install PostgreSQL from https://www.postgresql.org/download/ and update the `.env` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/plico"
```

3. Run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:
```bash
npm test
```

## Key Features

- Create polls with up to 4 options
- Real-time voting with results
- Tie-breaker animation
- Confetti celebration for winners
- Cookie-based vote tracking
- Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Jest & React Testing Library
