// Integration Script - Add this to existing GHMC app to enable AI module
(function() {
    'use strict';

    // Check if AI module is already loaded
    if (window.ghmc_ai_integrated) {
        return;
    }

    // Configuration
    const AI_MODULE_CONFIG = {
        enabled: true,
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        autoLoad: true,
        syncWithMainApp: true,
        showNotifications: true
    };

    // Load AI module assets
    function loadAIModule() {
        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'ai-module.css';
        document.head.appendChild(cssLink);

        // Load AI module HTML
        fetch('ai-module.html')
            .then(response => response.text())
            .then(html => {
                // Extract just the AI container from the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const aiContainer = doc.querySelector('.ai-container');
                
                if (aiContainer) {
                    // Position the AI module
                    aiContainer.style.position = 'fixed';
                    aiContainer.style.zIndex = '10000';
                    
                    switch (AI_MODULE_CONFIG.position) {
                        case 'bottom-left':
                            aiContainer.style.bottom = '20px';
                            aiContainer.style.left = '20px';
                            aiContainer.style.right = 'auto';
                            break;
                        case 'top-right':
                            aiContainer.style.top = '20px';
                            aiContainer.style.right = '20px';
                            aiContainer.style.bottom = 'auto';
                            break;
                        case 'top-left':
                            aiContainer.style.top = '20px';
                            aiContainer.style.left = '20px';
                            aiContainer.style.right = 'auto';
                            aiContainer.style.bottom = 'auto';
                            break;
                        default: // bottom-right
                            aiContainer.style.bottom = '20px';
                            aiContainer.style.right = '20px';
                            break;
                    }
                    
                    document.body.appendChild(aiContainer);
                    
                    // Load JavaScript files
                    loadScript('ai-integration.js', () => {
                        loadScript('ai-module.js', () => {
                            initializeIntegration();
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Failed to load AI module:', error);
            });
    }

    // Load script helper
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
        };
        document.head.appendChild(script);
    }

    // Initialize integration between AI module and main app
    function initializeIntegration() {
        // Wait for both systems to be ready
        const checkReady = setInterval(() => {
            if (window.ghmc_ai && window.ghmc_integration) {
                clearInterval(checkReady);
                setupIntegration();
            }
        }, 100);
    }

    function setupIntegration() {
        console.log('GHMC AI Module integrated successfully');
        
        // Sync complaints between AI module and main app
        if (AI_MODULE_CONFIG.syncWithMainApp && window.ghmc_app) {
            syncComplaintsWithMainApp();
        }

        // Setup cross-system notifications
        if (AI_MODULE_CONFIG.showNotifications) {
            setupNotifications();
        }

        // Mark as integrated
        window.ghmc_ai_integrated = true;

        // Dispatch integration ready event
        document.dispatchEvent(new CustomEvent('ghmc-ai-ready', {
            detail: {
                aiModule: window.ghmc_ai,
                integration: window.ghmc_integration
            }
        }));
    }

    function syncComplaintsWithMainApp() {
        // Listen for new complaints from AI module
        document.addEventListener('ai-complaint-submitted', (event) => {
            const complaint = event.detail;
            
            // Add to main app's complaint system if available
            if (window.ghmc_app && typeof window.ghmc_app.addComplaint === 'function') {
                window.ghmc_app.addComplaint(complaint);
            }
            
            console.log('AI complaint synced with main app:', complaint.id);
        });

        // Listen for status updates from main app
        document.addEventListener('main-app-complaint-updated', (event) => {
            const complaint = event.detail;
            
            // Update AI module if it has this complaint
            if (window.ghmc_ai && window.ghmc_ai.complaints) {
                const aiComplaint = window.ghmc_ai.complaints.find(c => c.id === complaint.id);
                if (aiComplaint) {
                    aiComplaint.status = complaint.status;
                    aiComplaint.lastUpdated = complaint.lastUpdated;
                    
                    // Notify user through AI module
                    window.ghmc_ai.notifyStatusUpdate(aiComplaint);
                }
            }
        });
    }

    function setupNotifications() {
        // Show notification when AI module captures a complaint
        document.addEventListener('ai-complaint-submitted', (event) => {
            if (AI_MODULE_CONFIG.showNotifications) {
                showNotification(
                    'AI Assistant',
                    `New complaint captured: ${event.detail.id}`,
                    'success'
                );
            }
        });

        // Show notification for status updates
        document.addEventListener('complaint-status-updated', (event) => {
            if (AI_MODULE_CONFIG.showNotifications) {
                showNotification(
                    'Status Update',
                    `Complaint ${event.detail.id} is now ${event.detail.status}`,
                    'info'
                );
            }
        });
    }

    function showNotification(title, message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#333' : type === 'error' ? '#666' : '#333'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            text-align: center;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        `;
        
        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);

        // Click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // Public API for main app to interact with AI module
    window.GHMC_AI_API = {
        isEnabled: () => AI_MODULE_CONFIG.enabled,
        isReady: () => window.ghmc_ai_integrated === true,
        
        showAIChat: () => {
            if (window.ghmc_ai) {
                const chatWidget = document.getElementById('ai-chat-widget');
                const chatToggle = document.getElementById('chat-toggle');
                if (chatWidget && chatToggle) {
                    chatWidget.classList.add('active');
                    window.ghmc_ai.clearNotificationBadge();
                    window.ghmc_ai.focusInput();
                }
            }
        },
        
        hideAIChat: () => {
            if (window.ghmc_ai) {
                const chatWidget = document.getElementById('ai-chat-widget');
                if (chatWidget) {
                    chatWidget.classList.remove('active');
                }
            }
        },
        
        submitComplaintToAI: (complaintData) => {
            if (window.ghmc_ai) {
                // Simulate user input to AI
                window.ghmc_ai.processUserInput(complaintData.description);
                return true;
            }
            return false;
        },
        
        getAIComplaints: () => {
            if (window.ghmc_integration) {
                return window.ghmc_integration.complaints;
            }
            return [];
        },
        
        updateComplaintStatus: (complaintId, status) => {
            if (window.ghmc_integration) {
                return window.ghmc_integration.mockAPI.updateComplaintStatus(complaintId, status);
            }
            return Promise.resolve({ success: false, error: 'AI module not ready' });
        }
    };

    // Auto-load if enabled
    if (AI_MODULE_CONFIG.enabled && AI_MODULE_CONFIG.autoLoad) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadAIModule);
        } else {
            loadAIModule();
        }
    }

    // Expose configuration for customization
    window.GHMC_AI_CONFIG = AI_MODULE_CONFIG;

})();