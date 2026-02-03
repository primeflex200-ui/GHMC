// IALA AI Assistant Module - External Add-on
class IALAAIAssistant {
    constructor() {
        this.isListening = false;
        this.currentLanguage = 'en';
        this.recognition = null;
        this.complaints = [];
        this.conversationHistory = [];
        this.supportedLanguages = {
            'en': 'English',
            'hi': 'Hindi',
            'te': 'Telugu',
            'ta': 'Tamil',
            'kn': 'Kannada',
            'ml': 'Malayalam'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.loadConversationHistory();
        this.setupLanguageSelector();
        
        // Auto-activate the chat widget for full-page mode
        this.activateChatWidget();
    }

    activateChatWidget() {
        const chatWidget = document.getElementById('ai-chat-widget');
        if (chatWidget) {
            chatWidget.classList.add('active');
            this.focusInput();
        }
    }

    setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('back-to-app');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBackToApp();
            });
        }

        // Chat toggle
        const chatToggle = document.getElementById('chat-toggle');
        const chatWidget = document.getElementById('ai-chat-widget');
        const minimizeBtn = document.getElementById('minimize-btn');

        chatToggle.addEventListener('click', () => {
            chatWidget.classList.toggle('active');
            if (chatWidget.classList.contains('active')) {
                this.clearNotificationBadge();
                this.focusInput();
            }
        });

        minimizeBtn.addEventListener('click', () => {
            chatWidget.classList.remove('active');
        });

        // Send message
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Voice toggle
        const voiceToggle = document.getElementById('voice-toggle');
        voiceToggle.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });

        // Quick actions
        const quickBtns = document.querySelectorAll('.quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Stop recording
        const stopRecording = document.getElementById('stop-recording');
        stopRecording.addEventListener('click', () => {
            this.stopVoiceRecording();
        });
    }

    setupLanguageSelector() {
        const langSelector = document.getElementById('lang-selector');
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'language-dropdown';
        dropdown.innerHTML = Object.entries(this.supportedLanguages)
            .map(([code, name]) => 
                `<div class="language-option ${code === this.currentLanguage ? 'selected' : ''}" data-lang="${code}">${name}</div>`
            ).join('');

        langSelector.parentNode.appendChild(dropdown);

        langSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('language-option')) {
                const newLang = e.target.dataset.lang;
                this.changeLanguage(newLang);
                dropdown.classList.remove('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.getLanguageCode();

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecording();
                this.addBotMessage('Sorry, I couldn\'t understand. Please try again or type your message.');
            };

            this.recognition.onend = () => {
                this.stopVoiceRecording();
            };
        }
    }

    getLanguageCode() {
        const langCodes = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'te': 'te-IN',
            'ta': 'ta-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN'
        };
        return langCodes[this.currentLanguage] || 'en-US';
    }

    changeLanguage(langCode) {
        this.currentLanguage = langCode;
        document.getElementById('lang-selector').textContent = langCode.toUpperCase();
        
        // Update speech recognition language
        if (this.recognition) {
            this.recognition.lang = this.getLanguageCode();
        }

        // Update language options
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.lang === langCode);
        });

        // Add language change message
        this.addBotMessage(`Language changed to ${this.supportedLanguages[langCode]}. How can I help you?`);
    }

    toggleVoiceRecording() {
        if (this.isListening) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        if (!this.recognition) {
            this.addBotMessage('Voice recognition is not supported in your browser. Please type your message.');
            return;
        }

        this.isListening = true;
        document.getElementById('voice-toggle').classList.add('active');
        document.getElementById('voice-recording').style.display = 'block';
        document.getElementById('chat-input').style.display = 'none';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.stopVoiceRecording();
        }
    }

    stopVoiceRecording() {
        this.isListening = false;
        document.getElementById('voice-toggle').classList.remove('active');
        document.getElementById('voice-recording').style.display = 'none';
        document.getElementById('chat-input').style.display = 'block';
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    handleVoiceInput(transcript) {
        this.addUserMessage(transcript);
        this.processUserInput(transcript);
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.addUserMessage(message);
        input.value = '';
        
        this.processUserInput(message);
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
            <span class="message-time">${this.getCurrentTime()}</span>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store in conversation history
        this.conversationHistory.push({
            type: 'user',
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    addBotMessage(message, includeActions = false) {
        const messagesContainer = document.getElementById('chat-messages');
        
        // Show typing indicator first
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            let actionsHTML = '';
            if (includeActions) {
                actionsHTML = `
                    <div class="quick-actions">
                        <button class="quick-btn" data-action="track">Track Complaint</button>
                        <button class="quick-btn" data-action="new">New Complaint</button>
                        <button class="quick-btn" data-action="help">Need Help</button>
                    </div>
                `;
            }
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(message)}</p>
                    ${actionsHTML}
                </div>
                <span class="message-time">${this.getCurrentTime()}</span>
            `;
            
            messagesContainer.appendChild(messageDiv);
            this.scrollToBottom();
            
            // Setup new quick action buttons
            if (includeActions) {
                messageDiv.querySelectorAll('.quick-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const action = e.target.dataset.action;
                        this.handleQuickAction(action);
                    });
                });
            }
        }, 1000 + Math.random() * 1000); // Simulate processing time
        
        // Store in conversation history
        this.conversationHistory.push({
            type: 'bot',
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    processUserInput(input) {
        const lowerInput = input.toLowerCase();
        
        // Detect complaint categories
        if (this.containsKeywords(lowerInput, ['street', 'light', 'lamp', 'bulb'])) {
            this.handleComplaintCategory('street-light', input);
        } else if (this.containsKeywords(lowerInput, ['pothole', 'road', 'damage', 'crack'])) {
            this.handleComplaintCategory('pothole', input);
        } else if (this.containsKeywords(lowerInput, ['garbage', 'waste', 'trash', 'collection'])) {
            this.handleComplaintCategory('garbage', input);
        } else if (this.containsKeywords(lowerInput, ['water', 'supply', 'tap', 'pipe'])) {
            this.handleComplaintCategory('water-supply', input);
        } else if (this.containsKeywords(lowerInput, ['drainage', 'sewage', 'drain', 'block'])) {
            this.handleComplaintCategory('drainage', input);
        } else if (this.containsKeywords(lowerInput, ['cctv', 'camera', 'security'])) {
            this.handleComplaintCategory('cctv', input);
        } else if (this.containsKeywords(lowerInput, ['fogging', 'mosquito', 'spray'])) {
            this.handleComplaintCategory('fogging', input);
        } else if (this.containsKeywords(lowerInput, ['park', 'garden', 'tree', 'green'])) {
            this.handleComplaintCategory('green-belt', input);
        } else if (this.containsKeywords(lowerInput, ['track', 'status', 'complaint', 'id'])) {
            this.handleComplaintTracking(input);
        } else if (this.containsKeywords(lowerInput, ['help', 'support', 'how'])) {
            this.provideHelp();
        } else {
            this.handleGeneralInquiry(input);
        }
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    handleComplaintCategory(category, originalInput) {
        const categoryNames = {
            'street-light': 'Street Light',
            'pothole': 'Road Pothole',
            'garbage': 'Garbage Collection',
            'water-supply': 'Water Supply',
            'drainage': 'Drainage',
            'cctv': 'CCTV',
            'fogging': 'Fogging',
            'green-belt': 'Green Belt'
        };

        const complaintId = this.generateComplaintId();
        const complaint = {
            id: complaintId,
            category: category,
            description: originalInput,
            status: 'received',
            timestamp: new Date().toISOString(),
            language: this.currentLanguage,
            location: 'Auto-detected location'
        };

        this.complaints.push(complaint);
        
        // Integrate with main system
        this.integrateWithMainSystem(complaint);

        const response = `I've received your ${categoryNames[category]} complaint and automatically categorized it. 

Complaint ID: ${complaintId}
Status: <span class="complaint-status status-received">Received</span>
Category: ${categoryNames[category]}

Your complaint has been logged and will be assigned to the appropriate team within 2 hours. You'll receive updates on the progress.`;

        this.addBotMessage(response, true);
    }

    handleComplaintTracking(input) {
        // Extract complaint ID if provided
        const idMatch = input.match(/IALA\d{7}/i);
        
        if (idMatch) {
            const complaintId = idMatch[0].toUpperCase();
            const complaint = this.complaints.find(c => c.id === complaintId);
            
            if (complaint) {
                const statusText = this.getStatusText(complaint.status);
                this.addBotMessage(`Complaint ${complaintId} Status: ${statusText}. Last updated: ${this.formatDate(complaint.timestamp)}`);
            } else {
                this.addBotMessage(`I couldn't find complaint ${complaintId}. Please check the ID and try again.`);
            }
        } else {
            // Show recent complaints
            if (this.complaints.length > 0) {
                const recent = this.complaints.slice(-3);
                let response = 'Here are your recent complaints:\n\n';
                recent.forEach(complaint => {
                    response += `${complaint.id}: ${complaint.category} - ${this.getStatusText(complaint.status)}\n`;
                });
                this.addBotMessage(response);
            } else {
                this.addBotMessage('You don\'t have any complaints yet. How can I help you file one?');
            }
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'street-light':
                this.addUserMessage('Street light issue');
                this.processUserInput('street light not working');
                break;
            case 'pothole':
                this.addUserMessage('Road pothole');
                this.processUserInput('road pothole needs repair');
                break;
            case 'garbage':
                this.addUserMessage('Garbage collection');
                this.processUserInput('garbage collection issue');
                break;
            case 'water':
                this.addUserMessage('Water supply');
                this.processUserInput('water supply problem');
                break;
            case 'track':
                this.addUserMessage('Track complaint');
                this.handleComplaintTracking('track my complaints');
                break;
            case 'new':
                this.addUserMessage('New complaint');
                this.addBotMessage('What type of issue would you like to report? You can describe it in any supported language.');
                break;
            case 'help':
                this.addUserMessage('Need help');
                this.provideHelp();
                break;
        }
    }

    provideHelp() {
        const helpMessage = `I can help you with:

• Filing complaints for civic issues
• Tracking existing complaints
• Providing status updates
• Multi-language support (English, Hindi, Telugu, Tamil, Kannada, Malayalam)
• Voice input for hands-free operation

Available 24/7 for your convenience. Just describe your issue and I'll categorize and log it automatically.`;

        this.addBotMessage(helpMessage, true);
    }

    handleGeneralInquiry(input) {
        const responses = [
            'I understand you have a concern. Could you please specify what type of civic issue you\'d like to report?',
            'I\'m here to help with civic complaints. What specific problem are you facing?',
            'Please describe the civic issue you\'d like to report, and I\'ll help categorize and log it for you.'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addBotMessage(randomResponse);
    }

    generateComplaintId() {
        const timestamp = Date.now().toString().slice(-7);
        return `IALA${timestamp}`;
    }

    getStatusText(status) {
        const statusMap = {
            'received': '<span class="complaint-status status-received">Received</span>',
            'processing': '<span class="complaint-status status-processing">Processing</span>',
            'assigned': '<span class="complaint-status status-assigned">Assigned</span>',
            'resolved': '<span class="complaint-status status-resolved">Resolved</span>'
        };
        return statusMap[status] || status;
    }

    integrateWithMainSystem(complaint) {
        // This would integrate with the main IALA system via API
        // For demo purposes, we'll simulate the integration
        console.log('Integrating complaint with main system:', complaint);
        
        // Simulate status updates
        setTimeout(() => {
            complaint.status = 'processing';
            this.notifyStatusUpdate(complaint);
        }, 30000); // 30 seconds

        setTimeout(() => {
            complaint.status = 'assigned';
            this.notifyStatusUpdate(complaint);
        }, 120000); // 2 minutes
    }

    notifyStatusUpdate(complaint) {
        if (!document.getElementById('ai-chat-widget').classList.contains('active')) {
            this.showNotificationBadge();
        }
        
        // Add status update message
        const statusText = this.getStatusText(complaint.status);
        this.addBotMessage(`Update: Complaint ${complaint.id} status changed to ${statusText}`);
    }

    showNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.style.display = 'flex';
    }

    clearNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        badge.textContent = '0';
        badge.style.display = 'none';
    }

    focusInput() {
        setTimeout(() => {
            document.getElementById('chat-input').focus();
        }, 100);
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadConversationHistory() {
        // Load from localStorage if available
        const saved = localStorage.getItem('infra-ai-history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }

    saveConversationHistory() {
        localStorage.setItem('infra-ai-history', JSON.stringify(this.conversationHistory));
    }

    goBackToApp() {
        // Save current conversation before leaving
        this.saveConversationHistory();
        
        // Check if user has a valid session
        const userData = localStorage.getItem('infra_user');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                
                // Navigate back with appropriate parameters based on user type
                if (user.isGuest) {
                    // For guest users, always use guest access parameter
                    window.location.href = 'index.html?access=guest';
                } else {
                    // For registered users, go back to main app
                    window.location.href = 'index.html';
                }
                return;
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        
        // Fallback: if no user data found, redirect to auth system
        window.location.href = 'auth-system.html';
    }
}

// Initialize AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.iala_ai = new IALAAIAssistant();
    
    // Save conversation history before page unload
    window.addEventListener('beforeunload', () => {
        if (window.infra_ai) {
            window.infra_ai.saveConversationHistory();
        }
    });
});