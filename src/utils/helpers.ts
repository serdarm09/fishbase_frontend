import { BoatType, BOAT_CONFIGS } from '@/types';

/**
 * Format ETH amount for display
 */
export function formatEth(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(4) + ' ETH';
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Calculate streak multiplier based on day
 */
export function calculateStreakMultiplier(streakDay: number): number {
  if (streakDay >= 100) return 10.0;
  if (streakDay >= 30) return 5.0;
  if (streakDay >= 14) return 3.0;
  if (streakDay >= 7) return 2.0;
  
  // Linear progression from 1.0x to 1.5x for days 1-6
  return 1.0 + (streakDay - 1) * 0.1;
}

/**
 * Calculate XP with decay and bonuses
 */
export function calculateXP(
  baseXP: number,
  daysSinceLastMove: number,
  hasMovementBonus: boolean,
  movementBonusDaysLeft: number
): number {
  let xp = baseXP;
  
  // Apply decay for stationary boats
  if (daysSinceLastMove > 0) {
    const decayRate = 0.05; // 5% per day
    xp = xp * Math.pow(1 - decayRate, daysSinceLastMove);
  }
  
  // Apply movement bonus
  if (hasMovementBonus && movementBonusDaysLeft > 0) {
    xp = xp * 2.0; // 100% bonus
  }
  
  return Math.floor(xp);
}

/**
 * Calculate daily reward
 */
export function calculateDailyReward(
  boatType: BoatType,
  currentXP: number,
  streakDay: number
): number {
  const baseReward = BOAT_CONFIGS[boatType].dailyXp;
  const streakMultiplier = calculateStreakMultiplier(streakDay);
  const xpMultiplier = currentXP / BOAT_CONFIGS[boatType].dailyXp;
  
  return Math.floor(baseReward * xpMultiplier * streakMultiplier);
}

/**
 * Check if position is valid on the grid
 */
export function isValidPosition(x: number, y: number, gridSize: number = 100): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

/**
 * Generate grid key for position
 */
export function getGridKey(x: number, y: number): string {
  return `${x}:${y}`;
}

/**
 * Parse grid key to coordinates
 */
export function parseGridKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(':').map(Number);
  return { x, y };
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Get boat emoji by type
 */
export function getBoatEmoji(boatType: BoatType): string {
  const emojis = {
    [BoatType.DINGHY]: '🚣',
    [BoatType.SAILBOAT]: '⛵',
    [BoatType.YACHT]: '🛥️',
    [BoatType.TRAWLER]: '🚢',
    [BoatType.MEGASHIP]: '🚢',
  };
  return emojis[boatType] || '🚣';
}

/**
 * Get time until next claim
 */
export function getTimeUntilNextClaim(lastClaimDate?: Date): {
  canClaim: boolean;
  timeLeft: string;
  hoursLeft: number;
} {
  if (!lastClaimDate) {
    return { canClaim: true, timeLeft: '0h 0m', hoursLeft: 0 };
  }
  
  const now = new Date();
  const nextClaimTime = new Date(lastClaimDate);
  nextClaimTime.setHours(nextClaimTime.getHours() + 24);
  
  const timeDiff = nextClaimTime.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return { canClaim: true, timeLeft: '0h 0m', hoursLeft: 0 };
  }
  
  const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    canClaim: false,
    timeLeft: `${hoursLeft}h ${minutesLeft}m`,
    hoursLeft: hoursLeft + minutesLeft / 60,
  };
}

/**
 * Validate environment variables
 */
export function validateEnvVars(): void {
  const required = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_BASE_RPC_URL',
    'NEXT_PUBLIC_CHAIN_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate random position on grid
 */
export function generateRandomPosition(gridSize: number = 100): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  };
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get days between two dates
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Switch wallet to Base Mainnet (8453), or automatically add it if unrecognized (error 4902).
 */
export async function ensureBaseNetwork(ethereum: any): Promise<void> {
  if (!ethereum) return;
  const chainIdHex = '0x2105'; // 8453
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: any) {
    if (err.code === 4902 || err?.data?.originalError?.code === 4902 || err?.message?.includes('4902') || err?.message?.includes('unrecognized') || err?.message?.includes('not added')) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: 'Base Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org', 'https://base.llamarpc.com'],
              blockExplorerUrls: ['https://basescan.org'],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add Base Mainnet to wallet:', addError);
      }
    } else {
      console.warn('Network switch warning:', err);
    }
  }
}
