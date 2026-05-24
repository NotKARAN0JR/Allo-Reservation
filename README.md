# Allo Inventory — Take-Home Exercise

A concurrency-safe inventory reservation system built with Next.js App Router, Prisma, and PostgreSQL.

## Live URL

Vercel:  
https://allo-reservation-7f8d.vercel.app/products

GitHub Repository:  
https://github.com/NotKARAN0JR/Allo-Reservation.git

---

## Overview

Built a concurrency-safe inventory reservation system for multi-warehouse e-commerce checkout flows using Next.js, Prisma, and PostgreSQL.

The system supports:
- Temporary stock reservations during checkout
- Automatic reservation expiry
- Real-time reservation status updates
- Concurrency-safe inventory handling
- Idempotent reservation flows
- Multi-warehouse stock management

The primary focus was correctness under concurrency and production-style backend architecture.

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Validation | Zod |
| Deployment | Vercel |

---

# Local Setup

## Prerequisites

- Node.js 18+
- Hosted PostgreSQL database (Neon/Supabase)

---

## Installation

```bash
# Clone repository
git clone https://github.com/NotKARAN0JR/Allo-Reservation.git

cd Allo-Reservation

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Start development server
npm run dev