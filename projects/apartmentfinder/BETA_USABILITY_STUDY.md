# ApartmentFinder · Atlanta renter usability study

## Purpose
Determine whether renters can discover, assess and compare provider-reported rental records and understand their actual budget **without confusing reported data with verified availability**.

## Recruitment
Recruit 5–10 adults who are currently researching housing in metro Atlanta and volunteer to participate. Invite through personal/community contacts or permitted community groups. Participation is optional; no application, identity document, payment, or private financial information is required. Do not imply ApartmentFinder is affiliated with landlords.

## Session plan (20–25 minutes)
**Before starting (2 min):** Tell the participant this is a beta and some listings may not be available. Ask permission to take anonymous task notes. Do not capture passwords, income, current address, or screen recordings without separate explicit permission.

**Scenarios (15 min):**
1. Search College Park or Atlanta with a maximum listed rent of $1,200. Report whether the filters work.
2. Select a real rental, review its details, and explain what is *provider-reported* vs. independently verified. Ask whether a suspiciously low rent appears to describe a room or an entire unit.
3. Save two rental records. Compare listed rent, bedrooms, and missing fees side by side.
4. Use **fictional sample finances**: monthly take-home $2,600; rent $900; utilities $100; transportation $250; groceries $300; debt $100. Ask what remains after entered living costs ($950) and what other expenses may still apply.
5. Prepare an on-site feedback report; ask whether the user recognizes it is not automatically submitted and GitHub submission is public.

**Wrap-up (5 min):** Ask which step was hardest, what seemed most trustworthy or least trustworthy, and what missing information would stop them from contacting a property. Ask whether the mobile layout is comfortable.

## Observer log
For each session, record only: session code (T01, T02...), device type, task number, completed without help (yes/no), major error, confusing copy/control, time-to-complete (optional), and severity (blocker / major / minor / cosmetic). Avoid personal identity or rental history.

## Success gates
- At least 80% complete search → details → comparison → planner without intervention.
- All functional blockers reproduced and resolved with regression coverage.
- No tester mistakes provider-reported "Active" for verified unit availability.
- Mobile and keyboard interactions have no critical blockers.
- Do not start broad promotion until terms of public RentCast display and property accuracy review have been assessed.

## Ethical product research
No actual rental applications, deposits, SSNs, credit checks, lease agreements or personally identifying financial profiles should be requested. Explain that testers can withdraw at any time. Store only anonymous aggregate findings.

## Next product decisions
Prioritize issues by severity × frequency × renter impact. When more than one tester flags the same problem, make a reproducible bug ticket, add an automated check when possible, and retest the journey after fixing.
