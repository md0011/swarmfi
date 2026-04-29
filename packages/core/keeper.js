import dotenv from 'dotenv';
dotenv.config();

const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API_KEY;
const BASE = 'https://app.keeperhub.com';

async function kh(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${KEEPERHUB_API_KEY}`
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`KeeperHub ${res.status} ${path}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// Direct onchain execution — no workflow needed
export async function directTransfer(strategy) {
  console.log('[KeeperHub] direct onchain execution...');

  const exec = await kh('/api/execute/transfer', 'POST', {
    network:          'sepolia',
    recipientAddress: '0x1d12BeEF3d35Ab9bE630529723fF694f87CF4b2D',
    amount:           '0.001'
  });

  console.log(`[KeeperHub] submitted: ${JSON.stringify(exec).slice(0,150)}`);
  if (exec.status === 'failed') throw new Error('KeeperHub execution failed — wallet needs Sepolia ETH');

  // Poll for tx hash
  const execId = exec.id || exec.executionId;
  if (!execId) return exec;

  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const status = await kh(`/api/execute/status/${execId}`);
      console.log(`[KeeperHub] status: ${status.status} | tx: ${status.txHash || 'pending'}`);
      if (status.txHash) return status;
      if (status.status === 'failed') throw new Error(status.error);
    } catch (e) {
      // Try alternate status endpoint
      try {
        const status = await kh(`/api/executions/${execId}`);
        console.log(`[KeeperHub] status: ${status.status}`);
        if (status.txHash || status.status === 'completed') return status;
      } catch { /* ignore */ }
    }
  }
  return { ...exec, status: 'submitted' };
}

// Keep these exports so index.js doesn't break
export async function createTradeWorkflow(strategy) {
  return { id: 'skipped' };
}
export async function executeWorkflow(id) {
  return { status: 'skipped' };
}
