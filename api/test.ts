export const config = { runtime: 'edge' };

export default async function handler(): Promise<Response> {
  // Probe Yahoo Finance directly to see if it responds
  let yahooStatus = 'untested';
  let yahooBody = '';
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=2d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'application/json',
          Referer: 'https://finance.yahoo.com/',
        },
      }
    );
    yahooStatus = `HTTP ${res.status}`;
    const text = await res.text();
    yahooBody = text.trimStart().startsWith('<') ? 'HTML_BLOCKED' : 'JSON_OK';
  } catch (e) {
    yahooStatus = `ERROR: ${String(e)}`;
  }

  return new Response(
    JSON.stringify({ edge: 'ok', yahoo: yahooStatus, yahooBody }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}
