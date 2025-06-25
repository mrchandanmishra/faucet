import React, { useState, useEffect } from 'react';
import { Coins, Droplets, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Type definitions
interface CryptoAsset {
  name: string;
  amount: string;
  cooldown: number;
  color: string;
}

interface CryptoAssets {
  [key: string]: CryptoAsset;
}

interface Claims {
  [key: string]: number;
}

interface LastClaim {
  [key: string]: number;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

type AssetSymbol = 'USDT' | 'USDC' | 'ETH' | 'SHIB' | 'TREAT';

const CryptoFaucet: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('USDT');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [claims, setClaims] = useState<Claims>({});
  const [lastClaim, setLastClaim] = useState<LastClaim>({});
  const [notification, setNotification] = useState<Notification | null>(null);

  // Crypto assets with their details
  const cryptoAssets: CryptoAssets = {
    USDT: { name: 'USDT', amount: '0.001', cooldown: 8, color: 'orange' },
    USDC: { name: 'USDC', amount: '0.01', cooldown: 8, color: 'blue' },
    ETH: { name: 'Ethereum', amount: '0.1', cooldown: 8, color: 'silver' },
    SHIB: { name: 'Shib', amount: '50', cooldown: 8, color: 'yellow' },
    TREAT: { name: 'Treat', amount: '0.05', cooldown: 8, color: 'purple' }
  };

  // Check if user can claim (cooldown period)
  const canClaim = (asset: AssetSymbol): boolean => {
    if (!lastClaim[asset]) return true;
    const timeDiff = Date.now() - lastClaim[asset];
    const cooldownMs = cryptoAssets[asset].cooldown * 60 * 60 * 1000; // Convert hours to ms
    return timeDiff > cooldownMs;
  };

  // Get remaining cooldown time
  const getRemainingTime = (asset: AssetSymbol): string | null => {
    if (!lastClaim[asset] || canClaim(asset)) return null;
    const timeDiff = Date.now() - lastClaim[asset];
    const cooldownMs = cryptoAssets[asset].cooldown * 60 * 60 * 1000;
    const remaining = cooldownMs - timeDiff;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Handle faucet claim
  const handleClaim = async (): Promise<void> => {
    if (!walletAddress.trim()) {
      setNotification({ type: 'error', message: 'Please enter a wallet address' });
      return;
    }

    if (!canClaim(selectedAsset)) {
      const remainingTime = getRemainingTime(selectedAsset);
      setNotification({ 
        type: 'error', 
        message: `Please wait ${remainingTime} before claiming ${selectedAsset} again` 
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newClaims: Claims = { ...claims };
      const newLastClaim: LastClaim = { ...lastClaim };
      
      if (!newClaims[selectedAsset]) newClaims[selectedAsset] = 0;
      newClaims[selectedAsset] += parseFloat(cryptoAssets[selectedAsset].amount);
      newLastClaim[selectedAsset] = Date.now();
      
      setClaims(newClaims);
      setLastClaim(newLastClaim);
      
      setNotification({
        type: 'success',
        message: `Successfully claimed ${cryptoAssets[selectedAsset].amount} ${selectedAsset}!`
      });
      
      setIsLoading(false);
    }, 2000);
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-black p-6">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Droplets className="w-12 h-12 text-orange-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
             Position Exchange Faucet
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
          Claim your testnet assets to explore Position Exchange
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center ${
            notification.type === 'success' 
              ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300' 
              : 'bg-red-900/30 border border-red-500/30 text-red-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        )}

        <div className="space-y-8">
          {/* Asset Selection Section */}
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
              <Coins className="w-6 h-6 mr-2 text-orange-400" />
              Select Asset
            </h2>
            
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(cryptoAssets).map(([symbol, asset]) => (
                <button
                  key={symbol}
                  onClick={() => setSelectedAsset(symbol as AssetSymbol)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedAsset === symbol
                      ? 'bg-orange-600/20 border-orange-400/50 text-orange-100 shadow-lg shadow-orange-500/20'
                      : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50'
                  }`}
                >
                  <div className="font-bold text-lg">{symbol}</div>
                  <div className="text-sm opacity-80">{asset.name}</div>
                  <div className="text-xs mt-1">{asset.amount} {symbol}</div>
                  <div className="text-xs mt-1 flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {asset.cooldown}h cooldown
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Claim Interface Section */}
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
              Claim {selectedAsset}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400/50"
                />
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-gray-100 font-bold">{cryptoAssets[selectedAsset].name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-orange-300 font-bold">{cryptoAssets[selectedAsset].amount} {selectedAsset}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Cooldown:</span>
                  <span className="text-gray-100">{cryptoAssets[selectedAsset].cooldown} hours</span>
                </div>
                {!canClaim(selectedAsset) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Next claim in:</span>
                    <span className="text-amber-400 font-medium">{getRemainingTime(selectedAsset)}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClaim}
                disabled={isLoading || !canClaim(selectedAsset)}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                  isLoading || !canClaim(selectedAsset)
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300 mr-2"></div>
                    Processing...
                  </div>
                ) : !canClaim(selectedAsset) ? (
                  `Wait ${getRemainingTime(selectedAsset)}`
                ) : (
                  `Claim ${cryptoAssets[selectedAsset].amount} ${selectedAsset}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Claim History */}
        {Object.keys(claims).length > 0 && (
          <div className="mt-8 bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Your Claims</h2>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(claims).map(([asset, amount]) => (
                <div key={asset} className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
                  <div className="font-bold text-lg text-gray-100">{asset}</div>
                  <div className="text-orange-300 font-medium">{amount.toFixed(6)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {cryptoAssets[asset as AssetSymbol]?.name || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400">
          <p className="mb-2">⚠️ This is a testnet faucet for development purposes only</p>
          <p className="text-sm">Tokens have no real value and are used for testing blockchain applications</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoFaucet;