# FL-07 Build Log

## Iteration 1 — Narrow the job

Started from the FL-06 specification: identify and rank content opportunities from GSC and GA4 exports.

Cut from the first MVP:

- Direct BigQuery access
- Embedding models
- HDBSCAN clustering
- Automatic content edits
- Scheduled weekly runs
- External LLM calls
- Dashboard UI

Reason: the assignment rewards one reliable end-to-end loop more than a broad unfinished system.

## Iteration 2 — Define the file connection

Implemented two CSV inputs as the live file/data connection:

- GSC page/query export
- GA4 page-level export

Added schema validation before processing.

## Iteration 3 — Respect the data shape

The agent joins GSC and GA4 only on `landing_page`. Blank GSC queries are counted as anonymized rows.

## Iteration 4 — Transparent scoring

Added a weighted opportunity score using search demand, CTR gap, striking-distance ranking signal, engagement gap, and conversion signal.

## Iteration 5 — Action output

The agent writes a machine-readable JSON report, reviewer-readable Markdown brief, and terminal output.

## Current limitations

- Intent classification is deterministic keyword logic, not embeddings.
- Score weights need calibration on approved historical outcomes.
- GA4 JSON flattening is outside this narrow MVP.
- No direct publishing or mutation tools are allowed.
