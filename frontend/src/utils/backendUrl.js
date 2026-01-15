// Auto-detect backend URL based on current hostname
export const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on preview domain, use preview backend
    if (hostname.includes('preview.emergentagent.com')) {
      return 'https://app-connector-17.preview.emergentagent.com';
    }
    // If on localhost, use preview backend
    if (hostname === 'localhost') {
      return 'https://app-connector-17.preview.emergentagent.com';
    }
    // For production domain bauki.eu, use https://bauki.eu
    return `https://${hostname}`;
  }
  return process.env.REACT_APP_BACKEND_URL || 'https://bauki.eu';
};

export const BACKEND_URL = getBackendUrl();
export const API_URL = `${BACKEND_URL}/api`;
