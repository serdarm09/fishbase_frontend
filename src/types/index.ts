// User & Boost Types
export type BoostLevel = 'NONE' | 'BOOST_20' | 'BOOST_30' | 'BOOST_40';

export interface BoostInfo {
  level: BoostLevel;
  multiplier: number;
  name?: string;
  image?: string | null;
}

export interface ProfileData {
  bio?: string;
  avatar?: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface MapPosition {
  x: number | null;
  y: number | null;
  lastMoved?: string | null;
}

export enum BoatType {
  DINGHY = 'DINGHY',
  SAILBOAT = 'SAILBOAT',
  YACHT = 'YACHT',
  TRAWLER = 'TRAWLER',
  MEGASHIP = 'MEGASHIP',
}

export interface OwnedBoat {
  tokenId: number;
  boatType: BoatType;
  name: string;
  dailyXp: number;
  image?: string | null;
  isActive: boolean;
  position: {
    x: number | null;
    y: number | null;
    lastMoved?: string | null;
  } | null;
  stats?: {
    totalXpEarned: number;
    daysActive: number;
    timesMoved: number;
  };
}

export interface ActiveBoat extends OwnedBoat {
  mapX: number | null;
  mapY: number | null;
  lastMoved: string | null;
}

export interface UserProfile {
  id: string;
  fid?: number | null;
  username: string;
  walletAddress: string;
  totalXp: number;
  totalFish: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xpToNextLevel: number;
  canClaimDaily: boolean;
  profileData?: ProfileData;
  mapPosition?: MapPosition | null;
  achievements?: Achievement[];
  activeBoat?: ActiveBoat | null;
  boats?: OwnedBoat[];
  boost?: BoostInfo;
  lastClaimDate?: string | null;
  miniGame?: {
    highScore: number;
    bestReactionMs?: number | null;
    totalGames: number;
    totalScore?: number;
    lastScore?: number;
    lastPlayedAt?: string | null;
  };
}

export interface BoatPlacement {
  id: string;
  owner: string;
  ownerUsername: string;
  x: number;
  y: number;
  boatType: BoatType;
  xp: number;
  placedAt: string;
  boostLevel: BoostLevel;
  boostImage?: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface StatCardData {
  icon: string;
  label: string;
  value: string | number;
  helper?: string;
  accent?: 'blue' | 'sun' | 'green' | 'purple';
}

export interface FarcasterAuth {
  fid: number;
  username: string;
  custody_address: string;
  pfp_url?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  login: (farcasterData: FarcasterAuth) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar?: string;
  displayName?: string;
  totalXp?: number;
  level?: number;
  currentStreak?: number;
  longestStreak?: number;
  highScore?: number;
  bestReactionMs?: number | null;
  totalGames?: number;
  fid?: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  totalPlayers?: number;
}

export interface FishingLeaderboardPayload {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userHighScore: number | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BoatConfig {
  type: BoatType;
  name: string;
  dailyXp: number;
  price: string;
  description: string;
  image: string;
}

export interface ContractAddresses {
  fishToken: string;
  boatNFT: string;
  gameController: string;
}

// Game Types
export interface GameState {
  player: UserProfile;
  currentBoat?: BoatPlacement;
  dailyClaimStatus: ClaimStatus;
  streak: number;
  totalFish: number;
  xpRate: number;
}

export interface ClaimStatus {
  canClaim: boolean;
  lastClaimDate?: Date;
  nextClaimAmount: number;
  streakMultiplier: number;
}

export interface DailyClaim {
  _id: string;
  userId: string;
  claimDate: Date;
  fishEarned: number;
  streakDay: number;
  multiplier: number;
  boatBonus: number;
  createdAt: Date;
}

// Transaction Types
export interface Transaction {
  _id: string;
  userId: string;
  txHash: string;
  txType: 'place_boat' | 'mint_nft' | 'claim_fish' | 'relocate_boat';
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

// Map Types
export interface MapProps {
  gridSize: { width: number; height: number };
  boats: BoatPlacement[];
  onBoatPlace: (x: number, y: number) => void;
  onBoatSelect: (boat: BoatPlacement) => void;
  playerBoat?: BoatPlacement;
}

// Error Types
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

// Constants
export const BOAT_CONFIGS: Record<BoatType, BoatConfig> = {
  [BoatType.DINGHY]: {
    type: BoatType.DINGHY,
    name: 'Dinghy',
    dailyXp: 10,
    price: '0.01',
    description: 'A small but reliable fishing boat',
    image: '/boats/dinghy.png'
  },
  [BoatType.SAILBOAT]: {
    type: BoatType.SAILBOAT,
    name: 'Sailboat',
    dailyXp: 25,
    price: '0.025',
    description: 'Harness the wind for better fishing',
    image: '/boats/sailboat.png'
  },
  [BoatType.YACHT]: {
    type: BoatType.YACHT,
    name: 'Yacht',
    dailyXp: 50,
    price: '0.05',
    description: 'Luxury fishing with premium rewards',
    image: '/boats/yacht.png'
  },
  [BoatType.TRAWLER]: {
    type: BoatType.TRAWLER,
    name: 'Trawler',
    dailyXp: 100,
    price: '0.1',
    description: 'Commercial-grade fishing vessel',
    image: '/boats/trawler.png'
  },
  [BoatType.MEGASHIP]: {
    type: BoatType.MEGASHIP,
    name: 'Mega Ship',
    dailyXp: 200,
    price: '0.2',
    description: 'The ultimate fishing experience',
    image: '/boats/megaship.png'
  }
};

export const GRID_SIZE = 100;
export const PLACEMENT_FEE = '0.001'; // ETH
