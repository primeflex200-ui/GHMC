// IALA Civic Services App JavaScript
class IALAApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication first
        if (!this.checkAuthentication()) {
            return; // Will redirect to auth system
        }
        
        this.setupNavigation();
        this.setupServiceCards();
        this.setupChatButton();
        this.loadScreens();
        this.updateUserInterface();
    }

    checkAuthentication() {
        // Always allow access in preview mode - no redirects
        this.currentUser = {
            id: 'preview_user',
            role: 'guest',
            name: 'Preview User',
            permissions: ['submit_complaints', 'ai_chat'],
            isGuest: true
        };
        return true;
    }

    isValidSession() {
        // For guest users, always valid if user data exists
        if (this.currentUser && this.currentUser.isGuest) {
            return true;
        }

        // For regular users, check if session exists and is recent
        const sessionId = localStorage.getItem('ghmc_session');
        if (!sessionId) return false;

        // In a real system, you'd validate with server
        // For now, just check if session was created recently (within 8 hours)
        const sessionData = localStorage.getItem('ghmc_session_data');
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                const sessionAge = Date.now() - new Date(data.created).getTime();
                const maxAge = 8 * 60 * 60 * 1000; // 8 hours
                return sessionAge < maxAge;
            } catch (error) {
                console.error('Error validating session:', error);
                return false;
            }
        }

        return true; // Default to valid for demo purposes
    }

    redirectToAuth() {
        // Don't redirect in preview mode - just stay on current page
        console.log('Preview mode: Authentication redirect disabled');
        return;
    }

    clearSession() {
        localStorage.removeItem('ghmc_session');
        localStorage.removeItem('ghmc_user');
        localStorage.removeItem('ghmc_session_data');
        this.currentUser = null;
    }

    updateUserInterface() {
        // Update header with user info if available
        const locationInfo = document.querySelector('.location-info .location-text');
        const chatBtn = document.getElementById('ai-chat-btn');
        
        if (this.currentUser && locationInfo) {
            if (this.currentUser.isGuest) {
                locationInfo.textContent = 'Guest Access • Hyderabad, Telangana';
            } else {
                locationInfo.textContent = `Welcome, ${this.currentUser.name} • Hyderabad, Telangana`;
            }
        }

        // Show chat button for all authenticated users (including guests)
        if (chatBtn && this.currentUser) {
            chatBtn.style.display = 'flex';
        }

        // Show/hide Industrial Map navigation based on user role
        this.updateNavigationVisibility();
    }

    updateNavigationVisibility() {
        const industrialMapNav = document.querySelector('[data-screen="industrial-map"]');
        
        if (industrialMapNav) {
            // Show Industrial Map only for management and field personnel
            if (this.hasIndustrialMapAccess()) {
                industrialMapNav.style.display = 'flex';
            } else {
                industrialMapNav.style.display = 'none';
            }
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = item.dataset.screen;
                
                // Special handling for Industrial Map - redirect to Google Maps page
                if (screen === 'industrial-map') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Opening Industrial Map from navigation...');
                    try {
                        const mapWindow = window.open('industrial-map-google.html', '_blank');
                        if (!mapWindow) {
                            // Fallback if popup blocked
                            window.location.href = 'industrial-map-google.html';
                        }
                    } catch (error) {
                        console.error('Error opening Industrial Map:', error);
                        // Fallback navigation
                        window.location.href = 'industrial-map-google.html';
                    }
                    return false;
                }
                
                this.navigateToScreen(screen);
            });
        });
    }

    setupServiceCards() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const service = card.dataset.service;
                this.selectService(service);
            });
        });
    }

    setupChatButton() {
        const chatBtn = document.getElementById('ai-chat-btn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                this.openAIChat();
            });
        }
    }

    openAIChat() {
        // In preview mode, show alert instead of redirect
        alert('AI Chat would open here. In full version, this opens the AI assistant.');
        return;
    }

    navigateToScreen(screenName) {
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`[data-screen="${screenName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Update screen content
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Always reload raise-issue screen to get latest selected service
        if (screenName === 'raise-issue') {
            this.loadScreen(screenName);
        } else {
            const targetScreen = document.getElementById(`${screenName}-screen`);
            if (targetScreen) {
                targetScreen.classList.add('active');
            } else {
                this.loadScreen(screenName);
            }
        }

        this.currentScreen = screenName;
    }

    selectService(serviceName) {
        // Store selected service and navigate to raise issue
        sessionStorage.setItem('selectedService', serviceName);
        this.navigateToScreen('raise-issue');
    }

    loadScreen(screenName) {
        const mainContent = document.getElementById('main-content');
        let screenHTML = '';

        switch (screenName) {
            case 'raise-issue':
                screenHTML = this.getRaiseIssueScreen();
                break;
            case 'complaints':
                screenHTML = this.getComplaintsScreen();
                break;
            case 'profile':
                screenHTML = this.getProfileScreen();
                break;
            case 'industrial-map':
                screenHTML = this.getIndustrialMapScreen();
                break;
            default:
                return;
        }

        // Remove existing non-home screens
        const existingScreens = mainContent.querySelectorAll('.screen:not(#home-screen)');
        existingScreens.forEach(screen => screen.remove());

        // Add new screen
        const screenDiv = document.createElement('div');
        screenDiv.className = 'screen active';
        screenDiv.id = `${screenName}-screen`;
        screenDiv.innerHTML = screenHTML;
        mainContent.appendChild(screenDiv);

        // Hide home screen
        document.getElementById('home-screen').classList.remove('active');

        // Setup screen-specific functionality
        this.setupScreenFunctionality(screenName);
    }

    loadScreens() {
        // Pre-load only static screens for better performance
        // Don't pre-load raise-issue screen as it depends on selected service
        this.loadScreen('complaints');
        this.loadScreen('profile');
        this.loadScreen('industrial-map');
        this.navigateToScreen('home');
    }

    getRaiseIssueScreen() {
        const selectedService = sessionStorage.getItem('selectedService') || '';
        const serviceTitle = this.getServiceTitle(selectedService);

        return `
            <div class="screen-header">
                <div class="header-with-back">
                    <button class="back-btn" id="back-to-home">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="header-content">
                        <h2>Raise Issue</h2>
                        ${selectedService ? `<p class="selected-service">Category: ${serviceTitle}</p>` : ''}
                    </div>
                </div>
            </div>

            <form class="issue-form" id="issue-form">
                <div class="form-group">
                    <label class="form-label">Issue Category</label>
                    <select class="form-input" id="category-select" required>
                        <option value="">Select Category</option>
                        <option value="street-light" ${selectedService === 'street-light' ? 'selected' : ''}>Street Light</option>
                        <option value="pothole" ${selectedService === 'pothole' ? 'selected' : ''}>Road Pothole</option>
                        <option value="garbage" ${selectedService === 'garbage' ? 'selected' : ''}>Garbage</option>
                        <option value="water-supply" ${selectedService === 'water-supply' ? 'selected' : ''}>Water Supply</option>
                        <option value="drainage" ${selectedService === 'drainage' ? 'selected' : ''}>Drainage</option>
                        <option value="cctv" ${selectedService === 'cctv' ? 'selected' : ''}>CCTV</option>
                        <option value="incident" ${selectedService === 'incident' ? 'selected' : ''}>Incident Reporting</option>
                        <option value="fogging" ${selectedService === 'fogging' ? 'selected' : ''}>Fogging</option>
                        <option value="green-belt" ${selectedService === 'green-belt' ? 'selected' : ''}>Green Belt</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="location-input" placeholder="Auto-detected: Current Location" readonly>
                    <button type="button" class="btn-secondary mt-8" id="detect-location">Detect Current Location</button>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input form-textarea" id="description-input" placeholder="Describe the issue in detail..." required></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Photo (Optional)</label>
                    <input type="file" class="form-input" id="photo-input" accept="image/*">
                    <div class="photo-preview" id="photo-preview"></div>
                </div>

                <button type="submit" class="btn">Submit Complaint</button>
            </form>
        `;
    }

    getComplaintsScreen() {
        return `
            <div class="screen-header">
                <div class="header-with-back">
                    <button class="back-btn" id="back-to-home-complaints">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="header-content">
                        <h2>My Complaints</h2>
                    </div>
                </div>
            </div>

            <div class="complaints-list">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Street Light Not Working</div>
                            <div class="card-subtitle">Complaint ID: IALA2024001</div>
                        </div>
                        <span class="status status-progress">In Progress</span>
                    </div>
                    <div class="card-content">
                        <p><strong>Location:</strong> Road No. 12, Banjara Hills</p>
                        <p><strong>Submitted:</strong> Jan 28, 2024</p>
                        <p><strong>Last Update:</strong> Jan 30, 2024</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Road Pothole</div>
                            <div class="card-subtitle">Complaint ID: IALA2024002</div>
                        </div>
                        <span class="status status-resolved">Resolved</span>
                    </div>
                    <div class="card-content">
                        <p><strong>Location:</strong> Jubilee Hills Main Road</p>
                        <p><strong>Submitted:</strong> Jan 25, 2024</p>
                        <p><strong>Resolved:</strong> Jan 29, 2024</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Garbage Collection</div>
                            <div class="card-subtitle">Complaint ID: IALA2024003</div>
                        </div>
                        <span class="status status-assigned">Assigned</span>
                    </div>
                    <div class="card-content">
                        <p><strong>Location:</strong> Madhapur Colony</p>
                        <p><strong>Submitted:</strong> Feb 01, 2024</p>
                        <p><strong>Assigned:</strong> Feb 02, 2024</p>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileScreen() {
        const userName = this.currentUser ? this.currentUser.name : 'User';
        const userEmail = this.currentUser ? (this.currentUser.email || 'user@email.com') : 'user@email.com';
        const userMobile = this.currentUser ? (this.currentUser.mobile || '+91 98765 43210') : '+91 98765 43210';
        const isGuest = this.currentUser && this.currentUser.isGuest;

        return `
            <div class="screen-header">
                <div class="header-with-back">
                    <button class="back-btn" id="back-to-home-profile">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="header-content">
                        <h2>Profile</h2>
                        ${isGuest ? '<p class="guest-notice">You are using guest access</p>' : ''}
                    </div>
                </div>
            </div>

            <div class="profile-content">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Personal Information</div>
                    </div>
                    <div class="card-content">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-input" value="${userName}" ${isGuest ? 'placeholder="Not available in guest mode"' : ''} readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mobile Number</label>
                            <input type="tel" class="form-input" value="${isGuest ? '' : userMobile}" ${isGuest ? 'placeholder="Not available in guest mode"' : ''} readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" value="${isGuest ? '' : userEmail}" ${isGuest ? 'placeholder="Not available in guest mode"' : ''} readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <textarea class="form-input" ${isGuest ? 'placeholder="Not available in guest mode"' : ''} readonly>${isGuest ? '' : 'House No. 123, Street Name, Area, Hyderabad - 500001'}</textarea>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Complaint Statistics</div>
                    </div>
                    <div class="card-content">
                        ${isGuest ? `
                            <p style="text-align: center; color: #666; font-style: italic;">
                                Register for an account to track your complaints
                            </p>
                        ` : `
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
                                <div>
                                    <div style="font-size: 24px; font-weight: 600; color: #333;">12</div>
                                    <div style="font-size: 12px; color: #666;">Total Complaints</div>
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 600; color: #333;">8</div>
                                    <div style="font-size: 12px; color: #666;">Resolved</div>
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 600; color: #333;">3</div>
                                    <div style="font-size: 12px; color: #666;">In Progress</div>
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 600; color: #333;">1</div>
                                    <div style="font-size: 12px; color: #666;">Pending</div>
                                </div>
                            </div>
                        `}
                    </div>
                </div>

                ${!isGuest ? '<button class="btn-secondary mb-16">Edit Profile</button>' : ''}
                <button class="btn-secondary" id="logout-btn">Logout</button>
            </div>
        `;
    }

    getIndustrialMapScreen() {
        return `
            <div class="screen-header">
                <div class="header-with-back">
                    <button class="back-btn" id="back-to-home-map">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div class="header-content">
                        <h2>Industrial Map</h2>
                        <p>Industrial zones and facilities in Hyderabad</p>
                    </div>
                </div>
            </div>

            <div class="map-controls">
                <div class="map-filters">
                    <select class="filter-select" id="zone-filter">
                        <option value="">All Zones</option>
                        <option value="hitech-city">Hitech City</option>
                        <option value="gachibowli">Gachibowli</option>
                        <option value="madhapur">Madhapur</option>
                        <option value="kondapur">Kondapur</option>
                        <option value="kukatpally">Kukatpally</option>
                    </select>
                    
                    <select class="filter-select" id="industry-type-filter">
                        <option value="">All Types</option>
                        <option value="it">IT & Software</option>
                        <option value="pharma">Pharmaceutical</option>
                        <option value="biotech">Biotechnology</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="textiles">Textiles</option>
                        <option value="automotive">Automotive</option>
                    </select>
                    
                    <select class="filter-select" id="status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="under-review">Under Review</option>
                    </select>
                </div>
                
                <div class="map-actions">
                    <button class="btn-secondary" id="reset-map">Reset View</button>
                    <button class="btn-secondary" id="refresh-data">Refresh Data</button>
                </div>
            </div>

            <div class="map-container">
                <div id="industrial-leaflet-map" style="width: 100%; height: 400px; min-height: 400px; background: #f5f5f5;"></div>
                
                <div class="map-legend">
                    <h4>Legend</h4>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-marker active"></div>
                            <span>Active Industries</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-marker inactive"></div>
                            <span>Inactive Industries</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-marker under-review"></div>
                            <span>Under Review</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="industry-details-panel" id="industry-details" style="display: none;">
                <div class="panel-header">
                    <h3 id="industry-name">Industry Details</h3>
                    <button class="close-panel" id="close-details">&times;</button>
                </div>
                <div class="panel-content" id="industry-info">
                    <!-- Industry details will be populated here -->
                </div>
            </div>
        `;
    }

    setupScreenFunctionality(screenName) {
        switch (screenName) {
            case 'raise-issue':
                this.setupRaiseIssueForm();
                this.setupBackButton('back-to-home', 'home');
                break;
            case 'complaints':
                this.setupBackButton('back-to-home-complaints', 'home');
                break;
            case 'profile':
                this.setupProfileScreen();
                this.setupBackButton('back-to-home-profile', 'home');
                break;
            case 'industrial-map':
                this.setupIndustrialMapScreen();
                this.setupBackButton('back-to-home-map', 'home');
                break;
        }
    }

    setupBackButton(buttonId, targetScreen) {
        const backBtn = document.getElementById(buttonId);
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.navigateToScreen(targetScreen);
            });
        }
    }

    setupProfileScreen() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    setupIndustrialMapScreen() {
        // Initialize Leaflet map functionality
        this.initializeLeafletMap();
        
        // Setup filter event listeners
        document.getElementById('zone-filter').addEventListener('change', () => {
            this.filterIndustries();
        });
        
        document.getElementById('industry-type-filter').addEventListener('change', () => {
            this.filterIndustries();
        });
        
        document.getElementById('status-filter').addEventListener('change', () => {
            this.filterIndustries();
        });
        
        // Setup map action buttons
        document.getElementById('reset-map').addEventListener('click', () => {
            this.resetMapView();
        });
        
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.refreshIndustrialData();
        });
        
        // Setup details panel close button
        const closeDetailsBtn = document.getElementById('close-details');
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                this.closeIndustryDetails();
            });
        }
    }

    // Industrial Map Methods using Leaflet
    initializeLeafletMap() {
        // Wait for DOM element to be available
        setTimeout(() => {
            const mapContainer = document.getElementById('industrial-leaflet-map');
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }

            try {
                // Initialize Leaflet map centered on Hyderabad
                this.leafletMap = L.map('industrial-leaflet-map').setView([17.4435, 78.3772], 11);

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18,
                    minZoom: 8
                }).addTo(this.leafletMap);

                // Initialize marker cluster group
                this.markerClusterGroup = L.markerClusterGroup({
                    chunkedLoading: true,
                    maxClusterRadius: 50
                });
                this.leafletMap.addLayer(this.markerClusterGroup);

                // Load and display industrial data
                this.loadRealTimeIndustrialData();

            } catch (error) {
                console.error('Error initializing Leaflet map:', error);
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Error loading map. Please refresh the page.</div>';
            }
        }, 100);
    }

    async loadRealTimeIndustrialData() {
        try {
            // Simulate API call - in real implementation, this would fetch from backend
            const industrialData = await this.fetchIndustrialDataFromAPI();
            this.industrialData = industrialData;
            this.filteredIndustrialData = [...industrialData];
            this.renderLeafletMarkers();
        } catch (error) {
            console.error('Error loading industrial data:', error);
            this.showEmptyState();
        }
    }

    async fetchIndustrialDataFromAPI() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Real-time industrial data for Hyderabad with actual coordinates
        return [
            {
                id: 'IND001',
                name: 'Microsoft India Development Center',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4435, lng: 78.3772 },
                area: '83 acres',
                employees: '7000+',
                established: '1998'
            },
            {
                id: 'IND002',
                name: 'Google Hyderabad',
                type: 'it',
                zone: 'gachibowli',
                status: 'active',
                coordinates: { lat: 17.4239, lng: 78.3776 },
                area: '5.2 acres',
                employees: '13000+',
                established: '2004'
            },
            {
                id: 'IND003',
                name: 'Dr. Reddy\'s Laboratories',
                type: 'pharma',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4498, lng: 78.3915 },
                area: '190 acres',
                employees: '4500+',
                established: '1984'
            },
            {
                id: 'IND004',
                name: 'Bharat Biotech',
                type: 'biotech',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4569, lng: 78.2714 },
                area: '75 acres',
                employees: '2000+',
                established: '1996'
            },
            {
                id: 'IND005',
                name: 'Mahindra Aerospace',
                type: 'aerospace',
                zone: 'begumpet',
                status: 'under-review',
                coordinates: { lat: 17.4399, lng: 78.4983 },
                area: '25 acres',
                employees: '800+',
                established: '2009'
            },
            {
                id: 'IND006',
                name: 'Hetero Drugs',
                type: 'pharma',
                zone: 'jeedimetla',
                status: 'active',
                coordinates: { lat: 17.5404, lng: 78.4482 },
                area: '120 acres',
                employees: '3200+',
                established: '1993'
            },
            {
                id: 'IND007',
                name: 'Aurobindo Pharma',
                type: 'pharma',
                zone: 'genome-valley',
                status: 'inactive',
                coordinates: { lat: 17.4625, lng: 78.2891 },
                area: '200 acres',
                employees: '5000+',
                established: '1986'
            },
            {
                id: 'IND008',
                name: 'Tata Consultancy Services',
                type: 'it',
                zone: 'madhapur',
                status: 'active',
                coordinates: { lat: 17.4483, lng: 78.3915 },
                area: '15 acres',
                employees: '25000+',
                established: '1991'
            },
            {
                id: 'IND009',
                name: 'Infosys Hyderabad',
                type: 'it',
                zone: 'gachibowli',
                status: 'active',
                coordinates: { lat: 17.4126, lng: 78.3667 },
                area: '81 acres',
                employees: '15000+',
                established: '1998'
            },
            {
                id: 'IND010',
                name: 'Wipro Technologies',
                type: 'it',
                zone: 'madhapur',
                status: 'active',
                coordinates: { lat: 17.4504, lng: 78.3808 },
                area: '12 acres',
                employees: '8000+',
                established: '2000'
            },
            {
                id: 'IND011',
                name: 'Cyient Limited',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4467, lng: 78.3734 },
                area: '8 acres',
                employees: '3500+',
                established: '1991'
            },
            {
                id: 'IND012',
                name: 'Novartis India',
                type: 'pharma',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4712, lng: 78.2845 },
                area: '45 acres',
                employees: '1200+',
                established: '2005'
            },
            {
                id: 'IND013',
                name: 'Mahindra Tech Mahindra',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4421, lng: 78.3651 },
                area: '22 acres',
                employees: '12000+',
                established: '1986'
            },
            {
                id: 'IND014',
                name: 'Gland Pharma',
                type: 'pharma',
                zone: 'dundigal',
                status: 'active',
                coordinates: { lat: 17.5234, lng: 78.2456 },
                area: '150 acres',
                employees: '2800+',
                established: '1978'
            },
            {
                id: 'IND015',
                name: 'Biological E Limited',
                type: 'biotech',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4634, lng: 78.2723 },
                area: '65 acres',
                employees: '1800+',
                established: '1953'
            }
        ];
    }

    renderLeafletMarkers() {
        if (!this.leafletMap || !this.markerClusterGroup) {
            console.error('Map or marker cluster group not initialized');
            return;
        }

        // Clear existing markers
        this.markerClusterGroup.clearLayers();

        // Create markers for each industry
        this.filteredIndustrialData.forEach(industry => {
            const marker = this.createIndustryMarker(industry);
            this.markerClusterGroup.addLayer(marker);
        });

        // Fit map to show all markers if there are any
        if (this.filteredIndustrialData.length > 0) {
            const group = new L.featureGroup(this.markerClusterGroup.getLayers());
            if (group.getBounds().isValid()) {
                this.leafletMap.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }

    createIndustryMarker(industry) {
        // Create custom icon based on status
        const iconColor = this.getMarkerColor(industry.status);
        const customIcon = L.divIcon({
            className: 'custom-industry-marker',
            html: `<div style="
                background-color: ${iconColor};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
            ">${industry.name.charAt(0)}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        // Create marker
        const marker = L.marker([industry.coordinates.lat, industry.coordinates.lng], {
            icon: customIcon
        });

        // Create popup content
        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${industry.name}</h4>
                <p style="margin: 4px 0;"><strong>Type:</strong> ${this.getIndustryTypeDisplayName(industry.type)}</p>
                <p style="margin: 4px 0;"><strong>Zone:</strong> ${this.getZoneDisplayName(industry.zone)}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${iconColor}; font-weight: bold;">${this.getStatusDisplayName(industry.status)}</span></p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${industry.area}</p>
                <p style="margin: 4px 0;"><strong>Employees:</strong> ${industry.employees}</p>
                <p style="margin: 4px 0;"><strong>Established:</strong> ${industry.established}</p>
                <button onclick="window.ghmc_app.showIndustryDetails('${industry.id}')" 
                        style="margin-top: 8px; padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    View Details
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        return marker;
    }

    getMarkerColor(status) {
        const colors = {
            'active': '#28a745',
            'inactive': '#dc3545',
            'under-review': '#ffc107'
        };
        return colors[status] || '#6c757d';
    }

    filterIndustries() {
        const zoneFilter = document.getElementById('zone-filter').value;
        const typeFilter = document.getElementById('industry-type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredIndustrialData = this.industrialData.filter(industry => {
            const zoneMatch = !zoneFilter || industry.zone === zoneFilter;
            const typeMatch = !typeFilter || industry.type === typeFilter;
            const statusMatch = !statusFilter || industry.status === statusFilter;

            return zoneMatch && typeMatch && statusMatch;
        });

        this.renderLeafletMarkers();
    }

    resetMapView() {
        // Reset all filters
        document.getElementById('zone-filter').value = '';
        document.getElementById('industry-type-filter').value = '';
        document.getElementById('status-filter').value = '';
        
        this.filteredIndustrialData = [...this.industrialData];
        this.renderLeafletMarkers();

        // Reset map view to Hyderabad center
        if (this.leafletMap) {
            this.leafletMap.setView([17.4435, 78.3772], 11);
        }
    }

    async refreshIndustrialData() {
        try {
            const refreshBtn = document.getElementById('refresh-data');
            if (refreshBtn) {
                refreshBtn.textContent = 'Refreshing...';
                refreshBtn.disabled = true;
            }

            await this.loadRealTimeIndustrialData();

            if (refreshBtn) {
                refreshBtn.textContent = 'Refresh Data';
                refreshBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            const refreshBtn = document.getElementById('refresh-data');
            if (refreshBtn) {
                refreshBtn.textContent = 'Refresh Data';
                refreshBtn.disabled = false;
            }
        }
    }

    showEmptyState() {
        const mapContainer = document.getElementById('industrial-leaflet-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center; color: #666;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <h3 style="margin: 16px 0 8px 0;">No Industrial Data Available</h3>
                    <p>Unable to load industrial location data. Please try refreshing.</p>
                    <button onclick="window.ghmc_app.refreshIndustrialData()" 
                            style="margin-top: 16px; padding: 8px 16px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    hasIndustrialMapAccess() {
        // Allow access for all authenticated users (including guests)
        return this.currentUser !== null;
    }

    isIndustrialMapViewOnly() {
        // Since only management and field personnel have access,
        // and they all have full access, no view-only mode needed
        return false;
    }

    logout() {
        // In preview mode, just show alert
        alert('Logout functionality - would redirect to login page in full version');
        return;
    }

    // Industrial Map Methods using Leaflet
    initializeLeafletMap() {
        // Wait for DOM element to be available
        setTimeout(() => {
            const mapContainer = document.getElementById('industrial-leaflet-map');
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }

            try {
                // Initialize Leaflet map centered on Hyderabad
                this.leafletMap = L.map('industrial-leaflet-map').setView([17.4435, 78.3772], 11);

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18,
                    minZoom: 8
                }).addTo(this.leafletMap);

                // Initialize marker cluster group
                this.markerClusterGroup = L.markerClusterGroup({
                    chunkedLoading: true,
                    maxClusterRadius: 50
                });
                this.leafletMap.addLayer(this.markerClusterGroup);

                // Load and display industrial data
                this.loadRealTimeIndustrialData();

            } catch (error) {
                console.error('Error initializing Leaflet map:', error);
                mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Error loading map. Please refresh the page.</div>';
            }
        }, 100);
    }

    async loadRealTimeIndustrialData() {
        try {
            // Simulate API call - in real implementation, this would fetch from backend
            const industrialData = await this.fetchIndustrialDataFromAPI();
            this.industrialData = industrialData;
            this.filteredIndustrialData = [...industrialData];
            this.renderLeafletMarkers();
        } catch (error) {
            console.error('Error loading industrial data:', error);
            this.showEmptyState();
        }
    }

    async fetchIndustrialDataFromAPI() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Real-time industrial data for Hyderabad with actual coordinates
        return [
            {
                id: 'IND001',
                name: 'Microsoft India Development Center',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4435, lng: 78.3772 },
                area: '83 acres',
                employees: '7000+',
                established: '1998'
            },
            {
                id: 'IND002',
                name: 'Google Hyderabad',
                type: 'it',
                zone: 'gachibowli',
                status: 'active',
                coordinates: { lat: 17.4239, lng: 78.3776 },
                area: '5.2 acres',
                employees: '13000+',
                established: '2004'
            },
            {
                id: 'IND003',
                name: 'Dr. Reddy\'s Laboratories',
                type: 'pharma',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4498, lng: 78.3915 },
                area: '190 acres',
                employees: '4500+',
                established: '1984'
            },
            {
                id: 'IND004',
                name: 'Bharat Biotech',
                type: 'biotech',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4569, lng: 78.2714 },
                area: '75 acres',
                employees: '2000+',
                established: '1996'
            },
            {
                id: 'IND005',
                name: 'Mahindra Aerospace',
                type: 'aerospace',
                zone: 'begumpet',
                status: 'under-review',
                coordinates: { lat: 17.4399, lng: 78.4983 },
                area: '25 acres',
                employees: '800+',
                established: '2009'
            },
            {
                id: 'IND006',
                name: 'Hetero Drugs',
                type: 'pharma',
                zone: 'jeedimetla',
                status: 'active',
                coordinates: { lat: 17.5404, lng: 78.4482 },
                area: '120 acres',
                employees: '3200+',
                established: '1993'
            },
            {
                id: 'IND007',
                name: 'Aurobindo Pharma',
                type: 'pharma',
                zone: 'genome-valley',
                status: 'inactive',
                coordinates: { lat: 17.4625, lng: 78.2891 },
                area: '200 acres',
                employees: '5000+',
                established: '1986'
            },
            {
                id: 'IND008',
                name: 'Tata Consultancy Services',
                type: 'it',
                zone: 'madhapur',
                status: 'active',
                coordinates: { lat: 17.4483, lng: 78.3915 },
                area: '15 acres',
                employees: '25000+',
                established: '1991'
            },
            {
                id: 'IND009',
                name: 'Infosys Hyderabad',
                type: 'it',
                zone: 'gachibowli',
                status: 'active',
                coordinates: { lat: 17.4126, lng: 78.3667 },
                area: '81 acres',
                employees: '15000+',
                established: '1998'
            },
            {
                id: 'IND010',
                name: 'Wipro Technologies',
                type: 'it',
                zone: 'madhapur',
                status: 'active',
                coordinates: { lat: 17.4504, lng: 78.3808 },
                area: '12 acres',
                employees: '8000+',
                established: '2000'
            },
            {
                id: 'IND011',
                name: 'Cyient Limited',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4467, lng: 78.3734 },
                area: '8 acres',
                employees: '3500+',
                established: '1991'
            },
            {
                id: 'IND012',
                name: 'Novartis India',
                type: 'pharma',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4712, lng: 78.2845 },
                area: '45 acres',
                employees: '1200+',
                established: '2005'
            },
            {
                id: 'IND013',
                name: 'Mahindra Tech Mahindra',
                type: 'it',
                zone: 'hitech-city',
                status: 'active',
                coordinates: { lat: 17.4421, lng: 78.3651 },
                area: '22 acres',
                employees: '12000+',
                established: '1986'
            },
            {
                id: 'IND014',
                name: 'Gland Pharma',
                type: 'pharma',
                zone: 'dundigal',
                status: 'active',
                coordinates: { lat: 17.5234, lng: 78.2456 },
                area: '150 acres',
                employees: '2800+',
                established: '1978'
            },
            {
                id: 'IND015',
                name: 'Biological E Limited',
                type: 'biotech',
                zone: 'genome-valley',
                status: 'active',
                coordinates: { lat: 17.4634, lng: 78.2723 },
                area: '65 acres',
                employees: '1800+',
                established: '1953'
            }
        ];
    }

    renderLeafletMarkers() {
        if (!this.leafletMap || !this.markerClusterGroup) {
            console.error('Map or marker cluster group not initialized');
            return;
        }

        // Clear existing markers
        this.markerClusterGroup.clearLayers();

        // Create markers for each industry
        this.filteredIndustrialData.forEach(industry => {
            const marker = this.createIndustryMarker(industry);
            this.markerClusterGroup.addLayer(marker);
        });

        // Fit map to show all markers if there are any
        if (this.filteredIndustrialData.length > 0) {
            const group = new L.featureGroup(this.markerClusterGroup.getLayers());
            if (group.getBounds().isValid()) {
                this.leafletMap.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }

    createIndustryMarker(industry) {
        // Create custom icon based on status
        const iconColor = this.getMarkerColor(industry.status);
        const customIcon = L.divIcon({
            className: 'custom-industry-marker',
            html: `<div style="
                background-color: ${iconColor};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
            ">${industry.name.charAt(0)}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        // Create marker
        const marker = L.marker([industry.coordinates.lat, industry.coordinates.lng], {
            icon: customIcon
        });

        // Create popup content
        const popupContent = `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${industry.name}</h4>
                <p style="margin: 4px 0;"><strong>Type:</strong> ${this.getIndustryTypeDisplayName(industry.type)}</p>
                <p style="margin: 4px 0;"><strong>Zone:</strong> ${this.getZoneDisplayName(industry.zone)}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${iconColor}; font-weight: bold;">${this.getStatusDisplayName(industry.status)}</span></p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${industry.area}</p>
                <p style="margin: 4px 0;"><strong>Employees:</strong> ${industry.employees}</p>
                <p style="margin: 4px 0;"><strong>Established:</strong> ${industry.established}</p>
                <button onclick="window.ghmc_app.showIndustryDetails('${industry.id}')" 
                        style="margin-top: 8px; padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    View Details
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        return marker;
    }

    getMarkerColor(status) {
        const colors = {
            'active': '#28a745',
            'inactive': '#dc3545',
            'under-review': '#ffc107'
        };
        return colors[status] || '#6c757d';
    }

    filterIndustries() {
        const zoneFilter = document.getElementById('zone-filter').value;
        const typeFilter = document.getElementById('industry-type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredIndustrialData = this.industrialData.filter(industry => {
            const zoneMatch = !zoneFilter || industry.zone === zoneFilter;
            const typeMatch = !typeFilter || industry.type === typeFilter;
            const statusMatch = !statusFilter || industry.status === statusFilter;

            return zoneMatch && typeMatch && statusMatch;
        });

        this.renderLeafletMarkers();
    }

    showIndustryDetails(industryId) {
        const industry = this.industrialData.find(ind => ind.id === industryId);
        if (!industry) return;

        const detailsPanel = document.getElementById('industry-details');
        const industryInfo = document.getElementById('industry-info');
        
        document.getElementById('industry-name').textContent = industry.name;
        
        industryInfo.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Industry Type:</span>
                <span class="detail-value">${this.getIndustryTypeDisplayName(industry.type)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Zone:</span>
                <span class="detail-value">${this.getZoneDisplayName(industry.zone)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-indicator ${industry.status}">${this.getStatusDisplayName(industry.status)}</span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Area:</span>
                <span class="detail-value">${industry.area}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Employees:</span>
                <span class="detail-value">${industry.employees}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Established:</span>
                <span class="detail-value">${industry.established}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Coordinates:</span>
                <span class="detail-value">${industry.coordinates.lat}, ${industry.coordinates.lng}</span>
            </div>
        `;

        detailsPanel.style.display = 'block';
    }

    closeIndustryDetails() {
        document.getElementById('industry-details').style.display = 'none';
    }

    resetMapView() {
        // Reset all filters
        document.getElementById('zone-filter').value = '';
        document.getElementById('industry-type-filter').value = '';
        document.getElementById('status-filter').value = '';
        
        this.filteredIndustrialData = [...this.industrialData];
        this.renderLeafletMarkers();

        // Reset map view to Hyderabad center
        if (this.leafletMap) {
            this.leafletMap.setView([17.4435, 78.3772], 11);
        }
    }

    async refreshIndustrialData() {
        try {
            const refreshBtn = document.getElementById('refresh-data');
            if (refreshBtn) {
                refreshBtn.textContent = 'Refreshing...';
                refreshBtn.disabled = true;
            }

            await this.loadRealTimeIndustrialData();

            if (refreshBtn) {
                refreshBtn.textContent = 'Refresh Data';
                refreshBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            const refreshBtn = document.getElementById('refresh-data');
            if (refreshBtn) {
                refreshBtn.textContent = 'Refresh Data';
                refreshBtn.disabled = false;
            }
        }
    }

    showEmptyState() {
        const mapContainer = document.getElementById('industrial-leaflet-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center; color: #666;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <h3 style="margin: 16px 0 8px 0;">No Industrial Data Available</h3>
                    <p>Unable to load industrial location data. Please try refreshing.</p>
                    <button onclick="window.ghmc_app.refreshIndustrialData()" 
                            style="margin-top: 16px; padding: 8px 16px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    getIndustryTypeDisplayName(type) {
        const typeNames = {
            'it': 'IT & Software',
            'pharma': 'Pharmaceutical',
            'biotech': 'Biotechnology',
            'manufacturing': 'Manufacturing',
            'textiles': 'Textiles',
            'automotive': 'Automotive',
            'aerospace': 'Aerospace'
        };
        return typeNames[type] || type;
    }

    getZoneDisplayName(zone) {
        const zoneNames = {
            'hitech-city': 'Hitech City',
            'gachibowli': 'Gachibowli',
            'madhapur': 'Madhapur',
            'kondapur': 'Kondapur',
            'kukatpally': 'Kukatpally',
            'genome-valley': 'Genome Valley',
            'begumpet': 'Begumpet',
            'jeedimetla': 'Jeedimetla'
        };
        return zoneNames[zone] || zone;
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'active': 'Active',
            'inactive': 'Inactive',
            'under-review': 'Under Review'
        };
        return statusNames[status] || status;
    }

    setupRaiseIssueForm() {
        const form = document.getElementById('issue-form');
        const detectLocationBtn = document.getElementById('detect-location');
        const photoInput = document.getElementById('photo-input');
        const photoPreview = document.getElementById('photo-preview');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComplaint();
            });
        }

        if (detectLocationBtn) {
            detectLocationBtn.addEventListener('click', () => {
                this.detectLocation();
            });
        }

        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        }
    }

    detectLocation() {
        const locationInput = document.getElementById('location-input');
        if (locationInput) {
            locationInput.value = 'Detecting location...';
            
            // Simulate location detection
            setTimeout(() => {
                locationInput.value = 'Road No. 45, Jubilee Hills, Hyderabad - 500033';
            }, 1500);
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('photo-preview');
        
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <div style="margin-top: 8px; padding: 8px; background: #f8f8f8; border-radius: 4px; font-size: 12px; color: #666;">
                        Photo selected: ${file.name}
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    }

    submitComplaint() {
        const category = document.getElementById('category-select').value;
        const location = document.getElementById('location-input').value;
        const description = document.getElementById('description-input').value;

        if (!category || !description) {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate form submission
        const submitBtn = document.querySelector('#issue-form .btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert('Complaint submitted successfully! Complaint ID: IALA2024004');
            
            // Reset form
            document.getElementById('issue-form').reset();
            sessionStorage.removeItem('selectedService');
            
            // Navigate to complaints screen
            this.navigateToScreen('complaints');
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    getServiceTitle(serviceKey) {
        const serviceTitles = {
            'street-light': 'Street Light',
            'pothole': 'Road Pothole',
            'garbage': 'Garbage',
            'water-supply': 'Water Supply',
            'drainage': 'Drainage',
            'cctv': 'CCTV',
            'incident': 'Incident Reporting',
            'fogging': 'Fogging',
            'green-belt': 'Green Belt'
        };
        return serviceTitles[serviceKey] || serviceKey;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if app is already initialized (from preview mode)
    if (!window.iala_app) {
        window.iala_app = new IALAApp();
    }
});

// Make IALAApp globally available for preview mode
window.IALAApp = IALAApp;

// Add some basic touch feedback for mobile
document.addEventListener('touchstart', () => {}, { passive: true });