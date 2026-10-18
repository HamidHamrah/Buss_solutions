# Design System

This document defines the visual foundation for the bus booking product. It should guide the homepage, customer booking flow, admin operations screens, and driver screens.

The goal is to move away from a generic SaaS/template look and toward a practical, transport-specific product that feels reliable, local, and operational.

## Design Position

**Product feel:**  
Calm, practical, trustworthy, transport-specific, and fast to scan.

**Design reference direction:**  
More dispatch board and route planner than marketing SaaS page.

**What the design should communicate:**
- This is a real bus company system.
- Trips move through a clear operational lifecycle.
- Admin users can trust the data and actions.
- Customers can request a quote without confusion.
- The system handles route, fleet, planning, driver, invoice, and payment work.

## Visual Principles

- [ ] Route-first  
  Routes, maps, stops, distance, and timelines should be central visual elements.  
  **Done when:** Important customer and admin screens visually communicate trip movement, not just static forms.

- [ ] Operations-first admin  
  Admin pages should prioritize next action, status, risk, and deadlines.  
  **Done when:** Admin users can quickly see what needs attention.

- [ ] Fewer generic cards  
  Cards should frame meaningful objects like bookings, trips, buses, invoices, and alerts.  
  **Done when:** Pages no longer feel like repeated rounded boxes.

- [ ] Real transport identity  
  Use fleet images, license plates, seat counts, driver names, route lines, and dispatch-style layouts.  
  **Done when:** The product could not be mistaken for a generic CRM template.

- [ ] Quiet confidence  
  Use strong hierarchy, restrained colors, clear spacing, and deliberate interaction states.  
  **Done when:** Screens feel mature, not flashy.

## Color System

The current blue/gray palette is usable but too generic. The product should use a deeper operational palette.

### Core Colors

- **Ink:** primary text and dark UI surfaces.  
  Suggested: `#111827`

- **Slate:** secondary surfaces, sidebar, admin shell.  
  Suggested: `#1f2937`

- **Fleet Blue:** primary brand/action color.  
  Suggested: `#175c8e`

- **Route Cyan:** route lines, map highlights, live movement.  
  Suggested: `#0891b2`

- **Signal Amber:** warnings, needs action, pending planning.  
  Suggested: `#d97706`

- **Operational Green:** confirmed, completed, paid.  
  Suggested: `#15803d`

- **Brake Red:** cancelled, failed, overdue, destructive action.  
  Suggested: `#dc2626`

- **Road Gray:** borders, table dividers, muted UI.  
  Suggested: `#e5e7eb`

- **Canvas:** app background.  
  Suggested: `#f6f7f9`

**Done when:** Colors clearly distinguish brand actions, routes, warnings, success, danger, and neutral structure.

## Typography

The typography should feel functional and professional.

- Use Inter or a similar UI sans font for the main application.
- Avoid oversized marketing headings inside admin tools.
- Use strong numeric styles for dashboard metrics, prices, and counts.
- Keep labels small, clear, and consistent.
- Avoid negative tracking as a default system-wide style.

### Suggested Scale

- Page title: `24-32px`
- Section title: `18-22px`
- Card/entity title: `15-17px`
- Body text: `14-16px`
- Labels/meta text: `12-13px`
- Table text: `13-14px`
- KPI numbers: `28-40px`

**Done when:** Users can scan pages by title, status, data, and action without reading everything.

## Radius and Shape

The current design uses many large rounded corners. That contributes to the generic AI-generated feel.

### Direction

- Use `8px` for most buttons, inputs, table rows, status chips, and compact panels.
- Use `12px` for important panels and modals.
- Use larger radii only for media/image treatments where it feels intentional.
- Avoid `rounded-3xl` as a default layout style.

**Done when:** The product feels sharper, more operational, and less like a soft landing-page template.

## Spacing and Layout

Layouts should be dense enough for business work but not cramped.

- Public pages can breathe more.
- Admin pages should prioritize scanning and repeated action.
- Use table/list layouts for operational records.
- Use cards for individual entities, not whole page sections.
- Keep action areas predictable: primary action top-right or in the relevant row/panel.

**Done when:** Admin users can work quickly without visual noise.

## Component Patterns

### Buttons

Use clear button roles:

- **Primary:** main next action.
- **Secondary:** supporting action.
- **Ghost:** low-emphasis navigation or utility.
- **Danger:** destructive action.
- **Icon button:** compact tool/action.

**Done when:** Every screen has one obvious primary action.

### Status Chips

Status chips should be small, readable, and consistent.

Suggested groups:

- New request: blue/cyan
- Needs action: amber
- Confirmed/planned: blue
- In progress: indigo/cyan
- Completed/paid: green
- Cancelled/failed/overdue: red
- Draft/neutral: gray

**Done when:** Status can be understood at a glance without reading long labels.

### Forms

Forms should be practical:

- Clear labels.
- Helpful placeholder text only where useful.
- Inline validation.
- Group advanced fields behind expandable sections.
- Use summary panels for important calculated results.

**Done when:** Forms feel guided, not like raw database fields.

### Tables and Lists

Admin tables should be optimized for action:

- Primary object first: customer, booking reference, trip, invoice.
- Status near the object.
- Date/time visible.
- Amounts right-aligned.
- Actions consistent and predictable.

**Done when:** Admins can scan 20 rows and know what needs attention.

### Summary Panels

Use summary panels for:

- Trip request summary.
- Booking price summary.
- Invoice preview.
- Driver trip details.

**Done when:** Important decisions have a clear, compact summary before action.

## Transport-Specific Visual Language

Use these patterns to make the product feel specific:

- Route line connecting start, stops, and destination.
- Map preview for route and tracking.
- Timeline for trip execution.
- Fleet row/card with seat count, license plate, amenities, and image.
- Driver assignment chip.
- Capacity indicator.
- Invoice/payment state indicator.
- Operations queue for work that needs attention.

**Done when:** Screens visually explain transport work, not just generic admin data.

## Motion Direction

Motion should support clarity, not decoration.

Use motion for:

- Route calculation.
- Step transitions.
- Modal/sheet entry and exit.
- Status updates.
- Save confirmations.
- Expanding advanced options.

Avoid:

- Decorative bouncing.
- Large page animations that slow down work.
- Random movement unrelated to user action.

**Done when:** The app feels responsive and alive without distracting admin users.

## Stage 2 Done Criteria

Stage 2 is complete when:

- The design direction is documented.
- The color palette is defined.
- Typography rules are defined.
- Radius/shape rules are defined.
- Component patterns are defined.
- Transport-specific visual language is defined.
- Tailwind/theme tokens are updated to support this direction.
- New design choices can be judged against this document.

