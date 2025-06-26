// src/components/CryptoFaucet.tsx - REPLACE the existing file in your FRONTEND repo

import React, { useState, useEffect } from 'react';
import { Coins, Droplets, Clock, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import type { ClaimResponse, AssetStatusResponse } from '../services/api';

interface CryptoAsset {
  symbol: string;
  name: string;
  amount: string;
  cooldownHours: number;
  canClaim: boolean;
  remainingCooldown: number;
  remainingTime: string | null;
  nextClaimAt: string | null;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
  txHash?: string;
}

type AssetSymbol = string;

const CryptoFaucet: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('BONE');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState<boolean>(false);
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0);

  // Load supported assets on component mount
  useEffect(() => {
    loadSupportedAssets();
  }, []);

  // Fetch user status when wallet address changes
  useEffect(() => {
    if (walletAddress && isValidAddress(walletAddress)) {
      const now = Date.now();
      // Debounce API calls - only fetch if last check was more than 1 second ago
      if (now - lastStatusCheck > 1000) {
        fetchUserStatus(walletAddress);
        setLastStatusCheck(now);
      }
    }
  }, [walletAddress, lastStatusCheck]);

  const loadSupportedAssets = async () => {
    try {
      const response = await apiService.getSupportedAssets();
      if (response.success) {
        // Convert to our format
        const assetData = response.data.supportedAssets.map(asset => ({
          symbol: asset.symbol,
          name: asset.name,
          amount: asset.amount,
          cooldownHours: asset.cooldown_hours,
          canClaim: true,
          remainingCooldown: 0,
          remainingTime: null,
          nextClaimAt: null,
        }));
        setAssets(assetData);
        if (assetData.length > 0) {
          setSelectedAsset(assetData[0].symbol);
        }
      }
    } catch (error) {
      console.error('Failed to load supported assets:', error);
      setNotification({
        type: 'error',
        message: 'Failed to connect to faucet API. Please check if the backend is running.',
      });
    }
  };

  const fetchUserStatus = async (address: string) => {
    if (isFetchingStatus) return; // Prevent multiple simultaneous requests
    
    setIsFetchingStatus(true);
    try {
      const response: AssetStatusResponse = await apiService.getClaimStatus(address);
      if (response.success) {
        // Convert API response to our format
        const convertedAssets = response.data.assets.map(asset => ({
          symbol: asset.asset,
          name: asset.name,
          amount: asset.amount,
          cooldownHours: asset.cooldownHours,
          canClaim: asset.canClaim,
          remainingCooldown: asset.remainingCooldown,
          remainingTime: asset.remainingTime,
          nextClaimAt: asset.nextClaimAt,
        }));
        setAssets(convertedAssets);
        setRecentClaims(response.data.recentClaims);
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
      // Don't show error for status checks to avoid spam
    } finally {
      setIsFetchingStatus(false);
    }
  };

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleClaim = async (): Promise<void> => {
    if (!walletAddress.trim()) {
      setNotification({ type: 'error', message: 'Please enter a wallet address' });
      return;
    }

    if (!isValidAddress(walletAddress)) {
      setNotification({ type: 'error', message: 'Please enter a valid Ethereum address' });
      return;
    }

    const asset = assets.find(a => a.symbol === selectedAsset);
    if (!asset) {
      setNotification({ type: 'error', message: 'Selected asset not found' });
      return;
    }

    if (!asset.canClaim) {
      setNotification({ 
        type: 'error', 
        message: `Please wait ${asset.remainingTime} before claiming ${selectedAsset} again` 
      });
      return;
    }

    setIsLoading(true);

    try {
      const response: ClaimResponse = await apiService.claimTokens({
        walletAddress: walletAddress.trim(),
        asset: selectedAsset,
      });

      if (response.success && response.data) {
        setNotification({
          type: 'success',
          message: `Successfully claimed ${response.data.amount} ${selectedAsset}!`,
          txHash: response.data.transactionHash,
        });
        
        // Refresh user status after successful claim
        setTimeout(() => {
          fetchUserStatus(walletAddress);
        }, 1000);
      } else {
        setNotification({
          type: 'error',
          message: response.error || 'Claim failed. Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Claim failed:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message.includes('Cooldown Active')) {
        errorMessage = error.message;
      } else if (error.message.includes('Insufficient Faucet Balance')) {
        errorMessage = 'Faucet is currently out of funds. Please try again later.';
      } else if (error.message.includes('Rate Limited')) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      }
      
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear notifications after 8 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const selectedAssetData = assets.find(a => a.symbol === selectedAsset);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-black p-6">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Droplets className="w-12 h-12 text-orange-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Shibarium Testnet Faucet
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Claim testnet tokens for Shibarium Puppynet development
          </p>
          <div className="mt-2 text-sm text-gray-400">
            {isFetchingStatus && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Checking status...
              </div>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start ${
            notification.type === 'success' 
              ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300' 
              : notification.type === 'error'
              ? 'bg-red-900/30 border border-red-500/30 text-red-300'
              : 'bg-blue-900/30 border border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex-shrink-0 mr-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div>{notification.message}</div>
              {notification.txHash && (
                <a
                  href={`https://puppyscan.shib.io/tx/${notification.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-sm underline hover:no-underline"
                >
                  View transaction <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Asset Selection Section */}
          {assets.length > 0 && (
            <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
                <Coins className="w-6 h-6 mr-2 text-orange-400" />
                Select Asset
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {assets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    disabled={!asset.canClaim && asset.remainingCooldown > 0}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      selectedAsset === asset.symbol
                        ? 'bg-orange-600/20 border-orange-400/50 text-orange-100 shadow-lg shadow-orange-500/20'
                        : asset.canClaim
                        ? 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50'
                        : 'bg-gray-800/30 border-gray-700/30 text-gray-500 opacity-60'
                    }`}
                  >
                    <div className="font-bold text-lg">{asset.symbol}</div>
                    <div className="text-sm opacity-80">{asset.name}</div>
                    <div className="text-xs mt-1">{asset.amount} {asset.symbol}</div>
                    <div className="text-xs mt-1 flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {asset.cooldownHours}h cooldown
                    </div>
                    {!asset.canClaim && asset.remainingTime && (
                      <div className="text-xs mt-1 text-amber-400">
                        Wait: {asset.remainingTime}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  placeholder="0x... (Enter your wallet address)"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400/50"
                />
                {walletAddress && !isValidAddress(walletAddress) && (
                  <p className="text-red-400 text-sm mt-1">Please enter a valid Ethereum address</p>
                )}
              </div>
              
              {selectedAssetData && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Asset:</span>
                    <span className="text-gray-100 font-bold">{selectedAssetData.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-orange-300 font-bold">{selectedAssetData.amount} {selectedAssetData.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Cooldown:</span>
                    <span className="text-gray-100">{selectedAssetData.cooldownHours} hours</span>
                  </div>
                  {!selectedAssetData.canClaim && selectedAssetData.remainingTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Next claim in:</span>
                      <span className="text-amber-400 font-medium">{selectedAssetData.remainingTime}</span>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleClaim}
                disabled={isLoading || !selectedAssetData?.canClaim || !isValidAddress(walletAddress)}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                  isLoading || !selectedAssetData?.canClaim || !isValidAddress(walletAddress)
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 hover:scale-[1.02] shadow-lg shadow-orange-500/20'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </div>
                ) : !selectedAssetData?.canClaim && selectedAssetData?.remainingTime ? (
                  `Wait ${selectedAssetData.remainingTime}`
                ) : (
                  `Claim ${selectedAssetData?.amount || '...'} ${selectedAsset}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Claims */}
        {recentClaims.length > 0 && (
          <div className="mt-8 bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Recent Claims</h2>
            <div className="space-y-2">
              {recentClaims.slice(0, 5).map((claim, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex justify-between items-center border border-gray-700/30">
                  <div>
                    <span className="font-medium text-gray-100">{claim.amount} {claim.asset}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      claim.status === 'confirmed' 
                        ? 'bg-green-900/30 text-green-300' 
                        : claim.status === 'pending'
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(claim.claimed_at).toLocaleString()}
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
          <p className="text-xs mt-2">Network: Shibarium Puppynet (Chain ID: 157)</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoFaucet;