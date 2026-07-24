"use client"

import { useState, useRef } from "react"
import { UploadCloud, FileSpreadsheet, Play, Download, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Info, Activity, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GscRow, Ga4Row, Report, Opportunity, validateCsvHeaders, parseCsv, buildReport } from "@/lib/analyzer"

const DEMO_GSC = `landing_page,query,impressions,clicks,position
/sleep/magnesium-bath,magnesium bath for sleep,1200,28,7.2
/sleep/magnesium-bath,best magnesium bath soak,900,15,8.1
/sleep/magnesium-bath,,300,4,7.8
/stress/relief,magnesium for stress,1500,75,4.8
/stress/relief,is magnesium safe for stress,600,18,6.4
/recovery/sore-muscles,magnesium soak for sore muscles,1000,20,11.2
/recovery/sore-muscles,epsom salt alternative,700,8,13.5
/products/magnesium-soak,buy magnesium bath soak,800,48,3.9
/products/magnesium-soak,magnesium bath soak price,500,35,4.3
/blog/magnesium-types,magnesium glycinate vs citrate,1800,22,9.7
/blog/magnesium-types,best magnesium type,1000,14,10.1`

const DEMO_GA4 = `landing_page,sessions,engaged_sessions,conversions
/sleep/magnesium-bath,310,118,7
/stress/relief,420,302,12
/recovery/sore-muscles,260,92,4
/products/magnesium-soak,340,255,28
/blog/magnesium-types,520,160,3`

export default function StudioPage() {
  const [gscFile, setGscFile] = useState<File | null>(null)
  const [ga4File, setGa4File] = useState<File | null>(null)
  const [gscError, setGscError] = useState<string | null>(null)
  const [ga4Error, setGa4Error] = useState<string | null>(null)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const gscInputRef = useRef<HTMLInputElement>(null)
  const ga4InputRef = useRef<HTMLInputElement>(null)

  const handleGscUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGscError(null)
    try {
      await validateCsvHeaders(file, ["landing_page", "query", "impressions", "clicks", "position"])
      setGscFile(file)
    } catch (err: any) {
      setGscError(err.message || "Invalid GSC File")
      setGscFile(null)
    }
  }

  const handleGa4Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGa4Error(null)
    try {
      await validateCsvHeaders(file, ["landing_page", "sessions", "engaged_sessions", "conversions"])
      setGa4File(file)
    } catch (err: any) {
      setGa4Error(err.message || "Invalid GA4 File")
      setGa4File(null)
    }
  }

  const loadDemoData = () => {
    const gscBlob = new Blob([DEMO_GSC], { type: "text/csv" })
    const ga4Blob = new Blob([DEMO_GA4], { type: "text/csv" })
    setGscFile(new File([gscBlob], "demo_gsc.csv", { type: "text/csv" }))
    setGa4File(new File([ga4Blob], "demo_ga4.csv", { type: "text/csv" }))
    setGscError(null)
    setGa4Error(null)
    setReport(null)
  }

  const runAnalysis = async () => {
    if (!gscFile || !ga4File) return
    setIsAnalyzing(true)
    try {
      const gscRows = await parseCsv<GscRow>(gscFile)
      const ga4Rows = await parseCsv<Ga4Row>(ga4File)
      const generatedReport = buildReport(gscRows, ga4Rows)
      setReport(generatedReport)
    } catch (err) {
      console.error(err)
      alert("An error occurred during analysis.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setGscFile(null)
    setGa4File(null)
    setReport(null)
    if (gscInputRef.current) gscInputRef.current.value = ""
    if (ga4InputRef.current) ga4InputRef.current.value = ""
  }

  const downloadJson = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "opportunity_report.json"
    a.click()
  }

  const downloadCsv = () => {
    if (!report) return
    let csv = "landing_page,opportunity_score,impressions,clicks,ctr,avg_position,sessions,engagement_rate,conversions,conversion_rate,recommended_action\\n"
    for (const row of report.all_pages) {
      csv += `${row.landing_page},${row.opportunity_score},${row.impressions},${row.clicks},${row.ctr},${row.avg_position},${row.sessions},${row.engagement_rate},${row.conversions},${row.conversion_rate},"${row.recommended_action}"\\n`
    }
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "opportunity_report.csv"
    a.click()
  }

  const downloadMarkdown = () => {
    if (!report) return
    let md = `# FlyRank Opportunity Scout — Ranked Brief\n\nPages analyzed: **${report.summary.pages_analyzed}**\n\n## Top Opportunities\n\n`
    report.top_opportunities.forEach((item, index) => {
      md += `### ${index + 1}. ${item.landing_page}\n- Opportunity score: **${item.opportunity_score} / 100**\n- Impressions / CTR / Position: ${item.impressions} / ${(item.ctr * 100).toFixed(2)}% / ${item.avg_position}\n- Engagement / conversions: ${(item.engagement_rate * 100).toFixed(2)}% / ${item.conversions}\n- Recommended action: ${item.recommended_action}\n- Anonymized query rows: ${item.anonymized_query_rows}\n\n`
    })
    md += "## Guardrail Notes\n\n- GSC and GA4 are joined only on `landing_page`.\n- Blank query values remain included as anonymized demand signals.\n- The agent recommends actions but never publishes or edits content.\n- Scores are prioritization aids and require human review before action.\n"
    
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "opportunity_brief.md"
    a.click()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-900">
            <Activity className="h-6 w-6 text-blue-600" />
            <span>FlyRank Studio</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <ShieldCheck className="h-4 w-4" /> Privacy-First Local Analysis
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        {!report ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2 border-dashed bg-slate-50 shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <UploadCloud className="mb-4 h-12 w-12 text-slate-400" />
                <h2 className="mb-2 text-2xl font-bold text-slate-700">Upload Your Exports</h2>
                <p className="mb-6 text-slate-500 max-w-lg">
                  Load your Google Search Console (Page level) and GA4 (Landing Page level) CSV exports to discover content opportunities. 
                  Your data is analyzed entirely in your browser and never sent to a server.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={loadDemoData}>
                    Load Demo Data
                  </Button>
                  <Button onClick={reset} variant="ghost" className="text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={gscFile ? "border-emerald-200 bg-emerald-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" /> 
                  1. Search Console Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={gscInputRef} 
                  onChange={handleGscUpload} 
                />
                {!gscFile ? (
                  <div className="flex flex-col items-center">
                    <Button onClick={() => gscInputRef.current?.click()} className="w-full">
                      Select GSC CSV
                    </Button>
                    {gscError && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>{gscError}</p>}
                    <p className="mt-4 text-xs text-slate-500 text-center">
                      Required columns: landing_page, query, impressions, clicks, position
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{gscFile.name}</p>
                        <p className="text-xs text-slate-500">{(gscFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setGscFile(null)}>Remove</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={ga4File ? "border-emerald-200 bg-emerald-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" /> 
                  2. Google Analytics 4 Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={ga4InputRef} 
                  onChange={handleGa4Upload} 
                />
                {!ga4File ? (
                  <div className="flex flex-col items-center">
                    <Button onClick={() => ga4InputRef.current?.click()} className="w-full" variant="secondary">
                      Select GA4 CSV
                    </Button>
                    {ga4Error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>{ga4Error}</p>}
                    <p className="mt-4 text-xs text-slate-500 text-center">
                      Required columns: landing_page, sessions, engaged_sessions, conversions
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ga4File.name}</p>
                        <p className="text-xs text-slate-500">{(ga4File.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setGa4File(null)}>Remove</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-2 flex justify-center mt-4">
              <Button 
                size="lg" 
                onClick={runAnalysis} 
                disabled={!gscFile || !ga4File || isAnalyzing}
                className="w-full max-w-md gap-2 text-lg"
              >
                {isAnalyzing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {isAnalyzing ? "Analyzing Data..." : "Run Opportunity Analysis"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadJson}>
                  <Download className="mr-2 h-4 w-4" /> JSON
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCsv}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                  <Download className="mr-2 h-4 w-4" /> Markdown Brief
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RefreshCw className="mr-2 h-4 w-4" /> New Analysis
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500">Pages Analyzed</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{report.summary.pages_analyzed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500">GSC Rows</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{report.summary.gsc_rows}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500">GA4 Rows</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{report.summary.ga4_rows}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-blue-700">Top Opportunities</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900">{report.top_opportunities.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ranked Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-3">Landing Page</th>
                        <th className="px-6 py-3">Score</th>
                        <th className="px-6 py-3">Traffic (Imp/Clk)</th>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.all_pages.map((row) => (
                        <React.Fragment key={row.landing_page}>
                          <tr className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 break-all">{row.landing_page}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 font-bold">
                                {row.opportunity_score}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {row.impressions.toLocaleString()} / {row.clicks.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{row.avg_position}</td>
                            <td className="px-6 py-4 text-slate-700">{row.recommended_action}</td>
                            <td className="px-6 py-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setExpandedRow(expandedRow === row.landing_page ? null : row.landing_page)}
                              >
                                {expandedRow === row.landing_page ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </td>
                          </tr>
                          {expandedRow === row.landing_page && (
                            <tr className="bg-slate-50 border-b">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1">
                                      <Info className="h-4 w-4 text-blue-500"/> Score Explainability
                                    </h4>
                                    <ul className="space-y-1 text-slate-600">
                                      <li>Demand Contribution: <span className="font-medium">{row.explainability.demand_contribution}</span></li>
                                      <li>CTR Gap Contribution: <span className="font-medium">{row.explainability.ctr_gap_contribution}</span></li>
                                      <li>Position Contribution: <span className="font-medium">{row.explainability.position_contribution}</span></li>
                                      <li>Engagement Contribution: <span className="font-medium">{row.explainability.engagement_gap_contribution}</span></li>
                                      <li>Business Contribution: <span className="font-medium">{row.explainability.business_contribution}</span></li>
                                    </ul>
                                    <p className="mt-2 text-xs text-slate-500 italic">Score prioritizes pages with high demand but weak engagement or CTR.</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">Top Queries</h4>
                                    {row.top_queries.length > 0 ? (
                                      <ul className="space-y-2">
                                        {row.top_queries.map((q, i) => (
                                          <li key={i} className="text-slate-600 flex justify-between bg-white px-3 py-2 border rounded-md text-xs">
                                            <span className="font-medium">{q.query}</span>
                                            <span className="flex gap-2">
                                              <span className="text-slate-400">{q.intent}</span>
                                              <span className="text-blue-600">{q.impressions} imp</span>
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-slate-500">No named queries recorded.</p>
                                    )}
                                    {row.anonymized_query_rows > 0 && (
                                      <p className="mt-2 text-xs text-slate-500">Includes {row.anonymized_query_rows} anonymized query rows.</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Human Review Required</p>
                <p>Scores are prioritization aids, not final business decisions. The agent recommends actions based on quantitative signals, but always review context before modifying content.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
