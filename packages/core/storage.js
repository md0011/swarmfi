import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL     = process.env.OG_RPC_URL;
const INDEXER_URL = process.env.OG_INDEXER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const network  = ethers.Network.from({ chainId: 16602, name: 'og-newton-testnet' });
const provider = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });
const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
const indexer  = new Indexer(INDEXER_URL);

const CACHE_FILE = './storage-cache.json';

function loadCache() {
  if (existsSync(CACHE_FILE)) return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  return {};
}
function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function storeData(key, data) {
  const jsonStr = JSON.stringify(data);
  const memData = new MemData(new TextEncoder().encode(jsonStr));
  console.log(`[0G Storage] uploading "${key}"...`);

  const [result, err] = await indexer.upload(memData, RPC_URL, signer);
  if (err) throw new Error(`0G upload failed: ${err}`);

  // Fix: extract rootHash string from result object
  const rootHash = result?.root || result?.rootHash || JSON.stringify(result);
  console.log(`[0G Storage] stored "${key}" → rootHash: ${rootHash}`);

  const cache = loadCache();
  cache[key]  = { rootHash, timestamp: Date.now() };
  saveCache(cache);
  return rootHash;
}

export async function readData(key) {
  const cache = loadCache();
  if (!cache[key]) { console.warn(`[0G Storage] key "${key}" not found`); return null; }

  const { rootHash } = cache[key];
  const outputPath   = `./tmp-${key}.json`;

  console.log(`[0G Storage] downloading "${key}"...`);
  const err = await indexer.download(rootHash, outputPath, false);
  if (err) throw new Error(`0G download failed: ${err}`);

  return JSON.parse(readFileSync(outputPath, 'utf8'));
}
