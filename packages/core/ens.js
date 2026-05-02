import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { addEnsContracts } from '@ensdomains/ensjs';
import { getTextRecord, getAddressRecord } from '@ensdomains/ensjs/public';

const client = createPublicClient({
  chain: addEnsContracts(sepolia),
  transport: http('https://ethereum-sepolia-rpc.publicnode.com')
});

// Cache to avoid hitting ENS on every message
const trustCache = new Map();

export async function isAgentTrusted(agentName) {
  const ensName = `${agentName}.swarmfi-ai.eth`;

  // Check cache first (valid for 5 min)
  if (trustCache.has(agentName)) {
    const { result, timestamp } = trustCache.get(agentName);
    if (Date.now() - timestamp < 5 * 60 * 1000) return result;
  }

  try {
    console.log(`[ENS] verifying ${ensName}...`);

    const trusted = await getTextRecord(client, {
      name: ensName,
      key: 'swarmfi.trusted'
    });

    const result = trusted === 'true';
    trustCache.set(agentName, { result, timestamp: Date.now() });

    console.log(`[ENS] ${ensName} → trusted: ${result}`);
    return result;
  } catch (err) {
    console.warn(`[ENS] lookup failed for ${ensName}: ${err.message}`);
    // Fail open during hackathon (ENS might be slow)
    // Change to: return false; for strict mode
    return true;
  }
}

export async function getAgentRole(agentName) {
  try {
    const role = await getTextRecord(client, {
      name: `${agentName}.swarmfi-ai.eth`,
      key: 'swarmfi.role'
    });
    return role || agentName;
  } catch {
    return agentName;
  }
}
