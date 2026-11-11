const express = require('express');
const { v4: uuid } = require('uuid');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const {
  initDatabase, saveTestRun, saveTestResult, saveResultReview,
  getTestRuns, getTestResults, getMetrics
} = require('./database');
const securitySuite = require('./security');

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, '../src')));

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODEL = process.env.OLLAMA_MODEL || 'llama2';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || securitySuite.systemPrompt;

let runInProgress = false;
async function runTests() {
  if (runInProgress) {
    const error = new Error('A test run is already in progress.');
    error.statusCode = 409;
    throw error;
  }
  runInProgress = true;
  const runId = uuid();
  const started = Date.now();
  const results = [];
  let passed = 0, failed = 0, inconclusive = 0, errors = 0;
  try {
    for (const attack of securitySuite.tests) {
      const turns = attack.turns || [attack.prompt];
      const result = {
        id: uuid(), run_id: runId, category: attack.category, name: attack.name,
        prompt: turns.map((turn, index) => `Turn ${index + 1}: ${turn}`).join('\n'),
        response: '', safe: null, score: 0,
        status: 'error', reason: '', heuristicStatus: '', judgeModel: '',
        judgeVerdict: 'uncertain', judgeConfidence: null, evidence: '', rationale: ''
      };
      try {
        const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
        const transcript = [];
        for (const userMessage of turns) {
          messages.push({ role: 'user', content: userMessage });
          const response = await axios.post(OLLAMA_URL, {
            model: MODEL, messages, stream: false
          }, { timeout: 180000 });
          const answer = response.data.message?.content || '';
          transcript.push(`Assistant (turn ${transcript.length + 1}): ${answer}`);
          messages.push({ role: 'assistant', content: answer });
        }
        result.response = transcript.join('\n\n');
        Object.assign(result, await securitySuite.evaluateWithJudge(attack, result.response, MODEL, SYSTEM_PROMPT));
      } catch (error) {
        result.reason = `Ollama request failed: ${error.message}`;
      }
      if (result.status === 'passed') passed++;
      else if (result.status === 'failed') failed++;
      else if (result.status === 'inconclusive') inconclusive++;
      else errors++;
      results.push(result);
      await saveTestResult(result);
    }
    const duration = Date.now() - started;
    const determinate = passed + failed;
    await saveTestRun({
      id: runId, total: securitySuite.tests.length, passed, failed, inconclusive, errors,
      rate: determinate ? passed / determinate * 100 : 0, duration,
      status: errors ? 'partial' : 'completed', modelName: MODEL,
      judgeName: process.env.OLLAMA_JUDGE_MODEL || '',
      systemPromptHash: crypto.createHash('sha256').update(SYSTEM_PROMPT).digest('hex'),
      suiteVersion: securitySuite.version
    });
    return { runId, model: MODEL, judgeModel: process.env.OLLAMA_JUDGE_MODEL || '', total: securitySuite.tests.length, passed, failed, inconclusive, errors,
      successRate: determinate ? passed / determinate * 100 : 0, duration, results };
  } finally {
    runInProgress = false;
  }
}

app.post('/api/tests/run', async (_req, res) => {
  try {
    res.json({ status: 'success', data: await runTests() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
});
app.get('/api/tests/history', async (_req, res) => {
  try { res.json({ status: 'success', data: await getTestRuns() }); }
  catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});
app.get('/api/tests/:runId', async (req, res) => {
  try { res.json({ status: 'success', data: await getTestResults(req.params.runId) }); }
  catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});
app.patch('/api/tests/:runId/:resultId/review', async (req, res) => {
  const allowed = new Set(['needs_review', 'confirmed_issue', 'false_positive', 'acceptable', 'follow_up']);
  const { status, note = '' } = req.body || {};
  if (!allowed.has(status) || typeof note !== 'string' || note.length > 2000) {
    return res.status(400).json({ status: 'error', message: 'Choose a valid review status and keep the note under 2000 characters.' });
  }
  try {
    const changes = await saveResultReview(req.params.runId, req.params.resultId, status, note.trim());
    if (!changes) return res.status(404).json({ status: 'error', message: 'Test result not found.' });
    res.json({ status: 'success', data: { reviewStatus: status } });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});
app.get('/api/metrics', async (_req, res) => {
  try { res.json({ status: 'success', data: await getMetrics() }); }
  catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});
app.get('/dashboard', (_req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

async function startServer() {
  await initDatabase();
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, '127.0.0.1', () => console.log(`Dashboard: http://localhost:${port}/dashboard (model: ${MODEL})`));
}
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to initialize the database:', error.message);
    process.exitCode = 1;
  });
}
module.exports = app;
