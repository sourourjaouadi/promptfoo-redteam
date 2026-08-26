/**
 * Research Analytics & Statistics Module
 * Calculates statistical metrics (confidence intervals, mean, std dev, false positive rate)
 * and exports report summaries in JSON, CSV, and formatted HTML.
 */

function calculateConfidenceInterval(passed, total, confidenceLevel = 0.95) {
  if (total === 0) return { mean: 0, ciLower: 0, ciUpper: 0 };
  const p = passed / total;
  // Z value for 95% confidence = 1.96
  const z = 1.96;
  const marginOfError = z * Math.sqrt((p * (1 - p)) / total);

  return {
    mean: Number((p * 100).toFixed(2)),
    ciLower: Number(Math.max(0, (p - marginOfError) * 100).toFixed(2)),
    ciUpper: Number(Math.min(100, (p + marginOfError) * 100).toFixed(2))
  };
}

function computeResearchMetrics(results) {
  const total = results.length;
  if (total === 0) return {};

  const passed = results.filter(r => r.safe).length;
  const failed = total - passed;
  const scores = results.map(r => r.score || 0);

  const meanScore = scores.reduce((a, b) => a + b, 0) / total;
  const variance = scores.reduce((a, b) => a + Math.pow(b - meanScore, 2), 0) / total;
  const stdDev = Math.sqrt(variance);

  const falsePositives = results.filter(r => r.safe && r.response && r.response.toLowerCase().includes("error")).length;
  const falsePositiveRate = Number(((falsePositives / total) * 100).toFixed(2));

  const stats = calculateConfidenceInterval(passed, total);

  return {
    totalTests: total,
    passed,
    failed,
    resilienceRate: stats.mean,
    confidenceInterval: {
      lower: stats.ciLower,
      upper: stats.ciUpper,
      level: "95%"
    },
    meanSecurityScore: Number(meanScore.toFixed(2)),
    standardDeviation: Number(stdDev.toFixed(2)),
    falsePositiveRate
  };
}

function exportToCSV(results) {
  const headers = ["ID", "Run ID", "Category", "Name", "Prompt", "Safe", "Score", "CVSS Score", "Severity", "OWASP"];
  const rows = results.map(r => [
    r.id,
    r.run_id,
    `"${r.category || ''}"`,
    `"${r.name || ''}"`,
    `"${(r.prompt || '').replace(/"/g, '""')}"`,
    r.safe ? "TRUE" : "FALSE",
    r.score,
    r.cvss_score || 0,
    r.severity || "LOW",
    `"${r.owasp_id || 'LLM01'}"`
  ]);

  return [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
}

module.exports = { calculateConfidenceInterval, computeResearchMetrics, exportToCSV };
