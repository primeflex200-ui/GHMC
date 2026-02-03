// Admin Dashboard JavaScript
class GHMCAdminDashboard {
    constructor() {
        this.complaints = [];
        this.filteredComplaints = [];
        this.pendingSignups = [];
        this.currentView = 'table';
        this.selectedComplaint = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadComplaints();
        this.loadPendingSignups();
        this.startAutoRefresh();
        this.updateLastUpdatedTime();
    }

    setupEventListeners() {
        // Filters
        document.getElementById('status-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('category-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('team-filter').addEventListener('change', () => this.applyFilters());

        // Controls
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadComplaints());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());

        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('update-status-btn').addEventListener('click', () => this.updateComplaintStatus());

        // Close modal on outside click
        document.getElementById('complaint-modal').addEventListener('click', (e) => {
            if (e.target.id === 'complaint-modal') {
                this.closeModal();
            }
        });

        // Signup approval controls
        document.getElementById('approve-signup-btn').addEventListener('click', () => this.approveSelectedSignup());
        document.getElementById('reject-signup-btn').addEventListener('click', () => this.rejectSelectedSignup());
        document.getElementById('close-signup-modal').addEventListener('click', () => this.closeSignupModal());
        document.getElementById('close-signup-modal-btn').addEventListener('click', () => this.closeSignupModal());

        // Close signup modal on outside click
        document.getElementById('signup-modal').addEventListener('click', (e) => {
            if (e.target.id === 'signup-modal') {
                this.closeSignupModal();
            }
        });
    }

    async loadComplaints() {
        try {
            // Get complaints from integration layer
            if (window.ghmc_integration) {
                this.complaints = await window.ghmc_integration.getAllComplaints();
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('ghmc-ai-complaints');
                this.complaints = saved ? JSON.parse(saved) : [];
            }

            this.applyFilters();
            this.updateStatistics();
            this.updateLastUpdatedTime();
        } catch (error) {
            console.error('Error loading complaints:', error);
            this.showError('Failed to load complaints');
        }
    }

    async loadPendingSignups() {
        try {
            // Get pending signup requests
            if (window.ghmc_auth) {
                this.pendingSignups = window.ghmc_auth.getPendingSignupRequestsForAdmin();
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('ghmc_pending_signups');
                this.pendingSignups = saved ? JSON.parse(saved) : [];
            }

            this.renderPendingSignups();
            this.updateSignupStatistics();
        } catch (error) {
            console.error('Error loading pending signups:', error);
            this.showError('Failed to load pending signup requests');
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const teamFilter = document.getElementById('team-filter').value;

        this.filteredComplaints = this.complaints.filter(complaint => {
            const statusMatch = !statusFilter || complaint.status === statusFilter;
            const categoryMatch = !categoryFilter || complaint.category === categoryFilter;
            const teamMatch = !teamFilter || complaint.assignedTeam === teamFilter;

            return statusMatch && categoryMatch && teamMatch;
        });

        this.renderComplaints();
    }

    updateStatistics() {
        const stats = {
            total: this.complaints.length,
            pending: this.complaints.filter(c => c.status === 'submitted').length,
            inProgress: this.complaints.filter(c => c.status === 'in-progress' || c.status === 'assigned').length,
            resolved: this.complaints.filter(c => c.status === 'resolved').length
        };

        document.getElementById('total-complaints').textContent = stats.total;
        document.getElementById('pending-complaints').textContent = stats.pending;
        document.getElementById('in-progress-complaints').textContent = stats.inProgress;
        document.getElementById('resolved-complaints').textContent = stats.resolved;
    }

    updateSignupStatistics() {
        const pendingCount = this.pendingSignups.length;
        const signupCountElement = document.getElementById('pending-signups-count');
        
        if (signupCountElement) {
            signupCountElement.textContent = pendingCount;
            
            // Show notification badge if there are pending signups
            const badge = document.querySelector('.signup-notification-badge');
            if (badge) {
                badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
                badge.textContent = pendingCount;
            }
        }
    }

    renderPendingSignups() {
        const tbody = document.getElementById('pending-signups-table-body');
        
        if (!tbody) return; // Element might not exist on all admin pages
        
        if (this.pendingSignups.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <h3>No pending signup requests</h3>
                        <p>All signup requests have been processed</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.pendingSignups.map(signup => `
            <tr onclick="adminDashboard.showSignupDetails('${signup.id}')">
                <td>${signup.id}</td>
                <td>${signup.name}</td>
                <td>${signup.employeeId}</td>
                <td><span class="role-badge role-${signup.role}">${this.getRoleDisplayName(signup.role)}</span></td>
                <td>${signup.department || 'N/A'}</td>
                <td>${this.formatDate(signup.requestDate)}</td>
            </tr>
        `).join('');
    }

    showSignupDetails(signupId) {
        const signup = this.pendingSignups.find(s => s.id === signupId);
        if (!signup) return;

        this.selectedSignup = signup;
        
        const modalBody = document.getElementById('signup-modal-body');
        modalBody.innerHTML = `
            <div class="detail-field">
                <div class="detail-label">Request ID</div>
                <div class="detail-value">${signup.id}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${signup.name}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Employee ID</div>
                <div class="detail-value">${signup.employeeId}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Requested Role</div>
                <div class="detail-value">
                    <span class="role-badge role-${signup.role}">${this.getRoleDisplayName(signup.role)}</span>
                </div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Email</div>
                <div class="detail-value">${signup.email}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Mobile</div>
                <div class="detail-value">${signup.mobile}</div>
            </div>
            
            ${signup.department ? `
                <div class="detail-field">
                    <div class="detail-label">Department</div>
                    <div class="detail-value">${this.getDepartmentDisplayName(signup.department)}</div>
                </div>
            ` : ''}
            
            ${signup.area ? `
                <div class="detail-field">
                    <div class="detail-label">Area</div>
                    <div class="detail-value">${this.getAreaDisplayName(signup.area)}</div>
                </div>
            ` : ''}
            
            <div class="detail-field">
                <div class="detail-label">Justification</div>
                <div class="detail-value">${signup.justification}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Supervisor/Reference</div>
                <div class="detail-value">${signup.supervisor}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Request Date</div>
                <div class="detail-value">${this.formatDateTime(signup.requestDate)}</div>
            </div>
        `;

        document.getElementById('signup-modal').classList.add('active');
    }

    closeSignupModal() {
        document.getElementById('signup-modal').classList.remove('active');
        this.selectedSignup = null;
    }

    async approveSelectedSignup() {
        if (!this.selectedSignup) return;

        try {
            if (window.ghmc_auth) {
                const currentUser = window.ghmc_auth.getCurrentUser();
                const approvedUser = window.ghmc_auth.approveSignupRequest(
                    this.selectedSignup.id, 
                    currentUser.id
                );
                
                if (approvedUser) {
                    this.showSuccess(`Signup request approved for ${approvedUser.name}`);
                    this.closeSignupModal();
                    this.loadPendingSignups();
                }
            }
        } catch (error) {
            console.error('Error approving signup:', error);
            this.showError('Failed to approve signup request');
        }
    }

    async rejectSelectedSignup() {
        if (!this.selectedSignup) return;

        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            if (window.ghmc_auth) {
                const currentUser = window.ghmc_auth.getCurrentUser();
                const success = window.ghmc_auth.rejectSignupRequest(
                    this.selectedSignup.id, 
                    reason,
                    currentUser.id
                );
                
                if (success) {
                    this.showSuccess(`Signup request rejected for ${this.selectedSignup.name}`);
                    this.closeSignupModal();
                    this.loadPendingSignups();
                }
            }
        } catch (error) {
            console.error('Error rejecting signup:', error);
            this.showError('Failed to reject signup request');
        }
    }

    renderComplaints() {
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderCardView();
        }
    }

    renderTableView() {
        const tbody = document.getElementById('complaints-table-body');
        
        if (this.filteredComplaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <h3>No complaints found</h3>
                        <p>No complaints match the current filters</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredComplaints.map(complaint => `
            <tr onclick="adminDashboard.showComplaintDetails('${complaint.id}')">
                <td>${complaint.id}</td>
                <td>${this.getCategoryDisplayName(complaint.category)}</td>
                <td><span class="status-badge status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span></td>
                <td>${complaint.assignedTeam || 'Unassigned'}</td>
                <td><span class="language-indicator">${(complaint.language || 'en').toUpperCase()}</span></td>
                <td>${this.formatDate(complaint.submittedAt)}</td>
                <td>
                    <button class="action-btn" onclick="event.stopPropagation(); adminDashboard.showComplaintDetails('${complaint.id}')">View</button>
                    <button class="action-btn" onclick="event.stopPropagation(); adminDashboard.quickStatusUpdate('${complaint.id}')">Update</button>
                </td>
            </tr>
        `).join('');
    }

    renderCardView() {
        const container = document.getElementById('complaints-cards');
        
        if (this.filteredComplaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No complaints found</h3>
                    <p>No complaints match the current filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredComplaints.map(complaint => `
            <div class="complaint-card" onclick="adminDashboard.showComplaintDetails('${complaint.id}')">
                <div class="card-header">
                    <div class="card-id">${complaint.id}</div>
                    <span class="status-badge status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span>
                </div>
                <div class="card-category">${this.getCategoryDisplayName(complaint.category)}</div>
                <div class="card-description">${complaint.description}</div>
                <div class="card-footer">
                    <span>${complaint.assignedTeam || 'Unassigned'}</span>
                    <span>${this.formatDate(complaint.submittedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    switchView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide views
        document.getElementById('table-view').style.display = view === 'table' ? 'block' : 'none';
        document.getElementById('cards-view').style.display = view === 'cards' ? 'block' : 'none';

        this.renderComplaints();
    }

    showComplaintDetails(complaintId) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (!complaint) return;

        this.selectedComplaint = complaint;
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="detail-field">
                <div class="detail-label">Complaint ID</div>
                <div class="detail-value">${complaint.id}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Category</div>
                <div class="detail-value">${this.getCategoryDisplayName(complaint.category)}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="status-badge status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span>
                </div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Description</div>
                <div class="detail-value">${complaint.description}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Location</div>
                <div class="detail-value">${complaint.location || 'Not specified'}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Assigned Team</div>
                <div class="detail-value">${complaint.assignedTeam || 'Unassigned'}</div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Language</div>
                <div class="detail-value">
                    <span class="language-indicator">${(complaint.language || 'en').toUpperCase()}</span>
                    ${this.getLanguageDisplayName(complaint.language)}
                </div>
            </div>
            
            <div class="detail-field">
                <div class="detail-label">Submitted At</div>
                <div class="detail-value">${this.formatDateTime(complaint.submittedAt)}</div>
            </div>
            
            ${complaint.lastUpdated ? `
                <div class="detail-field">
                    <div class="detail-label">Last Updated</div>
                    <div class="detail-value">${this.formatDateTime(complaint.lastUpdated)}</div>
                </div>
            ` : ''}
            
            ${complaint.notes ? `
                <div class="detail-field">
                    <div class="detail-label">Notes</div>
                    <div class="detail-value">${complaint.notes}</div>
                </div>
            ` : ''}
        `;

        // Set current status in dropdown
        document.getElementById('status-update').value = '';
        
        document.getElementById('complaint-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('complaint-modal').classList.remove('active');
        this.selectedComplaint = null;
    }

    async updateComplaintStatus() {
        if (!this.selectedComplaint) return;

        const newStatus = document.getElementById('status-update').value;
        if (!newStatus) return;

        try {
            // Update via integration layer
            if (window.ghmc_integration) {
                await window.ghmc_integration.mockAPI.updateComplaintStatus(
                    this.selectedComplaint.id,
                    newStatus,
                    `Status updated by admin to ${newStatus}`
                );
            } else {
                // Fallback: update locally
                this.selectedComplaint.status = newStatus;
                this.selectedComplaint.lastUpdated = new Date().toISOString();
                localStorage.setItem('ghmc-ai-complaints', JSON.stringify(this.complaints));
            }

            this.closeModal();
            this.loadComplaints();
            this.showSuccess(`Complaint ${this.selectedComplaint.id} status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating complaint status:', error);
            this.showError('Failed to update complaint status');
        }
    }

    quickStatusUpdate(complaintId) {
        this.showComplaintDetails(complaintId);
    }

    exportData() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghmc-ai-complaints-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    generateCSV() {
        const headers = [
            'Complaint ID',
            'Category',
            'Status',
            'Description',
            'Location',
            'Assigned Team',
            'Language',
            'Submitted At',
            'Last Updated'
        ];

        const rows = this.filteredComplaints.map(complaint => [
            complaint.id,
            this.getCategoryDisplayName(complaint.category),
            this.getStatusDisplayName(complaint.status),
            `"${complaint.description.replace(/"/g, '""')}"`,
            complaint.location || '',
            complaint.assignedTeam || '',
            this.getLanguageDisplayName(complaint.language),
            this.formatDateTime(complaint.submittedAt),
            complaint.lastUpdated ? this.formatDateTime(complaint.lastUpdated) : ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadComplaints();
            this.loadPendingSignups();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    updateLastUpdatedTime() {
        document.getElementById('last-updated-time').textContent = new Date().toLocaleTimeString();
    }

    // Utility methods
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
            'resolved': 'Resolved',
            'escalated': 'Escalated'
        };
        return statusNames[status] || status;
    }

    getLanguageDisplayName(language) {
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi',
            'te': 'Telugu',
            'ta': 'Tamil',
            'kn': 'Kannada',
            'ml': 'Malayalam'
        };
        return languageNames[language] || 'English';
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrator',
            'officer-manager': 'Officer Manager',
            'field-manager': 'Field Manager',
            'employee': 'Employee',
            'user': 'Normal User'
        };
        return roleNames[role] || role;
    }

    getDepartmentDisplayName(department) {
        const departmentNames = {
            'electrical': 'Electrical',
            'road-maintenance': 'Road Maintenance',
            'waste-management': 'Waste Management',
            'water-supply': 'Water Supply',
            'drainage': 'Drainage',
            'security': 'Security',
            'health': 'Health',
            'parks': 'Parks & Gardens',
            'general': 'General Services'
        };
        return departmentNames[department] || department;
    }

    getAreaDisplayName(area) {
        const areaNames = {
            'banjara-hills': 'Banjara Hills',
            'jubilee-hills': 'Jubilee Hills',
            'madhapur': 'Madhapur',
            'gachibowli': 'Gachibowli',
            'kondapur': 'Kondapur',
            'kukatpally': 'Kukatpally',
            'secunderabad': 'Secunderabad',
            'hitech-city': 'Hitech City'
        };
        return areaNames[area] || area;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #666;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new GHMCAdminDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminDashboard) {
        window.adminDashboard.stopAutoRefresh();
    }
});