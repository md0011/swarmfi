import dotenv from 'dotenv';
dotenv.config();

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000';

export async function pushEvent(agent, type, data = {}) {
  try {
    await fetch(`${DASHBOARD_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, type, data })
    });
  } catch {
    // silent fail — dashboard is optional
  }
}
