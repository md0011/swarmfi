import { SwarmAgent } from '../../core/SwarmAgent.js';

const agent = new SwarmAgent('strategist');

function buildStrategy(analysis) {
  return {
    action: analysis.signal,
    tokenIn: 'USDC',
    tokenOut: 'ETH',
    tickLower: -887220,
    tickUpper: 887220,
    amountIn: '1000000000',
    slippagePct: 0.5,
    analysisRef: analysis.timestamp
  };
}

async function main() {
  await agent.init();

  agent.on('MARKET_ANALYSIS', async (msg) => {
    const strategy = buildStrategy(msg.data);
    console.log('[strategist] strategy built:', strategy.action);
    await agent.send('riskguard', 'APPROVAL_REQUEST', {
      strategy,
      proposedBy: 'strategist.swarmfi.eth'
    });
  });
}

main();
