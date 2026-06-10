# Home Page Redesign Plan

## 1. Navbar (`src/components/layout/Navbar.tsx`)
- Remove the top blue utility bar (RUNI MARKET / MY RUNI / CONTACT US strip) entirely.
- Change the "Sign up" button label to **"Sign up with RUNI Account"** (both desktop and mobile). Leave "Log in" unchanged.

## 2. Hero Section (`src/pages/Index.tsx`)
- Remove the background graduation image and the dark blue full-bleed hero block.
- Replace with a clean, compact hero directly under the white navbar:
  - **Headline** on a single line: "Buy & Sell Within Your Campus Community" — smaller (e.g. `text-2xl md:text-3xl`), blue (`text-primary`), bold, on white background.
  - **Subline** directly below: "The marketplace built exclusively for Reichman University students." — muted text, single line.
  - **Two buttons** centered and symmetric below the text: `Browse Listings` and `Start Selling`. Both use the same variant (primary filled) and same size for visual symmetry.
- Keep the rest of the page (Shop by Category, How It Works, Recent Listings) untouched.

## Files Edited
- `src/components/layout/Navbar.tsx`
- `src/pages/Index.tsx`
