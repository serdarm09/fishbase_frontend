const resolveApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
  const trimmed = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = resolveApiBase();

type FetchOptions = RequestInit & { token?: string };

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson
    ? await response.json().catch(() => ({}))
    : { error: await response.text() };

  if (!response.ok || data.success === false) {
    const errorMessage = data.error || data.message || 'Request failed';
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

