import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  const raw = await redis.lrange('swarmfi:events', 0, 99);
  const events = raw.map((e: any) => typeof e === 'string' ? JSON.parse(e) : e);

  const executions  = events.filter((e: any) => e.type === 'EXECUTED');
  const approved    = events.filter((e: any) => e.type === 'APPROVED');
  const rejected    = events.filter((e: any) => e.type === 'REJECTED');
  const analyses    = events.filter((e: any) => e.type === 'ANALYSIS');

  return NextResponse.json({
    totalExecutions: executions.length,
    totalApproved:   approved.length,
    totalRejected:   rejected.length,
    totalAnalyses:   analyses.length,
    lastExecution:   executions[0] || null,
    lastAnalysis:    analyses[0]   || null,
  });
}
