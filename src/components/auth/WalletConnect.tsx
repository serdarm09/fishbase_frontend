'use client';

import { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const getEthereumProvider = () =>
  (window as typeof window & { ethereum?: EthereumProvider }).ethereum;

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleWalletLogin = async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      setError('No wallet provider found. Open FishBase in Base App or a wallet browser.');
      return;
    }

    try {
      setIsAuthenticating(true);
      setError(null);
      setStatusMessage('Connecting wallet...');

      const provider = new BrowserProvider(ethereum);
      await provider.send('eth_requestAccounts', []);

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch {
        // Base App and some mobile wallets are already scoped to Base.
      }

      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      setStatusMessage('Preparing secure sign-in...');
      const challenge = await authApi.walletChallenge({
        walletAddress,
        domain: window.location.host,
        uri: window.location.origin,
        chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453),
      });

      setStatusMessage('Please sign the wallet login message...');
      const signature = await signer.signMessage(challenge.message);

      setStatusMessage('Verifying wallet signature...');
      const response = await authApi.walletLogin({
        walletAddress,
        message: challenge.message,
        signature,
        nonce: challenge.nonce,
      });

      setSession(response.token, response.user);
      setStatusMessage('Signed in! Loading your captain deck...');
      router.replace('/profile');
    } catch (err: any) {
      setError(err?.message ?? 'Wallet sign-in failed.');
      setStatusMessage(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        className="btn-ocean w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isAuthenticating}
        onClick={handleWalletLogin}
      >
        {isAuthenticating ? 'Connecting...' : 'Connect Base Wallet'}
      </button>
      {statusMessage && <p className="text-xs text-blue-600 mt-2">{statusMessage}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
