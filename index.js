import { SwarmAgent } from './packages/core/SwarmAgent.js';
import { storeData, readData } from './packages/core/storage.js';
import { askLLM } from './packages/core/compute.js';
import { directTransfer } from './packages/core/keeper.js';
import { pushEvent } from './packages/core/dashboard.js';

// ── RESEARCHER ──────────────────────────────────────────────────────────
const researcher = new SwarmAgent('researcher');

async function analyzeMarket() {
  console.log('[researcher] calling inference for market analysis...');

  const raw = await askLLM(
    'You are a DeFi market analyst. Always respond with valid JSON only. No explanation.',
    `Analyze the ETH/USDC pair. Current price: $${2800 + Math.floor(Math.random()*400)}.
     Return JSON: { "signal": "PROVIDE_LIQUIDITY" or "SWAP", "confidence": 0.0-1.0, "reason": "short reason", "tickLower": number, "tickUpper": number }`
  );

  let analysis;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    analysis = JSON.parse(clean);
  } catch {
    analysis = {
      signal: 'PROVIDE_LIQUIDITY',
      confidence: 0.75,
      reason: raw.slice(0, 100),
      tickLower: -887220,
      tickUpper: 887220
    };
  }

  analysis.tokenPair = 'ETH/USDC';
  analysis.timestamp = Date.now();

  const rootHash = await storeData('latest-analysis', analysis);
  analysis.rootHash = rootHash;

  // Push to dashboard
  await pushEvent('researcher', 'ANALYSIS', {
    signal: analysis.signal,
    confidence: analysis.confidence,
    reason: analysis.reason,
    rootHash
  });

  return analysis;
}

// ── STRATEGIST ──────────────────────────────────────────────────────────
const strategist = new SwarmAgent('strategist');

strategist.on('MARKET_ANALYSIS', async (msg) => {
  console.log('[strategist] reading analysis from 0G Storage...');

  let analysis;
  try {
    analysis = await readData('latest-analysis');
  } catch {
    analysis = msg.data;
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

  await storeData('latest-strategy', strategy);

  await pushEvent('strategist', 'STRATEGY', {
    action: strategy.action,
    confidence: strategy.confidence,
    tokenIn: strategy.tokenIn,
    tokenOut: strategy.tokenOut,
  });

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

  await pushEvent('riskguard', approved ? 'APPROVED' : 'REJECTED', {
    approved,
    slippageOk,
    amountOk,
    confidenceOk,
    strategy: strategy.action
  });

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

  let result;
  try {
    result = await directTransfer(strategy);
    console.log('[executor] EXECUTED via KeeperHub ✓');
  } catch (err) {
    console.warn('[executor] KeeperHub failed:', err.message);
    result = { txHash: `0xSIMULATED_${Date.now()}`, status: 'simulated' };
    console.log('[executor] EXECUTED via simulation ✓');
  }

  const txHash = result.txHash || result.executionId || `0xUNKNOWN_${Date.now()}`;

  console.log(`  tx:         ${txHash}`);
  console.log(`  action:     ${strategy.action}`);
  console.log(`  confidence: ${strategy.confidence}`);
  console.log(`  approvedBy: ${approvedBy}`);

  await pushEvent('executor', 'EXECUTED', {
    txHash,
    action:     strategy.action,
    confidence: strategy.confidence,
    approvedBy,
    via: result.status || 'keeperhub'
  });

  await storeData('latest-execution', {
    txHash, strategy, approvedBy, executedAt: Date.now(), via: result.status
  });
});

// ── START ────────────────────────────────────────────────────────────────
async function main() {
  await researcher.init();
  await strategist.init();
  await riskguard.init();
  await executor.init();

  console.log('\n🚀 SwarmFi — all systems online\n');

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
    setInterval(run, 60_000);
  }, 1000);
}

main();
