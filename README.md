# NavianAI - Secure AI Chat Widget

A secure, easy-to-deploy AI chat widget that keeps your OpenAI API keys completely hidden from end users. Perfect for SaaS companies who want to add intelligent customer support without security risks.

## 🚀 Quick Start

1. **Clone this repository**
2. **Set your OpenAI API key** (see setup below)
3. **Deploy to Vercel** (one-click deployment)
4. **Done!** Your secure AI chat widget is live

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Website  │───▶│   Secure Proxy   │───▶│  NavianAI API   │
│  (chat-widget)  │    │ (api/chat-proxy) │    │   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   OpenAI API     │
                       │ (Your API Key)   │
                       └──────────────────┘
```

**Security Benefits:**
- ✅ OpenAI API keys never visible to users
- ✅ Server-side proxy handles all sensitive operations
- ✅ CORS protection and domain validation
- ✅ Environment variable security

## 📁 Project Structure

```
├── api/
│   └── chat-proxy.js        🔒 Secure serverless function
├── index.html               🌐 Your main website
├── chat-widget.js           💬 AI chat widget
├── styles.css               🎨 Website styling
├── script.js                ⚡ Website functionality
├── .env.example             📝 Environment template
├── .gitignore              🚫 Git ignore rules
└── README.md               📖 This file
```

## 🛠️ Setup Instructions

### 1. Local Development

```bash
# Clone the repository
git clone [your-repo-url]
cd navianai-widget

# Copy environment template
cp .env.example .env

# Add your OpenAI API key to .env
echo "OPENAI_API_KEY=sk-your-actual-api-key-here" > .env

# Start local development (optional - for testing)
npx vercel dev
```

### 2. Production Deployment (Vercel)

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/navianai-widget)

#### Option B: Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variable
vercel env add OPENAI_API_KEY production
# Enter your OpenAI API key when prompted

# Deploy again to apply env vars
vercel --prod
```

#### Option C: Vercel Dashboard
1. Import project from GitHub
2. Go to Project Settings → Environment Variables
3. Add: `OPENAI_API_KEY` = `your-api-key-here`
4. Redeploy

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys) |

### Widget Configuration

Customize the chat widget in `index.html`:

```javascript
ChatWidget.init({
    proxyUrl: '/api/chat-proxy',              // Your secure proxy endpoint
    urls: ['https://your-website.com/'],      // Your knowledge base URLs
    companyName: 'Your Company',              // Your company name
    autoOpen: false,                          // Auto-open chat on page load
    position: 'bottom-right',                 // Widget position
    theme: 'light'                           // Color theme
});
```

### Advanced Configuration

```javascript
ChatWidget.init({
    proxyUrl: '/api/chat-proxy',
    urls: [
        'https://your-website.com/',
        'https://docs.your-website.com/',
        'https://support.your-website.com/faq'
    ],
    companyName: 'Your Company',
    autoOpen: true,
    position: 'bottom-left',                  // Options: bottom-right, bottom-left
    theme: 'dark',                           // Options: light, dark
    welcomeMessage: 'Hi! How can I help?',    // Custom welcome message
    placeholder: 'Ask me anything...',        // Input placeholder text
});
```

## 🔒 Security Features

### What's Secure
- ✅ **API Keys**: Stored server-side only, never exposed to browsers
- ✅ **Proxy Architecture**: All OpenAI calls go through your secure proxy
- ✅ **Environment Variables**: Handled by Vercel's secure infrastructure
- ✅ **HTTPS Only**: All communication encrypted in transit
- ✅ **CORS Protection**: Configurable domain restrictions

### What Users Cannot See
- ❌ Your OpenAI API key
- ❌ Proxy source code (`api/chat-proxy.js`)
- ❌ Environment variables
- ❌ Internal API logic

### What Users Can See (Safe)
- ✅ Widget JavaScript code (`chat-widget.js`)
- ✅ Website files (`index.html`, `styles.css`)
- ✅ Network requests to `/api/chat-proxy` (but not the internals)

### Optional: Domain Validation

Add domain restrictions to `api/chat-proxy.js`:

```javascript
// Add this to your chat-proxy.js for extra security
const allowedDomains = ['your-domain.com', 'www.your-domain.com'];
const origin = req.headers.origin || req.headers.referer;

if (!allowedDomains.some(domain => origin?.includes(domain))) {
    return res.status(403).json({ error: 'Domain not allowed' });
}
```

## 🎨 Customization

### Styling the Widget

The widget uses CSS custom properties for easy theming:

```css
:root {
    --chat-primary-color: #2563eb;
    --chat-secondary-color: #7c3aed;
    --chat-background: #ffffff;
    --chat-text-color: #333333;
    --chat-border-radius: 12px;
}
```

### Custom Messages

```javascript
ChatWidget.init({
    // ... other config
    messages: {
        welcome: 'Welcome to our support chat!',
        placeholder: 'Type your question here...',
        error: 'Sorry, something went wrong. Please try again.',
        offline: 'Chat is currently offline. Please try again later.'
    }
});
```

## 🐛 Troubleshooting

### Common Issues

**1. "API key not configured" Error**
```bash
# Check if environment variable is set
vercel env ls

# Add missing environment variable
vercel env add OPENAI_API_KEY production
```

**2. CORS Errors**
- Ensure your domain is configured correctly
- Check that requests are going to the right proxy URL

**3. Widget Not Loading**
- Verify `chat-widget.js` is loading correctly
- Check browser console for JavaScript errors
- Ensure `proxyUrl` points to the correct endpoint

**4. 404 on `/api/chat-proxy`**
- Verify `api/chat-proxy.js` exists
- Ensure Vercel deployment was successful
- Check Vercel function logs

### Debug Mode

Enable debug logging:

```javascript
ChatWidget.init({
    // ... other config
    debug: true  // Enables console logging
});
```

### Testing the Proxy

Test your proxy endpoint directly:

```bash
curl -X POST https://your-site.vercel.app/api/chat-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com"],
    "query": "test",
    "session_id": "test123",
    "company_name": "test"
  }'
```

## 📊 Monitoring & Analytics

### Usage Tracking

Monitor your API usage in:
- OpenAI Dashboard: [platform.openai.com](https://platform.openai.com/usage)
- Vercel Analytics: Project → Analytics tab

### Performance Monitoring

```javascript
// Add performance tracking
ChatWidget.init({
    // ... other config
    onMessage: (message, responseTime) => {
        console.log(`Response time: ${responseTime}ms`);
        // Send to your analytics service
    }
});
```

## 💰 Cost Management

### OpenAI API Costs
- Monitor usage in OpenAI dashboard
- Set usage limits in OpenAI settings
- Typical cost: $0.002-0.006 per message (depending on model)

### Vercel Costs
- Serverless functions: 100,000 free invocations/month
- Bandwidth: 100GB free/month
- Usually free for small-medium usage

## 🚀 Advanced Features

### Multiple Knowledge Sources

```javascript
ChatWidget.init({
    urls: [
        'https://your-main-site.com/',
        'https://docs.your-site.com/',
        'https://blog.your-site.com/',
        'https://support.your-site.com/faq'
    ],
    // ... other config
});
```

### Custom Styling

```javascript
ChatWidget.init({
    // ... other config
    customCSS: `
        .chat-widget {
            --primary-color: #your-brand-color;
            --border-radius: 8px;
        }
    `
});
```

### Integration with Analytics

```javascript
ChatWidget.init({
    // ... other config
    onChatStart: () => {
        gtag('event', 'chat_started');
    },
    onChatEnd: () => {
        gtag('event', 'chat_ended');
    }
});
```

## 🔄 Updates & Maintenance

### Keeping Updated
1. Watch the repository for updates
2. Review changelog before updating
3. Test updates in staging environment
4. Deploy to production

### Backup Strategy
- Environment variables are backed up by Vercel
- Source code is version controlled
- Consider exporting chat logs if needed

## 📞 Support

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)

### Community
- [GitHub Issues](https://github.com/your-username/navianai-widget/issues)
- [Discord Community](#) (if available)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Made with ❤️ by NavianAI**

*Secure AI chat widgets for the modern web*
