# FlyRank AI Training Portfolio

A structured public repository for Abdullah Ragab's FlyRank AI internship assignments, prototypes, documentation, and submission evidence.

## Tracks

### General AI Fluency

- Week 4 — Empty but Live
- Week 5 — Personal agent design, implementation, personal website, and portfolio shipping

### UI/UX Design

Research, personas, journey maps, information architecture, user flows, wireframes, iteration logs, and handoff documentation are documented in Notion and Figma.

## Capstone Project

### FlyRank Opportunity Intelligence Studio

A complete, professional, publicly accessible capstone web application that converts approved Google Search Console and Google Analytics 4 CSV exports into a transparent, prioritized content-opportunity report. 

**Live URL**: [https://flyrank.abud.fun](https://flyrank.abud.fun)  
**Source Code**: [general-ai-fluency/capstone/flyrank-opportunity-studio](general-ai-fluency/capstone/flyrank-opportunity-studio)

#### Features
- **Data input workflow**: Drag-and-drop CSV file uploads, Demo Data loading, and data validation (required columns, empty/malformed handling).
- **Analysis engine**: Joins GSC and GA4 at the landing-page level, processes blank GSC queries as anonymized demand signals, calculates transparent opportunity scores, and ranks pages by priority.
- **Dashboard & Explanations**: Summary metrics, data-quality warnings, ranked opportunity table, and detailed explainability sections for each score.
- **Report Formats**: Working downloads for JSON report, Markdown brief, and CSV opportunity table.
- **Privacy-First Behavior**: Fully client-side operation via browser. No database, no data transmission, and no data persistence. 
- **Synthetic Data Statement**: The public application uses and accepts only synthetic demonstration data.
- **Technology Stack**: Next.js, TypeScript, Tailwind CSS, Papa Parse.

## Featured Prototype

### FlyRank Opportunity Scout

A local-first Python agent that reads approved Google Search Console and GA4 exports, validates schemas, joins data at landing-page level, calculates transparent opportunity scores, and produces ranked JSON and Markdown reports.

[Open the prototype](general-ai-fluency/week-05/fl-07-opportunity-scout)

## Repository Structure

```text
general-ai-fluency/
  capstone/
    flyrank-opportunity-studio/
  week-04/
    empty-but-live/
  week-05/
    fl-06-personal-agent-design/
    fl-07-opportunity-scout/
    pf-04-personal-website/
ui-ux-design/
  README.md
docs/
  submission-links.md
  progress.md
```

## Confidentiality

This repository contains only public documentation and synthetic demonstration data. No confidential FlyRank or Flewd client data is committed. All demonstration data is strictly synthetic.

## Main Links

- Portfolio: https://abud.fun
- LinkedIn: https://www.linkedin.com/in/abudxali/
- GitHub profile: https://github.com/3bud-ZC
- Notion documentation: maintained per assignment and linked from `docs/submission-links.md`
