const API_BASE = '/api/v1';

// App State
let currentToken = localStorage.getItem('devtrack_token');
let currentUser = localStorage.getItem('devtrack_user');
let currentProjectId = localStorage.getItem('devtrack_project_id');
let currentIssueId = null;
let currentSearchQuery = '';
let currentPriorityFilter = 'ALL';
let allIssuesCache = [];

// DOM Elements
const authView = document.getElementById('auth-view');
const appWorkspace = document.getElementById('app-workspace');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const detailsModal = document.getElementById('details-modal');

// Initialize
function init() {
    if (currentToken) {
        showDashboard();
    } else {
        showAuth();
    }
}

function showFeatureNotReady(featureName) {
    showToast(`${featureName} feature coming soon!`);
}

function closeSearchDropdown() {
    document.getElementById('search-dropdown').classList.add('hidden');
}

function applyFilters() {
    let filtered = allIssuesCache;
    
    // Apply search query
    if (currentSearchQuery) {
        filtered = filtered.filter(issue => 
            issue.title.toLowerCase().includes(currentSearchQuery) || 
            `dev-${issue.id}`.includes(currentSearchQuery) ||
            issue.status.toLowerCase().includes(currentSearchQuery)
        );
    }
    
    // Apply priority filter
    if (currentPriorityFilter !== 'ALL') {
        filtered = filtered.filter(issue => issue.priority === currentPriorityFilter);
    }
    
    renderIssues(filtered);
    renderIssuesTable(filtered);
}

function handlePriorityFilter(priority) {
    currentPriorityFilter = priority;
    
    // Sync both dropdowns
    const dbFilter = document.getElementById('dashboard-priority-filter');
    const aiFilter = document.getElementById('all-issues-priority-filter');
    if(dbFilter) dbFilter.value = priority;
    if(aiFilter) aiFilter.value = priority;
    
    applyFilters();
}

function handleGlobalSearch(query) {
    currentSearchQuery = query.toLowerCase();
    
    const dropdown = document.getElementById('search-dropdown');
    
    if (!currentSearchQuery) {
        dropdown.classList.add('hidden');
    } else {
        dropdown.classList.remove('hidden');
        const matches = allIssuesCache.filter(issue => 
            issue.title.toLowerCase().includes(currentSearchQuery) || 
            `dev-${issue.id}`.includes(currentSearchQuery) ||
            issue.status.toLowerCase().includes(currentSearchQuery)
        );
        
        if (matches.length === 0) {
            dropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No matches found</div>';
        } else {
            dropdown.innerHTML = matches.slice(0, 10).map(issue => `
                <div class="search-result-item" onmousedown="openDetailsModal(${issue.id})">
                    <span class="search-result-id">DEV-${issue.id} • <span style="color:var(--text-muted)">${issue.status}</span></span>
                    <span class="search-result-title">${issue.title}</span>
                </div>
            `).join('');
        }
    }
    
    applyFilters();
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}


function showNavView(viewId) {
    // Save preference so we remain on same page on refresh
    localStorage.setItem('devtrack_current_view', viewId);
    
    document.querySelectorAll('.nav-content-pane').forEach(el => el.classList.remove('active', 'hidden'));
    document.querySelectorAll('.nav-content-pane').forEach(el => el.classList.add('hidden'));
    
    const targetPane = document.getElementById('nav-' + viewId);
    if(targetPane) {
        targetPane.classList.remove('hidden');
        targetPane.classList.add('active');
    }

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
    
    // Find nav item by checking onclick attribute
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        if(item.getAttribute('onclick') && item.getAttribute('onclick').includes(viewId)) {
            item.classList.add('active');
        }
    });

    if (viewId === 'dashboard') {
        if (currentProjectId) fetchIssues();
    } else if (viewId === 'all-issues') {
        if (currentProjectId) fetchAllIssuesTable();
    } else if (viewId === 'activity') {
        if (currentProjectId) fetchGlobalActivity();
    } else if (viewId === 'settings') {
        loadSettings();
    } else if (viewId === 'projects') {
        loadProjects();
    }
}

function showAuth() {
    authView.classList.add('active');
    appWorkspace.classList.remove('active');
    appWorkspace.classList.add('hidden');
}

function showDashboard() {
    authView.classList.remove('active');
    appWorkspace.classList.remove('hidden');
    appWorkspace.classList.add('active');
    
    document.getElementById('user-greeting').innerText = currentUser || 'User';
    document.getElementById('user-avatar').innerText = (currentUser || 'U').charAt(0).toUpperCase();
    
    updateSidebarVisibility();
    loadProjects(); // Will populate selector and handle routing if no project selected
}

function updateSidebarVisibility() {
    const nav = document.getElementById('project-dependent-nav');
    if (currentProjectId) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }
}

function toggleMobileMenu() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

function showToast(message, isError = false) {
    toastMsg.textContent = message;
    toastEl.className = 'toast show ' + (isError ? 'error' : '');
    const icon = toastEl.querySelector('i');
    icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error('Invalid credentials');
        
        const data = await res.json();
        saveAuth(data);
        showToast('Login successful!');
        showDashboard();
    } catch (err) {
        showToast(err.message, true);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Registration failed');
        }
        
        const data = await res.json();
        saveAuth(data);
        showToast('Registration successful!');
        showDashboard();
    } catch (err) {
        showToast(err.message, true);
    }
}

function saveAuth(data) {
    currentToken = data.token;
    currentUser = data.fullName;
    localStorage.setItem('devtrack_token', currentToken);
    localStorage.setItem('devtrack_user', currentUser);
    
    // Clear project context on fresh login
    currentProjectId = null;
    localStorage.removeItem('devtrack_project_id');
    localStorage.setItem('devtrack_current_view', 'projects');
}

function handleLogout() {
    currentToken = null;
    currentUser = null;
    currentProjectId = null;
    localStorage.removeItem('devtrack_token');
    localStorage.removeItem('devtrack_user');
    localStorage.removeItem('devtrack_project_id');
    updateSidebarVisibility();
    showAuth();
}

// ==============================
// PROJECT MANAGEMENT
// ==============================
async function loadProjects() {
    try {
        const res = await fetch(`${API_BASE}/projects`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
        }
        
        const projects = await res.json();
        const selector = document.getElementById('project-selector');
        const grid = document.getElementById('projects-grid');
        
        // Populate selector
        selector.innerHTML = '<option value="" style="background: var(--bg-surface); color: var(--text-main);">Select Project</option>';
        projects.forEach(p => {
            selector.innerHTML += `<option value="${p.id}" style="background: var(--bg-surface); color: var(--text-main);" ${currentProjectId == p.id ? 'selected' : ''}>${p.name}</option>`;
        });
        
        // Populate grid
        grid.innerHTML = '';
        if (projects.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1; text-align: center; margin-top: 2rem;">No projects found. Create one to get started!</p>';
        } else {
            projects.forEach(p => {
                const isActive = (currentProjectId == p.id);
                grid.innerHTML += `
                    <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; ${isActive ? 'border-color: var(--primary);' : ''}">
                        <div>
                            <h3 style="margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                                ${p.name} 
                                ${isActive ? '<span class="text-blue" style="font-size:0.7rem; font-weight:600; padding:0.2rem 0.5rem; background:var(--info-bg); border-radius:4px;">ACTIVE</span>' : ''}
                            </h3>
                            <p class="text-muted" style="font-size:0.85rem; margin-bottom:1.5rem;">${p.description || 'No description provided.'}</p>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            ${isActive 
                                ? `<button class="primary-btn" style="padding:0.5rem 1rem; font-size:0.85rem; opacity:0.6; cursor:default;" disabled>Current Project</button>` 
                                : `<button class="primary-btn" style="padding:0.5rem 1rem; font-size:0.85rem" onclick="handleProjectChange('${p.id}')">Switch to Project</button>`}
                            <button class="icon-btn" onclick="deleteProject(${p.id})" title="Delete Project"><i class="fas fa-trash text-red"></i></button>
                        </div>
                    </div>
                `;
            });
        }
        
        // Routing logic
        const currentActivePane = document.querySelector('.nav-content-pane.active');
        const isInitialLoad = !currentActivePane;
        
        if (isInitialLoad) {
            if (!currentProjectId) {
                // Force projects view when no project is active
                showNavView('projects');
            } else {
                // Respect saved view
                const savedView = localStorage.getItem('devtrack_current_view') || 'dashboard';
                showNavView(savedView);
            }
        } else {
            // Not initial load
            if (!currentProjectId) {
                const savedView = localStorage.getItem('devtrack_current_view');
                if (savedView !== 'projects') {
                    showNavView('projects');
                }
            }
        }
        
        updateSidebarVisibility();
        
    } catch(err) {
        showToast('Failed to load projects', true);
    }
}

function handleProjectChange(projectId) {
    if (!projectId) return;
    currentProjectId = projectId;
    localStorage.setItem('devtrack_project_id', projectId);
    
    // Update selector if it was changed from outside
    document.getElementById('project-selector').value = projectId;
    
    updateSidebarVisibility();
    showToast('Switched project context');
    
    // Route to dashboard
    showNavView('dashboard');
}

function openNewProjectModal() {
    document.getElementById('new-project-modal').classList.remove('hidden');
}

function closeNewProjectModal() {
    document.getElementById('new-project-modal').classList.add('hidden');
    document.getElementById('new-project-form').reset();
}

async function handleCreateProject(e) {
    e.preventDefault();
    const name = document.getElementById('project-name').value;
    const desc = document.getElementById('project-desc').value;
    
    try {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ name, description: desc })
        });
        
        if (!res.ok) throw new Error('Failed to create project');
        
        showToast('Project created!');
        closeNewProjectModal();
        const p = await res.json();
        
        handleProjectChange(p.id);
        loadProjects();
    } catch(err) {
        showToast(err.message, true);
    }
}

async function deleteProject(id) {
    if(!confirm("Are you sure you want to delete this project? This will fail if there are issues inside it.")) return;
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to delete');
        }
        showToast('Project deleted');
        
        if (currentProjectId == id) {
            currentProjectId = null;
            localStorage.removeItem('devtrack_project_id');
        }
        loadProjects();
    } catch(err) {
        showToast(err.message, true);
    }
}

// ==============================
// ISSUE LIST MANAGEMENT
// ==============================
async function fetchIssues() {
    if (!currentProjectId) return;
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/issues?size=50&sort=id,desc`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            return;
        }
        
        const data = await res.json();
        allIssuesCache = data.content;
        updateStatistics(data.content); // Stats based on all issues
        applyFilters();
    } catch (err) {
        showToast('Failed to load issues', true);
    }
}

function updateStatistics(issues) {
    document.getElementById('stat-total').innerText = issues.length;
    
    const openCount = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
    document.getElementById('stat-open').innerText = openCount;
    
    const resolvedCount = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    document.getElementById('stat-resolved').innerText = resolvedCount;
    
    const critCount = issues.filter(i => i.priority === 'CRITICAL').length;
    document.getElementById('stat-critical').innerText = critCount;
}

function renderIssues(issues) {
    // Clear columns
    document.getElementById('list-OPEN').innerHTML = '';
    document.getElementById('list-IN_PROGRESS').innerHTML = '';
    document.getElementById('list-RESOLVED').innerHTML = '';
    
    let counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };

    issues.forEach(issue => {
        const card = document.createElement('div');
        card.className = 'issue-card';
        
        // Map status to columns
        let targetColId = issue.status;
        if (issue.status === 'TESTING' || issue.status === 'CLOSED') {
            targetColId = 'RESOLVED';
        }
        
        const creatorInitials = issue.createdByName ? issue.createdByName.substring(0, 2).toUpperCase() : 'U';

        // Calculate progress percentage
        let progress = 0;
        if (issue.status === 'OPEN') progress = 10;
        else if (issue.status === 'IN_PROGRESS') progress = 50;
        else if (issue.status === 'TESTING') progress = 80;
        else if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') progress = 100;
        
        let progressColor = 'var(--info)';
        if (progress === 100) progressColor = 'var(--success)';
        if (progress === 50) progressColor = 'var(--warning)';

        card.innerHTML = `
            <div class="issue-header">
                <span class="issue-id">DEV-${issue.id}</span>
                <span class="text-muted"><i class="far fa-clock"></i> ${new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
            <h4>${issue.title}</h4>
            <div class="issue-footer">
                <div class="issue-tags">
                    <span class="chip bg-${getPriorityColor(issue.priority)} text-${getPriorityColor(issue.priority)}">
                        ${getPriorityIcon(issue.priority)} ${issue.priority}
                    </span>
                    <span class="chip bg-surface border">
                        ${issue.severity.substring(0,3)}
                    </span>
                </div>
                <div class="issue-assignee" title="${issue.createdByName}">
                    ${creatorInitials}
                </div>
            </div>
            <div class="card-progress">
                <div class="card-progress-fill" style="width: ${progress}%; background-color: ${progressColor}"></div>
            </div>
        `;
        
        card.onclick = () => openDetailsModal(issue.id);

        const targetCol = document.getElementById(`list-${targetColId}`);
        if (targetCol) {
            targetCol.appendChild(card);
            counts[targetColId]++;
        }
    });
    
    // Update Column Counts
    document.getElementById('count-OPEN').innerText = counts.OPEN;
    document.getElementById('count-IN_PROGRESS').innerText = counts.IN_PROGRESS;
    document.getElementById('count-RESOLVED').innerText = counts.RESOLVED;
}

// Helpers
function getPriorityColor(prio) {
    if (prio === 'CRITICAL') return 'red';
    if (prio === 'HIGH') return 'yellow';
    if (prio === 'MEDIUM') return 'blue';
    return 'green';
}

function getPriorityIcon(priority) {
    switch(priority) {
        case 'CRITICAL': return '<i class="fas fa-arrow-up"></i>';
        case 'HIGH': return '<i class="fas fa-angle-double-up"></i>';
        case 'MEDIUM': return '<i class="fas fa-equals"></i>';
        case 'LOW': return '<i class="fas fa-angle-down"></i>';
        default: return '';
    }
}

// ==============================
// ALL ISSUES & ACTIVITY & SETTINGS
// ==============================
function renderIssuesTable(issues) {
    const tbody = document.getElementById('table-issues-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!issues || issues.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    No issues found for this project.
                </td>
            </tr>
        `;
        return;
    }
    
    issues.forEach(issue => {
        tbody.innerHTML += `
            <tr onclick="openDetailsModal(${issue.id})">
                <td>DEV-${issue.id}</td>
                <td style="font-weight: 500">${issue.title}</td>
                <td>${issue.status}</td>
                <td><span class="chip bg-${getPriorityColor(issue.priority)} text-${getPriorityColor(issue.priority)}">${getPriorityIcon(issue.priority)} ${issue.priority}</span></td>
                <td>${issue.severity}</td>
                <td>${issue.createdByName || 'Unknown'}</td>
            </tr>
        `;
    });
}

async function fetchAllIssuesTable() {
    if (!currentProjectId) return;
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/issues?size=100&sort=id,desc`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        allIssuesCache = data.content;
        applyFilters();
    } catch(err) {
        showToast('Failed to load issues table', true);
    }
}

async function fetchGlobalActivity() {
    if (!currentProjectId) return;
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/activity`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const logs = await res.json();
        
        const list = document.getElementById('global-activity-list');
        list.innerHTML = '';
        
        if (!logs || logs.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);">No activity logs found for this project yet.</div>';
            return;
        }
        
        logs.forEach(log => {
            let icon = '<i class="fas fa-circle"></i>';
            if (log.action.includes('CREATED')) icon = '<i class="fas fa-plus text-green"></i>';
            if (log.action.includes('STATUS')) icon = '<i class="fas fa-random text-blue"></i>';
            if (log.action.includes('COMMENT')) icon = '<i class="fas fa-comment text-yellow"></i>';
            
            list.innerHTML += `
                <div class="activity-item" style="padding: 1rem; border-bottom: 1px solid var(--bg-surface-border);">
                    <div class="activity-icon" style="font-size: 1.2rem; margin-right: 1rem;">${icon}</div>
                    <div class="activity-content">
                        <strong style="color:var(--primary)">${log.userName || 'System'}</strong> ${log.details}
                        <div class="activity-time">${new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
    } catch(err) {
        showToast('Failed to load global activity', true);
    }
}

async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const user = await res.json();
        document.getElementById('settings-email').value = user.email;
        document.getElementById('settings-name').value = user.fullName;
    } catch (err) {
        showToast('Failed to load settings', true);
    }
}

async function handleUpdateSettings(e) {
    e.preventDefault();
    const newName = document.getElementById('settings-name').value;
    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify({ fullName: newName })
        });
        if (!res.ok) throw new Error('Failed to update settings');
        const data = await res.json();
        saveAuth(data);
        showToast('Settings updated successfully!');
        
        document.getElementById('user-greeting').innerText = currentUser;
        document.getElementById('user-avatar').innerText = currentUser.charAt(0).toUpperCase();
    } catch(err) {
        showToast(err.message, true);
    }
}

function openDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.remove('hidden');
}

function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.add('hidden');
    document.getElementById('delete-account-form').reset();
}

async function handleDeleteAccount(e) {
    e.preventDefault();
    const password = document.getElementById('delete-account-password').value;

    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ password })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to delete account');
        }

        closeDeleteAccountModal();
        showToast('Account permanently deleted');
        
        setTimeout(() => {
            handleLogout();
        }, 1500);

    } catch (err) {
        showToast(err.message, true);
    }
}

// ==============================
// CREATE ISSUE MODAL
// ==============================
function openNewIssueModal() {
    document.getElementById('issue-modal').classList.remove('hidden');
}

function closeNewIssueModal() {
    document.getElementById('issue-modal').classList.add('hidden');
    document.getElementById('issue-form').reset();
}

async function handleCreateIssue(e) {
    e.preventDefault();
    const issueData = {
        title: document.getElementById('issue-title').value,
        description: document.getElementById('issue-desc').value,
        priority: document.getElementById('issue-priority').value,
        severity: document.getElementById('issue-severity').value
    };

    if (!currentProjectId) {
        showToast('Please select a project first', true);
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/issues`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(issueData)
        });

        if (!res.ok) throw new Error('Failed to create issue');
        
        showToast('Issue created successfully!');
        closeNewIssueModal();
        fetchIssues(); // Refresh list
    } catch (err) {
        showToast(err.message, true);
    }
}


// ==============================
// ISSUE DETAILS MODAL & WIRING
// ==============================
async function openDetailsModal(id) {
    currentIssueId = id;
    detailsModal.classList.remove('hidden');
    document.getElementById('detail-header-id').innerHTML = `<i class="fas fa-ticket-alt"></i> DEV-${id}`;
    
    // Fetch issue details
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/issues/${id}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Failed to load issue');
        const issue = await res.json();
        
        // Populate basic details
        document.getElementById('detail-title').innerText = issue.title;
        document.getElementById('detail-desc').innerText = issue.description;
        document.getElementById('detail-status').value = issue.status;
        
        const initials = issue.createdByName ? issue.createdByName.substring(0, 2).toUpperCase() : 'U';
        document.getElementById('detail-reporter').innerHTML = `<div class="avatar small">${initials}</div> ${issue.createdByName || 'Unknown'}`;
        
        // Tags
        document.getElementById('detail-tags').innerHTML = `
            <span class="chip bg-${getPriorityColor(issue.priority)} text-${getPriorityColor(issue.priority)}">
                ${getPriorityIcon(issue.priority)} Priority: ${issue.priority}
            </span>
            <span class="chip bg-surface border">
                <i class="fas fa-exclamation-triangle"></i> Severity: ${issue.severity}
            </span>
        `;
        
        // Render Stepper
        renderStepper(issue.status);
        
        // Parallel fetch for comments and activity
        fetchComments(id);
        fetchActivityLogs(id);
        
    } catch (err) {
        showToast(err.message, true);
        closeDetailsModal();
    }
}

function closeDetailsModal() {
    detailsModal.classList.add('hidden');
    currentIssueId = null;
    // Clear out
    document.getElementById('detail-comments').innerHTML = '';
    document.getElementById('detail-activity').innerHTML = '';
}

// Status Updates
async function handleStatusChange(newStatus) {
    if (!currentIssueId) return;
    
    try {
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/issues/${currentIssueId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!res.ok) throw new Error('Failed to update status');
        showToast(`Status updated to ${newStatus}`);
        
        // Render updated stepper visually immediately
        renderStepper(newStatus);
        
        // Refresh board and logs
        fetchIssues();
        fetchActivityLogs(currentIssueId);
    } catch(err) {
        showToast(err.message, true);
    }
}

// Stepper rendering
function renderStepper(currentStatus) {
    const steps = [
        { key: 'OPEN', label: 'Open', icon: 'fa-circle-notch' },
        { key: 'IN_PROGRESS', label: 'In Progress', icon: 'fa-spinner' },
        { key: 'TESTING', label: 'Testing', icon: 'fa-vial' },
        { key: 'RESOLVED', label: 'Resolved', icon: 'fa-check' }
    ];
    
    // determine active index
    let activeIndex = steps.findIndex(s => s.key === currentStatus);
    if (currentStatus === 'CLOSED') activeIndex = 3; // Treat closed as resolved for stepper
    if (activeIndex === -1) activeIndex = 0;
    
    let stepperHtml = '';
    steps.forEach((step, index) => {
        const isActive = index <= activeIndex ? 'active' : '';
        stepperHtml += `
            <div class="step ${isActive}">
                <div class="step-icon"><i class="fas ${step.icon}"></i></div>
                <div class="step-label">${step.label}</div>
            </div>
        `;
    });
    
    document.getElementById('detail-stepper').innerHTML = stepperHtml;
}

// Comments
async function fetchComments(issueId) {
    try {
        const res = await fetch(`${API_BASE}/issues/${issueId}/comments`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const comments = await res.json();
        
        const commentsDiv = document.getElementById('detail-comments');
        commentsDiv.innerHTML = '';
        
        if (comments.length === 0) {
            commentsDiv.innerHTML = '<p class="text-muted" style="font-size:0.9rem">No comments yet.</p>';
            return;
        }

        comments.forEach(comment => {
            const initials = comment.userName ? comment.userName.substring(0, 2).toUpperCase() : 'U';
            commentsDiv.innerHTML += `
                <div class="comment">
                    <div class="comment-avatar">
                        <div class="avatar small">${initials}</div>
                    </div>
                    <div class="comment-body">
                        <div class="comment-meta">
                            <span class="author">${comment.userName}</span>
                            <span class="time">${new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="comment-text">${comment.content}</div>
                    </div>
                </div>
            `;
        });
    } catch(err) {
        document.getElementById('detail-comments').innerHTML = '<p class="text-red">Failed to load comments</p>';
    }
}

async function handleAddComment(e) {
    e.preventDefault();
    if (!currentIssueId) return;
    
    const input = document.getElementById('new-comment');
    const content = input.value.trim();
    if (!content) return;
    
    try {
        const res = await fetch(`${API_BASE}/issues/${currentIssueId}/comments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ content })
        });
        
        if (!res.ok) throw new Error('Failed to add comment');
        
        input.value = '';
        showToast('Comment added');
        
        // Refresh comments and activity timeline
        fetchComments(currentIssueId);
        fetchActivityLogs(currentIssueId);
    } catch(err) {
        showToast(err.message, true);
    }
}

// Activity Logs
async function fetchActivityLogs(issueId) {
    try {
        const res = await fetch(`${API_BASE}/issues/${issueId}/logs`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const logs = await res.json();
        
        const logsDiv = document.getElementById('detail-activity');
        logsDiv.innerHTML = '';
        
        if (logs.length === 0) {
            logsDiv.innerHTML = '<p class="text-muted" style="font-size:0.8rem">No activity.</p>';
            return;
        }

        logs.forEach(log => {
            let icon = '<i class="fas fa-circle"></i>';
            if (log.action.includes('CREATED')) icon = '<i class="fas fa-plus text-green"></i>';
            if (log.action.includes('STATUS')) icon = '<i class="fas fa-random text-blue"></i>';
            if (log.action.includes('COMMENT')) icon = '<i class="fas fa-comment text-yellow"></i>';
            
            logsDiv.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <strong>${log.userName || 'System'}</strong> ${log.details}
                        <div class="activity-time">${new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
    } catch(err) {
        document.getElementById('detail-activity').innerHTML = '<p class="text-red">Failed to load logs</p>';
    }
}

// Start app
init();
