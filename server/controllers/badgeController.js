const Badge = require('../models/Badge');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { getAccountState } = require('../services/tradingService');

const BADGE_DEFINITIONS = {
  first_trade: {
    label: 'First Steps',
    icon: '🎯',
    description: 'Place your first trade',
  },
  ten_trades: {
    label: 'Active Trader',
    icon: '⚡',
    description: 'Complete 10 trades',
  },
  fifty_trades: {
    label: 'Market Maverick',
    icon: '🔥',
    description: 'Complete 50 trades',
  },
  profit_master: {
    label: 'Profit Master',
    icon: '💰',
    description: 'Grow your paper account above starting balance',
  },
  whale: {
    label: 'Whale',
    icon: '🐋',
    description: 'Double your paper account value',
  },
  diversified: {
    label: 'Diversified',
    icon: '🌐',
    description: 'Hold 5 or more distinct stocks',
  },
  diamond_hands: {
    label: 'Diamond Hands',
    icon: '💎',
    description: 'Hold a position for over a year',
  },
};

const DAY_MS = 1000 * 60 * 60 * 24;

exports.getBadges = async (req, res) => {
  try {
    const awarded = await Badge.find({ userId: req.user.id });
    const data = Object.entries(BADGE_DEFINITIONS).map(([type, def]) => {
      const a = awarded.find((b) => b.type === type);
      return {
        type,
        label: def.label,
        icon: def.icon,
        description: def.description,
        earned: !!a,
        awardedAt: a ? a.awardedAt : null,
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.evaluateBadges = async (req, res) => {
  try {
    const [txnCount, holdings, account] = await Promise.all([
      Transaction.countDocuments({ userId: req.user.id }),
      Holding.find({ userId: req.user.id }),
      getAccountState(req.user.id).catch(() => null),
    ]);

    const distinctTickers = new Set(holdings.map((h) => h.ticker)).size;
    const hasLongHold = holdings.some(
      (h) => h.buyDate && Date.now() - new Date(h.buyDate).getTime() >= 365 * DAY_MS
    );
    const accountValue = account ? account.totalAccountValue : 0;
    const startingCash = account ? account.startingCash : 0;

    const checks = {
      first_trade: txnCount >= 1,
      ten_trades: txnCount >= 10,
      fifty_trades: txnCount >= 50,
      profit_master: account ? account.totalPnL > 0 : false,
      whale: accountValue >= startingCash * 2 && startingCash > 0,
      diversified: distinctTickers >= 5,
      diamond_hands: hasLongHold,
    };

    const newlyAwarded = [];
    for (const [type, passes] of Object.entries(checks)) {
      if (!passes) continue;
      const existing = await Badge.findOne({ userId: req.user.id, type });
      if (!existing) {
        await Badge.create({ userId: req.user.id, type });
        newlyAwarded.push(type);
      }
    }

    const awarded = await Badge.find({ userId: req.user.id });
    const data = Object.entries(BADGE_DEFINITIONS).map(([type, def]) => {
      const a = awarded.find((b) => b.type === type);
      return {
        type,
        label: def.label,
        icon: def.icon,
        description: def.description,
        earned: !!a,
        awardedAt: a ? a.awardedAt : null,
      };
    });

    res.json({
      success: true,
      data,
      newlyAwarded,
      stats: { txnCount, distinctTickers, accountValue, startingCash },
    });
  } catch (err) {
    console.error('[Badges]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.BADGE_DEFINITIONS = BADGE_DEFINITIONS;
