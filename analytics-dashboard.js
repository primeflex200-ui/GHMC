// Analytics Dashboard JavaScript
class AnalyticsDashboard {
    constructor() {
        this.currentPeriod = 'month';
        this.data = {
            complaints: [],
            analytics: [],
            performance: {},
            realTimeActivity: []
        };
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Period selector
        document.getElementById('period-selector').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updatePeriodDisplay();
            this.loadData();
            this.renderDashboard();
        });

        // Export button
        document.getElementById('export-analytics').addEventListener('click', () => {
            this.exportData();
        });

        // Refresh button
        document.getElementById('refresh-analytics').addEventListener('click', () => {
            this.refreshData();
        });

        // Chart toggles
        document.querySelectorAll('.chart-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const parent = e.target.closest('.chart-card');
                
                // Update active state
                parent.querySelectorAll('.chart-toggle').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update chart
                this.updateChartType(parent, chartType);
            });
        });

        // Map toggles
        document.querySelectorAll('.map-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const viewType = e.target.dataset.view;
                
                // Update active state
                document.querySelectorAll('.map-toggle').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update map view
                this.updateMapView(viewType);
            });
        });

        // Department filter
        document.getElementById('department-filter').addEventListener('change', () => {
            this.updatePerformanceData();
        });
    }

    loadData() {
        // Load complaints data
        this.data.complaints = this.getComplaintsData();
        
        // Load analytics events
        this.data.analytics = this.getAnalyticsData();
        
        // Generate performance data
        this.data.performance = this.generatePerformanceData();
        
        // Load real-time activity
        this.data.realTimeActivity = this.getRealTimeActivity();
    }

    getComplaintsData() {
        const saved = localStorage.getItem('ghmc_complaints');
        const complaints = saved ? JSON.parse(saved) : [];
        
        // Add demo data if empty
        if (complaints.length === 0) {
            return this.generateDemoComplaints();
        }
        
        return this.filterByPeriod(complaints);
    }

    getAnalyticsData() {
        const saved = localStorage.getItem('ghmc_analytics');
        const analytics = saved ? JSON.parse(saved) : [];
        
        // Add demo analytics if empty
        if (analytics.length === 0) {
            return this.generateDemoAnalytics();
        }
        
        return this.filterByPeriod(analytics);
    }

    generateDemoComplaints() {
        const complaints = [];
        const categories = ['street-light', 'pothole', 'garbage', 'water-supply', 'drainage', 'cctv', 'fogging', 'green-belt'];
        const statuses = ['submitted', 'assigned', 'in-progress', 'resolved'];
        const priorities = ['low', 'medium', 'high', 'critical'];
        const areas = ['banjara-hills', 'jubilee-hills', 'madhapur', 'gachibowli', 'kondapur'];
        
        const now = new Date();
        const periodDays = this.getPeriodDays();
        
        for (let i = 0; i < 1247; i++) {
            const daysAgo = Math.floor(Math.random() * periodDays);
            const submittedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            
            complaints.push({
                id: `GHMC2024${String(i + 1).padStart(3, '0')}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                area: areas[Math.floor(Math.random() * areas.length)],
                submittedAt: submittedAt.toISOString(),
                resolvedAt: Math.random() > 0.3 ? new Date(submittedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
                source: Math.random() > 0.66 ? 'ai' : Math.random() > 0.5 ? 'web' : 'mobile',
                language: Math.random() > 0.7 ? ['hi', 'te', 'ta'][Math.floor(Math.random() * 3)] : 'en'
            });
        }
        
        return complaints;
    }

    generateDemoAnalytics() {
        const analytics = [];
        const events = ['complaint_submitted', 'complaint_status_updated', 'user_login', 'ai_complaint_captured'];
        
        const now = new Date();
        const periodDays = this.getPeriodDays();
        
        for (let i = 0; i < 5000; i++) {
            const daysAgo = Math.floor(Math.random() * periodDays);
            const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            
            analytics.push({
                timestamp: timestamp.toISOString(),
                eventType: events[Math.floor(Math.random() * events.length)],
                data: {
                    category: Math.random() > 0.5 ? 'street-light' : 'pothole',
                    source: Math.random() > 0.5 ? 'web' : 'mobile'
                }
            });
        }
        
        return analytics;
    }

    generatePerformanceData() {
        const departments = [
            { name: 'Electrical', id: 'electrical' },
            { name: 'Road Maintenance', id: 'road-maintenance' },
            { name: 'Waste Management', id: 'waste-management' },
            { name: 'Water Supply', id: 'water-supply' },
            { name: 'Drainage', id: 'drainage' },
            { name: 'Security', id: 'security' },
            { name: 'Health', id: 'health' },
            { name: 'Parks & Gardens', id: 'parks' }
        ];
        
        const performance = {};
        
        departments.forEach(dept => {
            const total = Math.floor(Math.random() * 200) + 50;
            const resolved = Math.floor(total * (0.7 + Math.random() * 0.25));
            const inProgress = Math.floor((total - resolved) * 0.6);
            const pending = total - resolved - inProgress;
            
            performance[dept.id] = {
                name: dept.name,
                total,
                resolved,
                inProgress,
                pending,
                score: Math.floor(70 + Math.random() * 25),
                avgResolutionTime: (1 + Math.random() * 4).toFixed(1)
            };
        });
        
        return performance;
    }

    getRealTimeActivity() {
        const activities = [
            { type: 'complaint', text: 'New complaint submitted: Street light issue in Banjara Hills', time: '2 minutes ago' },
            { type: 'status', text: 'Complaint GHMC2024156 marked as resolved', time: '5 minutes ago' },
            { type: 'assignment', text: 'Complaint assigned to Field Manager Rajesh Kumar', time: '8 minutes ago' },
            { type: 'ai', text: 'AI assistant captured complaint in Telugu', time: '12 minutes ago' },
            { type: 'escalation', text: 'Critical complaint escalated to Officer Manager', time: '15 minutes ago' }
        ];
        
        return activities;
    }

    filterByPeriod(data) {
        const now = new Date();
        const periodStart = this.getPeriodStart(now);
        
        return data.filter(item => {
            const itemDate = new Date(item.timestamp || item.submittedAt);
            return itemDate >= periodStart;
        });
    }

    getPeriodStart(now) {
        switch (this.currentPeriod) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case 'year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }

    getPeriodDays() {
        switch (this.currentPeriod) {
            case 'today': return 1;
            case 'week': return 7;
            case 'month': return 30;
            case 'quarter': return 90;
            case 'year': return 365;
            default: return 30;
        }
    }

    updatePeriodDisplay() {
        const periodNames = {
            'today': 'Today',
            'week': 'Last 7 Days',
            'month': 'Last 30 Days',
            'quarter': 'Last 3 Months',
            'year': 'Last Year'
        };
        
        document.getElementById('current-period').textContent = periodNames[this.currentPeriod];
    }

    renderDashboard() {
        this.renderMetrics();
        this.renderCharts();
        this.renderPerformance();
        this.renderGeographic();
        this.renderAIAnalytics();
        this.renderRealTimeActivity();
    }

    renderMetrics() {
        const complaints = this.data.complaints;
        const total = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const resolutionRate = total > 0 ? (resolved / total * 100).toFixed(1) : 0;
        
        // Calculate average resolution time
        const resolvedComplaints = complaints.filter(c => c.resolvedAt);
        const avgResolutionTime = resolvedComplaints.length > 0 
            ? resolvedComplaints.reduce((sum, c) => {
                const submitted = new Date(c.submittedAt);
                const resolved = new Date(c.resolvedAt);
                return sum + (resolved - submitted) / (1000 * 60 * 60 * 24);
            }, 0) / resolvedComplaints.length
            : 0;
        
        const aiCaptured = complaints.filter(c => c.source === 'ai').length;
        const aiCaptureRate = total > 0 ? (aiCaptured / total * 100).toFixed(1) : 0;
        
        // Update metric values
        document.getElementById('total-complaints').textContent = total.toLocaleString();
        document.getElementById('resolution-rate').textContent = `${resolutionRate}%`;
        document.getElementById('avg-resolution-time').textContent = `${avgResolutionTime.toFixed(1)} days`;
        document.getElementById('ai-capture-rate').textContent = `${aiCaptureRate}%`;
        document.getElementById('user-satisfaction').textContent = '4.2/5';
        document.getElementById('active-managers').textContent = '24';
        
        // Update trends (simulated)
        this.updateTrend('complaints-trend', 12);
        this.updateTrend('resolution-trend', 5);
        this.updateTrend('time-trend', -8);
        this.updateTrend('ai-trend', 23);
        this.updateTrend('satisfaction-trend', 3);
        this.updateTrend('managers-trend', 0);
    }

    updateTrend(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = value > 0 ? `+${value}%` : value < 0 ? `${value}%` : '0%';
        element.className = 'metric-trend ' + (value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral');
    }

    renderCharts() {
        this.renderComplaintsChart();
        this.renderCategoryChart();
        this.renderStatusBars();
        this.renderResolutionChart();
    }

    renderComplaintsChart() {
        const canvas = document.getElementById('complaints-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const complaints = this.data.complaints;
        
        // Group complaints by date
        const dateGroups = {};
        complaints.forEach(complaint => {
            const date = new Date(complaint.submittedAt).toDateString();
            dateGroups[date] = (dateGroups[date] || 0) + 1;
        });
        
        // Create chart data
        const dates = Object.keys(dateGroups).sort();
        const values = dates.map(date => dateGroups[date]);
        
        // Simple line chart implementation
        this.drawLineChart(ctx, canvas, dates, values, 'Complaints');
    }

    renderCategoryChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const complaints = this.data.complaints;
        
        // Group by category
        const categoryGroups = {};
        complaints.forEach(complaint => {
            categoryGroups[complaint.category] = (categoryGroups[complaint.category] || 0) + 1;
        });
        
        // Create pie chart
        this.drawPieChart(ctx, canvas, categoryGroups);
    }

    renderStatusBars() {
        const container = document.getElementById('status-bars');
        if (!container) return;
        
        const complaints = this.data.complaints;
        const total = complaints.length;
        
        const statusGroups = {};
        complaints.forEach(complaint => {
            statusGroups[complaint.status] = (statusGroups[complaint.status] || 0) + 1;
        });
        
        const statusNames = {
            'submitted': 'Submitted',
            'assigned': 'Assigned',
            'in-progress': 'In Progress',
            'resolved': 'Resolved'
        };
        
        container.innerHTML = Object.entries(statusGroups)
            .map(([status, count]) => {
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                return `
                    <div class="status-bar">
                        <div class="status-label">${statusNames[status] || status}</div>
                        <div class="status-progress">
                            <div class="status-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="status-value">${count}</div>
                    </div>
                `;
            }).join('');
    }

    renderResolutionChart() {
        const canvas = document.getElementById('resolution-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const complaints = this.data.complaints.filter(c => c.resolvedAt);
        
        // Group by resolution time
        const timeGroups = { '0-1': 0, '1-3': 0, '3-7': 0, '7+': 0 };
        
        complaints.forEach(complaint => {
            const submitted = new Date(complaint.submittedAt);
            const resolved = new Date(complaint.resolvedAt);
            const days = (resolved - submitted) / (1000 * 60 * 60 * 24);
            
            if (days <= 1) timeGroups['0-1']++;
            else if (days <= 3) timeGroups['1-3']++;
            else if (days <= 7) timeGroups['3-7']++;
            else timeGroups['7+']++;
        });
        
        // Draw bar chart
        this.drawBarChart(ctx, canvas, timeGroups, 'Resolution Time (Days)');
    }

    renderPerformance() {
        const container = document.getElementById('performance-grid');
        const departmentFilter = document.getElementById('department-filter').value;
        
        let departments = Object.values(this.data.performance);
        
        if (departmentFilter) {
            departments = departments.filter(dept => dept.id === departmentFilter);
        }
        
        container.innerHTML = departments.map(dept => `
            <div class="performance-card">
                <div class="performance-header">
                    <div class="department-name">${dept.name}</div>
                    <div class="performance-score">${dept.score}%</div>
                </div>
                <div class="performance-stats">
                    <div class="performance-stat">
                        <div class="stat-number">${dept.total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="performance-stat">
                        <div class="stat-number">${dept.resolved}</div>
                        <div class="stat-label">Resolved</div>
                    </div>
                    <div class="performance-stat">
                        <div class="stat-number">${dept.avgResolutionTime}d</div>
                        <div class="stat-label">Avg Time</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderGeographic() {
        this.renderAreaStats();
    }

    renderAreaStats() {
        const container = document.getElementById('area-list');
        const complaints = this.data.complaints;
        
        const areaGroups = {};
        complaints.forEach(complaint => {
            if (complaint.area) {
                areaGroups[complaint.area] = (areaGroups[complaint.area] || 0) + 1;
            }
        });
        
        const sortedAreas = Object.entries(areaGroups)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        const areaNames = {
            'banjara-hills': 'Banjara Hills',
            'jubilee-hills': 'Jubilee Hills',
            'madhapur': 'Madhapur',
            'gachibowli': 'Gachibowli',
            'kondapur': 'Kondapur'
        };
        
        container.innerHTML = sortedAreas.map(([area, count]) => `
            <div class="area-item">
                <div class="area-name">${areaNames[area] || area}</div>
                <div class="area-count">${count}</div>
            </div>
        `).join('');
    }

    renderAIAnalytics() {
        this.renderLanguageBars();
        this.renderAIAccuracy();
        this.renderResponseTime();
        this.renderInteractionStats();
    }

    renderLanguageBars() {
        const container = document.getElementById('language-bars');
        const complaints = this.data.complaints;
        
        const languageGroups = {};
        complaints.forEach(complaint => {
            const lang = complaint.language || 'en';
            languageGroups[lang] = (languageGroups[lang] || 0) + 1;
        });
        
        const total = complaints.length;
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi',
            'te': 'Telugu',
            'ta': 'Tamil',
            'kn': 'Kannada',
            'ml': 'Malayalam'
        };
        
        container.innerHTML = Object.entries(languageGroups)
            .sort(([,a], [,b]) => b - a)
            .map(([lang, count]) => {
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                return `
                    <div class="language-bar">
                        <div class="language-name">${languageNames[lang] || lang}</div>
                        <div class="language-progress">
                            <div class="language-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="language-percentage">${percentage}%</div>
                    </div>
                `;
            }).join('');
    }

    renderAIAccuracy() {
        // AI accuracy is already set in HTML, could be dynamic
        document.getElementById('ai-accuracy').textContent = '92.5%';
    }

    renderResponseTime() {
        const container = document.getElementById('response-time-chart');
        container.innerHTML = '<div>Avg: 1.2s</div>';
    }

    renderInteractionStats() {
        const container = document.getElementById('interaction-stats');
        container.innerHTML = '<div>2,847 interactions</div>';
    }

    renderRealTimeActivity() {
        const container = document.getElementById('activity-feed');
        const activities = this.data.realTimeActivity;
        
        const iconMap = {
            'complaint': '📝',
            'status': '✅',
            'assignment': '👤',
            'ai': '🤖',
            'escalation': '⚠️'
        };
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${iconMap[activity.type] || '📋'}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    // Chart Drawing Methods
    drawLineChart(ctx, canvas, labels, data, title) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        if (data.length === 0) return;
        
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const range = maxValue - minValue || 1;
        
        // Draw axes
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw line
        ctx.beginPath();
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#333';
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawPieChart(ctx, canvas, data) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        ctx.clearRect(0, 0, width, height);
        
        const total = Object.values(data).reduce((sum, value) => sum + value, 0);
        let currentAngle = 0;
        
        const colors = ['#333', '#666', '#999', '#ccc', '#e0e0e0', '#f0f0f0'];
        let colorIndex = 0;
        
        Object.entries(data).forEach(([category, value]) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[colorIndex % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
            colorIndex++;
        });
    }

    drawBarChart(ctx, canvas, data, title) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#333';
        
        const values = Object.values(data);
        const maxValue = Math.max(...values);
        const barWidth = (width - 2 * padding) / values.length;
        
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height - 2 * padding);
            const x = padding + index * barWidth;
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);
        });
    }

    updateChartType(parent, chartType) {
        // Chart type switching logic would go here
        console.log('Switching chart type to:', chartType);
    }

    updateMapView(viewType) {
        // Map view switching logic would go here
        console.log('Switching map view to:', viewType);
    }

    updatePerformanceData() {
        this.renderPerformance();
    }

    startRealTimeUpdates() {
        // Update real-time activity every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateRealTimeActivity();
        }, 30000);
    }

    updateRealTimeActivity() {
        // Add new activity item
        const newActivities = [
            { type: 'complaint', text: 'New complaint: Water supply issue in Kondapur', time: 'Just now' },
            { type: 'ai', text: 'AI assistant processed complaint in Hindi', time: '1 minute ago' },
            { type: 'status', text: 'Complaint GHMC2024789 updated to in-progress', time: '3 minutes ago' }
        ];
        
        const randomActivity = newActivities[Math.floor(Math.random() * newActivities.length)];
        this.data.realTimeActivity.unshift(randomActivity);
        
        // Keep only last 10 activities
        this.data.realTimeActivity = this.data.realTimeActivity.slice(0, 10);
        
        this.renderRealTimeActivity();
    }

    refreshData() {
        const refreshBtn = document.getElementById('refresh-analytics');
        refreshBtn.classList.add('spinning');
        
        setTimeout(() => {
            this.loadData();
            this.renderDashboard();
            refreshBtn.classList.remove('spinning');
        }, 1000);
    }

    exportData() {
        const exportData = {
            period: this.currentPeriod,
            generatedAt: new Date().toISOString(),
            metrics: {
                totalComplaints: this.data.complaints.length,
                resolutionRate: document.getElementById('resolution-rate').textContent,
                avgResolutionTime: document.getElementById('avg-resolution-time').textContent,
                aiCaptureRate: document.getElementById('ai-capture-rate').textContent
            },
            complaints: this.data.complaints,
            performance: this.data.performance
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghmc-analytics-${this.currentPeriod}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.destroy();
    }
});