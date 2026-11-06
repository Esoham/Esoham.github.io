# Esoham Abalo — Applied AI, QA & Business Systems Portfolio

**Live site:** https://esoham.github.io/  
**Printable resume:** https://esoham.github.io/resume.html  
**Contact:** Esoham@yahoo.com  
**GitHub profile:** https://github.com/Esoham

A responsive, dependency-free portfolio website designed to help recruiters and technical reviewers quickly understand my work in **applied AI, AI evaluation, software quality, manufacturing systems, and business process automation**.

## What the site highlights

1. **Flagship AI applications:** ChangeGuard MFG and Vanessa Voice AI, with real source-repository screenshots where available.
2. **Hands-on prototypes:** MerchantFlow, SentinelWatch, VerityFlow, FluxPilot, ResolveIQ, and AuditGuard AI.
3. **AI Generalist / evaluation work sample:** an annotated rubric-based exercise with explicitly fictional responses.
4. **Professional experience:** manufacturing ERP/inventory operations and software QA, plus a print-friendly resume and email contact route.

Every project points to either a demonstration, a case study, or directly inspectable source code. Independent prototypes and synthetic test data are labeled as such; production deployment and business impact are not assumed.

## Architecture

- [Homepage](index.html) — semantic HTML, responsive embedded CSS, contact links, and project visual previews; no external UI dependencies.
- [Printable resume](resume.html) — professional experience and selected technical projects with a print-to-PDF option.
- [Project case studies and demos](projects/)
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
