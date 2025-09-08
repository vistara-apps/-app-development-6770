import axios from 'axios';

const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

// Create Neynar API client
const neynarClient = axios.create({
  baseURL: NEYNAR_BASE_URL,
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json'
  }
});

export const isFarcasterConfigured = () => {
  return !!NEYNAR_API_KEY;
};

// Farcaster integration functions
export const farcasterAPI = {
  // Get user information by FID
  getUserByFid: async (fid) => {
    if (!NEYNAR_API_KEY) {
      console.warn('Neynar API key not configured');
      return null;
    }

    try {
      const response = await neynarClient.get(`/farcaster/user/bulk?fids=${fid}`);
      return response.data.users[0] || null;
    } catch (error) {
      console.error('Error fetching Farcaster user:', error);
      return null;
    }
  },

  // Get user information by username
  getUserByUsername: async (username) => {
    if (!NEYNAR_API_KEY) {
      console.warn('Neynar API key not configured');
      return null;
    }

    try {
      const response = await neynarClient.get(`/farcaster/user/search?q=${username}`);
      return response.data.result.users[0] || null;
    } catch (error) {
      console.error('Error searching Farcaster user:', error);
      return null;
    }
  },

  // Send direct cast (requires signer)
  sendDirectCast: async (recipientFid, message, signerUuid) => {
    if (!NEYNAR_API_KEY) {
      console.warn('Neynar API key not configured');
      return null;
    }

    try {
      const response = await neynarClient.post('/farcaster/cast', {
        signer_uuid: signerUuid,
        text: message,
        parent: null,
        embeds: [],
        channel_id: null
      });
      return response.data;
    } catch (error) {
      console.error('Error sending Farcaster cast:', error);
      return null;
    }
  },

  // Create a frame for lead follow-up
  createFollowUpFrame: (leadId, message) => {
    const frameUrl = `${window.location.origin}/frame/follow-up/${leadId}`;
    
    return {
      version: "vNext",
      image: `${window.location.origin}/api/frame/follow-up/${leadId}/image`,
      buttons: [
        {
          label: "View Lead Details",
          action: "post",
          target: `${frameUrl}/details`
        },
        {
          label: "Schedule Meeting",
          action: "post", 
          target: `${frameUrl}/schedule`
        },
        {
          label: "Mark as Contacted",
          action: "post",
          target: `${frameUrl}/contacted`
        }
      ],
      input: {
        text: "Add a note about this follow-up..."
      },
      post_url: `${frameUrl}/action`
    };
  },

  // Validate frame signature
  validateFrameSignature: async (frameData) => {
    if (!NEYNAR_API_KEY) return false;

    try {
      const response = await neynarClient.post('/farcaster/frame/validate', frameData);
      return response.data.valid;
    } catch (error) {
      console.error('Error validating frame signature:', error);
      return false;
    }
  }
};

// Frame action handlers
export const frameHandlers = {
  handleFollowUpAction: async (leadId, action, frameData) => {
    // Validate the frame signature first
    const isValid = await farcasterAPI.validateFrameSignature(frameData);
    if (!isValid) {
      throw new Error('Invalid frame signature');
    }

    switch (action) {
      case 'details':
        return {
          type: 'frame',
          frameUrl: `/frame/lead/${leadId}`
        };
      
      case 'schedule':
        return {
          type: 'redirect',
          url: `/schedule/${leadId}`
        };
      
      case 'contacted':
        // Mark lead as contacted and add interaction
        return {
          type: 'success',
          message: 'Lead marked as contacted'
        };
      
      default:
        throw new Error('Unknown action');
    }
  }
};

// Helper function to extract FID from Farcaster user data
export const extractFidFromUser = (user) => {
  return user?.fid || user?.body?.data?.fid || null;
};

// Helper function to format Farcaster username
export const formatFarcasterUsername = (username) => {
  return username?.startsWith('@') ? username : `@${username}`;
};
