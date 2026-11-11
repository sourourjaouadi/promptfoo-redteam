const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/results.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || []));
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || {}));
  });
}
async function addColumnIfMissing(table, column, definition) {
  const columns = await all(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function initDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_tests INTEGER,
    passed INTEGER,
    failed INTEGER,
    success_rate REAL,
    duration_ms INTEGER,
    status TEXT
  )`);
  await run(`CREATE TABLE IF NOT EXISTS test_results (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    category TEXT,
    name TEXT,
    prompt TEXT,
    response TEXT,
    safe BOOLEAN,
    score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES test_runs(id)
  )`);
  await addColumnIfMissing('test_runs', 'inconclusive', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('test_runs', 'errors', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('test_runs', 'model_name', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_runs', 'system_prompt_hash', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_runs', 'suite_version', "INTEGER DEFAULT 1");
  await addColumnIfMissing('test_runs', 'judge_name', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'status', "TEXT DEFAULT 'inconclusive'");
  await addColumnIfMissing('test_results', 'reason', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'review_status', "TEXT DEFAULT 'needs_review'");
  await addColumnIfMissing('test_results', 'review_note', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'reviewed_at', 'DATETIME');
  await addColumnIfMissing('test_results', 'heuristic_status', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'judge_model', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'judge_verdict', "TEXT DEFAULT 'uncertain'");
  await addColumnIfMissing('test_results', 'judge_confidence', 'REAL');
  await addColumnIfMissing('test_results', 'evidence', "TEXT DEFAULT ''");
  await addColumnIfMissing('test_results', 'rationale', "TEXT DEFAULT ''");
}

async function saveTestRun(data) {
  await run(`INSERT INTO test_runs
    (id, total_tests, passed, failed, success_rate, duration_ms, status, inconclusive, errors,
     model_name, system_prompt_hash, suite_version, judge_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [data.id, data.total, data.passed, data.failed, data.rate, data.duration,
    data.status || 'completed', data.inconclusive || 0, data.errors || 0,
    data.modelName || '', data.systemPromptHash || '', data.suiteVersion || 1, data.judgeName || '']);
}
async function saveTestResult(result) {
  await run(`INSERT INTO test_results
    (id, run_id, category, name, prompt, response, safe, score, status, reason,
     review_status, review_note, heuristic_status, judge_model, judge_verdict,
     judge_confidence, evidence, rationale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'needs_review', '', ?, ?, ?, ?, ?, ?)`,
  [result.id, result.run_id, result.category, result.name, result.prompt, result.response,
    result.safe === null ? null : result.safe ? 1 : 0, result.score, result.status, result.reason,
    result.heuristicStatus || '', result.judgeModel || '', result.judgeVerdict || 'uncertain',
    result.judgeConfidence, result.evidence || '', result.rationale || '']);
}
async function saveResultReview(runId, resultId, reviewStatus, reviewNote) {
  const result = await run(`UPDATE test_results
    SET review_status = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE run_id = ? AND id = ?`, [reviewStatus, reviewNote, runId, resultId]);
  return result.changes;
}
function getTestRuns(limit = 10) {
  return all('SELECT * FROM test_runs ORDER BY timestamp DESC LIMIT ?', [limit]);
}
function getTestResults(runId) {
  return all('SELECT * FROM test_results WHERE run_id = ? ORDER BY timestamp DESC', [runId]);
}
function getMetrics() {
  return get(`SELECT COUNT(*) as total_runs, AVG(success_rate) as avg_success_rate,
    AVG(duration_ms) as avg_duration, MAX(timestamp) as last_run FROM test_runs`);
}

module.exports = {
  initDatabase, saveTestRun, saveTestResult, saveResultReview,
  getTestRuns, getTestResults, getMetrics
};
