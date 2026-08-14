const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
async function run() {
  try {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const result = await yf.historical('WIPRO.NS', { period1: d, interval: '1d' });
    console.log("SUCCESS length:", result.length);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
