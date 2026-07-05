'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { gameApi, nftApi } from '@/services/api';
import { StatCard } from '@/components/dashboard/StatCard';
import type { UserProfile, OwnedBoat, BoostInfo } from '@/types';
import BoatSVG, { boatLabel, type BoatTypeName } from '@/components/boats/BoatSVG';

const numberFormatter = new Intl.NumberFormat('en-US');

const streakMilestones = [
  { days: 1, label: 'First Day' },
  { days: 3, label: 'Warmed Up' },
  { days: 7, label: 'Weekly Bonus' },
  { days: 14, label: 'Strong Angler' },
  { days: 30, label: 'Legendary Streak' },
];

type GameStats = {
  totalXp: number;
  boatsOwned: number;
  totalXpEarned: number;
  timesMoved: number;
  daysPlayed?: number;
};

export default function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [userBoats, setUserBoats] = useState<OwnedBoat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
  });

  useEffect(() => {
    if (!token) return;

    let ignore = false;
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [profileRes, statsRes, boatsRes] = await Promise.all([
          gameApi.getProfile(token),
          gameApi.getStats(token),
          nftApi.getUserBoats(token),
        ]);

        if (ignore) return;

        const fetchedProfile = profileRes.profile as UserProfile;
        setProfile(fetchedProfile);
        setStats(statsRes.stats);
        setUserBoats(
          (boatsRes.boats || []).map((boat: any) => ({
            ...boat,
            boatType: boat.boatType || boat.type,
            type: boat.boatType || boat.type,
          }))
        );

        updateUser((prev) => ({
          ...prev,
          totalXp: fetchedProfile.totalXp,
          totalFish: fetchedProfile.totalFish,
          currentStreak: fetchedProfile.currentStreak,
          longestStreak: fetchedProfile.longestStreak,
          boost: fetchedProfile.boost,
        }));
      } catch (err: any) {
        console.error(err);
        if (!ignore) {
          setError(err.message || 'Unable to load profile data');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();
    return () => {
      ignore = true;
    };
  }, [token, updateUser]);

  useEffect(() => {
    if (!profile) return;

    setProfileForm({
      username: profile.username || '',
      displayName: profile.profileData?.displayName || '',
    });
  }, [profile]);

  const activeBoat = useMemo(() => {
    if (profile?.activeBoat) return profile.activeBoat;
    return userBoats.find((boat) => boat.isActive);
  }, [profile, userBoats]);

  const avatarUrl = profile?.profileData?.avatar || profile?.profileData?.pfpUrl || '';

  const handleStartProfileEdit = () => {
    if (!profile) return;

    setProfileSaveError(null);
    setProfileForm({
      username: profile.username || '',
      displayName: profile.profileData?.displayName || '',
    });
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setProfileSaveError(null);
    setIsEditingProfile(false);
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        displayName: profile.profileData?.displayName || '',
      });
    }
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !profile) return;

    const username = profileForm.username.trim();
    const displayName = profileForm.displayName.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setProfileSaveError('Kullanıcı adı 3-20 karakter olmalı; sadece harf, sayı ve alt çizgi kullan.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileSaveError(null);

      const response = await gameApi.updateProfile(token, {
        username,
        displayName,
      });
      const updatedProfile = response.profile as UserProfile;

      setProfile(updatedProfile);
      updateUser((prev) => ({
        ...prev,
        username: updatedProfile.username,
        profileData: {
          ...prev.profileData,
          ...updatedProfile.profileData,
        },
      }));
      setIsEditingProfile(false);
    } catch (err: any) {
      const message = err.message || 'Profil güncellenemedi';
      setProfileSaveError(
        message.toLowerCase().includes('already taken')
          ? 'Bu kullanıcı adı alınmış. Başka bir kullanıcı adı seç.'
          : message
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const levelProgress = useMemo(() => {
    if (!profile) return 0;
    const remaining = profile.xpToNextLevel ?? 0;
    const total = profile.totalXp || 0;
    if (total <= 0 || remaining <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((total / (total + remaining)) * 100));
  }, [profile]);

  if (isLoading) {
    return (
      <section className="ocean-card">
        <p className="text-gray-600 text-sm">
          Preparing your captain deck <span className="loading-dots" />
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ocean-card border-red-500/30">
        <p className="text-red-600 font-semibold">Error: {error}</p>
        <button className="primary-button mt-4" onClick={() => location.reload()}>
          Try Again
        </button>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="empty-state">
        <p>Captain profile could not be found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="ocean-card flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-200 border border-blue-200 p-3 text-3xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={profile.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span role="img" aria-hidden="true">
                  🧔‍♂️
                </span>
              )}
            </div>
            <div className="profile-identity">
              {isEditingProfile ? (
                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                  <label className="profile-field">
                    <span>Kullanıcı adı</span>
                    <input
                      value={profileForm.username}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      className="profile-input"
                      maxLength={20}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                  <label className="profile-field">
                    <span>Görünen ad</span>
                    <input
                      value={profileForm.displayName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                      className="profile-input"
                      maxLength={32}
                      autoComplete="name"
                    />
                  </label>
                  {profileSaveError && <p className="profile-error">{profileSaveError}</p>}
                  <div className="profile-edit-actions">
                    <button type="submit" className="primary-button profile-action-button" disabled={isSavingProfile}>
                      {isSavingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button profile-action-button"
                      onClick={handleCancelProfileEdit}
                      disabled={isSavingProfile}
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-heading-row">
                    <h1 className="page-heading">
                      {profile.username}
                      <span className="badge">Level {profile.level}</span>
                    </h1>
                    <button className="secondary-button profile-edit-button" onClick={handleStartProfileEdit}>
                      Düzenle
                    </button>
                  </div>
                  {profile.profileData?.displayName && (
                    <p className="text-base text-sky-300 font-semibold mt-1">{profile.profileData.displayName}</p>
                  )}
                  {user?.farcasterFid && (
                    <p className="page-subtitle">Linked Farcaster FID: {user.farcasterFid}</p>
                  )}
                  <p className="text-sm text-slate-300 mt-2">
                    Wallet: <span className="font-semibold text-white">{profile.walletAddress}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/daily-claim" className="primary-button">
              🎁 Daily Bonus
            </Link>
            <Link href="/map" className="secondary-button">
              🗺️ Open Sea Map
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 grid-md-2 grid-xl-5 gap-3">
          <StatCard
            icon="🐟"
            label="Total XP"
            value={`${numberFormatter.format(profile.totalXp)} XP`}
            helper="Total earned on Base"
            accent="blue"
          />
          <StatCard
            icon="🔥"
            label="Streak"
            value={`${profile.currentStreak} days`}
            helper={`Record: ${profile.longestStreak} days`}
            accent="sun"
          />
          <StatCard
            icon="⚓"
            label="Active Boat"
            value={activeBoat ? activeBoat.boatType : 'No boat selected'}
            helper={
              activeBoat?.dailyXp ? `Daily ${activeBoat.dailyXp} XP` : 'Mint an NFT boat to upgrade'
            }
            accent="green"
          />
          <StatCard
            icon="🎁"
            label="Boost"
            value={profile.boost?.name || 'No boost'}
            helper={
              profile.boost?.multiplier
                ? `+${Math.round(profile.boost.multiplier * 100)}% XP boost`
                : 'Mint a boost NFT to multiply rewards'
            }
            accent="purple"
          />
          <StatCard
            icon="📅"
            label="Days Played"
            value={stats?.daysPlayed ? `${stats.daysPlayed} days` : '—'}
            helper="Total days since you set sail"
            accent="purple"
          />
        </div>
      </header>

      {/* Level Progress */}
      <section className="ocean-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ⛵ Level Progress
            </h2>
            <p className="text-sm text-gray-500">
              Earn {numberFormatter.format(profile.xpToNextLevel || 0)} more XP to reach the next tier.
            </p>
          </div>
          <div className="chip">
            ⚓ Current level {profile.level}
          </div>
        </div>
        <div className="w-full bg-white/70 rounded-full h-4 border border-blue-200 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${levelProgress}%`,
              background: 'linear-gradient(90deg, #7CC2FF 0%, #1F7AE0 100%)',
            }}
          />
        </div>
      </section>

      {/* Streak Milestones */}
      <section className="ocean-card">
        <h2 className="text-xl font-bold text-gray-800 mb-3">🎣 Streak Journey</h2>
        <div className="flex flex-col gap-3">
          {streakMilestones.map((milestone) => {
            const achieved = profile.currentStreak >= milestone.days;
            return (
              <div
                key={milestone.days}
                className="flex items-center justify-between bg-white/70 rounded-lg px-4 py-3 border border-blue-200/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {achieved ? '✅' : '🟦'}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-700">{milestone.label}</p>
                    <p className="text-xs text-gray-500">{milestone.days} day streak</p>
                  </div>
                </div>
                <span className={`badge ${achieved ? '' : 'text-gray-500'}`}>
                  {achieved ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Boats */}
      <section className="ocean-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🚤 Your Fleet
          </h2>
          <Link href="/nft-mint" className="secondary-button text-sm">
            🚀 Mint a New Boat
          </Link>
        </div>
        {userBoats.length === 0 ? (
          <div className="empty-state">
            You have not minted a boat yet. Visit the NFT hangar to launch your first vessel!
          </div>
        ) : (
          <div className="grid grid-cols-1 grid-md-2 gap-3">
            {userBoats.map((boat) => (
              <div
                key={boat.tokenId}
                className={`ocean-card p-4 border ${
                  boat.isActive ? 'border-blue-200 shadow-lg' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div style={{ flex: 1 }}>
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      {boatLabel(boat.boatType as string)}
                      {boat.isActive && <span className="badge">Active</span>}
                    </h3>
                    <p className="text-xs text-gray-500">Token #{boat.tokenId}</p>
                  </div>
                  <BoatSVG type={(boat.boatType as string).toUpperCase() as BoatTypeName} size={44} />
                </div>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p>Daily XP: {boat.dailyXp}</p>
                  <p>
                    Position:{' '}
                    {boat.position ? `(${boat.position.x}, ${boat.position.y})` : 'Not deployed yet'}
                  </p>
                  <p>Total XP: {boat.stats?.totalXpEarned || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      <section className="ocean-card">
        <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          🏅 Badges & Achievements
        </h2>
        {profile.achievements && profile.achievements.length > 0 ? (
          <div className="grid grid-cols-1 grid-md-2 gap-3">
            {profile.achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white/80 rounded-lg border border-blue-200/40 p-3 flex gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {achievement.icon || '🌟'}
                </span>
                <div>
                  <p className="font-semibold text-gray-700">{achievement.name}</p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Your nautical journey is just beginning. Claim daily rewards to unlock your first badges!
          </div>
        )}
      </section>


    </section>
  );
}

