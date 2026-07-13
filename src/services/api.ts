const resolveApiBase = () => {
  const fallback =
    typeof window !== 'undefined' &&
    ['fishbase.fun', 'www.fishbase.fun'].includes(window.location.hostname)
      ? 'https://api.fishbase.fun'
      : 'http://localhost:5000';
  const raw = process.env.NEXT_PUBLIC_API_URL || fallback;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const trimmed = withProtocol.endsWith('/') ? withProtocol.slice(0, -1) : withProtocol;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = resolveApiBase();
const AUTH_EXPIRED_EVENT = 'fishbase:auth-expired';

type FetchOptions = RequestInit & { token?: string };

function notifyAuthExpired() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

function normalizeAuthToken(token?: string) {
  if (!token) return undefined;

  const normalized = String(token).trim().replace(/^Bearer\s+/i, '');
  if (!normalized || /[\r\n]/.test(normalized)) {
    notifyAuthExpired();
    throw new Error('Your session is invalid. Please connect your wallet again.');
  }

  return normalized;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken = normalizeAuthToken(token);
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(headers || {}),
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Network request failed';
    console.error('API connection failed', { apiBase: API_BASE, details });
    throw new Error('Unable to connect to FishBase servers. Please try again shortly.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson
    ? await response.json().catch(() => ({}))
    : { error: await response.text() };

  if (!response.ok || data.success === false) {
    const errorMessage = data.error || data.message || 'Request failed';

    if (
      response.status === 401 &&
      /token expired|invalid token|access denied/i.test(errorMessage)
    ) {
      notifyAuthExpired();
    }

    throw new Error(errorMessage);
  }

  return data as T;
}

export const authApi = {
  async walletChallenge(payload: {
    walletAddress: string;
    domain?: string;
    uri?: string;
    chainId?: number;
  }) {
    return request<{
      success: boolean;
      nonce: string;
      message: string;
      expiresAt: string;
    }>('/auth/wallet-challenge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async walletLogin(payload: {
    walletAddress: string;
    message: string;
    signature: string;
    nonce: string;
  }) {
    return request<{ success: boolean; token: string; user: any }>('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async farcasterLogin(payload: {
    message: string;
    signature: string;
    nonce?: string;
    fid?: number;
    username?: string;
    custody_address?: string;
    pfp_url?: string;
  }) {
    return request<{ success: boolean; token: string; user: any }>('/auth/farcaster', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const gameApi = {
  async getProfile(token: string) {
    return request<{ success: boolean; profile: any }>('/game/profile', { token });
  },
  async updateProfile(
    token: string,
    payload: { username?: string; displayName?: string }
  ) {
    return request<{ success: boolean; profile: any }>('/game/profile', {
      token,
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async getStats(token: string) {
    return request<{ success: boolean; stats: any }>('/game/stats', { token });
  },
  async getMap(token: string) {
    return request<{ success: boolean; map: any }>('/game/map', { token });
  },
  async placeBoat(
    token: string,
    payload: { x: number; y: number; lat?: number; lng?: number; placementTxHash: string }
  ) {
    return request<{ success: boolean; placement: any }>('/game/place-boat', {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async moveBoat(
    token: string,
    payload: { x: number; y: number; lat?: number; lng?: number; placementTxHash: string }
  ) {
    return request<{ success: boolean; movement: any }>('/game/move-boat', {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async claimDaily(token: string) {
    return request<{ success: boolean; claim: any }>('/game/claim-daily', {
      token,
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async submitFishingScore(
    token: string,
    payload: { score: number; reactionMs?: number }
  ) {
    return request<{
      success: boolean;
      result: {
        xpAward: number;
        highScore: number;
        totalGames: number;
        averageScore: number;
        rank: number | null;
      };
    }>('/game/fishing-score', {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async applyReferral(token: string, payload: { code: string }) {
    return request<{
      success: boolean;
      referral: {
        referrerUsername: string;
        xpAwarded: number;
        totalXp: number;
      };
    }>('/game/referral/apply', {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const leaderboardApi = {
  async getXpLeaderboard(token: string | null, params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString() ? `?${searchParams}` : '';

    return request<{ success: boolean; leaderboard: any }>(`/leaderboard/xp${query}`, {
      token: token ?? undefined,
    });
  },
  async getStreakLeaderboard() {
    return request<{ success: boolean; streakLeaderboard: any }>('/leaderboard/streaks');
  },
  async getBoatLeaderboard(params?: { limit?: number; boatType?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.boatType) searchParams.set('boatType', params.boatType);
    const query = searchParams.toString() ? `?${searchParams}` : '';
    return request<{ success: boolean; boatLeaderboard: any }>(`/leaderboard/boats${query}`);
  },
  async getStats() {
    return request<{ success: boolean; stats: any }>('/leaderboard/stats');
  },
  async getFishingLeaderboard(token?: string | null, params?: { limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString() ? `?${searchParams}` : '';

    return request<{
      success: boolean;
      fishingLeaderboard: {
        entries: Array<{
          rank: number;
          username: string;
          displayName?: string;
          avatar?: string;
          fid?: number;
          highScore: number;
          bestReactionMs?: number | null;
          totalGames: number;
        }>;
        userRank: number | null;
        userHighScore: number | null;
      };
    }>(`/leaderboard/fishing${query}`, { token: token ?? undefined });
  },
};

export const nftApi = {
  async getMarketplace(token: string) {
    return request<{ success: boolean; marketplace: any }>('/nft/marketplace', { token });
  },
  async getUserBoats(token: string) {
    return request<{ success: boolean; boats: any[] }>('/nft/boats', { token });
  },
  async activateBoat(token: string, tokenId: number) {
    return request<{ success: boolean; message: string; activeBoat: any }>(
      `/nft/boats/${tokenId}/activate`,
      { token, method: 'POST' }
    );
  },
  async registerBoat(
    token: string,
    payload: {
      tokenId: number;
      boatType: string;
      dailyXp: number;
      name?: string;
      image?: string;
    }
  ) {
    return request<{ success: boolean; boat: any }>('/nft/register-boat', {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

