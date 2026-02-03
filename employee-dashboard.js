// Employee Dashboard JavaScript
class EmployeeDashboard {
    constructor() {
        this.currentUser = null;
        this.complaints = [];
        this.fieldManagers = [];
        this.currentComplaintId = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.loadComplaints();
        this.loadFieldManagers();
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
            if (this.currentUser.role !== 'employee') {
                alert('Access denied. This dashboard is for employees only.');
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
            document.getElementById('user-name').textContent = this.currentUser.name || 'Employee';
        }
    }

    loadComplaints() {
        // Load complaints from localStorage or generate demo data
        const savedComplaints = localStorage.getItem('iala_complaints');
        if (savedComplaints) {
            this.complaints = JSON.parse(savedComplaints);
        } else {
            this.generateDemoComplaints();
        }
        
        this.renderComplaints();
        this.updateStats();
    }

    generateDemoComplaints() {
        const categories = ['street-light', 'pothole', 'garbage', 'water-supply', 'drainage', 'cctv'];
        const locations = [
            'Road No. 12, Banjara Hills',
            'Jubilee Hills Main Road',
            'Gachibowli Circle',
            'Madhapur Junction',
            'Kondapur Cross Roads',
            'Kukatpally Housing Board'
        ];
        const statuses = ['new', 'assigned', 'in-progress', 'completed'];

        this.complaints = [];
        for (let i = 1; i <= 15; i++) {
            const complaint = {
                id: `IALA2024${String(i).padStart(3, '0')}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                description: `Sample complaint description for ${categories[Math.floor(Math.random() * categories.length)]} issue`,
                submittedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                assignedTo: Math.random() > 0.5 ? `field00${Math.floor(Math.random() * 3) + 1}` : null,
                assignedBy: Math.random() > 0.5 ? this.currentUser.id : null,
                priority: ['normal', 'high', 'urgent'][Math.floor(Math.random() * 3)],
                citizenName: `Citizen ${i}`,
                citizenPhone: `98765${String(i).padStart(5, '0')}`,
                image: null,
                notes: []
            };
            this.complaints.push(complaint);
        }
        
        this.saveComplaints();
    }

    loadFieldManagers() {
        // Load field managers from localStorage or generate demo data
        const savedManagers = localStorage.getItem('iala_field_managers');
        if (savedManagers) {
            this.fieldManagers = JSON.parse(savedManagers);
        } else {
            this.fieldManagers = [
                {
                    id: 'field001',
                    name: 'Rajesh Kumar',
                    department: 'Road Maintenance',
                    area: 'Banjara Hills',
                    phone: '9876543210',
                    email: 'rajesh@iala.gov.in',
                    activeComplaints: 3
                },
                {
                    id: 'field002',
                    name: 'Priya Sharma',
                    department: 'Electrical',
                    area: 'Jubilee Hills',
                    phone: '9876543211',
                    email: 'priya@iala.gov.in',
                    activeComplaints: 2
                },
                {
                    id: 'field003',
                    name: 'Suresh Reddy',
                    department: 'Water Supply',
                    area: 'Gachibowli',
                    phone: '9876543212',
                    email: 'suresh@iala.gov.in',
                    activeComplaints: 4
                }
            ];
            localStorage.setItem('infra_field_managers', JSON.stringify(this.fieldManagers));
        }
        
        this.populateFieldManagerSelect();
    }

    populateFieldManagerSelect() {
        const select = document.getElementById('field-manager-select');
        select.innerHTML = '<option value="">Choose Field Manager</option>';
        
        this.fieldManagers.forEach(manager => {
            const option = document.createElement('option');
            option.value = manager.id;
            option.textContent = `${manager.name} (${manager.department} - ${manager.area})`;
            select.appendChild(option);
        });
    }

    renderComplaints() {
        const tbody = document.getElementById('complaints-tbody');
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        let filteredComplaints = this.complaints;
        
        if (statusFilter !== 'all') {
            filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredComplaints = filteredComplaints.filter(c => c.category === categoryFilter);
        }
        
        tbody.innerHTML = '';
        
        filteredComplaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${complaint.id}</strong></td>
                <td>${this.getCategoryName(complaint.category)}</td>
                <td>${complaint.location}</td>
                <td>${this.formatDate(complaint.submittedDate)}</td>
                <td><span class="status-badge ${complaint.status}">${this.getStatusName(complaint.status)}</span></td>
                <td>${complaint.assignedTo ? this.getFieldManagerName(complaint.assignedTo) : 'Not Assigned'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="employeeDashboard.viewComplaint('${complaint.id}')">View</button>
                        ${complaint.status === 'new' ? 
                            `<button class="btn-sm btn-primary" onclick="employeeDashboard.showAssignmentModal('${complaint.id}')">Assign</button>` : 
                            ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateStats() {
        const totalComplaints = this.complaints.length;
        const pendingComplaints = this.complaints.filter(c => c.status === 'new').length;
        const assignedComplaints = this.complaints.filter(c => c.status === 'assigned' || c.status === 'in-progress').length;
        const completedToday = this.complaints.filter(c => {
            const today = new Date().toDateString();
            const complaintDate = new Date(c.submittedDate).toDateString();
            return c.status === 'completed' && complaintDate === today;
        }).length;

        document.getElementById('total-complaints').textContent = totalComplaints;
        document.getElementById('pending-complaints').textContent = pendingComplaints;
        document.getElementById('assigned-complaints').textContent = assignedComplaints;
        document.getElementById('completed-complaints').textContent = completedToday;
    }

    showAssignmentModal(complaintId) {
        this.currentComplaintId = complaintId;
        const complaint = this.complaints.find(c => c.id === complaintId);
        
        if (!complaint) return;
        
        // Populate complaint details
        const detailsDiv = document.getElementById('assignment-complaint-details');
        detailsDiv.innerHTML = `
            <h4>Complaint: ${complaint.id}</h4>
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span>${this.getCategoryName(complaint.category)}</span>
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
                <span>${complaint.citizenName} (${complaint.citizenPhone})</span>
            </div>
            <p><strong>Description:</strong> ${complaint.description}</p>
        `;
        
        // Reset form
        document.getElementById('field-manager-select').value = '';
        document.getElementById('priority-select').value = 'normal';
        document.getElementById('assignment-notes').value = '';
        
        // Show modal
        document.getElementById('assignment-modal').style.display = 'block';
    }

    assignComplaint() {
        const fieldManagerId = document.getElementById('field-manager-select').value;
        const priority = document.getElementById('priority-select').value;
        const notes = document.getElementById('assignment-notes').value;
        
        if (!fieldManagerId) {
            alert('Please select a field manager');
            return;
        }
        
        const complaint = this.complaints.find(c => c.id === this.currentComplaintId);
        if (!complaint) return;
        
        // Update complaint
        complaint.status = 'assigned';
        complaint.assignedTo = fieldManagerId;
        complaint.assignedBy = this.currentUser.id;
        complaint.assignedDate = new Date().toISOString();
        complaint.priority = priority;
        complaint.assignmentNotes = notes;
        
        // Add to complaint notes
        complaint.notes.push({
            timestamp: new Date().toISOString(),
            author: this.currentUser.name,
            type: 'assignment',
            content: `Assigned to ${this.getFieldManagerName(fieldManagerId)} with ${priority} priority. Notes: ${notes || 'None'}`
        });
        
        // Update field manager's active complaints count
        const fieldManager = this.fieldManagers.find(fm => fm.id === fieldManagerId);
        if (fieldManager) {
            fieldManager.activeComplaints = (fieldManager.activeComplaints || 0) + 1;
            localStorage.setItem('iala_field_managers', JSON.stringify(this.fieldManagers));
        }
        
        this.saveComplaints();
        this.renderComplaints();
        this.updateStats();
        this.closeModal('assignment-modal');
        
        alert(`Complaint ${this.currentComplaintId} has been assigned to ${this.getFieldManagerName(fieldManagerId)}`);
    }

    viewComplaint(complaintId) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (!complaint) return;
        
        const content = document.getElementById('complaint-details-content');
        content.innerHTML = `
            <div class="complaint-details">
                <h4>Complaint Details: ${complaint.id}</h4>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span>${this.getCategoryName(complaint.category)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge ${complaint.status}">${this.getStatusName(complaint.status)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Priority:</span>
                    <span>${complaint.priority || 'Normal'}</span>
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
                    <span>${complaint.citizenName} (${complaint.citizenPhone})</span>
                </div>
                ${complaint.assignedTo ? `
                <div class="detail-row">
                    <span class="detail-label">Assigned To:</span>
                    <span>${this.getFieldManagerName(complaint.assignedTo)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Assigned Date:</span>
                    <span>${this.formatDate(complaint.assignedDate)}</span>
                </div>
                ` : ''}
                <p><strong>Description:</strong></p>
                <p>${complaint.description}</p>
                ${complaint.assignmentNotes ? `
                <p><strong>Assignment Notes:</strong></p>
                <p>${complaint.assignmentNotes}</p>
                ` : ''}
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
            'new': 'New',
            'assigned': 'Assigned',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statuses[status] || status;
    }

    getFieldManagerName(fieldManagerId) {
        const manager = this.fieldManagers.find(fm => fm.id === fieldManagerId);
        return manager ? manager.name : fieldManagerId;
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

    saveComplaints() {
        localStorage.setItem('iala_complaints', JSON.stringify(this.complaints));
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Global functions
function filterComplaints() {
    employeeDashboard.renderComplaints();
}

function loadComplaints() {
    employeeDashboard.loadComplaints();
}

// Global logout function - multiple approaches for compatibility
function logoutUser() {
    console.log('Logout function called'); // Debug log
    
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
            
            console.log('Session data cleared, redirecting to login');
            
            // Force redirect to login page
            window.location.replace('auth-system.html');
            
        } catch (error) {
            console.error('Error during logout:', error);
            // Force redirect even if there's an error
            alert('Logging out...');
            window.location.href = 'auth-system.html';
        }
    }
}

// Alternative logout function for better compatibility
function handleLogout() {
    console.log('Handle logout called');
    logoutUser();
}

// Direct logout without confirmation (for testing)
function forceLogout() {
    console.log('Force logout called');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'auth-system.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize dashboard
let employeeDashboard;
document.addEventListener('DOMContentLoaded', () => {
    employeeDashboard = new EmployeeDashboard();
    
    // Ensure logout functions are globally accessible
    window.logoutUser = logoutUser;
    window.handleLogout = handleLogout;
    window.forceLogout = forceLogout;
    
    console.log('Employee dashboard loaded, logout functions available:', {
        logoutUser: typeof window.logoutUser,
        handleLogout: typeof window.handleLogout,
        forceLogout: typeof window.forceLogout
    });
    
    // Add event listener as backup
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout button clicked via event listener');
            handleLogout();
        });
        console.log('Event listener added to logout button');
    }
});