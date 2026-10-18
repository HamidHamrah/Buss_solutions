# Product Direction

This document defines the product direction for the bus booking solution. It should guide design, customer flow, admin workflow, and future development decisions.

## Positioning

**One-sentence product description:**  
A booking and operations platform for turbuss companies that turns trip requests into planned trips, driver assignments, invoices, and paid jobs.

**Short sales version:**  
The system helps bus companies handle the full journey from customer quote request to planned trip and invoice, without losing control in email, spreadsheets, and manual follow-up.

**What the product is:**  
- A public website and quote request flow for bus customers.
- An admin system for reviewing, planning, invoicing, and tracking trips.
- A driver portal for trip execution and live updates.
- A configurable template that can be branded for different bus companies.

**What the product is not:**  
- Not only a website.
- Not only a booking form.
- Not a generic CRM.
- Not a full accounting system.
- Not a marketplace for multiple bus providers.

## Core Promise

The product should help a bus company answer four daily questions:

1. What requests came in?
2. What needs to be planned?
3. What is happening today or soon?
4. What needs to be invoiced or paid?

If the product answers these clearly, the admin flow is working.

## Main Users

### Customer

The customer is a private person, school, company, sports team, organization, or event planner who needs transport.

**Customer goals:**
- Understand whether the bus company can handle their trip.
- Get an estimated price or quote.
- Submit route, date, passengers, and special needs without confusion.
- Feel safe that the request is non-binding until confirmed.
- Receive confirmation and know what happens next.

**Customer screens should prioritize:**
- Clear route input.
- Date/time and passenger details.
- Simple explanation of price estimate.
- Trust signals.
- Easy contact and confirmation.

### Admin / Planner

The admin/planner is the person running daily bus operations.

**Admin goals:**
- Review new requests quickly.
- Confirm, quote, or cancel bookings.
- Plan trips with buses and drivers.
- Avoid bus/driver conflicts.
- Track trip status.
- Generate and send invoices.
- Follow up on unpaid invoices.

**Admin screens should prioritize:**
- Next action.
- Operational status.
- Search and filtering.
- Fast editing.
- Auditability.
- Reliability and low ambiguity.

### Driver

The driver uses the system only for assigned trips.

**Driver goals:**
- See upcoming trips.
- Understand route, stops, times, and notes.
- Start and complete trips.
- Share live position when needed.
- Add trip notes.

**Driver screens should prioritize:**
- Simple mobile layout.
- Clear trip timeline.
- Minimal admin complexity.
- Large, safe actions.

## Core Workflow

The product lifecycle should be:

```text
Customer request
-> Admin review
-> Quote or confirmation
-> Trip planning
-> Bus and driver assignment
-> Driver execution
-> Trip completion
-> Invoice generation
-> Invoice sent
-> Payment tracked
```

## Booking Lifecycle Labels

The UI should present the lifecycle with human-friendly labels:

```text
New request
Quoted
Confirmed
Needs planning
Planned
In progress
Completed
Ready to invoice
Invoice draft
Invoice sent
Paid
Cancelled
```

The database does not need to store every label as a single enum immediately. Some labels can be derived from booking, assignment, invoice, and payment state.

## Customer Flow Direction

The customer experience should feel like building a trip.

Target flow:

```text
1. Route
2. Date and passengers
3. Bus and extras
4. Contact and review
5. Request confirmation
```

### Customer Flow Principles

- Route first: the route is the core of the request.
- Simple trips should feel simple.
- Advanced options should be available but not visually dominant.
- Price should be described as an estimate unless the company explicitly confirms it.
- The user should always know whether they are booking, requesting a quote, or waiting for confirmation.
- The final step should summarize everything before submission.
- The success page should clearly explain what happens next.

## Admin Flow Direction

The admin experience should feel like an operations control center.

Target flow:

```text
Operations inbox
-> Booking detail
-> Plan trip
-> Assign resources
-> Track execution
-> Invoice
-> Payment follow-up
```

### Admin Flow Principles

- Every important item should have a visible next action.
- Admin users should not need to remember the workflow.
- The system should surface risk: missing driver, missing bus, conflict, overdue invoice.
- Booking detail should be the main work surface for a single customer request.
- Planner should be the resource/calendar view, not the only place to understand a booking.
- Invoice actions should be previewed and confirmed before sending.
- Important changes should be logged.

## Design Direction

The product should feel practical, trustworthy, and transport-specific.

### Desired Feel

- Operational
- Calm
- Reliable
- Local and real
- Professional but not corporate-heavy
- Fast to scan

### Avoid

- Generic SaaS landing-page feel.
- Too many oversized rounded cards.
- Decorative gradients that do not communicate anything.
- Generic stock imagery.
- Text-heavy pages with no operational visuals.
- Admin screens where every action has equal visual weight.

### Use More

- Route lines.
- Maps.
- Trip timelines.
- Fleet photos.
- Seat/capacity indicators.
- License plate and bus identifiers.
- Status chips.
- Dispatch-board style layouts.
- Clear action queues.
- Real company details.

## Navigation Direction

Admin navigation should be grouped by job-to-be-done:

```text
Daily Work
- Dashboard
- Operations Inbox
- Bookings
- Planner
- Trips
- Invoices

Setup
- Buses
- Drivers
- Prices
- Company Settings

Website
- Content
- Tours
- FAQ
- Partners
- Reviews
- Recruitment
```

## Definition of Stage 1 Done

Stage 1 is complete when:

- The product can be described in one clear sentence.
- The main users are defined.
- The customer flow direction is clear.
- The admin flow direction is clear.
- The core lifecycle is documented.
- Design principles are documented.
- Future design and development work can be judged against this direction.

