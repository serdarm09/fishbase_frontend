'use client';

import { FormEvent, useEffect, useState } from 'react';
import { nftApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { BoatType } from '@/types';

type MarketplaceBoat = {
  type: BoatType | string;
  name: string;
  dailyXp: number;
  price: string;
  description: string;
  boost: string;
  rarity: string;
  image: string;
};

type UserBoat = {
  id: string;
  tokenId: number;
  boatType: BoatType | string;
  name: string;
  dailyXp: number;
  position: { x: number | null; y: number | null } | null;
  isActive: boolean;
  image?: string | null;
  stats?: { totalXpEarned: number; daysActive: number; timesMoved?: number };
};

const rarityBadgeColor: Record<string, string> = {
  Common: 'badge',
  Rare: 'badge',
  Epic: 'badge',
  Legendary: 'badge',
};

type BoostItem = {
  id: number;
  level: string;
  name: string;
  multiplier: number;
  priceEth: string;
  image: string;
};

export default function NftMintPage() {
  const { token } = useAuth();
  const [marketplace, setMarketplace] = useState<MarketplaceBoat[]>([]);
  const [boats, setBoats] = useState<UserBoat[]>([]);
  const [boosts, setBoosts] = useState<BoostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    tokenId: '',
    boatType: 'SAILBOAT',
    dailyXp: '',
    name: '',
    image: '',
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [marketplaceRes, boatsRes] = await Promise.all([
        nftApi.getMarketplace(token),
        nftApi.getUserBoats(token),
      ]);
      setMarketplace(marketplaceRes.marketplace.boats);
      setBoosts(marketplaceRes.marketplace.boosts || []);
      setBoats(
        (boatsRes.boats || []).map((boat: any) => ({
          id: `boat-${boat.tokenId}`,
          tokenId: boat.tokenId,
          boatType: boat.boatType || boat.type,
          name: boat.name || boat.boatType || boat.type,
          dailyXp: boat.dailyXp,
          position: boat.position || null,
          isActive: boat.isActive,
          image: boat.image || null,
          stats: boat.stats || { totalXpEarned: 0, daysActive: 0, timesMoved: 0 },
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Unable to load NFT data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleActivate = async (tokenId: number) => {
    if (!token) return;
    try {
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);
      await nftApi.activateBoat(token, tokenId);
      setSuccess(`Boat #${tokenId} is now active.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate the boat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      await nftApi.registerBoat(token, {
        tokenId: Number(registerForm.tokenId),
        boatType: registerForm.boatType,
        dailyXp: Number(registerForm.dailyXp),
        name: registerForm.name || undefined,
        image: registerForm.image || undefined,
      });

      setSuccess(`Boat #${registerForm.tokenId} was registered successfully.`);
      setRegisterForm({
        tokenId: '',
        boatType: 'SAILBOAT',
        dailyXp: '',
        name: '',
        image: '',
      });

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to register the boat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="ocean-card space-y-3">
        <h1 className="page-heading">
          NFT Hangar
          <span className="badge">Five boat classes</span>
        </h1>
        <p className="page-subtitle">
          Discover the FishBase boat collection. Mint on Base and manage your fleet directly from here.
        </p>
      </header>

      {error && (
        <div className="ocean-card border-red-500/40 bg-red-50/85 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="ocean-card border-green-500/40 bg-green-100/70 text-green-700">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="ocean-card text-sm text-gray-600">
          Loading marketplace data <span className="loading-dots" />
        </div>
      ) : (
        <>
          <section className="ocean-card space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🚀 Boats available to mint
            </h2>

            <div className="grid grid-cols-1 grid-md-2 gap-4">
              {marketplace.map((boat) => (
                <div key={boat.type} className="ocean-card border bg-white/85 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      {boat.name}
                      <span className={rarityBadgeColor[boat.rarity] || 'badge'}>{boat.rarity}</span>
                    </h3>
                    <span className="text-sm text-blue-600 font-semibold">{boat.price} ETH</span>
                  </div>
                  <p className="text-sm text-gray-600">{boat.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="chip">{boat.dailyXp} XP / day</span>
                    <span className="chip">{boat.boost}</span>
                    <span className="chip">Base network</span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button text-sm"
                    onClick={() =>
                      window.open('https://basescan.org/address/your-contract-address', '_blank')
                    }
                  >
                    View contract on BaseScan
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="ocean-card space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🌟 Boost NFTs
            </h2>
            <p className="text-sm text-gray-600">
              Mint one boost NFT to permanently increase your daily XP. You can only benefit from the
              highest boost you hold inside your wallet.
            </p>
            <div className="grid grid-cols-1 grid-md-3 gap-3">
              {boosts.map((boost) => (
                <div key={boost.level} className="ocean-card border bg-white/85 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-700">{boost.name}</h3>
                    <span className="chip">{boost.priceEth} ETH</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={boost.image}
                      alt={boost.name}
                      className="w-16 h-16 rounded-lg border border-blue-200 object-cover"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Level: {boost.level.replace('BOOST_', '')}</p>
                      <p className="text-sm text-blue-600 font-semibold">
                        +{Math.round(boost.multiplier * 100)}% XP bonus
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Hold the NFT in your wallet to keep the boost active. Sell it to transfer the buff to
                    another captain.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="ocean-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                ⚓ Boats in your collection
              </h2>
              <span className="chip">{boats.length} boats minted</span>
            </div>

            {boats.length === 0 ? (
              <div className="empty-state">
                You have not minted any boats yet. Choose one from the hangar to start sailing!
              </div>
            ) : (
              <div className="grid grid-cols-1 grid-md-2 gap-3">
                {boats.map((boat) => (
                  <div
                    key={boat.tokenId}
                    className={`ocean-card border p-4 space-y-2 ${
                      boat.isActive ? 'border-blue-300 shadow-lg' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          #{boat.tokenId} • {boat.name}
                          {boat.isActive && <span className="badge">Active</span>}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {boat.position
                            ? `Position: (${boat.position.x}, ${boat.position.y})`
                            : 'Not placed on the map'}
                        </p>
                      </div>
                      <span className="text-2xl" aria-hidden="true">
                        {boat.boatType === 'MEGASHIP'
                          ? '🛳️'
                          : boat.boatType === 'TRAWLER'
                          ? '🚢'
                          : boat.boatType === 'YACHT'
                          ? '🛥️'
                          : boat.boatType === 'SAILBOAT'
                          ? '⛵'
                          : '🚣'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>Daily XP: {boat.dailyXp}</span>
                      <span>Total XP: {boat.stats?.totalXpEarned || 0}</span>
                    </div>
                    {!boat.isActive && (
                      <button
                        type="button"
                        className="primary-button text-sm"
                        onClick={() => handleActivate(boat.tokenId)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Activating...' : 'Activate this boat'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ocean-card space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📝 Register a freshly minted boat
            </h2>
            <p className="text-sm text-gray-600">
              After minting on Base, log the token details below so FishBase can attach XP rewards and map
              placement to your vessel.
            </p>
            <form onSubmit={handleRegister} className="grid grid-cols-1 grid-md-2 gap-3">
              <label className="text-sm text-gray-600">
                Token ID
                <input
                  type="number"
                  required
                  value={registerForm.tokenId}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, tokenId: event.target.value }))
                  }
                  className="w-full mt-1 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="text-sm text-gray-600">
                Boat type
                <select
                  value={registerForm.boatType}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, boatType: event.target.value }))
                  }
                  className="w-full mt-1 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {marketplace.map((boat) => (
                    <option key={boat.type} value={boat.type}>
                      {boat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Daily XP reward
                <input
                  type="number"
                  required
                  value={registerForm.dailyXp}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, dailyXp: event.target.value }))
                  }
                  placeholder="e.g. 36"
                  className="w-full mt-1 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="text-sm text-gray-600">
                Display name (optional)
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Golden Sailboat"
                  className="w-full mt-1 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="text-sm text-gray-600">
                Image URL (optional)
                <input
                  type="text"
                  value={registerForm.image}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full mt-1 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <div className="grid grid-cols-1 gap-2 col-span-full">
                <button
                  type="submit"
                  className="primary-button justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Register minted boat'}
                </button>
                <p className="text-xs text-gray-500">
                  Only register boats you fully control; the backend will sync ownership via your wallet.
                </p>
              </div>
            </form>
          </section>
        </>
      )}
    </section>
  );
}

