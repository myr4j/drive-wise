import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the API URL from environment or use default
// For development, use your machine's IP or localhost
// For Android emulator, use 10.0.2.2 to access localhost
// For iOS simulator, use localhost
const getApiUrl = () => {
  // Try to get from expo-constants (app.json extra)
  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl;
  }

  // Default development URLs
  if (Platform.OS === 'android') {
    // Android emulator: use 10.0.2.2 to access localhost
    return 'http://10.0.2.2:8000';
  }
  
  // iOS simulator and web: use localhost
  return 'http://localhost:8000';
};

export const config = {
  apiUrl: getApiUrl(),
  apiTimeout: 30000, // 30 seconds
  snapshotInterval: 30000, // 30 seconds for real-time fatigue tracking
  fatiguePollInterval: 10000, // 10 seconds for fatigue status polling
};

export default config;
