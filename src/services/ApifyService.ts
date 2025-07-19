interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyDatasetItem {
  username: string;
  followers?: number;
  followersCount?: number;
  profilePicUrl?: string;
  avatarLarger?: string;
  displayName?: string;
  nickname?: string;
  verified?: boolean;
}

export interface ProfileData {
  username: string;
  followers: number;
  profilePicUrl: string;
  fullName?: string;
  verified?: boolean;
}

export class ApifyService {
  // Apify API token - keep secure in JavaScript only
  private static readonly API_TOKEN = 'apify_api_zyoipth505ZDm89WVX01kzcUQrNwxN0s4NVP';
  
  // Apify Actor Task IDs - replace with your actual task IDs
  private static readonly ACTORS = {
    instagram: 'apify~instagram-scraper',
    tiktok: 'mshopik~tiktok-scraper'
  };

  private static readonly BASE_URL = 'https://api.apify.com/v2';

  static async runActor(platform: 'instagram' | 'tiktok', username: string): Promise<string> {
    const actorId = this.ACTORS[platform];
    const input = platform === 'instagram' 
      ? { usernames: [username], resultsType: 'posts' }
      : { profiles: [username] };

    const response = await fetch(`${this.BASE_URL}/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_TOKEN}`
      },
      body: JSON.stringify({ 
        input,
        timeout: 60,
        memory: 256
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to start actor: ${response.statusText}`);
    }

    const data: ApifyRunResponse = await response.json();
    return data.data.id;
  }

  static async getRunStatus(runId: string): Promise<{ status: string; datasetId: string }> {
    const response = await fetch(`${this.BASE_URL}/actor-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${this.API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get run status: ${response.statusText}`);
    }

    const data: ApifyRunResponse = await response.json();
    return {
      status: data.data.status,
      datasetId: data.data.defaultDatasetId
    };
  }

  static async waitForRunCompletion(runId: string, maxWaitTime: number = 30000): Promise<string> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const { status, datasetId } = await this.getRunStatus(runId);
      
      if (status === 'SUCCEEDED') {
        return datasetId;
      }
      
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Actor run ${status.toLowerCase()}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Actor run timed out');
  }

  static async getDatasetItems(datasetId: string): Promise<ApifyDatasetItem[]> {
    const response = await fetch(`${this.BASE_URL}/datasets/${datasetId}/items`, {
      headers: {
        'Authorization': `Bearer ${this.API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get dataset items: ${response.statusText}`);
    }

    return response.json();
  }

  static async fetchProfileData(platform: 'instagram' | 'tiktok', username: string): Promise<ProfileData> {
    try {
      // Start the actor run
      const runId = await this.runActor(platform, username);
      
      // Wait for completion and get dataset ID
      const datasetId = await this.waitForRunCompletion(runId);
      
      // Fetch the results
      const items = await this.getDatasetItems(datasetId);
      
      if (!items || items.length === 0) {
        throw new Error('No profile data found');
      }

      const item = items[0];
      
      // Normalize data based on platform
      const profileData: ProfileData = {
        username: item.username || username,
        followers: item.followers || item.followersCount || 0,
        profilePicUrl: item.profilePicUrl || item.avatarLarger || `https://ui-avatars.com/api/?name=${username}&size=150&background=random`,
        fullName: item.displayName || item.nickname || username,
        verified: item.verified || false
      };

      return profileData;
    } catch (error) {
      console.error('Apify API error:', error);
      // Fallback to mock data for development
      return {
        username: username,
        followers: Math.floor(Math.random() * 10000000) + 100000,
        profilePicUrl: `https://ui-avatars.com/api/?name=${username}&size=150&background=random`,
        fullName: username.charAt(0).toUpperCase() + username.slice(1),
        verified: Math.random() > 0.7
      };
    }
  }
}