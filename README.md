# Golf Charity Subscription Platform

A full-stack training project built with Next.js and Supabase for a golf subscription platform that combines score tracking, charity contributions, monthly draws, subscriber management, and admin operations.

## Project Summary

This project now includes a working MVP-style product flow:

- public landing page
- public charity directory
- signup, login, and reset-password flows
- subscriber dashboard
- admin dashboard
- charity management
- subscription management
- draw preview and draw execution
- winner review and payout status tracking
- basic analytics and reporting
- simple Stripe Checkout integration

## What Has Been Implemented

### Public / Visitor Pages

- Home page at `/`
- Public charity directory at `/charities`
- Login page at `/login`
- Signup page at `/signup`
- Reset password page at `/reset-password`

### Subscriber Dashboard

The dashboard at `/dashboard` supports:

- viewing the signed-in user state
- adding scores
- editing scores
- deleting scores
- keeping only the latest 5 scores
- score date support
- charity selection
- charity contribution percentage
- subscription plan and status display
- winnings overview
- logout and admin navigation

### Charity Features

- Users can select a charity from the `charities` table
- Users can save contribution percentage
- Admin can add charities
- Admin can edit charities
- Admin can delete charities

### Subscription Features

- Dashboard includes subscription controls
- Admin can review subscriptions
- Admin can update subscription statuses
- Simple Stripe Checkout flow is connected in code

### Draw and Result Features

- Admin can preview a draw before publishing
- Admin can confirm and run a draw
- Draw logic checks user scores against drawn numbers
- Winner rows are created
- Prize distribution logic is included
- Admin can update result status such as:
  - approved
  - rejected
  - paid

### Admin Features

The admin page at `/admin` includes:

- admin access checks
- charity CRUD
- subscription management
- draw preview
- draw execution
- draw history
- winner verification
- reports and analytics

### UI / UX Improvements Completed

- dashboard UI polish
- admin UI polish
- login UI improvement
- signup UI improvement
- reset-password UI improvement
- improved field borders and placeholder visibility
- cleaner dashboard actions layout

## Stripe Status

Simple Stripe Checkout has been added in code, including:

- checkout session creation route
- checkout success page
- checkout cancel page
- session confirmation route
- dashboard checkout button

Current Stripe-related files:

- [app/api/stripe/create-checkout-session/route.js](C:/Users/ACER/Documents/golf_app/golf-charity-app/app/api/stripe/create-checkout-session/route.js)
- [app/api/stripe/confirm-session/route.js](C:/Users/ACER/Documents/golf_app/golf-charity-app/app/api/stripe/confirm-session/route.js)
- [app/checkout/success/page.js](C:/Users/ACER/Documents/golf_app/golf-charity-app/app/checkout/success/page.js)
- [app/checkout/cancel/page.js](C:/Users/ACER/Documents/golf_app/golf-charity-app/app/checkout/cancel/page.js)

Important:

- Stripe integration is not fully usable yet until real Stripe environment values are added.
- The missing values are:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

So the Stripe code is implemented, but the Stripe dashboard keys and price IDs are still missing.

## Tech Stack

- Next.js App Router
- React
- Supabase Auth
- Supabase Database
- Tailwind CSS
- Stripe SDK

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for Stripe checkout
STRIPE_SECRET_KEY=sk_test_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

3. Start the project

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
```

## Main Routes

- `/` public homepage
- `/charities` public charity directory
- `/signup` signup
- `/login` login
- `/reset-password` password reset
- `/dashboard` subscriber dashboard
- `/admin` admin panel
- `/checkout/success` Stripe success page
- `/checkout/cancel` Stripe cancel page

## Expected Supabase Tables

This project uses these main tables:

- `profiles`
- `scores`
- `draws`
- `results`
- `charities`
- `subscriptions`

Useful columns currently used by the UI include:

### `profiles`

- `id`
- `email`
- `is_admin`
- `charity_id`
- `charity_name`
- `contribution_percentage`
- `charity_percentage`

### `scores`

- `id`
- `user_id`
- `value`
- `played_at`
- `created_at`

### `charities`

- `id`
- `name`
- `description`

### `subscriptions`

- `id`
- `user_id`
- `plan`
- `status`
- `renewal_date`
- `created_at`

## Verification Status

The following checks were completed successfully:

- `npm run lint`
- `npm run build`

## Current Project Status

This project is now a strong MVP-style submission and includes most of the visible product flow required for demonstration.

The main remaining incomplete area is Stripe configuration:

- the Stripe Checkout code exists
- the Stripe dashboard keys and recurring price IDs still need to be added

## Recommended Demo Flow

1. Open `/`
2. Visit `/charities`
3. Sign up or log in
4. Open `/dashboard`
5. Add and manage scores
6. Save charity preferences
7. Review subscription area
8. Log in as admin
9. Open `/admin`
10. Manage charities
11. Preview and run a draw
12. Review winners and analytics
