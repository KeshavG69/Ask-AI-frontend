/**
 * Server-Side Chat Proxy for NavianAI
 * 
 * Deploy this file to your server (Vercel, Netlify, etc.) to securely handle API keys.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Set environment variable: OPENAI_API_KEY=your-openai-api-key-here
 * 2. Deploy this file to your serverless platform
 * 3. Update your widget configuration to use this proxy URL
 * 
 * VERCEL: Place in /api/chat-proxy.js
 * NETLIFY: Place in /netlify/functions/chat-proxy.js
 */

// For Vercel/Next.js serverless functions
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variables (secure server-side)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Server configuration error: OpenAI API key not configured' 
      });
    }

    // Add API key to the request payload
    const requestPayload = {
      ...req.body,
      api_key: openaiApiKey
    };

    console.log('🚀 Forwarding request to NavianAI backend...');
    
    // Forward request to NavianAI Python backend
    const response = await fetch('https://ask-ai-k50g.onrender.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      return res.status(response.status).json({ 
        error: `Backend error: ${response.status}` 
      });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the response back to the client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        res.write(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    res.end();
    console.log('✅ Successfully streamed response');

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// For Netlify Functions (alternative export)
export const handler = async (event, context) => {
  const req = {
    method: event.httpMethod,
    body: JSON.parse(event.body || '{}')
  };
  
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader: function(key, value) {
      this.headers[key] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    write: function(data) {
      this.body += data;
    },
    end: function() {
      // Response is complete
    }
  };

  await handler(req, res);
  
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: res.body
  };
};
