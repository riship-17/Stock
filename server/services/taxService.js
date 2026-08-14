const Transaction = require('../models/Transaction');

const DAY_MS = 1000 * 60 * 60 * 24;
const ROUND = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function getCapitalGains(userId) {
  const txns = await Transaction.find({ userId }).sort({ date: 1 });

  const lotsByTicker = {};
  const sells = [];
  let shortTermGain = 0;
  let longTermGain = 0;
  let shortTermCount = 0;
  let longTermCount = 0;
  const matches = [];

  for (const t of txns) {
    const key = t.ticker;
    if (!lotsByTicker[key]) lotsByTicker[key] = [];

    if (t.type === 'buy') {
      lotsByTicker[key].push({
        buyDate: t.date,
        buyPrice: t.price,
        quantity: t.quantity,
        companyName: t.companyName,
        portfolioId: t.portfolioId,
        consumed: 0,
      });
      continue;
    }

    if (t.type === 'sell') {
      let toSell = t.quantity;
      const sellDate = t.date;
      let sellGain = 0;

      const queue = lotsByTicker[key];
      for (const lot of queue) {
        if (toSell <= 1e-9) break;
        const available = lot.quantity - lot.consumed;
        if (available <= 1e-9) continue;
        const take = Math.min(available, toSell);
        lot.consumed += take;
        toSell -= take;

        const costBasis = ROUND(lot.buyPrice * take);
        const proceeds = ROUND(t.price * take);
        const gain = ROUND(proceeds - costBasis);
        const holdingDays = Math.floor((sellDate - lot.buyDate) / DAY_MS);
        const isLongTerm = holdingDays >= 365;

        if (isLongTerm) {
          longTermGain += gain;
          longTermCount++;
        } else {
          shortTermGain += gain;
          shortTermCount++;
        }
        sellGain += gain;

        matches.push({
          ticker: t.ticker,
          companyName: lot.companyName || t.companyName,
          buyDate: lot.buyDate,
          buyPrice: lot.buyPrice,
          sellDate,
          sellPrice: t.price,
          quantity: ROUND(take),
          costBasis,
          proceeds,
          gain,
          holdingDays,
          term: isLongTerm ? 'long' : 'short',
        });
      }

      sells.push({
        ticker: t.ticker,
        sellDate,
        price: t.price,
        quantity: t.quantity,
        gain: ROUND(sellGain),
      });
    }
  }

  const totalRealizedGain = ROUND(shortTermGain + longTermGain);

  return {
    summary: {
      shortTermGain: ROUND(shortTermGain),
      longTermGain: ROUND(longTermGain),
      shortTermCount,
      longTermCount,
      totalRealizedGain,
      sellsCount: sells.length,
    },
    matches,
    sells,
  };
}

module.exports = { getCapitalGains };
