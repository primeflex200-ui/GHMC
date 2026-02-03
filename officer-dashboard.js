// Officer Manager Dashboard JavaScript
class OfficerManagerDashboard {
    constructor() {
        this.currentUser = null;
        this.submissions = [];
        this.currentSubmissionId = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.loadSubmissions();
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
            if (this.currentUser.role !== 'officer-manager') {
                alert('Access denied. This dashboard is for officer managers only.');
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
            document.getElementById('user-name').textContent = this.currentUser.name || 'Officer Manager';
            document.getElementById('user-department').textContent = `Department: ${this.currentUser.department || 'Not Assigned'}`;
        }
    }

    loadSubmissions() {
        // Load submissions from localStorage or generate demo data
        const savedSubmissions = localStorage.getItem('iala_officer_submissions');
        if (savedSubmissions) {
            this.submissions = JSON.parse(savedSubmissions);
        } else {
            this.generateDemoSubmissions();
        }
        
        this.renderSubmissions();
        this.updateStats();
    }

    generateDemoSubmissions() {
        const categories = ['street-light', 'pothole', 'garbage', 'water-supply', 'drainage', 'cctv'];
        const locations = [
            'Road No. 12, Banjara Hills',
            'Jubilee Hills Main Road',
            'Gachibowli Circle',
            'Madhapur Junction'
        ];
        const fieldManagers = ['Rajesh Kumar', 'Priya Sharma', 'Suresh Reddy'];
        const statuses = ['pending_verification', 'approved', 'rejected'];

        this.submissions = [];
        for (let i = 1; i <= 10; i++) {
            const submission = {
                id: `IALA2024${String(i).padStart(3, '0')}`,
                workId: `IALA2024${String(i).padStart(3, '0')}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                description: `Completed work for ${categories[Math.floor(Math.random() * categories.length)]} issue`,
                submittedBy: `field00${Math.floor(Math.random() * 3) + 1}`,
                submittedByName: fieldManagers[Math.floor(Math.random() * fieldManagers.length)],
                submissionDate: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
                completionDate: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completionTime: '14:30',
                completionImage: {
                    name: `completion_${i}.jpg`,
                    size: 1024 * (500 + Math.random() * 1000),
                    type: 'image/jpeg'
                },
                progressNotes: [
                    {
                        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                        author: fieldManagers[Math.floor(Math.random() * fieldManagers.length)],
                        content: 'Work completed successfully. All issues resolved.',
                        statusChange: 'in-progress → completed'
                    }
                ],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                verificationStatus: null,
                verifiedBy: null,
                verificationDate: null,
                verificationNotes: null
            };
            
            // If already verified, add verification details
            if (submission.status !== 'pending_verification') {
                submission.verifiedBy = this.currentUser.id;
                submission.verificationDate = new Date().toISOString();
                submission.verificationNotes = submission.status === 'approved' ? 
                    'Work verified and approved. Quality meets standards.' :
                    'Work rejected due to quality issues. Please redo.';
            }
            
            this.submissions.push(submission);
        }
        
        this.saveSubmissions();
    }

    renderSubmissions() {
        const tbody = document.getElementById('submissions-tbody');
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        let filteredSubmissions = this.submissions;
        
        if (statusFilter !== 'all') {
            filteredSubmissions = filteredSubmissions.filter(s => s.status === statusFilter);
        }
        
        if (categoryFilter !== 'all') {
            filteredSubmissions = filteredSubmissions.filter(s => s.category === categoryFilter);
        }
        
        tbody.innerHTML = '';
        
        filteredSubmissions.forEach(submission => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${submission.workId}</strong></td>
                <td>${this.getCategoryName(submission.category)}</td>
                <td>${submission.location}</td>
                <td>${submission.submittedByName}</td>
                <td>${this.formatDate(submission.submissionDate)}</td>
                <td>${submission.completionDate} ${submission.completionTime}</td>
                <td><span class="status-badge ${submission.status}">${this.getStatusName(submission.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="officerDashboard.viewSubmission('${submission.id}')">View</button>
                        ${submission.status === 'pending_verification' ? 
                            `<button class="btn-sm btn-primary" onclick="officerDashboard.showVerificationModal('${submission.id}')">Verify</button>` : 
                            ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateStats() {
        const pendingVerification = this.submissions.filter(s => s.status === 'pending_verification').length;
        const verifiedToday = this.submissions.filter(s => {
            if (!s.verificationDate) return false;
            const today = new Date().toDateString();
            const verificationDate = new Date(s.verificationDate).toDateString();
            return verificationDate === today;
        }).length;
        const approvedCount = this.submissions.filter(s => s.status === 'approved').length;
        const rejectedCount = this.submissions.filter(s => s.status === 'rejected').length;

        document.getElementById('pending-verification').textContent = pendingVerification;
        document.getElementById('verified-today').textContent = verifiedToday;
        document.getElementById('approved-count').textContent = approvedCount;
        document.getElementById('rejected-count').textContent = rejectedCount;
    }

    showVerificationModal(submissionId) {
        this.currentSubmissionId = submissionId;
        const submission = this.submissions.find(s => s.id === submissionId);
        
        if (!submission) return;
        
        // Populate submission details
        const detailsDiv = document.getElementById('verification-submission-details');
        detailsDiv.innerHTML = `
            <div class="submission-overview">
                <h4>Work Submission: ${submission.workId}</h4>
                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span>${this.getCategoryName(submission.category)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span>${submission.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Field Manager:</span>
                        <span>${submission.submittedByName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Submitted:</span>
                        <span>${this.formatDate(submission.submissionDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Completion:</span>
                        <span>${submission.completionDate} at ${submission.completionTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Evidence:</span>
                        <span>${submission.completionImage.name} (${(submission.completionImage.size / 1024).toFixed(1)} KB)</span>
                    </div>
                </div>
                <p><strong>Description:</strong> ${submission.description}</p>
            </div>
            
            ${submission.progressNotes && submission.progressNotes.length > 0 ? `
            <div class="progress-notes">
                <h5>Field Manager Notes:</h5>
                ${submission.progressNotes.map(note => `
                    <div class="note-item">
                        <div class="note-header">
                            ${this.formatDate(note.timestamp)} - ${note.author}
                            ${note.statusChange ? `<span class="status-change">(${note.statusChange})</span>` : ''}
                        </div>
                        <div class="note-content">${note.content}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;
        
        // Reset form
        document.getElementById('verification-decision').value = '';
        document.getElementById('verification-notes').value = '';
        document.querySelectorAll('.checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Show modal
        document.getElementById('verification-modal').style.display = 'block';
    }

    toggleVerificationFields() {
        const decision = document.getElementById('verification-decision').value;
        // Additional UI changes can be added here if needed
    }

    submitVerification() {
        const decision = document.getElementById('verification-decision').value;
        const notes = document.getElementById('verification-notes').value;
        
        if (!decision) {
            alert('Please select a verification decision');
            return;
        }
        
        if (!notes.trim()) {
            alert('Please add verification notes');
            return;
        }
        
        const submission = this.submissions.find(s => s.id === this.currentSubmissionId);
        if (!submission) return;
        
        // Update submission
        submission.status = decision;
        submission.verifiedBy = this.currentUser.id;
        submission.verificationDate = new Date().toISOString();
        submission.verificationNotes = notes;
        
        // If approved, update the status across the entire application
        if (decision === 'approved') {
            this.finalizeApproval(submission);
        }
        
        this.saveSubmissions();
        this.renderSubmissions();
        this.updateStats();
        this.closeModal('verification-modal');
        
        const message = decision === 'approved' ? 
            'Work approved and finalized. Status updated across the application.' :
            'Work rejected. Field Manager will be notified to redo the work.';
        
        alert(message);
    }

    finalizeApproval(submission) {
        // Update the original complaint status in the main complaints list
        const allComplaints = JSON.parse(localStorage.getItem('iala_complaints') || '[]');
        const complaintIndex = allComplaints.findIndex(c => c.id === submission.workId);
        
        if (complaintIndex !== -1) {
            allComplaints[complaintIndex].status = 'completed';
            allComplaints[complaintIndex].finalizedBy = this.currentUser.id;
            allComplaints[complaintIndex].finalizedDate = new Date().toISOString();
            allComplaints[complaintIndex].verificationNotes = submission.verificationNotes;
            
            // Add final approval note
            allComplaints[complaintIndex].notes = allComplaints[complaintIndex].notes || [];
            allComplaints[complaintIndex].notes.push({
                timestamp: new Date().toISOString(),
                author: this.currentUser.name,
                type: 'approval',
                content: `Work verified and approved by Officer Manager. ${submission.verificationNotes}`
            });
            
            localStorage.setItem('iala_complaints', JSON.stringify(allComplaints));
        }
        
        // Create completion record for citizen notification
        const completions = JSON.parse(localStorage.getItem('iala_completed_works') || '[]');
        completions.push({
            workId: submission.workId,
            category: submission.category,
            location: submission.location,
            completedDate: submission.completionDate,
            completedTime: submission.completionTime,
            approvedDate: new Date().toISOString(),
            approvedBy: this.currentUser.name,
            fieldManager: submission.submittedByName,
            verificationNotes: submission.verificationNotes
        });
        localStorage.setItem('iala_completed_works', JSON.stringify(completions));
    }

    viewSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        const content = document.getElementById('submission-details-content');
        content.innerHTML = `
            <div class="submission-details">
                <h4>Submission Details: ${submission.workId}</h4>
                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span>${this.getCategoryName(submission.category)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="status-badge ${submission.status}">${this.getStatusName(submission.status)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span>${submission.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Field Manager:</span>
                        <span>${submission.submittedByName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Submitted:</span>
                        <span>${this.formatDate(submission.submissionDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Completion:</span>
                        <span>${submission.completionDate} at ${submission.completionTime}</span>
                    </div>
                    ${submission.verificationDate ? `
                    <div class="detail-row">
                        <span class="detail-label">Verified:</span>
                        <span>${this.formatDate(submission.verificationDate)}</span>
                    </div>
                    ` : ''}
                </div>
                <p><strong>Description:</strong> ${submission.description}</p>
                
                <div class="evidence-section">
                    <h5>Completion Evidence:</h5>
                    <p><strong>Image:</strong> ${submission.completionImage.name}</p>
                    <p><strong>Size:</strong> ${(submission.completionImage.size / 1024).toFixed(1)} KB</p>
                    <p><strong>Type:</strong> ${submission.completionImage.type}</p>
                </div>
            </div>
            
            ${submission.progressNotes && submission.progressNotes.length > 0 ? `
            <div style="margin-top: 1rem;">
                <h4>Field Manager Progress:</h4>
                ${submission.progressNotes.map(note => `
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
            
            ${submission.verificationNotes ? `
            <div style="margin-top: 1rem;">
                <h4>Verification Decision:</h4>
                <div style="background: ${submission.status === 'approved' ? '#d4edda' : '#f8d7da'}; padding: 0.75rem; border-radius: 4px; border-left: 3px solid ${submission.status === 'approved' ? '#28a745' : '#dc3545'};">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">
                        ${this.formatDate(submission.verificationDate)} - ${this.currentUser.name}
                    </div>
                    <div><strong>${submission.status === 'approved' ? 'APPROVED' : 'REJECTED'}:</strong> ${submission.verificationNotes}</div>
                </div>
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
            'pending_verification': 'Pending Verification',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return statuses[status] || status;
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

    saveSubmissions() {
        localStorage.setItem('iala_officer_submissions', JSON.stringify(this.submissions));
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Global functions
function filterSubmissions() {
    officerDashboard.renderSubmissions();
}

function loadSubmissions() {
    officerDashboard.loadSubmissions();
}

function toggleVerificationFields() {
    officerDashboard.toggleVerificationFields();
}

function submitVerification() {
    officerDashboard.submitVerification();
}

// Global logout function - multiple approaches for compatibility
function logoutUser() {
    console.log('Officer Manager logout function called'); // Debug log
    
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
            
            console.log('Officer Manager session data cleared, redirecting to login');
            
            // Force redirect to login page
            window.location.replace('auth-system.html');
            
        } catch (error) {
            console.error('Error during Officer Manager logout:', error);
            // Force redirect even if there's an error
            alert('Logging out...');
            window.location.href = 'auth-system.html';
        }
    }
}

// Force logout without confirmation
function forceLogout() {
    console.log('Officer Manager force logout called');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'auth-system.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize dashboard
let officerDashboard;
document.addEventListener('DOMContentLoaded', () => {
    officerDashboard = new OfficerManagerDashboard();
    
    // Ensure logout functions are globally accessible
    window.logoutUser = logoutUser;
    window.forceLogout = forceLogout;
    
    console.log('Officer Manager dashboard loaded, logout functions available:', {
        logoutUser: typeof window.logoutUser,
        forceLogout: typeof window.forceLogout
    });
});