const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
async function run() {
  try {
    const d1 = new Date();
    d1.setMonth(d1.getMonth() - 1);
    const d2 = new Date();
    const result = await yf.chart('WIPRO.NS', { period1: d1, period2: d2, interval: '1d' });
    console.log("SUCCESS length:", result.quotes.length);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
