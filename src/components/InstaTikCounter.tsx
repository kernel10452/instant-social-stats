import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, RefreshCw, Instagram, Github } from 'lucide-react';

interface ProfileData {
  username: string;
  followers: number;
  profilePicUrl: string;
  fullName?: string;
  verified?: boolean;
}

export const InstaTikCounter = () => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [username, setUsername] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock API call (replace with actual Apify integration)
  const fetchProfileData = async (platform: string, username: string): Promise<ProfileData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Mock data for demonstration
    const mockData: ProfileData = {
      username: username,
      followers: Math.floor(Math.random() * 10000000) + 100000,
      profilePicUrl: `https://ui-avatars.com/api/?name=${username}&size=150&background=random`,
      fullName: username.charAt(0).toUpperCase() + username.slice(1),
      verified: Math.random() > 0.7
    };
    
    return mockData;
  };

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "Enter Username",
        description: "Please enter a username to search",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchProfileData(platform, username);
      setProfileData(data);
      setLastUpdated(new Date());
      startAutoRefresh();
      
      toast({
        title: "Profile Found!",
        description: `Found ${data.username} with ${data.followers.toLocaleString()} followers`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFollowerCount = async () => {
    if (!profileData || !username) return;
    
    setIsRefreshing(true);
    try {
      const data = await fetchProfileData(platform, username);
      setProfileData(prev => prev ? { ...prev, followers: data.followers } : null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh follower count:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const startAutoRefresh = () => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start new interval for every 5 seconds
    intervalRef.current = setInterval(refreshFollowerCount, 5000);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoRefresh();
  }, []);

  const handlePlatformChange = (value: 'instagram' | 'tiktok') => {
    setPlatform(value);
    // Clear current data when switching platforms
    setProfileData(null);
    stopAutoRefresh();
  };

  const gradientClass = platform === 'instagram' ? 'bg-gradient-instagram' : 'bg-gradient-tiktok';
  const platformIcon = platform === 'instagram' ? Instagram : Github;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 mx-auto rounded-full ${gradientClass} flex items-center justify-center shadow-glow animate-pulse`}>
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            InstaTik Live Counter
          </h1>
          <p className="text-muted-foreground text-lg">
            Track follower counts in real-time across social platforms
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-0 shadow-social">
          <div className="space-y-4">
            {/* API Key Input (temporary) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Apify API Key (temporary - connect to Supabase for production)
              </label>
              <Input
                type="password"
                placeholder="Enter your Apify API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Platform Selector */}
              <Select value={platform} onValueChange={handlePlatformChange}>
                <SelectTrigger className="transition-all duration-300 hover:border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="tiktok">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      TikTok
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Username Input */}
              <Input
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className={`${gradientClass} hover:opacity-90 transition-all duration-300 transform hover:scale-105`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Display */}
        {profileData && (
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-0 shadow-glow animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-6">
              {/* Profile Picture */}
              <div className="relative inline-block">
                <img
                  src={profileData.profilePicUrl}
                  alt={`${profileData.username} profile`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg mx-auto"
                />
                {profileData.verified && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                    ✓
                  </Badge>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">@{profileData.username}</h2>
                {profileData.fullName && (
                  <p className="text-lg text-muted-foreground">{profileData.fullName}</p>
                )}
              </div>

              {/* Follower Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  <span className="text-sm text-muted-foreground">Followers</span>
                  {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                </div>
                <div className={`text-5xl font-bold ${gradientClass} bg-clip-text text-transparent`}>
                  {profileData.followers.toLocaleString()}
                </div>
                
                {lastUpdated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
                
                <Badge variant="secondary" className="text-xs">
                  Auto-refreshing every 5 seconds
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Info Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Built for speed and simplicity • Updates every 5 seconds
          </p>
          <p className="text-xs">
            This is a demo version. Connect to Supabase and add your Apify API key for production use.
          </p>
        </div>
      </div>
    </div>
  );
};