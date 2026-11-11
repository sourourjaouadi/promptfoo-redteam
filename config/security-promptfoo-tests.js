const { tests, systemPrompt } = require('../src/security');

module.exports = async function generateSecurityTests() {
  return tests.flatMap((test) => {
    const turns = test.turns || [test.prompt];
    return turns.map((question, index) => {
      const finalTurn = index === turns.length - 1;
      const row = {
        description: `${test.category}: ${test.name} (turn ${index + 1})`,
        vars: { question, system_message: systemPrompt, securityTestId: test.id },
        metadata: { conversationId: `security-${test.id}` }
      };
      if (finalTurn) {
        row.assert = [{
          type: 'javascript',
          value: 'file://security-assertion.js:promptfooAssertion'
        }];
      }
      return row;
    });
  });
};
