# AuditGuard AI — IT Audit Engagement Simulation

**Author:** Esoham Abalo  
**Classification:** Independent educational portfolio project; all entities, systems, identities, and evidence are fictional. Not affiliated with BNSF Railway.  
**Project:** [Interactive demo](../projects/auditguard-ai.html)

## Engagement objective
Evaluate whether selected IT controls in a fictional transportation company's ERP environment provide evidence of (1) authorized privileged access, (2) segregation of duties for transactions, and (3) approved changes before production deployment.

## Scope and risk-control matrix

| ID | Risk | Control objective | Test procedure | Evidence |
| --- | --- | --- | --- | --- |
| AC-01 | Excessive or unauthorized privileged access | Privileged access is approved and reviewed | Inspect privileged-user listing; compare each entry to recorded approval | User ID, assigned role, approval status, review date |
| SOD-01 | Unauthorized or self-approved transactions | Requester and approver are different identities | Compare requester and approver per transaction | Transaction ID, requester, approver |
| CM-01 | Unapproved production changes | Changes are approved before deployment | Compare approval and deployment timestamps | Change ID, approval timestamp, deployment timestamp |

## Test population and execution
Six deliberately constructed synthetic records, two per control objective. Each control has one expected exception and one expected non-exception. The demo executes transparent deterministic rules and records a traceable evidence ID, outcome, and rationale. This is **not** random sampling or evidence of a real-world population.

## Expected results
- EV-101: Review — privileged administrator lacks recorded approval.
- EV-102: No exception — approval recorded.
- EV-103: Review — requester and approver match.
- EV-104: No exception — requester and approver differ.
- EV-105: Review — production deployment timestamp precedes approval.
- EV-106: No exception — approval timestamp precedes deployment.

**Expected benchmark:** 6/6 rule outcomes match these predefined expectations. This is a fixture-level check, **not** an estimate of detection accuracy on unseen data.

## Workpaper standard
Every potential exception should contain: audit objective; risk statement; procedure; evidence ID and source fields; observed condition; rule rationale; possible impact; corroboration needed; proposed next steps; reviewer and management response fields. The demo exports a CSV of the selected evidence and rule outcomes; it does not represent signed-off audit evidence.

## Audit finding format
- **Criteria:** What policy or control is expected?
- **Condition:** What was observed and in which evidence record?
- **Cause:** Unknown until validated with process owners.
- **Effect/Risk:** What could occur if the exception is real?
- **Recommendation:** Verify the source, evaluate mitigating controls, and agree on corrective action.
- **Management response:** Not provided; fictional simulation.

## AI design boundary
The current live implementation uses rule-based testing and constrained narrative templates. It does **not** call a large language model. A future AI drafting service would receive only validated, non-sensitive structured fields and be prohibited from generating uncited evidence or autonomous audit opinions. A human auditor must approve findings.

## Limitations
Synthetic sample; no real ERP access, audit mandate, or control-owner interviews; no population completeness test; no validated remediation; no actual BNSF systems or data. The demo illustrates audit reasoning and documentation, not professional audit assurance.

## Relevance to an IT Audit Management Trainee
Maps to risk assessments, developing test procedures, analyzing and interpreting evidence, documenting logically supported conclusions, managing workpapers, and presenting written findings.