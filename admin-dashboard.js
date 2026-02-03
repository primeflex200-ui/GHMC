// Administrator Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.complaints = [];
        this.users = [];
        this.signupRequests = [];
        this.currentTab = 'overview';
        this.currentSignupId = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.loadAllData();
        this.updateStats();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        const userData = localStorage.getItem('iala_user');

        if (!sessionId || !userData) {
            window.location.href = 'auth-system.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            if (this.currentUser.role !== 'admin') {
                alert('Access denied. This dashboard is for administrators only.');
                window.location.href = 'auth-system.html';
                return;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'auth-system.html';
        }
    }

    loadUserData() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name || 'Administrator';
        }
    }

    loadAllData() {
        this.loadComplaints();
        this.loadUsers();
        this.loadSignups();
    }

    loadComplaints() {
        const savedComplaints = localStorage.getItem('iala_complaints');
        if (savedComplaints) {
            this.complaints = JSON.parse(savedComplaints);
        } else {
            this.complaints = [];
        }
        this.renderComplaints();
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('iala_users');
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        } else {
            this.users = [];
        }
        this.renderUsers();
    }

    loadSignups() {
        const savedSignups = localStorage.getItem('iala_pending_signups');
        if (savedSignups) {
            this.signupRequests = JSON.parse(savedSignups);
        } else {
            this.signupRequests = [];
        }
        this.renderSignups();
    }

    updateStats() {
        const totalComplaints = this.complaints.length;
        const activeComplaints = this.complaints.filter(c => c.status !== 'completed').length;
        const resolvedComplaints = this.complaints.filter(c => c.status === 'completed').length;
        const totalUsers = this.users.length;
        const pendingSignups = this.signupRequests.length;

        document.getElementById('total-complaints').textContent = totalComplaints;
        document.getElementById('active-complaints').textContent = activeComplaints;
        document.getElementById('resolved-complaints').textContent = resolvedComplaints;
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('pending-signups').textContent = pendingSignups;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Modal close events
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load data for the active tab
        switch (tabName) {
            case 'complaints':
                this.renderComplaints();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'signups':
                this.renderSignups();
                break;
            case 'reports':
                // Reports are generated on demand
                break;
        }
    }

    renderComplaints() {
        const tbody = document.getElementById('admin-complaints-tbody');
        const statusFilter = document.getElementById('complaints-status-filter')?.value || 'all';
        const categoryFilter = document.getElementById('complaints-category-filter')?.value || 'all';
        
        let filteredComplaints = this.complaints;
        
        if (statusFilter !== 'all') {
            filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredComplaints = filteredComplaints.filter(c => c.category === categoryFilter);
        }
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredComplaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${complaint.id}</strong></td>
                <td>${this.getCategoryName(complaint.category)}</td>
                <td>${complaint.location}</td>
                <td><span class="status-badge ${complaint.status}">${this.getStatusName(complaint.status)}</span></td>
                <td>${complaint.assignedTo ? this.getAssignedToName(complaint.assignedTo) : 'Not Assigned'}</td>
                <td>${this.formatDate(complaint.submittedDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="adminDashboard.viewComplaint('${complaint.id}')">View</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderUsers() {
        const tbody = document.getElementById('users-tbody');
        const roleFilter = document.getElementById('users-role-filter')?.value || 'all';
        
        let filteredUsers = this.users;
        
        if (roleFilter !== 'all') {
            filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
        }
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${user.id}</strong></td>
                <td>${user.name}</td>
                <td><span class="role-badge ${user.role}">${this.getRoleName(user.role)}</span></td>
                <td>${user.department || 'Not Assigned'}</td>
                <td><span class="status-badge ${user.isActive !== false ? 'active' : 'inactive'}">${user.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                <td>${user.registrationDate ? this.formatDate(user.registrationDate) : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="adminDashboard.editUser('${user.id}')">Edit</button>
                        <button class="btn-sm btn-secondary" onclick="adminDashboard.toggleUserStatus('${user.id}')">${user.isActive !== false ? 'Deactivate' : 'Activate'}</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderSignups() {
        const tbody = document.getElementById('signups-tbody');
        const roleFilter = document.getElementById('signups-role-filter')?.value || 'all';
        
        let filteredSignups = this.signupRequests;
        
        if (roleFilter !== 'all') {
            filteredSignups = filteredSignups.filter(s => s.role === roleFilter);
        }
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredSignups.forEach(signup => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${signup.id}</strong></td>
                <td>${signup.name}</td>
                <td>${signup.employeeId}</td>
                <td><span class="role-badge ${signup.role}">${this.getRoleName(signup.role)}</span></td>
                <td>${signup.department || 'Not Specified'}</td>
                <td>${this.formatDate(signup.requestDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="adminDashboard.viewSignupRequest('${signup.id}')">View</button>
                        <button class="btn-sm btn-primary" onclick="adminDashboard.approveSignupRequest('${signup.id}')">Approve</button>
                        <button class="btn-sm btn-secondary" onclick="adminDashboard.rejectSignupRequest('${signup.id}')">Reject</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showAddUserModal() {
        document.getElementById('add-user-modal').style.display = 'block';
    }

    addUser() {
        const userId = document.getElementById('new-user-id').value.trim();
        const name = document.getElementById('new-user-name').value.trim();
        const role = document.getElementById('new-user-role').value;
        const email = document.getElementById('new-user-email').value.trim();
        const department = document.getElementById('new-user-department').value;
        const password = document.getElementById('new-user-password').value;

        if (!userId || !name || !role || !email || !password) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if user ID already exists
        if (this.users.find(u => u.id === userId)) {
            alert('User ID already exists');
            return;
        }

        const newUser = {
            id: userId,
            name: name,
            role: role,
            email: email,
            department: department,
            password: password,
            isActive: true,
            registrationDate: new Date().toISOString(),
            createdBy: this.currentUser.id,
            permissions: this.getPermissionsForRole(role)
        };

        this.users.push(newUser);
        localStorage.setItem('iala_users', JSON.stringify(this.users));
        
        this.renderUsers();
        this.updateStats();
        this.closeModal('add-user-modal');
        
        // Clear form
        document.getElementById('add-user-form').reset();
        
        alert(`User ${name} has been added successfully`);
    }

    viewSignupRequest(signupId) {
        const signup = this.signupRequests.find(s => s.id === signupId);
        if (!signup) return;

        this.currentSignupId = signupId;
        
        const content = document.getElementById('signup-detail-content');
        content.innerHTML = `
            <div class="signup-details">
                <h4>Signup Request: ${signup.id}</h4>
                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span>${signup.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Employee ID:</span>
                        <span>${signup.employeeId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Requested Role:</span>
                        <span class="role-badge ${signup.role}">${this.getRoleName(signup.role)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span>${signup.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Mobile:</span>
                        <span>${signup.mobile}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span>${signup.department || 'Not Specified'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Area:</span>
                        <span>${signup.area || 'Not Specified'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Request Date:</span>
                        <span>${this.formatDate(signup.requestDate)}</span>
                    </div>
                </div>
                
                <div class="justification-section">
                    <h5>Justification:</h5>
                    <p>${signup.justification}</p>
                </div>
                
                <div class="supervisor-section">
                    <h5>Supervisor/Reference:</h5>
                    <p>${signup.supervisor}</p>
                </div>
            </div>
        `;
        
        document.getElementById('signup-detail-modal').style.display = 'block';
    }

    approveSignupRequest(signupId) {
        const signup = this.signupRequests.find(s => s.id === signupId);
        if (!signup) return;

        if (confirm(`Are you sure you want to approve the signup request for ${signup.name}?`)) {
            // Create approved user account
            const approvedUser = {
                id: signup.id,
                employeeId: signup.employeeId,
                password: signup.password,
                role: signup.role,
                name: signup.name,
                email: signup.email,
                mobile: signup.mobile,
                department: signup.department,
                area: signup.area,
                supervisor: signup.supervisor,
                status: 'approved',
                isActive: true,
                approvedBy: this.currentUser.id,
                approvalDate: new Date().toISOString(),
                requestDate: signup.requestDate,
                permissions: this.getPermissionsForRole(signup.role)
            };

            // Add to users list
            this.users.push(approvedUser);
            localStorage.setItem('iala_users', JSON.stringify(this.users));

            // Remove from pending requests
            this.signupRequests = this.signupRequests.filter(s => s.id !== signupId);
            localStorage.setItem('iala_pending_signups', JSON.stringify(this.signupRequests));

            this.renderUsers();
            this.renderSignups();
            this.updateStats();
            
            alert(`Signup request for ${signup.name} has been approved`);
        }
    }

    rejectSignupRequest(signupId) {
        const signup = this.signupRequests.find(s => s.id === signupId);
        if (!signup) return;

        const reason = prompt(`Enter reason for rejecting ${signup.name}'s request:`);
        if (reason === null) return; // User cancelled

        if (confirm(`Are you sure you want to reject the signup request for ${signup.name}?`)) {
            // Move to rejected requests
            const rejectedRequests = JSON.parse(localStorage.getItem('iala_rejected_signups') || '[]');
            signup.status = 'rejected';
            signup.rejectionReason = reason;
            signup.rejectedBy = this.currentUser.id;
            signup.rejectionDate = new Date().toISOString();
            rejectedRequests.push(signup);
            localStorage.setItem('iala_rejected_signups', JSON.stringify(rejectedRequests));

            // Remove from pending requests
            this.signupRequests = this.signupRequests.filter(s => s.id !== signupId);
            localStorage.setItem('iala_pending_signups', JSON.stringify(this.signupRequests));

            this.renderSignups();
            this.updateStats();
            
            alert(`Signup request for ${signup.name} has been rejected`);
        }
    }

    viewComplaint(complaintId) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (!complaint) return;
        
        const content = document.getElementById('complaint-detail-content');
        content.innerHTML = `
            <div class="complaint-details">
                <h4>Complaint Details: ${complaint.id}</h4>
                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span>${this.getCategoryName(complaint.category)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="status-badge ${complaint.status}">${this.getStatusName(complaint.status)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span>${complaint.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Submitted:</span>
                        <span>${this.formatDate(complaint.submittedDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Citizen:</span>
                        <span>${complaint.citizenName || 'N/A'} ${complaint.citizenPhone ? `(${complaint.citizenPhone})` : ''}</span>
                    </div>
                    ${complaint.assignedTo ? `
                    <div class="detail-row">
                        <span class="detail-label">Assigned To:</span>
                        <span>${this.getAssignedToName(complaint.assignedTo)}</span>
                    </div>
                    ` : ''}
                </div>
                <p><strong>Description:</strong></p>
                <p>${complaint.description}</p>
            </div>
            
            ${complaint.notes && complaint.notes.length > 0 ? `
            <div style="margin-top: 1rem;">
                <h4>Activity Log:</h4>
                ${complaint.notes.map(note => `
                    <div style="background: #f8f9fa; padding: 0.75rem; margin: 0.5rem 0; border-radius: 4px; border-left: 3px solid #333;">
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">
                            ${this.formatDate(note.timestamp)} - ${note.author}
                        </div>
                        <div>${note.content}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;
        
        document.getElementById('complaint-detail-modal').style.display = 'block';
    }

    generateReport() {
        const reportType = document.getElementById('report-type').value;
        const reportPeriod = document.getElementById('report-period').value;
        
        const reportContent = document.getElementById('report-content');
        
        let reportData = '';
        
        switch (reportType) {
            case 'complaints':
                reportData = this.generateComplaintsReport(reportPeriod);
                break;
            case 'users':
                reportData = this.generateUsersReport(reportPeriod);
                break;
            case 'performance':
                reportData = this.generatePerformanceReport(reportPeriod);
                break;
        }
        
        reportContent.innerHTML = reportData;
    }

    generateComplaintsReport(period) {
        const filteredComplaints = this.filterComplaintsByPeriod(period);
        const totalComplaints = filteredComplaints.length;
        const completedComplaints = filteredComplaints.filter(c => c.status === 'completed').length;
        const pendingComplaints = filteredComplaints.filter(c => c.status !== 'completed').length;
        
        return `
            <div class="report-content">
                <h3>Complaints Report - ${this.getPeriodName(period)}</h3>
                <div class="report-stats">
                    <div class="report-stat">
                        <h4>${totalComplaints}</h4>
                        <p>Total Complaints</p>
                    </div>
                    <div class="report-stat">
                        <h4>${completedComplaints}</h4>
                        <p>Completed</p>
                    </div>
                    <div class="report-stat">
                        <h4>${pendingComplaints}</h4>
                        <p>Pending</p>
                    </div>
                    <div class="report-stat">
                        <h4>${totalComplaints > 0 ? Math.round((completedComplaints / totalComplaints) * 100) : 0}%</h4>
                        <p>Completion Rate</p>
                    </div>
                </div>
                
                <div class="report-details">
                    <h4>Category Breakdown:</h4>
                    ${this.getCategoryBreakdown(filteredComplaints)}
                </div>
            </div>
        `;
    }

    generateUsersReport(period) {
        const activeUsers = this.users.filter(u => u.isActive !== false).length;
        const inactiveUsers = this.users.filter(u => u.isActive === false).length;
        
        return `
            <div class="report-content">
                <h3>Users Report - ${this.getPeriodName(period)}</h3>
                <div class="report-stats">
                    <div class="report-stat">
                        <h4>${this.users.length}</h4>
                        <p>Total Users</p>
                    </div>
                    <div class="report-stat">
                        <h4>${activeUsers}</h4>
                        <p>Active Users</p>
                    </div>
                    <div class="report-stat">
                        <h4>${inactiveUsers}</h4>
                        <p>Inactive Users</p>
                    </div>
                    <div class="report-stat">
                        <h4>${this.signupRequests.length}</h4>
                        <p>Pending Signups</p>
                    </div>
                </div>
                
                <div class="report-details">
                    <h4>Role Distribution:</h4>
                    ${this.getRoleBreakdown(this.users)}
                </div>
            </div>
        `;
    }

    generatePerformanceReport(period) {
        const filteredComplaints = this.filterComplaintsByPeriod(period);
        const avgResolutionTime = this.calculateAverageResolutionTime(filteredComplaints);
        
        return `
            <div class="report-content">
                <h3>Performance Report - ${this.getPeriodName(period)}</h3>
                <div class="report-stats">
                    <div class="report-stat">
                        <h4>${avgResolutionTime}</h4>
                        <p>Avg Resolution Time (days)</p>
                    </div>
                    <div class="report-stat">
                        <h4>${this.users.filter(u => u.role === 'field-manager').length}</h4>
                        <p>Field Managers</p>
                    </div>
                    <div class="report-stat">
                        <h4>${this.users.filter(u => u.role === 'employee').length}</h4>
                        <p>Employees</p>
                    </div>
                    <div class="report-stat">
                        <h4>${this.users.filter(u => u.role === 'officer-manager').length}</h4>
                        <p>Officer Managers</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Filter and utility methods
    filterComplaints() {
        this.renderComplaints();
    }

    filterUsers() {
        this.renderUsers();
    }

    filterSignups() {
        this.renderSignups();
    }

    filterComplaintsByPeriod(period) {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            default:
                return this.complaints;
        }
        
        return this.complaints.filter(c => new Date(c.submittedDate) >= startDate);
    }

    getCategoryBreakdown(complaints) {
        const categories = {};
        complaints.forEach(c => {
            categories[c.category] = (categories[c.category] || 0) + 1;
        });
        
        return Object.entries(categories)
            .map(([category, count]) => `<p>${this.getCategoryName(category)}: ${count}</p>`)
            .join('');
    }

    getRoleBreakdown(users) {
        const roles = {};
        users.forEach(u => {
            roles[u.role] = (roles[u.role] || 0) + 1;
        });
        
        return Object.entries(roles)
            .map(([role, count]) => `<p>${this.getRoleName(role)}: ${count}</p>`)
            .join('');
    }

    calculateAverageResolutionTime(complaints) {
        const completedComplaints = complaints.filter(c => c.status === 'completed' && c.finalizedDate);
        if (completedComplaints.length === 0) return 'N/A';
        
        const totalTime = completedComplaints.reduce((sum, c) => {
            const submitted = new Date(c.submittedDate);
            const completed = new Date(c.finalizedDate);
            return sum + (completed - submitted);
        }, 0);
        
        const avgTime = totalTime / completedComplaints.length;
        return Math.round(avgTime / (1000 * 60 * 60 * 24)); // Convert to days
    }

    exportReport() {
        alert('Export functionality would be implemented here');
    }

    // Utility methods
    getCategoryName(category) {
        const categories = {
            'street-light': 'Street Light',
            'pothole': 'Road Pothole',
            'garbage': 'Garbage',
            'water-supply': 'Water Supply',
            'drainage': 'Drainage',
            'cctv': 'CCTV'
        };
        return categories[category] || category;
    }

    getStatusName(status) {
        const statuses = {
            'new': 'New',
            'assigned': 'Assigned',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statuses[status] || status;
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Administrator',
            'officer-manager': 'Officer Manager',
            'field-manager': 'Field Manager',
            'employee': 'Employee',
            'user': 'User'
        };
        return roles[role] || role;
    }

    getPeriodName(period) {
        const periods = {
            'today': 'Today',
            'week': 'This Week',
            'month': 'This Month',
            'quarter': 'This Quarter'
        };
        return periods[period] || period;
    }

    getAssignedToName(assignedTo) {
        const user = this.users.find(u => u.id === assignedTo);
        return user ? user.name : assignedTo;
    }

    getPermissionsForRole(role) {
        const rolePermissions = {
            'admin': ['all'],
            'officer-manager': [
                'view_all_complaints', 'assign_complaints', 'reassign_complaints',
                'escalate_complaints', 'manage_field_managers', 'generate_reports',
                'bulk_operations', 'view_analytics', 'manage_priorities', 'approve_resolutions'
            ],
            'field-manager': [
                'view_assigned_complaints', 'update_complaint_status', 'upload_proof',
                'add_progress_notes', 'request_escalation', 'view_area_complaints',
                'mark_resolved', 'update_location'
            ],
            'employee': [
                'view_assigned_tasks', 'update_task_status', 'upload_completion_proof',
                'add_work_notes', 'view_task_details', 'mark_task_completed'
            ]
        };
        return rolePermissions[role] || [];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Global functions
// Global logout function - multiple approaches for compatibility
function logoutUser() {
    console.log('Administrator logout function called'); // Debug log
    
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Clear all session data
            localStorage.removeItem('iala_session');
            localStorage.removeItem('iala_user');
            localStorage.removeItem('iala_session_data');
            localStorage.removeItem('iala_user_session');
            localStorage.removeItem('current_dashboard');
            localStorage.removeItem('field_manager_session');
            
            // Clear session storage as well
            sessionStorage.clear();
            
            console.log('Administrator session data cleared, redirecting to login');
            
            // Force redirect to login page
            window.location.replace('auth-system.html');
            
        } catch (error) {
            console.error('Error during Administrator logout:', error);
            // Force redirect even if there's an error
            alert('Logging out...');
            window.location.href = 'auth-system.html';
        }
    }
}

// Force logout without confirmation
function forceLogout() {
    console.log('Administrator force logout called');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'auth-system.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
    
    // Ensure logout functions are globally accessible
    window.logoutUser = logoutUser;
    window.forceLogout = forceLogout;
    
    console.log('Administrator dashboard loaded, logout functions available:', {
        logoutUser: typeof window.logoutUser,
        forceLogout: typeof window.forceLogout
    });
});