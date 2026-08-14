/**
 * Seed Script — Pre-loads sample Indian stock data
 * Run: node seed.js
 *
 * Pre-loads:
 * - 2 portfolios: "Long Term" and "Swing Trades"
 * - 6 holdings across both portfolios (top NSE stocks)
 * - 5 watchlist entries
 * - Sample transactions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Portfolio = require('./models/Portfolio');
const Holding = require('./models/Holding');
const Watchlist = require('./models/Watchlist');
const Transaction = require('./models/Transaction');
const StockCache = require('./models/StockCache');
const Alert = require('./models/Alert');
const Badge = require('./models/Badge');
const NewsCache = require('./models/NewsCache');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stocktracker';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Portfolio.deleteMany(),
      Holding.deleteMany(),
      Watchlist.deleteMany(),
      Transaction.deleteMany(),
      StockCache.deleteMany(),
      Alert.deleteMany(),
      Badge.deleteMany(),
      NewsCache.deleteMany(),
    ]);
    console.log('🧹 Cleared existing data');

    // ─── Create Demo User ──────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
    });
    console.log('👤 Created demo user (demo@example.com / password123)');

    // ─── Create Extra Users (for leaderboard) ─────────────────────────────
    const alice = await User.create({
      name: 'Alice Patel',
      email: 'alice@example.com',
      password: hashedPassword,
      virtualCash: 1180000,
    });
    const bob = await User.create({
      name: 'Bob Sharma',
      email: 'bob@example.com',
      password: hashedPassword,
      virtualCash: 940000,
    });
    const carol = await User.create({
      name: 'Carol Rao',
      email: 'carol@example.com',
      password: hashedPassword,
      virtualCash: 1300000,
    });

    // ─── Create Portfolios ─────────────────────────────────────────────────
    const [longTerm, swing] = await Portfolio.create([
      { userId: demoUser._id, name: 'Long Term', description: 'Blue-chip holdings for wealth creation' },
      { userId: demoUser._id, name: 'Swing Trades', description: 'Short-to-medium term momentum plays' },
    ]);
    console.log('📁 Created portfolios');

    // ─── Create Holdings ───────────────────────────────────────────────────
    const holdings = await Holding.create([
      // Long Term Portfolio
      {
        userId: demoUser._id,
        portfolioId: longTerm._id,
        ticker: 'RELIANCE.NS',
        companyName: 'Reliance Industries Ltd',
        quantity: 50,
        buyPrice: 2450,
        buyDate: new Date('2023-06-15'),
        sector: 'Energy',
        notes: 'Core position — diversified conglomerate',
      },
      {
        userId: demoUser._id,
        portfolioId: longTerm._id,
        ticker: 'TCS.NS',
        companyName: 'Tata Consultancy Services Ltd',
        quantity: 20,
        buyPrice: 3200,
        buyDate: new Date('2023-03-10'),
        sector: 'Information Technology',
        notes: 'IT sector leader',
      },
      {
        userId: demoUser._id,
        portfolioId: longTerm._id,
        ticker: 'HDFCBANK.NS',
        companyName: 'HDFC Bank Ltd',
        quantity: 75,
        buyPrice: 1580,
        buyDate: new Date('2023-09-01'),
        sector: 'Financial Services',
        notes: 'Banking sector core holding',
      },
      {
        userId: demoUser._id,
        portfolioId: longTerm._id,
        ticker: 'INFY.NS',
        companyName: 'Infosys Ltd',
        quantity: 40,
        buyPrice: 1450,
        buyDate: new Date('2023-11-20'),
        sector: 'Information Technology',
        notes: 'IT services giant',
      },
      // Swing Trades Portfolio
      {
        userId: demoUser._id,
        portfolioId: swing._id,
        ticker: 'WIPRO.NS',
        companyName: 'Wipro Ltd',
        quantity: 100,
        buyPrice: 440,
        buyDate: new Date('2024-01-08'),
        sector: 'Information Technology',
        notes: 'IT recovery play',
      },
      {
        userId: demoUser._id,
        portfolioId: swing._id,
        ticker: 'ITC.NS',
        companyName: 'ITC Ltd',
        quantity: 200,
        buyPrice: 420,
        buyDate: new Date('2024-02-14'),
        sector: 'FMCG',
        notes: 'Consumer staples diversification',
      },
    ]);
    console.log(`📈 Created ${holdings.length} holdings`);

    // ─── Create Portfolios + Holdings for Extra Users ──────────────────────
    const alicePort = await Portfolio.create({ userId: alice._id, name: 'Growth', description: 'Alice growth picks' });
    await Holding.create([
      { userId: alice._id, portfolioId: alicePort._id, ticker: 'TATAMOTORS.NS', companyName: 'Tata Motors Ltd', quantity: 120, buyPrice: 540, buyDate: new Date('2023-05-20'), sector: 'Automotive' },
      { userId: alice._id, portfolioId: alicePort._id, ticker: 'BAJFINANCE.NS', companyName: 'Bajaj Finance Ltd', quantity: 15, buyPrice: 6200, buyDate: new Date('2023-08-11'), sector: 'Financial Services' },
    ]);
    await Transaction.create([
      { userId: alice._id, portfolioId: alicePort._id, ticker: 'TATAMOTORS.NS', companyName: 'Tata Motors Ltd', type: 'buy', quantity: 120, price: 540, date: new Date('2023-05-20') },
      { userId: alice._id, portfolioId: alicePort._id, ticker: 'BAJFINANCE.NS', companyName: 'Bajaj Finance Ltd', type: 'buy', quantity: 15, price: 6200, date: new Date('2023-08-11') },
    ]);

    const bobPort = await Portfolio.create({ userId: bob._id, name: 'Core', description: 'Bob core holdings' });
    await Holding.create([
      { userId: bob._id, portfolioId: bobPort._id, ticker: 'WIPRO.NS', companyName: 'Wipro Ltd', quantity: 300, buyPrice: 480, buyDate: new Date('2024-03-02'), sector: 'Information Technology' },
    ]);
    await Transaction.create([
      { userId: bob._id, portfolioId: bobPort._id, ticker: 'WIPRO.NS', companyName: 'Wipro Ltd', type: 'buy', quantity: 300, price: 480, date: new Date('2024-03-02') },
    ]);

    const carolPort = await Portfolio.create({ userId: carol._id, name: 'Value', description: 'Carol value picks' });
    await Holding.create([
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'TITAN.NS', companyName: 'Titan Company Ltd', quantity: 40, buyPrice: 2900, buyDate: new Date('2023-02-09'), sector: 'Consumer' },
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'SUNPHARMA.NS', companyName: 'Sun Pharmaceutical Industries Ltd', quantity: 60, buyPrice: 1200, buyDate: new Date('2023-07-19'), sector: 'Healthcare' },
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'ICICIBANK.NS', companyName: 'ICICI Bank Ltd', quantity: 80, buyPrice: 980, buyDate: new Date('2023-12-01'), sector: 'Financial Services' },
    ]);
    await Transaction.create([
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'TITAN.NS', companyName: 'Titan Company Ltd', type: 'buy', quantity: 40, price: 2900, date: new Date('2023-02-09') },
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'SUNPHARMA.NS', companyName: 'Sun Pharmaceutical Industries Ltd', type: 'buy', quantity: 60, price: 1200, date: new Date('2023-07-19') },
      { userId: carol._id, portfolioId: carolPort._id, ticker: 'ICICIBANK.NS', companyName: 'ICICI Bank Ltd', type: 'buy', quantity: 80, price: 980, date: new Date('2023-12-01') },
    ]);
    console.log('👤 Created 3 extra leaderboard users with holdings');

    // ─── Create Transactions ────────────────────────────────────────────────
    await Transaction.create([
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'RELIANCE.NS', companyName: 'Reliance Industries Ltd', type: 'buy', quantity: 50, price: 2450, date: new Date('2023-06-15') },
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'TCS.NS', companyName: 'Tata Consultancy Services Ltd', type: 'buy', quantity: 20, price: 3200, date: new Date('2023-03-10') },
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'HDFCBANK.NS', companyName: 'HDFC Bank Ltd', type: 'buy', quantity: 75, price: 1580, date: new Date('2023-09-01') },
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'INFY.NS', companyName: 'Infosys Ltd', type: 'buy', quantity: 40, price: 1450, date: new Date('2023-11-20') },
      { userId: demoUser._id, portfolioId: swing._id, ticker: 'WIPRO.NS', companyName: 'Wipro Ltd', type: 'buy', quantity: 100, price: 440, date: new Date('2024-01-08') },
      { userId: demoUser._id, portfolioId: swing._id, ticker: 'ITC.NS', companyName: 'ITC Ltd', type: 'buy', quantity: 200, price: 420, date: new Date('2024-02-14') },
      // A partial sell of TCS at a profit to realize gains (long-term: held > 1y)
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'TCS.NS', companyName: 'Tata Consultancy Services Ltd', type: 'sell', quantity: 8, price: 3850, date: new Date('2024-06-10'), notes: 'Partial profit booking' },
    ]);
    // Reflect the TCS partial sell in the demo user's holding + cash
    await Holding.updateOne(
      { userId: demoUser._id, portfolioId: longTerm._id, ticker: 'TCS.NS' },
      { $inc: { quantity: -8 } }
    );
    await User.updateOne({ _id: demoUser._id }, { $inc: { virtualCash: 8 * 3850 } });
    console.log('💳 Created transactions');

    // ─── Create Watchlist ──────────────────────────────────────────────────
    await Watchlist.create([
      { userId: demoUser._id, ticker: 'BAJFINANCE.NS', companyName: 'Bajaj Finance Ltd', notes: 'NBFC leader — watch for entry below ₹6500', targetPrice: 6500 },
      { userId: demoUser._id, ticker: 'ADANIENT.NS', companyName: 'Adani Enterprises Ltd', notes: 'Infrastructure mega-play', targetPrice: null },
      { userId: demoUser._id, ticker: 'MARUTI.NS', companyName: 'Maruti Suzuki India Ltd', notes: 'Auto sector recovery', targetPrice: 10000 },
      { userId: demoUser._id, ticker: 'SUNPHARMA.NS', companyName: 'Sun Pharmaceutical Industries Ltd', notes: 'Pharma bellwether', targetPrice: null },
      { userId: demoUser._id, ticker: 'TATAMOTORS.NS', companyName: 'Tata Motors Ltd', notes: 'EV transition story', targetPrice: 900 },
    ]);
    console.log('👁  Created watchlist entries');

    // ─── Create Sample Alerts ─────────────────────────────────────────────
    await Alert.create([
      { userId: demoUser._id, ticker: 'BAJFINANCE.NS', companyName: 'Bajaj Finance Ltd', condition: 'below', targetPrice: 6500, channel: 'inapp', note: 'Buy zone entry' },
      { userId: demoUser._id, ticker: 'TATAMOTORS.NS', companyName: 'Tata Motors Ltd', condition: 'above', targetPrice: 1100, channel: 'inapp', note: 'Partial exit' },
    ]);
    console.log('🔔 Created sample alerts');

    // ─── Award Starter Badges ────────────────────────────────────────────
    await Badge.create([
      { userId: demoUser._id, type: 'first_trade' },
      { userId: alice._id, type: 'first_trade' },
      { userId: bob._id, type: 'first_trade' },
      { userId: carol._id, type: 'first_trade' },
    ]);
    console.log('🏅 Awarded starter badges');

    console.log('\n✅ Seed complete! Your portfolios are ready.');
    console.log('   Run the app with: npm run dev (in /server)');
    console.log('   Then start the client: npm run dev (in /client)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
