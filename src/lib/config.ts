export const config = {
  // Blockchain
  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453'),
    contracts: {
      fishToken: process.env.NEXT_PUBLIC_FISH_TOKEN_ADDRESS || '',
      boatNFT: process.env.NEXT_PUBLIC_BOAT_NFT_ADDRESS || '',
      gameController: process.env.NEXT_PUBLIC_GAME_CONTROLLER_ADDRESS || '',
      boostNFT: process.env.NEXT_PUBLIC_BOOST_NFT_ADDRESS || '',
      usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
    },
  },

  // App
  app: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://fishbase.app',
    baseAppId: process.env.NEXT_PUBLIC_BASE_APP_ID || '6a01ca209ee68cd142d1b1ac',
    environment: process.env.NODE_ENV || 'development',
  },

  // Game Settings
  game: {
    gridSize: 100,
    placementFee: '0.001', // ETH
    xpDecayRate: 0.05, // 5% per day
    movementBonusDays: 3,
    movementBonusMultiplier: 2.0, // 100% bonus
    streakMilestones: {
      7: { multiplier: 2.0, reward: 'badge_nft' },
      14: { multiplier: 3.0, reward: 'rare_badge' },
      30: { multiplier: 5.0, reward: 'legendary_skin' },
      100: { multiplier: 10.0, reward: 'custom_boat' },
    },
  },

  // Rate Limiting
  rateLimits: {
    auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 per 15min
    claimDaily: { windowMs: 24 * 60 * 60 * 1000, max: 1 }, // 1 per day
    placeBoat: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 per hour
    default: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 per 15min
  },

  // Cache TTL (in seconds)
  cache: {
    userSession: 24 * 60 * 60, // 24 hours
    mapState: 5 * 60, // 5 minutes
    leaderboard: 60, // 1 minute
    boatData: 10 * 60, // 10 minutes
  },
};

// Validation
export default config;
