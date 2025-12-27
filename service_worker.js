/* B3 Quick Quote - Service Worker (MV3)
   Fetches quotes from brapi.dev API
   https://brapi.dev/
*/

const BRAPI_BASE = "https://brapi.dev/api";
const BRAPI_TOKEN = "eBruogoA5JX7gkh1A8ZRqv";

// Popular stocks for Top 3 calculation (liquid stocks from IBOVESPA)
const STOCKS = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "B3SA3", "WEGE3", "ABEV3", "ELET3", "ELET6",
  "PRIO3", "SUZB3", "RADL3", "LREN3", "GGBR4", "CSNA3", "JBSS3", "UGPA3", "VIVT3", "TIMS3",
  "RAIL3", "RENT3", "HAPV3", "MGLU3", "ASAI3", "BRFS3", "CMIG4", "CPLE6", "ENEV3", "EQTL3",
  "FLRY3", "GOLL4", "KLBN11", "MRVE3", "NTCO3", "PCAR3", "RDOR3", "SANB11", "TAEE11", "USIM5"
];

// FIIs from IFIX index (Brazilian REIT index) - 100 FIIs
const FIIS = [
  "HGLG11", "XPLG11", "BTLG11", "BRCO11", "VILG11", "LVBI11", "GGRC11", "LGCP11", "SDIL11", "VTLT11",
  "VISC11", "XPML11", "HSML11", "MALL11", "PQDP11", "FIGS11", "JRDM11", "HGBS11", "ABCP11", "FLMA11",
  "KNRI11", "HGRE11", "BRCR11", "JSRE11", "PVBI11", "RECT11", "RBRP11", "GTWR11", "SARE11", "TEPP11",
  "HGRU11", "TRXF11", "VINO11", "ALZR11", "RBRF11", "HFOF11", "MGFF11", "RBVA11", "BBPO11", "RNGO11",
  "MXRF11", "CPTS11", "IRDM11", "KNCR11", "KNIP11", "KNSC11", "HGCR11", "XPCI11", "RBRR11", "VGIR11",
  "VCJR11", "PLCR11", "CVBI11", "RZAK11", "HABT11", "URPR11", "RECR11", "AFHI11", "TGAR11", "RZTR11",
  "HGPO11", "RBRL11", "NEWU11", "PATL11", "RBED11", "FCFL11", "BBFI11", "FAED11", "NSLU11", "MBRF11",
  "RURA11", "RZAG11", "VGIA11", "XPCA11", "DCRA11", "FGAA11", "EGAF11", "SNAG11", "AAZQ11", "ALZQ11",
  "BCFF11", "XPSF11", "KFOF11", "RFOF11", "OUFF11", "ITIT11", "BCIA11", "CRFF11", "BPFF11", "DEVA11",
  "HCTR11", "HTMX11", "IRIM11", "JSAF11", "LIFE11", "MAXR11", "OUJP11", "PATC11", "RBRY11", "RELG11",
  "SNFF11", "SPTW11", "VSLH11", "XPPR11"
];

// Cache for individual quotes
let quotesCache = {};
let lastCacheUpdate = null;

// Load cache from storage on startup
chrome.storage.local.get(["quotesCache", "lastCacheUpdate"], (data) => {
  if (data.quotesCache) quotesCache = data.quotesCache;
  if (data.lastCacheUpdate) lastCacheUpdate = data.lastCacheUpdate;
});

function saveCache() {
  chrome.storage.local.set({ quotesCache, lastCacheUpdate }).catch(() => {});
}

/**
 * Fetch quote for a single ticker from brapi.dev
 * @param {string} ticker - Ticker symbol
 */
async function fetchSingleQuote(ticker) {
  const url = `${BRAPI_BASE}/quote/${ticker}`;
  
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${BRAPI_TOKEN}`
    }
  });
  
  if (!res.ok) {
    throw new Error(`API error (${res.status})`);
  }
  
  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.message || "API error");
  }
  
  return data.results?.[0] || null;
}

/**
 * Map brapi.dev response to our internal format
 */
function mapQuote(q) {
  if (!q) return null;
  
  const symbol = q?.symbol || "";
  const marketTime = q?.regularMarketTime ? new Date(q.regularMarketTime).getTime() / 1000 : null;
  
  return {
    symbol: symbol,
    displaySymbol: symbol,
    shortName: q?.shortName || symbol,
    longName: q?.longName || null,
    regularMarketPrice: q?.regularMarketPrice ?? null,
    regularMarketChange: q?.regularMarketChange ?? null,
    regularMarketChangePercent: q?.regularMarketChangePercent ?? null,
    regularMarketOpen: q?.regularMarketOpen ?? null,
    regularMarketDayHigh: q?.regularMarketDayHigh ?? null,
    regularMarketDayLow: q?.regularMarketDayLow ?? null,
    regularMarketVolume: q?.regularMarketVolume ?? null,
    marketTime: marketTime,
    previousClose: q?.regularMarketPreviousClose ?? null,
    high52: q?.fiftyTwoWeekHigh ?? null,
    low52: q?.fiftyTwoWeekLow ?? null,
    marketCap: q?.marketCap ?? null,
    logoUrl: q?.logourl ?? null,
    isMarketClosed: false
  };
}

/**
 * Check if the quote data is from today or stale (market closed/holiday)
 */
function isQuoteStale(quote) {
  if (!quote?.marketTime) return true;
  
  const quoteDate = new Date(quote.marketTime * 1000);
  const today = new Date();
  
  return quoteDate.toDateString() !== today.toDateString();
}

/**
 * Get quote for a single ticker (used by popup search)
 */
async function getQuote(ticker) {
  const normalizedTicker = ticker.toUpperCase().replace(".SA", "");
  
  try {
    const result = await fetchSingleQuote(normalizedTicker);
    
    if (!result) {
      throw new Error("Ticker não encontrado");
    }
    
    const quote = mapQuote(result);
    quote.isMarketClosed = isQuoteStale(quote);
    
    // Update cache
    quotesCache[normalizedTicker] = quote;
    lastCacheUpdate = Date.now();
    saveCache();
    
    return quote;
  } catch (error) {
    // If API fails, try to return cached data
    if (quotesCache[normalizedTicker]) {
      const cachedQuote = { ...quotesCache[normalizedTicker], isMarketClosed: true };
      return cachedQuote;
    }
    throw error;
  }
}

/**
 * Get quote for a single ticker, return null on error (for batch operations)
 */
async function getQuoteSingle(ticker) {
  try {
    const result = await fetchSingleQuote(ticker);
    if (!result) return null;
    return mapQuote(result);
  } catch {
    return null;
  }
}

/**
 * Fetch multiple quotes with concurrency control
 * @param {string[]} tickers - Array of ticker symbols
 * @param {number} concurrency - Number of parallel requests
 */
async function getQuotesMany(tickers, concurrency = 6) {
  const out = [];
  let idx = 0;
  
  async function worker() {
    while (idx < tickers.length) {
      const i = idx++;
      const ticker = tickers[i];
      const q = await getQuoteSingle(ticker);
      if (q) out.push(q);
    }
  }
  
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

/**
 * Calculate top 3 gainers or losers from quotes
 */
function top3FromQuotes(quotes, direction) {
  const clean = quotes
    .filter(q => typeof q.regularMarketChangePercent === "number" && isFinite(q.regularMarketChangePercent))
    .map(q => ({ 
      displaySymbol: q.displaySymbol, 
      pct: q.regularMarketChangePercent 
    }));

  clean.sort((a, b) => a.pct - b.pct);
  const sorted = direction === "gainers" ? clean.slice().reverse() : clean.slice();
  return sorted.slice(0, 3);
}

/**
 * Get Top 3 gainers and losers for stocks and FIIs
 * Uses session cache to avoid excessive API calls
 */
async function getTops() {
  const now = Date.now();
  const store = chrome.storage.session || chrome.storage.local;
  const cache = await store.get(["topsCache"]).catch(() => ({}));
  const cached = cache?.topsCache;
  
  // Return cache if less than 30 seconds old
  if (cached && (now - cached.updatedAt) < 30000) {
    return cached;
  }

  // Fetch stocks and FIIs in parallel with concurrency control
  const [stocksQuotes, fiisQuotes] = await Promise.all([
    getQuotesMany(STOCKS, 6),
    getQuotesMany(FIIS, 6)
  ]);

  // Check if market is closed
  const allQuotes = [...stocksQuotes, ...fiisQuotes];
  const isMarketClosed = allQuotes.length > 0 && allQuotes.every(q => isQuoteStale(q));

  // Update individual quotes cache
  allQuotes.forEach(q => { 
    quotesCache[q.displaySymbol] = q; 
  });
  lastCacheUpdate = now;
  saveCache();

  const data = {
    stocks: {
      gainers: top3FromQuotes(stocksQuotes, "gainers"),
      losers: top3FromQuotes(stocksQuotes, "losers")
    },
    fiis: {
      gainers: top3FromQuotes(fiisQuotes, "gainers"),
      losers: top3FromQuotes(fiisQuotes, "losers")
    },
    updatedAt: now,
    isMarketClosed,
    isDemoMode: false
  };

  // Save to session cache
  await store.set({ topsCache: data }).catch(() => {});
  
  return data;
}

// Message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "GET_QUOTE") {
        const data = await getQuote(msg.symbol);
        sendResponse({ ok: true, data });
        return;
      }
      if (msg?.type === "GET_TOPS") {
        const data = await getTops();
        sendResponse({ ok: true, data });
        return;
      }
      sendResponse({ ok: false, error: "Unknown message type." });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true;
});
