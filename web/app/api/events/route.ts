import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// POST — swarm pushes events here
export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = { ...body, id: Date.now(), receivedAt: new Date().toISOString() };
  await redis.lpush('swarmfi:events', JSON.stringify(event));
  await redis.ltrim('swarmfi:events', 0, 99); // keep last 100
  return NextResponse.json({ ok: true });
}

// GET — dashboard reads events
export async function GET() {
  const raw = await redis.lrange('swarmfi:events', 0, 49);
  const events = raw.map(e => typeof e === 'string' ? JSON.parse(e) : e);
  return NextResponse.json(events);
}
