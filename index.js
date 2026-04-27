import { SwarmAgent } from './packages/core/SwarmAgent.js';
import { storeData, readData } from './packages/core/storage.js';
import { askLLM } from './packages/core/compute.js';

// ── RESEARCHER ──────────────────────────────────────────────────────────
const researcher = new SwarmAgent('researcher');

async function analyzeMarket() {
  console.log('[researcher] calling 0G Compute for market analysis...');

  // Real AI inference via 0G Compute
  const raw = await askLLM(
    'You are a DeFi market analyst. Always respond with valid JSON only. No explanation.',
    `Analyze the ETH/USDC pair. Current price: $${2800 + Math.floor(Math.random()*400)}.
     Return JSON: { "signal": "PROVIDE_LIQUIDITY" or "SWAP", "confidence": 0.0-1.0, "reason": "short reason", "tickLower": number, "tickUpper": number }`
  );

  let analysis;
  try {
    // Strip markdown code fences if LLM adds them
    const clean = raw.replace(/```json|```/g, '').trim();
    analysis = JSON.parse(clean);
  } catch {
    // Fallback if LLM response isn't clean JSON
    analysis = { signal: 'PROVIDE_LIQUIDITY', confidence: 0.75, reason: raw.slice(0, 100), tickLower: -887220, tickUpper: 887220 };
  }

  analysis.tokenPair = 'ETH/USDC';
  analysis.timestamp = Date.now();

  // Store analysis on 0G Storage — decentralized shared memory
  const rootHash = await storeData('latest-analysis', analysis);
  analysis.rootHash = rootHash;

  return analysis;
}

// ── STRATEGIST ──────────────────────────────────────────────────────────
const strategist = new SwarmAgent('strategist');

strategist.on('MARKET_ANALYSIS', async (msg) => {
  console.log('[strategist] reading analysis from 0G Storage...');

  // Read from 0G Storage using the rootHash sent by researcher
  let analysis;
  try {
    analysis = await readData('latest-analysis');
  } catch {
    analysis = msg.data; // fallback to AXL payload
  }

  const strategy = {
    action:      analysis.signal,
    tokenIn:     'USDC',
    tokenOut:    'ETH',
    tickLower:   analysis.tickLower  || -887220,
    tickUpper:   analysis.tickUpper  || 887220,
    amountIn:    '1000000000',
    slippagePct: 0.5,
    confidence:  analysis.confidence,
    reason:      analysis.reason,
    analysisRef: analysis.rootHash
  };

  console.log('[strategist] strategy built:', strategy.action, '| confidence:', strategy.confidence);

  // Store strategy on 0G Storage too
  await storeData('latest-strategy', strategy);

  await strategist.send('riskguard', 'APPROVAL_REQUEST', {
    strategy,
    proposedBy: 'strategist.swarmfi.eth'
  });
});

// ── RISKGUARD ───────────────────────────────────────────────────────────
const riskguard = new SwarmAgent('riskguard');

riskguard.on('APPROVAL_REQUEST', async (msg) => {
  const { strategy } = msg.data;

  const slippageOk   = strategy.slippagePct <= 1.0;
  const amountOk     = BigInt(strategy.amountIn) <= BigInt('10000000000');
  const confidenceOk = strategy.confidence >= 0.6;
  const approved     = slippageOk && amountOk && confidenceOk;

  console.log(`[riskguard] slippage:${slippageOk} amount:${amountOk} confidence:${confidenceOk}`);
  console.log(`[riskguard] decision: ${approved ? '✓ APPROVED' : '✗ REJECTED'}`);

  await riskguard.send('executor', 'EXECUTION_DECISION', {
    approved,
    strategy,
    approvedBy: 'riskguard.swarmfi.eth',
    reason: { slippageOk, amountOk, confidenceOk }
  });
});

// ── EXECUTOR ────────────────────────────────────────────────────────────
const executor = new SwarmAgent('executor');

executor.on('EXECUTION_DECISION', async (msg) => {
  const { approved, strategy, approvedBy } = msg.data;

  if (!approved) {
    console.log('[executor] trade REJECTED ✗');
    return;
  }

  // TODO Day 3: real KeeperHub MCP call
  const txHash = `0xSIMULATED_${Date.now()}`;
  console.log(`[executor] EXECUTED ✓`);
  console.log(`  tx:         ${txHash}`);
  console.log(`  action:     ${strategy.action}`);
  console.log(`  confidence: ${strategy.confidence}`);
  console.log(`  reason:     ${strategy.reason}`);
  console.log(`  approvedBy: ${approvedBy}`);

  // Store execution log on 0G Storage
  await storeData('latest-execution', {
    txHash, strategy, approvedBy, executedAt: Date.now()
  });
});

// ── START ────────────────────────────────────────────────────────────────
async function main() {
  await researcher.init();
  await strategist.init();
  await riskguard.init();
  await executor.init();

  console.log('\n🚀 SwarmFi Day 2 — 0G Storage + Compute online\n');

  const run = async () => {
    try {
      const analysis = await analyzeMarket();
      console.log('[researcher] analysis ready:', analysis.signal, '| stored on 0G ✓');
      await researcher.send('strategist', 'MARKET_ANALYSIS', analysis);
    } catch (err) {
      console.error('[researcher] error:', err.message);
    }
  };

  setTimeout(async () => {
    await run();
    setInterval(run, 60_000); // every 60s (0G uploads cost tokens, so slower)
  }, 1000);
}

main();
