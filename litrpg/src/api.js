const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export async function callClaude(apiKey, systemPrompt, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from API');

  return parseResponse(text);
}

function parseResponse(text) {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  let parsed = null;

  if (jsonBlockMatch) {
    try {
      parsed = JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      console.warn('Failed to parse JSON block:', e);
    }
  }

  if (!parsed) {
    const rawMatch = text.match(/\{[\s\S]*?"choices"[\s\S]*?\}(?=[^}]*$)/);
    if (rawMatch) {
      try {
        parsed = JSON.parse(rawMatch[0]);
      } catch (e) {
        console.warn('Failed to parse raw JSON:', e);
      }
    }
  }

  const narrative = text
    .replace(/```json[\s\S]*?```/, '')
    .replace(/```[\s\S]*?```/, '')
    .trim();

  return {
    narrative: narrative || text,
    choices: parsed?.choices?.length === 4 ? parsed.choices : FALLBACK_CHOICES,
    state_changes: parsed?.state_changes || {},
  };
}

const FALLBACK_CHOICES = [
  { id: 1, text: 'Step forward boldly', hint: 'A direct approach commands attention' },
  { id: 2, text: 'Hang back and observe', hint: 'Patience may reveal hidden angles' },
  { id: 3, text: 'Ask someone nearby', hint: 'Locals always know more than they let on' },
  { id: 4, text: 'Scout the perimeter', hint: 'There may be another way in' },
];
