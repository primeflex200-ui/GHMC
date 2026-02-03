// AI Integration Layer - Connects AI Module with Main IALA System
class IALAIntegration {
    constructor() {
        this.apiEndpoint = '/api/iala'; // Would be actual API endpoint
        this.complaints = [];
        this.teams = {
            'street-light': 'Electrical Maintenance Team',
            'pothole': 'Road Maintenance Team',
            'garbage': 'Waste Management Team',
            'water-supply': 'Water Supply Team',
            'drainage': 'Drainage Team',
            'cctv': 'Security Team',
            'incident': 'General Services Team',
            'fogging': 'Health Department',
            'green-belt': 'Parks & Gardens Team'
        };
        this.init();
    }

    init() {
        this.setupAPISimulation();
        this.loadExistingComplaints();
    }

    // Simulate API calls for demo purposes
    setupAPISimulation() {
        // In production, these would be actual API calls
        this.mockAPI = {
            submitComplaint: (complaint) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        complaint.id = this.generateComplaintId();
                        complaint.assignedTeam = this.teams[complaint.category];
                        complaint.status = 'submitted';
                        complaint.submittedAt = new Date().toISOString();
                        
                        this.complaints.push(complaint);
                        this.syncWithMainSystem(complaint);
                        
                        resolve({
                            success: true,
                            complaintId: complaint.id,
                            message: 'Complaint submitted successfully'
                        });
                    }, 1000);
                });
            },

            updateComplaintStatus: (complaintId, status, notes) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const complaint = this.complaints.find(c => c.id === complaintId);
                        if (complaint) {
                            complaint.status = status;
                            complaint.lastUpdated = new Date().toISOString();
                            if (notes) complaint.notes = notes;
                            
                            this.notifyUser(complaint);
                            resolve({ success: true });
                        } else {
                            resolve({ success: false, error: 'Complaint not found' });
                        }
                    }, 500);
                });
            },

            getComplaintStatus: (complaintId) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const complaint = this.complaints.find(c => c.id === complaintId);
                        resolve(complaint || null);
                    }, 300);
                });
            },

            getAllComplaints: () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(this.complaints);
                    }, 500);
                });
            }
        };
    }

    // Sync AI-captured complaints with main system
    syncWithMainSystem(complaint) {
        // This would sync with the existing IALA system
        console.log('Syncing with main system:', complaint);
        
        // Add to main system's complaint list (simulated)
        if (typeof window.ghmc_app !== 'undefined') {
            // If main app is loaded, add complaint there too
            this.addToMainApp(complaint);
        }

        // Store in localStorage for persistence
        this.saveToStorage();
        
        // Simulate workflow progression
        this.simulateWorkflow(complaint);
    }

    addToMainApp(complaint) {
        // This would integrate with the main app's complaint system
        // For now, we'll just log it
        console.log('Adding to main app:', complaint);
    }

    simulateWorkflow(complaint) {
        // Simulate the complaint workflow
        const workflow = [
            { status: 'assigned', delay: 2 * 60 * 1000 }, // 2 minutes
            { status: 'in-progress', delay: 5 * 60 * 1000 }, // 5 minutes
            { status: 'resolved', delay: 10 * 60 * 1000 } // 10 minutes
        ];

        workflow.forEach((step, index) => {
            setTimeout(() => {
                this.mockAPI.updateComplaintStatus(
                    complaint.id, 
                    step.status, 
                    `Complaint ${step.status.replace('-', ' ')}`
                );
            }, step.delay);
        });
    }

    notifyUser(complaint) {
        // Notify user of status updates
        if (window.ghmc_ai) {
            window.ghmc_ai.notifyStatusUpdate(complaint);
        }
        
        // Could also send push notifications, SMS, etc.
        console.log('User notified of status update:', complaint);
    }

    generateComplaintId() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `IALA${timestamp.slice(-4)}${random}`;
    }

    saveToStorage() {
        localStorage.setItem('ghmc-ai-complaints', JSON.stringify(this.complaints));
    }

    loadExistingComplaints() {
        const saved = localStorage.getItem('ghmc-ai-complaints');
        if (saved) {
            this.complaints = JSON.parse(saved);
        }
    }

    // Public API methods for AI module to use
    async submitComplaint(complaintData) {
        try {
            const result = await this.mockAPI.submitComplaint(complaintData);
            return result;
        } catch (error) {
            console.error('Error submitting complaint:', error);
            return { success: false, error: error.message };
        }
    }

    async getComplaintStatus(complaintId) {
        try {
            const complaint = await this.mockAPI.getComplaintStatus(complaintId);
            return complaint;
        } catch (error) {
            console.error('Error getting complaint status:', error);
            return null;
        }
    }

    async getAllComplaints() {
        try {
            const complaints = await this.mockAPI.getAllComplaints();
            return complaints;
        } catch (error) {
            console.error('Error getting all complaints:', error);
            return [];
        }
    }

    // Admin interface methods
    getComplaintsByTeam(team) {
        return this.complaints.filter(c => c.assignedTeam === team);
    }

    getComplaintsByStatus(status) {
        return this.complaints.filter(c => c.status === status);
    }

    getComplaintsByDateRange(startDate, endDate) {
        return this.complaints.filter(c => {
            const complaintDate = new Date(c.submittedAt);
            return complaintDate >= startDate && complaintDate <= endDate;
        });
    }

    getComplaintStatistics() {
        const stats = {
            total: this.complaints.length,
            byStatus: {},
            byCategory: {},
            byTeam: {},
            avgResolutionTime: 0
        };

        this.complaints.forEach(complaint => {
            // Count by status
            stats.byStatus[complaint.status] = (stats.byStatus[complaint.status] || 0) + 1;
            
            // Count by category
            stats.byCategory[complaint.category] = (stats.byCategory[complaint.category] || 0) + 1;
            
            // Count by team
            if (complaint.assignedTeam) {
                stats.byTeam[complaint.assignedTeam] = (stats.byTeam[complaint.assignedTeam] || 0) + 1;
            }
        });

        return stats;
    }

    // Language processing helpers
    detectLanguage(text) {
        // Simple language detection based on character sets
        // In production, would use proper language detection service
        
        if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
        if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
        if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
        if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
        if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
        
        return 'en'; // Default to English
    }

    translateText(text, targetLanguage) {
        // In production, would use translation service
        // For demo, return original text with language indicator
        return `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    // Escalation logic
    shouldEscalateToHuman(complaint) {
        const escalationCriteria = [
            complaint.description.toLowerCase().includes('emergency'),
            complaint.description.toLowerCase().includes('urgent'),
            complaint.category === 'incident' && complaint.description.toLowerCase().includes('accident'),
            this.getComplaintAge(complaint) > 24 * 60 * 60 * 1000, // 24 hours
            complaint.status === 'assigned' && this.getComplaintAge(complaint) > 4 * 60 * 60 * 1000 // 4 hours in assigned state
        ];

        return escalationCriteria.some(criteria => criteria);
    }

    getComplaintAge(complaint) {
        return Date.now() - new Date(complaint.submittedAt).getTime();
    }

    escalateToHuman(complaint) {
        console.log('Escalating complaint to human agent:', complaint.id);
        
        // Update complaint status
        complaint.status = 'escalated';
        complaint.escalatedAt = new Date().toISOString();
        complaint.escalationReason = 'Auto-escalated based on criteria';
        
        // Notify human agents (would be actual notification system)
        this.notifyHumanAgents(complaint);
        
        // Update user
        this.notifyUser(complaint);
    }

    notifyHumanAgents(complaint) {
        // In production, would send notifications to human agents
        console.log('Human agents notified of escalation:', complaint);
    }
}

// Initialize integration layer
window.ghmc_integration = new GHMCIntegration();

// Export for use by AI module
window.IALAIntegration = IALAIntegration;