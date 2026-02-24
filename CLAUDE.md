# RUNI Market – Project Overview

## What Is This?
RUNI Market is a campus marketplace web application built exclusively for Reichman University students in Herzliya, Israel. It allows students to buy and sell second-hand items within their university community. All transactions happen in person on campus — no payment processing is integrated.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Backend**: Supabase (via Lovable Cloud) — PostgreSQL database, Auth, Storage, Realtime
- **State Management**: TanStack React Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation

## Design System
- **Primary color**: HSL(226, 81%, 33%) — Reichman University blue, RGB(16, 44, 151)
- **Background**: Clean white
- **Accent**: Light blue tints derived from primary
- **Typography**: System font stack, clean and modern
- **Layout**: Mobile-first responsive design
- **Logo**: Reichman University logo displayed in navbar top-left

## Architecture Summary
- **Pages**: Home, Browse, Listing Detail, Create/Edit Listing, Profile, Messages, Auth (Login/Signup)
- **Database tables**: profiles, listings, listing_images, conversations, messages
- **Auth**: Email/password restricted to `@post.runi.ac.il` domain
- **Storage**: Public bucket for listing images (max 3 per listing)
- **RLS**: Users edit own data; all authenticated users can browse

## Constraints
- English-only interface
- No payment processing
- Email restricted to `@post.runi.ac.il`
- Maximum 3 photos per listing
- Student-run side project — not an official university initiative

## Current Status
Phase 1 in progress — Foundation & Setup (design system, layout components, documentation, backend setup).
