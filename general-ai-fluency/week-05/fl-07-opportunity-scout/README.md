# FL-07 — FlyRank Opportunity Scout

A local-first Python agent that converts approved Google Search Console and GA4 CSV exports into a ranked content-opportunity brief.

## Core job

The agent reads two file-based data sources, joins them only on `landing_page`, calculates transparent opportunity scores, classifies query intent, and writes both JSON and Markdown outputs.

## Files

- `agent.py` — validation, aggregation, scoring, intent classification, and report generation
- `sample_data/gsc.csv` — synthetic GSC-shaped test input
- `sample_data/ga4.csv` — synthetic GA4-shaped test input
- `BUILD_LOG.md` — build decisions, cuts, and iteration record
- `RUN_CAPTURE.txt` — raw terminal output from the demonstration run

## Run

```bash
python agent.py --gsc sample_data/gsc.csv --ga4 sample_data/ga4.csv --output output
```

The agent creates:

- `output/opportunity_report.json`
- `output/opportunity_brief.md`

## Guardrails

- GSC and GA4 are never joined on query.
- Blank query rows are retained and labeled as anonymized demand.
- Missing required columns stop the run with a clear error.
- The agent only recommends actions; it never publishes or edits content.
- No real FlyRank or Flewd client data is included.
