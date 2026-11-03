# MerchantFlow — Product Requirements Document
Status: MVP prototype v0.1 | Owner: Esoham | November 2026

## Problem
Small Shopify merchants must inspect orders, fulfillment status, and stock separately to detect exceptions. Hypothesis: a prioritized, explainable queue reduces triage time.

## Users and discovery
Primary persona: owner-operator managing 10–100 daily orders. Secondary: small fulfillment team member. These are assumptions to validate, not interviewed personas. Discovery plan: interview 3–5 merchants, observe how they handle late orders, and test a clickable queue with five users. Record consent and actual findings; do not fabricate testimonials.

## Jobs to be done
When an order risks delay, show me why and what to check next so I can respond before it escalates.

## MVP scope
- Ingest synthetic sample orders in v0.1; Shopify GraphQL Admin API in integration milestone.
- Deterministic risk rules: stock below required units, unfulfilled age >=3 days, manual-attention flag.
- Rank exceptions by rule score; show transparent explanations and suggested next steps.
- Filter/search issues; set Open, Reviewing, Resolved.
- Save demo status locally. No Shopify write operations.

## Out of scope
Customer messaging, order cancellation, inventory edits, AI model inference, payments, real customer personal data.

## Success criteria
Five usability testers can identify the highest-priority order and explain the reason. Target median time-to-triage under 60 seconds (hypothesis, not achieved). Track time to resolve and false-positive flags after real integration.

## Shopify integration architecture
Shopify embedded React Router app + App Bridge and Polaris; server-side GraphQL Admin API with minimum scopes read_orders, read_products, read_inventory as necessary; Prisma database for shop sessions and issue state; server-side deterministic rules; webhook-based updates in later milestone. Never expose Admin API tokens in browser or GitHub. Confirm actual permission and protected-customer-data requirements before using live store data.

## Acceptance tests
1. Shortage flags if available < required.
2. Unfulfilled age >=3 days flags.
3. Fulfilled orders do not flag.
4. Issue statuses persist after refresh in demo.
5. Search and filters work together.
6. Reset restores initial demo state.
7. UI explicitly labels simulated data.

## Risks and decisions
- Inventory availability may be location-dependent: v0.1 simplifies to one available quantity.
- Order age is static in demo; live version must use timezone-safe timestamps.
- Risk weights are illustrative and must be calibrated with merchant feedback.
- Browser localStorage is demo-only, not production multi-user persistence.
- Existing GitHub Pages portfolio hosts prototype; a separate repository and hosted authenticated backend are needed for the Shopify app.

## Next iteration
Create dedicated MerchantFlow repository, scaffold Shopify React Router template with CLI, connect development store, implement GraphQL order/inventory adapters, persist issue statuses in database, write unit and end-to-end tests, and record actual usability findings.
