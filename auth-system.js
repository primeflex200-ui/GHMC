// IALA Authentication System
class IALAAuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.sessions = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.loadDemoUsers();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Registration form
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Access options
        document.getElementById('register-access').addEventListener('click', () => {
            this.showRegistrationScreen();
        });

        document.getElementById('login-access').addEventListener('click', () => {
            this.showScreen('user-login-screen');
        });

        // User login form
        document.getElementById('user-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserLogin();
        });

        // Management signup form
        document.getElementById('management-signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleManagementSignup();
        });

        // Show signup screen
        document.getElementById('show-signup').addEventListener('click', () => {
            this.showScreen('management-signup-screen');
        });

        // Clear session button (for testing)
        document.getElementById('clear-session').addEventListener('click', () => {
            this.clearAllSessions();
        });

        // Citizen access button
        document.getElementById('citizen-access-btn').addEventListener('click', () => {
            this.showScreen('user-access-screen');
        });

        // Guest access button (direct from main screen)
        document.getElementById('guest-access-btn').addEventListener('click', () => {
            this.handleGuestAccess();
        });

        // Welcome screen navigation
        document.getElementById('get-started-btn').addEventListener('click', () => {
            this.showScreen('login-screen');
        });

        document.getElementById('back-to-welcome').addEventListener('click', () => {
            this.showScreen('welcome-screen');
        });

        // Additional back buttons
        document.getElementById('back-to-login-from-user').addEventListener('click', () => {
            this.showScreen('login-screen');
        });

        document.getElementById('back-to-user-from-reg').addEventListener('click', () => {
            this.showScreen('user-access-screen');
        });

        document.getElementById('back-to-user-from-login').addEventListener('click', () => {
            this.showScreen('user-access-screen');
        });

        document.getElementById('back-to-login-from-signup').addEventListener('click', () => {
            this.showScreen('login-screen');
        });

        // Navigation between user screens
        document.getElementById('goto-register').addEventListener('click', () => {
            this.showRegistrationScreen();
        });

        document.getElementById('back-to-user-access-from-login').addEventListener('click', () => {
            this.showScreen('user-access-screen');
        });

        // Management role selection change
        document.getElementById('management-role-select').addEventListener('change', (e) => {
            this.updateRoleSpecificFields(e.target.value);
        });

        // Navigation buttons
        document.querySelectorAll('#back-to-login').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('login-screen');
            });
        });

        document.getElementById('back-to-user-access').addEventListener('click', () => {
            this.showScreen('user-access-screen');
        });
    }

    loadDemoUsers() {
        // Demo users for testing
        const demoUsers = [
            {
                id: 'admin001',
                password: 'admin123',
                role: 'admin',
                name: 'System Administrator',
                email: 'admin@iala.gov.in',
                permissions: ['all']
            },
            {
                id: 'officer001',
                password: 'officer123',
                role: 'officer-manager',
                name: 'Officer Manager',
                email: 'officer@iala.gov.in',
                department: 'General Services',
                permissions: ['view_all_complaints', 'assign_complaints', 'escalate_complaints', 'manage_field_managers']
            },
            {
                id: 'field001',
                password: 'field123',
                role: 'field-manager',
                name: 'Field Manager',
                email: 'field@iala.gov.in',
                area: 'Banjara Hills',
                department: 'Road Maintenance',
                permissions: ['view_assigned_complaints', 'update_status', 'upload_proof']
            },
            {
                id: 'emp001',
                password: 'emp123',
                role: 'employee',
                name: 'Field Employee',
                email: 'employee@iala.gov.in',
                department: 'General Services',
                supervisor: 'field001',
                permissions: ['view_assigned_tasks', 'update_task_status', 'upload_completion_proof']
            }
        ];

        demoUsers.forEach(user => {
            if (!this.users.find(u => u.id === user.id)) {
                this.users.push(user);
            }
        });

        this.saveUsers();
    }

    async handleLogin() {
        const userId = document.getElementById('user-id').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role-select').value;

        if (!userId || !password || !role) {
            this.showError('Please fill in all fields');
            return;
        }

        this.showLoading('login-form');

        // Simulate authentication delay
        setTimeout(() => {
            const user = this.authenticateUser(userId, password, role);
            
            if (user) {
                this.loginUser(user);
            } else {
                this.showError('Invalid credentials or role mismatch');
            }
            
            this.hideLoading('login-form');
        }, 1500);
    }

    authenticateUser(userId, password, role) {
        // For demo purposes, accept any credentials and create a user on the fly
        // First check if it's a predefined demo user
        const existingUser = this.users.find(u => 
            u.id === userId && 
            u.password === password && 
            u.role === role
        );

        if (existingUser) {
            return existingUser;
        }

        // If not found, create a demo user with the provided credentials
        const demoUser = {
            id: userId,
            password: password,
            role: role,
            name: this.generateNameForRole(role, userId),
            email: `${userId}@iala.gov.in`,
            permissions: this.getPermissionsForRole(role),
            isDemo: true
        };

        // Add role-specific fields
        if (role === 'officer-manager') {
            demoUser.department = 'General Services';
        } else if (role === 'field-manager') {
            demoUser.department = 'General Services';
            demoUser.area = 'Demo Area';
        } else if (role === 'employee') {
            demoUser.department = 'General Services';
            demoUser.supervisor = 'field001';
        }

        return demoUser;
    }

    loginUser(user) {
        this.currentUser = user;
        const sessionId = this.generateSessionId();
        
        // Store session
        this.sessions.set(sessionId, {
            user: user,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });

        // Store in localStorage for persistence
        localStorage.setItem('iala_session', sessionId);
        localStorage.setItem('iala_user', JSON.stringify(user));
        localStorage.setItem('iala_session_data', JSON.stringify({
            created: new Date().toISOString(),
            sessionId: sessionId
        }));

        this.showSuccess(`Welcome, ${user.name}!`);
        
        // Redirect based on role
        setTimeout(() => {
            this.redirectToRoleDashboard(user.role);
        }, 1500);
    }

    redirectToRoleDashboard(role) {
        const sessionId = localStorage.getItem('iala_session');
        
        // Role-based dashboard redirects
        switch (role) {
            case 'employee':
                window.location.href = `employee-dashboard.html?session=${sessionId}`;
                break;
            case 'field-manager':
                window.location.href = `field-dashboard.html?session=${sessionId}`;
                break;
            case 'officer-manager':
                window.location.href = `officer-dashboard.html?session=${sessionId}`;
                break;
            case 'admin':
                window.location.href = `admin-dashboard.html?session=${sessionId}`;
                break;
            default:
                // For normal users and guests, redirect to main app
                window.location.href = `index.html?session=${sessionId}&role=${role}`;
        }
    }

    handleRegistration() {
        const name = document.getElementById('reg-name').value.trim();
        const mobile = document.getElementById('reg-mobile').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const address = document.getElementById('reg-address').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validation
        if (!name || !mobile || !email || !address || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!this.validateMobile(mobile)) {
            this.showError('Please enter a valid mobile number');
            return;
        }

        this.showLoading('registration-form');

        // Simulate registration process
        setTimeout(() => {
            const userId = this.generateUserId();
            const newUser = {
                id: userId,
                password: password,
                role: 'user',
                name: name,
                mobile: mobile,
                email: email,
                address: address,
                registrationDate: new Date().toISOString(),
                permissions: ['submit_complaints', 'track_complaints', 'receive_updates']
            };

            this.users.push(newUser);
            this.saveUsers();

            this.hideLoading('registration-form');
            this.showSuccess(`Registration successful! Your User ID is: ${userId}`);

            // Auto-login after registration
            setTimeout(() => {
                this.loginUser(newUser);
            }, 2000);
        }, 2000);
    }

    handleUserLogin() {
        const loginId = document.getElementById('user-login-id').value.trim();
        const password = document.getElementById('user-login-password').value;

        if (!loginId || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.showLoading('user-login-form');

        // Simulate login process
        setTimeout(() => {
            // Find user by email or mobile
            const user = this.users.find(u => 
                (u.email === loginId || u.mobile === loginId) && 
                u.password === password &&
                u.role === 'user'
            );

            if (user) {
                this.hideLoading('user-login-form');
                this.showSuccess('Login successful!');
                
                // Login the user
                setTimeout(() => {
                    this.loginUser(user);
                }, 1500);
            } else {
                this.hideLoading('user-login-form');
                this.showError('Invalid email/mobile or password');
            }
        }, 1500);
    }

    handleGuestAccess() {
        // Create temporary guest user
        const guestUser = {
            id: 'guest_' + Date.now(),
            role: 'guest',
            name: 'Guest User',
            permissions: ['submit_complaints', 'ai_chat'],
            isGuest: true
        };

        this.currentUser = guestUser;
        localStorage.setItem('iala_user', JSON.stringify(guestUser));
        localStorage.setItem('iala_session_data', JSON.stringify({
            created: new Date().toISOString(),
            sessionId: 'guest_session_' + Date.now()
        }));
        
        // Redirect to main app with guest access
        window.location.href = 'index.html?access=guest';
    }

    handleAIChatAccess() {
        // Direct access to AI chat
        window.location.href = 'ai-module.html?access=direct';
    }

    updateRoleSpecificFields(role) {
        const departmentGroup = document.getElementById('department-group');
        const areaGroup = document.getElementById('area-group');
        const roleDescription = document.getElementById('role-description');

        // Hide all role-specific fields first
        departmentGroup.style.display = 'none';
        areaGroup.style.display = 'none';

        // Show appropriate fields and descriptions based on role
        switch (role) {
            case 'admin':
                roleDescription.innerHTML = `
                    <div class="role-desc">
                        <strong>Administrator Role:</strong> Full system access including user management, 
                        system configuration, and all complaint oversight capabilities.
                    </div>
                `;
                break;
            case 'officer-manager':
                departmentGroup.style.display = 'block';
                document.getElementById('mgmt-department').required = true;
                roleDescription.innerHTML = `
                    <div class="role-desc">
                        <strong>Officer Manager Role:</strong> Department-level oversight with ability to 
                        assign complaints, manage field managers, and generate reports.
                    </div>
                `;
                break;
            case 'field-manager':
                departmentGroup.style.display = 'block';
                areaGroup.style.display = 'block';
                document.getElementById('mgmt-department').required = true;
                document.getElementById('mgmt-area').required = true;
                roleDescription.innerHTML = `
                    <div class="role-desc">
                        <strong>Field Manager Role:</strong> Area-specific complaint management with 
                        ability to update status, upload proof, and coordinate field operations.
                    </div>
                `;
                break;
            default:
                roleDescription.innerHTML = '';
                document.getElementById('mgmt-department').required = false;
                document.getElementById('mgmt-area').required = false;
        }
    }

    async handleManagementSignup() {
        const role = document.getElementById('management-role-select').value;
        const name = document.getElementById('mgmt-name').value.trim();
        const employeeId = document.getElementById('mgmt-employee-id').value.trim();
        const email = document.getElementById('mgmt-email').value.trim();
        const mobile = document.getElementById('mgmt-mobile').value.trim();
        const department = document.getElementById('mgmt-department').value;
        const area = document.getElementById('mgmt-area').value;
        const justification = document.getElementById('mgmt-justification').value.trim();
        const supervisor = document.getElementById('mgmt-supervisor').value.trim();
        const password = document.getElementById('mgmt-password').value;
        const confirmPassword = document.getElementById('mgmt-confirm-password').value;
        const termsAccepted = document.getElementById('mgmt-terms').checked;

        // Validation
        if (!role || !name || !employeeId || !email || !mobile || !justification || !supervisor || !password || !confirmPassword) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (!termsAccepted) {
            this.showError('Please accept the terms and conditions');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            this.showError('Password must be at least 8 characters');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!this.validateMobile(mobile)) {
            this.showError('Please enter a valid mobile number');
            return;
        }

        if (!this.validateEmployeeId(employeeId)) {
            this.showError('Please enter a valid IALA employee ID');
            return;
        }

        // Role-specific validation
        if ((role === 'officer-manager' || role === 'field-manager') && !department) {
            this.showError('Please select a department');
            return;
        }

        if (role === 'field-manager' && !area) {
            this.showError('Please select an area of responsibility');
            return;
        }

        // Check if employee ID already exists
        if (this.isEmployeeIdExists(employeeId)) {
            this.showError('Employee ID already exists in the system');
            return;
        }

        this.showLoading('management-signup-form');

        // Simulate signup process
        setTimeout(() => {
            try {
                const signupRequest = {
                    id: this.generateManagementUserId(role),
                    employeeId: employeeId,
                    role: role,
                    name: name,
                    email: email,
                    mobile: mobile,
                    department: department || null,
                    area: area || null,
                    justification: justification,
                    supervisor: supervisor,
                    password: password,
                    status: 'pending_approval',
                    requestDate: new Date().toISOString(),
                    approvedBy: null,
                    approvalDate: null,
                    isActive: false
                };

                // Save signup request
                this.savePendingSignupRequest(signupRequest);

                // Send notification to administrators
                this.notifyAdministrators(signupRequest);

                this.hideLoading('management-signup-form');
                this.showSuccess(`
                    Signup request submitted successfully! 
                    Request ID: ${signupRequest.id}
                    
                    Your account will be activated once approved by an administrator. 
                    You will receive an email notification upon approval.
                `);

                // Clear form
                document.getElementById('management-signup-form').reset();
                this.updateRoleSpecificFields('');

                // Redirect to login after delay
                setTimeout(() => {
                    this.showScreen('login-screen');
                }, 3000);

            } catch (error) {
                this.hideLoading('management-signup-form');
                this.showError('Signup request failed. Please try again.');
                console.error('Management signup error:', error);
            }
        }, 2000);
    }

    validateEmployeeId(employeeId) {
        // IALA employee ID format: IALA followed by 6 digits
        const employeeIdRegex = /^IALA\d{6}$/i;
        return employeeIdRegex.test(employeeId);
    }

    isEmployeeIdExists(employeeId) {
        const existingUsers = this.users;
        const pendingRequests = this.getPendingSignupRequests();
        
        return existingUsers.some(user => user.employeeId === employeeId) ||
               pendingRequests.some(request => request.employeeId === employeeId);
    }

    generateManagementUserId(role) {
        const rolePrefix = {
            'admin': 'ADM',
            'officer-manager': 'OFC',
            'field-manager': 'FLD'
        };
        
        const prefix = rolePrefix[role] || 'MGT';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        return `${prefix}${timestamp}${random}`;
    }

    savePendingSignupRequest(request) {
        const pendingRequests = this.getPendingSignupRequests();
        pendingRequests.push(request);
        localStorage.setItem('infra_pending_signups', JSON.stringify(pendingRequests));
        
        // Also save to audit trail
        this.addToAuditTrail({
            action: 'management_signup_request',
            userId: request.id,
            details: {
                role: request.role,
                employeeId: request.employeeId,
                name: request.name,
                email: request.email
            },
            timestamp: new Date().toISOString()
        });
    }

    getPendingSignupRequests() {
        const saved = localStorage.getItem('iala_pending_signups');
        return saved ? JSON.parse(saved) : [];
    }

    notifyAdministrators(signupRequest) {
        // In a real system, this would send email notifications
        // For now, we'll add to a notification queue that admins can check
        const notifications = this.getAdminNotifications();
        
        notifications.push({
            id: 'signup_' + Date.now(),
            type: 'management_signup_request',
            title: 'New Management Account Request',
            message: `${signupRequest.name} has requested ${signupRequest.role} access`,
            data: signupRequest,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high'
        });
        
        localStorage.setItem('iala_admin_notifications', JSON.stringify(notifications));
    }

    getAdminNotifications() {
        const saved = localStorage.getItem('iala_admin_notifications');
        return saved ? JSON.parse(saved) : [];
    }

    addToAuditTrail(entry) {
        const auditTrail = this.getAuditTrail();
        auditTrail.push(entry);
        
        // Keep only last 1000 entries
        if (auditTrail.length > 1000) {
            auditTrail.splice(0, auditTrail.length - 1000);
        }
        
        localStorage.setItem('iala_audit_trail', JSON.stringify(auditTrail));
    }

    getAuditTrail() {
        const saved = localStorage.getItem('iala_audit_trail');
        return saved ? JSON.parse(saved) : [];
    }

    // Admin approval methods
    approveSignupRequest(requestId, approvingAdminId) {
        if (!this.hasPermission('manage_users')) {
            this.showError('Access denied: Only administrators can approve signup requests');
            return false;
        }

        const pendingRequests = this.getPendingSignupRequests();
        const requestIndex = pendingRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            this.showError('Signup request not found');
            return false;
        }

        const request = pendingRequests[requestIndex];
        
        // Create approved user account
        const approvedUser = {
            id: request.id,
            employeeId: request.employeeId,
            password: request.password,
            role: request.role,
            name: request.name,
            email: request.email,
            mobile: request.mobile,
            department: request.department,
            area: request.area,
            supervisor: request.supervisor,
            status: 'approved',
            isActive: true,
            approvedBy: approvingAdminId,
            approvalDate: new Date().toISOString(),
            requestDate: request.requestDate,
            permissions: this.getPermissionsForRole(request.role)
        };

        // Add to users list
        this.users.push(approvedUser);
        this.saveUsers();

        // Remove from pending requests
        pendingRequests.splice(requestIndex, 1);
        localStorage.setItem('infra_pending_signups', JSON.stringify(pendingRequests));

        // Add to audit trail
        this.addToAuditTrail({
            action: 'management_signup_approved',
            userId: request.id,
            adminId: approvingAdminId,
            details: {
                role: request.role,
                employeeId: request.employeeId,
                name: request.name
            },
            timestamp: new Date().toISOString()
        });

        // Send approval notification (in real system, this would be email)
        this.sendApprovalNotification(approvedUser);

        return approvedUser;
    }

    rejectSignupRequest(requestId, rejectionReason, rejectingAdminId) {
        if (!this.hasPermission('manage_users')) {
            this.showError('Access denied: Only administrators can reject signup requests');
            return false;
        }

        const pendingRequests = this.getPendingSignupRequests();
        const requestIndex = pendingRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            this.showError('Signup request not found');
            return false;
        }

        const request = pendingRequests[requestIndex];
        
        // Update request status
        request.status = 'rejected';
        request.rejectionReason = rejectionReason;
        request.rejectedBy = rejectingAdminId;
        request.rejectionDate = new Date().toISOString();

        // Move to rejected requests archive
        const rejectedRequests = this.getRejectedSignupRequests();
        rejectedRequests.push(request);
        localStorage.setItem('iala_rejected_signups', JSON.stringify(rejectedRequests));

        // Remove from pending requests
        pendingRequests.splice(requestIndex, 1);
        localStorage.setItem('iala_pending_signups', JSON.stringify(pendingRequests));

        // Add to audit trail
        this.addToAuditTrail({
            action: 'management_signup_rejected',
            userId: request.id,
            adminId: rejectingAdminId,
            details: {
                role: request.role,
                employeeId: request.employeeId,
                name: request.name,
                reason: rejectionReason
            },
            timestamp: new Date().toISOString()
        });

        // Send rejection notification
        this.sendRejectionNotification(request);

        return true;
    }

    getRejectedSignupRequests() {
        const saved = localStorage.getItem('infra_rejected_signups');
        return saved ? JSON.parse(saved) : [];
    }

    getPermissionsForRole(role) {
        const rolePermissions = {
            'admin': [
                'all', 'manage_users', 'manage_roles', 'system_config',
                'view_all_complaints', 'assign_complaints', 'escalate_complaints',
                'generate_reports', 'bulk_operations', 'manage_categories', 'manage_workflows'
            ],
            'officer-manager': [
                'view_all_complaints', 'assign_complaints', 'reassign_complaints',
                'escalate_complaints', 'manage_field_managers', 'generate_reports',
                'bulk_operations', 'view_analytics', 'manage_priorities', 'approve_resolutions'
            ],
            'field-manager': [
                'view_assigned_complaints', 'update_complaint_status', 'upload_proof',
                'add_progress_notes', 'request_escalation', 'view_area_complaints',
                'mark_resolved', 'update_location'
            ]
        };

        return rolePermissions[role] || [];
    }

    sendApprovalNotification(user) {
        // In a real system, this would send an email
        console.log(`Approval notification sent to ${user.email}`);
        
        // Add to user notifications
        const notifications = this.getUserNotifications(user.id);
        notifications.push({
            id: 'approval_' + Date.now(),
            type: 'account_approved',
            title: 'Account Approved',
            message: `Your ${user.role} account has been approved and activated. You can now log in to the system.`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        localStorage.setItem(`iala_user_notifications_${user.id}`, JSON.stringify(notifications));
    }

    sendRejectionNotification(request) {
        // In a real system, this would send an email
        console.log(`Rejection notification sent to ${request.email}`);
        
        // For demo purposes, we'll just log it
        console.log(`Signup request rejected for ${request.name} (${request.employeeId}): ${request.rejectionReason}`);
    }

    getUserNotifications(userId) {
        const saved = localStorage.getItem(`infra_user_notifications_${userId}`);
        return saved ? JSON.parse(saved) : [];
    }

    // Public API for admin dashboard integration
    getPendingSignupRequestsForAdmin() {
        if (!this.hasPermission('manage_users')) {
            return [];
        }
        return this.getPendingSignupRequests();
    }

    getSignupRequestById(requestId) {
        if (!this.hasPermission('manage_users')) {
            return null;
        }
        
        const pendingRequests = this.getPendingSignupRequests();
        return pendingRequests.find(req => req.id === requestId);
    }

    clearAllSessions() {
        // Clear all session data (for testing purposes)
        localStorage.clear();
        sessionStorage.clear();
        this.currentUser = null;
        this.sessions.clear();
        
        this.showSuccess('All sessions cleared! You can now start fresh.');
        
        // Reload the page to start fresh
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    // Public API for integration
    getCurrentUser() {
        return this.currentUser;
    }

    showRegistrationScreen() {
        this.showScreen('registration-screen');
    }

    checkExistingSession() {
        const sessionId = localStorage.getItem('iala_session');
        const userData = localStorage.getItem('iala_user');

        if (sessionId && userData) {
            try {
                const user = JSON.parse(userData);
                const session = this.sessions.get(sessionId);

                if (session && this.isSessionValid(session)) {
                    this.currentUser = user;
                    this.redirectToRoleDashboard(user.role);
                    return;
                }
            } catch (error) {
                console.error('Error checking session:', error);
            }
        }

        // Clear invalid session
        this.clearSession();
    }

    isSessionValid(session) {
        const now = new Date();
        const lastActivity = new Date(session.lastActivity);
        const sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours

        return (now - lastActivity) < sessionTimeout;
    }

    clearSession() {
        localStorage.removeItem('iala_session');
        localStorage.removeItem('iala_user');
        localStorage.removeItem('iala_session_data');
        this.currentUser = null;
    }

    // Utility methods
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUserId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `USER${timestamp}${random}`;
    }

    generateNameForRole(role, userId) {
        const roleNames = {
            'admin': 'System Administrator',
            'officer-manager': 'Officer Manager',
            'field-manager': 'Field Manager',
            'employee': 'Field Employee',
            'user': 'Registered User'
        };
        
        const baseName = roleNames[role] || 'User';
        return `${baseName} (${userId})`;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateMobile(mobile) {
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile.replace(/\D/g, ''));
    }

    showScreen(screenId) {
        document.querySelectorAll('.auth-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        // Hide citizen access section when showing user access screens
        const citizenAccessSection = document.querySelector('.citizen-access-section');
        if (citizenAccessSection) {
            if (screenId === 'user-access-screen' || screenId === 'registration-screen' || screenId === 'user-login-screen') {
                citizenAccessSection.style.display = 'none';
            } else if (screenId === 'login-screen') {
                citizenAccessSection.style.display = 'block';
            } else if (screenId === 'welcome-screen') {
                citizenAccessSection.style.display = 'none';
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.error-message, .success-message').forEach(msg => {
            msg.remove();
        });

        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.textContent = message;

        const activeScreen = document.querySelector('.auth-screen.active');
        const form = activeScreen.querySelector('.auth-form') || activeScreen.querySelector('.access-options');
        
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    showLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('.btn-primary');
        
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
    }

    hideLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('.btn-primary');
        
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    loadUsers() {
        const saved = localStorage.getItem('iala_users');
        return saved ? JSON.parse(saved) : [];
    }

    saveUsers() {
        localStorage.setItem('iala_users', JSON.stringify(this.users));
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Load role permissions
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
            ],
            'user': [
                'submit_complaints', 'track_own_complaints', 'receive_updates',
                'view_complaint_history', 'update_profile', 'ai_chat_access'
            ]
        };

        const userPermissions = rolePermissions[this.currentUser.role] || [];
        
        // Admin has all permissions
        if (userPermissions.includes('all')) return true;
        
        return userPermissions.includes(permission);
    }

    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    logout() {
        this.clearSession();
        this.sessions.clear();
        window.location.href = 'auth-system.html';
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.iala_auth = new IALAAuthSystem();
});

// Export for use by other modules
window.IALAAuthSystem = IALAAuthSystem;