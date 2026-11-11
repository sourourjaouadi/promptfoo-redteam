// Backwards-compatible entry point; both Node commands use the same suite.
const { main } = require('./promptfoo-advanced-v2');
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
