import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { addEnsContracts } from '@ensdomains/ensjs';
import { setTextRecord } from '@ensdomains/ensjs/wallet';
import dotenv from 'dotenv';
dotenv.config();

const chain   = addEnsContracts(sepolia);
const account = privateKeyToAccount(
  process.env.ENS_OWNER_KEY.startsWith('0x')
    ? process.env.ENS_OWNER_KEY
    : `0x${process.env.ENS_OWNER_KEY}`
);
const walletClient = createWalletClient({
  account, chain,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com')
});

console.log('Setting trust records for SwarmFi agents...\n');

const AGENTS = ['researcher', 'strategist', 'riskguard', 'executor'];

for (const name of AGENTS) {
  const ensName = `${name}.swarmfi-ai.eth`;
  console.log(`Setting records for ${ensName}...`);
  try {
    await setTextRecord(walletClient, {
      name: ensName,
      key:  'swarmfi.trusted',
      value: 'true',
    });
    console.log(`  ✓ swarmfi.trusted = true`);

    await setTextRecord(walletClient, {
      name: ensName,
      key:  'swarmfi.role',
      value: name,
    });
    console.log(`  ✓ swarmfi.role = ${name}\n`);
  } catch (err) {
    console.error(`  ✗ failed: ${err.message}\n`);
  }
}

console.log('Done! Trust records set on ENS Sepolia ✓');
