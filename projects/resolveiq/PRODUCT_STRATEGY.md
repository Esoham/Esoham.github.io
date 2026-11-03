# ResolveIQ — Product strategy and delivery plan

**Product owner:** Esoham Abalo

## Vision
Help small support teams resolve the most consequential cases first, using understandable prioritization and clear ownership.

## User and problem hypotheses
- A support coordinator is overwhelmed by tickets with different severity and age.
- Customers experience avoidable delays when ownership is unclear.
- A transparent scoring system helps teams trust the queue.
These hypotheses require customer research. No interviews have been conducted or claimed.

## Differentiation
ResolveIQ is a **triage and resolution workflow**, not an AI chatbot. The MVP explains the reason for each priority and allows assignment, notes and resolution status.

## Jobs to be done
When I open a mixed support inbox, show me which cases deserve attention and why, so I can assign work confidently.

## Product metrics
Primary: time to correctly identify and assign the highest-impact case during a moderated usability task.
Supporting: triage accuracy, comprehension, percentage of cases with assigned owners, resolution completion rate.
Guardrails: false escalation rate, data privacy, accessibility.
**No results measured yet.**

## Priority decisions
P0: visible reasons, prioritization, search, owner, notes, status tracking.
P1: shared backend state, audit history, case creation, automated tests, export.
Later: AI suggestions, external helpdesk integrations, SLA rules.

## Decision log
2026-11-03: Use synthetic cases and deterministic scoring to avoid third-party dependencies. Browser localStorage is adequate for concept testing but insufficient for multi-user deployment.

## Usability test protocol
Scenario: A support queue has multiple billing, technical and fulfillment tickets. In 60 seconds, find the highest-impact case, explain the reason, assign it to a team, and mark it In Progress.
Record participant consent, task time, chosen case, priority comprehension, observed obstacles and suggestions. Do not guide participants. Target at least five participants; report actual data only.

## Release gates
- **v0.1 prototype:** published on GitHub Pages; manual browser verification pending.
- **v0.2 reliability:** unit tests for priority rules, keyboard navigation checks, empty-state tests and reset behavior.
- **v0.3 collaboration:** backend, persistent shared statuses, role permissions, audit log.
- **v1.0 evidence:** usability results, at least one documented iteration, release notes and short demo video.

## Definition of done
Source committed, tests run and results logged, accessible demo verified, known limitations documented, and product decision recorded.

## Portfolio story
Frame this as a product-management case study: opportunity hypothesis → user workflow → prioritization trade-offs → implementation → validation plan → real observations → iteration. Do not imply hypothetical metrics are achieved.
