/* B3 Quick Quote - Popup logic */
const $ = (id) => document.getElementById(id);

const els = {
  ticker: $("ticker"),
  btnSearch: $("btnSearch"),
  btnRefresh: $("btnRefresh"),
  quoteState: $("quoteState"),
  quoteBox: $("quoteBox"),
  qSymbol: $("qSymbol"),
  qName: $("qName"),
  qPrice: $("qPrice"),
  qChange: $("qChange"),
  qOpen: $("qOpen"),
  qHigh: $("qHigh"),
  qLow: $("qLow"),
  qVol: $("qVol"),
  qTime: $("qTime"),
  qMarketStatus: $("qMarketStatus"),

  btnLoadTops: $("btnLoadTops"),
  topsState: $("topsState"),
  topsBox: $("topsBox"),
  topsMarketStatus: $("topsMarketStatus"),
  stocksGainers: $("stocksGainers"),
  stocksLosers: $("stocksLosers"),
  fiisGainers: $("fiisGainers"),
  fiisLosers: $("fiisLosers"),
};

function fmtBRL(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  } catch {
    return `R$ ${Number(v).toFixed(2)}`;
  }
}

function fmtNum(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("pt-BR").format(v);
}

function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function setState(el, text) {
  el.textContent = text;
}

function setChangeClass(el, pct) {
  el.classList.remove("good", "bad", "neutral");
  if (pct > 0) el.classList.add("good");
  else if (pct < 0) el.classList.add("bad");
  else el.classList.add("neutral");
}

function normalizeTicker(input) {
  const t = (input || "").trim().toUpperCase();
  if (!t) return "";
  // Remove .SA suffix if present
  return t.replace(".SA", "").replace(/[^A-Z0-9]/g, "");
}

function formatDateTime(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showMarketStatus(el, isClosed) {
  if (!el) return;
  if (isClosed) {
    el.innerHTML = '<span class="market-closed-badge">Mercado Fechado</span>';
  } else {
    el.innerHTML = '<span class="market-open-badge">Ao Vivo</span>';
  }
}

async function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      resolve(resp);
    });
  });
}

function renderQuote(q) {
  els.quoteState.classList.add("hidden");
  els.quoteBox.classList.remove("hidden");

  els.qSymbol.textContent = q.displaySymbol || q.symbol || "—";
  els.qName.textContent = q.shortName || q.longName || q.displaySymbol || "—";
  els.qPrice.textContent = fmtBRL(q.regularMarketPrice);
  
  const pct = q.regularMarketChangePercent ?? null;
  const chg = q.regularMarketChange ?? null;
  const sign = (chg ?? 0) > 0 ? "+" : "";
  els.qChange.textContent = `${fmtPct(pct)} (${sign}${(chg ?? 0).toFixed(2)})`;
  setChangeClass(els.qChange, pct ?? 0);

  els.qOpen.textContent = fmtBRL(q.regularMarketOpen);
  els.qHigh.textContent = fmtBRL(q.regularMarketDayHigh);
  els.qLow.textContent = fmtBRL(q.regularMarketDayLow);
  els.qVol.textContent = fmtNum(q.regularMarketVolume);

  // Show timestamp
  const timeStr = q.marketTime ? formatDateTime(q.marketTime) : "—";
  els.qTime.textContent = `Atualizado: ${timeStr}`;

  // Show market status badge
  showMarketStatus(els.qMarketStatus, q.isMarketClosed);
}

function renderList(container, items) {
  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="state" style="padding:4px 0;font-size:11px;">—</div>';
    return;
  }
  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item";
    const left = document.createElement("div");
    left.className = "sym";
    left.textContent = it.displaySymbol;

    const right = document.createElement("div");
    right.className = "chg " + (it.pct > 0 ? "good" : it.pct < 0 ? "bad" : "neutral");
    right.textContent = fmtPct(it.pct);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

async function doSearch(refreshOnly = false) {
  const raw = els.ticker.value;
  const symbol = normalizeTicker(raw);
  if (!symbol) {
    els.quoteBox.classList.add("hidden");
    els.quoteState.classList.remove("hidden");
    setState(els.quoteState, "Digite um ticker válido (ex: PETR4, VALE3).");
    return;
  }

  els.btnSearch.disabled = true;
  els.btnRefresh.disabled = true;

  els.quoteBox.classList.add("hidden");
  els.quoteState.classList.remove("hidden");
  setState(els.quoteState, refreshOnly ? "Atualizando..." : "Buscando cotação...");

  try {
    const resp = await sendMessage({ type: "GET_QUOTE", symbol });
    if (!resp?.ok) throw new Error(resp?.error || "Falha ao obter cotação.");
    renderQuote(resp.data);

    // persist last ticker
    chrome.storage.local.set({ lastTicker: symbol }).catch(() => {});
  } catch (e) {
    els.quoteBox.classList.add("hidden");
    els.quoteState.classList.remove("hidden");
    
    // Translate common error messages
    let errorMsg = e.message || String(e);
    if (errorMsg.includes("requires API key")) {
      errorMsg = `O ticker "${symbol}" requer chave de API. Tickers gratuitos: PETR4, VALE3, ITUB4, MGLU3`;
    } else if (errorMsg.includes("Ticker not found")) {
      errorMsg = "Ticker não encontrado.";
    }
    
    setState(els.quoteState, `Erro: ${errorMsg}`);
  } finally {
    els.btnSearch.disabled = false;
    els.btnRefresh.disabled = false;
  }
}

async function loadTops() {
  els.btnLoadTops.disabled = true;
  els.topsBox.classList.add("hidden");
  els.topsState.classList.remove("hidden");
  setState(els.topsState, "Carregando variações...");

  try {
    const resp = await sendMessage({ type: "GET_TOPS" });
    if (!resp?.ok) throw new Error(resp?.error || "Falha ao carregar dados.");

    const { stocks, fiis, updatedAt, isMarketClosed, isDemoMode } = resp.data;

    renderList(els.stocksGainers, stocks.gainers);
    renderList(els.stocksLosers, stocks.losers);
    renderList(els.fiisGainers, fiis.gainers);
    renderList(els.fiisLosers, fiis.losers);

    els.topsState.classList.add("hidden");
    els.topsBox.classList.remove("hidden");

    // Show market status
    showMarketStatus(els.topsMarketStatus, isMarketClosed);

    // Update note with timestamp
    const note = document.querySelector(".mini-note");
    if (note && updatedAt) {
      const dateStr = new Date(updatedAt).toLocaleString("pt-BR");
      if (isDemoMode) {
        note.textContent = `Obs: Modo demonstração com tickers gratuitos. Atualizado: ${dateStr}`;
      } else {
        note.textContent = `Obs: Calculado a partir de ativos líquidos. Atualizado: ${dateStr}`;
      }
    }
  } catch (e) {
    els.topsBox.classList.add("hidden");
    els.topsState.classList.remove("hidden");
    setState(els.topsState, `Erro: ${e.message || e}`);
  } finally {
    els.btnLoadTops.disabled = false;
  }
}

els.btnSearch.addEventListener("click", () => doSearch(false));
els.btnRefresh.addEventListener("click", () => doSearch(true));
els.btnLoadTops.addEventListener("click", () => loadTops());

els.ticker.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch(false);
});

// Load last ticker
chrome.storage.local.get(["lastTicker"], (res) => {
  if (res?.lastTicker) els.ticker.value = res.lastTicker;
});

// Auto refresh quote while popup is open (every 30s) if quote is visible
setInterval(() => {
  const isVisible = !els.quoteBox.classList.contains("hidden");
  if (isVisible) doSearch(true);
}, 30000);
