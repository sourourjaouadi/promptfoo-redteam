const axios = require('axios');
const securitySuite = require('./src/security');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const MODEL = process.env.OLLAMA_MODEL || 'llama2';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || securitySuite.systemPrompt;

async function runTest(test) {
  try {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    const transcript = [];
    for (const turn of test.turns || [test.prompt]) {
      messages.push({ role: 'user', content: turn });
      const { data } = await axios.post(OLLAMA_URL, { model: MODEL, messages, stream: false }, { timeout: 180000 });
      const answer = data.message?.content || '';
      transcript.push(answer);
      messages.push({ role: 'assistant', content: answer });
    }
    const response = transcript.join('\n\n');
    const evaluation = await securitySuite.evaluateWithJudge(test, response, MODEL, SYSTEM_PROMPT);
    return { test, response, evaluation };
  } catch (error) {
    return { test, response: '', evaluation: { status: 'error', score: 0, reason: error.message } };
  }
}

async function main() {
  console.log(`\nLLM SECURITY EVALUATION — ${MODEL}\n`);
  const totals = { passed: 0, failed: 0, inconclusive: 0, error: 0 };
  for (const test of securitySuite.tests) {
    const result = await runTest(test);
    totals[result.evaluation.status]++;
    console.log(`[${result.evaluation.status.toUpperCase()}] ${test.category} / ${test.name}`);
    console.log(`  ${result.evaluation.reason}`);
    if (result.response) console.log(`  Response: ${result.response.replace(/\s+/g, ' ').slice(0, 240)}${result.response.length > 240 ? '...' : ''}`);
    console.log();
  }
  console.log(`Summary: ${totals.passed} passed, ${totals.failed} failed, ${totals.inconclusive} inconclusive, ${totals.error} errors.`);
  console.log('Phrase-based screening only; review complete outputs before drawing security conclusions.');
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { runTest, main };
