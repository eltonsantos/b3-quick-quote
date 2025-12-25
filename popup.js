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

  btnLoadTops: $("btnLoadTops"),
  topsState: $("topsState"),
  topsBox: $("topsBox"),
  stocksGainers: $("stocksGainers"),
  stocksLosers: $("stocksLosers"),
  fiisGainers: $("fiisGainers"),
  fiisLosers: $("fiisLosers"),
};

function fmtBRL(v){
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(v);
  } catch {
    return `R$ ${Number(v).toFixed(2)}`;
  }
}
function fmtNum(v){
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("pt-BR").format(v);
}
function fmtPct(v){
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}
function setState(el, text){
  el.textContent = text;
}
function setChangeClass(el, pct){
  el.classList.remove("good","bad","neutral");
  if (pct > 0) el.classList.add("good");
  else if (pct < 0) el.classList.add("bad");
  else el.classList.add("neutral");
}
function normalizeTicker(input){
  const t = (input || "").trim().toUpperCase();
  if (!t) return "";
  // allow already with .SA
  if (t.endsWith(".SA")) return t;
  // common: PETR4, HGLG11
  // If user types with spaces or hyphen, strip
  return t.replace(/[^A-Z0-9.]/g, "") + ".SA";
}

async function sendMessage(msg){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      resolve(resp);
    });
  });
}

function renderQuote(q){
  els.quoteState.classList.add("hidden");
  els.quoteBox.classList.remove("hidden");

  els.qSymbol.textContent = q.displaySymbol || q.symbol || "—";
  els.qName.textContent = q.shortName || q.longName || "—";
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

  els.qTime.textContent = q.marketTime
    ? `Atualizado: ${new Date(q.marketTime * 1000).toLocaleString("pt-BR")}`
    : "Atualizado: —";
}

function renderList(container, items){
  container.innerHTML = "";
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

async function doSearch(refreshOnly=false){
  const raw = els.ticker.value;
  const symbol = normalizeTicker(raw);
  if (!symbol){
    els.quoteBox.classList.add("hidden");
    els.quoteState.classList.remove("hidden");
    setState(els.quoteState, "Digite um ticker válido (ex: PETR4, HGLG11).");
    return;
  }

  els.btnSearch.disabled = true;
  els.btnRefresh.disabled = true;

  els.quoteBox.classList.add("hidden");
  els.quoteState.classList.remove("hidden");
  setState(els.quoteState, refreshOnly ? "Atualizando..." : "Buscando cotação...");

  try{
    const resp = await sendMessage({ type:"GET_QUOTE", symbol });
    if (!resp?.ok) throw new Error(resp?.error || "Falha ao obter cotação.");
    renderQuote(resp.data);

    // persist last ticker
    chrome.storage.local.set({ lastTicker: raw.trim().toUpperCase() }).catch(()=>{});
  } catch(e){
    els.quoteBox.classList.add("hidden");
    els.quoteState.classList.remove("hidden");
    setState(els.quoteState, `Erro: ${e.message || e}`);
  } finally{
    els.btnSearch.disabled = false;
    els.btnRefresh.disabled = false;
  }
}

async function loadTops(){
  els.btnLoadTops.disabled = true;
  els.topsBox.classList.add("hidden");
  els.topsState.classList.remove("hidden");
  setState(els.topsState, "Carregando Top 3...");

  try{
    const resp = await sendMessage({ type:"GET_TOPS" });
    if (!resp?.ok) throw new Error(resp?.error || "Falha ao obter Tops.");

    const { stocks, fiis, updatedAt } = resp.data;

    renderList(els.stocksGainers, stocks.gainers);
    renderList(els.stocksLosers, stocks.losers);
    renderList(els.fiisGainers, fiis.gainers);
    renderList(els.fiisLosers, fiis.losers);

    els.topsState.classList.add("hidden");
    els.topsBox.classList.remove("hidden");

    // add timestamp to state if needed
    const note = document.querySelector(".mini-note");
    if (note && updatedAt) {
      note.textContent = `Observação: Top 3 é calculado a partir de uma lista interna de ativos líquidos. Atualizado: ${new Date(updatedAt).toLocaleString("pt-BR")}.`;
    }
  } catch(e){
    els.topsBox.classList.add("hidden");
    els.topsState.classList.remove("hidden");
    setState(els.topsState, `Erro: ${e.message || e}`);
  } finally{
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

// Auto refresh quote while popup is open (every 15s) if quote is visible
setInterval(() => {
  const isVisible = !els.quoteBox.classList.contains("hidden");
  if (isVisible) doSearch(true);
}, 15000);
