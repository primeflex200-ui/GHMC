// Officer Manager Dashboard JavaScript
class OfficerManagerDashboard {
    constructor() {
        this.currentUser = null;
        this.allComplaints = [];
        this.filteredComplaints = [];
        this.selectedComplaints = new Set();
        this.fieldManagers = [];
        this.selectedComplaint = null;
        this.tags = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadComplaints();
        this.loadFieldManagers();
        this.updateStats();
    }

    loadUserData() {
        if (!window.rolePermissions) {
            console.error('Role permissions not loaded');
            return;
        }

        this.currentUser = window.rolePermissions.getCurrentUser();
        
        if (!this.currentUser || this.currentUser.role !== 'officer-manager') {
            window.location.href = 'auth-system.html';
            return;
        }

        // Update UI with user info
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-department').textContent = `Department: ${this.currentUser.department || 'General Services'}`;
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (window.rolePermissions) {
                window.rolePermissions.logout();
            }
        });

        // Quick actions
        document.getElementById('assign-complaints').addEventListener('click', () => {
            this.showBulkAssignmentDialog();
        });

        document.getElementById('monitor-progress').addEventListener('click', () => {
            this.scrollToComplaints();
        });

        document.getElementById('manage-teams').addEventListener('click', () => {
            this.showTeamManagement();
        });

        document.getElementById('escalate-issues').addEventListener('click', () => {
            this.showEscalationDialog();
        });

        document.getElementById('generate-reports').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('bulk-operations').addEventListener('click', () => {
            this.showBulkOperationsDialog();
        });

        // Filters
        document.getElementById('department-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('priority-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('refresh-complaints').addEventListener('click', () => {
            this.loadComplaints();
        });

        // Table selection
        document.getElementById('select-all').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Bulk actions
        document.getElementById('apply-bulk-action').addEventListener('click', () => {
            this.applyBulkAction();
        });

        document.getElementById('clear-selection').addEventListener('click', () => {
            this.clearSelection();
        });

        // Performance period filter
        document.getElementById('performance-period').addEventListener('change', () => {
            this.updatePerformanceData();
        });

        // Assignment modal
        document.getElementById('close-assignment-modal').addEventListener('click', () => {
            this.closeAssignmentModal();
        });

        document.getElementById('cancel-assignment').addEventListener('click', () => {
            this.closeAssignmentModal();
        });

        document.getElementById('submit-assignment').addEventListener('click', () => {
            this.submitAssignment();
        });

        // Tags input
        document.getElementById('tags-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });
    }

    async loadComplaints() {
        try {
            // Get all complaints that this officer can manage
            const allComplaints = this.getAllComplaints();
            
            // Filter by department if specified
            this.allComplaints = allComplaints.filter(complaint => {
                if (!this.currentUser.department || this.currentUser.department === 'General Services') {
                    return true; // General Services can see all
                }
                return complaint.department === this.currentUser.department;
            });

            // Add demo complaints if none exist
            if (this.allComplaints.length === 0) {
                this.allComplaints = this.generateDemoComplaints();
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
                id: 'GHMC2024201',
                category: 'street-light',
                description: 'Multiple street lights not working in residential area',
                location: 'Banjara Hills, Road No. 15-20',
                priority: 'high',
                status: 'submitted',
                department: 'electrical',
                submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                tags: {
                    category: ['street-light'],
                    priority: ['high'],
                    location: ['banjara-hills'],
                    urgency: ['high']
                }
            },
            {
                id: 'GHMC2024202',
                category: 'pothole',
                description: 'Dangerous pothole causing accidents',
                location: 'Jubilee Hills Main Road',
                priority: 'critical',
                status: 'assigned',
                department: 'road-maintenance',
                assignedTo: 'field001',
                assignedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                tags: {
                    category: ['pothole'],
                    priority: ['critical'],
                    location: ['jubilee-hills'],
                    urgency: ['critical']
                }
            },
            {
                id: 'GHMC2024203',
                category: 'garbage',
                description: 'Garbage collection missed for multiple days',
                location: 'Madhapur IT Corridor',
                priority: 'medium',
                status: 'in-progress',
                department: 'waste-management',
                assignedTo: 'field002',
                assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
                startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                tags: {
                    category: ['garbage'],
                    priority: ['medium'],
                    location: ['madhapur']
                }
            },
            {
                id: 'GHMC2024204',
                category: 'water-supply',
                description: 'No water supply for 2 days in apartment complex',
                location: 'Gachibowli Financial District',
                priority: 'high',
                status: 'escalated',
                department: 'water-supply',
                assignedTo: 'field003',
                escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
                tags: {
                    category: ['water-supply'],
                    priority: ['high'],
                    location: ['gachibowli'],
                    urgency: ['high']
                }
            },
            {
                id: 'GHMC2024205',
                category: 'drainage',
                description: 'Blocked drainage causing waterlogging',
                location: 'Kondapur Main Road',
                priority: 'medium',
                status: 'resolved',
                department: 'drainage',
                assignedTo: 'field004',
                completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
                tags: {
                    category: ['drainage'],
                    priority: ['medium'],
                    location: ['kondapur']
                }
            }
        ];

        return demoComplaints;
    }

    loadFieldManagers() {
        // Load field managers from user system
        const users = this.getUsers();
        this.fieldManagers = users.filter(user => 
            user.role === 'field-manager' && 
            user.isActive !== false
        );

        // Add demo field managers if none exist
        if (this.fieldManagers.length === 0) {
            this.fieldManagers = [
                {
                    id: 'field001',
                    name: 'Rajesh Kumar',
                    area: 'Banjara Hills',
                    department: 'electrical',
                    workload: 3
                },
                {
                    id: 'field002',
                    name: 'Priya Sharma',
                    area: 'Jubilee Hills',
                    department: 'road-maintenance',
                    workload: 2
                },
                {
                    id: 'field003',
                    name: 'Mohammed Ali',
                    area: 'Madhapur',
                    department: 'waste-management',
                    workload: 4
                },
                {
                    id: 'field004',
                    name: 'Lakshmi Reddy',
                    area: 'Gachibowli',
                    department: 'water-supply',
                    workload: 1
                }
            ];
        }

        this.populateFieldManagerSelect();
        this.updatePerformanceData();
    }

    populateFieldManagerSelect() {
        const select = document.getElementById('field-manager-select');
        select.innerHTML = '<option value="">Choose Field Manager</option>' +
            this.fieldManagers.map(manager => 
                `<option value="${manager.id}">${manager.name} - ${manager.area} (${manager.department})</option>`
            ).join('');
    }

    applyFilters() {
        const departmentFilter = document.getElementById('department-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredComplaints = this.allComplaints.filter(complaint => {
            const departmentMatch = !departmentFilter || complaint.department === departmentFilter;
            const priorityMatch = !priorityFilter || complaint.priority === priorityFilter;
            const statusMatch = !statusFilter || complaint.status === statusFilter;
            return departmentMatch && priorityMatch && statusMatch;
        });

        this.renderComplaintsTable();
        this.updateSelectionUI();
    }

    renderComplaintsTable() {
        const tbody = document.getElementById('complaints-table-body');
        
        if (this.filteredComplaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <h3>No complaints found</h3>
                        <p>No complaints match the current filters</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredComplaints.map(complaint => `
            <tr>
                <td>
                    <input type="checkbox" class="complaint-checkbox" value="${complaint.id}" 
                           onchange="officerDashboard.toggleComplaintSelection('${complaint.id}', this.checked)">
                </td>
                <td onclick="officerDashboard.showComplaintDetails('${complaint.id}')" style="cursor: pointer;">
                    ${complaint.id}
                </td>
                <td>${this.getCategoryDisplayName(complaint.category)}</td>
                <td><span class="complaint-priority priority-${complaint.priority}">${this.formatPriority(complaint.priority)}</span></td>
                <td><span class="complaint-status status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span></td>
                <td>${this.getAssignedManagerName(complaint.assignedTo) || 'Unassigned'}</td>
                <td>${complaint.location}</td>
                <td>${this.getComplaintAge(complaint.submittedAt)}</td>
                <td>
                    <button class="action-btn" onclick="officerDashboard.assignComplaint('${complaint.id}')">Assign</button>
                    <button class="action-btn" onclick="officerDashboard.showComplaintDetails('${complaint.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const totalComplaints = this.allComplaints.length;
        const pendingAssignment = this.allComplaints.filter(c => c.status === 'submitted').length;
        const escalatedCount = this.allComplaints.filter(c => c.status === 'escalated').length;

        document.getElementById('total-complaints').textContent = totalComplaints;
        document.getElementById('pending-assignment').textContent = pendingAssignment;
        document.getElementById('escalated-count').textContent = escalatedCount;
    }

    updatePerformanceData() {
        const period = document.getElementById('performance-period').value;
        const performanceGrid = document.getElementById('performance-grid');

        const performanceData = this.fieldManagers.map(manager => {
            const managerComplaints = this.allComplaints.filter(c => c.assignedTo === manager.id);
            const resolved = managerComplaints.filter(c => c.status === 'resolved').length;
            const inProgress = managerComplaints.filter(c => c.status === 'in-progress').length;
            const assigned = managerComplaints.filter(c => c.status === 'assigned').length;

            return {
                ...manager,
                resolved,
                inProgress,
                assigned,
                total: managerComplaints.length
            };
        });

        performanceGrid.innerHTML = performanceData.map(manager => `
            <div class="performance-card">
                <div class="performance-header">
                    <div>
                        <div class="manager-name">${manager.name}</div>
                        <div class="manager-area">${manager.area} - ${manager.department}</div>
                    </div>
                </div>
                <div class="performance-stats">
                    <div class="performance-stat">
                        <div class="stat-number">${manager.total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="performance-stat">
                        <div class="stat-number">${manager.resolved}</div>
                        <div class="stat-label">Resolved</div>
                    </div>
                    <div class="performance-stat">
                        <div class="stat-number">${manager.inProgress}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="performance-stat">
                        <div class="stat-number">${manager.assigned}</div>
                        <div class="stat-label">Assigned</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleComplaintSelection(complaintId, isSelected) {
        if (isSelected) {
            this.selectedComplaints.add(complaintId);
        } else {
            this.selectedComplaints.delete(complaintId);
        }
        this.updateSelectionUI();
    }

    toggleSelectAll(selectAll) {
        const checkboxes = document.querySelectorAll('.complaint-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            this.toggleComplaintSelection(checkbox.value, selectAll);
        });
    }

    updateSelectionUI() {
        const selectedCount = this.selectedComplaints.size;
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const selectedCountSpan = document.getElementById('selected-count');

        if (selectedCount > 0) {
            bulkActionsBar.style.display = 'flex';
            selectedCountSpan.textContent = selectedCount;
        } else {
            bulkActionsBar.style.display = 'none';
        }

        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        const totalVisible = this.filteredComplaints.length;
        selectAllCheckbox.checked = selectedCount === totalVisible && totalVisible > 0;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalVisible;
    }

    clearSelection() {
        this.selectedComplaints.clear();
        document.querySelectorAll('.complaint-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelectionUI();
    }

    assignComplaint(complaintId) {
        const complaint = this.allComplaints.find(c => c.id === complaintId);
        if (!complaint) return;

        this.selectedComplaint = complaint;
        this.populateAssignmentModal(complaint);
        document.getElementById('assignment-modal').classList.add('active');
    }

    populateAssignmentModal(complaint) {
        const details = document.getElementById('assignment-complaint-details');
        details.innerHTML = `
            <div class="complaint-detail">
                <h4>${complaint.id} - ${this.getCategoryDisplayName(complaint.category)}</h4>
                <p><strong>Location:</strong> ${complaint.location}</p>
                <p><strong>Description:</strong> ${complaint.description}</p>
                <p><strong>Current Status:</strong> <span class="complaint-status status-${complaint.status}">${this.getStatusDisplayName(complaint.status)}</span></p>
                <p><strong>Submitted:</strong> ${this.formatDateTime(complaint.submittedAt)}</p>
            </div>
        `;

        // Reset form
        document.getElementById('assignment-form').reset();
        document.getElementById('priority-select').value = complaint.priority || 'medium';
        
        // Set default completion time (24 hours from now)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('expected-completion').value = tomorrow.toISOString().slice(0, 16);

        // Clear tags
        this.tags = [];
        this.updateTagsDisplay();
    }

    addTag() {
        const input = document.getElementById('tags-input');
        const tag = input.value.trim();
        
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
            input.value = '';
            this.updateTagsDisplay();
        }
    }

    updateTagsDisplay() {
        const tagsList = document.getElementById('tags-list');
        tagsList.innerHTML = this.tags.map(tag => `
            <span class="tag">
                ${tag}
                <button type="button" class="tag-remove" onclick="officerDashboard.removeTag('${tag}')">&times;</button>
            </span>
        `).join('');
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.updateTagsDisplay();
    }

    async submitAssignment() {
        if (!this.selectedComplaint) return;

        const fieldManagerId = document.getElementById('field-manager-select').value;
        const priority = document.getElementById('priority-select').value;
        const expectedCompletion = document.getElementById('expected-completion').value;
        const assignmentNotes = document.getElementById('assignment-notes').value;

        if (!fieldManagerId) {
            this.showError('Please select a field manager');
            return;
        }

        // Validate permissions
        if (!window.rolePermissions.hasPermission('assign_complaints')) {
            this.showError('You do not have permission to assign complaints');
            return;
        }

        this.showLoading('submit-assignment');

        try {
            // Update complaint
            this.selectedComplaint.status = 'assigned';
            this.selectedComplaint.assignedTo = fieldManagerId;
            this.selectedComplaint.assignedBy = this.currentUser.id;
            this.selectedComplaint.assignedAt = new Date().toISOString();
            this.selectedComplaint.priority = priority;
            
            if (expectedCompletion) {
                this.selectedComplaint.expectedCompletion = expectedCompletion;
            }

            if (assignmentNotes) {
                if (!this.selectedComplaint.notes) this.selectedComplaint.notes = [];
                this.selectedComplaint.notes.push({
                    text: assignmentNotes,
                    addedBy: this.currentUser.name,
                    addedAt: new Date().toISOString(),
                    type: 'assignment'
                });
            }

            // Add tags
            if (this.tags.length > 0) {
                if (!this.selectedComplaint.tags) this.selectedComplaint.tags = {};
                if (!this.selectedComplaint.tags.custom) this.selectedComplaint.tags.custom = [];
                this.selectedComplaint.tags.custom = [...new Set([...this.selectedComplaint.tags.custom, ...this.tags])];
            }

            // Auto-tag the complaint
            if (window.rolePermissions) {
                window.rolePermissions.autoTagComplaint(this.selectedComplaint);
            }

            // Save complaint
            this.saveComplaint(this.selectedComplaint);

            // Update field manager workload
            const manager = this.fieldManagers.find(m => m.id === fieldManagerId);
            if (manager) {
                manager.workload = (manager.workload || 0) + 1;
            }

            // Simulate API call delay
            setTimeout(() => {
                this.hideLoading('submit-assignment');
                this.closeAssignmentModal();
                this.showSuccess(`Complaint ${this.selectedComplaint.id} assigned to ${this.getAssignedManagerName(fieldManagerId)}`);
                
                // Refresh data
                this.loadComplaints();
                this.updatePerformanceData();
            }, 1500);

        } catch (error) {
            this.hideLoading('submit-assignment');
            console.error('Error assigning complaint:', error);
            this.showError('Failed to assign complaint');
        }
    }

    closeAssignmentModal() {
        document.getElementById('assignment-modal').classList.remove('active');
        this.selectedComplaint = null;
        this.tags = [];
    }

    applyBulkAction() {
        const action = document.getElementById('bulk-action-select').value;
        const selectedIds = Array.from(this.selectedComplaints);

        if (!action || selectedIds.length === 0) {
            this.showError('Please select an action and complaints');
            return;
        }

        switch (action) {
            case 'assign':
                this.showBulkAssignmentDialog();
                break;
            case 'change-priority':
                this.showBulkPriorityDialog();
                break;
            case 'escalate':
                this.bulkEscalate(selectedIds);
                break;
            case 'export':
                this.exportSelectedComplaints(selectedIds);
                break;
        }
    }

    showBulkAssignmentDialog() {
        // For demo, assign to first available field manager
        if (this.fieldManagers.length === 0) {
            this.showError('No field managers available');
            return;
        }

        const selectedIds = Array.from(this.selectedComplaints);
        const manager = this.fieldManagers[0];
        
        if (confirm(`Assign ${selectedIds.length} complaints to ${manager.name}?`)) {
            this.bulkAssignToManager(selectedIds, manager.id);
        }
    }

    bulkAssignToManager(complaintIds, managerId) {
        complaintIds.forEach(id => {
            const complaint = this.allComplaints.find(c => c.id === id);
            if (complaint) {
                complaint.status = 'assigned';
                complaint.assignedTo = managerId;
                complaint.assignedBy = this.currentUser.id;
                complaint.assignedAt = new Date().toISOString();
                this.saveComplaint(complaint);
            }
        });

        this.showSuccess(`${complaintIds.length} complaints assigned successfully`);
        this.clearSelection();
        this.loadComplaints();
    }

    exportSelectedComplaints(complaintIds) {
        const selectedComplaints = this.allComplaints.filter(c => complaintIds.includes(c.id));
        const csvContent = this.generateCSV(selectedComplaints);
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected-complaints-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showSuccess(`${selectedComplaints.length} complaints exported`);
    }

    generateCSV(complaints) {
        const headers = [
            'Complaint ID', 'Category', 'Priority', 'Status', 'Location', 
            'Assigned To', 'Submitted At', 'Description'
        ];

        const rows = complaints.map(complaint => [
            complaint.id,
            this.getCategoryDisplayName(complaint.category),
            this.formatPriority(complaint.priority),
            this.getStatusDisplayName(complaint.status),
            complaint.location,
            this.getAssignedManagerName(complaint.assignedTo) || 'Unassigned',
            this.formatDateTime(complaint.submittedAt),
            `"${complaint.description.replace(/"/g, '""')}"`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateReport() {
        const reportData = {
            totalComplaints: this.allComplaints.length,
            byStatus: {},
            byPriority: {},
            byDepartment: {},
            avgResolutionTime: 0,
            generatedAt: new Date().toISOString(),
            generatedBy: this.currentUser.name
        };

        // Calculate statistics
        this.allComplaints.forEach(complaint => {
            // By status
            reportData.byStatus[complaint.status] = (reportData.byStatus[complaint.status] || 0) + 1;
            
            // By priority
            reportData.byPriority[complaint.priority] = (reportData.byPriority[complaint.priority] || 0) + 1;
            
            // By department
            reportData.byDepartment[complaint.department] = (reportData.byDepartment[complaint.department] || 0) + 1;
        });

        // Generate and download report
        const reportContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([reportContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghmc-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showSuccess('Report generated and downloaded');
    }

    // Utility methods (similar to field dashboard)
    getAllComplaints() {
        const saved = localStorage.getItem('ghmc_complaints');
        return saved ? JSON.parse(saved) : [];
    }

    getUsers() {
        const saved = localStorage.getItem('ghmc_users');
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
        return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
    }

    getAssignedManagerName(managerId) {
        if (!managerId) return null;
        const manager = this.fieldManagers.find(m => m.id === managerId);
        return manager ? manager.name : managerId;
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

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    scrollToComplaints() {
        document.querySelector('.complaints-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    showComplaintDetails(complaintId) {
        // For now, just show assignment modal
        this.assignComplaint(complaintId);
    }

    showTeamManagement() {
        this.showInfo('Team Management', 'Team management features are coming soon. You will be able to view and manage field manager performance and assignments.');
    }

    showEscalationDialog() {
        this.showInfo('Escalation', 'Escalation features are coming soon. You will be able to escalate critical complaints to administrators.');
    }

    showBulkOperationsDialog() {
        this.showInfo('Bulk Operations', 'Use the table selection and bulk actions bar below to perform operations on multiple complaints at once.');
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
    window.officerDashboard = new OfficerManagerDashboard();
});