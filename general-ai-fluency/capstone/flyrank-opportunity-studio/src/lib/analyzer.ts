import Papa from "papaparse";

export type GscRow = {
  landing_page: string;
  query: string;
  impressions: string;
  clicks: string;
  position: string;
};

export type Ga4Row = {
  landing_page: string;
  sessions: string;
  engaged_sessions: string;
  conversions: string;
};

export type Opportunity = {
  landing_page: string;
  opportunity_score: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_position: number;
  sessions: number;
  engagement_rate: number;
  conversions: number;
  conversion_rate: number;
  recommended_action: string;
  top_queries: { query: string; intent: string; impressions: number }[];
  anonymized_query_rows: number;
  // Extras for explainability
  explainability: {
    demand_contribution: number;
    ctr_gap_contribution: number;
    position_contribution: number;
    engagement_gap_contribution: number;
    business_contribution: number;
  };
};

export type Report = {
  summary: {
    pages_analyzed: number;
    gsc_rows: number;
    ga4_rows: number;
    join_key: string;
    note: string;
  };
  top_opportunities: Opportunity[];
  all_pages: Opportunity[];
};

const REQUIRED_GSC = ["landing_page", "query", "impressions", "clicks", "position"];
const REQUIRED_GA4 = ["landing_page", "sessions", "engaged_sessions", "conversions"];

export function validateCsvHeaders(file: File, requiredHeaders: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        if (!results.meta.fields) {
          reject(new Error(`Failed to read headers for ${file.name}.`));
          return;
        }
        const fields = results.meta.fields;
        const missing = requiredHeaders.filter((h) => !fields.includes(h));
        if (missing.length > 0) {
          reject(new Error(`${file.name} is missing columns: ${missing.join(", ")}`));
        } else {
          resolve();
        }
      },
      error: (err) => reject(err),
    });
  });
}

export function parseCsv<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (err) => reject(err),
    });
  });
}

function toFloat(value: string | number | undefined | null, defaultValue = 0.0): number {
  if (value === undefined || value === null || value === "") return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function classifyIntent(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return "anonymized";
  if (["vs", "compare", "comparison", "best"].some((t) => q.includes(t))) return "comparison";
  if (["safe", "side effect", "risk", "danger"].some((t) => q.includes(t))) return "risk-safety";
  if (["alternative", "replacement", "instead of"].some((t) => q.includes(t))) return "replacement";
  if (["buy", "price", "shop", "order"].some((t) => q.includes(t))) return "transactional";
  if (["for sleep", "for stress", "for sore", "how to"].some((t) => q.includes(t))) return "use-case";
  return "discovery";
}

function normalize(value: number, ceiling: number): number {
  if (ceiling <= 0) return 0.0;
  return Math.min(Math.max(value / ceiling, 0.0), 1.0);
}

export function buildReport(gscRows: GscRow[], ga4Rows: Ga4Row[]): Report {
  const pages: Record<string, any> = {};

  const getBucket = (page: string) => {
    if (!pages[page]) {
      pages[page] = {
        impressions: 0,
        clicks: 0,
        weighted_position: 0,
        position_weight: 0,
        queries: [],
        blank_queries: 0,
        sessions: 0,
        engaged_sessions: 0,
        conversions: 0,
      };
    }
    return pages[page];
  };

  for (const row of gscRows) {
    const page = (row.landing_page || "").trim();
    if (!page) continue;
    const impressions = toFloat(row.impressions);
    const clicks = toFloat(row.clicks);
    const position = toFloat(row.position);
    const query = (row.query || "").trim();
    
    const bucket = getBucket(page);
    bucket.impressions += impressions;
    bucket.clicks += clicks;
    const wt = Math.max(impressions, 1.0);
    bucket.weighted_position += position * wt;
    bucket.position_weight += wt;
    
    if (query) {
      bucket.queries.push({ query, intent: classifyIntent(query), impressions });
    } else {
      bucket.blank_queries += 1;
    }
  }

  for (const row of ga4Rows) {
    const page = (row.landing_page || "").trim();
    if (!page) continue;
    
    // Only join on landing_page (no queries in GA4)
    const bucket = getBucket(page);
    bucket.sessions += toFloat(row.sessions);
    bucket.engaged_sessions += toFloat(row.engaged_sessions);
    bucket.conversions += toFloat(row.conversions);
  }

  let maxImpressions = 1.0;
  for (const p of Object.values(pages)) {
    if (p.impressions > maxImpressions) {
      maxImpressions = p.impressions;
    }
  }

  const results: Opportunity[] = [];

  for (const [page, data] of Object.entries(pages)) {
    const impressions = data.impressions;
    const clicks = data.clicks;
    const sessions = data.sessions;
    const ctr = impressions ? clicks / impressions : 0.0;
    const avg_position = data.position_weight ? data.weighted_position / data.position_weight : 0.0;
    const engagement_rate = sessions ? data.engaged_sessions / sessions : 0.0;
    const conversion_rate = sessions ? data.conversions / sessions : 0.0;

    const striking_distance = (avg_position >= 3 && avg_position <= 15) ? 1.0 : 0.25;
    const ctr_gap = Math.max(0.0, 0.05 - ctr) / 0.05;
    const engagement_gap = Math.max(0.0, 0.60 - engagement_rate) / 0.60;
    const demand = normalize(Math.log1p(impressions), Math.log1p(maxImpressions));
    const business_signal = Math.min(conversion_rate / 0.05, 1.0);

    const score = Math.round(100 * (
      0.35 * demand +
      0.25 * ctr_gap +
      0.20 * striking_distance +
      0.15 * engagement_gap +
      0.05 * business_signal
    ) * 10) / 10;

    let action = "Monitor and preserve performance";
    if (ctr_gap > 0.5 && striking_distance === 1.0) {
      action = "Rewrite title/meta and test intent alignment";
    } else if (engagement_gap > 0.4) {
      action = "Refresh page content to better match search intent";
    } else if (avg_position > 15) {
      action = "Strengthen topic coverage and internal linking";
    }

    const top_queries = [...data.queries]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 3);

    results.push({
      landing_page: page,
      opportunity_score: score,
      impressions: Math.round(impressions),
      clicks: Math.round(clicks),
      ctr: Math.round(ctr * 10000) / 10000,
      avg_position: Math.round(avg_position * 100) / 100,
      sessions: Math.round(sessions),
      engagement_rate: Math.round(engagement_rate * 10000) / 10000,
      conversions: Math.round(data.conversions),
      conversion_rate: Math.round(conversion_rate * 10000) / 10000,
      recommended_action: action,
      top_queries,
      anonymized_query_rows: data.blank_queries,
      explainability: {
        demand_contribution: Math.round((0.35 * demand * 100) * 10) / 10,
        ctr_gap_contribution: Math.round((0.25 * ctr_gap * 100) * 10) / 10,
        position_contribution: Math.round((0.20 * striking_distance * 100) * 10) / 10,
        engagement_gap_contribution: Math.round((0.15 * engagement_gap * 100) * 10) / 10,
        business_contribution: Math.round((0.05 * business_signal * 100) * 10) / 10,
      }
    });
  }

  results.sort((a, b) => b.opportunity_score - a.opportunity_score);

  return {
    summary: {
      pages_analyzed: results.length,
      gsc_rows: gscRows.length,
      ga4_rows: ga4Rows.length,
      join_key: "landing_page",
      note: "Blank GSC queries are treated as anonymized rows, not errors.",
    },
    top_opportunities: results.slice(0, 5),
    all_pages: results,
  };
}
