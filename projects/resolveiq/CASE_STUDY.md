# ResolveIQ — Product case study (in progress)

## Product problem
Small support teams often lack a consistent way to prioritize cases by severity, breadth of impact, and time waiting. **This is a product hypothesis**, not a finding from completed interviews.

## User
Support coordinator at a small business, managing a queue of mixed technical, billing and fulfillment requests.

## MVP scope
- Fictional support cases, categorized by issue type.
- Deterministic priority rules with visible explanations.
- Suggested next actions, search and status filtering.
- Case ownership, notes and resolution statuses saved in localStorage.
- Resettable demo. No external API, credentials, or AI model required.

## Scoring
Blocked customer workflow: +45; at least 5 users/orders impacted: +35; 3–4 days waiting: +15; 5+ days: +25. Urgent >=70; High >=35; otherwise Normal. Thresholds are hypotheses to test.

## Acceptance criteria
- Blocked, broad-impact cases appear above ordinary questions.
- Every priority displays a human-readable reason.
- Status, owner and notes survive browser refresh.
- Search and status filtering work together.
- No actual customer information is used.

## Research and iteration
Interview 3–5 consenting support agents, test with five participants, record time to identify highest-impact case, explanation comprehension, and usability obstacles. Adjust rules based on findings; do not claim outcomes before testing.

## Limitations
This is a working standalone browser prototype, not a deployed authenticated multi-user support platform. Local browser state is not shared between devices. Rules are not AI. The fictional data is not evidence of business performance.

## Next release
Move to independent repository, add backend + database, authentication, editable case creation, import/export, audit history, automated tests, and production hosting.
