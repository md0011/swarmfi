import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const AXL_URL = 'http://127.0.0.1:9002';
const PEER_ID = readFileSync('./my-peer-id.txt', 'utf8').trim();

// Global registry of all agents — one poller serves all
const agentRegistry = {};
let pollerStarted = false;

function startGlobalPoller() {
  if (pollerStarted) return;
  pollerStarted = true;

  setInterval(async () => {
    try {
      const res = await fetch(`${AXL_URL}/recv`);
      if (!res.ok) return;
      const text = await res.text();
      if (!text || text === 'null' || text === '[]' || text === '') return;

      const raw = JSON.parse(text);
      const messages = Array.isArray(raw) ? raw : [raw];

      for (const msg of messages) {
        let envelope;
        try {
          envelope = typeof msg.payload === 'string'
            ? JSON.parse(msg.payload)
            : msg.payload || msg;
        } catch {
          envelope = msg;
        }

        if (!envelope.to || !envelope.type) continue;

        // Dispatch to the correct agent by name
        const targetAgent = agentRegistry[envelope.to];
        if (targetAgent) {
          console.log(`[${envelope.to}] ← ${envelope.from}: ${envelope.type}`);
          const handler = targetAgent.handlers[envelope.type];
          if (handler) handler(envelope);
          else console.warn(`[${envelope.to}] no handler for: ${envelope.type}`);
        }
      }
    } catch (err) {
      // ignore transient poll errors
    }
  }, 500); // poll every 500ms
}

export class SwarmAgent {
  constructor(name) {
    this.name = name;
    this.handlers = {};
    agentRegistry[name] = this; // register globally
    console.log(`[${this.name}] initialized | peer: ${PEER_ID.slice(0,16)}...`);
  }

  async send(targetAgent, type, data) {
    const envelope = {
      from: this.name,
      to: targetAgent,
      type,
      data,
      timestamp: Date.now()
    };

    const res = await fetch(`${AXL_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Destination-Peer-Id': PEER_ID
      },
      body: JSON.stringify(envelope)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[${this.name}] send failed: ${err}`);
    }
    console.log(`[${this.name}] → ${targetAgent}: ${type}`);
  }

  on(messageType, handler) {
    this.handlers[messageType] = handler;
    return this;
  }

  async init() {
    startGlobalPoller(); // safe to call multiple times
    console.log(`[${this.name}] online ✓`);
  }
}
