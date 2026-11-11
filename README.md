# Esoham Abalo — Software QA, ERP & Business Systems Portfolio

**Live site:** https://esoham.github.io/  
**Printable resume:** https://esoham.github.io/resume.html  
**Contact:** Esoham@yahoo.com  
**GitHub profile:** https://github.com/Esoham

A responsive, dependency-free portfolio website designed to help recruiters and technical reviewers quickly navigate **software QA, Infor ERP / manufacturing systems, project delivery, product operations, applied AI, and security labs**.

## Recruiter review paths

1. **[Software QA](qa.html)** — professional testing background, CommerceQA / FarmFresh browser and API tests, Playwright exercise, test strategy, verification evidence, and a transparent risk matrix.
2. **[Manufacturing ERP / business systems](projects/meridian-erp.html)** — an end-to-end independent manufacturing workflow, material reconciliation context, revision-controlled BOMs, work orders, quality holds, audit trail and test links.
3. **[Project & product operations](https://github.com/Esoham/merchantflow/blob/main/docs/PRD.md)** — MerchantFlow product requirements, prioritization, acceptance criteria, roadmap, interactive prototype, and implementation details.
4. **[Applied AI](projects/changeguard.html)** — human-reviewed change impact checking, evaluation examples and declared limitations.
5. **[Printable resume](resume.html)** — current employment at Low Temp Industries, previous software QA experience at Pitney Bowes, tools, education and selected independent projects.

The site also includes ApartmentFinder, SentinelWatch, Vanessa Voice AI, VerityFlow, FluxPilot, ResolveIQ and AuditGuard. Independent prototypes and synthetic data are clearly labeled; professional employment and project work are not conflated.

## Architecture

- [Homepage](index.html) — recruiter pathways by role, four selected project case-study cards, accessible navigation and responsive layout; no external UI dependencies.
- [Software QA evidence](qa.html) — documented testing approach, code and verification pointers.
- [Meridian ERP case study](projects/meridian-erp.html) — practical workflow and limitations for business systems reviewers.
- [Printable resume](resume.html) — professional experience and selected technical projects with a print-to-PDF option.
- [Project case studies and demos](projects/)
- [ApartmentFinder renter search](projects/apartmentfinder/) — sample affordability comparison **plus an optional RentCast provider listing feed**. The source's synthetic demo cards remain separate, and the authorized feed shows no provider listings until a private API key has been configured. See [integration setup](projects/apartmentfinder/RENTAL_DATA_SETUP.md).
- [Local SVG preview assets](assets/)
- [Project tests workflow](.github/workflows/product-tests.yml)
- [AI evaluation work sample](https://github.com/Esoham/Esoham/blob/main/AI_EVALUATION_WORK_SAMPLE.md)
- [AI Generalist evidence map](https://github.com/Esoham/Esoham/blob/main/AI_GENERALIST_EVIDENCE.md)

## Editing / deployment

Edit `index.html` and the relevant files in `projects/`, then commit to the `main` branch. GitHub Pages must be configured to publish from `main` at the repository root or another supported workflow. Deployment settings and the public publishing status should be checked in GitHub's **Settings → Pages**; a source commit alone does not guarantee that the live site updated.

## Quality guidelines

- Maintain working links to project source, test evidence, and demonstrations.
- Keep layouts keyboard-accessible and responsive across device sizes.
- Distinguish prototypes, synthetic evaluation results, and real work experience.
- Never publish credentials, customer records, unredacted logs, or other private information.
- Verify demos and update documented limitations before changing outcome claims.
