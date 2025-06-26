// src/services/api.ts - Place this in your FRONTEND repo

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ClaimRequest {
  walletAddress: string;
  asset: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  data?: {
    asset: string;
    amount: string;
    walletAddress: string;
    transactionHash: string;
    claimId: number;
    timestamp: string;
    nextClaimAt: string;
  };
  error?: string;
  remainingTime?: number;
  canClaimAt?: string;
}

export interface AssetStatusResponse {
  success: boolean;
  data: {
    walletAddress: string;
    assets: Array<{
      asset: string;
      name: string;
      amount: string;
      cooldownHours: number;
      canClaim: boolean;
      remainingCooldown: number;
      remainingTime: string | null;
      nextClaimAt: string | null;
    }>;
    recentClaims: Array<{
      id: number;
      wallet_address: string;
      asset: string;
      amount: string;
      tx_hash: string;
      status: string;
      claimed_at: string;
    }>;
    timestamp: string;
  };
}

export interface AssetsResponse {
  success: boolean;
  data: {
    supportedAssets: Array<{
      symbol: string;
      name: string;
      amount: string;
      cooldown_hours: number;
      contract_address: string;
      is_active: boolean;
    }>;
    network: string;
    chainId: number;
    timestamp: string;
  };
}

class ApiService {
  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Claim tokens from faucet
  async claimTokens(request: ClaimRequest): Promise<ClaimResponse> {
    return this.fetchWithErrorHandling<ClaimResponse>('/api/faucet/claim', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get user's claim status for all assets
  async getClaimStatus(walletAddress: string): Promise<AssetStatusResponse> {
    return this.fetchWithErrorHandling<AssetStatusResponse>(
      `/api/faucet/status/${walletAddress}`
    );
  }

  // Get all supported assets
  async getSupportedAssets(): Promise<AssetsResponse> {
    return this.fetchWithErrorHandling<AssetsResponse>('/api/faucet/assets');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchWithErrorHandling<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();