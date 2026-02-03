// RBAC Integration with Main IALA App - Auto-Update System
(function() {
    'use strict';

    class RBACIntegration {
        constructor() {
            this.updateInterval = null;
            this.currentUser = null;
            this.isIntegrated = false;
            this.autoUpdateEnabled = true;
            this.updateFrequency = 30000; // 30 seconds
            this.init();
        }

        init() {
            this.checkAuthentication();
            this.setupAutoUpdate();
            this.integrateWithMainApp();
            this.setupEventListeners();
            this.addRoleBasedFeatures();
        }

        checkAuthentication() {
            // Check if user is logged in
            const userData = localStorage.getItem('ghmc_user');
            const sessionId = localStorage.getItem('ghmc_session');

            if (userData && sessionId) {
                try {
                    this.currentUser = JSON.parse(userData);
                    this.showRoleBasedUI();
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    this.showGuestAccess();
                }
            } else {
                this.showGuestAccess();
            }
        }

        showRoleBasedUI() {
            if (!this.currentUser) return;

            // Add role indicator to header
            this.addRoleIndicator();
            
            // Add role-specific features
            this.addRoleSpecificFeatures();
            
            // Setup auto-sync with role dashboards
            this.setupRoleDashboardSync();
            
            // Show success message
            this.showWelcomeMessage();
        }

        addRoleIndicator() {
            const header = document.querySelector('.app-header');
            if (!header || document.getElementById('role-indicator')) return;

            const roleIndicator = document.createElement('div');
            roleIndicator.id = 'role-indicator';
            roleIndicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #333;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
                z-index: 1000;
            `;

            const roleNames = {
                'admin': 'Administrator',
                'officer-manager': 'Officer Manager',
                'field-manager': 'Field Manager',
                'user': 'Registered User',
                'guest': 'Guest'
            };

            roleIndicator.innerHTML = `
                <span>${roleNames[this.currentUser.role] || this.currentUser.role}</span>
                <span style="margin-left: 4px; opacity: 0.7;">▼</span>
            `;

            roleIndicator.addEventListener('click', () => {
                this.showRoleMenu();
            });

            header.style.position = 'relative';
            header.appendChild(roleIndicator);
        }

        showRoleMenu() {
            // Remove existing menu
            const existingMenu = document.getElementById('role-menu');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            const menu = document.createElement('div');
            menu.id = 'role-menu';
            menu.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                min-width: 200px;
                overflow: hidden;
            `;

            const menuItems = [
        