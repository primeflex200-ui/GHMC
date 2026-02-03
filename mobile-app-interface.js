// Mobile App Interface for Field Managers
class MobileFieldApp {
    constructor() {
        this.currentUser = null;
        this.complaints = [];
        this.filteredComplaints = [];
        this.selectedComplaint = null;
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.currentLocation = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadComplaints();
        this.updateStats();
        this.startLocationTracking();
        this.setupOfflineHandling();
        this.updateTime();
        this.checkBattery();
    }

    loadUserData() {
        // Load user from localStorage or session
        const userData = localStorage.getItem('ghmc_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                if (this.currentUser.role !== 'field-manager') {
                    window.location.href = 'auth-system.html';
                    return;
                }
                this.updateUserUI();
            } catch (error) {
                console.error('Error loading user data:', error);
                window.location.href = 'auth-system.html';
            }
        } else {
            window.location.href = 'auth-system.html';
        }
    }

    updateUserUI() {
        if (!this.currentUser) return;
        
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-area').textContent = `Area: ${this.currentUser.area || 'Not assigned'}`;
        
        // Set user initials
        const initials = this.currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        document.getElementById('user-initials').textContent = initials;
    }

    setupEventListeners() {
        // Sync button
        document.getElementById('sync-btn').addEventListener('click', () => {
            this.syncData();
        });

        // Quick actions
        document.getElementById('scan-qr').addEventListener('click', () => {
            this.scanQRCode();
        });

        document.getElementById('take-photo').addEventListener('click', () => {
            this.takePhoto();
        });

        document.getElementById('voice-note').addEventListener('click', () => {
            this.recordVoiceNote();
        });

        document.getElementById('gps-location').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Filter toggle
        document.getElementById('filter-toggle').addEventListener('click', () => {
            this.toggleFilters();
        });

        // Filters
        document.getElementById('status-filter-mobile').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('priority-filter-mobile').addEventListener('change', () => {
            this.applyFilters();
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item-mobile').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = item.dataset.screen;
                this.navigateToScreen(screen);
            });
        });

        // Modal controls
        document.getElementById('modal-backdrop').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        document.getElementById('close-update-modal').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        document.getElementById('cancel-update-mobile').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        document.getElementById('submit-update-mobile').addEventListener('click', () => {
            this.submitStatusUpdate();
        });

        // Photo capture
        document.getElementById('capture-photo').addEventListener('click', () => {
            document.getElementById('photo-input-mobile').click();
        });

        document.getElementById('photo-input-mobile').addEventListener('change', (e) => {
            this.handlePhotoCapture(e);
        });

        // Active complaint actions
        document.getElementById('update-active').addEventListener('click', () => {
            if (this.selectedComplaint) {
                this.showUpdateModal(this.selectedComplaint);
            }
        });

        document.getElementById('navigate-active').addEventListener('click', () => {
            if (this.selectedComplaint) {
                this.navigateToComplaint(this.selectedComplaint);
            }
        });

        // Online/offline events
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    async loadComplaints() {
        try {
            // Load complaints assigned to this field manager
            const allComplaints = this.getAllComplaints();
            
            this.complaints = allComplaints.filter(complaint => 
                complaint.assignedTo === this.currentUser.id ||
                (complaint.tags && complaint.tags.location && 
                 complaint.tags.location.includes(this.currentUser.area?.toLowerCase().replace(/\s+/g, '-')))
            );

            // Add demo complaints if none exist
            if (this.complaints.length === 0) {
                this.complaints = this.generateDemoComplaints();
            }

            this.applyFilters();
            this.updateStats();
            this.updateActiveComplaint();
        } catch (error) {
            console.error('Error loading complaints:', error);
            this.showError('Failed to load complaints');
        }
    }

    generateDemoComplaints() {
        return [
            {
                id: 'GHMC2024301',
                category: 'street-light',
                description: 'Street light not working on Road No. 12',
                location: 'Road No. 12, Banjara Hills',
                priority: 'high',
                status: 'assigned',
                assignedTo: this.currentUser.id,
                assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                coordinates: { lat: 17.4239, lng: 78.4738 }
            },
            {
                id: 'GHMC2024302',
                category: 'pothole',
                description: 'Large pothole causing traffic issues',
                location: 'Jubilee Hills Main Road',
                priority: 'critical',
                status: 'in-progress',
                assignedTo: this.currentUser.id,
                startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                coordinates: { lat: 17.4326, lng: 78.4071 }
            },
            {
                id: 'GHMC2024303',
                category: 'garbage',
                description: 'Garbage not collected for 3 days',
                location: 'Madhapur Colony, Block A',
                priority: 'medium',
                status: 'pending-verification',
                assignedTo: this.currentUser.id,
                completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                coordinates: { lat: 17.4483, lng: 78.3915 }
            }
        ];
    }

    applyFilters() {
        const statusFilter = document.getElementById('status-filter-mobile').value;
        const priorityFilter = document.getElementById('priority-filter-mobile').value;

        this.filteredComplaints = this.complaints.filter(complaint => {
            const statusMatch = !statusFilter || complaint.status === statusFilter;
            const priorityMatch = !priorityFilter || complaint.priority === priorityFilter;
            return statusMatch && priorityMatch;
        });

        this.renderComplaints();
    }

    renderComplaints() {
        const container = document.getElementById('complaints-list-mobile');
        
        if (this.filteredComplaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mobile">
                    <h3>No complaints found</h3>
                    <p>No complaints match the current filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredComplaints.map(complaint => `
            <div class="complaint-item-mobile" onclick="mobileApp.selectComplaint('${complaint.id}')">
                <div class="complaint-item-header">
                    <div class="complaint-item-id">${complaint.id}</div>
                    <span class="complaint-priority priority-${complaint.priority}">${this.formatPriority(complaint.priority)}</span>
                </div>
                
                <div class="complaint-item-meta">
                    <span>${this.getCategoryDisplayName(complaint.category)}</span>
                    <span>Age: ${this.getComplaintAge(complaint.submittedAt)}</span>
                </div>
                
                <div class="complaint-item-description">${complaint.description}</div>
                
                <div class="complaint-item-footer">
                    <span class="complaint-status status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span>
                    <span class="complaint-age">${complaint.location}</span>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const pendingCount = this.complaints.filter(c => c.status === 'assigned').length;
        const progressCount = this.complaints.filter(c => c.status === 'in-progress').length;
        const completedCount = this.complaints.filter(c => c.status === 'resolved' || c.status === 'pending-verification').length;

        document.getElementById('pending-count').textContent = pendingCount;
        document.getElementById('progress-count').textContent = progressCount;
        document.getElementById('completed-count').textContent = completedCount;
    }

    updateActiveComplaint() {
        // Show the most urgent active complaint
        const activeComplaint = this.complaints.find(c => 
            c.status === 'in-progress' || 
            (c.status === 'assigned' && c.priority === 'critical')
        );

        const activeCard = document.getElementById('active-complaint');
        
        if (activeComplaint) {
            document.getElementById('active-complaint-id').textContent = activeComplaint.id;
            document.getElementById('active-complaint-description').textContent = activeComplaint.description;
            document.getElementById('active-complaint-location').textContent = activeComplaint.location;
            activeCard.style.display = 'block';
            this.selectedComplaint = activeComplaint;
        } else {
            activeCard.style.display = 'none';
            this.selectedComplaint = null;
        }
    }

    selectComplaint(complaintId) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (complaint) {
            this.selectedComplaint = complaint;
            this.showUpdateModal(complaint);
        }
    }

    showUpdateModal(complaint) {
        const modal = document.getElementById('update-modal');
        const summary = document.getElementById('complaint-summary-mobile');
        
        summary.innerHTML = `
            <h4>${complaint.id} - ${this.getCategoryDisplayName(complaint.category)}</h4>
            <p><strong>Location:</strong> ${complaint.location}</p>
            <p><strong>Priority:</strong> ${this.formatPriority(complaint.priority)}</p>
            <p><strong>Status:</strong> ${this.getStatusDisplayName(complaint.status)}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
        `;

        // Reset form
        document.getElementById('update-form-mobile').reset();
        document.getElementById('photo-preview-mobile').innerHTML = '';
        
        modal.classList.add('active');
    }

    closeUpdateModal() {
        document.getElementById('update-modal').classList.remove('active');
    }

    async submitStatusUpdate() {
        if (!this.selectedComplaint) return;

        const statusUpdate = document.getElementById('status-update-mobile').value;
        const progressNotes = document.getElementById('progress-notes-mobile').value;
        const photoInput = document.getElementById('photo-input-mobile');

        if (!statusUpdate) {
            this.showError('Please select a status update');
            return;
        }

        this.showLoading();

        try {
            // Update complaint
            this.selectedComplaint.status = statusUpdate;
            this.selectedComplaint.updatedAt = new Date().toISOString();
            this.selectedComplaint.updatedBy = this.currentUser.id;
            
            if (progressNotes) {
                if (!this.selectedComplaint.notes) this.selectedComplaint.notes = [];
                this.selectedComplaint.notes.push({
                    text: progressNotes,
                    addedBy: this.currentUser.name,
                    addedAt: new Date().toISOString(),
                    location: this.currentLocation
                });
            }

            if (statusUpdate === 'in-progress' && !this.selectedComplaint.startedAt) {
                this.selectedComplaint.startedAt = new Date().toISOString();
            }

            if (statusUpdate === 'resolved' || statusUpdate === 'pending-verification') {
                this.selectedComplaint.completedAt = new Date().toISOString();
                this.selectedComplaint.completedBy = this.currentUser.id;
            }

            // Handle photo if captured
            if (photoInput.files.length > 0) {
                await this.processPhoto(photoInput.files[0]);
            }

            // Save complaint
            this.saveComplaint(this.selectedComplaint);

            // Queue for sync if offline
            if (!this.isOnline) {
                this.queueForSync('update_complaint', this.selectedComplaint);
            }

            this.hideLoading();
            this.closeUpdateModal();
            this.showSuccess(`Complaint ${this.selectedComplaint.id} updated successfully`);
            
            // Refresh data
            this.loadComplaints();

        } catch (error) {
            this.hideLoading();
            console.error('Error updating complaint:', error);
            this.showError('Failed to update complaint');
        }
    }

    async processPhoto(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!this.selectedComplaint.attachments) {
                    this.selectedComplaint.attachments = [];
                }
                
                this.selectedComplaint.attachments.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    uploadedBy: this.currentUser.name,
                    uploadedAt: new Date().toISOString(),
                    location: this.currentLocation
                });
                
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    handlePhotoCapture(event) {
        const file = event.target.files[0];
        if (file) {
            const preview = document.getElementById('photo-preview-mobile');
            const reader = new FileReader();
            
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Captured photo">`;
            };
            
            reader.readAsDataURL(file);
        }
    }

    // Quick Actions
    async scanQRCode() {
        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector();
                // Implementation would use camera to scan QR codes
                this.showInfo('QR Scanner', 'QR code scanning feature will be available in the next update');
            } catch (error) {
                this.showError('QR code scanning not supported on this device');
            }
        } else {
            this.showInfo('QR Scanner', 'QR code scanning not supported on this browser');
        }
    }

    takePhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showSuccess('Photo captured successfully');
                // Store photo for later use
                this.storePhoto(file);
            }
        };
        
        input.click();
    }

    async recordVoiceNote() {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.showInfo('Voice Note', 'Voice recording feature will be available in the next update');
                // Stop the stream
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                this.showError('Microphone access denied');
            }
        } else {
            this.showError('Voice recording not supported on this device');
        }
    }

    async getCurrentLocation() {
        if ('geolocation' in navigator) {
            this.showLoading();
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.hideLoading();
                    this.showSuccess(`Location updated: ${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}`);
                },
                (error) => {
                    this.hideLoading();
                    this.showError('Failed to get location: ' + error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            this.showError('Geolocation not supported on this device');
        }
    }

    navigateToComplaint(complaint) {
        if (complaint.coordinates) {
            const { lat, lng } = complaint.coordinates;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank');
        } else {
            const encodedLocation = encodeURIComponent(complaint.location);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
            window.open(url, '_blank');
        }
    }

    // Navigation
    navigateToScreen(screenName) {
        // Update active nav item
        document.querySelectorAll('.nav-item-mobile').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

        // Handle screen-specific logic
        switch (screenName) {
            case 'home':
                // Already on home screen
                break;
            case 'map':
                this.showMapView();
                break;
            case 'camera':
                this.takePhoto();
                break;
            case 'profile':
                this.showProfile();
                break;
        }
    }

    showMapView() {
        this.showInfo('Map View', 'Map view with complaint locations will be available in the next update');
    }

    showProfile() {
        this.showInfo('Profile', 'Profile management will be available in the next update');
    }

    toggleFilters() {
        const filterBar = document.getElementById('filter-bar');
        const isVisible = filterBar.style.display !== 'none';
        filterBar.style.display = isVisible ? 'none' : 'block';
    }

    // Offline Handling
    setupOfflineHandling() {
        this.updateConnectionStatus();
        
        // Load offline queue
        const savedQueue = localStorage.getItem('ghmc_offline_queue');
        if (savedQueue) {
            this.offlineQueue = JSON.parse(savedQueue);
        }
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        this.updateConnectionStatus();
        
        if (isOnline) {
            this.processOfflineQueue();
        }
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connection-status');
        const offlineIndicator = document.getElementById('offline-indicator');
        
        if (this.isOnline) {
            indicator.classList.remove('offline');
            offlineIndicator.style.display = 'none';
        } else {
            indicator.classList.add('offline');
            offlineIndicator.style.display = 'flex';
        }
    }

    queueForSync(action, data) {
        this.offlineQueue.push({
            action,
            data,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('ghmc_offline_queue', JSON.stringify(this.offlineQueue));
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
        this.showLoading();
        
        try {
            for (const item of this.offlineQueue) {
                await this.syncQueueItem(item);
            }
            
            this.offlineQueue = [];
            localStorage.removeItem('ghmc_offline_queue');
            this.showSuccess('Offline data synced successfully');
        } catch (error) {
            console.error('Error syncing offline data:', error);
            this.showError('Failed to sync some offline data');
        } finally {
            this.hideLoading();
        }
    }

    async syncQueueItem(item) {
        // Simulate API sync
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Synced:', item.action, item.data.id);
                resolve();
            }, 500);
        });
    }

    async syncData() {
        const syncBtn = document.getElementById('sync-btn');
        syncBtn.classList.add('syncing');
        
        try {
            // Simulate data sync
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Reload complaints
            await this.loadComplaints();
            
            this.showSuccess('Data synced successfully');
        } catch (error) {
            console.error('Sync error:', error);
            this.showError('Failed to sync data');
        } finally {
            syncBtn.classList.remove('syncing');
        }
    }

    // Location Tracking
    startLocationTracking() {
        if ('geolocation' in navigator) {
            // Get initial location
            this.getCurrentLocation();
            
            // Track location every 5 minutes
            setInterval(() => {
                this.getCurrentLocation();
            }, 5 * 60 * 1000);
        }
    }

    // Utility Functions
    updateTime() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('current-time').textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    async checkBattery() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const batteryLevel = Math.round(battery.level * 100);
                document.getElementById('battery-level').textContent = `${batteryLevel}%`;
                
                battery.addEventListener('levelchange', () => {
                    const level = Math.round(battery.level * 100);
                    document.getElementById('battery-level').textContent = `${level}%`;
                });
            } catch (error) {
                document.getElementById('battery-level').textContent = '100%';
            }
        }
    }

    storePhoto(file) {
        const photos = JSON.parse(localStorage.getItem('ghmc_photos') || '[]');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            photos.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                timestamp: new Date().toISOString(),
                location: this.currentLocation
            });
            
            // Keep only last 50 photos
            if (photos.length > 50) {
                photos.splice(0, photos.length - 50);
            }
            
            localStorage.setItem('ghmc_photos', JSON.stringify(photos));
        };
        
        reader.readAsDataURL(file);
    }

    // Data Management
    getAllComplaints() {
        const saved = localStorage.getItem('ghmc_complaints');
        return saved ? JSON.parse(saved) : [];
    }

    saveComplaint(complaint) {
        const complaints = this.getAllComplaints();
        const index = complaints.findIndex(c => c.id === complaint.id);
        
        if (index > -1) {
            complaints[index] = complaint;
        } else {
            complaints.push(complaint);
        }
        
        localStorage.setItem('ghmc_complaints', JSON.stringify(complaints));
    }

    // Display Helpers
    getCategoryDisplayName(category) {
        const categoryNames = {
            'street-light': 'Street Light',
            'pothole': 'Road Pothole',
            'garbage': 'Garbage Collection',
            'water-supply': 'Water Supply',
            'drainage': 'Drainage',
            'cctv': 'CCTV',
            'incident': 'Incident Reporting',
            'fogging': 'Fogging',
            'green-belt': 'Green Belt'
        };
        return categoryNames[category] || category;
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'submitted': 'Submitted',
            'assigned': 'Assigned',
            'in-progress': 'In Progress',
            'pending-verification': 'Pending Verification',
            'resolved': 'Resolved',
            'escalated': 'Escalated'
        };
        return statusNames[status] || status;
    }

    formatPriority(priority) {
        return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
    }

    getComplaintAge(submittedAt) {
        const now = new Date();
        const submitted = new Date(submittedAt);
        const diffMs = now - submitted;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays}d`;
        } else {
            return `${diffHours}h`;
        }
    }

    // UI Feedback
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(title, message) {
        this.showNotification(`${title}: ${message}`, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#666' : '#333'};
            color: white;
            padding: 12px 20px;
            border-radius: 20px;
            z-index: 1001;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
            animation: slideDown 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Initialize mobile app
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileFieldApp();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}