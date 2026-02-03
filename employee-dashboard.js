// Employee Dashboard JavaScript
class EmployeeDashboard {
    constructor() {
        this.currentUser = null;
        this.assignedTasks = [];
        this.filteredTasks = [];
        this.selectedTask = null;
        this.proofFiles = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadAssignedTasks();
        this.updateStats();
    }

    loadUserData() {
        if (!window.rolePermissions) {
            console.error('Role permissions not loaded');
            return;
        }

        this.currentUser = window.rolePermissions.getCurrentUser();
        
        if (!this.currentUser || this.currentUser.role !== 'employee') {
            window.location.href = 'auth-system.html';
            return;
        }

        // Update UI with user info
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-id').textContent = `ID: ${this.currentUser.id}`;
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (window.rolePermissions) {
                window.rolePermissions.logout();
            }
        });

        // Filters
        document.getElementById('status-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('priority-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('refresh-tasks').addEventListener('click', () => {
            this.loadAssignedTasks();
        });

        // Modal controls
        document.getElementById('close-task-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancel-task-update').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('update-task').addEventListener('click', () => {
            this.updateTaskStatus();
        });

        // Status change handler
        document.getElementById('task-status-update').addEventListener('change', (e) => {
            this.handleStatusChange(e.target.value);
        });

        // File upload handler
        document.getElementById('completion-proof').addEventListener('change', (e) => {
            this.handleProofUpload(e);
        });

        // Form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTaskStatus();
        });
    }

    async loadAssignedTasks() {
        try {
            // Get tasks assigned to this employee
            const allComplaints = this.getAllComplaints();
            
            this.assignedTasks = allComplaints.filter(complaint => 
                complaint.assignedTo === this.currentUser.id ||
                (complaint.employeeAssigned && complaint.employeeAssigned === this.currentUser.id)
            );

            // Add demo tasks if none exist
            if (this.assignedTasks.length === 0) {
                this.assignedTasks = this.generateDemoTasks();
            }

            // Convert complaints to tasks format
            this.assignedTasks = this.assignedTasks.map(task => ({
                ...task,
                taskStatus: task.taskStatus || this.mapComplaintStatusToTaskStatus(task.status),
                assignedAt: task.assignedAt || task.submittedAt,
                taskType: task.category
            }));

            this.applyFilters();
            this.updateStats();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to load assigned tasks');
        }
    }

    generateDemoTasks() {
        return [
            {
                id: 'GHMC2024401',
                category: 'street-light',
                description: 'Replace faulty street light bulb on Road No. 12',
                location: 'Road No. 12, Banjara Hills, Near Bus Stop',
                priority: 'high',
                status: 'assigned',
                taskStatus: 'not-started',
                assignedTo: this.currentUser.id,
                employeeAssigned: this.currentUser.id,
                assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                taskType: 'street-light',
                estimatedDuration: '2 hours',
                requiredTools: ['Ladder', 'LED Bulb', 'Screwdriver'],
                instructions: 'Replace the faulty LED bulb with new one. Ensure proper connection and test functionality.'
            },
            {
                id: 'GHMC2024402',
                category: 'pothole',
                description: 'Fill pothole on main road causing traffic issues',
                location: 'Jubilee Hills Main Road, Near Traffic Signal',
                priority: 'critical',
                status: 'assigned',
                taskStatus: 'in-progress',
                assignedTo: this.currentUser.id,
                employeeAssigned: this.currentUser.id,
                assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
                startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                taskType: 'pothole',
                estimatedDuration: '4 hours',
                requiredTools: ['Asphalt Mix', 'Compactor', 'Safety Cones'],
                instructions: 'Clean the pothole area, apply asphalt mix, and compact properly. Ensure road safety during work.'
            },
            {
                id: 'GHMC2024403',
                category: 'garbage',
                description: 'Clear accumulated garbage from residential area',
                location: 'Madhapur Colony, Block A, Main Gate Area',
                priority: 'medium',
                status: 'resolved',
                taskStatus: 'completed',
                assignedTo: this.currentUser.id,
                employeeAssigned: this.currentUser.id,
                assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                taskType: 'garbage',
                estimatedDuration: '3 hours',
                requiredTools: ['Garbage Truck', 'Cleaning Equipment', 'Safety Gear'],
                instructions: 'Collect all accumulated garbage, clean the area thoroughly, and dispose at designated facility.',
                completionNotes: 'Area cleaned successfully. All garbage collected and disposed properly.',
                completionProof: ['proof1.jpg', 'proof2.jpg']
            },
            {
                id: 'GHMC2024404',
                category: 'drainage',
                description: 'Clear blocked drainage system',
                location: 'Gachibowli Financial District, Sector 2',
                priority: 'high',
                status: 'assigned',
                taskStatus: 'not-started',
                assignedTo: this.currentUser.id,
                employeeAssigned: this.currentUser.id,
                assignedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                taskType: 'drainage',
                estimatedDuration: '5 hours',
                requiredTools: ['Drainage Rod', 'High Pressure Cleaner', 'Safety Equipment'],
                instructions: 'Clear blockage from drainage system. Check for structural damage and report if found.'
            }
        ];
    }

    mapComplaintStatusToTaskStatus(complaintStatus) {
        const statusMap = {
            'submitted': 'not-started',
            'assigned': 'not-started',
            'in-progress': 'in-progress',
            'resolved': 'completed',
            'pending-verification': 'completed'
        };
        return statusMap[complaintStatus] || 'not-started';
    }

    applyFilters() {
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;

        this.filteredTasks = this.assignedTasks.filter(task => {
            const statusMatch = !statusFilter || task.taskStatus === statusFilter;
            const priorityMatch = !priorityFilter || task.priority === priorityFilter;
            return statusMatch && priorityMatch;
        });

        this.renderTasks();
    }

    renderTasks() {
        const container = document.getElementById('tasks-list');
        
        if (this.filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-tasks">
                    <div class="empty-icon">📋</div>
                    <h3>No tasks found</h3>
                    <p>No tasks match the current filters or you have no assigned tasks.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredTasks.map(task => `
            <div class="task-item" onclick="employeeDashboard.showTaskDetails('${task.id}')">
                <div class="task-header">
                    <div class="task-id">${task.id}</div>
                    <span class="task-priority priority-${task.priority}">${this.formatPriority(task.priority)}</span>
                </div>
                
                <div class="task-meta">
                    <span>${this.getCategoryDisplayName(task.category)}</span>
                    <span>Assigned: ${this.getTimeAgo(task.assignedAt)}</span>
                    ${task.estimatedDuration ? `<span>Duration: ${task.estimatedDuration}</span>` : ''}
                </div>
                
                <div class="task-description">${task.description}</div>
                
                <div class="task-location">${task.location}</div>
                
                <div class="task-footer">
                    <span class="task-status ${task.taskStatus}">${this.getTaskStatusDisplayName(task.taskStatus)}</span>
                    <span class="task-assigned-time">${this.formatDateTime(task.assignedAt)}</span>
                </div>
                
                <div class="task-progress">
                    <div class="task-progress-fill ${task.taskStatus}"></div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const notStarted = this.assignedTasks.filter(t => t.taskStatus === 'not-started').length;
        const inProgress = this.assignedTasks.filter(t => t.taskStatus === 'in-progress').length;
        const completed = this.assignedTasks.filter(t => t.taskStatus === 'completed').length;

        document.getElementById('assigned-tasks').textContent = this.assignedTasks.length;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('not-started-count').textContent = notStarted;
        document.getElementById('in-progress-count').textContent = inProgress;
        document.getElementById('completed-count').textContent = completed;
    }

    showTaskDetails(taskId) {
        const task = this.assignedTasks.find(t => t.id === taskId);
        if (!task) return;

        this.selectedTask = task;
        this.populateTaskModal(task);
        document.getElementById('task-modal').classList.add('active');
    }

    populateTaskModal(task) {
        const details = document.getElementById('task-details');
        details.innerHTML = `
            <h4>${task.id} - ${this.getCategoryDisplayName(task.category)}</h4>
            
            <div class="task-detail-row">
                <span class="task-detail-label">Priority:</span>
                <span class="task-detail-value">
                    <span class="task-priority priority-${task.priority}">${this.formatPriority(task.priority)}</span>
                </span>
            </div>
            
            <div class="task-detail-row">
                <span class="task-detail-label">Current Status:</span>
                <span class="task-detail-value">
                    <span class="task-status ${task.taskStatus}">${this.getTaskStatusDisplayName(task.taskStatus)}</span>
                </span>
            </div>
            
            <div class="task-detail-row">
                <span class="task-detail-label">Estimated Duration:</span>
                <span class="task-detail-value">${task.estimatedDuration || 'Not specified'}</span>
            </div>
            
            <div class="task-detail-row">
                <span class="task-detail-label">Assigned:</span>
                <span class="task-detail-value">${this.formatDateTime(task.assignedAt)}</span>
            </div>
            
            ${task.startedAt ? `
                <div class="task-detail-row">
                    <span class="task-detail-label">Started:</span>
                    <span class="task-detail-value">${this.formatDateTime(task.startedAt)}</span>
                </div>
            ` : ''}
            
            ${task.completedAt ? `
                <div class="task-detail-row">
                    <span class="task-detail-label">Completed:</span>
                    <span class="task-detail-value">${this.formatDateTime(task.completedAt)}</span>
                </div>
            ` : ''}
            
            <div class="task-description-full">
                <strong>Task Description:</strong><br>
                ${task.description}
            </div>
            
            <div class="task-description-full">
                <strong>Location:</strong><br>
                ${task.location}
            </div>
            
            ${task.instructions ? `
                <div class="task-description-full">
                    <strong>Instructions:</strong><br>
                    ${task.instructions}
                </div>
            ` : ''}
            
            ${task.requiredTools ? `
                <div class="task-description-full">
                    <strong>Required Tools:</strong><br>
                    ${task.requiredTools.join(', ')}
                </div>
            ` : ''}
            
            ${task.completionNotes ? `
                <div class="task-description-full">
                    <strong>Previous Notes:</strong><br>
                    ${task.completionNotes}
                </div>
            ` : ''}
        `;

        // Reset form
        document.getElementById('task-form').reset();
        document.getElementById('task-status-update').value = task.taskStatus;
        this.proofFiles = [];
        document.getElementById('proof-preview').innerHTML = '';
        
        // Show/hide conditional fields
        this.handleStatusChange(task.taskStatus);
    }

    handleStatusChange(status) {
        const completionProofGroup = document.getElementById('completion-proof-group');
        const completionRemarksGroup = document.getElementById('completion-remarks-group');
        const taskForm = document.getElementById('task-form');
        
        if (status === 'completed') {
            completionProofGroup.style.display = 'block';
            completionRemarksGroup.style.display = 'block';
            taskForm.classList.add('completed');
        } else {
            completionProofGroup.style.display = 'none';
            completionRemarksGroup.style.display = 'none';
            taskForm.classList.remove('completed');
        }
    }

    handleProofUpload(event) {
        const files = Array.from(event.target.files);
        const preview = document.getElementById('proof-preview');
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.proofFiles.push(file);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const proofDiv = document.createElement('div');
                    proofDiv.className = 'proof-image';
                    proofDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Completion proof">
                        <button type="button" class="remove-proof" onclick="employeeDashboard.removeProof(${this.proofFiles.length - 1})">&times;</button>
                    `;
                    preview.appendChild(proofDiv);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Clear the input
        event.target.value = '';
    }

    removeProof(index) {
        this.proofFiles.splice(index, 1);
        this.refreshProofPreview();
    }

    refreshProofPreview() {
        const preview = document.getElementById('proof-preview');
        preview.innerHTML = '';
        
        this.proofFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const proofDiv = document.createElement('div');
                proofDiv.className = 'proof-image';
                proofDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Completion proof">
                    <button type="button" class="remove-proof" onclick="employeeDashboard.removeProof(${index})">&times;</button>
                `;
                preview.appendChild(proofDiv);
            };
            reader.readAsDataURL(file);
        });
    }

    async updateTaskStatus() {
        if (!this.selectedTask) return;

        const newStatus = document.getElementById('task-status-update').value;
        const workNotes = document.getElementById('work-notes').value;
        const completionRemarks = document.getElementById('completion-remarks').value;

        if (!newStatus) {
            this.showError('Please select a status');
            return;
        }

        // Validate completion requirements
        if (newStatus === 'completed') {
            if (!completionRemarks.trim()) {
                this.showError('Please add completion remarks');
                return;
            }
            if (this.proofFiles.length === 0) {
                this.showError('Please upload at least one completion proof image');
                return;
            }
        }

        this.showLoading('update-task');

        try {
            // Update task
            this.selectedTask.taskStatus = newStatus;
            this.selectedTask.updatedAt = new Date().toISOString();
            this.selectedTask.updatedBy = this.currentUser.id;
            
            if (workNotes) {
                if (!this.selectedTask.workNotes) this.selectedTask.workNotes = [];
                this.selectedTask.workNotes.push({
                    text: workNotes,
                    addedBy: this.currentUser.name,
                    addedAt: new Date().toISOString()
                });
            }

            if (newStatus === 'in-progress' && !this.selectedTask.startedAt) {
                this.selectedTask.startedAt = new Date().toISOString();
            }

            if (newStatus === 'completed') {
                this.selectedTask.completedAt = new Date().toISOString();
                this.selectedTask.completedBy = this.currentUser.id;
                this.selectedTask.completionRemarks = completionRemarks;
                
                // Process proof files
                if (this.proofFiles.length > 0) {
                    this.selectedTask.completionProof = [];
                    for (let file of this.proofFiles) {
                        const proofData = await this.processProofFile(file);
                        this.selectedTask.completionProof.push(proofData);
                    }
                }
                
                // Update complaint status to match task completion
                this.selectedTask.status = 'pending-verification';
            }

            // Save task
            this.saveTask(this.selectedTask);

            // Simulate API call delay
            setTimeout(() => {
                this.hideLoading('update-task');
                this.closeTaskModal();
                this.showSuccess(`Task ${this.selectedTask.id} status updated to ${this.getTaskStatusDisplayName(newStatus)}`);
                
                // Refresh data
                this.loadAssignedTasks();
            }, 1500);

        } catch (error) {
            this.hideLoading('update-task');
            console.error('Error updating task:', error);
            this.showError('Failed to update task status');
        }
    }

    async processProofFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    uploadedBy: this.currentUser.name,
                    uploadedAt: new Date().toISOString()
                });
            };
            reader.readAsDataURL(file);
        });
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        this.selectedTask = null;
        this.proofFiles = [];
    }

    // Data Management
    getAllComplaints() {
        const saved = localStorage.getItem('ghmc_complaints');
        return saved ? JSON.parse(saved) : [];
    }

    saveTask(task) {
        const complaints = this.getAllComplaints();
        const index = complaints.findIndex(c => c.id === task.id);
        
        if (index > -1) {
            complaints[index] = task;
        } else {
            complaints.push(task);
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

    getTaskStatusDisplayName(status) {
        const statusNames = {
            'not-started': 'Not Started',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statusNames[status] || status;
    }

    formatPriority(priority) {
        return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    // UI Feedback
    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
            button.textContent = 'Updating...';
        }
    }

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
            button.textContent = 'Update Task';
        }
    }

    showSuccess(message) {
        this.showNotification('Success', message, 'success');
    }

    showError(message) {
        this.showNotification('Error', message, 'error');
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
    window.employeeDashboard = new EmployeeDashboard();
});