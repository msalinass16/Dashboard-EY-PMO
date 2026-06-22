export const config = { runtime: 'edge' };

export default async function handler() {
  let yahoo = 'untested';
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=2d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/',
      },
    });
    const text = await res.text();
    yahoo = text.trimStart().startsWith('<') ? `HTTP_${res.status}_HTML_BLOCKED` : `HTTP_${res.status}_JSON_OK`;
  } catch (e) {
    yahoo = `ERROR_${String(e)}`;
  }

  return new Response(JSON.stringify({ edge: 'deployed', yahoo }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
