import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const AccountTokens = () => {
  const { connected, publicKey } = useWallet();

  // Fetch token accounts using useQuery
  const { data: tokenBalances, isLoading } = useQuery({
    queryKey: ['tokenBalances', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return [];
      const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet));
      
      // Fetch standard token accounts
      const standardAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      // Fetch Token-2022 accounts
      const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );
      
      // Merge all accounts
      const allAccounts = [...standardAccounts.value, ...token2022Accounts.value];
      
      // Aggregate balances by mint
      const balances: { [mint: string]: number } = {};
      allAccounts.forEach(account => {
        const mint = account.account.data.parsed.info.mint;
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        if (balances[mint]) {
          balances[mint] += amount;
        } else {
          balances[mint] = amount;
        }
      });
      
      return Object.entries(balances).map(([mint, balance]) => ({ mint, balance }));
    },
    enabled: !!publicKey, // Only fetch when publicKey is available
  });

  // Handle different states
  if (!connected) {
    return <div>Please connect your wallet to view your tokens.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!tokenBalances || tokenBalances.length === 0) {
    return <div>No tokens found.</div>;
  }

  // Render the token list
  return (
    <div>
      <h2>Your Tokens</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border-b border-gray-300">Mint</th>
            <th className="text-right p-2 border-b border-gray-300">Balance</th>
          </tr>
        </thead>
        <tbody>
          {tokenBalances.map(({ mint, balance }) => (
            <tr key={mint} className="hover:bg-gray-100">
              <td title={mint} className="text-left p-2 border-b border-gray-300 max-w-[200px] truncate">
                {mint}
              </td>
              <td className="text-right p-2 border-b border-gray-300">{balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTokens;