/*
 * AI Web Crawler Chat Widget - Professional Design
 * Combines whisper-wisdom design with optimized backend streaming
 */
(function () {
  'use strict';

  const defaultConfig = {
    apiUrl: 'http://localhost:8000/chat',
    proxyUrl: null,
    urls: [],
    companyName: 'Assistant',
    position: 'bottom-right',
    autoOpen: false,
    showWelcome: true,
  };

  let config = { ...defaultConfig };
  let isInitialized = false;
  let markedLoaded = false;

  function loadMarkedJS() {
    return new Promise((resolve, reject) => {
      if (typeof marked !== 'undefined') {
        markedLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      script.onload = () => {
        markedLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Marked.js'));
      };
      document.head.appendChild(script);
    });
  }

  function createWidget() {
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
        .chat-bubble { width: 60px; height: 60px; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; position: relative; overflow: hidden; }
        .chat-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(37, 99, 235, 0.4); }
        .chat-bubble::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s; }
        .chat-bubble:hover::before { left: 100%; }
        .chat-icon { width: 24px; height: 24px; fill: white; transition: transform 0.3s ease; }
        .chat-bubble.active .chat-icon { transform: rotate(180deg); }
        .chat-window { position: absolute; bottom: 80px; right: 0; width: 500px; height: 700px; max-width: calc(100vw - 40px); max-height: calc(100vh - 120px); background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); display: none; flex-direction: column; overflow: hidden; transform: scale(0.95); opacity: 0; transition: all 0.3s ease; resize: both; min-width: 400px; min-height: 500px; }
        .chat-window.expanded { width: 800px; height: 600px; }
        .chat-window.active { display: flex; transform: scale(1); opacity: 1; }
        .chat-header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .chat-header-left { display: flex; align-items: center; gap: 16px; }
        .chat-header-right { display: flex; align-items: center; gap: 12px; }
        .chat-header h3 { font-size: 18px; font-weight: 600; }
        .chat-header p { font-size: 14px; opacity: 0.9; margin-top: 2px; }
        .expand-btn, .close-btn, .clear-btn { background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; padding: 4px; }
        .expand-btn:hover, .close-btn:hover, .clear-btn:hover { opacity: 1; }
        .close-btn { font-size: 24px; }
        .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; }
        .message { animation: fadeInUp 0.3s ease; }
        .message.user { padding: 16px 20px; display: flex; justify-content: flex-end; background: transparent; }
        .user-message-bubble { background: #f8f9fa; color: #333; padding: 12px 16px; border-radius: 8px; max-width: 80%; position: relative; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e9ecef; }
        .user-message-content { font-size: 14px; line-height: 1.5; margin: 0; }
        .message.bot { padding: 0; background: white; border-bottom: 1px solid #e9ecef; }
        .ai-response { width: 100%; }
        .response-section { padding: 20px; border-bottom: 1px solid #e9ecef; }
        .response-section:last-child { border-bottom: none; }
        .response-section h4 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; margin-bottom: 12px; }
        .reasoning-container { margin-bottom: 0; }
        .reasoning-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; transition: background-color 0.2s; width: 100%; }
        .reasoning-toggle:hover { background: #e9ecef; }
        .reasoning-toggle h4 { flex: 1; margin: 0; font-size: 13px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
        .reasoning-toggle .chevron { width: 16px; height: 16px; transition: transform 0.2s; fill: #495057; }
        .reasoning-toggle.expanded .chevron { transform: rotate(180deg); }
        .reasoning-content { max-height: 0; overflow: hidden; transition: max-height 0.1s ease-out; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .reasoning-content.expanded { max-height: 300px; overflow-y: auto; }
        .reasoning-content-inner { padding: 20px; font-size: 14px; line-height: 1.6; color: #495057; }
        .content-section { background: white; }
        .content-section h4 { color: #212529; }
        .content-text { font-size: 14px; line-height: 1.6; color: #333; }
        .sources-container { margin-bottom: 0; }
        .sources-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; transition: background-color 0.2s; width: 100%; }
        .sources-toggle:hover { background: #e9ecef; }
        .sources-toggle h4 { flex: 1; margin: 0; font-size: 13px; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
        .sources-toggle .chevron { width: 16px; height: 16px; transition: transform 0.2s; fill: #495057; }
        .sources-toggle.expanded .chevron { transform: rotate(180deg); }
        .sources-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .sources-content.expanded { max-height: 200px; overflow-y: auto; }
        .sources-content-inner { padding: 20px; }
        .source-link { display: block; color: #0066cc; text-decoration: none; margin-bottom: 8px; font-size: 13px; padding: 4px 0; }
        .source-link:hover { text-decoration: underline; }
        .content-text h1, .content-text h2, .content-text h3 { margin-bottom: 12px; color: #212529; font-weight: 600; }
        .content-text h1 { font-size: 20px; } .content-text h2 { font-size: 18px; } .content-text h3 { font-size: 16px; }
        .content-text p { margin-bottom: 12px; }
        .content-text ul, .content-text ol { margin-left: 20px; margin-bottom: 12px; }
        .content-text li { margin-bottom: 4px; }
        .content-text code { background: #f1f3f4; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Courier New', monospace; font-size: 13px; }
        .content-text pre { background: #f8f9fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 12px 0; border: 1px solid #e9ecef; }
        .content-text blockquote { border-left: 4px solid #dee2e6; padding-left: 16px; margin: 12px 0; font-style: italic; color: #6c757d; }
        .content-text strong { font-weight: 600; }
        .content-text a { color: #2563eb; text-decoration: none; border-bottom: 1px solid transparent; transition: all 0.2s ease; font-weight: 500; position: relative; }
        .content-text a:hover { color: #1d4ed8; border-bottom-color: #2563eb; background: rgba(37, 99, 235, 0.05); border-radius: 2px; }
        .content-text a:focus { outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 2px; }
        .content-text a:visited { color: #7c3aed; }
        .content-text a:visited:hover { color: #6d28d9; border-bottom-color: #7c3aed; background: rgba(124, 58, 237, 0.05); }
        .content-text .markdown-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; background: white; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; }
        .content-text .markdown-table th, .content-text .markdown-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e9ecef; vertical-align: top; }
        .content-text .markdown-table th { background: #f8f9fa; font-weight: 600; color: #495057; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .content-text .markdown-table tr:last-child td { border-bottom: none; }
        .content-text .markdown-table tr:nth-child(even) { background: #f8f9fa; }
        .content-text .markdown-table tr:hover { background: #e9ecef; }
        .chat-input { padding: 20px; border-top: 1px solid #e9ecef; background: white; flex-shrink: 0; }
        .input-container { display: flex; gap: 12px; align-items: flex-end; }
        .chat-input textarea { flex: 1; border: 1px solid #e9ecef; border-radius: 20px; padding: 12px 16px; font-size: 14px; font-family: inherit; resize: none; outline: none; transition: border-color 0.2s; max-height: 100px; cursor: text; caret-color: #333; color: #333; background-color: #fff; }
        .chat-input textarea:focus { border-color: #2563eb; cursor: text; caret-color: #2563eb; }
        .chat-input textarea::placeholder { color: #999; opacity: 1; }
        .send-btn { width: 40px; height: 40px; background: linear-gradient(135deg, #2563eb, #7c3aed); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        .send-btn:hover { transform: scale(1.1); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .loading { display: flex; gap: 4px; padding: 20px; justify-content: center; }
        .loading-dot { width: 6px; height: 6px; background: #6c757d; border-radius: 50%; animation: loadingPulse 1.4s infinite ease-in-out; }
        .loading-dot:nth-child(1) { animation-delay: -0.32s; } .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        .crawling-loader { padding: 20px; border-bottom: 1px solid #e9ecef; background: #f8f9fa; }
        .crawling-status { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .crawling-text { font-size: 14px; color: #6c757d; font-weight: 500; }
        .crawling-loader .loading { padding: 0; }
        .streaming-cursor { color: #1a1a1a; font-weight: bold; animation: chatWidgetBlink 1s infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadingPulse { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes chatWidgetBlink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @media (max-width: 768px) { .chat-widget { right: 20px; } .chat-window { width: calc(100vw - 40px); height: calc(100vh - 100px); bottom: 80px; right: 20px; resize: none; } .chat-window.expanded { width: calc(100vw - 40px); height: calc(100vh - 100px); } .user-message-bubble { max-width: 90%; } }
        @media (max-width: 480px) { .chat-window { width: calc(100vw - 20px); right: 10px; } .chat-window.expanded { width: calc(100vw - 20px); } }
      </style>
      <div class="chat-widget">
        <div class="chat-bubble" id="chatBubble">
          <svg class="chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
        <div class="chat-window" id="chatWindow">
          <div class="chat-header">
            <div class="chat-header-left">
              <div><h3>AI Assistant</h3><p>Ask me anything!</p></div>
            </div>
            <div class="chat-header-right">
              <button class="clear-btn" id="clearBtn" title="Clear Chat"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
              <button class="expand-btn" id="expandBtn" title="Expand"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
              <button class="close-btn" id="closeBtn" title="Close">&times;</button>
            </div>
          </div>
          <div class="chat-messages" id="chatMessages">
            <div class="message bot">
              <div class="ai-response">
                <div class="response-section content-section">
                  <div class="content-text">Hi! I'm your AI assistant. How can I help you today?</div>
                </div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <div class="input-container">
              <textarea id="messageInput" placeholder="Type your message..." rows="1"></textarea>
              <button class="send-btn" id="sendBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widgetContainer);
    return widgetContainer;
  }

  function initializeWidget() {
    const chatBubble = document.getElementById('chatBubble');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeBtn');
    const expandBtn = document.getElementById('expandBtn');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    let isOpen = false;
    let isLoading = false;
    let isExpanded = false;
    let messages = [];
    let currentSessionId = generateSessionId();

    let activeStreamingTimeouts = [];
    let activeStreamingElements = [];
    let streamingCoordinator = {
      reasoningActive: false,
      bufferedContent: null,
      bufferedSources: null,
      waitingForReasoning: false,
      currentAiResponseDiv: null,
      fullReasoningData: [],
      streamingStopped: false,
    };

    function toggleChat() {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    }

    function openChat() {
      isOpen = true;
      chatBubble.classList.add('active');
      chatWindow.classList.add('active');
      messageInput.focus();
    }

    function closeChat() {
      isOpen = false;
      chatBubble.classList.remove('active');
      chatWindow.classList.remove('active');
    }

    function toggleExpand() {
      isExpanded = !isExpanded;
      if (isExpanded) {
        chatWindow.classList.add('expanded');
      } else {
        chatWindow.classList.remove('expanded');
      }
    }

    function generateSessionId() {
      return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    function parseMarkdown(text) {
      if (!text) return '';
      try {
        if (typeof marked === 'undefined') {
          return text.replace(/\n/g, '<br>');
        }
        let html = marked.parse(text, {
          breaks: true,
          gfm: true,
          sanitize: false,
          smartypants: false,
        });
        html = html.replace(/<table>/g, '<table class="markdown-table">');
        return html;
      } catch (error) {
        return text.replace(/\n/g, '<br>');
      }
    }

    function addUserMessage(content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message user';
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'user-message-bubble';
      const contentDiv = document.createElement('div');
      contentDiv.className = 'user-message-content';
      contentDiv.textContent = content;
      bubbleDiv.appendChild(contentDiv);
      messageDiv.appendChild(bubbleDiv);
      chatMessages.appendChild(messageDiv);
      scrollToBottom();
    }

    function addAIResponse() {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot';
      const aiResponseDiv = document.createElement('div');
      aiResponseDiv.className = 'ai-response';
      messageDiv.appendChild(aiResponseDiv);
      chatMessages.appendChild(messageDiv);
      scrollToBottom();
      return { messageDiv, aiResponseDiv };
    }

    function clearActiveStreaming() {
      activeStreamingTimeouts.forEach((timeout) => clearTimeout(timeout));
      activeStreamingTimeouts = [];
      activeStreamingElements = [];
    }

    function completeActiveReasoningStreaming() {
      streamingCoordinator.streamingStopped = true;

      if (streamingCoordinator.currentAiResponseDiv && streamingCoordinator.fullReasoningData.length > 0) {
        const reasoningContentInner = streamingCoordinator.currentAiResponseDiv.querySelector('.reasoning-content-inner');
        if (reasoningContentInner) {
          const fullReasoningHTML = streamingCoordinator.fullReasoningData
            .map((step) => `<strong>${step.title}</strong><br>${step.thought || step.reasoning || ''}`)
            .join('<br><br>');
          reasoningContentInner.innerHTML = fullReasoningHTML;
        }
      } else {
        activeStreamingElements.forEach(({ element, fullText }) => {
          if (element && fullText) {
            element.innerHTML = fullText;
          }
        });
      }

      clearActiveStreaming();
      streamingCoordinator.reasoningActive = false;
    }

    function streamTextWordByWord(element, fullText, onComplete) {
      const words = fullText.split(' ');
      let currentIndex = 0;
      element.innerHTML = '';
      streamingCoordinator.reasoningActive = true;
      activeStreamingElements.push({ element, fullText });

      function addNextWord() {
        if (streamingCoordinator.streamingStopped) {
          return;
        }
        if (currentIndex < words.length) {
          element.innerHTML = words.slice(0, currentIndex + 1).join(' ');
          currentIndex++;
          const delay = 80 + Math.random() * 40;
          const timeout = setTimeout(addNextWord, delay);
          activeStreamingTimeouts.push(timeout);
        } else {
          element.innerHTML = fullText;
          streamingCoordinator.reasoningActive = false;
          if (streamingCoordinator.waitingForReasoning && streamingCoordinator.currentAiResponseDiv) {
            releaseBufferedContent();
          }
          if (onComplete) onComplete();
        }
      }
      addNextWord();
    }

    function releaseBufferedContent() {
      if (!streamingCoordinator.currentAiResponseDiv || !streamingCoordinator.waitingForReasoning) {
        return;
      }
      updateContentOnly(streamingCoordinator.currentAiResponseDiv, streamingCoordinator.bufferedContent);
      if (streamingCoordinator.bufferedSources && streamingCoordinator.bufferedSources.length > 0) {
        addSourcesOnly(streamingCoordinator.currentAiResponseDiv, streamingCoordinator.bufferedSources);
      }
      streamingCoordinator.bufferedContent = null;
      streamingCoordinator.bufferedSources = null;
      streamingCoordinator.waitingForReasoning = false;
      streamingCoordinator.currentAiResponseDiv = null;
    }

    function appendNewReasoningStep(aiResponseDiv, newStep, isFirstStep) {
      let reasoningContainer = aiResponseDiv.querySelector('.reasoning-container');
      if (!reasoningContainer && isFirstStep) {
        reasoningContainer = document.createElement('div');
        reasoningContainer.className = 'reasoning-container';
        const reasoningToggle = document.createElement('div');
        reasoningToggle.className = 'reasoning-toggle expanded';
        reasoningToggle.innerHTML = `<h4>Thinking...</h4><svg class="chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`;
        const reasoningContent = document.createElement('div');
        reasoningContent.className = 'reasoning-content expanded';
        const reasoningContentInner = document.createElement('div');
        reasoningContentInner.className = 'reasoning-content-inner';

        reasoningToggle.addEventListener('click', () => {
          const isExpanded = reasoningToggle.classList.toggle('expanded');
          reasoningContent.classList.toggle('expanded', isExpanded);
        });

        reasoningContent.appendChild(reasoningContentInner);
        reasoningContainer.appendChild(reasoningToggle);
        reasoningContainer.appendChild(reasoningContent);
        aiResponseDiv.appendChild(reasoningContainer);
      }

      streamingCoordinator.currentAiResponseDiv = aiResponseDiv;
      const reasoningContentInner = reasoningContainer?.querySelector('.reasoning-content-inner');
      if (reasoningContentInner) {
        const stepElement = document.createElement('div');
        stepElement.className = 'reasoning-step';
        stepElement.style.marginBottom = '16px';
        const stepText = `<strong>${newStep.title}</strong><br>${newStep.thought || newStep.reasoning || ''}`;
        stepElement.innerHTML = isFirstStep ? stepText : '<br><br>' + stepText;
        streamTextWordByWord(stepElement, stepElement.innerHTML, () => {});
        reasoningContentInner.appendChild(stepElement);
        scrollToBottom();
      }
    }

    function updateContentOnly(aiResponseDiv, content) {
      let contentSection = aiResponseDiv.querySelector('.content-section');
      if (contentSection) {
        const contentText = contentSection.querySelector('.content-text');
        if (contentText) {
          contentText.innerHTML = parseMarkdown(content);
        }
      } else {
        completeActiveReasoningStreaming();
        streamingCoordinator.reasoningActive = false;
        const reasoningToggle = aiResponseDiv.querySelector('.reasoning-toggle h4');
        if (reasoningToggle) {
          reasoningToggle.textContent = 'Thinking Complete';
        }

        const reasoningToggleElement = aiResponseDiv.querySelector('.reasoning-toggle');
        const reasoningContent = aiResponseDiv.querySelector('.reasoning-content');
        if (reasoningToggleElement && reasoningContent) {
          reasoningToggleElement.classList.remove('expanded');
          reasoningContent.classList.remove('expanded');
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'response-section content-section';
        contentDiv.innerHTML = `<div class="content-text">${parseMarkdown(content)}</div>`;
        aiResponseDiv.appendChild(contentDiv);
      }
      scrollToBottom();
    }

    function addSourcesOnly(aiResponseDiv, sources) {
      if (!sources || sources.length === 0) return;
      let sourcesContainer = aiResponseDiv.querySelector('.sources-container');
      if (!sourcesContainer) {
        sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'sources-container';
        const sourcesToggle = document.createElement('div');
        sourcesToggle.className = 'sources-toggle';
        sourcesToggle.innerHTML = `<h4>Sources</h4><svg class="chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`;
        const sourcesContent = document.createElement('div');
        sourcesContent.className = 'sources-content';
        const sourcesHtml = sources.map((source) => `<a href="${source.url}" target="_blank" class="source-link">${source.url}</a>`).join('');
        sourcesContent.innerHTML = `<div class="sources-content-inner">${sourcesHtml}</div>`;

        sourcesToggle.addEventListener('click', () => {
          const isExpanded = sourcesToggle.classList.toggle('expanded');
          sourcesContent.classList.toggle('expanded', isExpanded);
        });

        sourcesContainer.appendChild(sourcesToggle);
        sourcesContainer.appendChild(sourcesContent);
        aiResponseDiv.appendChild(sourcesContainer);
      }
      scrollToBottom();
    }

    function showLoading() {
      isLoading = true;
      sendBtn.disabled = true;
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message bot';
      loadingDiv.id = 'loadingMessage';
      loadingDiv.innerHTML = `<div class="loading"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>`;
      chatMessages.appendChild(loadingDiv);
      scrollToBottom();
    }

    function hideLoading() {
      isLoading = false;
      sendBtn.disabled = false;
      const loadingMessage = document.getElementById('loadingMessage');
      if (loadingMessage) {
        loadingMessage.remove();
      }
    }

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || isLoading) return;

      addUserMessage(message);
      messages.push({ role: 'user', content: message });
      messageInput.value = '';
      messageInput.style.height = 'auto';

      streamingCoordinator = {
        fullReasoningData: [],
        reasoningActive: false,
        bufferedContent: null,
        bufferedSources: null,
        waitingForReasoning: false,
        currentAiResponseDiv: null,
        streamingStopped: false,
      };
      clearActiveStreaming();

      showLoading();

      let aiResponseContainer = null;
      let loaderHidden = false;
      let streamData = {
        reasoning: [],
        content: '',
        sources: [],
        isStreaming: true,
      };

      try {
        const endpoint = config.proxyUrl || config.apiUrl;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urls: config.urls,
            query: message,
            session_id: currentSessionId,
            company_name: config.companyName,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseContainer = addAIResponse();
        aiResponseContainer = responseContainer.aiResponseDiv;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const chunk = JSON.parse(line.slice(6));
                switch (chunk.type) {
                  case 'content':
                    if (!loaderHidden) {
                      hideLoading();
                      loaderHidden = true;
                    }
                    if (aiResponseContainer) {
                      const crawlingLoader = aiResponseContainer.querySelector('.crawling-loader');
                      if (crawlingLoader) crawlingLoader.remove();
                    }
                    streamData.content = chunk.full_content || chunk.text;
                    streamData.isStreaming = true;
                    if (streamingCoordinator.reasoningActive) {
                      streamingCoordinator.bufferedContent = streamData.content;
                      streamingCoordinator.waitingForReasoning = true;
                      streamingCoordinator.currentAiResponseDiv = aiResponseContainer;
                    } else {
                      updateContentOnly(aiResponseContainer, streamData.content);
                    }
                    break;

                  case 'reasoning':
                    if (chunk.step) {
                      if (!loaderHidden) {
                        hideLoading();
                        loaderHidden = true;
                      }
                      if (aiResponseContainer) {
                        const crawlingLoader = aiResponseContainer.querySelector('.crawling-loader');
                        if (crawlingLoader) crawlingLoader.remove();
                      }
                      streamData.reasoning.push(chunk.step);
                      streamingCoordinator.fullReasoningData.push(chunk.step);
                      appendNewReasoningStep(aiResponseContainer, chunk.step, streamData.reasoning.length === 1);
                    }
                    break;

                  case 'crawling':
                    if (!loaderHidden) {
                      hideLoading();
                      loaderHidden = true;
                    }
                    if (aiResponseContainer) {
                      let crawlingLoader = aiResponseContainer.querySelector('.crawling-loader');
                      if (!crawlingLoader) {
                        crawlingLoader = document.createElement('div');
                        crawlingLoader.className = 'crawling-loader';
                        crawlingLoader.innerHTML = `
                          <div class="crawling-status">
                            <div class="loading">
                              <div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>
                            </div>
                            <div class="crawling-text">Analyzing content...</div>
                          </div>`;
                        aiResponseContainer.appendChild(crawlingLoader);
                        scrollToBottom();
                      }
                    }
                    break;

                  case 'completion':
                    if (aiResponseContainer) {
                      const crawlingLoader = aiResponseContainer.querySelector('.crawling-loader');
                      if (crawlingLoader) crawlingLoader.remove();
                    }
                    streamData.content = chunk.final_content || streamData.content;
                    streamData.sources = chunk.sources || [];
                    streamData.isStreaming = false;
                    if (streamingCoordinator.reasoningActive) {
                      streamingCoordinator.bufferedContent = streamData.content;
                      streamingCoordinator.bufferedSources = streamData.sources;
                      streamingCoordinator.waitingForReasoning = true;
                      streamingCoordinator.currentAiResponseDiv = aiResponseContainer;
                    } else {
                      updateContentOnly(aiResponseContainer, streamData.content);
                      addSourcesOnly(aiResponseContainer, streamData.sources);
                    }
                    break;

                  case 'error':
                    throw new Error(chunk.message);
                }
              } catch (e) {
                console.error('Chunk processing error:', e);
              }
            }
          }
        }
      } catch (err) {
        hideLoading();
        console.error('Stream error:', err);
        if (!aiResponseContainer) {
          const responseContainer = addAIResponse();
          aiResponseContainer = responseContainer.aiResponseDiv;
        }
        const errorData = {
          content: 'Sorry, I encountered an error. Please try again.',
        };
        updateContentOnly(aiResponseContainer, errorData.content);
      }
    }

    function scrollToBottom() {
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }

    function clearChat() {
      messages = [];
      currentSessionId = generateSessionId();
      chatMessages.innerHTML = '';
      const welcomeMessageDiv = document.createElement('div');
      welcomeMessageDiv.className = 'message bot';
      welcomeMessageDiv.innerHTML = `
        <div class="ai-response">
          <div class="response-section content-section">
            <div class="content-text">Hi! I'm your AI assistant. How can I help you today?</div>
          </div>
        </div>`;
      chatMessages.appendChild(welcomeMessageDiv);
      scrollToBottom();
    }

    chatBubble.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    expandBtn.addEventListener('click', toggleExpand);
    document.getElementById('clearBtn').addEventListener('click', clearChat);
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
    });

    if (config.autoOpen) {
      setTimeout(openChat, 1000);
    }
  }

  window.ChatWidget = {
    init: async function (userConfig = {}) {
      if (isInitialized) return;
      config = { ...defaultConfig, ...userConfig };
      try {
        await loadMarkedJS();
      } catch (error) {
        console.error('Marked.js failed to load, using fallback parsing:', error);
      }
      const initialize = () => {
        createWidget();
        initializeWidget();
        isInitialized = true;
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
    },
    open: function () {
      const button = document.getElementById('chatBubble');
      if (button) button.click();
    },
    close: function () {
      const closeBtn = document.getElementById('closeBtn');
      if (closeBtn) closeBtn.click();
    },
    configure: function (newConfig) {
      config = { ...config, ...newConfig };
    },
  };
})();