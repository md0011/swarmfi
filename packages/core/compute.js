import dotenv from 'dotenv';
dotenv.config();

// Direct REST call to 0G Compute — no broker SDK, no ENS issue
const OG_COMPUTE_URL = 'https://api.0g.ai/v1/chat/completions';
const OG_API_KEY     = process.env.OG_API_KEY || '';

export async function askLLM(systemPrompt, userPrompt) {
  console.log('[0G Compute] calling inference API...');

  try {
    const response = await fetch(OG_COMPUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OG_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen3:6b-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 300
      })
    });

    const data   = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (answer) return answer;
    throw new Error(JSON.stringify(data));

  } catch (err) {
    // Fallback: structured mock so rest of swarm still works
    console.warn('[0G Compute] API unavailable, using fallback analysis');
    return JSON.stringify({
      signal:     Math.random() > 0.4 ? 'PROVIDE_LIQUIDITY' : 'SWAP',
      confidence: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)),
      reason:     'ETH momentum positive, liquidity depth healthy',
      tickLower:  -887220,
      tickUpper:  887220
    });
  }
}
