/**
 * Server-Side Chat Proxy for NavianAI (Vercel Compatible)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Set environment variable: OPENAI_API_KEY=your-openai-api-key-here
 * 2. Deploy this file to your serverless platform
 * 3. Update your widget configuration to use this proxy URL
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

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

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Add API key to the request payload
    const requestPayload = {
      ...req.body,
      api_key: openaiApiKey
    };

    console.log('🚀 Forwarding request to NavianAI backend...');
    
    // Set streaming headers first
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Forward request to NavianAI Python backend using built-in fetch
    const response = await fetch('https://ask-ai-production-5ced.up.railway.app/chat', {
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

    // Stream the response using async iterator (compatible with Vercel)
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      
      res.end();
      console.log('✅ Successfully streamed response');
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('❌ Proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }
}
