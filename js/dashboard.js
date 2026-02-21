/* ===================================================
   RMS - Dashboard JavaScript
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Auth Guard ─────────────────────────────────
    if (typeof api === 'undefined') {
        console.error('API helper not loaded! Redirecting to auth...');
        window.location.href = 'auth.html';
        return;
    }

    const isAdmin = window.location.pathname.includes('admin-dashboard');
    const user = api.requireAuth(isAdmin ? 'admin' : 'user');
    if (!user) return; // redirected

    // ─── Update User Display ────────────────────────
    const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
    document.querySelectorAll('.sidebar-avatar, .topbar-avatar').forEach(el => el.textContent = initials.toUpperCase());
    document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = `${user.first_name} ${user.last_name}`);
    document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = user.role === 'admin' ? 'Administrator' : 'Member');
    document.querySelectorAll('.topbar-user > span').forEach(el => el.textContent = user.first_name);


    // ─── Sidebar Toggle ─────────────────────────────
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            toggleOverlay(sidebar.classList.contains('mobile-open'));
        });
    }

    function toggleOverlay(show) {
        let overlay = document.querySelector('.sidebar-overlay');
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay active';
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('mobile-open');
                    toggleOverlay(false);
                });
                document.body.appendChild(overlay);
            } else {
                overlay.classList.add('active');
            }
        } else if (overlay) {
            overlay.classList.remove('active');
        }
    }


    // ─── Section Navigation ─────────────────────────
    const navLinks = document.querySelectorAll('.nav-list-link');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            switchSection(targetSection);

            if (sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                toggleOverlay(false);
            }
        });
    });

    function switchSection(sectionName) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionName);
        });

        sections.forEach(section => {
            section.classList.remove('active');
        });

        const target = document.getElementById(`section-${sectionName}`);
        if (target) {
            target.classList.add('active');
            target.scrollTop = 0;
        }
    }

    window.navigateTo = function(sectionName) {
        switchSection(sectionName);
    };


    // ─── Modals ─────────────────────────────────────
    window.showAdminModal = function(type) {
        const modalMap = {
            'addResource': 'addResourceModal',
            'addUser': 'addUserModal'
        };
        const modalId = modalMap[type];
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                // Ensure categories are loaded for add resource modal
                if (type === 'addResource') {
                    const resCategory = document.getElementById('resCategory');
                    if (resCategory && resCategory.options.length <= 1) {
                        loadAdminCategories();
                    }
                }
                modal.classList.add('show');
            }
        }
    };

    window.showCustomerModal = function(type) {
        const modalMap = {
            'requestResource': 'requestResourceModal'
        };
        const modalId = modalMap[type];
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('show');
        }
    };

    window.closeAdminModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    };

    window.closeCustomerModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    };

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });


    // ─── Logout ─────────────────────────────────────
    // Logout is handled via onclick="api.logout()" in HTML
    // No need for event listener since api.logout() is called directly


    // ═══════════════════════════════════════════════
    //  ADMIN DASHBOARD
    // ═══════════════════════════════════════════════

    if (isAdmin) {
        loadAdminOverview().catch(err => console.error('Failed to load admin overview:', err));
        loadAdminResources().catch(err => console.error('Failed to load admin resources:', err));
        loadAdminUsers().catch(err => console.error('Failed to load admin users:', err));
        loadAdminRequests().catch(err => console.error('Failed to load admin requests:', err));
        setupAdminForms();
        loadAdminCategories();
    }


    // ═══════════════════════════════════════════════
    //  CUSTOMER DASHBOARD
    // ═══════════════════════════════════════════════

    if (!isAdmin) {
        loadCustomerOverview().catch(err => console.error('Failed to load customer overview:', err));
        loadBrowseResources().catch(err => console.error('Failed to browse resources:', err));
        loadMyResources().catch(err => console.error('Failed to load my resources:', err));
        loadMyRequests().catch(err => console.error('Failed to load my requests:', err));
        setupCustomerForms();
    }


    // ═══════════════════ ADMIN FUNCTIONS ═══════════════

    async function loadAdminOverview() {
        try {
            const data = await api.getAdminStats();
            
            // Update stat cards
            const statValues = document.querySelectorAll('#section-overview .stat-card-value');
            if (statValues[0]) statValues[0].textContent = data.data.resources?.total_resources ?? 0;
            if (statValues[1]) statValues[1].textContent = data.data.users?.total ?? 0;
            if (statValues[2]) statValues[2].textContent = data.data.requests?.pending ?? 0;
            
            const totalRes = data.data.resources?.total_resources || 1;
            const available = data.data.resources?.available_count || 0;
            if (statValues[3]) {
                const utilization = ((totalRes - available) / totalRes * 100).toFixed(1);
                statValues[3].textContent = utilization + '%';
            }

            // Recent activity
            const actList = document.querySelector('#section-overview .activity-list');
            if (actList && data.data.recent_activity?.length) {
                actList.innerHTML = data.data.recent_activity.map(a => `
                    <div class="activity-item">
                        <div class="activity-icon"><i class="fas fa-circle-dot"></i></div>
                        <div class="activity-info">
                            <p><strong>${a.first_name || 'System'}</strong> ${a.action.replace(/_/g, ' ')}</p>
                            <span>${formatDate(a.created_at)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (e) {
            console.error('Admin overview error:', e);
            showToast('Failed to load dashboard data', 'error');
        }
    }

    async function loadAdminResources(page = 1) {
        try {
            const search = document.getElementById('resourceSearch')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            
            const data = await api.getAllResources({ 
                search, 
                category,
                page, 
                limit: 10 
            });
            
            const tbody = document.querySelector('#section-resources .data-table tbody');
            if (!tbody) return;
            
            if (data.data.resources.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray);">No resources found</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.resources.map(r => `
                <tr data-id="${r.id}">
                    <td><input type="checkbox"></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="topbar-avatar" style="width:32px;height:32px;font-size:12px;">${(r.owner_first_name?.[0] || '') + (r.owner_last_name?.[0] || '')}</div>
                            <div>
                                <strong>${r.title}</strong><br>
                                <small style="color:var(--gray)">by ${r.owner_first_name} ${r.owner_last_name}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="category-badge ${r.category_slug || 'books'}">${r.category_name}</span></td>
                    <td><span class="status-badge ${r.availability}">${r.availability}</span></td>
                    <td><span class="status-badge ${r.is_verified ? 'available' : 'pending'}">${r.is_verified ? 'Verified' : 'Pending'}</span></td>
                    <td>${formatDate(r.created_at)}</td>
                    <td>
                        <button class="action-btn ${r.is_verified ? 'reject' : 'approve'}" title="${r.is_verified ? 'Unverify' : 'Verify'}" onclick="toggleVerifyResource(${r.id}, ${!r.is_verified})">
                            <i class="fas fa-${r.is_verified ? 'times' : 'check'}"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteResource(${r.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            const info = document.querySelector('#section-resources .pagination-info');
            if (info) info.textContent = `Showing ${(page - 1) * 10 + 1}-${Math.min(page * 10, data.data.total)} of ${data.data.total}`;
        } catch (e) {
            console.error('Load resources error:', e);
        }
    }

    window.toggleVerifyResource = async function(id, is_verified) {
        try {
            // Use the resources verify endpoint
            await api.put(`/resources/${id}/verify`, { is_verified });
            showToast(is_verified ? 'Resource verified' : 'Resource unverified');
            loadAdminResources();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    window.deleteResource = async function(id) {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await api.deleteResource(id);
            showToast('Resource deleted');
            loadMyResources();
            loadAdminResources();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    window.editResource = function(id) {
        showToast('Edit feature coming soon!', 'error');
        // TODO: Implement edit resource modal
    };

    async function loadAdminUsers(page = 1) {
        try {
            const data = await api.getUsers({ page, limit: 10 });
            const tbody = document.querySelector('#section-users .data-table tbody');
            if (!tbody) return;
            
            if (data.data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray);">No users found</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.users.map(u => `
                <tr data-id="${u.id}">
                    <td><input type="checkbox"></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="topbar-avatar" style="width:32px;height:32px;font-size:12px;">${(u.first_name?.[0] || '') + (u.last_name?.[0] || '')}</div>
                            <div>
                                <strong>${u.first_name} ${u.last_name}</strong><br>
                                <small style="color:var(--gray)">${u.email}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="role-badge ${u.role}">${u.role}</span></td>
                    <td>${u.department || '—'}</td>
                    <td><span class="status-badge ${u.is_verified ? 'available' : 'pending'}">${u.is_verified ? 'Verified' : 'Pending'}</span></td>
                    <td>${formatDate(u.created_at)}</td>
                    <td>
                        ${u.role !== 'admin' ? `
                            <button class="action-btn ${u.is_verified ? 'reject' : 'approve'}" title="${u.is_verified ? 'Unverify' : 'Verify'}" onclick="toggleVerifyUser(${u.id}, ${!u.is_verified})">
                                <i class="fas fa-${u.is_verified ? 'times' : 'check'}"></i>
                            </button>
                            <button class="action-btn ${u.is_blocked ? 'approve' : 'reject'}" title="${u.is_blocked ? 'Unblock' : 'Block'}" onclick="toggleBlockUser(${u.id}, ${!u.is_blocked})">
                                <i class="fas fa-${u.is_blocked ? 'check' : 'ban'}"></i>
                            </button>
                        ` : '<span style="color:var(--gray);font-size:12px;">Admin</span>'}
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Load users error:', e);
        }
    }

    window.toggleVerifyUser = async function(id, is_verified) {
        try {
            await api.verifyUser(id, is_verified);
            showToast(is_verified ? 'User verified' : 'User unverified');
            loadAdminUsers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    window.toggleBlockUser = async function(id, is_blocked) {
        try {
            await api.blockUser(id, is_blocked);
            showToast(is_blocked ? 'User blocked' : 'User unblocked');
            loadAdminUsers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    async function loadAdminRequests() {
        try {
            const data = await api.getRequests({ limit: 50 });
            const counts = await api.getRequestCounts();

            const statNums = document.querySelectorAll('#section-requests .request-stat-number');
            if (statNums[0]) statNums[0].textContent = counts.data?.pending ?? 0;
            if (statNums[1]) statNums[1].textContent = counts.data?.approved ?? 0;
            if (statNums[2]) statNums[2].textContent = counts.data?.rejected ?? 0;
            if (statNums[3]) statNums[3].textContent = counts.data?.total ?? 0;

            const list = document.querySelector('#section-requests .requests-list');
            if (!list) return;
            
            if (data.data.requests.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">No requests found.</p>';
                return;
            }
            
            list.innerHTML = data.data.requests.map(r => `
                <div class="request-card" data-id="${r.id}">
                    <div class="request-card-header">
                        <div class="request-card-user">
                            <div class="topbar-avatar" style="width:36px;height:36px;font-size:12px;">${(r.requester_first_name || '?').charAt(0)}${(r.requester_last_name || '').charAt(0)}</div>
                            <div>
                                <strong>${r.requester_first_name} ${r.requester_last_name}</strong>
                                <span>${r.requester_email}</span>
                            </div>
                        </div>
                        <span class="status-badge ${r.status}">${r.status}</span>
                    </div>
                    <div class="request-card-body">
                        <h4><i class="fas fa-cube"></i> ${r.resource_title}</h4>
                    </div>
                    <div class="request-reason">${r.message || 'No message provided'}</div>
                    ${r.duration ? `<div style="font-size:12px;color:var(--gray);margin-top:8px;"><i class="far fa-clock"></i> Duration: ${r.duration}</div>` : ''}
                    <div class="request-card-footer">
                        <span><i class="far fa-clock"></i> ${formatDate(r.requested_at)}</span>
                        <div class="request-actions">
                            ${r.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="approveReq(${r.id})"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="rejectReq(${r.id})"><i class="fas fa-times"></i> Reject</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Load requests error:', e);
        }
    }

    window.approveReq = async function(id) {
        try {
            await api.approveRequest(id);
            showToast('Request approved');
            loadAdminRequests();
            loadAdminOverview();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    window.rejectReq = async function(id) {
        try {
            await api.rejectRequest(id);
            showToast('Request rejected');
            loadAdminRequests();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    function setupAdminForms() {
        // Add Resource Form
        const addResourceForm = document.getElementById('addResourceForm');
        if (addResourceForm) {
            addResourceForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get form values
                const categoryId = document.getElementById('resCategory').value;
                const title = document.getElementById('resName').value.trim();
                const description = document.getElementById('resDescription').value.trim();
                const condition = document.getElementById('resCondition')?.value || 'good';
                const location = document.getElementById('resLocation')?.value.trim() || '';
                const contactInfo = document.getElementById('resContact')?.value.trim() || '';

                // Validate
                if (!categoryId) {
                    showToast('Please select a category', 'error');
                    return;
                }

                if (!title) {
                    showToast('Please enter a resource name', 'error');
                    return;
                }

                const formData = {
                    category_id: parseInt(categoryId),
                    title: title,
                    description: description,
                    condition: condition,
                    location: location,
                    contact_info: contactInfo
                };

                try {
                    const response = await api.createResource(formData);
                    showToast('Resource added successfully');
                    closeAdminModal('addResourceModal');
                    addResourceForm.reset();
                    // Reload resources to show the new one
                    loadAdminResources();
                    // Also reload overview to update stats
                    loadAdminOverview();
                } catch (e) {
                    showToast(e.message || 'Failed to add resource', 'error');
                }
            });
        }
    }

    async function loadAdminCategories() {
        try {
            const response = await api.getCategories();
            const categories = response.data?.categories || [];
            
            const categoryFilter = document.getElementById('categoryFilter');
            const resCategory = document.getElementById('resCategory');
            
            if (categoryFilter && categories.length > 0) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
                    categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
            }
            
            if (resCategory && categories.length > 0) {
                resCategory.innerHTML = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    }


    // ═══════════════════ CUSTOMER FUNCTIONS ═══════════════

    async function loadCustomerOverview() {
        try {
            // Update welcome message with logged-in user's name
            const welcomeEl = document.getElementById('welcomeUserName');
            if (welcomeEl) {
                welcomeEl.textContent = user.first_name || 'there';
            }

            // Load stats
            const stats = await api.getResourceStats();
            const counts = await api.getRequestCounts();

            const statValues = document.querySelectorAll('#section-overview .stat-card-value');
            if (statValues[0]) statValues[0].textContent = stats.data?.total_resources ?? 0;
            if (statValues[1]) statValues[1].textContent = counts.data?.pending ?? 0;
            if (statValues[2]) statValues[2].textContent = counts.data?.approved ?? 0;
            if (statValues[3]) statValues[3].textContent = '—';

            // Load active resources for overview
            const resourcesList = document.getElementById('overviewActiveResources');
            if (resourcesList) {
                const myResources = await api.getMyResources();
                if (myResources.data?.resources?.length > 0) {
                    resourcesList.innerHTML = myResources.data.resources.slice(0, 4).map(r => `
                        <div class="resource-list-item">
                            <div class="resource-item-icon ${r.category_slug || 'hardware'}"><i class="fas fa-${r.category_slug === 'software' ? 'palette' : r.category_slug === 'license' ? 'key' : 'laptop'}"></i></div>
                            <div class="resource-item-info">
                                <strong>${r.title}</strong>
                                <span>${r.category_name} • Assigned ${formatDate(r.created_at)}</span>
                            </div>
                            <span class="status-badge ${r.availability}">${r.availability}</span>
                        </div>
                    `).join('');
                } else {
                    resourcesList.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">No active resources</p>';
                }
            }

            // Load recent activity (from requests)
            const activityList = document.getElementById('overviewRecentActivity');
            if (activityList) {
                const sentRequests = await api.getSentRequests();
                if (sentRequests.data?.requests?.length > 0) {
                    activityList.innerHTML = sentRequests.data.requests.slice(0, 4).map(r => `
                        <div class="notification-item ${r.status === 'pending' ? 'unread' : ''}">
                            <div class="notification-dot"></div>
                            <div class="notification-content">
                                <p>Your request for <strong>${r.resource_title}</strong> is ${r.status}.</p>
                                <span>${formatDate(r.requested_at)}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    activityList.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">No recent activity</p>';
                }
            }

            // Load categories dynamically for filter dropdown
            await loadCategories();
        } catch (e) {
            console.error('Customer overview error:', e);
            // Still try to load categories even if other things fail
            await loadCategories();
        }
    }

    // Load categories for filter dropdowns
    async function loadCategories() {
        try {
            const response = await api.getCategories();
            const categories = response.data?.categories || [];
            
            const browseCategory = document.getElementById('browseCategory');
            if (browseCategory && categories.length > 0) {
                // Keep the "All Categories" option
                browseCategory.innerHTML = '<option value="">All Categories</option>' + 
                    categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    }

    async function loadBrowseResources(page = 1) {
        try {
            const search = document.getElementById('browseSearch')?.value || '';
            const category = document.getElementById('browseCategory')?.value || '';
            
            const data = await api.getAvailableResources({ search, category, page, limit: 12 });
            const grid = document.querySelector('#section-browse .resources-grid');
            if (!grid) return;
            
            if (data.data.resources.length === 0) {
                grid.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;grid-column:1/-1;">No resources available at the moment.</p>';
                return;
            }
            
            grid.innerHTML = data.data.resources.map(r => `
                <div class="resource-card" data-id="${r.id}">
                    <div class="resource-card-header">
                        <span class="category-badge ${r.category_slug || 'hardware'}">${r.category_name}</span>
                        <span class="status-badge ${r.availability}">${r.availability}</span>
                    </div>
                    <div class="resource-card-body">
                        <h4>${r.title}</h4>
                        <p>${r.description || 'No description provided'}</p>
                        <div class="resource-meta">
                            <span><i class="fas fa-user"></i> ${r.owner_first_name} ${r.owner_last_name}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${r.location || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="resource-card-footer">
                        <span style="font-size:12px;color:var(--gray);">${formatDate(r.created_at)}</span>
                        <button class="btn btn-primary btn-sm" onclick="requestResource(${r.id})">
                            <i class="fas fa-paper-plane"></i> Request
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Load browse resources error:', e);
        }
    }

    async function loadMyResources() {
        try {
            const data = await api.getMyResources();
            const tbody = document.querySelector('#section-my-resources .data-table tbody');
            if (!tbody) return;
            
            if (data.data.resources.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray);">You haven\'t listed any resources yet.</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.resources.map(r => `
                <tr data-id="${r.id}">
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="topbar-avatar" style="width:32px;height:32px;font-size:12px;">${(r.owner_first_name?.[0] || '') + (r.owner_last_name?.[0] || '')}</div>
                            <div>
                                <strong>${r.title}</strong><br>
                                <small style="color:var(--gray)">${r.category_name}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="status-badge ${r.availability}">${r.availability}</span></td>
                    <td><span class="status-badge ${r.is_verified ? 'available' : 'pending'}">${r.is_verified ? 'Verified' : 'Pending'}</span></td>
                    <td>${r.location || 'N/A'}</td>
                    <td>${formatDate(r.created_at)}</td>
                    <td>
                        <button class="action-btn edit" title="Edit" onclick="editResource(${r.id})"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" title="Delete" onclick="deleteResource(${r.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Load my resources error:', e);
        }
    }

    async function loadMyRequests() {
        try {
            const sent = await api.getSentRequests();
            const received = await api.getReceivedRequests();
            const counts = await api.getRequestCounts();

            // Update request counts from API
            const pendingEl = document.getElementById('statPendingRequests');
            const approvedEl = document.getElementById('statApprovedRequests');
            const rejectedEl = document.getElementById('statRejectedRequests');
            const totalEl = document.getElementById('statTotalRequests');

            if (pendingEl) pendingEl.textContent = counts.data?.pending ?? 0;
            if (approvedEl) approvedEl.textContent = counts.data?.approved ?? 0;
            if (rejectedEl) rejectedEl.textContent = counts.data?.rejected ?? 0;
            if (totalEl) totalEl.textContent = counts.data?.total ?? 0;

            // Show received requests for resource owners (when others request your resources)
            const list = document.querySelector('#section-my-requests .requests-list');
            if (list) {
                if (received.data.requests.length === 0) {
                    list.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">No requests for your resources yet.</p>';
                } else {
                    list.innerHTML = received.data.requests.map(r => `
                        <div class="request-card" data-id="${r.id}">
                            <div class="request-card-header">
                                <div class="request-card-user">
                                    <div class="topbar-avatar" style="width:36px;height:36px;font-size:12px;">${(r.requester_first_name || '?').charAt(0)}${(r.requester_last_name || '').charAt(0)}</div>
                                    <div>
                                        <strong>${r.requester_first_name} ${r.requester_last_name}</strong>
                                        <span>${r.requester_email}</span>
                                    </div>
                                </div>
                                <span class="status-badge ${r.status}">${r.status}</span>
                            </div>
                            <div class="request-card-body">
                                <h4><i class="fas fa-cube"></i> ${r.resource_title}</h4>
                            </div>
                            <div class="request-reason">${r.message || 'No message provided'}</div>
                            <div class="request-card-footer">
                                <span><i class="far fa-clock"></i> ${formatDate(r.requested_at)}</span>
                                <div class="request-actions">
                                    ${r.status === 'pending' ? `
                                        <button class="btn btn-success btn-sm" onclick="approveReq(${r.id})"><i class="fas fa-check"></i> Approve</button>
                                        <button class="btn btn-danger btn-sm" onclick="rejectReq(${r.id})"><i class="fas fa-times"></i> Reject</button>
                                    ` : r.status === 'approved' ? `
                                        <button class="btn btn-secondary btn-sm" disabled><i class="fas fa-check"></i> Approved</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {
            console.error('Load my requests error:', e);
            const list = document.querySelector('#section-my-requests .requests-list');
            if (list) {
                list.innerHTML = `<p style="text-align:center;color:var(--danger);padding:40px;">Error loading requests: ${e.message}</p>`;
            }
        }
    }

    window.requestResource = function(id) {
        // Store resource ID for the form
        localStorage.setItem('request_resource_id', id);
        showCustomerModal('requestResource');
    };

    function setupCustomerForms() {
        // Request Resource Form
        const requestForm = document.getElementById('requestResourceForm');
        if (requestForm) {
            requestForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const resourceId = localStorage.getItem('request_resource_id');
                if (!resourceId) {
                    showToast('Please select a resource', 'error');
                    return;
                }
                
                const formData = {
                    resource_id: parseInt(resourceId),
                    message: document.getElementById('reqReason').value.trim(),
                    duration: document.getElementById('reqNeededBy').value || 'Not specified'
                };

                try {
                    await api.createRequest(formData);
                    showToast('Request sent successfully');
                    closeCustomerModal('requestResourceModal');
                    requestForm.reset();
                    loadMyRequests();
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        }

        // Add Resource Form (for customers to list items)
        const addResourceForm = document.getElementById('addResourceForm');
        if (addResourceForm) {
            addResourceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    category_id: parseInt(document.getElementById('resCategory').value),
                    title: document.getElementById('resName').value.trim(),
                    description: document.getElementById('resDescription').value.trim(),
                    condition: document.getElementById('resCondition').value,
                    location: document.getElementById('resLocation').value.trim(),
                    contact_info: document.getElementById('resContact').value.trim()
                };

                try {
                    await api.createResource(formData);
                    showToast('Resource listed successfully! It will appear after admin verification.');
                    closeCustomerModal('addResourceModal');
                    addResourceForm.reset();
                    loadMyResources();
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        }
    }

    // Search/filter handlers
    const browseSearch = document.getElementById('browseSearch');
    const browseCategory = document.getElementById('browseCategory');
    if (browseSearch) browseSearch.addEventListener('input', () => loadBrowseResources());
    if (browseCategory) browseCategory.addEventListener('change', () => loadBrowseResources());


    // ═══════════════════ UTILITIES ═══════════════════

    function formatDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            background:${type === 'success' ? 'var(--success)' : 'var(--danger)'};
            color:#fff;
            padding:12px 24px;
            border-radius:8px;
            z-index:10000;
            font-size:14px;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
            transition:opacity 0.3s;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    }

});
