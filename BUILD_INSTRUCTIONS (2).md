# Island Media Co — Build Instructions

Single-day, agent-driven build. Work the prompts in order. Each is scoped to one
agent turn with a "done when" you verify before moving on — a failed step
compounds.

---

## §0 — Before you open an agent (10 minutes)

Lay the repo out first. The brand kit is source material, not application code,
and keeping that boundary is what stops the styling turning into a mess later.

```
docs/brand/island-media.css          the original, untouched — reference only
docs/brand/island-media-tokens.json  reference only
docs/brand/ui-examples.css           reference only — NEVER imported
docs/brand/client-portal.html        reference only
docs/brand/fitter-mobile.html        reference only
docs/brand/management.html           reference only
docs/mockups/*.png                   the three mockup images
docs/imagery                         two images that can be used ie on client page
public/cityMap.webp 3300x3300                       your map backdrop image
```

Nothing under `docs/` is ever imported by the app. It ships in the repo because
a reviewer seeing you worked from the kit is a small free win.

**Attachments per prompt.** Prompt 2 gets everything — it produces the
primitives that everything downstream inherits from, so it is worth loading up.
Every later prompt gets only that page's mockup; by then the agent reads its own
`globals.css` and `@/components/ui`.

Never tell an agent a file exists without attaching it. It will confidently
invent the contents.

---

## §1 — Styling architecture (read once, applies throughout)

The design system already exists in the brand kit. There is nothing to design,
only something to port.

`island-media.css` is two different things stapled together:

**The `:root` block — take it.** `--im-carbon`, `--im-signal-coral`,
`--im-warm-white`, `--im-atlantic`, `--im-concrete`, `--im-mist`,
`--im-success`, `--im-warning`, `--im-danger`, `--im-info`, `--im-font`,
`--im-space-1..8`, `--im-radius-{small,control,surface,feature}`,
`--im-shadow-surface`, `--im-focus-ring`.

**The global classes — do NOT take them.** `.im-button-primary`, `.im-surface`,
`.im-label`, `.im-status-*`, `.im-public-frame` are reference implementations.
Paste them into `globals.css` and they become live global classes competing
with your CSS Modules — then you lose an hour to specificity and `!important`.
Each one gets ported into the matching component's `.module.css` instead.

```
src/app/globals.css        :root {--im-*} + minimal body reset. Nothing else.
                           The ONLY global stylesheet. Imported once.
src/components/ui/Button.tsx
src/components/ui/Button.module.css
src/app/(management)/map/page.module.css
```

Every `.module.css` consumes `var(--im-space-5)`, never `24px`. No Tailwind, no
global utility classes, no inline styles, no styled-components.

**Tripwire — run before recording:**

```bash
grep -rEn "#[0-9a-fA-F]{3,6}\b" src --include=*.module.css
```

Should return nothing. A stray hex in file seventeen is the failure mode.

**Font note.** Avenir Next is licensed by Apple and will not be on your machine
or on Vercel. The fallback chain resolves to Helvetica/Arial and looks fine. If
you want closer, Inter or Nunito Sans from Google Fonts sit near it. Spend five
minutes on this, maximum.

---

## §2 — Global preamble

Two versions. **§2-BOOTSTRAP** for Prompts 1–2, where the design system is
created. **§2-STANDARD** for Prompt 3 onward, once it exists.

### §2-BOOTSTRAP — Prompts 1 and 2 only

```
PROJECT: Island Media Co — out-of-home advertising booking and fulfilment.
The agency sells advertising SURFACES (billboards, bus panels, in-bus screens,
mall doors, vans, EV charge points) for PERIODS of time. Clients request,
management contracts, fitters install and photograph, clients see the proof.

STACK: Next.js App Router, TypeScript, Prisma, Postgres (Neon), Vercel Blob,
CSS Modules. Server Components by default, Server Actions for mutations. No
client-side data fetching unless a feature genuinely needs it.

NON-NEGOTIABLE CONVENTIONS:
- Dates: half-open [startsOn, endsOn). Both are Mondays. endsOn is EXCLUSIVE
  and is never a day the ad is live. weeks = (endsOn - startsOn) / 7.
- Money: integers, pence. Never floats. Never Decimal.
- Identity: read server-side from the session cookie in every server action and
  server component. NEVER filter by user or client in React state.
- Client-scoped queries ALWAYS carry `where: { clientId: session.clientId }`.
- Styling: you are CREATING the design system in this task by PORTING the
  attached brand kit. Do not invent colours, spacing, radii or type sizes —
  every value comes from island-media.css, island-media-tokens.json or
  ui-examples.css. globals.css holds ONLY the :root block plus a body reset;
  everything else is a per-component .module.css. Do not import ui-examples.css
  into the app. No Tailwind, no global utility classes, no inline styles.
- Copy: sentence case, active voice, plain verbs. A button says what happens
  ("Issue contract", not "Submit"). Empty states say what to do next.

RULES:
- Do not modify prisma/schema.prisma unless the prompt says to. If you believe
  a change is needed, STOP and explain instead.
- Do not add libraries beyond those named in the prompt.
- No placeholder or mock data inside components. Data comes from the database.
- If the prompt conflicts with the schema, STOP and ask.
- After each task, list the files you created or changed, and anything you
  deliberately did not do.
```

### §2-STANDARD — Prompt 3 onward

Identical, with the styling clause replaced by:

```
- Styling: the design system EXISTS. Use ONLY the --im-* variables from
  src/app/globals.css and components from @/components/ui. Every new page or
  component gets its own .module.css consuming those variables. Never write a
  raw colour, pixel spacing value, radius or shadow — if you need one that does
  not exist as a token, STOP and say so. If a UI primitive is missing, STOP and
  say so rather than inventing a styled div. No Tailwind, no global classes,
  no inline styles.
- Layout reference: the attached mockup for this page.
```

---

## §3 — Time budget and cut order

| Block | Hours | Content |
|---|---|---|
| A | 0–2 | Prompts 1–3: foundation, primitives, spikes, **deploy** |
| B | 2–4 | Prompt 4: map + inventory editor |
| C | 4–7 | Prompts 5–6: browse → request → contract |
| D | 7–10 | Prompts 7–9: document → payment → jobs → proof |
| E | 10–11 | Prompt 10: close the loop |
| F | 11–12 | Prompt 11: tests |
| G | 12–14 | Prompt 12: polish, readme, video |

**Hard checkpoints.**
- End of block A: deployed, both spikes green. If not, stop and fix — nothing
  else matters yet.
- End of block D: the loop runs end to end on the deployed URL.

**Cut order — cut from the bottom, in this order:**

1. Landing page
2. Inventory editor polish (keep create, drop edit and delete)
3. Route drawing (keep sites and assets, drop polylines)
4. Digital slot booking UI (keep the trigger, book 1 slot silently)
5. ActivityEvent timeline UI (keep the writes)
6. Map (fall back to a list of sites)

**Never cut:** the loop, document generation, the exclusion constraint, the
readme, the video.

---

## §4 — Prompts

### Prompt 1 — Foundation

**Attach:** `schema.prisma`, `001_availability_constraints.sql`,
`island-media.css`, `island-media-tokens.json`. **Preamble:** §2-BOOTSTRAP.

```
Set up the project.

1. Next.js (App Router, TypeScript, CSS Modules), Prisma, @vercel/blob.
2. Copy the attached schema to prisma/schema.prisma. Run migrate dev.
3. Second migration from the attached SQL (the constraints Prisma cannot
   express): `migrate dev --create-only`, paste, then migrate.
4. src/app/globals.css: copy the :root block from island-media.css VERBATIM.
   Add the type scale from island-media-tokens.json as
   --im-text-{display,h1,h2,h3,body-lg,body,small,label} size/line-height/
   weight triples. Add a minimal body reset (font, colour, background).
   NOTHING ELSE — no global classes. Import once in the root layout.
5. Route groups: (portal) at /portal, (management) at /management, (field) at
   /field. Placeholder pages.
6. src/lib/dates.ts — all pure and unit-testable, all dates UTC midnight, no
   timezone maths anywhere else in the app:
     isMonday(d)
     nextValidStart(from, leadTimeDays)   // add lead time, THEN round up to
                                          // the next Monday
     weeksBetween(startsOn, endsOn)
     validDurations(minWeeks, stepWeeks, max = 26)
     addWeeks(d, n)
7. src/lib/money.ts: formatPence(n) -> "£1,234.00". Integer in, string out.

DONE WHEN: `npx prisma migrate deploy` succeeds on a clean database and all
three routes render.
```

### Prompt 2 — Session, switcher, primitives

**Attach:** all three mockup PNGs, `island-media.css`, `ui-examples.css`,
`client-portal.html`, `fitter-mobile.html`, `management.html`.
**Preamble:** §2-BOOTSTRAP.

```
Build the app shell and the component library.

SESSION (src/lib/session.ts):
- Signed cookie holding { userId } only. Role and clientId are looked up from
  the database on read, never trusted from the cookie.
- getSession() -> { user, role, clientId } | null. Server-only.
- requireRole(role) — used in every server action.
- setIdentity(userId) server action: sets the cookie, redirects to that role's
  home (/portal, /management, /field).

IDENTITY SWITCHER (top bar, all three areas):
- ONE global dropdown, grouped by role, listing every user.
- CLIENT users show their client name beside them.
- Selecting a user calls setIdentity and lands in that user's area.
- Visually marked as a demo control (tinted bar, "Demo" tag). It must not look
  like authentication.

SEED (prisma/seed.ts) — USERS AND MAP ONLY, NO INVENTORY:
- 2 ADMIN, 2 FITTER, 5 CLIENT users across 4 Client records. Two client users
  must share one clientId so shared tenancy is demonstrable.
- 1 MapCanvas from /public/map.png, isDefault true.

UI PRIMITIVES (src/components/ui/):
Button (primary/secondary/danger/ghost), Card, Field (label+input+error),
Select, DatePicker, StatusPill, Table, PageHeader, EmptyState, Modal, Toast.

Build these by PORTING the global classes out of island-media.css and
ui-examples.css into per-component .module.css files:
  .im-button-primary -> Button.module.css   (note: already min-height 44px)
  .im-surface        -> Card.module.css
  .im-label          -> Field.module.css / PageHeader.module.css
  .im-status-*       -> StatusPill.module.css, mapped to domain states:
                        success -> CONFIRMED / COMPLETED
                        info    -> ISSUED / BOOKED
                        warning -> DRAFT / HELD / SCHEDULED
                        danger  -> CANCELLED / FAILED / UNAVAILABLE
  .im-public-frame   -> a Frame component (the brand's corner-bracket motif)

Do NOT keep any of these as global classes and do NOT import ui-examples.css.
The three HTML files show the primitives in context — match their spacing and
structure rather than approximating from the PNGs.

Add /dev/ui rendering every primitive in every state.

DONE WHEN: switching identity changes what the server returns (verify by
logging the session user in a server component), and /dev/ui renders.
```

### Prompt 3 — Spikes, then deploy

**Do this before any feature work.** These are the only two things that can
sink the build, and both fail on Vercel rather than locally.
**Preamble:** §2-STANDARD.

```
Two throwaway proofs, then deploy.

SPIKE A — the exclusion constraint on Neon.
Route /api/dev/spike-constraint, in a transaction:
  1. create a temp Site, a STATIC Asset, a Client, a Contract
  2. insert ContractLine A: 2026-10-05 -> 2026-10-19, isExclusive true, HELD
  3. insert ContractLine B, same asset: 2026-10-12 -> 2026-10-26
       -> must FAIL with SQLSTATE 23P01
  4. insert ContractLine C, same asset: 2026-10-19 -> 2026-11-02
       -> must SUCCEED (half-open: C starts the day A ends)
  5. roll back
Return { aInserted, bRejectedWith, cInserted }.

SPIKE B — docxtemplater on Vercel.
  npm i docxtemplater pizzip
  Minimal template at src/templates/contract.docx containing {clientName}.
  Route /api/dev/spike-docx reads it, renders it, returns the .docx as a
  download. Read the template with fs from process.cwd() and CONFIRM the file
  survives into the deployed bundle. If Next tree-shakes it out, move it to
  /public or inline it as base64 — and say which you did and why.

Then: push to a PRIVATE GitHub repo, connect Vercel, set DATABASE_URL and
BLOB_READ_WRITE_TOKEN, deploy, and run both spike routes ON THE DEPLOYED URL.

DONE WHEN: both pass in production, not just locally. If B fails, solving
template resolution IS the job — do not proceed until a real .docx downloads
from the deployed URL.
```

### Prompt 4 — Map and inventory editor

**Attach:** management mockup. **Preamble:** §2-STANDARD.

```
Management builds the inventory. There is no seeded inventory.

/management/map:
- Renders the MapCanvas image with sites as pins at normalised mapX/mapY.
- Click the map -> "Add site" modal: name, kind, address, notes. Store
  normalised 0..1 coordinates (divide by rendered dimensions, never pixels).
- Click a pin -> side panel with the site's details and its assets.
- If kind is DEPOT, the panel also shows route management:
    - attach an existing Route from the shared library, or
    - "Draw new route": click points on the map to build a polyline, give it a
      name and code, store points as [{x,y}] normalised Json.
  Routes attach to SITES, not assets, and ONLY to DEPOT sites. Enforce in the
  server action, and do not render the control for other site kinds.
- Routes render as SVG polylines over the map.

Site panel -> "Add asset": code, name, type, medium, carrier, orientation,
imageUrl, widthMm, heightMm, artworkSpec, weekRatePence, minWeeks, stepWeeks,
leadTimeDays, weeklyImpressions. If medium is DIGITAL, loopSlots and
slotSeconds are required; for STATIC they must be absent.

ALSO BUILD (demo insurance, not optional):
  GET  /api/dev/export  -> all sites, routes and assets as JSON
  POST /api/dev/import  -> wipe and restore them from that JSON
  POST /api/dev/reset   -> wipe requests, contracts, lines, jobs, proofs and
                           events, leaving users, map and inventory intact

DONE WHEN: you can create a site with two assets and a route through the UI
only, export it, reset, and import it back.
```

**Then use it.** Build the demo world: 4–5 sites, ~20 assets. Include both faces
of one billboard as separate assets, one DIGITAL billboard with `loopSlots: 6`,
a depot with bus exteriors and interiors, a mall with doors, one van, one charge
point, 2–3 routes. **Export it immediately and keep the JSON.**

### Prompt 5 — Browse and availability

**Attach:** client portal mockup. **Preamble:** §2-STANDARD.

```
/portal/browse — what the client can buy.

- Grid of active assets: photo, name, type, site, orientation, weekly
  impressions, week rate.
- Filters: type, medium, site.
- Date controls: start date and duration.
    Start offers ONLY Mondays, from nextValidStart(today, asset.leadTimeDays).
    Duration offers only validDurations(minWeeks, stepWeeks).
    The user never types a raw date — the picker generates valid options.
- With a window selected, each asset shows Available or Unavailable.

src/lib/availability.ts, used by browse AND by conversion:
  isAssetAvailable(assetId, startsOn, endsOn)
    STATIC  — no overlapping ContractLine in HELD or BOOKED
    DIGITAL — peak concurrent slots over the window is below loopSlots.
              Check peak at interval START boundaries only: occupancy only
              rises when a booking starts.

Asset detail page: larger photo, spec, artwork spec, site, and for depot assets
the routes that depot serves. Availability calendar for the next 12 weeks.

DONE WHEN: a client picks a valid window and sees accurate availability across
both static and digital assets.
```

### Prompt 6 — Request, inbox, conversion

**Attach:** client portal + management mockups. **Preamble:** §2-STANDARD.

```
The demand side and its conversion.

PORTAL:
- "Add to request" (basket in the session cookie), /portal/request to review,
  optional message, submit.
- Creates BookingRequest + BookingRequestItems, status SUBMITTED, ref
  REQ-YYYY-NNNN.
- /portal/requests lists this client's requests with per-item status.
- /portal/signup creates Client + User (role CLIENT) and sets the cookie. New
  clients then appear in the identity switcher.

MANAGEMENT:
- /management/requests — inbox, newest first, badge for SUBMITTED.
- /management/requests/[id] — recomputes availability for every item AT OPEN
  TIME. Do not persist availability eagerly anywhere else. Items that became
  unavailable are flagged with the contract number holding them.
- "Convert to contract" creates Contract (DRAFT, number IMC-YYYY-NNNN) plus a
  ContractLine per selected item:
      isExclusive   = asset.medium === 'STATIC'
      weekRatePence = asset.weekRatePence   // SNAPSHOT, never read live later
      weeks, lineTotalPence, status HELD, holdExpiresAt = now + 48h
  Converted items -> CONVERTED, unavailable ones -> UNAVAILABLE, request ->
  CONVERTED or PARTIALLY_CONVERTED.
- Catch SQLSTATE 23P01 and show "Already held by <contract number>" against
  that ITEM. Do NOT fail the whole conversion — convert the rest.

Write ActivityEvent rows throughout: request.submitted (clientVisible true),
contract.created (clientVisible false).

DONE WHEN: two clients request the same asset for overlapping windows; the
first converts, and the second is flagged unavailable on that item alone while
its other items still convert.
```

### Prompt 7 — Issue and document generation

**Preamble:** §2-STANDARD.

```
The one genuine integration.

Build src/templates/contract.docx with docxtemplater placeholders:
  {contractNumber} {issueDate} {clientName} {clientAddress} {contactName}
  {#lines}{assetCode} {assetName} {siteName} {startsOn} {endsOn} {weeks}
  {weekRate} {lineTotal}{/lines}
  {subtotal}, a terms block, a signature block.

/management/contracts and /management/contracts/[id]: line schedule, subtotal,
status, actions.

"Issue contract" server action, ONE transaction:
  1. requireRole('ADMIN'); assert DRAFT and at least one line
  2. render the docx from the SNAPSHOT values on the lines, not live asset data
  3. compute sha256, upload to Vercel Blob
  4. create ContractDocument (version 1, DOCX, blobUrl, blobKey, sha256,
     byteSize)
  5. Contract -> ISSUED, issuedAt = now
  6. ActivityEvent contract.issued, clientVisible true
If the upload fails, nothing is written.

Download from management and from the portal. The portal download MUST verify
the contract belongs to the session's clientId.

THE DOCUMENT IS GENERATED ONCE AND FROZEN. Never re-render on download — always
serve the stored blob. Re-issuing creates version 2; it does not overwrite
version 1.

DONE WHEN: issuing produces a .docx that opens in Word with a correct line
schedule, and downloading it twice returns byte-identical files.
```

### Prompt 8 — Accept, pay, generate jobs

**Preamble:** §2-STANDARD.

```
The payment gate and the hand-off to fulfilment.

PORTAL /portal/contracts/[id]:
- Shows ISSUED contracts with the hold deadline and a document download.
- "Accept and pay" (simulated, one button, no payment UI), ONE transaction:
    1. Contract -> CONFIRMED; signedAt = paidAt = confirmedAt = now
    2. every line -> BOOKED, holdExpiresAt = null   <-- MUST be in the same
       transaction, or the sweep will release a paid contract's inventory
    3. generate jobs for STATIC lines ONLY:
         FIT     scheduledFor = startsOn - 2 working days
         REMOVAL scheduledFor = endsOn
       DIGITAL lines generate NO jobs — content is pushed remotely.
    4. ActivityEvents: contract.confirmed, job.scheduled (client-visible)

MANAGEMENT:
- /management/jobs — board grouped by scheduled date, filterable by fitter and
  status. Assign a fitter (SCHEDULED -> ASSIGNED).
- Hold expiry: POST /api/cron/release-holds calling release_expired_holds(),
  plus a manual button in management so it is demonstrable on camera.

DONE WHEN: paying flips every line to BOOKED, creates exactly two jobs per
static line and zero for digital, and clears the holds.
```

### Prompt 9 — Field view

**Attach:** fitter mobile mockup. **Preamble:** §2-STANDARD.

```
/field — mobile-first. Assume one hand, bright sunlight, a depot forecourt.

- /field: today's jobs for the session fitter, then upcoming. Each card shows
  kind (FIT/REMOVAL), asset code and name, site name and ADDRESS, scheduled
  date, status.
- /field/jobs/[id]: full detail, asset photo, artwork spec, instructions, and
  the site address as a large tappable line.
- Start job (ASSIGNED -> IN_PROGRESS), then Complete job — which REQUIRES at
  least one proof upload before it will submit.
- Proof upload: <input capture accept="image/*,video/*"> straight to Vercel
  Blob. Store kind, blobUrl, blobKey, contentType, byteSize, caption,
  capturedAt. Show a thumbnail strip of what has been uploaded.
- "Cannot complete" -> FAILED with a required failureReason.
- On the first FIT completion for a contract, flip it to ACTIVE. When every
  REMOVAL on a contract is COMPLETED, flip it to COMPLETED.

CONSTRAINTS (functional, not decorative):
- All tap targets >= 44px.
- Primary action fixed to the bottom of the viewport, reachable one-handed.
- Never hide job state behind a hover or tooltip.
- Optimistic UI on upload with a clear failure path — depot signal is bad.

DONE WHEN: a fitter completes a job with a photo at a phone-sized viewport, and
completion is blocked without proof.
```

### Prompt 10 — Close the loop

**Attach:** client portal mockup. **Preamble:** §2-STANDARD.

```
What the client sees. This is the payoff of the whole brief.

/portal/contracts/[id]:
- Campaign timeline from ActivityEvent where clientId matches AND clientVisible
  is true, newest first, with a verb-appropriate icon.
- Proof gallery: every JobProof for this contract's jobs, grouped by asset,
  labelled Installed / Removed with the capture date. Images inline, video with
  a play control, click for a lightbox.
- Per-line live status: Scheduled / Installed / Live / Removed, DERIVED from
  job status, not stored.

/portal dashboard: active campaigns, contracts awaiting acceptance with their
deadline, recent proof.

Add a short "Proof of posting" explainer in the portal: in OOH this evidence IS
the deliverable, because the advertiser cannot go and check twelve buses
themselves.

DONE WHEN: a fitter's photo, uploaded on a phone, appears in that client's
portal — and does NOT appear for any other client.
```

### Prompt 11 — Tests

Give the agent §5 verbatim.

### Prompt 12 — Polish, readme, video

**Preamble:** §2-STANDARD.

```
Final pass.

- EmptyState everywhere, with copy saying what to do next, not "No data".
- Loading skeletons on the three list pages.
- Error states on both upload paths.
- Check every page against its mockup: spacing, type scale, status colours.
- Run: grep -rEn "#[0-9a-fA-F]{3,6}\b" src --include=*.module.css
  It must return nothing.
- Landing page at / using the brand hero, explaining the three roles and
  linking into each. Only if time remains.

Then write README.md from the skeleton in §7.
```

---

## §5 — Tests

Vitest, one config, two files. Deliberately small and aimed at the rules that
would be expensive to get wrong.

```
Install vitest and tsx. Add "test": "vitest run".

FILE 1 — src/lib/__tests__/dates.test.ts (pure, no database):

  1. isMonday: true for 2026-10-05, false for 2026-10-06.
  2. nextValidStart from a Wednesday with leadTimeDays 7 returns the SECOND
     Monday after it, not the first — lead time applies BEFORE rounding.
  3. nextValidStart when today + lead time IS a Monday returns that Monday
     unchanged (no off-by-one week).
  4. weeksBetween(2026-10-05, 2026-10-19) === 2.
  5. validDurations(2, 1) starts [2,3,4]; validDurations(2, 2) starts [2,4,6].
  6. formatPence(123400) === "£1,234.00"; formatPence(0) === "£0.00".

FILE 2 — src/lib/__tests__/availability.test.ts (real database; use a scratch
Neon branch or local Postgres with the same migrations):

  7. OVERLAP REJECTED — two STATIC lines on one asset, 05-19 Oct and 12-26 Oct.
     The second insert throws SQLSTATE 23P01.

  8. ADJACENT ACCEPTED — the boundary test, and the most valuable test here.
     Lines 05-19 Oct and 19 Oct-02 Nov on the same STATIC asset. BOTH succeed.
     If this fails, the half-open convention is broken somewhere and every date
     in the app is off by a day.

  9. RELEASED DOES NOT BLOCK — insert 05-19 Oct, set it RELEASED, insert an
     overlapping line. It succeeds.

 10. DIGITAL PEAK CAPACITY — asset with loopSlots 6:
       A: 2 slots, weeks 1-2
       B: 2 slots, weeks 3-4
       C: 3 slots, weeks 1-4   -> MUST SUCCEED
     Peak concurrency is 5, never 7. A naive sum of overlapping slots would
     wrongly reject C. This is what proves the boundary-walking trigger.

 11. DIGITAL OVER CAPACITY — same asset: A 4 slots weeks 1-4, then B 3 slots
     weeks 2-3 -> rejected (peak would be 7).

 12. JOB GENERATION — confirming a contract with one STATIC and one DIGITAL
     line produces exactly 2 jobs (FIT + REMOVAL), both on the static line, and
     REMOVAL.scheduledFor equals that line's endsOn.

Every database test runs in a transaction that is rolled back afterwards. No
test may depend on another test's data.
```

---

## §6 — Manual smoke checklist

Run on the **deployed URL** before recording. It doubles as the video script.

- [ ] Sign up as a new client; it appears in the switcher
- [ ] Browse — the picker offers only valid Mondays and durations
- [ ] Request three assets, one digital
- [ ] Switch to admin; the request is in the inbox
- [ ] As a second client, request one of the same assets for an overlapping
      window plus one free asset
- [ ] Convert the first request, then open the second: the clashing item is
      flagged, the free one still converts
- [ ] Issue the contract; download the .docx; open it in Word
- [ ] Switch to the client; download the same document from the portal
- [ ] Accept and pay — lines go BOOKED, jobs appear
- [ ] Assign a fitter; switch to that fitter at a phone viewport
- [ ] Try to complete without a photo — blocked
- [ ] Upload a photo, complete — contract goes ACTIVE
- [ ] Switch to the client: the photo is in the portal timeline
- [ ] Switch to the OTHER client: that photo is not visible
- [ ] Double-click "Accept and pay" rapidly — exactly one confirmation

---

## §7 — README skeleton

Write it as you go, not at the end. This is where your judgement gets graded.

```
# Island Media Co

## What this is — the loop in one paragraph
## Setup — env vars, migrate (INCLUDING the raw SQL migration), seed, dev
## Demo guide — which user to switch to, in what order

## Key decisions
1. Document generation: docxtemplater -> .docx, generated once at issue and
   frozen. Why DOCX over PDF: ops edits contracts before sending, the template
   is owned by non-developers, and no headless browser belongs in a serverless
   function. Rejected: Puppeteer (bundle size, cold starts), @react-pdf/renderer
   (limited layout engine, output not editable by ops), Google Docs API (needs
   real OAuth, which the brief rules out). Trade-off accepted: DOCX is not
   final-form, mitigated by the stored sha256; production would add a Gotenberg
   worker for PDF.
2. Availability in the database, not the application. The read-then-write race,
   and why a constraint beats a check: it protects every path, including ones
   written next year.
3. Two occupancy models. Static is exclusive; digital sells share of loop. Why
   isExclusive is denormalised onto ContractLine (a constraint sees only its own
   row), and why the peak check walks interval boundaries rather than summing.
4. Aligned trading periods. Mondays, whole weeks, because fitting is batched
   labour and no operator dispatches a van per booking. It also removes
   proration entirely — you cannot sell half a period.
5. One shared data model. A bus panel is inventory to the client, a contract
   line to management, and a job site to the fitter.
6. Auth is simulated; authorisation is real. Every server action checks role
   and scopes by clientId.

## Deliberately out of scope
Payments, real auth, artwork upload and approval, package/audience buying,
vehicle registry, supplier-side contracts for subcontracted fitting,
notifications, multi-currency. One line each on what I would do instead.

## Known simplifications
Real OOH trades on credit terms and invoices after the campaign runs — the
genuine gate is a countersigned contract, not payment. I used a payment gate
because it makes the hold-expiry mechanic demonstrable.

## Who did what
Solo build. State which parts were AI-assisted.
```

---

## §8 — Video (5–10 min)

| Time | Content |
|---|---|
| 0:00–0:45 | What it is, the stack, the loop in one sentence |
| 0:45–5:00 | The loop as ONE story: one client, one campaign, request → contract → document → payment → fit → proof → portal. Use the identity switcher; never touch the URL bar |
| 5:00–7:00 | The document decision. They said "especially" — give it real time. Show the frozen blob and the hash |
| 7:00–8:30 | Availability: attempt a double-booking live, show the constraint rejecting it, explain the race |
| 8:30–9:30 | What you cut and what you would do next |

Do not tour the codebase. Nobody has ever been hired off a file-tree
walkthrough.

**Say these three sentences somewhere:**

1. "A contract document that re-renders on every download isn't a contract,
   it's a report — so it's generated once at issue and frozen, with a hash."
2. "An application check protects the code path you wrote it in; a database
   constraint protects every path, including the one someone adds next year."
3. "Bookings start on Mondays because fitting is batched labour — the
   constraint comes from the operations, not the UI."
