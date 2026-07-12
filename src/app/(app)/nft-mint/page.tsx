'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { BrowserProvider, Contract, Interface, parseEther, parseUnits } from 'ethers';
import { nftApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ensureBaseNetwork } from '@/utils/helpers';
import config from '@/lib/config';
import type { BoatType } from '@/types';
import BoatSVG, { BOAT_COLORS, boatLabel, type BoatTypeName } from '@/components/boats/BoatSVG';
import {
  Anchor, Zap, CheckCircle2, ShoppingBag,
  Coins, CreditCard, Info, AlertCircle
} from 'lucide-react';

// Smart Contract Setup
const BOAT_NFT_ADDRESS = config.blockchain.contracts.boatNFT;
const USDC_ADDRESS = config.blockchain.contracts.usdc;
const GAME_CONTROLLER_ADDRESS = config.blockchain.contracts.gameController;

const GAME_CONTROLLER_ABI = [
  'function registerPlayer() external',
  'function isRegistered(address player) view returns (bool)',
];


const BOAT_NFT_ABI = [
  'function mintBoat(uint8 boatType) external payable',
  'function mintBoatWithUsdc(uint8 boatType) external',
  'event BoatMinted(address indexed to, uint256 indexed tokenId, uint8 boatType, bool paidWithUsdc)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

const BOAT_NFT_INTERFACE = new Interface(BOAT_NFT_ABI);

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const fleetCardStyle = (accent: string, isActive = false): CSSProperties => ({
  background:
    'linear-gradient(180deg, rgba(8, 28, 46, 0.96) 0%, rgba(3, 18, 33, 0.98) 100%)',
  border: `1px solid ${isActive ? accent : 'rgba(124, 194, 255, 0.22)'}`,
  borderRadius: 16,
  padding: '1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  boxShadow: isActive
    ? `0 0 0 2px ${accent}44, 0 18px 40px rgba(0, 0, 0, 0.28)`
    : '0 14px 34px rgba(0, 0, 0, 0.22)',
});

const boatImageStageStyle = (accent: string): CSSProperties => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '5.75rem',
  borderRadius: 14,
  background: `radial-gradient(circle at 50% 45%, ${accent}26 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0.02) 100%)`,
  border: '1px solid rgba(255,255,255,0.08)',
});

const boatMetaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '0.52rem 0.62rem',
  color: 'rgba(210, 230, 244, 0.78)',
  fontSize: '0.78rem',
};

const boatMetaValueStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  textAlign: 'right',
};

const BOAT_TYPE_IDS: Record<string, number> = {
  DINGHY: 0,
  SAILBOAT: 1,
  YACHT: 2,
  TRAWLER: 3,
  MEGASHIP: 4
};

// Boat catalogue (prices)
const BOAT_USD: Record<string, { usd: string; eth: string; usdc: string; free: boolean }> = {
  DINGHY:   { usd: 'Free',  eth: '0',         usdc: '0',       free: true },
  SAILBOAT: { usd: '$1.00', eth: '0.00034',   usdc: '1',       free: false },
  YACHT:    { usd: '$3.00', eth: '0.001',     usdc: '3',       free: false },
  TRAWLER:  { usd: '$5.00', eth: '0.0017',    usdc: '5',       free: false },
  MEGASHIP: { usd: '$6.99', eth: '0.0023',    usdc: '6.99',    free: false },
};

type PaymentMethod = 'ETH' | 'USDC';

type UserBoat = {
  id: string;
  tokenId: number;
  boatType: BoatType | string;
  name: string;
  dailyXp: number;
  position: { x: number | null; y: number | null } | null;
  isActive: boolean;
  stats?: { totalXpEarned: number };
};

type MarketplaceBoat = {
  type: BoatType | string;
  name: string;
  dailyXp: number;
  price: string;
  description: string;
  rarity: string;
};

type BoostItem = {
  id: number;
  level: string;
  name: string;
  multiplier: number;
  priceEth: string;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const getEthereum = () =>
  (window as typeof window & { ethereum?: EthereumProvider }).ethereum;

const isConfiguredAddress = (address?: string) =>
  Boolean(address && !/^0x0{40}$/i.test(address));

const getMintedTokenId = (
  receipt: { logs?: Array<{ topics: readonly string[]; data: string }> },
  ownerAddress: string
) => {
  const normalizedOwner = ownerAddress.toLowerCase();

  for (const log of receipt.logs || []) {
    try {
      const parsed = BOAT_NFT_INTERFACE.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsed) continue;

      if (parsed.name === 'BoatMinted') {
        return Number(parsed.args.tokenId);
      }

      if (
        parsed.name === 'Transfer' &&
        String(parsed.args.from).toLowerCase() === '0x0000000000000000000000000000000000000000' &&
        String(parsed.args.to).toLowerCase() === normalizedOwner
      ) {
        return Number(parsed.args.tokenId);
      }
    } catch {
      // Ignore logs from other contracts in the same receipt.
    }
  }

  return null;
};

export default function NftMintPage() {
  const { token, user } = useAuth();
  const [marketplace, setMarketplace] = useState<MarketplaceBoat[]>([]);
  const [boats, setBoats]             = useState<UserBoat[]>([]);
  const [boosts, setBoosts]           = useState<BoostItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<number | null>(null);
  const [isMinting, setIsMinting]     = useState<string | null>(null);
  const [payment, setPayment]         = useState<PaymentMethod>('ETH');

  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [marketplaceRes, boatsRes] = await Promise.all([
        nftApi.getMarketplace(token),
        nftApi.getUserBoats(token),
      ]);
      setMarketplace((marketplaceRes as any).marketplace?.boats || (marketplaceRes as any).boats || []);
      setBoosts((marketplaceRes as any).marketplace?.boosts || (marketplaceRes as any).boosts || []);
      setBoats(
        (boatsRes.boats || []).map((b: any) => ({
          id:       `boat-${b.tokenId}`,
          tokenId:  b.tokenId,
          boatType: b.boatType || b.type,
          name:     b.name || b.boatType || b.type,
          dailyXp:  b.dailyXp,
          position: b.position || null,
          isActive: b.isActive,
          stats:    b.stats || { totalXpEarned: 0 },
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Unable to load fleet data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleActivate = async (tokenId: number) => {
    if (!token) return;
    try {
      setError(null);
      setSuccess(null);
      setIsActivating(tokenId);
      await nftApi.activateBoat(token, tokenId);
      setSuccess(`Boat #${tokenId} is now your active vessel.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate boat.');
    } finally {
      setIsActivating(null);
    }
  };

  // Minting Logic
  const handleMint = async (bKey: string) => {
    if (!token) return;
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('Wallet not found. Please open FishBase inside Base App or a web3 browser.');
      return;
    }

    const typeId = BOAT_TYPE_IDS[bKey];
    if (typeId === undefined) return;

    if (!isConfiguredAddress(BOAT_NFT_ADDRESS)) {
      setError('Boat NFT contract address is missing. Set NEXT_PUBLIC_BOAT_NFT_ADDRESS in Vercel.');
      return;
    }

    if (payment === 'USDC' && !isConfiguredAddress(USDC_ADDRESS)) {
      setError('USDC contract address is missing. Set NEXT_PUBLIC_USDC_ADDRESS in Vercel.');
      return;
    }

    try {
      setIsMinting(bKey);
      setError(null);
      setSuccess(null);

      // Ensure wallet is on Base Mainnet
      await ensureBaseNetwork(ethereum);

      const provider = new BrowserProvider(ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      const boatNftContract = new Contract(BOAT_NFT_ADDRESS, BOAT_NFT_ABI, signer);
      const priceConfig = BOAT_USD[bKey];

      let tx;

      if (bKey === 'DINGHY') {
        if (boats.length > 0) {
          throw new Error('You already own a boat! The Dinghy is reserved for new starter captains only.');
        }
        if (!isConfiguredAddress(GAME_CONTROLLER_ADDRESS)) {
          throw new Error('Game Controller contract address is missing. Set NEXT_PUBLIC_GAME_CONTROLLER_ADDRESS in Vercel.');
        }
        const gameController = new Contract(GAME_CONTROLLER_ADDRESS, GAME_CONTROLLER_ABI, signer);
        const isReg = await gameController.isRegistered(signerAddress);
        if (isReg) {
          throw new Error('You are already registered on the GameController and have claimed your starter boat.');
        }
        setSuccess('Claiming your starter Dinghy via GameController...');
        tx = await gameController.registerPlayer();
      } else if (payment === 'ETH') {
        const ethPrice = parseEther(priceConfig.eth);
        const balance = await provider.getBalance(signerAddress);
        
        if (balance < ethPrice) {
          const formattedBalance = (Number(balance) / 1e18).toFixed(4);
          throw new Error(`Insufficient funds! This boat costs ${priceConfig.eth} ETH but you only have ${formattedBalance} ETH. Please add more ETH to your Base wallet or mint a cheaper boat.`);
        }

        setSuccess('Confirming ETH transaction...');
        tx = await boatNftContract.mintBoat(typeId, { value: ethPrice });
      } else {
        const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
        const usdcAmount = parseUnits(priceConfig.usdc, 6); // USDC has 6 decimals

        // Check allowance
        const allowance = await usdcContract.allowance(signerAddress, BOAT_NFT_ADDRESS);
        if (allowance < usdcAmount) {
          setSuccess('Approving USDC... Please confirm the transaction.');
          const approveTx = await usdcContract.approve(BOAT_NFT_ADDRESS, usdcAmount);
          await approveTx.wait();
        }

        setSuccess('Minting with USDC... Please confirm the transaction.');
        tx = await boatNftContract.mintBoatWithUsdc(typeId);
      }

      setSuccess('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      const tokenId = getMintedTokenId(receipt, signerAddress);
      if (!tokenId) {
        throw new Error('Mint succeeded, but token ID could not be read from the transaction receipt.');
      }

      setSuccess('Boat minted successfully. Syncing with server...');
      await nftApi.registerBoat(token, { tokenId, boatType: bKey, dailyXp: bKey === 'DINGHY' ? 10 : 1 });
      await fetchData();
      setSuccess(`${boatLabel(bKey)} added to your fleet!`);

    } catch (err: any) {
      console.error(err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was cancelled by user.');
      } else {
        setError(err.reason || err.message || 'Failed to mint boat.');
      }
      setSuccess(null);
    } finally {
      setIsMinting(null);
    }
  };

  // Payment method toggle
  const PaymentToggle = () => (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 999, padding: 4, gap: 4 }}>
      {(['ETH', 'USDC'] as PaymentMethod[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setPayment(m)}
          style={{
            background:   payment === m ? '#1E40AF' : 'transparent',
            color:        payment === m ? '#fff' : '#64748B',
            border:       'none',
            borderRadius: 999,
            padding:      '0.45rem 1.1rem',
            fontWeight:   700,
            fontSize:     '0.85rem',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          '0.3rem',
            transition:   'all 0.15s ease',
          }}
        >
          {m === 'ETH' ? <Coins size={14} /> : <CreditCard size={14} />}
          {m}
        </button>
      ))}
    </div>
  );

  const priceLabel = (bKey: string) => {
    const p = BOAT_USD[bKey];
    if (!p) return '-';
    if (p.free) return 'Free';
    return payment === 'ETH' ? `${p.eth} ETH` : `${p.usdc} USDC`;
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <header className="ocean-card game-hero-panel" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-heading animated-heading">
              NFT Hangar
              <span className="badge">5 boat classes</span>
            </h1>
            <p className="page-subtitle" style={{ marginTop: '0.4rem' }}>
              Mint on Base, activate your vessel, and earn daily XP from the sea map.
            </p>
          </div>
          <PaymentToggle />
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '0.9rem 1.25rem', color: '#DC2626', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '0.9rem 1.25rem', color: '#16A34A', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {isLoading ? (
        <div className="ocean-card" style={{ color: '#64748B', fontSize: '0.95rem' }}>
          Loading fleet data <span className="loading-dots" />
        </div>
      ) : (
        <>
          {/* Your Fleet */}
          {boats.length > 0 && (
            <section className="ocean-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Anchor size={18} color="var(--ocean-500)" /> Your Fleet
                </h2>
                <span className="chip">{boats.length} boat{boats.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '0.8rem' }}>
                {boats.map((boat) => {
                  const bKey  = (boat.boatType as string).toUpperCase();
                  const color = BOAT_COLORS[bKey] ?? BOAT_COLORS.DINGHY;
                  return (
                    <div key={boat.tokenId} className="fleet-card" style={fleetCardStyle(color.badge, boat.isActive)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ ...boatImageStageStyle(color.badge), width: '5.8rem', minHeight: '5.1rem' }}>
                          <BoatSVG type={bKey as BoatTypeName} size={70} />
                        </div>
                        {boat.isActive && <span style={{ fontSize: '0.7rem', fontWeight: 700, background: color.badge, color: '#fff', borderRadius: 999, padding: '0.2rem 0.6rem' }}>Active</span>}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                          {boatLabel(bKey)} <span style={{ fontWeight: 600, color: 'rgba(195, 215, 230, 0.72)', fontSize: '0.85rem' }}>#{boat.tokenId}</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(210, 230, 244, 0.78)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <Zap size={13} color={color.badge} /> {boat.dailyXp} XP / day
                        </p>
                      </div>
                      <div style={{ display: 'grid', gap: '0.45rem' }}>
                        <div style={boatMetaRowStyle}>
                          <span>Position</span>
                          <strong style={boatMetaValueStyle}>
                            {typeof boat.position?.x === 'number' && typeof boat.position?.y === 'number'
                              ? `${boat.position?.x}, ${boat.position?.y}`
                              : 'Not deployed'}
                          </strong>
                        </div>
                        <div style={boatMetaRowStyle}>
                          <span>Total XP</span>
                          <strong style={boatMetaValueStyle}>{boat.stats?.totalXpEarned || 0}</strong>
                        </div>
                      </div>
                      {!boat.isActive && (
                        <button type="button" onClick={() => handleActivate(boat.tokenId)} disabled={isActivating === boat.tokenId} style={{ background: color.badge, color: '#fff', border: 'none', borderRadius: 999, padding: '0.6rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', opacity: isActivating === boat.tokenId ? 0.6 : 1 }}>
                          {isActivating === boat.tokenId ? 'Activating...' : 'Set Active'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Available Boats */}
          <section className="ocean-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} color="var(--ocean-500)" /> Available to Mint
              </h2>

              <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Info size={13} />
                {payment === 'USDC' ? 'Approve USDC before minting' : 'ETH prices update with market'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
              {marketplace.map((boat) => {
                const bKey  = (boat.type as string).toUpperCase();
                const color = BOAT_COLORS[bKey] ?? BOAT_COLORS.DINGHY;
                const price = priceLabel(bKey);
                const isFree = BOAT_USD[bKey]?.free;
                
                const hasBoats = boats.length > 0;
                const isStarter = bKey === 'DINGHY';
                const disableMint = isStarter && hasBoats;

                return (
                  <div key={boat.type} className="fleet-card" style={fleetCardStyle(color.badge)}>
                    <div style={boatImageStageStyle(color.badge)}>
                      {/* Enlarged boat images */}
                      <BoatSVG type={bKey as BoatTypeName} size={84} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>{boat.name}</p>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(210, 230, 244, 0.78)', marginTop: '0.35rem', lineHeight: 1.45 }}>{boat.description}</p>
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: 'auto', marginBottom: '0.25rem' }}>
                      <div style={boatMetaRowStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Zap size={14} color={color.badge} /> Daily XP
                        </span>
                        <strong style={boatMetaValueStyle}>{boat.dailyXp} XP</strong>
                      </div>
                      <div style={boatMetaRowStyle}>
                        <span>Price</span>
                        <strong style={{ ...boatMetaValueStyle, color: isFree ? '#4ADE80' : '#ffffff' }}>
                          {price}
                        </strong>
                      </div>
                    </div>

                    {/* Mint Butonu */}
                    <button
                      type="button"
                      onClick={() => handleMint(bKey)}
                      disabled={isMinting === bKey || disableMint}
                      style={{
                        background: disableMint ? '#CBD5E1' : color.badge,
                        color: disableMint ? '#64748B' : '#fff',
                        border: 'none',
                        borderRadius: 999,
                        padding: '0.75rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: (isMinting || disableMint) ? 'not-allowed' : 'pointer',
                        opacity: isMinting === bKey ? 0.7 : 1,
                        width: '100%',
                        transition: 'all 0.2s',
                        boxShadow: disableMint ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isMinting === bKey
                        ? 'Minting...'
                        : disableMint
                        ? 'Starter Claimed'
                        : isStarter
                        ? 'Claim Free Dinghy'
                        : `Mint ${boatLabel(bKey)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Power Boosts */}
          {boosts.length > 0 && (
            <section className="ocean-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="#F59E0B" /> Power Boosts
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '-0.5rem' }}>
                Hold a boost NFT to permanently multiply your daily XP earnings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.7rem' }}>
                {boosts.map((boost) => (
                  <div key={boost.level} className="fleet-card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <p style={{ fontWeight: 700, color: '#92400E', fontSize: '0.92rem' }}>{boost.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>+{Math.round(boost.multiplier * 100)}% XP</p>
                    <p style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, marginTop: 4 }}>{boost.priceEth} ETH</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
