// Field Manager Dashboard JavaScript
class FieldManagerDashboard {
    constructor() {
        this.currentUser = null;
        this.workAssignments = [];
        this.currentWorkId = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.loadWorkAssignments();
        this.updateStats();
        this.setupEventListeners();
        
        // Add page reload handler to maintain dashboard state
        window.addEventListener('beforeunload', () => {
            if (this.currentUser && this.currentUser.role === 'field-manager') {
                localStorage.setItem('field_manager_session', JSON.stringify({
                    user: this.currentUser,
                    timestamp: Date.now()
                }));
            }
        });
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
            if (this.currentUser.role !== 'field-manager') {
                alert('Access denied. This dashboard is for field managers only.');
                window.location.href = 'auth-system.html';
                return;
            }
            
            // Store current page for reload persistence
            localStorage.setItem('current_dashboard', 'field-dashboard.html');
            
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'auth-system.html';
        }
    }

    loadUserData() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name || 'Field Manager';
            document.getElementById('user-area').textContent = `Area: ${this.currentUser.area || 'Not Assigned'}`;
        }
    }

    loadWorkAssignments() {
        // Always generate fresh demo data for field manager dashboard
        this.generateDemoWork();
        this.renderWork();
        this.updateStats();
    }

    generateDemoWork() {
        // SAMPLE DATA FOR DEMO PURPOSES ONLY - Always generate fresh data
        // Summary: 3 total, 2 not started, 1 in progress, 1 completed today
        
        this.workAssignments = [
            // Work 1: Not Started
            {
                id: 'IALA-001',
                category: 'street-light',
                location: 'Kukatpally',
                description: 'Street light not working on main road',
                assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                status: 'assigned',
                priority: 'high',
                assignedTo: this.currentUser.id,
                assignedBy: 'emp001',
                citizenName: 'Rajesh Kumar',
                citizenPhone: '9876543210',
                progressNotes: [],
                completionDate: null,
                completionTime: null,
                completionImage: null
            },
            // Work 2: Not Started
            {
                id: 'IALA-004',
                category: 'drainage',
                location: 'Kondapur',
                description: 'Blocked drainage causing water logging',
                assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                status: 'assigned',
                priority: 'urgent',
                assignedTo: this.currentUser.id,
                assignedBy: 'emp001',
                citizenName: 'Priya Sharma',
                citizenPhone: '9876543211',
                progressNotes: [],
                completionDate: null,
                completionTime: null,
                completionImage: null
            },
            // Work 3: In Progress
            {
                id: 'IALA-002',
                category: 'pothole',
                location: 'Madhapur',
                description: 'Large pothole on tech city road',
                assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                status: 'in-progress',
                priority: 'high',
                assignedTo: this.currentUser.id,
                assignedBy: 'emp001',
                citizenName: 'Suresh Reddy',
                citizenPhone: '9876543212',
                progressNotes: [
                    {
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        author: this.currentUser.name || 'Field Manager',
                        content: 'Started road repair work. Materials arranged.',
                        statusChange: 'assigned → in-progress'
                    }
                ],
                completionDate: null,
                completionTime: null,
                completionImage: null
            },
            // Work 4: Completed Today
            {
                id: 'IALA-003',
                category: 'garbage',
                location: 'Gachibowli',
                description: 'Garbage collection point overflow',
                assignedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
                status: 'completed',
                priority: 'high',
                assignedTo: this.currentUser.id,
                assignedBy: 'emp001',
                citizenName: 'Anita Devi',
                citizenPhone: '9876543213',
                progressNotes: [
                    {
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        author: this.currentUser.name || 'Field Manager',
                        content: 'Started cleaning and waste removal.',
                        statusChange: 'assigned → in-progress'
                    },
                    {
                        timestamp: new Date().toISOString(),
                        author: this.currentUser.name || 'Field Manager',
                        content: 'Garbage collection completed. Area cleaned.',
                        statusChange: 'in-progress → completed'
                    }
                ],
                completionDate: new Date().toISOString().split('T')[0], // Today
                completionTime: '14:30',
                completionImage: {
                    name: 'garbage_cleanup_completed.jpg',
                    size: 1024 * 750,
                    type: 'image/jpeg',
                    lastModified: Date.now()
                }
            }
        ];
        
        // Don't save to localStorage - keep as demo data only
        console.log('Generated demo work assignments:', this.workAssignments.length);
    }

    renderWork() {
        const tbody = document.getElementById('work-tbody');
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        
        let filteredWork = this.workAssignments;
        
        if (statusFilter !== 'all') {
            filteredWork = filteredWork.filter(w => w.status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
            filteredWork = filteredWork.filter(w => w.priority === priorityFilter);
        }
        
        tbody.innerHTML = '';
        
        filteredWork.forEach(work => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${work.id}</strong></td>
                <td>${this.getCategoryName(work.category)}</td>
                <td>${work.location}</td>
                <td><span class="priority-badge ${work.priority}">${this.getPriorityName(work.priority)}</span></td>
                <td>${this.formatDate(work.assignedDate)}</td>
                <td><span class="status-badge ${work.status}">${this.getStatusName(work.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="fieldDashboard.viewWork('${work.id}')">View</button>
                        ${work.status !== 'completed' ? 
                            `<button class="btn-sm btn-primary" onclick="fieldDashboard.showProgressModal('${work.id}')">Update</button>` : 
                            ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateStats() {
        // SAMPLE DATA STATS - matches the demo work assignments
        const assignedWork = this.workAssignments.length; // Total: 3
        const notStarted = this.workAssignments.filter(w => w.status === 'assigned').length; // 2
        const inProgress = this.workAssignments.filter(w => w.status === 'in-progress').length; // 1
        const completedToday = this.workAssignments.filter(w => {
            if (w.status !== 'completed' || !w.completionDate) return false;
            const today = new Date().toDateString();
            const completionDate = new Date(w.completionDate).toDateString();
            return completionDate === today;
        }).length; // 1 (completed today)

        document.getElementById('assigned-work').textContent = assignedWork;
        document.getElementById('not-started').textContent = notStarted;
        document.getElementById('in-progress').textContent = inProgress;
        document.getElementById('completed-today').textContent = completedToday;
    }

    showProgressModal(workId) {
        this.currentWorkId = workId;
        const work = this.workAssignments.find(w => w.id === workId);
        
        if (!work) return;
        
        // Populate work details
        const detailsDiv = document.getElementById('progress-work-details');
        detailsDiv.innerHTML = `
            <h4>Work: ${work.id}</h4>
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span>${this.getCategoryName(work.category)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${work.location}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="priority-badge ${work.priority}">${this.getPriorityName(work.priority)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Assigned:</span>
                <span>${this.formatDate(work.assignedDate)}</span>
            </div>
            <p><strong>Description:</strong> ${work.description}</p>
        `;
        
        // Set current status
        document.getElementById('progress-status').value = work.status;
        document.getElementById('progress-notes').value = '';
        
        // Set completion fields if already completed
        if (work.status === 'completed') {
            document.getElementById('completion-date').value = work.completionDate || '';
            document.getElementById('completion-time').value = work.completionTime || '';
            this.toggleCompletionFields();
        } else {
            // Set default completion date/time to now
            const now = new Date();
            document.getElementById('completion-date').value = now.toISOString().split('T')[0];
            document.getElementById('completion-time').value = now.toTimeString().slice(0, 5);
        }
        
        // Show modal
        document.getElementById('progress-modal').style.display = 'block';
    }

    toggleCompletionFields() {
        const status = document.getElementById('progress-status').value;
        const completionFields = document.getElementById('completion-fields');
        
        if (status === 'completed') {
            completionFields.style.display = 'block';
            // Make fields required
            document.getElementById('completion-date').required = true;
            document.getElementById('completion-time').required = true;
            document.getElementById('completion-image').required = true;
        } else {
            completionFields.style.display = 'none';
            // Remove required attribute
            document.getElementById('completion-date').required = false;
            document.getElementById('completion-time').required = false;
            document.getElementById('completion-image').required = false;
        }
    }

    updateProgress() {
        const status = document.getElementById('progress-status').value;
        const notes = document.getElementById('progress-notes').value;
        
        const work = this.workAssignments.find(w => w.id === this.currentWorkId);
        if (!work) return;
        
        // Validate completion fields if status is completed
        if (status === 'completed') {
            const completionDate = document.getElementById('completion-date').value;
            const completionTime = document.getElementById('completion-time').value;
            const completionImage = document.getElementById('completion-image').files[0];
            
            if (!completionDate || !completionTime || !completionImage) {
                alert('Please fill in all completion fields including uploading an image');
                return;
            }
            
            // Store completion data
            work.completionDate = completionDate;
            work.completionTime = completionTime;
            work.completionImage = {
                name: completionImage.name,
                size: completionImage.size,
                type: completionImage.type,
                lastModified: completionImage.lastModified
            };
        }
        
        // Update work status
        const oldStatus = work.status;
        work.status = status;
        work.lastUpdated = new Date().toISOString();
        
        // Add progress note
        if (notes.trim()) {
            work.progressNotes = work.progressNotes || [];
            work.progressNotes.push({
                timestamp: new Date().toISOString(),
                author: this.currentUser.name,
                content: notes,
                statusChange: oldStatus !== status ? `${oldStatus} → ${status}` : null
            });
        }
        
        // If completed, submit to Officer Manager
        if (status === 'completed') {
            this.submitToOfficerManager(work);
        }
        
        this.saveWork();
        this.renderWork();
        this.updateStats();
        this.closeModal('progress-modal');
        
        const statusMessage = status === 'completed' ? 
            'Work marked as completed and submitted to Officer Manager for verification' :
            `Work status updated to ${this.getStatusName(status)}`;
        
        alert(statusMessage);
    }

    submitToOfficerManager(work) {
        // Create submission record for Officer Manager
        const submissions = JSON.parse(localStorage.getItem('iala_officer_submissions') || '[]');
        
        const submission = {
            id: work.id,
            workId: work.id,
            submittedBy: this.currentUser.id,
            submittedByName: this.currentUser.name,
            submissionDate: new Date().toISOString(),
            category: work.category,
            location: work.location,
            description: work.description,
            completionDate: work.completionDate,
            completionTime: work.completionTime,
            completionImage: work.completionImage,
            progressNotes: work.progressNotes,
            status: 'pending_verification',
            verificationStatus: null,
            verifiedBy: null,
            verificationDate: null,
            verificationNotes: null
        };
        
        submissions.push(submission);
        localStorage.setItem('iala_officer_submissions', JSON.stringify(submissions));
        
        // Update the original complaint status in the main complaints list
        const allComplaints = JSON.parse(localStorage.getItem('iala_complaints') || '[]');
        const complaintIndex = allComplaints.findIndex(c => c.id === work.id);
        if (complaintIndex !== -1) {
            allComplaints[complaintIndex] = { ...work };
            localStorage.setItem('iala_complaints', JSON.stringify(allComplaints));
        }
    }

    viewWork(workId) {
        const work = this.workAssignments.find(w => w.id === workId);
        if (!work) return;
        
        const content = document.getElementById('work-details-content');
        content.innerHTML = `
            <div class="work-details">
                <h4>Work Details: ${work.id}</h4>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span>${this.getCategoryName(work.category)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge ${work.status}">${this.getStatusName(work.status)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Priority:</span>
                    <span class="priority-badge ${work.priority}">${this.getPriorityName(work.priority)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${work.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Assigned Date:</span>
                    <span>${this.formatDate(work.assignedDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Citizen:</span>
                    <span>${work.citizenName} (${work.citizenPhone})</span>
                </div>
                ${work.completionDate ? `
                <div class="detail-row">
                    <span class="detail-label">Completed:</span>
                    <span>${work.completionDate} at ${work.completionTime}</span>
                </div>
                ` : ''}
                <p><strong>Description:</strong></p>
                <p>${work.description}</p>
                ${work.assignmentNotes ? `
                <p><strong>Assignment Notes:</strong></p>
                <p>${work.assignmentNotes}</p>
                ` : ''}
            </div>
            
            ${work.progressNotes && work.progressNotes.length > 0 ? `
            <div style="margin-top: 1rem;">
                <h4>Progress Log:</h4>
                ${work.progressNotes.map(note => `
                    <div style="background: #f8f9fa; padding: 0.75rem; margin: 0.5rem 0; border-radius: 4px; border-left: 3px solid #333;">
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">
                            ${this.formatDate(note.timestamp)} - ${note.author}
                            ${note.statusChange ? `<span style="color: #28a745; font-weight: 500;"> (${note.statusChange})</span>` : ''}
                        </div>
                        <div>${note.content}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${work.completionImage ? `
            <div style="margin-top: 1rem;">
                <h4>Completion Evidence:</h4>
                <p><strong>Image:</strong> ${work.completionImage.name} (${(work.completionImage.size / 1024).toFixed(1)} KB)</p>
            </div>
            ` : ''}
        `;
        
        document.getElementById('details-modal').style.display = 'block';
    }

    setupEventListeners() {
        // Modal close events
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };
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
            'assigned': 'Not Started',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statuses[status] || status;
    }

    getPriorityName(priority) {
        const priorities = {
            'normal': 'Normal',
            'high': 'High',
            'urgent': 'Urgent'
        };
        return priorities[priority] || priority;
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

    saveWork() {
        // Update the main complaints list with our work assignments
        const allComplaints = JSON.parse(localStorage.getItem('iala_complaints') || '[]');
        
        this.workAssignments.forEach(work => {
            const index = allComplaints.findIndex(c => c.id === work.id);
            if (index !== -1) {
                allComplaints[index] = { ...work };
            }
        });
        
        localStorage.setItem('iala_complaints', JSON.stringify(allComplaints));
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Global functions
function filterWork() {
    fieldDashboard.renderWork();
}

function loadWork() {
    fieldDashboard.loadWorkAssignments();
}

function toggleCompletionFields() {
    fieldDashboard.toggleCompletionFields();
}

function updateProgress() {
    fieldDashboard.updateProgress();
}

// Global logout function - multiple approaches for compatibility
function logoutUser() {
    console.log('Field Manager logout function called'); // Debug log
    
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
            
            console.log('Field Manager session data cleared, redirecting to login');
            
            // Force redirect to login page
            window.location.replace('auth-system.html');
            
        } catch (error) {
            console.error('Error during Field Manager logout:', error);
            // Force redirect even if there's an error
            alert('Logging out...');
            window.location.href = 'auth-system.html';
        }
    }
}

// Force logout without confirmation
function forceLogout() {
    console.log('Field Manager force logout called');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'auth-system.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize dashboard
let fieldDashboard;
document.addEventListener('DOMContentLoaded', () => {
    fieldDashboard = new FieldManagerDashboard();
    
    // Ensure logout functions are globally accessible
    window.logoutUser = logoutUser;
    window.forceLogout = forceLogout;
    
    console.log('Field Manager dashboard loaded, logout functions available:', {
        logoutUser: typeof window.logoutUser,
        forceLogout: typeof window.forceLogout
    });
});