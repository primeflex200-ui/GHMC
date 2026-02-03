// Role-Based Permissions and Access Control
class RolePermissions {
    constructor() {
        this.permissions = {
            'admin': [
                'all', // Admin has all permissions
                'manage_users',
                'manage_roles',
                'system_config',
                'view_all_complaints',
                'assign_complaints',
                'escalate_complaints',
                'generate_reports',
                'bulk_operations',
                'manage_categories',
                'manage_workflows'
            ],
            'officer-manager': [
                'view_all_complaints',
                'assign_complaints',
                'reassign_complaints',
                'escalate_complaints',
                'manage_field_managers',
                'generate_reports',
                'bulk_operations',
                'view_analytics',
                'manage_priorities',
                'approve_resolutions'
            ],
            'field-manager': [
                'view_assigned_complaints',
                'update_complaint_status',
                'upload_proof',
                'add_progress_notes',
                'request_escalation',
                'view_area_complaints',
                'mark_resolved',
                'update_location'
            ],
            'employee': [
                'view_assigned_tasks',
                'update_task_status',
                'upload_completion_proof',
                'add_work_notes',
                'view_task_details',
                'mark_task_completed'
            ],
            'user': [
                'submit_complaints',
                'track_own_complaints',
                'receive_updates',
                'view_complaint_history',
                'update_profile',
                'ai_chat_access'
            ],
            'guest': [
                'submit_complaints',
                'ai_chat_access'
            ]
        };

        this.tags = {
            categories: [
                'street-light', 'pothole', 'garbage', 'water-supply', 
                'drainage', 'cctv', 'incident', 'fogging', 'green-belt'
            ],
            priorities: ['low', 'medium', 'high', 'critical'],
            departments: [
                'electrical', 'road-maintenance', 'waste-management', 
                'water-supply', 'drainage', 'security', 'health', 'parks'
            ],
            locations: [
                'banjara-hills', 'jubilee-hills', 'madhapur', 'gachibowli',
                'hitech-city', 'kondapur', 'kukatpally', 'secunderabad'
            ],
            status: [
                'submitted', 'assigned', 'in-progress', 
                'pending-verification', 'resolved', 'escalated'
            ]
        };

        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.enforcePermissions();
    }

    loadCurrentUser() {
        try {
            const userData = localStorage.getItem('ghmc_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.redirectToAuth();
        }
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.permissions[this.currentUser.role] || [];
        
        // Admin has all permissions
        if (userPermissions.includes('all')) return true;
        
        return userPermissions.includes(permission);
    }

    enforcePermissions() {
        if (!this.currentUser) {
            this.redirectToAuth();
            return;
        }

        // Hide elements based on permissions
        this.hideUnauthorizedElements();
        
        // Setup permission-based event listeners
        this.setupPermissionBasedListeners();
    }

    hideUnauthorizedElements() {
        const permissionElements = document.querySelectorAll('[data-permission]');
        
        permissionElements.forEach(element => {
            const requiredPermission = element.dataset.permission;
            if (!this.hasPermission(requiredPermission)) {
                element.style.display = 'none';
            }
        });

        // Role-specific hiding
        const roleElements = document.querySelectorAll('[data-role]');
        
        roleElements.forEach(element => {
            const allowedRoles = element.dataset.role.split(',');
            if (!allowedRoles.includes(this.currentUser.role)) {
                element.style.display = 'none';
            }
        });
    }

    setupPermissionBasedListeners() {
        // Prevent unauthorized actions
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-permission]');
            if (element) {
                const requiredPermission = element.dataset.permission;
                if (!this.hasPermission(requiredPermission)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPermissionDenied();
                    return false;
                }
            }
        });
    }

    showPermissionDenied() {
        this.showNotification('Access Denied', 'You do not have permission to perform this action.', 'error');
    }

    redirectToAuth() {
        window.location.href = 'auth-system.html';
    }

    // Tag Management
    addTag(complaintId, tag, category = 'custom') {
        if (!this.hasPermission('manage_tags') && !this.hasPermission('all')) {
            this.showPermissionDenied();
            return false;
        }

        const complaint = this.getComplaint(complaintId);
        if (complaint) {
            if (!complaint.tags) complaint.tags = {};
            if (!complaint.tags[category]) complaint.tags[category] = [];
            
            if (!complaint.tags[category].includes(tag)) {
                complaint.tags[category].push(tag);
                this.saveComplaint(complaint);
                return true;
            }
        }
        return false;
    }

    removeTag(complaintId, tag, category = 'custom') {
        if (!this.hasPermission('manage_tags') && !this.hasPermission('all')) {
            this.showPermissionDenied();
            return false;
        }

        const complaint = this.getComplaint(complaintId);
        if (complaint && complaint.tags && complaint.tags[category]) {
            const index = complaint.tags[category].indexOf(tag);
            if (index > -1) {
                complaint.tags[category].splice(index, 1);
                this.saveComplaint(complaint);
                return true;
            }
        }
        return false;
    }

    getComplaintsByTag(tag, category = null) {
        const complaints = this.getAllComplaints();
        return complaints.filter(complaint => {
            if (!complaint.tags) return false;
            
            if (category) {
                return complaint.tags[category] && complaint.tags[category].includes(tag);
            } else {
                // Search in all categories
                return Object.values(complaint.tags).some(tags => tags.includes(tag));
            }
        });
    }

    // Auto-tagging based on complaint content
    autoTagComplaint(complaint) {
        if (!complaint.tags) complaint.tags = {};

        // Auto-tag by category
        if (complaint.category && this.tags.categories.includes(complaint.category)) {
            if (!complaint.tags.category) complaint.tags.category = [];
            if (!complaint.tags.category.includes(complaint.category)) {
                complaint.tags.category.push(complaint.category);
            }
        }

        // Auto-tag by priority
        if (complaint.priority && this.tags.priorities.includes(complaint.priority)) {
            if (!complaint.tags.priority) complaint.tags.priority = [];
            if (!complaint.tags.priority.includes(complaint.priority)) {
                complaint.tags.priority.push(complaint.priority);
            }
        }

        // Auto-tag by location (extract from description or location field)
        const locationKeywords = {
            'banjara-hills': ['banjara', 'hills'],
            'jubilee-hills': ['jubilee', 'hills'],
            'madhapur': ['madhapur'],
            'gachibowli': ['gachibowli'],
            'hitech-city': ['hitech', 'hitec', 'cyberabad'],
            'kondapur': ['kondapur'],
            'kukatpally': ['kukatpally'],
            'secunderabad': ['secunderabad']
        };

        const text = (complaint.description + ' ' + (complaint.location || '')).toLowerCase();
        
        Object.entries(locationKeywords).forEach(([location, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                if (!complaint.tags.location) complaint.tags.location = [];
                if (!complaint.tags.location.includes(location)) {
                    complaint.tags.location.push(location);
                }
            }
        });

        // Auto-tag by urgency keywords
        const urgencyKeywords = {
            'critical': ['emergency', 'urgent', 'critical', 'danger', 'accident'],
            'high': ['important', 'serious', 'major', 'significant'],
            'medium': ['moderate', 'normal', 'regular'],
            'low': ['minor', 'small', 'routine']
        };

        Object.entries(urgencyKeywords).forEach(([priority, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                if (!complaint.tags.urgency) complaint.tags.urgency = [];
                if (!complaint.tags.urgency.includes(priority)) {
                    complaint.tags.urgency.push(priority);
                }
            }
        });

        return complaint;
    }

    // Complaint routing based on tags and user role
    routeComplaint(complaint) {
        if (!this.hasPermission('assign_complaints')) {
            return null;
        }

        // Auto-assign based on category and location
        const categoryDepartmentMap = {
            'street-light': 'electrical',
            'pothole': 'road-maintenance',
            'garbage': 'waste-management',
            'water-supply': 'water-supply',
            'drainage': 'drainage',
            'cctv': 'security',
            'fogging': 'health',
            'green-belt': 'parks'
        };

        const department = categoryDepartmentMap[complaint.category];
        if (department) {
            // Find available field managers in the department and area
            const fieldManagers = this.getFieldManagersByDepartmentAndArea(
                department, 
                complaint.tags?.location?.[0]
            );

            if (fieldManagers.length > 0) {
                // Assign to field manager with least workload
                const assignedManager = this.getLeastBusyFieldManager(fieldManagers);
                return assignedManager;
            }
        }

        return null;
    }

    // User management (Admin only)
    createUser(userData) {
        if (!this.hasPermission('manage_users')) {
            this.showPermissionDenied();
            return false;
        }

        // Validate user data
        if (!userData.id || !userData.role || !userData.name) {
            throw new Error('Missing required user data');
        }

        // Ensure role permissions exist
        if (!this.permissions[userData.role]) {
            throw new Error('Invalid role specified');
        }

        const users = this.getUsers();
        
        // Check if user already exists
        if (users.find(u => u.id === userData.id)) {
            throw new Error('User already exists');
        }

        const newUser = {
            ...userData,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.id,
            permissions: this.permissions[userData.role],
            isActive: true
        };

        users.push(newUser);
        this.saveUsers(users);
        
        return newUser;
    }

    updateUserRole(userId, newRole) {
        if (!this.hasPermission('manage_roles')) {
            this.showPermissionDenied();
            return false;
        }

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        if (!this.permissions[newRole]) {
            throw new Error('Invalid role specified');
        }

        user.role = newRole;
        user.permissions = this.permissions[newRole];
        user.updatedAt = new Date().toISOString();
        user.updatedBy = this.currentUser.id;

        this.saveUsers(users);
        return user;
    }

    deactivateUser(userId) {
        if (!this.hasPermission('manage_users')) {
            this.showPermissionDenied();
            return false;
        }

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = false;
        user.deactivatedAt = new Date().toISOString();
        user.deactivatedBy = this.currentUser.id;

        this.saveUsers(users);
        return user;
    }

    // Utility methods
    getUsers() {
        const saved = localStorage.getItem('ghmc_users');
        return saved ? JSON.parse(saved) : [];
    }

    saveUsers(users) {
        localStorage.setItem('ghmc_users', JSON.stringify(users));
    }

    getAllComplaints() {
        // This would integrate with the complaint system
        const saved = localStorage.getItem('ghmc_complaints');
        return saved ? JSON.parse(saved) : [];
    }

    getComplaint(complaintId) {
        const complaints = this.getAllComplaints();
        return complaints.find(c => c.id === complaintId);
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

    getFieldManagersByDepartmentAndArea(department, area) {
        const users = this.getUsers();
        return users.filter(user => 
            user.role === 'field-manager' && 
            user.department === department && 
            (!area || user.area === area) &&
            user.isActive
        );
    }

    getLeastBusyFieldManager(fieldManagers) {
        // This would calculate workload based on assigned complaints
        // For now, return the first available manager
        return fieldManagers[0];
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

    // Public API
    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    getUserPermissions() {
        return this.currentUser ? this.permissions[this.currentUser.role] || [] : [];
    }

    canAccess(resource) {
        return this.hasPermission(resource);
    }

    logout() {
        localStorage.removeItem('ghmc_session');
        localStorage.removeItem('ghmc_user');
        this.currentUser = null;
        this.redirectToAuth();
    }
}

// Initialize role permissions system
document.addEventListener('DOMContentLoaded', () => {
    window.rolePermissions = new RolePermissions();
});

// Export for use by other modules
window.RolePermissions = RolePermissions;