<p align="center">
  <img src="icon128.png" alt="B3 Quick Quote" width="100"/>
</p>

<h1 align="center">B3 Quick Quote</h1>

<p align="center">
  <strong>Quick stock and REIT quotes from B3 (Brazilian Stock Exchange). Right in your browser.</strong>
</p>

<p align="center">
  <a href="#-about">About</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-features">Features</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-installation">Installation</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-how-to-use">How to Use</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-privacy">Privacy</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-00b894">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-00b894">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-Extension-00b894?logo=googlechrome&logoColor=white">
  <img alt="B3" src="https://img.shields.io/badge/B3-Brazil-00b894">
</p>

---

## 🎯 About

**B3 Quick Quote** is a Chrome extension that allows you to check stock and real estate investment trust (FII/REIT) quotes from B3 quickly and easily, without opening heavy websites or logging into trading platforms.

Perfect for investors who want to track the Brazilian market efficiently, directly from their browser.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Ticker Search** | Enter the stock or REIT code (e.g., PETR4, HGLG11) and get the quote instantly |
| 💰 **Real-Time Price** | View current price, percentage change, and change in BRL |
| 📊 **Daily Data** | Opening price, day high, day low, and trading volume |
| 📈 **Top 3 Gainers** | See the top 3 biggest gainers of the day for stocks and REITs (40+ stocks, 30+ FIIs monitored) |
| 📉 **Top 3 Losers** | See the top 3 biggest losers of the day for stocks and REITs |
| 🔄 **Auto Refresh** | Quotes automatically update every 15 seconds |
| 💾 **Last Ticker Memory** | The extension remembers the last asset you searched |
| 🇧🇷 **Brazilian Market** | Focused on B3 (Brazilian Stock Exchange) assets |

---

## 📊 Supported Assets

The extension supports all B3 listed assets including:

- **Stocks** - PETR4, VALE3, ITUB4, BBDC4, WEGE3, and 4,000+ more
- **REITs (FIIs)** - HGLG11, MXRF11, XPML11, KNRI11, and many more
- **ETFs, BDRs** - Full support for all B3 tickers

Data provided by [brapi.dev](https://brapi.dev) with 15-minute delay.

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone or download** this repository:
```bash
git clone https://github.com/eltonsantos/b3-quick-quote.git
```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **"Load unpacked"** and select the project folder

5. The extension icon will appear in your toolbar — you're ready to go!

---

## 💡 How to Use

1. Click the **B3 Quick Quote** icon in your Chrome toolbar

2. Enter the asset code in the search field (e.g., `PETR4`, `HGLG11`, `VALE3`)

3. Click **Search** or press **Enter**

4. The quote will be displayed with:
   - Current price in BRL (R$)
   - Percentage and absolute change
   - Opening, high, low, and volume data

5. To see the top gainers and losers of the day, click **Load** in the "Top 3" section

6. Use the **Refresh** button for manual update, or wait for auto-refresh (15s)

---

## 🖼️ Screenshot

<p align="center">
  <img alt="B3 Quick Quote Popup" src=".github/screenshot.png" width="400px">
</p>

---

## 🧪 Technologies

This extension was built with:

- **JavaScript** (Vanilla JS, no frameworks)
- **Chrome Extensions API** (Manifest V3)
- **CSS3** (Custom styling with CSS variables)
- **brapi.dev API** (Brazilian market data source)
- **Chrome Storage API** (Local preference storage)

---

## 🔒 Privacy

Your privacy matters. This extension:

- ✅ Does **NOT** collect personal data
- ✅ Does **NOT** track your browsing history
- ✅ Does **NOT** send data to external servers (except brapi.dev for quotes)
- ✅ Works **100% locally** in your browser
- ✅ Only accesses brapi.dev API to fetch quotes

All settings are stored locally using Chrome Storage.

Read the [full Privacy Policy](PRIVACY.md).

---

## 📋 Changelog

### v1.0.0
- 🎉 Initial release
- Ticker quote search
- Display of price, change, open, high, low, and volume
- Top 3 gainers and losers (Stocks and REITs)
- Auto-refresh every 15 seconds
- Last searched ticker memory

---

## 🐾 Next Steps

- [ ] Publish to Chrome Web Store
- [ ] Add favorites/watchlist feature
- [ ] Price alert notifications
- [ ] Simplified intraday chart
- [ ] Support for more asset types (ETFs, BDRs)
- [ ] Firefox and Edge compatibility

---

## 👨🏻‍💻 Author

<h3 align="center">
  <img style="border-radius: 50%" src="https://avatars3.githubusercontent.com/u/1292594?s=460&u=0b1bfb0fc81256c59dc33f31ce344231bd5a5286&v=4" width="100px;" alt="Elton Santos"/>
  <br/>
  <strong>Elton Santos</strong> 🚀
  <br/>
  <br/>

  <a href="https://www.linkedin.com/in/eltonmelosantos" alt="LinkedIn" target="blank">
    <img src="https://img.shields.io/badge/-LinkedIn-blue?style=flat-square&logo=Linkedin&logoColor=white" />
  </a>

  <a href="https://github.com/eltonsantos" alt="GitHub" target="blank">
    <img src="https://img.shields.io/badge/-GitHub-181717?style=flat-square&logo=GitHub&logoColor=white" />
  </a>

  <a href="https://www.youtube.com/@eltonsantosoficial" alt="YouTube" target="blank">
    <img src="https://img.shields.io/badge/-YouTube-ff0000?style=flat-square&logo=YouTube&logoColor=white" />
  </a>

  <a href="mailto:elton.melo.santos@gmail.com?subject=Hello%20Elton" alt="Email" target="blank">
    <img src="https://img.shields.io/badge/-Gmail-c14438?style=flat-square&logo=Gmail&logoColor=white" />
  </a>

  <a href="https://eltonmelosantos.com.br" alt="Website" target="blank">
    <img src="https://img.shields.io/badge/-Website-00b894?style=flat-square&logo=Safari&logoColor=white" />
  </a>

<br/>
<br/>

Made with ❤️ by Elton Santos 👋🏽 [Get in touch!](https://www.linkedin.com/in/eltonmelosantos/)

</h3>

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This extension is for informational purposes only. Quotes are obtained from Yahoo Finance and may be delayed. It does not constitute investment advice. Always consult a professional before making investment decisions.
