# Product Readiness Roadmap

This roadmap is for turning the bus booking solution from a working demo into a product that feels trustworthy, polished, dynamic, and ready to sell to bus companies.

The goal is not to make the product "finished forever". The goal is to reach a standard where it is good enough to sell, operate, support, and improve with real customers.

## Stage 1: Product Direction

**Status:** Complete. See [PRODUCT_DIRECTION.md](PRODUCT_DIRECTION.md).

**Goal:** Make the product feel intentional instead of like a collection of features.

- [x] Define the product positioning  
  Describe the product in one clear sentence, for example: "A booking and operations platform for turbuss companies."  
  **Done when:** You can explain the product in under 15 seconds without mentioning technical details.

- [x] Define the main users  
  Separate the product into two core users: the customer booking a trip, and the admin/planner running the business.  
  **Done when:** Every major screen clearly serves either the customer or the admin/planner.

- [x] Define the core workflow  
  Write down the full lifecycle: request, quote, confirmation, planning, trip execution, invoice, payment.  
  **Done when:** The admin flow follows this lifecycle naturally.

- [x] Define design principles  
  Agree on principles like route-first, operations-first, fewer generic cards, real fleet imagery, and clear next action.  
  **Done when:** These principles guide design decisions across customer and admin pages.

## Stage 2: Visual Foundation

**Status:** Complete. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

**Goal:** Remove the generic AI/template look and create a stronger product identity.

- [x] Improve the color system  
  Add a richer palette with status colors, neutral tones, and accents beyond simple blue/gray.  
  **Done when:** The product has clear visual identity and no longer feels like a default Tailwind template.

- [x] Tighten typography  
  Define consistent heading sizes, body text, labels, table text, and dashboard numbers.  
  **Done when:** Text hierarchy is clear and pages feel calmer.

- [x] Reduce oversized rounded cards  
  Use cards only where they frame actual content. Avoid making every section a rounded box.  
  **Done when:** Pages feel more mature and less generated.

- [x] Define shared UI patterns  
  Create reusable styles for buttons, forms, status chips, tables, page headers, and summary panels.  
  **Done when:** Customer and admin pages feel like one product.

- [x] Add transport-specific visual language  
  Use route lines, maps, fleet visuals, timelines, license plates, capacity indicators, and trip statuses.  
  **Done when:** The product visually feels like a bus/transport platform.

## Stage 3: Homepage Redesign

**Status:** Complete.

**Goal:** Make the first impression feel real, trustworthy, and immediately about booking bus trips.

- [x] Create a stronger hero section  
  Use a real bus/fleet image or route/map-based visual with a clear booking CTA.  
  **Done when:** The first screen immediately communicates "book a bus trip".

- [x] Add a compact quote widget  
  Let users start with from, to, date, and passengers directly from the homepage.  
  **Done when:** The homepage drives users naturally into the booking flow.

- [x] Replace generic service sections  
  Use concrete transport sections: fleet, trip types, service areas, how the quote process works.  
  **Done when:** The page feels specific to a real bus company.

- [x] Add trust signals  
  Show response time, no payment now, experienced drivers, local presence, reviews, and contact options.  
  **Done when:** A customer understands that submitting a request is safe and non-binding.

- [x] Use real fleet/company content  
  Replace placeholder-like content with actual buses, real images, and customer-specific details.  
  **Done when:** The page could plausibly belong to a real transport business.

## Stage 4: Customer Booking Flow

**Status:** Implemented in `BookingPage.jsx` and `components/booking/`.

**Goal:** Make booking feel like building a trip, not filling out a long form.

- [x] Restructure the steps  
  Use a simpler flow: route, date/passengers, bus/extras, contact/review.  
  **Done when:** Each step has one clear purpose.

- [x] Auto-calculate route  
  Calculate distance after valid addresses are selected instead of relying on a manual-feeling button.  
  **Done when:** Users see route/distance feedback without thinking about the system.

- [x] Add live route preview  
  Show map, route line, distance, stops, and return route when relevant.  
  **Done when:** The user can visually understand the trip before submitting.

- [x] Add sticky trip summary  
  Keep route, date, passengers, bus choice, and estimated price visible.  
  **Done when:** Users never lose track of what they are requesting.

- [x] Hide advanced options by default  
  Put return stops, pause time, trailer, wheelchair, and bus-on-stay in expandable sections.  
  **Done when:** Simple trips feel simple, but complex trips are still supported.

- [x] Add recommended bus/category  
  Suggest suitable buses based on passenger count and needs.  
  **Done when:** Customers are guided instead of forced to understand the fleet.

- [x] Improve final review and success page  
  Show a final summary before submit and a strong confirmation after submit.  
  **Done when:** The user knows what happens next and has a reference number.

## Stage 5: Admin Information Architecture

**Goal:** Make admin feel like an operations system, not a list of unrelated pages.

- [x] Regroup sidebar navigation  
  Group pages into Daily Work, Setup, and Website.  
  **Done when:** Admin users can find important pages without guessing.

- [x] Add an operations inbox  
  Show items that need action: new requests, unplanned bookings, missing drivers, invoices to send, overdue payments.  
  **Done when:** Admins know what to do first when they log in.

- [x] Add global search  
  Search by booking reference, customer name, phone, date, invoice, or driver.  
  **Done when:** Admins can quickly find any important record.

- [x] Add next-action logic  
  Each booking or operation item should show the most relevant next action.  
  **Done when:** Admins do not need to remember the workflow.

## Stage 6: Admin Booking Detail Flow

**Goal:** Make each booking easy to review, plan, invoice, and track.

- [x] Create a clearer booking detail view  
  Separate customer info, route, price, planning, invoice, notes, and activity.  
  **Done when:** Admins can understand a booking in under 30 seconds.

- [x] Add lifecycle timeline  
  Show request, quoted, confirmed, planned, completed, invoiced, paid, cancelled.  
  **Done when:** The booking's current state is obvious.

- [x] Add primary next-action button  
  Examples: confirm booking, create trip, assign driver, generate invoice, send invoice, mark paid.  
  **Done when:** Each booking screen has one obvious next step.

- [x] Add activity log  
  Track important changes such as status changes, price edits, trip creation, invoice sending, and payment marking.  
  **Done when:** Admins can see what happened and when.

- [x] Improve price editing  
  Show base price, VAT, adjustments, extra charges, and final total clearly.  
  **Done when:** Admins can safely explain the price to a customer.

## Stage 7: Planning and Dispatch

**Goal:** Make planning feel like a professional dispatch board.

- [x] Improve calendar readability  
  Make trip blocks easier to scan by status, bus, driver, and type.  
  **Done when:** Admins can understand the day/week at a glance.

- [x] Add unplanned booking queue  
  Show bookings that still need trips or buses assigned beside the planner.  
  **Done when:** No confirmed booking is forgotten.

- [x] Improve assignment modal  
  Make bus, driver, route, dates, stops, and conflicts easier to edit.  
  **Done when:** Creating a trip from a booking is fast and low-friction.

- [x] Highlight conflicts clearly  
  Show when a bus or driver is unavailable and why.  
  **Done when:** Admins can resolve conflicts without trial and error.

- [x] Improve trip timeline/stops  
  Show pickup, stops, destination, planned times, and driver notes in a clear trip timeline.  
  **Done when:** The trip detail view is useful for both admin and driver operations.

## Stage 8: Invoice Flow

**Goal:** Make invoicing safe, clear, and trustworthy.

- [ ] Add invoice preview  
  Show customer, email, invoice lines, amount, due date, and Fiken status before sending.  
  **Done when:** Admins can verify everything before sending.

- [ ] Add send confirmation  
  Confirm before emailing the invoice through Fiken.  
  **Done when:** Admins cannot accidentally send an invoice.

- [ ] Improve invoice filters  
  Add filters like ready to invoice, draft, sent, overdue, paid.  
  **Done when:** Finance work is easy to prioritize.

- [ ] Add payment history/status history  
  Show when invoices were sent, marked paid, or changed.  
  **Done when:** Payment state is auditable.

## Stage 9: Motion and Dynamic Feel

**Goal:** Make the product feel alive without becoming flashy.

- [ ] Add better loading states  
  Use skeletons, inline spinners, and clear saving states.  
  **Done when:** Users always know when the app is working.

- [ ] Animate booking step transitions  
  Add subtle transitions between customer booking steps.  
  **Done when:** The flow feels smoother and less static.

- [ ] Animate route drawing  
  Draw or reveal the route line when route calculation completes.  
  **Done when:** Route calculation feels like a real interaction.

- [ ] Add status change feedback  
  Show small transitions or confirmations when booking, trip, invoice, or payment status changes.  
  **Done when:** Admin actions feel responsive and reliable.

- [ ] Improve modal and panel transitions  
  Make admin modals, drawers, and expandable panels open/close smoothly.  
  **Done when:** The admin UI feels modern but still practical.

## Stage 10: Reliability and Best Practices

**Goal:** Make the product reliable enough to sell and support.

- [ ] Move price calculation to backend  
  The backend should calculate and validate prices instead of trusting frontend totals.  
  **Done when:** Users cannot manipulate booking price from the browser.

- [ ] Add login rate limiting and lockout  
  Protect admin and driver login from repeated guessing.  
  **Done when:** Failed login attempts are throttled safely.

- [ ] Harden file uploads  
  Validate file types, remove risky public SVG uploads, verify content type, and add rate limits.  
  **Done when:** Public uploads are safe enough for production use.

- [ ] Add reliable email handling  
  Use an outbox or retry mechanism instead of fire-and-forget email sending.  
  **Done when:** Failed emails can be retried and tracked.

- [ ] Add audit logging  
  Log important admin actions such as status changes, price edits, invoices, drivers, and planning changes.  
  **Done when:** Business-critical changes are traceable.

- [ ] Add monitoring and alerts  
  Track API errors, failed jobs, database problems, and uptime.  
  **Done when:** You know when production has a problem before the customer tells you.

- [ ] Add backups and restore test  
  Configure daily backups and test restoring them.  
  **Done when:** You can recover customer data after a database failure.

- [ ] Add health checks  
  Check database, email config, Fiken config, and core API health.  
  **Done when:** System status is visible and reliable.

- [ ] Add tests for critical logic  
  Cover pricing, invoice numbering, booking creation, and assignment conflicts.  
  **Done when:** Core business logic can be changed without fear.

## Suggested Execution Order

1. Visual foundation
2. Homepage redesign
3. Customer booking flow
4. Admin operations inbox
5. Admin booking detail flow
6. Invoice preview
7. Planning and dispatch polish
8. Motion/dynamic polish
9. Reliability and best-practice hardening

## Minimum Sellable Standard

You can confidently start selling once these are complete:

- [ ] Customer homepage feels real and trustworthy
- [ ] Booking flow is simple and clear
- [ ] Admin has an operations inbox or clear next-action dashboard
- [ ] Invoice flow has preview and confirmation
- [ ] Backend price calculation is protected
- [ ] Login and upload security are hardened
- [ ] Email sending is reliable
- [ ] Backups and monitoring are active
- [ ] Critical business logic has tests

