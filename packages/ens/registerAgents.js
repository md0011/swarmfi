import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { addEnsContracts } from '@ensdomains/ensjs';
import { createSubname, setTextRecord } from '@ensdomains/ensjs/wallet';
import dotenv from 'dotenv';
dotenv.config();

const chain     = addEnsContracts(sepolia);
const transport = http('https://ethereum-sepolia-rpc.publicnode.com');

// Fix: use privateKeyToAccount to properly create account
const privateKey = process.env.ENS_OWNER_KEY.startsWith('0x')
  ? process.env.ENS_OWNER_KEY
  : `0x${process.env.ENS_OWNER_KEY}`;

const account = privateKeyToAccount(privateKey);
console.log('Using wallet:', account.address);

const walletClient = createWalletClient({ account, chain, transport });

const PARENT = 'swarmfi-ai.eth';
const AGENTS = ['researcher', 'strategist', 'riskguard', 'executor'];

console.log('Registering SwarmFi agent identities on ENS Sepolia...\n');

for (const name of AGENTS) {
  console.log(`Registering ${name}.${PARENT}...`);
  try {
    await createSubname(walletClient, {
      name:            `${name}.${PARENT}`,
      owner:           account.address,
      resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
      contract:        'nameWrapper',
    });
    console.log(`  ✓ subname created`);

    await setTextRecord(walletClient, {
      name:  `${name}.${PARENT}`,
      key:   'swarmfi.trusted',
      value: 'true',
    });
    console.log(`  ✓ swarmfi.trusted = true`);

    await setTextRecord(walletClient, {
      name:  `${name}.${PARENT}`,
      key:   'swarmfi.role',
      value: name,
    });
    console.log(`  ✓ swarmfi.role = ${name}`);
    console.log(`  ✓ ${name}.${PARENT} done\n`);

  } catch (err) {
    console.error(`  ✗ ${name} failed: ${err.message}\n`);
  }
}

console.log('Done!');
