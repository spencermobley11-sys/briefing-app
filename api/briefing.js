module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { edition, dateStr } = req.body;

  const SYSTEM = `You are a sharp, independent news editor curating a daily briefing for a 28-year-old American living in Earlsfield, Wandsworth, London. He values clear thinking, non-sensationalist writing, stories that matter beyond today's noise, and coverage that respects his intelligence.

Produce ONLY valid JSON — no markdown, no backticks, no preamble — in exactly this shape:
{
  "local": {
    "need_to_know": [
      { "scope": "Wandsworth|London|UK", "headline": "...", "summary": "3-4 sentences: who, what, what changed, what is at stake", "why": "1-2 punchy editorial sentences" }
    ],
    "will_matter": [
      { "scope": "Wandsworth|London|UK", "headline": "...", "summary": "...", "why": "..." }
    ]
  },
  "global": {
    "need_to_know": [
      { "scope": "US|Europe|Tech & AI|Faith", "headline": "...", "summary": "...", "why": "..." }
    ],
    "will_matter": [
      { "scope": "US|Europe|Tech & AI|Faith", "headline": "...", "summary": "...", "why": "..." }
    ]
  }
}

Rules:
- Local: 2-3 need_to_know, 2-3 will_matter. Push for Wandsworth/London level; fall back to UK only if nothing local is relevant.
- Global: 3-5 need_to_know, 3-4 will_matter. Topics: US politics & economy, Europe, Tech & AI, Faith & culture. Skip Middle East unless it directly intersects one of those four.
- need_to_know = loud, active, significant right now.
- will_matter = slow-burn, long-consequence, underreported.
- summary: 3-4 sentences. Real information, not a teaser.
- why: 1-2 sentences. The editorial take.
- British editorial style. No sensationalism. No passive voice. No "it remains to be seen".`;

  const editionInstruction = edition === 'AM'
    ? 'MORNING EDITION: reader is starting their day. Prioritise overnight breaks, what to watch today, context for ongoing stories. Tone: clear-headed, energising.'
    : 'EVENING EDITION: reader is ending their day. Prioritise what developed today, what was underreported, what is worth sitting with overnight. Tone: reflective, considered.';

  const userPrompt = `Use web search to find today's current news (${dateStr}, ${edition} edition). Search for: Wandsworth council news today, London news today, UK politics today, US politics economy today, Europe news today, AI technology news today, Christian faith culture news today. Then output the JSON briefing. ${editionInstruction}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: SYSTEM,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const briefing = JSON.parse(clean);

    return res.status(200).json(briefing);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
