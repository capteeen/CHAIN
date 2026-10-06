import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { shortCa } from '../lib/format';

export function WalletButton({ className = 'btn-ghost' }: { className?: string }) {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  if (publicKey)
    return (
      <button className={className} onClick={() => disconnect()} title="Disconnect">
        <span className="h-2 w-2 rounded-full bg-steel" />
        {shortCa(publicKey.toBase58())}
      </button>
    );
  return (
    <button className={className} onClick={() => setVisible(true)} disabled={connecting}>
      {connecting ? 'Connecting…' : 'Connect wallet'}
    </button>
  );
}
