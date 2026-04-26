import { SwarmAgent } from '../../core/SwarmAgent.js';

const agent = new SwarmAgent('riskguard');

function evaluateRisk(strategy) {
  const slippageOk = strategy.slippagePct <= 1.0;
  const amountOk = BigInt(strategy.amountIn) <= BigInt('10000000000');
  return {
    approved: slippageOk && amountOk,
    slippageOk,
    amountOk
  };
}

async function main() {
  await agent.init();

  agent.on('APPROVAL_REQUEST', async (msg) => {
    const { strategy } = msg.data;
    const decision = evaluateRisk(strategy);
    console.log(`[riskguard] decision: ${decision.approved ? '✓ APPROVED' : '✗ REJECTED'}`);
    await agent.send('executor', 'EXECUTION_DECISION', {
      approved: decision.approved,
      strategy,
      approvedBy: 'riskguard.swarmfi.eth',
      reason: decision
    });
  });
}

main();
