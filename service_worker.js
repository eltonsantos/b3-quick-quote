/* B3 Quick Quote - Service Worker (MV3)
   Fetches intraday quotes from Yahoo Finance.
*/
const QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";

// Lists tuned for liquidity/popularity; adjust as needed.
const STOCKS = [
  "PETR4.SA","VALE3.SA","ITUB4.SA","BBDC4.SA","BBAS3.SA","B3SA3.SA","WEGE3.SA","ABEV3.SA","ELET3.SA","ELET6.SA",
  "PRIO3.SA","SUZB3.SA","RADL3.SA","LREN3.SA","GGBR4.SA","CSNA3.SA","JBSS3.SA","UGPA3.SA","VIVT3.SA","TIMS3.SA",
  "RAIL3.SA","RENT3.SA","HAPV3.SA","MGLU3.SA","ASAI3.SA","BRFS3.SA","CMIG4.SA","CPLE6.SA","ENEV3.SA","EQTL3.SA",
  "FLRY3.SA","GOLL4.SA","KLBN11.SA","MRVE3.SA","NTCO3.SA","PCAR3.SA","RDOR3.SA","SANB11.SA","TAEE11.SA","USIM5.SA"
];

const FIIS = [
  "HGLG11.SA","MXRF11.SA","VISC11.SA","XPML11.SA","XPLG11.SA","KNRI11.SA","BCFF11.SA","IRDM11.SA","HGRE11.SA","HGRU11.SA",
  "KNSC11.SA","RBRP11.SA","RECT11.SA","GGRC11.SA","CPTS11.SA","VILG11.SA","BTLG11.SA","BRCO11.SA","ALZR11.SA","HGCR11.SA",
  "KNCR11.SA","KNUQ11.SA","XPCI11.SA","XPSF11.SA","JSRE11.SA","PVBI11.SA","HSML11.SA","RZTR11.SA","TRXF11.SA","VINO11.SA"
];

function chunk(arr, size){
  const out = [];
  for (let i=0; i<arr.length; i+=size) out.push(arr.slice(i, i+size));
  return out;
}

async function fetchQuotes(symbols){
  const url = QUOTE_ENDPOINT + encodeURIComponent(symbols.join(","));
  const res = await fetch(url, { method:"GET", cache:"no-store" });
  if (!res.ok) throw new Error(`Yahoo request failed (${res.status})`);
  const data = await res.json();
  const results = data?.quoteResponse?.result || [];
  return results;
}

function mapQuote(q){
  const symbol = q?.symbol || "";
  const displaySymbol = symbol.replace(".SA","");
  return {
    symbol,
    displaySymbol,
    shortName: q?.shortName,
    longName: q?.longName,
    regularMarketPrice: q?.regularMarketPrice,
    regularMarketChange: q?.regularMarketChange,
    regularMarketChangePercent: q?.regularMarketChangePercent,
    regularMarketOpen: q?.regularMarketOpen,
    regularMarketDayHigh: q?.regularMarketDayHigh,
    regularMarketDayLow: q?.regularMarketDayLow,
    regularMarketVolume: q?.regularMarketVolume,
    marketTime: q?.regularMarketTime
  };
}

async function getQuote(symbol){
  const quotes = await fetchQuotes([symbol]);
  if (!quotes.length) throw new Error("Ticker não encontrado.");
  return mapQuote(quotes[0]);
}

function top3(quotes, direction){
  // direction: "gainers" (desc), "losers" (asc)
  const clean = quotes
    .map(mapQuote)
    .filter(q => typeof q.regularMarketChangePercent === "number" && isFinite(q.regularMarketChangePercent));
  clean.sort((a,b) => (a.regularMarketChangePercent - b.regularMarketChangePercent));
  const sorted = direction === "gainers" ? clean.slice().reverse() : clean.slice();
  return sorted.slice(0,3).map(q => ({ displaySymbol: q.displaySymbol, pct: q.regularMarketChangePercent }));
}

async function getTops(){
  // Batch requests to reduce number of calls (Yahoo supports many symbols per request; keep conservative).
  const stocksChunks = chunk(STOCKS, 40);
  const fiisChunks = chunk(FIIS, 40);

  const [stocksQuotes, fiisQuotes] = await Promise.all([
    (async() => (await Promise.all(stocksChunks.map(fetchQuotes))).flat())(),
    (async() => (await Promise.all(fiisChunks.map(fetchQuotes))).flat())()
  ]);

  const stocks = {
    gainers: top3(stocksQuotes, "gainers"),
    losers: top3(stocksQuotes, "losers")
  };
  const fiis = {
    gainers: top3(fiisQuotes, "gainers"),
    losers: top3(fiisQuotes, "losers")
  };

  return {
    stocks,
    fiis,
    updatedAt: Date.now()
  };
}

// Message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "GET_QUOTE") {
        const data = await getQuote(msg.symbol);
        sendResponse({ ok:true, data });
        return;
      }
      if (msg?.type === "GET_TOPS") {
        const data = await getTops();
        sendResponse({ ok:true, data });
        return;
      }
      sendResponse({ ok:false, error:"Mensagem desconhecida." });
    } catch (e) {
      sendResponse({ ok:false, error: e?.message || String(e) });
    }
  })();
  return true; // keep message channel open
});
