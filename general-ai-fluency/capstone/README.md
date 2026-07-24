# FlyRank Opportunity Intelligence Studio

## Capstone

FlyRank Opportunity Intelligence Studio is an explainable, privacy-first content intelligence product built from the FL-07 Opportunity Scout prototype.

It converts Google Search Console and GA4 CSV exports into a ranked action brief that answers:

- Which page should be reviewed first?
- Why did it receive this priority?
- Which metrics support the recommendation?
- What action should a human consider next?

## Product implementation

The interactive application is integrated into the ABUD website codebase:

- Website repository: https://github.com/3bud-ZC/abud
- Feature branch: `feat/flyrank-opportunity-studio`
- Planned public route: `https://abud.fun/flyrank-opportunity-studio`

## Current capabilities

- Demo dataset that runs instantly
- GSC CSV upload and schema validation
- GA4 CSV upload and schema validation
- Landing-page-level joining
- Transparent weighted opportunity scoring
- Query-intent labels
- Explainability view for score components
- Human-review guardrails
- JSON, Markdown, and CSV report export
- Browser-local processing for the public demo

## Privacy and safety

- No confidential FlyRank or client data is committed to GitHub.
- The public demo uses synthetic data.
- The application does not edit, publish, delete, or redirect content.
- Every score and recommendation requires human review.
- Blank GSC queries remain included as anonymized demand signals.

## Capstone deliverables

- Live HTTPS application on the ABUD website
- Public training repository and documentation
- Portfolio case study
- Raw demo video
- Launch story and next-case maintenance note

## Status

The product implementation is in review before deployment to the production website.
