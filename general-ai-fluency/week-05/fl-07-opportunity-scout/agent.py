from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any


REQUIRED_GSC = {"landing_page", "query", "impressions", "clicks", "position"}
REQUIRED_GA4 = {"landing_page", "sessions", "engaged_sessions", "conversions"}


def read_csv(path: Path, required: set[str]) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing input file: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = set(reader.fieldnames or [])
        missing = required - fields
        if missing:
            raise ValueError(f"{path.name} is missing columns: {', '.join(sorted(missing))}")
        return list(reader)


def to_float(value: str, *, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def classify_intent(query: str) -> str:
    q = query.strip().lower()
    if not q:
        return "anonymized"
    if any(token in q for token in ("vs", "compare", "comparison", "best")):
        return "comparison"
    if any(token in q for token in ("safe", "side effect", "risk", "danger")):
        return "risk-safety"
    if any(token in q for token in ("alternative", "replacement", "instead of")):
        return "replacement"
    if any(token in q for token in ("buy", "price", "shop", "order")):
        return "transactional"
    if any(token in q for token in ("for sleep", "for stress", "for sore", "how to")):
        return "use-case"
    return "discovery"


def normalize(value: float, ceiling: float) -> float:
    if ceiling <= 0:
        return 0.0
    return min(max(value / ceiling, 0.0), 1.0)


def build_report(gsc_rows: list[dict[str, str]], ga4_rows: list[dict[str, str]]) -> dict[str, Any]:
    pages: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "impressions": 0.0,
        "clicks": 0.0,
        "weighted_position": 0.0,
        "position_weight": 0.0,
        "queries": [],
        "blank_queries": 0,
        "sessions": 0.0,
        "engaged_sessions": 0.0,
        "conversions": 0.0,
    })

    for row in gsc_rows:
        page = row["landing_page"].strip()
        if not page:
            continue
        impressions = to_float(row["impressions"])
        clicks = to_float(row["clicks"])
        position = to_float(row["position"])
        query = row["query"].strip()
        bucket = pages[page]
        bucket["impressions"] += impressions
        bucket["clicks"] += clicks
        bucket["weighted_position"] += position * max(impressions, 1.0)
        bucket["position_weight"] += max(impressions, 1.0)
        if query:
            bucket["queries"].append({"query": query, "intent": classify_intent(query), "impressions": impressions})
        else:
            bucket["blank_queries"] += 1

    for row in ga4_rows:
        page = row["landing_page"].strip()
        if not page:
            continue
        bucket = pages[page]
        bucket["sessions"] += to_float(row["sessions"])
        bucket["engaged_sessions"] += to_float(row["engaged_sessions"])
        bucket["conversions"] += to_float(row["conversions"])

    max_impressions = max((p["impressions"] for p in pages.values()), default=1.0)
    results: list[dict[str, Any]] = []

    for page, data in pages.items():
        impressions = data["impressions"]
        clicks = data["clicks"]
        sessions = data["sessions"]
        ctr = clicks / impressions if impressions else 0.0
        avg_position = data["weighted_position"] / data["position_weight"] if data["position_weight"] else 0.0
        engagement_rate = data["engaged_sessions"] / sessions if sessions else 0.0
        conversion_rate = data["conversions"] / sessions if sessions else 0.0

        striking_distance = 1.0 if 3 <= avg_position <= 15 else 0.25
        ctr_gap = max(0.0, 0.05 - ctr) / 0.05
        engagement_gap = max(0.0, 0.60 - engagement_rate) / 0.60
        demand = normalize(math.log1p(impressions), math.log1p(max_impressions))
        business_signal = min(conversion_rate / 0.05, 1.0)

        score = round(100 * (
            0.35 * demand
            + 0.25 * ctr_gap
            + 0.20 * striking_distance
            + 0.15 * engagement_gap
            + 0.05 * business_signal
        ), 1)

        if ctr_gap > 0.5 and striking_distance == 1.0:
            action = "Rewrite title/meta and test intent alignment"
        elif engagement_gap > 0.4:
            action = "Refresh page content to better match search intent"
        elif avg_position > 15:
            action = "Strengthen topic coverage and internal linking"
        else:
            action = "Monitor and preserve performance"

        top_queries = sorted(data["queries"], key=lambda item: item["impressions"], reverse=True)[:3]
        results.append({
            "landing_page": page,
            "opportunity_score": score,
            "impressions": round(impressions),
            "clicks": round(clicks),
            "ctr": round(ctr, 4),
            "avg_position": round(avg_position, 2),
            "sessions": round(sessions),
            "engagement_rate": round(engagement_rate, 4),
            "conversions": round(data["conversions"]),
            "conversion_rate": round(conversion_rate, 4),
            "recommended_action": action,
            "top_queries": top_queries,
            "anonymized_query_rows": data["blank_queries"],
        })

    results.sort(key=lambda item: item["opportunity_score"], reverse=True)
    return {
        "summary": {
            "pages_analyzed": len(results),
            "gsc_rows": len(gsc_rows),
            "ga4_rows": len(ga4_rows),
            "join_key": "landing_page",
            "note": "Blank GSC queries are treated as anonymized rows, not errors.",
        },
        "top_opportunities": results[:5],
        "all_pages": results,
    }


def write_outputs(report: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "opportunity_report.json"
    md_path = output_dir / "opportunity_brief.md"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# FlyRank Opportunity Scout — Ranked Brief",
        "",
        f"Pages analyzed: **{report['summary']['pages_analyzed']}**",
        "",
        "## Top Opportunities",
        "",
    ]
    for index, item in enumerate(report["top_opportunities"], start=1):
        lines.extend([
            f"### {index}. {item['landing_page']}",
            f"- Opportunity score: **{item['opportunity_score']} / 100**",
            f"- Impressions / CTR / Position: {item['impressions']} / {item['ctr']:.2%} / {item['avg_position']}",
            f"- Engagement / conversions: {item['engagement_rate']:.2%} / {item['conversions']}",
            f"- Recommended action: {item['recommended_action']}",
            f"- Anonymized query rows: {item['anonymized_query_rows']}",
            "",
        ])
    lines.extend([
        "## Guardrail Notes",
        "",
        "- GSC and GA4 are joined only on `landing_page`.",
        "- Blank query values remain included as anonymized demand signals.",
        "- The agent recommends actions but never publishes or edits content.",
        "- Scores are prioritization aids and require human review before action.",
    ])
    md_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Rank search-content opportunities from GSC and GA4 CSV exports.")
    parser.add_argument("--gsc", type=Path, required=True, help="GSC CSV export")
    parser.add_argument("--ga4", type=Path, required=True, help="GA4 page-level CSV export")
    parser.add_argument("--output", type=Path, default=Path("output"), help="Output directory")
    args = parser.parse_args()

    gsc_rows = read_csv(args.gsc, REQUIRED_GSC)
    ga4_rows = read_csv(args.ga4, REQUIRED_GA4)
    report = build_report(gsc_rows, ga4_rows)
    write_outputs(report, args.output)

    print("FlyRank Opportunity Scout completed successfully")
    print(f"Pages analyzed: {report['summary']['pages_analyzed']}")
    for index, item in enumerate(report["top_opportunities"], start=1):
        print(f"{index}. {item['landing_page']} — {item['opportunity_score']}/100 — {item['recommended_action']}")
    print(f"Outputs written to: {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
