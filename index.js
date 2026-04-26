// Single process — all agents share memory and one AXL poller
import { SwarmAgent } from './packages/core/SwarmAgent.js';

// ── RESEARCHER ──────────────────────────────────────────
const researcher = new SwarmAgent('researcher');

async function analyzeMarket() {
  return {
    tokenPair: 'ETH/USDC',
    price: 3200,
    signal: 'PROVIDE_LIQUIDITY',
    confidence: 0.82,
    timestamp: Date.now()
  };
}

// ── STRATEGIST ──────────────────────────────────────────
const strategist = new SwarmAgent('strategist');

strategist.on('MARKET_ANALYSIS', async (msg) => {
  const strategy = {
    action: msg.data.signal,
    tokenIn: 'USDC',
    tokenOut: 'ETH',
    tickLower: -887220,
    tickUpper: 887220,
    amountIn: '1000000000',
    slippagePct: 0.5,
    analysisRef: msg.data.timestamp
  };
  console.log('[strategist] strategy built:', strategy.action);
  await strategist.send('riskguard', 'APPROVAL_REQUEST', { strategy, proposedBy: 'strategist.swarmfi.eth' });
});

// ── RISKGUARD ───────────────────────────────────────────
const riskguard = new SwarmAgent('riskguard');

riskguard.on('APPROVAL_REQUEST', async (msg) => {
  const { strategy } = msg.data;
  const approved = strategy.slippagePct <= 1.0 && BigInt(strategy.amountIn) <= BigInt('10000000000');
  console.log(`[riskguard] decision: ${approved ? '✓ APPROVED' : '✗ REJECTED'}`);
  await riskguard.send('executor', 'EXECUTION_DECISION', {
    approved,
    strategy,
    approvedBy: 'riskguard.swarmfi.eth'
  });
});

// ── EXECUTOR ────────────────────────────────────────────
const executor = new SwarmAgent('executor');

executor.on('EXECUTION_DECISION', async (msg) => {
  const { approved, strategy } = msg.data;
  if (!approved) {
    console.log('[executor] trade REJECTED ✗');
    return;
  }
  const txHash = `0xSIMULATED_${Date.now()}`;
  console.log(`[executor] EXECUTED ✓  tx: ${txHash}`);
});

// ── START ALL ───────────────────────────────────────────
async function main() {
  await researcher.init();
  await strategist.init();
  await riskguard.init();
  await executor.init();

  console.log('\n🚀 SwarmFi running — all 4 agents online\n');

  // Run once after 1s, then every 30s
  setTimeout(async () => {
    const analysis = await analyzeMarket();
    console.log('[researcher] analysis ready:', analysis.signal);
    await researcher.send('strategist', 'MARKET_ANALYSIS', analysis);
    setInterval(async () => {
      const a = await analyzeMarket();
      console.log('[researcher] analysis ready:', a.signal);
      await researcher.send('strategist', 'MARKET_ANALYSIS', a);
    }, 30_000);
  }, 1000);
}

main();
