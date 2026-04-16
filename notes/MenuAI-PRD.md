# MenuAI MVP — Product Requirements Document

**Version:** 1.0 — MVP  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 · Better Auth · shadcn/ui · next-intl  
**Database:** PostgreSQL  
**Auth:** Email/password + Google OAuth (Better Auth)

---

## 1. Design System & Color Tokens

Paste this into your `app/globals.css` (Tailwind v4 `@theme` block):

```css
@theme {
  /* ── Greens (primary brand) ── */
  --color-g900: #0d1f14;
  --color-g800: #1c3829; /* primary CTA bg, sidebar bg */
  --color-g700: #2a5240; /* hover states */
  --color-g600: #3d7059; /* success deltas, links */
  --color-g200: #b8ccbf; /* sidebar text, muted */
  --color-g100: #dce8df; /* subtle borders */
  --color-g50: #f2f7f3; /* page backgrounds, hover fills */

  /* ── Amber (accent) ── */
  --color-amber: #c9922a; /* CTAs, highlights, stars */
  --color-amber-l: #f7edd9; /* amber backgrounds, nudge bg */

  /* ── Neutrals ── */
  --color-cream: #faf8f3; /* global page bg */
  --color-white: #ffffff;
  --color-text: #1a2e20; /* primary text */
  --color-text2: #4d6355; /* secondary text */
  --color-text3: #8fa393; /* muted/placeholder text */
  --color-border: #dee8e1; /* all card/input borders */

  /* ── Status pills ── */
  --color-pill-green-bg: #e6f5ec;
  --color-pill-green-fg: #2a6b47;
  --color-pill-blue-bg: #e6effc;
  --color-pill-blue-fg: #2855a0;
  --color-pill-amber-bg: #f7edd9;
  --color-pill-amber-fg: #7a4f08;
  --color-pill-gray-bg: #f2f7f3;
  --color-pill-gray-fg: #4d6355;

  /* ── Typography ── */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  /* ── Radii ── */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 16px;
}
```

**Quick reference for devs:**
| Token | Hex | Use |
|---|---|---|
| `g800` | `#1C3829` | Primary buttons, sidebar, nav active |
| `amber` | `#C9922A` | Accent CTAs, highlights, badges |
| `cream` | `#FAF8F3` | Page background |
| `g50` | `#F2F7F3` | Card hover, table headers |
| `border` | `#DEE8E1` | All borders |
| `text` | `#1A2E20` | Body copy |
| `text3` | `#8FA393` | Placeholders, labels |

---

## 2. Product Overview

**MenuAI** is a SaaS tool that lets restaurant owners upload an existing menu (PDF/photo/text) and receive an AI-generated, print-ready designed menu + a hosted QR digital menu — in under 60 seconds.

**MVP goal:** Validate the core loop — upload → AI extraction → design selection → export — with real users. No payment integration in MVP. Invite-only beta.

---

## 3. MVP Scope (What we're building now)

### In scope

- Landing page (marketing)
- Auth (email + Google)
- Dashboard (overview)
- Menu creation wizard (5 steps)
- My menus list
- QR codes page (basic)
- Social content page (basic)

### Out of scope for MVP

- Stripe / payment processing
- Real AI image generation for dishes
- Print fulfillment (Printful integration)
- Multi-language translation add-on
- Designer revision workflow
- Actual PDF export (mock download)
- Multi-location management
- Real-time price analytics per item

---

## 4. Pages & Routes

```
/                          → Landing page (public)
/auth/login                → Login (Better Auth — already in template)
/auth/register             → Register
/dashboard                 → Main dashboard (protected)
/dashboard/menus           → My menus list
/dashboard/menus/new       → Create menu wizard
/dashboard/menus/[id]      → Single menu view/edit
/dashboard/social          → Social content generator
/dashboard/qr              → QR codes manager
```

---

## 5. Detailed Page Specs

---

### 5.1 Landing Page `/`

**Layout:** Sticky nav → Hero → Stats bar → How it works → Sample designs → Pricing → Testimonials → CTA banner → Footer

**Nav**

- Logo: "Menu**AI**" (MenuAI, bold AI in amber)
- Links: How it works · Samples · Pricing
- CTAs: "Sign in" (ghost) · "Start free trial" (amber)

**Hero**

- Left: eyebrow pill → H1 → subtext → CTA buttons → social proof (avatar stack + "8,200+ restaurants")
- Right: animated menu preview card with floating badges ("Generated in 42 seconds", "1,284 QR scans")
- H1 copy: _"Your restaurant menu, beautifully designed by AI"_

**Stats bar** (dark green bg `g800`)

- 47,000+ menus generated · 8,200+ restaurants · 42 sec average · 42 countries

**How it works** (3 steps)

1. Upload your menu (PDF/photo/text, AI extracts in ~15s)
2. Choose style & vibe (4 AI variations)
3. Download, print & go live (PDF + QR)

**Sample designs** (4 cards)

- Bold & Dramatic (dark green)
- Classic Vintage (parchment/cream)
- Minimal Elegance (white/serif)
- Photo-Centric (split layout)

**Pricing** (3 tiers — non-functional in MVP, just display)
| Tier | Price | Key feature |
|---|---|---|
| Digital QR menu | $6.99/mo | Hosted QR menu only |
| Physical menu ⭐ | $17.99/mo | AI design + print PDF |
| Physical + QR | $19.99/mo | Everything |

**Testimonials** — 3 cards (hardcoded for MVP)

**CTA banner** — dark green, "Create my menu free →"

---

### 5.2 Auth Pages

Handled by Better Auth (already in template). Customize styling to match `g800` + `cream` palette.

Register flow: name → email → password → auto-redirect to `/dashboard`

---

### 5.3 Dashboard `/dashboard`

**Layout:** Fixed sidebar (220px) + scrollable main area

**Sidebar**

- Logo + "Restaurant Studio" sub-label
- Nav: Dashboard · Create menu · My menus / Social content · QR codes
- Bottom: plan badge (hardcoded "Starter") + user avatar initials

**Main content**

- Page title + sub ("Good morning, [name]")
- Top CTAs: "View QR menu" · "+ New menu"

**Stats row (4 cards)**

- QR scans / month (mock: 1,284 · ↑23%)
- Top viewed item (mock: Truffle Pasta · 340 views)
- Menus generated (3 · 1 credit remaining)
- Social posts ready (8 · 14 days scheduled)

**Recent menus** (2-col grid, last 2 menus)

- Thumbnail preview + name + pill badges (Active QR, Print-ready, Draft)

**Quick actions** (3 cards, right column)

- Seasonal refresh
- Items missing photos (upsell)
- Designer revision (upsell)

**Item analytics table**

- Item · Category · Views · Trend (↑↓ colored)

---

### 5.4 Create Menu Wizard `/dashboard/menus/new`

**5-step sidebar wizard with progress bar**

**Step 1 — Menu input**

- Upload area (drag/drop — mock, no real processing in MVP)
- On click: simulate 1.8s AI extraction spinner → reveal extracted items table
- Alternative input pills: Paste text · Import CSV · Manual entry · From URL (all mock)

**Extracted items table** (shown after "upload")

- Category filter pills (All · Starters · Pasta · Mains · Desserts · Drinks)
- Table columns: Item name · Category · Price · Description · Dietary tags
- Pre-populated with Osteria Verde sample data (12+ items shown, "Load all 34" button)
- Dietary tag legend (V, VG, GF, DF, NF)

**Step 2 — Profile & style**

- Fields: Restaurant name · Cuisine type (select)
- Style gallery (6 options): Typography only · Minimal elegant · Classic vintage · Editorial · Photo accented · Full photo
- Each card has a live mini-preview mockup + photo intensity bar
- "Full photo" option shows a nudge warning about missing photos
- Color palette swatches (9 options)

**Step 3 — AI enrichment**

- Toggle list: Auto-generate descriptions · Dietary tag detection · Chef's pick highlights
- Add-on row (amber bg): Multi-language · $29 — "+ Add" button that toggles to "✓ Added"
- Add-on row: AI dish photos · $29 · toggle

**Step 4 — Design variations**

- On entering step: 2-second "Generating..." loading overlay, then reveal 4 cards
- 2×2 grid of design previews (Minimal elegance · Bold & dramatic · Photo-centric · Classic vintage)
- Clicking selects it (green "Selected" pill)
- Upsell nudge: "Designer revision · $199"

**Step 5 — Export**

- 6 export option cards (toggleable selected state):
  - Print-ready PDF · Digital QR menu · Social media pack · QR code kit · Print fulfillment · Translations
- "Download & publish ✓" button → redirects to `/dashboard/menus`

---

### 5.5 My Menus `/dashboard/menus`

- "+ New menu" button → goes to wizard
- 3-column grid of menu cards
- Each card: thumbnail preview (mini mockup) · menu name · updated date · item count · style name · pill badges (Active QR / Print-ready / Draft) · "Edit" button

---

### 5.6 Social Content `/dashboard/social`

- Filter pills: All · Instagram · Stories
- Grid of post cards (3-col): colored preview bg + caption + hashtags
- "+ Generate more" button (mock)
- "Export ZIP" button (mock)

---

### 5.7 QR Codes `/dashboard/qr`

- Grid of QR cards (3-col):
  - SVG QR code visual (hardcoded patterns, styled with brand colors)
  - Menu name · scan count · status pill
  - "Download kit" button (mock)
- "+ Add location" card (upsell to Physical+QR)
- Analytics section:
  - 4 stat tiles (peak hour · avg session · top item · unique visitors)
  - Bar chart (last 7 days, hardcoded data)

---

## 6. Database Schema (Prisma additions to template)

```prisma
model Restaurant {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  name      String
  cuisine   String?
  plan      String   @default("starter") // starter | physical | physical_qr
  createdAt DateTime @default(now())
  menus     Menu[]
}

model Menu {
  id             String     @id @default(cuid())
  restaurantId   String
  restaurant     Restaurant @relation(fields: [restaurantId], references: [id])
  name           String
  status         String     @default("draft") // draft | active | archived
  style          String?    // minimal_elegant | bold_dramatic | photo_centric | classic_vintage
  colorPalette   String?
  itemsJson      Json?      // raw extracted items array
  qrEnabled      Boolean    @default(false)
  qrSlug         String?    @unique
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  items          MenuItem[]
}

model MenuItem {
  id          String  @id @default(cuid())
  menuId      String
  menu        Menu    @relation(fields: [menuId], references: [id])
  name        String
  category    String
  price       Float?
  description String?
  tags        String[] // ["V", "GF", "NF"]
  featured    Boolean @default(false)
  sortOrder   Int     @default(0)
}
```

---

## 7. Component Architecture

```
components/
  layout/
    Sidebar.tsx           ← app shell sidebar
    TopBar.tsx            ← page header + actions
  ui/                     ← shadcn/ui (already in template)
  dashboard/
    StatCard.tsx
    MenuCard.tsx
    QuickActionCard.tsx
    ItemAnalyticsTable.tsx
  wizard/
    WizardShell.tsx       ← step nav + progress bar
    WizardStep.tsx        ← individual step wrapper
    steps/
      Step1Upload.tsx
      Step2Style.tsx
      Step3Enrichment.tsx
      Step4Designs.tsx
      Step5Export.tsx
    ExtractedItemsTable.tsx
    StyleGallery.tsx
    DesignVariationGrid.tsx
  menus/
    MenuGrid.tsx
    MenuThumb.tsx         ← mini mockup previews
  social/
    PostCard.tsx
  qr/
    QRCard.tsx
    ScanAnalytics.tsx
  landing/
    Hero.tsx
    StatsBar.tsx
    HowItWorks.tsx
    SampleDesigns.tsx
    PricingCards.tsx
    Testimonials.tsx
    CTABanner.tsx
    Footer.tsx
```

---

## 8. Mock Data Strategy

For MVP, all "AI processing" is simulated with `setTimeout` delays. Create a `lib/mock-data.ts` file:

- `SAMPLE_MENU_ITEMS` — the Osteria Verde 34-item dataset
- `SAMPLE_MENUS` — 3 hardcoded menus (Spring dinner, Lunch specials, Wine list)
- `SAMPLE_QR_STATS` — scan analytics mock
- `SAMPLE_POSTS` — 4 social posts

When a user creates their first menu → seed their account with the sample restaurant data so the dashboard feels alive immediately.

---

## 9. Key Interactions & Micro-interactions

| Interaction                | Behavior                                                     |
| -------------------------- | ------------------------------------------------------------ |
| Upload area click          | Border turns `g800`, 1.8s spinner, then items table fades in |
| Style card select          | Border to `g800`, "Selected" badge appears, others deselect  |
| "Full photo" style select  | Amber nudge warning slides in below gallery                  |
| Design generation (step 4) | 2s overlay with spinner + "Generating 4 design variations…"  |
| Language add-on toggle     | Button turns amber filled "✓ Added"                          |
| Export card click          | Toggle `selected` state (border + bg tint)                   |
| Wizard "Next →"            | Progress bar animates, step numbers update (✓ for done)      |
| Sidebar nav                | Active item gets lighter bg + white text                     |

---

## 10. MVP Launch Checklist

- [x] Color tokens wired into Tailwind v4 `@theme`
- [x] Fonts loaded: Playfair Display + DM Sans (Google Fonts or next/font)
- [x] Better Auth configured (email OTP — social deferred post-MVP)
- [x] Auth pages styled to match brand
- [ ] Prisma schema migrated (Restaurant · Menu · MenuItem models added)
- [x] Landing page fully built (all sections)
- [x] Dashboard shell (sidebar + topbar) with mock data
- [x] Mobile responsive (sidebar collapses to hamburger on mobile)
- [x] Wizard all 5 steps functional (mock extraction + generation)
- [x] My menus page (list with mock data)
- [x] QR codes page (mock QR visuals + analytics chart)
- [x] Social content page (mock posts grid)
- [ ] Deployed to Vercel with env vars set
- [ ] Waitlist/beta invite mechanism (email field on landing, store in DB)

---

## 11. What to Build After MVP (Post-feedback)

1. **Real AI extraction** — integrate Claude API (vision) to actually parse uploaded PDFs/photos
2. **Real PDF generation** — use Puppeteer or a headless renderer to export the chosen design
3. **Stripe billing** — wire up the 3 pricing tiers
4. **Live QR menu** — `/menu/[slug]` public page that serves the JSON menu data
5. **AI dish descriptions** — Claude API call per item in enrichment step
6. **Dish photo AI generation** — image generation API for missing photos
7. **Multi-language** — Claude translation per menu
8. **Real analytics** — track QR scans with a lightweight events table

---

_PRD last updated: April 2026 · Owner: ClickstudioAI_
