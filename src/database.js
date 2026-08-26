const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../data/results.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Test Runs table
      db.run(`CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_tests INTEGER,
        passed INTEGER,
        failed INTEGER,
        success_rate REAL,
        duration_ms INTEGER,
        status TEXT,
        model_id TEXT DEFAULT 'llama2',
        cvss_avg REAL DEFAULT 0.0
      )`, (err) => { if (err) reject(err); });

      // Detailed Test Results table
      db.run(`CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        category TEXT,
        name TEXT,
        prompt TEXT,
        response TEXT,
        safe BOOLEAN,
        score INTEGER,
        cvss_score REAL DEFAULT 0.0,
        severity TEXT DEFAULT 'LOW',
        cvss_vector TEXT,
        owasp_id TEXT,
        nist_ref TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES test_runs(id)
      )`, (err) => { if (err) reject(err); });

      // Security Audit Trail table
      db.run(`CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        action TEXT,
        details TEXT,
        ip_address TEXT
      )`, (err) => { if (err) reject(err); });

      // Vulnerabilities & CVE Tracking table
      db.run(`CREATE TABLE IF NOT EXISTS vulnerabilities (
        id TEXT PRIMARY KEY,
        cve_id TEXT,
        title TEXT,
        category TEXT,
        severity TEXT,
        cvss_score REAL,
        description TEXT,
        reproduction_steps TEXT,
        status TEXT DEFAULT 'OPEN'
      )`, (err) => { if (err) reject(err); });

      // Model Cards table
      db.run(`CREATE TABLE IF NOT EXISTS model_cards (
        model_id TEXT PRIMARY KEY,
        model_name TEXT,
        provider TEXT,
        safety_score REAL,
        total_evaluations INTEGER,
        last_tested DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => { if (err) reject(err); else resolve(); });
    });
  });
}

function saveTestRun(data) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO test_runs (id, total_tests, passed, failed, success_rate, duration_ms, status, model_id, cvss_avg) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.total, data.passed, data.failed, data.rate, data.duration, 'completed', data.modelId || 'llama2', data.cvssAvg || 0.0],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
}

function saveTestResult(result) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO test_results (id, run_id, category, name, prompt, response, safe, score, cvss_score, severity, cvss_vector, owasp_id, nist_ref) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id, 
        result.run_id, 
        result.category, 
        result.name, 
        result.prompt, 
        result.response, 
        result.safe ? 1 : 0, 
        result.score,
        result.cvss_score || 0.0,
        result.severity || 'LOW',
        result.cvss_vector || '',
        result.owasp_id || 'LLM01',
        result.nist_ref || ''
      ],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
}

function logAudit(userId, action, details, ipAddress = '127.0.0.1') {
  const { v4: uuid } = require('uuid');
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO audit_log (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [uuid(), userId, action, JSON.stringify(details), ipAddress],
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

function getAuditLogs(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`, [limit],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  });
}

function getMetrics() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as total_runs, AVG(success_rate) as avg_success_rate, AVG(duration_ms) as avg_duration, AVG(cvss_avg) as avg_cvss_score, MAX(timestamp) as last_run FROM test_runs`,
      (err, row) => { if (err) reject(err); else resolve(row || {}); }
    );
  });
}

module.exports = { 
  initDatabase, 
  saveTestRun, 
  saveTestResult, 
  logAudit, 
  getTestRuns, 
  getTestResults, 
  getAuditLogs, 
  getMetrics 
};
