# SwarmFi 🤖

> 4 AI agents that trade DeFi autonomously — P2P comms, decentralized memory, no human needed.

**Live Dashboard:** https://swarmfi-ai.vercel.app  
**Demo Video:** [coming soon]  
**Built at:** ETHGlobal Open Agents 2026

---

## What is SwarmFi?

SwarmFi is a self-organizing multi-agent swarm that manages DeFi positions autonomously. Four specialized AI agents communicate peer-to-peer over Gensyn AXL, share memory via 0G Storage, verify each other's identity via ENS, and execute trades via KeeperHub — with no central server and no human in the loop.

```
Researcher → Strategist → Risk Guard → Executor
    ↓             ↓            ↓           ↓
0G Compute    0G Storage    ENS Trust   KeeperHub
```

---

## How It Works (Simple)

Imagine you have $1000 to invest in crypto. Normally you'd watch prices all day. SwarmFi does it automatically:

- **Researcher 🔍** — watches the market 24/7, runs AI analysis via 0G Compute
- **Strategist 🧠** — reads the analysis from 0G Storage, builds a trade strategy
- **Risk Guard 🛡️** — verifies the Strategist's ENS identity onchain, then checks if the trade is safe
- **Executor ⚡** — submits the approved trade via KeeperHub with real onchain execution

All 4 agents talk to each other over **Gensyn AXL** — a real P2P mesh. No central server. If one node goes down, the others keep running.

---

## Sponsor Integrations

### 🟢 Gensyn AXL
Every inter-agent message travels over a real AXL P2P node (`localhost:9002`). Researcher → Strategist → Risk Guard → Executor — each hop is a genuine P2P message, not a function call.

```javascript
// SwarmAgent.js — real AXL send
await fetch('http://127.0.0.1:9002/send', {
  headers: { 'X-Destination-Peer-Id': PEER_ID },
  body: JSON.stringify({ from: 'researcher', to: 'strategist', type: 'MARKET_ANALYSIS', data })
});
```

### 🟢 0G Storage
Shared decentralized memory between agents. Researcher uploads analysis, Strategist downloads and reads it — verified by root hash. 20+ confirmed onchain transactions on Newton testnet.

```javascript
// storage.js — real 0G Storage upload
const [tx, err] = await indexer.upload(memData, RPC_URL, signer);
// tx hash: 0x9ceb2af6c01defa81606...
```

**Sample transactions on 0G Newton testnet:**
- `0x9ceb2af6c01defa81606cba510a60d578ced7ea98708c4b8b88e2945049d7d3c`
- `0x4e60023bb1f96436e8998af3518bf9d0926b34510650ecdd3e627035d1628b74`
- `0x9f411d19966a0e71d1b826ffcdd6c5251e800826d643c7827454f6677c0b71c1`

### 🟢 ENS
Each agent has an identity under `swarmfi-ai.eth` on Sepolia. Risk Guard verifies the Strategist's ENS name onchain before accepting any approval request — **functional trust gating, not cosmetic**.

```
researcher.swarmfi-ai.eth  → swarmfi.trusted = true
strategist.swarmfi-ai.eth  → swarmfi.trusted = true
riskguard.swarmfi-ai.eth   → swarmfi.trusted = true
executor.swarmfi-ai.eth    → swarmfi.trusted = true
```

Rogue agents with no ENS name get rejected:
```
[ENS] verifying rogue.swarmfi-ai.eth → trusted: false
[riskguard] REJECTED — rogue.swarmfi-ai.eth not trusted
```

### 🟢 KeeperHub
Executor submits trades via KeeperHub's direct execution API. Real executions visible in KeeperHub Analytics dashboard (8+ runs, `status: completed`).

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Agent Mesh (Gensyn AXL)         │
│                                              │
│  Researcher ──AXL──► Strategist              │
│       │                   │                  │
│       │              AXL  │                  │
│       │                   ▼                  │
│       │             Risk Guard               │
│       │                   │                  │
│       │              AXL  │                  │
│       │                   ▼                  │
│       │              Executor                │
└───────┼───────────────────┼──────────────────┘
        │                   │
        ▼                   ▼
  ┌──────────┐       ┌──────────────┐
  │ 0G       │       │  KeeperHub   │
  │ Storage  │       │  Onchain     │
  │ Compute  │       │  Execution   │
  └──────────┘       └──────────────┘
        │
        ▼
  ┌──────────┐
  │ ENS      │
  │ Sepolia  │
  │ Identity │
  └──────────┘
        │
        ▼
  ┌──────────────────┐
  │  Live Dashboard  │
  │  (Vercel +       │
  │  Upstash Redis)  │
  └──────────────────┘
```

---

## Project Structure

```
swarmfi/
├── index.js                    # Main entry — runs all 4 agents
├── packages/
│   ├── core/
│   │   ├── SwarmAgent.js       # Base agent class (AXL messaging)
│   │   ├── storage.js          # 0G Storage integration
│   │   ├── compute.js          # 0G Compute / LLM inference
│   │   ├── keeper.js           # KeeperHub execution
│   │   ├── ens.js              # ENS trust verification
│   │   └── dashboard.js        # Pushes events to live dashboard
│   └── ens/
│       ├── registerAgents.js   # ENS subname registration script
│       └── setTrustRecords.js  # Sets trust text records on ENS
├── scripts/
│   └── rogueAgent.js           # Demo: proves ENS rejection works
└── web/                        # Next.js live dashboard
    └── app/
        ├── page.tsx            # Dashboard UI
        └── api/
            ├── events/route.ts # Receives swarm events
            └── stats/route.ts  # Aggregated stats
```

---

## Setup & Running

### Prerequisites
- Node.js v20+
- [Gensyn AXL](https://github.com/gensyn-ai/axl) built from source
- MetaMask wallet with 0G Newton testnet tokens ([faucet.0g.ai](https://faucet.0g.ai))
- Sepolia ETH for ENS ([sepoliafaucet.com](https://sepoliafaucet.com))

### 1. Clone and install

```bash
git clone https://github.com/md0011/swarmfi
cd swarmfi
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:
```env
PRIVATE_KEY=your_wallet_private_key
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
OG_API_KEY=
KEEPERHUB_API_KEY=
KEEPERHUB_MCP_KEY=
KEEPERHUB_WORKFLOW_ID=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ENS_OWNER_KEY=
RPC_URL=
DASHBOARD_URL=https://your-vercel-url.vercel.app
```

### 3. Build AXL node

```bash
# Install Go on Fedora
sudo dnf install golang make openssl git -y

# Clone and build
git clone https://github.com/gensyn-ai/axl
cd axl
make build
openssl genpkey -algorithm ed25519 -out private.pem
```

### 4. Start AXL node (Terminal 1)

```bash
cd /path/to/axl
./node -config node-config.json
```

Wait for:
```
Gensyn Node Started!
Listening on 127.0.0.1:9002
```

### 5. Start the dashboard (Terminal 2)

```bash
cd web
npm install
npm run dev
# Visit http://localhost:3000
```

### 6. Run the swarm (Terminal 3)

```bash
cd swarmfi
npm run dev
```

You should see:
```
🚀 SwarmFi — all systems online

[researcher]  analysis ready: PROVIDE_LIQUIDITY | stored on 0G ✓
[researcher]  → strategist: MARKET_ANALYSIS
[strategist]  ← researcher: MARKET_ANALYSIS
[strategist]  strategy built: PROVIDE_LIQUIDITY | confidence: 0.83
[ENS]         strategist.swarmfi-ai.eth → trusted: true
[riskguard]   ENS trust verified ✓
[riskguard]   decision: ✓ APPROVED
[KeeperHub]   submitted: {"status":"completed"}
[executor]    EXECUTED via KeeperHub ✓
```

### 7. Demo: ENS rejection of rogue agent

```bash
node scripts/rogueAgent.js
# Watch riskguard reject it:
# [ENS] rogue.swarmfi-ai.eth → trusted: false
# [riskguard] REJECTED — ENS trust check failed
```

---

## Live Dashboard

The dashboard at `https://swarmfi.vercel.app` shows:
- Real-time event feed from all 4 agents
- Stats: analyses, approvals, rejections, executions
- Agent swarm map with ENS identities
- AXL message flow visualization

Events are stored in Upstash Redis and polled every 3 seconds.

---

## ENS Names (Sepolia)

| Agent | ENS Name | Role |
|---|---|---|
| Researcher | `researcher.swarmfi-ai.eth` | Market analysis |
| Strategist | `strategist.swarmfi-ai.eth` | Strategy building |
| Risk Guard | `riskguard.swarmfi-ai.eth` | Trust verification |
| Executor | `executor.swarmfi-ai.eth` | Trade execution |

---

## Tech Stack

| Layer | Technology |
|---|---|
| P2P Agent Communication | Gensyn AXL |
| Decentralized Memory | 0G Storage (Newton testnet) |
| AI Inference | 0G Compute / Claude API fallback |
| Agent Identity | ENS (Sepolia testnet) |
| Trade Execution | KeeperHub direct transfer API |
| Frontend | Next.js + Tailwind + Upstash Redis |
| Deployment | Vercel |

---

## Which Protocol Features Were Used

### 0G Storage
- `Indexer.upload()` — uploads JSON blobs (market analysis, strategies, execution logs)
- `Indexer.download()` — downloads by root hash for cross-agent memory sharing
- All data stored on Newton testnet with real onchain transactions

### 0G Compute
- Direct REST inference endpoint
- Model: `qwen3:6b-plus` (with Claude API fallback)
- Used for market signal generation and risk scoring

### Gensyn AXL
- Single P2P node on port 9002
- `POST /send` with `X-Destination-Peer-Id` header for routing
- `GET /recv` polled every 500ms by global dispatcher
- All 4 agents share one AXL node, differentiated by message envelope `to` field

### ENS
- Subnames under `swarmfi-ai.eth` on Sepolia
- Text records: `swarmfi.trusted = true` and `swarmfi.role = <agent>`
- Risk Guard calls `getTextRecord()` before processing any approval request
- Rogue agents without ENS trust records are rejected

### KeeperHub
- `POST /api/execute/transfer` — direct onchain execution
- Authenticated via Bearer token
- Execution results visible in KeeperHub Analytics dashboard

---

## Team

**Mayur Dev**
- Telegram: @eyepatch_oO
- Discord: @the_copyninja
---

## License

MIT