import { SwarmAgent } from '../../core/SwarmAgent.js';

const agent = new SwarmAgent('researcher');

async function analyzeMarket() {
  return {
    tokenPair: 'ETH/USDC',
    price: 3200,
    signal: 'PROVIDE_LIQUIDITY',
    confidence: 0.82,
    timestamp: Date.now()
  };
}

async function main() {
  await agent.init();

  const run = async () => {
    const analysis = await analyzeMarket();
    console.log('[researcher] analysis ready:', analysis.signal);
    await agent.send('strategist', 'MARKET_ANALYSIS', analysis);
  };

  // Wait 2s for all agents to start, then run every 30s
  setTimeout(async () => {
    await run();
    setInterval(run, 30_000);
  }, 2000);
}

main();
