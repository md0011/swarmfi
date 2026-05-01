'use client';
import { useEffect, useState } from 'react';

interface Event {
  id: number;
  type: string;
  agent: string;
  data?: any;
  receivedAt: string;
}

interface Stats {
  totalExecutions: number;
  totalApproved:   number;
  totalRejected:   number;
  totalAnalyses:   number;
  lastExecution:   Event | null;
  lastAnalysis:    Event | null;
}

const AGENT_COLORS: Record<string, string> = {
  researcher: '#22c55e',
  strategist: '#3b82f6',
  riskguard:  '#f59e0b',
  executor:   '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  ANALYSIS:  '🔍 Analysis',
  STRATEGY:  '🧠 Strategy',
  APPROVED:  '✅ Approved',
  REJECTED:  '❌ Rejected',
  EXECUTED:  '⚡ Executed',
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [pulse, setPulse]   = useState(false);

  const fetchData = async () => {
    const [evRes, stRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/stats'),
    ]);
    const evData = await evRes.json();
    const stData = await stRes.json();
    if (evData.length > 0) setPulse(p => !p);
    setEvents(evData);
    setStats(stData);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#050508',
      color: '#e8e8e0',
      fontFamily: "'IBM Plex Mono', monospace",
      padding: '0',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a2e',
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width='36' height='36' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <rect width='32' height='32' fill='#050508' rx='6'/>
            <line x1='16' y1='4'  x2='26' y2='14' stroke='#22c55e' strokeWidth='1.2' strokeOpacity='0.5'/>
            <line x1='16' y1='4'  x2='6'  y2='14' stroke='#22c55e' strokeWidth='1.2' strokeOpacity='0.5'/>
            <line x1='6'  y1='14' x2='16' y2='28' stroke='#22c55e' strokeWidth='1.2' strokeOpacity='0.5'/>
            <line x1='26' y1='14' x2='16' y2='28' stroke='#22c55e' strokeWidth='1.2' strokeOpacity='0.5'/>
            <circle cx='16' cy='4'  r='4' fill='#050508' stroke='#22c55e' strokeWidth='1.5'/>
            <circle cx='6'  cy='14' r='4' fill='#050508' stroke='#22c55e' strokeWidth='1.5'/>
            <circle cx='26' cy='14' r='4' fill='#050508' stroke='#22c55e' strokeWidth='1.5'/>
            <circle cx='16' cy='28' r='4' fill='#050508' stroke='#22c55e' strokeWidth='1.5'/>
            <circle cx='16' cy='4'  r='1.5' fill='#22c55e'/>
            <circle cx='6'  cy='14' r='1.5' fill='#22c55e'/>
            <circle cx='26' cy='14' r='1.5' fill='#22c55e'/>
            <circle cx='16' cy='28' r='1.5' fill='#22c55e'/>
          </svg>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: '#e8e8e0', lineHeight: 1 }}>
              SwarmFi
            </div>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '3px' }}>
              live dashboard
            </div>
          </div>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#22c55e',
            marginLeft: '4px',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>
          4 AGENTS · GENSYN AXL · 0G STORAGE · KEEPERHUB
        </div>
      </div>

      <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Analyses', value: stats?.totalAnalyses ?? 0,   color: '#22c55e' },
            { label: 'Approved',  value: stats?.totalApproved ?? 0,   color: '#3b82f6' },
            { label: 'Rejected',  value: stats?.totalRejected ?? 0,   color: '#f59e0b' },
            { label: 'Executed',  value: stats?.totalExecutions ?? 0, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.color}22`,
              borderRadius: '12px',
              padding: '20px 24px',
            }}>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Agent Swarm
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { name: 'researcher', role: 'Market Analysis', tech: '0G Compute + Storage', icon: '🔍' },
              { name: 'strategist', role: 'Strategy Builder', tech: '0G Storage memory',   icon: '🧠' },
              { name: 'riskguard',  role: 'Risk Evaluator',  tech: 'ENS trust gating',     icon: '🛡️' },
              { name: 'executor',   role: 'Trade Executor',  tech: 'KeeperHub onchain',    icon: '⚡' },
            ].map(agent => (
              <div key={agent.name} style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${AGENT_COLORS[agent.name]}33`,
                borderRadius: '12px',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{agent.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: AGENT_COLORS[agent.name] }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.05em' }}>
                      .swarmfi.eth
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{agent.role}</div>
                <div style={{ fontSize: '10px', color: '#444' }}>{agent.tech}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Message flow */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Message Flow
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1a1a2e',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            {['researcher', '→', 'strategist', '→', 'riskguard', '→', 'executor'].map((item, i) => (
              <div key={i} style={{
                color: item === '→' ? '#333' : AGENT_COLORS[item],
                fontSize: item === '→' ? '20px' : '13px',
                fontWeight: item === '→' ? 300 : 600,
                flex: item === '→' ? 'none' : 1,
                textAlign: 'center',
              }}>
                {item !== '→' && (
                  <div style={{
                    background: `${AGENT_COLORS[item]}11`,
                    border: `1px solid ${AGENT_COLORS[item]}33`,
                    borderRadius: '8px',
                    padding: '10px',
                  }}>
                    {item}
                    <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>AXL P2P</div>
                  </div>
                )}
                {item === '→' && item}
              </div>
            ))}
          </div>
        </div>

        {/* Live event feed */}
        <div>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Live Event Feed {events.length === 0 && <span style={{ color: '#333' }}>— waiting for swarm...</span>}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1a1a2e',
            borderRadius: '12px',
            overflow: 'hidden',
            minHeight: '200px',
          }}>
            {events.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#333' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <div style={{ fontSize: '13px' }}>Start the swarm with <code style={{ color: '#555' }}>npm run dev</code> to see live events</div>
              </div>
            ) : (
              events.slice(0, 20).map((event, i) => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '14px 20px',
                  borderBottom: i < events.length - 1 ? '1px solid #0f0f1a' : 'none',
                  background: i === 0 ? 'rgba(34,197,94,0.03)' : 'transparent',
                }}>
                  <div style={{ fontSize: '10px', color: '#333', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '80px' }}>
                    {new Date(event.receivedAt).toLocaleTimeString()}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: AGENT_COLORS[event.agent] || '#555',
                    minWidth: '90px',
                    paddingTop: '2px',
                  }}>
                    {event.agent}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '4px',
                    minWidth: '100px',
                  }}>
                    {TYPE_LABELS[event.type] || event.type}
                  </div>
                  <div style={{ fontSize: '11px', color: '#444', flex: 1 }}>
                    {event.data?.signal && <span>signal: <span style={{ color: '#22c55e' }}>{event.data.signal}</span></span>}
                    {event.data?.confidence && <span style={{ marginLeft: '12px' }}>confidence: <span style={{ color: '#3b82f6' }}>{(event.data.confidence * 100).toFixed(0)}%</span></span>}
                    {event.data?.txHash && <span>tx: <span style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: '10px' }}>{event.data.txHash.slice(0, 20)}...</span></span>}
                    {event.data?.approved !== undefined && <span style={{ color: event.data.approved ? '#22c55e' : '#f59e0b' }}>{event.data.approved ? 'approved ✓' : 'rejected ✗'}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </main>
  );
}
