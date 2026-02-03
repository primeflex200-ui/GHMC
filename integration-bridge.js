// Integration Bridge - Connects all IALA modules seamlessly
class IALAIntegrationBridge {
    constructor() {
        this.modules = {
            mainApp: null,
            aiModule: null,
            authSystem: null,
            rbacSystem: null
        };
        this.eventBus = new EventTarget();
        this.config = {
            enableRealTimeSync: true,
            enableNotifications: true,
            enableAnalytics: true,
            enableAuditLog: true
        };
        this.init();
    }

    init() {
        this.detectModules();
        this.setupEventListeners();
        this.initializeCrossModuleCommunication();
        this.startHealthMonitoring();
        console.log('IALA Integration Bridge initialized');
    }

    detectModules() {
        // Detect which modules are loaded
        if (typeof window.iala_app !== 'undefined') {
            this.modules.mainApp = window.iala_app;
            console.log('Main IALA app detected');
        }

        if (typeof window.ghmc_ai !== 'undefined') {
            this.modules.aiModule = window.ghmc_ai;
            console.log('AI module detected');
        }

        if (typeof window.ghmc_auth !== 'undefined') {
            this.modules.authSystem = window.ghmc_auth;
            console.log('Auth system detected');
        }

        if (typeof window.rolePermissions !== 'undefined') {
            this.modules.rbacSystem = window.rolePermissions;
            console.log('RBAC system detected');
        }
    }

    setupEventListeners() {
        // Listen for module-specific events
        document.addEventListener('complaint-submitted', (e) => {
            this.handleComplaintSubmitted(e.detail);
        });

        document.addEventListener('complaint-status-updated', (e) => {
            this.handleComplaintStatusUpdated(e.detail);
        });

        document.addEventListener('user-logged-in', (e) => {
            this.handleUserLoggedIn(e.detail);
        });

        document.addEventListener('ai-complaint-captured', (e) => {
            this.handleAIComplaintCaptured(e.detail);
        });

        // Cross-module synchronization
        this.eventBus.addEventListener('sync-required', (e) => {
            this.performCrossModuleSync(e.detail);
        });
    }

    initializeCrossModuleCommunication() {
        // Setup communication channels between modules
        this.setupMainAppIntegration();
        this.setupAIModuleIntegration();
        this.setupAuthIntegration();
        this.setupRBACIntegration();
    }

    setupMainAppIntegration() {
        if (!this.modules.mainApp) return;

        // Enhance main app with additional features
        this.modules.mainApp.bridge = this;
        
        // Add authentication check to main app
        const originalNavigate = this.modules.mainApp.navigateToScreen;
        if (originalNavigate) {
            this.modules.mainApp.navigateToScreen = (screenName) => {
                // Check if user has permission for this screen
                if (this.modules.rbacSystem && !this.checkScreenPermission(screenName)) {
                    this.showPermissionDenied();
                    return;
                }
                originalNavigate.call(this.modules.mainApp, screenName);
            };
        }
    }

    setupAIModuleIntegration() {
        if (!this.modules.aiModule) return;

        // Enhance AI module with RBAC integration
        this.modules.aiModule.bridge = this;
        
        // Override complaint processing to include permissions
        const originalProcessInput = this.modules.aiModule.processUserInput;
        if (originalProcessInput) {
            this.modules.aiModule.processUserInput = (input) => {
                // Add user context to AI processing
                const userContext = this.getCurrentUserContext();
                return originalProcessInput.call(this.modules.aiModule, input, userContext);
            };
        }
    }

    setupAuthIntegration() {
        if (!this.modules.authSystem) return;

        // Enhance auth system with cross-module notifications
        this.modules.authSystem.bridge = this;
        
        // Override login to notify all modules
        const originalLogin = this.modules.authSystem.loginUser;
        if (originalLogin) {
            this.modules.authSystem.loginUser = (user) => {
                const result = originalLogin.call(this.modules.authSystem, user);
                if (result) {
                    this.notifyUserLogin(user);
                }
                return result;
            };
        }
    }

    setupRBACIntegration() {
        if (!this.modules.rbacSystem) return;

        // Enhance RBAC with audit logging
        this.modules.rbacSystem.bridge = this;
        
        // Override permission checks to log access
        const originalHasPermission = this.modules.rbacSystem.hasPermission;
        if (originalHasPermission) {
            this.modules.rbacSystem.hasPermission = (permission) => {
                const result = originalHasPermission.call(this.modules.rbacSystem, permission);
                this.logPermissionCheck(permission, result);
                return result;
            };
        }
    }

    // Event Handlers
    handleComplaintSubmitted(complaint) {
        console.log('Complaint submitted:', complaint.id);
        
        // Sync with all modules
        this.syncComplaintAcrossModules(complaint);
        
        // Auto-assign if RBAC is available
        if (this.modules.rbacSystem) {
            const assignment = this.modules.rbacSystem.routeComplaint(complaint);
            if (assignment) {
                this.autoAssignComplaint(complaint, assignment);
            }
        }
        
        // Notify AI module for learning
        if (this.modules.aiModule) {
            this.modules.aiModule.learnFromComplaint(complaint);
        }
        
        // Log for analytics
        this.logEvent('complaint_submitted', {
            complaintId: complaint.id,
            category: complaint.category,
            source: complaint.source || 'web'
        });
    }

    handleComplaintStatusUpdated(complaint) {
        console.log('Complaint status updated:', complaint.id, complaint.status);
        
        // Sync status across all modules
        this.syncComplaintStatusAcrossModules(complaint);
        
        // Send notifications
        this.sendStatusUpdateNotifications(complaint);
        
        // Update analytics
        this.updateComplaintAnalytics(complaint);
        
        // Log for audit
        this.logEvent('complaint_status_updated', {
            complaintId: complaint.id,
            oldStatus: complaint.previousStatus,
            newStatus: complaint.status,
            updatedBy: this.getCurrentUser()?.id
        });
    }

    handleUserLoggedIn(user) {
        console.log('User logged in:', user.name, user.role);
        
        // Initialize user-specific features
        this.initializeUserFeatures(user);
        
        // Load user preferences
        this.loadUserPreferences(user);
        
        // Setup role-specific UI
        this.setupRoleSpecificUI(user);
        
        // Log login event
        this.logEvent('user_login', {
            userId: user.id,
            role: user.role,
            timestamp: new Date().toISOString()
        });
    }

    handleAIComplaintCaptured(complaint) {
        console.log('AI captured complaint:', complaint.id);
        
        // Auto-tag the complaint
        if (this.modules.rbacSystem) {
            this.modules.rbacSystem.autoTagComplaint(complaint);
        }
        
        // Sync with main app
        if (this.modules.mainApp) {
            this.modules.mainApp.addComplaint(complaint);
        }
        
        // Log AI capture
        this.logEvent('ai_complaint_captured', {
            complaintId: complaint.id,
            language: complaint.language,
            confidence: complaint.aiConfidence
        });
    }

    // Cross-Module Synchronization
    syncComplaintAcrossModules(complaint) {
        // Sync with main app
        if (this.modules.mainApp && this.modules.mainApp.addComplaint) {
            this.modules.mainApp.addComplaint(complaint);
        }
        
        // Sync with AI module
        if (this.modules.aiModule && this.modules.aiModule.addComplaint) {
            this.modules.aiModule.addComplaint(complaint);
        }
        
        // Update RBAC system
        if (this.modules.rbacSystem && this.modules.rbacSystem.saveComplaint) {
            this.modules.rbacSystem.saveComplaint(complaint);
        }
        
        // Broadcast sync event
        this.eventBus.dispatchEvent(new CustomEvent('complaint-synced', {
            detail: complaint
        }));
    }

    syncComplaintStatusAcrossModules(complaint) {
        // Update in all modules that have the complaint
        Object.values(this.modules).forEach(module => {
            if (module && module.updateComplaintStatus) {
                module.updateComplaintStatus(complaint.id, complaint.status);
            }
        });
        
        // Update localStorage
        this.updateComplaintInStorage(complaint);
    }

    // User Management
    getCurrentUser() {
        if (this.modules.rbacSystem) {
            return this.modules.rbacSystem.getCurrentUser();
        }
        if (this.modules.authSystem) {
            return this.modules.authSystem.getCurrentUser();
        }
        return null;
    }

    getCurrentUserContext() {
        const user = this.getCurrentUser();
        if (!user) return null;
        
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            permissions: user.permissions || [],
            department: user.department,
            area: user.area
        };
    }

    checkScreenPermission(screenName) {
        if (!this.modules.rbacSystem) return true;
        
        const screenPermissions = {
            'complaints': 'view_complaints',
            'profile': 'view_profile',
            'admin': 'admin_access'
        };
        
        const requiredPermission = screenPermissions[screenName];
        return !requiredPermission || this.modules.rbacSystem.hasPermission(requiredPermission);
    }

    // Notifications
    sendStatusUpdateNotifications(complaint) {
        if (!this.config.enableNotifications) return;
        
        // Send to user who submitted the complaint
        this.sendNotificationToUser(complaint.submittedBy, {
            title: 'Complaint Status Update',
            message: `Your complaint ${complaint.id} is now ${complaint.status}`,
            type: 'status_update'
        });
        
        // Send to assigned field manager
        if (complaint.assignedTo) {
            this.sendNotificationToUser(complaint.assignedTo, {
                title: 'Complaint Assignment',
                message: `Complaint ${complaint.id} has been updated`,
                type: 'assignment_update'
            });
        }
    }

    sendNotificationToUser(userId, notification) {
        // In production, this would send actual notifications
        console.log(`Notification to ${userId}:`, notification);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
            });
        }
    }

    // Analytics and Logging
    logEvent(eventType, data) {
        if (!this.config.enableAnalytics) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType: eventType,
            data: data,
            user: this.getCurrentUser()?.id,
            sessionId: this.getSessionId()
        };
        
        // Store in analytics
        this.storeAnalyticsEvent(logEntry);
        
        // Send to analytics service (if configured)
        this.sendToAnalyticsService(logEntry);
    }

    logPermissionCheck(permission, granted) {
        if (!this.config.enableAuditLog) return;
        
        this.logEvent('permission_check', {
            permission: permission,
            granted: granted,
            user: this.getCurrentUser()?.id
        });
    }

    storeAnalyticsEvent(event) {
        const events = JSON.parse(localStorage.getItem('ghmc_analytics') || '[]');
        events.push(event);
        
        // Keep only last 1000 events
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }
        
        localStorage.setItem('ghmc_analytics', JSON.stringify(events));
    }

    sendToAnalyticsService(event) {
        // In production, send to actual analytics service
        console.log('Analytics event:', event);
    }

    // Health Monitoring
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Check every 30 seconds
    }

    performHealthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            modules: {},
            performance: this.getPerformanceMetrics(),
            errors: this.getRecentErrors()
        };
        
        // Check each module
        Object.entries(this.modules).forEach(([name, module]) => {
            health.modules[name] = {
                loaded: !!module,
                functional: this.testModuleFunctionality(module),
                lastActivity: this.getModuleLastActivity(name)
            };
        });
        
        // Store health data
        localStorage.setItem('ghmc_health', JSON.stringify(health));
        
        // Alert if issues detected
        this.checkForHealthIssues(health);
    }

    testModuleFunctionality(module) {
        if (!module) return false;
        
        try {
            // Basic functionality test
            return typeof module === 'object' && module.constructor;
        } catch (error) {
            console.error('Module functionality test failed:', error);
            return false;
        }
    }

    getPerformanceMetrics() {
        if (!window.performance) return null;
        
        return {
            navigation: window.performance.navigation,
            timing: window.performance.timing,
            memory: window.performance.memory
        };
    }

    getRecentErrors() {
        // Return recent JavaScript errors
        return window.ghmc_errors || [];
    }

    checkForHealthIssues(health) {
        const issues = [];
        
        // Check for non-functional modules
        Object.entries(health.modules).forEach(([name, status]) => {
            if (status.loaded && !status.functional) {
                issues.push(`Module ${name} is not functional`);
            }
        });
        
        // Check for performance issues
        if (health.performance && health.performance.memory) {
            const memoryUsage = health.performance.memory.usedJSHeapSize / 1024 / 1024;
            if (memoryUsage > 100) { // 100MB threshold
                issues.push(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
            }
        }
        
        if (issues.length > 0) {
            console.warn('Health issues detected:', issues);
            this.logEvent('health_issues', { issues });
        }
    }

    // Utility Methods
    getSessionId() {
        return localStorage.getItem('ghmc_session') || 'anonymous';
    }

    getModuleLastActivity(moduleName) {
        return localStorage.getItem(`ghmc_${moduleName}_last_activity`);
    }

    updateComplaintInStorage(complaint) {
        const complaints = JSON.parse(localStorage.getItem('ghmc_complaints') || '[]');
        const index = complaints.findIndex(c => c.id === complaint.id);
        
        if (index > -1) {
            complaints[index] = complaint;
        } else {
            complaints.push(complaint);
        }
        
        localStorage.setItem('ghmc_complaints', JSON.stringify(complaints));
    }

    autoAssignComplaint(complaint, assignment) {
        complaint.assignedTo = assignment.id;
        complaint.assignedAt = new Date().toISOString();
        complaint.status = 'assigned';
        
        this.syncComplaintAcrossModules(complaint);
        
        this.logEvent('auto_assignment', {
            complaintId: complaint.id,
            assignedTo: assignment.id,
            reason: 'automatic_routing'
        });
    }

    initializeUserFeatures(user) {
        // Initialize features based on user role
        switch (user.role) {
            case 'admin':
                this.enableAdminFeatures();
                break;
            case 'officer-manager':
                this.enableOfficerFeatures();
                break;
            case 'field-manager':
                this.enableFieldManagerFeatures();
                break;
            case 'user':
                this.enableUserFeatures();
                break;
        }
    }

    enableAdminFeatures() {
        // Enable admin-specific features
        console.log('Admin features enabled');
    }

    enableOfficerFeatures() {
        // Enable officer-specific features
        console.log('Officer features enabled');
    }

    enableFieldManagerFeatures() {
        // Enable field manager-specific features
        console.log('Field manager features enabled');
    }

    enableUserFeatures() {
        // Enable user-specific features
        console.log('User features enabled');
    }

    loadUserPreferences(user) {
        const preferences = localStorage.getItem(`ghmc_preferences_${user.id}`);
        if (preferences) {
            try {
                const prefs = JSON.parse(preferences);
                this.applyUserPreferences(prefs);
            } catch (error) {
                console.error('Error loading user preferences:', error);
            }
        }
    }

    applyUserPreferences(preferences) {
        // Apply user preferences to UI
        if (preferences.theme) {
            document.body.className = preferences.theme;
        }
        
        if (preferences.language) {
            this.setLanguage(preferences.language);
        }
    }

    setupRoleSpecificUI(user) {
        // Setup UI elements based on user role
        const roleElements = document.querySelectorAll('[data-role]');
        
        roleElements.forEach(element => {
            const allowedRoles = element.dataset.role.split(',');
            if (allowedRoles.includes(user.role)) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }

    setLanguage(language) {
        // Set application language
        document.documentElement.lang = language;
        
        // Notify modules of language change
        this.eventBus.dispatchEvent(new CustomEvent('language-changed', {
            detail: { language }
        }));
    }

    showPermissionDenied() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #666;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notification.textContent = 'Access denied. You do not have permission to access this feature.';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Public API
    getModuleStatus() {
        return Object.entries(this.modules).map(([name, module]) => ({
            name,
            loaded: !!module,
            functional: this.testModuleFunctionality(module)
        }));
    }

    getSystemHealth() {
        return JSON.parse(localStorage.getItem('ghmc_health') || '{}');
    }

    getAnalytics() {
        return JSON.parse(localStorage.getItem('ghmc_analytics') || '[]');
    }

    enableModule(moduleName) {
        this.config[`enable${moduleName}`] = true;
    }

    disableModule(moduleName) {
        this.config[`enable${moduleName}`] = false;
    }
}

// Initialize integration bridge
document.addEventListener('DOMContentLoaded', () => {
    window.iala_bridge = new IALAIntegrationBridge();
});

// Global error handler
window.addEventListener('error', (event) => {
    if (!window.ghmc_errors) window.ghmc_errors = [];
    
    window.ghmc_errors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 errors
    if (window.ghmc_errors.length > 50) {
        window.ghmc_errors.splice(0, window.ghmc_errors.length - 50);
    }
});

// Export for use by other modules
window.IALAIntegrationBridge = IALAIntegrationBridge;