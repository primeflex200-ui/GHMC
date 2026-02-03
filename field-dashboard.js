// Field Manager Dashboard JavaScript
class FieldManagerDashboard {
    constructor() {
        this.currentUser = null;
        this.assignedComplaints = [];
        this.filteredComplaints = [];
        this.selectedComplaint = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadAssignedComplaints();
        this.updateStats();
    }

    loadUserData() {
        if (!window.rolePermissions) {
            console.error('Role permissions not loaded');
            return;
        }

        this.currentUser = window.rolePermissions.getCurrentUser();
        
        if (!this.currentUser || this.currentUser.role !== 'field-manager') {
            window.location.href = 'auth-system.html';
            return;
        }

        // Update UI with user info
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-area').textContent = `Area: ${this.currentUser.area || 'Not assigned'}`;
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (window.rolePermissions) {
                window.rolePermissions.logout();
            }
        });

        // Quick actions
        document.getElementById('view-assigned').addEventListener('click', () => {
            this.scrollToComplaints();
        });

        document.getElementById('update-status').addEventListener('click', () => {
            this.showUpdateModal();
        });

        document.getElementById('upload-proof').addEventListener('click', () => {
            this.showUploadProofDialog();
        });

        document.getElementById('mobile-app').addEventListener('click', () => {
            this.showMobileAppInfo();
        });

        // Filters
        document.getElementById('priority-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('refresh-complaints').addEventListener('click', () => {
            this.loadAssignedComplaints();
        });

        // Modal controls
        document.getElementById('close-update-modal').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        document.getElementById('cancel-update').addEventListener('click', () => {
            this.closeUpdateModal();
        });

        document.getElementById('submit-update').addEventListener('click', () => {
            this.submitStatusUpdate();
        });

        // Form handling
        document.getElementById('update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitStatusUpdate();
        });
    }

    async loadAssignedComplaints() {
        try {
            // Get complaints assigned to this field manager
            const allComplaints = this.getAllComplaints();
            
            this.assignedComplaints = allComplaints.filter(complaint => 
                complaint.assignedTo === this.currentUser.id ||
                (complaint.assignedTeam && complaint.assignedTeam.includes(this.currentUser.department)) ||
                (complaint.tags && complaint.tags.location && 
                 complaint.tags.location.includes(this.currentUser.area?.toLowerCase().replace(/\s+/g, '-')))
            );

            // Add demo complaints if none exist
            if (this.assignedComplaints.length === 0) {
                this.assignedComplaints = this.generateDemoComplaints();
            }

            this.applyFilters();
            this.updateStats();
        } catch (error) {
            console.error('Error loading complaints:', error);
            this.showError('Failed to load complaints');
        }
    }

    generateDemoComplaints() {
        const demoComplaints = [
            {
                id: 'GHMC2024101',
                category: 'street-light',
                description: 'Street light not working on Road No. 12, Banjara Hills',
                location: 'Road No. 12, Banjara Hills',
                priority: 'high',
                status: 'assigned',
                assignedTo: this.currentUser.id,
                assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                tags: {
                    category: ['street-light'],
                    priority: ['high'],
                    location: ['banjara-hills']
                }
            },
            {
                id: 'GHMC2024102',
                category: 'pothole',
                description: 'Large pothole causing traffic issues on main road',
                location: 'Jubilee Hills Main Road',
                priority: 'medium',
                status: 'in-progress',
                assignedTo: this.currentUser.id,
                assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
                startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                tags: {
                    category: ['pothole'],
                    priority: ['medium'],
                    location: ['jubilee-hills']
                }
            },
            {
                id: 'GHMC2024103',
                category: 'garbage',
                description: 'Garbage not collected for 3 days in residential area',
                location: 'Madhapur Colony, Block A',
                priority: 'high',
                status: 'pending-verification',
                assignedTo: this.currentUser.id,
                assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
                submittedAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
                completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                tags: {
                    category: ['garbage'],
                    priority: ['high'],
                    location: ['madhapur']
                }
            }
        ];

        return demoComplaints;
    }

    applyFilters() {
        const priorityFilter = document.getElementById('priority-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredComplaints = this.assignedComplaints.filter(complaint => {
            const priorityMatch = !priorityFilter || complaint.priority === priorityFilter;
            const statusMatch = !statusFilter || complaint.status === statusFilter;
            return priorityMatch && statusMatch;
        });

        this.renderComplaints();
    }

    renderComplaints() {
        const container = document.getElementById('complaints-list');
        
        if (this.filteredComplaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No complaints found</h3>
                    <p>No complaints match the current filters or you have no assigned complaints.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredComplaints.map(complaint => `
            <div class="complaint-item" onclick="fieldDashboard.showComplaintDetails('${complaint.id}')">
                <div class="complaint-header">
                    <div class="complaint-id">${complaint.id}</div>
                    <span class="complaint-priority priority-${complaint.priority}">${this.formatPriority(complaint.priority)}</span>
                </div>
                
                <div class="complaint-meta">
                    <span>${this.getCategoryDisplayName(complaint.category)}</span>
                    <span>${complaint.location}</span>
                    <span>Age: ${this.getComplaintAge(complaint.submittedAt)}</span>
                </div>
                
                <div class="complaint-description">${complaint.description}</div>
                
                <div class="complaint-footer">
                    <span class="complaint-status status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span>
                    <div class="complaint-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); fieldDashboard.updateComplaintStatus('${complaint.id}')">Update</button>
                        <button class="action-btn" onclick="event.stopPropagation(); fieldDashboard.viewComplaintDetails('${complaint.id}')">Details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const assignedCount = this.assignedComplaints.filter(c => c.status === 'assigned').length;
        const completedToday = this.assignedComplaints.filter(c => {
            if (c.status !== 'resolved') return false;
            const completedDate = new Date(c.completedAt || c.updatedAt);
            const today = new Date();
            return completedDate.toDateString() === today.toDateString();
        }).length;

        document.getElementById('assigned-count').textContent = assignedCount;
        document.getElementById('completed-today').textContent = completedToday;
    }

    showComplaintDetails(complaintId) {
        const complaint = this.assignedComplaints.find(c => c.id === complaintId);
        if (!complaint) return;

        this.selectedComplaint = complaint;
        this.populateUpdateModal(complaint);
        document.getElementById('update-modal').classList.add('active');
    }

    updateComplaintStatus(complaintId) {
        this.showComplaintDetails(complaintId);
    }

    viewComplaintDetails(complaintId) {
        this.showComplaintDetails(complaintId);
    }

    populateUpdateModal(complaint) {
        const summary = document.getElementById('complaint-summary');
        summary.innerHTML = `
            <div class="complaint-detail">
                <h4>${complaint.id} - ${this.getCategoryDisplayName(complaint.category)}</h4>
                <p><strong>Location:</strong> ${complaint.location}</p>
                <p><strong>Description:</strong> ${complaint.description}</p>
                <p><strong>Current Status:</strong> <span class="complaint-status status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span></p>
                <p><strong>Priority:</strong> <span class="complaint-priority priority-${complaint.priority}">${this.formatPriority(complaint.priority)}</span></p>
                <p><strong>Assigned:</strong> ${this.formatDateTime(complaint.assignedAt)}</p>
            </div>
        `;

        // Reset form
        document.getElementById('update-form').reset();
        
        // Set appropriate status options based on current status
        this.updateStatusOptions(complaint.status);
    }

    updateStatusOptions(currentStatus) {
        const statusSelect = document.getElementById('status-update');
        const options = {
            'assigned': [
                { value: 'in-progress', text: 'Start Work' },
                { value: 'escalate', text: 'Escalate to Officer' }
            ],
            'in-progress': [
                { value: 'pending-verification', text: 'Work Completed - Pending Verification' },
                { value: 'escalate', text: 'Escalate to Officer' }
            ],
            'pending-verification': [
                { value: 'resolved', text: 'Mark as Resolved' },
                { value: 'in-progress', text: 'Resume Work' },
                { value: 'escalate', text: 'Escalate to Officer' }
            ]
        };

        const availableOptions = options[currentStatus] || [];
        
        statusSelect.innerHTML = '<option value="">Select Status</option>' +
            availableOptions.map(option => 
                `<option value="${option.value}">${option.text}</option>`
            ).join('');
    }

    async submitStatusUpdate() {
        if (!this.selectedComplaint) return;

        const statusUpdate = document.getElementById('status-update').value;
        const progressNotes = document.getElementById('progress-notes').value;
        const proofPhotos = document.getElementById('proof-photos').files;
        const estimatedCompletion = document.getElementById('estimated-completion').value;

        if (!statusUpdate) {
            this.showError('Please select a status update');
            return;
        }

        // Validate permissions
        if (!window.rolePermissions.hasPermission('update_complaint_status')) {
            this.showError('You do not have permission to update complaint status');
            return;
        }

        this.showLoading('submit-update');

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
                    addedAt: new Date().toISOString()
                });
            }

            if (estimatedCompletion) {
                this.selectedComplaint.estimatedCompletion = estimatedCompletion;
            }

            if (statusUpdate === 'in-progress' && !this.selectedComplaint.startedAt) {
                this.selectedComplaint.startedAt = new Date().toISOString();
            }

            if (statusUpdate === 'resolved') {
                this.selectedComplaint.completedAt = new Date().toISOString();
                this.selectedComplaint.completedBy = this.currentUser.id;
            }

            // Handle photo uploads (simulate)
            if (proofPhotos.length > 0) {
                if (!this.selectedComplaint.attachments) this.selectedComplaint.attachments = [];
                
                for (let i = 0; i < proofPhotos.length; i++) {
                    const file = proofPhotos[i];
                    this.selectedComplaint.attachments.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        uploadedBy: this.currentUser.name,
                        uploadedAt: new Date().toISOString()
                    });
                }
            }

            // Save complaint
            this.saveComplaint(this.selectedComplaint);

            // Simulate API call delay
            setTimeout(() => {
                this.hideLoading('submit-update');
                this.closeUpdateModal();
                this.showSuccess(`Complaint ${this.selectedComplaint.id} status updated to ${this.getStatusDisplayName(statusUpdate)}`);
                
                // Refresh data
                this.loadAssignedComplaints();
            }, 1500);

        } catch (error) {
            this.hideLoading('submit-update');
            console.error('Error updating complaint:', error);
            this.showError('Failed to update complaint status');
        }
    }

    closeUpdateModal() {
        document.getElementById('update-modal').classList.remove('active');
        this.selectedComplaint = null;
    }

    showUpdateModal() {
        if (this.assignedComplaints.length === 0) {
            this.showError('No complaints available to update');
            return;
        }

        // Show the first assigned complaint for demo
        const firstAssigned = this.assignedComplaints.find(c => c.status === 'assigned') || this.assignedComplaints[0];
        this.showComplaintDetails(firstAssigned.id);
    }

    showUploadProofDialog() {
        // Create a simple file upload dialog
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.showSuccess(`${files.length} file(s) selected for upload`);
                // In a real implementation, files would be uploaded here
            }
        };
        
        input.click();
    }

    showMobileAppInfo() {
        this.showInfo('Mobile App', 'The GHMC Field Manager mobile app is coming soon. It will allow you to update complaints directly from the field.');
    }

    scrollToComplaints() {
        document.querySelector('.complaints-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    // Utility methods
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
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    }

    getComplaintAge(submittedAt) {
        const now = new Date();
        const submitted = new Date(submittedAt);
        const diffMs = now - submitted;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }
    }

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showSuccess(message) {
        this.showNotification('Success', message, 'success');
    }

    showError(message) {
        this.showNotification('Error', message, 'error');
    }

    showInfo(title, message) {
        this.showNotification(title, message, 'info');
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#666' : '#333'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.fieldDashboard = new FieldManagerDashboard();
});