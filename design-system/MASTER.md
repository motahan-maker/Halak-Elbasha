# Halaq El Basha — Design System (Login DNA)

Single visual language for the entire product, derived from the login screen.
Premium Egyptian barber shop: warm ivory, brushed gold, deep brown, white surfaces.

## TOKENS (src/styles.css :root / .dark)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#FAF7EF` | `#17100B` | Page background |
| `--surface` / `--card` | `#FFFFFF` | `#241811` | Cards, elevated surfaces |
| `--input` | `#FFFDF8` | `#2E2117` | Input background |
| `--primary` | `#C99A35` | `#D9AB4A` | Gold primary actions, white/dark text |
| `--secondary` | `#F3ECDD` | `#2E2117` | Secondary surfaces |
| `--gold` | `#C99A35` | `#D9AB4A` | Brand accent (badges, stars, rings) |
| `--ink` | `#24140E` | `#0F0A06` | Featured dark panels |
| `--foreground` | `#24140E` | `#F5ECDD` | Primary text |
| `--muted-foreground` | `#756D64` | `#A89A87` | Secondary text |
| `--accent` / `--accent-foreground` | `#F7ECD4` / `#8A6414` | `#3A2A18` / `#E3B95A` | Soft gold tint + bronze text |
| `--success` | `#5C8A58` | `#82A97E` | Muted green |
| `--destructive` | `#B94E48` | `#D46960` | Muted red |
| `--warning` | `#D9A62E` | `#E0B44C` | Warm amber |
| `--border` | `#E5DCCB` | `#3D2C1E` | Soft borders |
| `--ring` | `#C99A35` | `#D9AB4A` | Focus rings |

Gradients: `--gradient-gold` (gold CTA), `--gradient-hero` / `--gradient-ink`
(dark-brown featured panels), `--gradient-success`.
Shadows: `--shadow-card`, `--shadow-elevated`, `--shadow-glow-gold` (warm, never black-heavy).

Radius: `--radius: 1rem`; cards `rounded-2xl/3xl`; pills `rounded-full`.
Motion: 150–250ms, `press` (scale .972), `hover-lift`. Honor `prefers-reduced-motion`.
Type: Cairo (sans) + Tajawal (display). `display-xl/lg`, `eyebrow`, `tnum` for numbers.
Touch targets ≥ 44px (`min-h-11/14`, `tap-target`). RTL: `dir="rtl"` at root/screens.

## PRIMITIVES (src/components/ui/brand.tsx)

- `BrandButton` — variants: primary (gold/white) | secondary | outline | danger | ghost | success; loading + disabled states.
- `BrandCard` — white surface, soft border, `shadow-card`.
- `SectionHeading` — gold display heading.
- `StatusBadge` + `BookingStatusBadge` — gold (مؤكد/محجوز) | success (مكتمل) | danger (ملغي) | muted | warn.
- `EmptyState` (icon + title + hint + CTA), `ErrorState` (message + إعادة المحاولة).
- `BrandField` — login-DNA input: white, soft border, gold focus ring, accessible error.
- Extra: `.table-brand` (cream header, gold hover), `.card-brand`, `.section-heading` utilities.

## PATTERNS

- Featured/hero panels: `panel-ink` (dark brown) + `gold-rule` + gold CTA.
- Icons: Lucide only, stroke 1.5–2, brown/gold/muted. No emojis, no photos of people
  (scissors/initial placeholders).
- Customer: `components/customer/*` (Header, FeaturedBookingCard, OffersSection,
  BarbersSection, CustomerBottomNav). Barber: `barber-app.tsx`. Admin: `admin-app.tsx`
  (RTL sidebar on desktop, tabs on mobile) + `admin/*` modules — all token-driven.
- Auth: `routes/auth.tsx` + `components/auth/*` (BrandHeader, RoleSelector, AuthField,
  PrimaryButton, AuthFooter); Egyptian phone lib `lib/phone.ts`.

## ANTI-PATTERNS

- ❌ Blue/gray enterprise dashboards, random per-page colors
- ❌ Glassmorphism, neon, harsh black shadows, heavy gradients
- ❌ Generic stock/AI human portraits
- ❌ Frontend-only role checks (roles verified server-side via `user_roles`)
- ❌ Mock data (Supabase + realtime everywhere), raw technical errors to users
- ❌ Touch targets < 44px, horizontal overflow on mobile, missing focus states
