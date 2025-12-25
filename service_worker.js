/* B3 Quick Quote - Service Worker (MV3)
   Fetches quotes from brapi.dev (free API with 4 demo tickers)
   https://brapi.dev/
   
   Free tickers available without API key: PETR4, VALE3, ITUB4, MGLU3
   For full access, users need to get an API key from brapi.dev
*/

const BRAPI_BASE = "https://brapi.dev/api";

// Free tickers available without API key
const FREE_TICKERS = ["PETR4", "VALE3", "ITUB4", "MGLU3"];

// Popular stocks and REITs for Top 3 calculation (limited to free tickers for demo)
const DEMO_STOCKS = ["PETR4", "VALE3", "ITUB4", "MGLU3"];

// Cache for quotes (to show last known data when market is closed)
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
 * Check if ticker is in free tier
 */
function isFreeTicker(ticker) {
  return FREE_TICKERS.includes(ticker.toUpperCase());
}

/**
 * Fetch quotes from brapi.dev
 * @param {string[]} tickers - Array of ticker symbols
 */
async function fetchQuotes(tickers) {
  const tickerList = tickers.join(",");
  const url = `${BRAPI_BASE}/quote/${tickerList}`;
  
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  
  if (res.status === 401) {
    throw new Error("This ticker requires an API key. Free tickers: PETR4, VALE3, ITUB4, MGLU3");
  }
  
  if (!res.ok) {
    throw new Error(`API error (${res.status})`);
  }
  
  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.message || "API error");
  }
  
  return data.results || [];
}

/**
 * Map brapi.dev response to our internal format
 */
function mapQuote(q) {
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
    // Flag to indicate if this is cached/old data
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
  
  // Check if quote is from a different day
  return quoteDate.toDateString() !== today.toDateString();
}

/**
 * Get quote for a single ticker
 */
async function getQuote(ticker) {
  const normalizedTicker = ticker.toUpperCase().replace(".SA", "");
  
  // Check if this is a free ticker
  if (!isFreeTicker(normalizedTicker)) {
    // Check cache first
    if (quotesCache[normalizedTicker]) {
      return { 
        ...quotesCache[normalizedTicker], 
        isMarketClosed: true,
        _cached: true,
        _limitedAccess: true
      };
    }
    throw new Error(`Ticker "${normalizedTicker}" requires API key. Free tickers: PETR4, VALE3, ITUB4, MGLU3`);
  }
  
  try {
    const results = await fetchQuotes([normalizedTicker]);
    
    if (!results.length) {
      throw new Error("Ticker not found");
    }
    
    const quote = mapQuote(results[0]);
    
    // Check if market is closed/holiday (stale data)
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
 * Calculate top 3 gainers and losers
 */
function top3(quotes, direction) {
  const clean = quotes
    .filter(q => typeof q.regularMarketChangePercent === "number" && isFinite(q.regularMarketChangePercent));
  
  clean.sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent);
  
  const sorted = direction === "gainers" ? clean.slice().reverse() : clean.slice();
  
  return sorted.slice(0, 3).map(q => ({
    displaySymbol: q.displaySymbol,
    pct: q.regularMarketChangePercent
  }));
}

/**
 * Get Top gainers and losers for demo stocks
 * Limited to free tickers for demo purposes
 */
async function getTops() {
  try {
    // Fetch all free tickers at once
    const results = await fetchQuotes(DEMO_STOCKS);
    
    const quotes = results.map(mapQuote);
    
    // Check if market is closed (all quotes stale)
    const isMarketClosed = quotes.length > 0 && quotes.every(q => isQuoteStale(q));
    
    // Update cache
    quotes.forEach(q => { quotesCache[q.displaySymbol] = q; });
    lastCacheUpdate = Date.now();
    saveCache();
    
    // Since we only have 4 stocks, we'll show them all as both stocks and "demo"
    const gainers = top3(quotes, "gainers");
    const losers = top3(quotes, "losers");
    
    return {
      stocks: {
        gainers: gainers.slice(0, 2),
        losers: losers.slice(0, 2)
      },
      fiis: {
        gainers: [], // No free REITs available
        losers: []
      },
      updatedAt: Date.now(),
      isMarketClosed,
      isDemoMode: true,
      message: "Demo mode: Only 4 free tickers available (PETR4, VALE3, ITUB4, MGLU3). Get an API key at brapi.dev for full access."
    };
  } catch (error) {
    // If API fails, try to compute from cache
    if (Object.keys(quotesCache).length > 0) {
      const cachedQuotes = DEMO_STOCKS.map(t => quotesCache[t]).filter(Boolean);
      
      if (cachedQuotes.length > 0) {
        return {
          stocks: {
            gainers: top3(cachedQuotes, "gainers").slice(0, 2),
            losers: top3(cachedQuotes, "losers").slice(0, 2)
          },
          fiis: {
            gainers: [],
            losers: []
          },
          updatedAt: lastCacheUpdate,
          isMarketClosed: true,
          isDemoMode: true
        };
      }
    }
    throw error;
  }
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
  return true; // keep message channel open
});
