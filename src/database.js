const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../data/results.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_tests INTEGER,
        passed INTEGER,
        failed INTEGER,
        success_rate REAL,
        duration_ms INTEGER,
        status TEXT
      )`, (err) => { if (err) reject(err); });

      db.run(`CREATE TABLE IF NOT EXISTS test_results (
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
      )`, (err) => { if (err) reject(err); else resolve(); });
    });
  });
}

function saveTestRun(data) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO test_runs (id, total_tests, passed, failed, success_rate, duration_ms, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.total, data.passed, data.failed, data.rate, data.duration, 'completed'],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
}

function saveTestResult(result) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO test_results (id, run_id, category, name, prompt, response, safe, score) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [result.id, result.run_id, result.category, result.name, result.prompt, result.response, result.safe ? 1 : 0, result.score],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
}

function getTestRuns(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM test_runs ORDER BY timestamp DESC LIMIT ?`, [limit],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  });
}

function getTestResults(runId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM test_results WHERE run_id = ? ORDER BY timestamp DESC`, [runId],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  });
}

function getMetrics() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as total_runs, AVG(success_rate) as avg_success_rate, AVG(duration_ms) as avg_duration, MAX(timestamp) as last_run FROM test_runs`,
      (err, row) => { if (err) reject(err); else resolve(row || {}); }
    );
  });
}

module.exports = { initDatabase, saveTestRun, saveTestResult, getTestRuns, getTestResults, getMetrics };
