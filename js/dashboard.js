/* ===================================================
   ResourceHub - Dashboard JavaScript
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Auth Guard ─────────────────────────────────
    const isAdmin = window.location.pathname.includes('admin-dashboard');
    const user = api.requireAuth(isAdmin ? 'admin' : 'customer');
    if (!user) return; // redirected

    // ─── Update User Display ────────────────────────
    const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
    document.querySelectorAll('.sidebar-avatar, .topbar-avatar').forEach(el => el.textContent = initials.toUpperCase());
    document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = `${user.first_name} ${user.last_name}`);
    document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = user.role === 'admin' ? 'Administrator' : 'Customer');
    document.querySelectorAll('.topbar-user > span').forEach(el => el.textContent = user.first_name);


    // ─── Sidebar Toggle ─────────────────────────────
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Save preference
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            toggleOverlay(sidebar.classList.contains('mobile-open'));
        });
    }

    // Overlay for mobile sidebar
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

            // Close mobile menu
            if (sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                toggleOverlay(false);
            }
        });
    });

    function switchSection(sectionName) {
        // Update nav links
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionName);
        });

        // Update sections
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const target = document.getElementById(`section-${sectionName}`);
        if (target) {
            target.classList.add('active');
            // Scroll to top
            target.scrollTop = 0;
        }
    }

    // Expose navigateTo globally
    window.navigateTo = function (sectionName) {
        switchSection(sectionName);
    };


    // ─── Chart Filter Buttons ───────────────────────
    document.querySelectorAll('.chart-filter').forEach(filter => {
        const buttons = filter.querySelectorAll('.chart-filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Animate bars with random data
                animateBars();
            });
        });
    });

    function animateBars() {
        const bars = document.querySelectorAll('.bar-chart .bar');
        bars.forEach(bar => {
            const newHeight = Math.floor(Math.random() * 70) + 20;
            bar.style.height = newHeight + '%';
            bar.dataset.value = newHeight;
        });
    }


    // ─── Select All Checkboxes ──────────────────────
    document.querySelectorAll('.select-all').forEach(selectAll => {
        selectAll.addEventListener('change', () => {
            const table = selectAll.closest('table');
            if (table) {
                const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = selectAll.checked;
                });
            }
        });
    });


    // ─── Admin Modals ───────────────────────────────
    window.showAdminModal = function (type) {
        const modalMap = {
            'addResource': 'addResourceModal',
            'addUser': 'addUserModal'
        };
        const modalId = modalMap[type];
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('show');
        }
    };

    window.closeAdminModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    };


    // ─── Customer Modals ────────────────────────────
    window.showCustomerModal = function (type) {
        const modalMap = {
            'requestResource': 'requestResourceModal'
        };
        const modalId = modalMap[type];
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('show');
        }
    };

    window.closeCustomerModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    };


    // ─── Close Modals on Overlay Click ──────────────
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });


    // ─── Table Search Filtering ─────────────────────
    // NOTE: search/filter event listeners are attached below in the API DATA LOADING section


    // ─── Button Click Feedback ──────────────────────
    document.querySelectorAll('.btn-success, .btn-danger').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('.request-card');
            if (!card) return;

            const isApprove = this.classList.contains('btn-success');
            const statusBadge = card.querySelector('.status-badge');

            if (isApprove) {
                if (statusBadge) {
                    statusBadge.textContent = 'Approved';
                    statusBadge.className = 'status-badge available';
                }
                this.innerHTML = '<i class="fas fa-check"></i> Approved';
                this.disabled = true;
                this.style.opacity = '0.6';
            } else {
                if (statusBadge) {
                    statusBadge.textContent = 'Rejected';
                    statusBadge.className = 'status-badge rejected';
                }
                this.innerHTML = '<i class="fas fa-times"></i> Rejected';
                this.disabled = true;
                this.style.opacity = '0.6';
            }

            // Disable the sibling button
            const sibling = isApprove
                ? card.querySelector('.btn-danger')
                : card.querySelector('.btn-success');
            if (sibling) {
                sibling.disabled = true;
                sibling.style.opacity = '0.4';
            }
        });
    });


    // ─── Save Changes Button Feedback ───────────────
    document.querySelectorAll('.settings-form .btn-primary').forEach(btn => {
        btn.addEventListener('click', function () {
            const original = this.textContent;
            this.textContent = 'Saved!';
            this.style.background = 'var(--success)';
            this.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';

            setTimeout(() => {
                this.textContent = original;
                this.style.background = '';
                this.style.boxShadow = '';
            }, 2000);
        });
    });


    // ─── Action Button Tooltips ─────────────────────
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const action = this.title;
            if (action === 'Delete') {
                const row = this.closest('tr');
                if (row && confirm('Are you sure you want to delete this item?')) {
                    row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(20px)';
                    setTimeout(() => row.remove(), 300);
                }
            }
            if (action === 'Return Resource') {
                const row = this.closest('tr');
                if (row && confirm('Are you sure you want to return this resource?')) {
                    const status = row.querySelector('.status-badge');
                    if (status) {
                        status.textContent = 'Returned';
                        status.className = 'status-badge maintenance';
                    }
                    this.disabled = true;
                    this.style.opacity = '0.4';
                }
            }
        });
    });


    // ─── Animate Progress Bars on View ──────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fills = entry.target.querySelectorAll('.progress-fill, .top-resource-fill');
                fills.forEach(fill => {
                    const width = fill.style.width;
                    fill.style.width = '0%';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            fill.style.width = width;
                        });
                    });
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.analytics-card').forEach(card => {
        observer.observe(card);
    });


    // ─── Page Button Active State ───────────────────
    document.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', function () {
            const controls = this.closest('.pagination-controls');
            if (controls) {
                controls.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
                if (!this.querySelector('i')) {
                    this.classList.add('active');
                }
            }
        });
    });


    // ═══════════════════════════════════════════════
    //  API DATA LOADING
    // ═══════════════════════════════════════════════

    function formatDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function statusClass(s) {
        const map = { available: 'available', 'in-use': 'in-use', maintenance: 'maintenance', pending: 'pending', approved: 'available', rejected: 'rejected', active: 'in-use', returned: 'maintenance' };
        return map[s] || 'pending';
    }

    function categoryClass(c) {
        const map = { hardware: 'hardware', software: 'software', license: 'license', equipment: 'equipment' };
        return map[c?.toLowerCase()] || 'hardware';
    }

    function showToast(msg, type = 'success') {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;top:20px;right:20px;background:${type === 'success' ? 'var(--success)' : 'var(--danger)'};color:#fff;padding:12px 24px;border-radius:8px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    }

    // ─── ADMIN: Load Dashboard ──────────────────────
    if (isAdmin) {
        loadAdminOverview();
        loadAdminResources();
        loadAdminUsers();
        loadAdminRequests();
        loadAdminAnalytics();
        setupAdminForms();
    }

    // ─── CUSTOMER: Load Dashboard ──────────────────
    if (!isAdmin) {
        loadCustomerOverview();
        loadBrowseResources();
        loadMyResources();
        loadMyRequests();
        loadCustomerProfile();
        setupCustomerForms();
    }

    // ═══════════════════ ADMIN LOADERS ═══════════════

    async function loadAdminOverview() {
        try {
            const data = await api.getAdminDashboard();
            const statValues = document.querySelectorAll('#section-overview .stat-card-value');
            if (statValues[0]) statValues[0].textContent = data.resources?.total ?? 0;
            if (statValues[1]) statValues[1].textContent = data.users?.total ?? 0;
            if (statValues[2]) statValues[2].textContent = data.requests?.pending ?? 0;
            if (statValues[3]) {
                const total = data.resources?.total || 1;
                const inUse = Number(data.resources?.in_use) || 0;
                statValues[3].textContent = ((inUse / total) * 100).toFixed(1) + '%';
            }
            // Recent activity
            const actList = document.querySelector('#section-overview .activity-list');
            if (actList && data.recentActivity?.length) {
                actList.innerHTML = data.recentActivity.map(a => `
                    <div class="activity-item">
                        <div class="activity-icon"><i class="fas fa-circle-dot"></i></div>
                        <div class="activity-info">
                            <p><strong>${a.user_name || 'System'}</strong> ${a.action.replace(/_/g, ' ')}</p>
                            <span>${formatDate(a.created_at)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (e) { console.error('Admin overview error:', e); }
    }

    async function loadAdminResources(page = 1) {
        try {
            const search = document.getElementById('resourceSearch')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            const status = document.getElementById('statusFilter')?.value || '';
            const data = await api.getResources({ search, category, status, page, limit: 10 });
            const tbody = document.querySelector('#section-resources .data-table tbody');
            if (!tbody) return;
            tbody.innerHTML = data.resources.map(r => `
                <tr data-id="${r.id}">
                    <td><input type="checkbox"></td>
                    <td>${r.name}</td>
                    <td><span class="category-badge ${categoryClass(r.category)}">${r.category}</span></td>
                    <td><span class="status-badge ${statusClass(r.status)}">${r.status}</span></td>
                    <td>${r.assigned_to_name || '—'}</td>
                    <td>$${Number(r.cost_per_unit || 0).toLocaleString()}</td>
                    <td>${formatDate(r.updated_at)}</td>
                    <td>
                        <button class="action-btn edit" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" title="Delete" onclick="deleteResource(${r.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
            // Pagination info
            const info = document.querySelector('#section-resources .pagination-info');
            if (info) info.textContent = `Showing ${(page - 1) * 10 + 1}-${Math.min(page * 10, data.total)} of ${data.total}`;
        } catch (e) { console.error('Load resources error:', e); }
    }

    // Hook up resource search & filters
    const resourceSearchInput = document.getElementById('resourceSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (resourceSearchInput) resourceSearchInput.addEventListener('input', () => loadAdminResources());
    if (categoryFilter) categoryFilter.addEventListener('change', () => loadAdminResources());
    if (statusFilter) statusFilter.addEventListener('change', () => loadAdminResources());

    window.deleteResource = async function (id) {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await api.deleteResource(id);
            showToast('Resource deleted');
            loadAdminResources();
        } catch (e) { showToast(e.message, 'error'); }
    };

    async function loadAdminUsers(page = 1) {
        try {
            const data = await api.getUsers({ page, limit: 10 });
            const tbody = document.querySelector('#section-users .data-table tbody');
            if (!tbody) return;
            tbody.innerHTML = data.users.map(u => `
                <tr data-id="${u.id}">
                    <td><input type="checkbox"></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="topbar-avatar" style="width:32px;height:32px;font-size:12px;">${(u.first_name?.[0] || '') + (u.last_name?.[0] || '')}</div>
                            <div><strong>${u.first_name} ${u.last_name}</strong><br><small style="color:var(--gray)">${u.email}</small></div>
                        </div>
                    </td>
                    <td><span class="role-badge ${u.role}">${u.role}</span></td>
                    <td>${u.company || '—'}</td>
                    <td><span class="status-badge ${u.status === 'active' ? 'available' : 'maintenance'}">${u.status}</span></td>
                    <td>${formatDate(u.created_at)}</td>
                    <td>
                        <button class="action-btn edit" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="action-btn delete" title="Delete" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) { console.error('Load users error:', e); }
    }

    window.deleteUser = async function (id) {
        if (!confirm('Delete this user?')) return;
        try {
            await api.deleteUser(id);
            showToast('User deleted');
            loadAdminUsers();
        } catch (e) { showToast(e.message, 'error'); }
    };

    async function loadAdminRequests() {
        try {
            const data = await api.getRequests({ limit: 50 });
            const counts = await api.getRequestCounts();

            const statNums = document.querySelectorAll('#section-requests .request-stat-number');
            if (statNums[0]) statNums[0].textContent = counts.pending ?? 0;
            if (statNums[1]) statNums[1].textContent = counts.approved ?? 0;
            if (statNums[2]) statNums[2].textContent = counts.rejected ?? 0;
            if (statNums[3]) statNums[3].textContent = counts.total ?? 0;

            const list = document.querySelector('#section-requests .requests-list');
            if (!list) return;
            if (data.requests.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">No requests found.</p>';
                return;
            }
            list.innerHTML = data.requests.map(r => `
                <div class="request-card" data-id="${r.id}">
                    <div class="request-card-header">
                        <div class="request-card-user">
                            <div class="topbar-avatar" style="width:36px;height:36px;font-size:12px;">${(r.user_name || '??').split(' ').map(n => n[0]).join('')}</div>
                            <div>
                                <strong>${r.user_name}</strong>
                                <span>${r.user_email}</span>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass(r.status)}">${r.status}</span>
                    </div>
                    <div class="request-card-body">
                        <h4><i class="fas fa-cube"></i> ${r.resource_name}</h4>
                        <span class="category-badge ${categoryClass(r.resource_category)}">${r.resource_category}</span>
                    </div>
                    <div class="request-reason">${r.reason}</div>
                    <div class="request-card-footer">
                        <span><i class="far fa-clock"></i> ${formatDate(r.created_at)}</span>
                        <div class="request-actions">
                            ${r.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="approveReq(${r.id})"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="rejectReq(${r.id})"><i class="fas fa-times"></i> Reject</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) { console.error('Load requests error:', e); }
    }

    window.approveReq = async function (id) {
        try {
            await api.approveRequest(id, '');
            showToast('Request approved');
            loadAdminRequests();
            loadAdminOverview();
        } catch (e) { showToast(e.message, 'error'); }
    };

    window.rejectReq = async function (id) {
        try {
            await api.rejectRequest(id, '');
            showToast('Request rejected');
            loadAdminRequests();
        } catch (e) { showToast(e.message, 'error'); }
    };

    async function loadAdminAnalytics() {
        try {
            const stats = await api.getResourceStats();
            const cost = await api.getCostOverview();

            // Resource utilization progress
            const progList = document.querySelector('#section-analytics .progress-list');
            if (progList && stats.categories?.length) {
                progList.innerHTML = stats.categories.map(c => {
                    const pct = stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0;
                    return `
                        <div class="progress-item">
                            <div class="progress-label"><span>${c.category}</span><span>${pct}%</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                        </div>
                    `;
                }).join('');
            }

            // Cost overview
            const costMetrics = document.querySelector('#section-analytics .cost-metrics');
            const totalCostEl = document.querySelector('#section-analytics .total-cost strong');
            if (costMetrics && cost.length) {
                let totalCost = 0;
                costMetrics.innerHTML = cost.map(c => {
                    totalCost += Number(c.total_cost || 0);
                    return `<div class="cost-item"><div class="cost-info"><span>${c.category}</span><strong>$${Number(c.total_cost).toLocaleString()}</strong></div></div>`;
                }).join('');
                if (totalCostEl) totalCostEl.textContent = '$' + totalCost.toLocaleString();
            }
        } catch (e) { console.error('Analytics error:', e); }
    }

    function setupAdminForms() {
        // Add Resource
        const addResBtn = document.getElementById('addResourceBtn');
        if (addResBtn) {
            addResBtn.addEventListener('click', async () => {
                const name = document.getElementById('resName').value.trim();
                const category = document.getElementById('resCategory').value;
                const status = document.getElementById('resStatus').value;
                const description = document.getElementById('resDescription').value.trim();
                const total_qty = parseInt(document.getElementById('resQty').value) || 1;
                const cost = parseFloat(document.getElementById('resCost').value) || 0;
                if (!name) return showToast('Resource name is required', 'error');
                try {
                    await api.createResource({ name, category, description, cost, total_qty, status });
                    showToast('Resource added');
                    closeAdminModal('addResourceModal');
                    document.getElementById('addResourceForm').reset();
                    loadAdminResources();
                    loadAdminOverview();
                } catch (e) { showToast(e.message, 'error'); }
            });
        }

        // Add User
        const createUserBtn = document.getElementById('createUserBtn');
        if (createUserBtn) {
            createUserBtn.addEventListener('click', async () => {
                const first_name = document.getElementById('userFirstName').value.trim();
                const last_name = document.getElementById('userLastName').value.trim();
                const email = document.getElementById('userEmail').value.trim();
                const password = document.getElementById('userPassword').value;
                const role = document.getElementById('userRole').value;
                const company = document.getElementById('userCompany').value.trim();
                if (!first_name || !last_name || !email || !password) return showToast('All fields required', 'error');
                try {
                    await api.createUser({ first_name, last_name, email, password, role, company });
                    showToast('User created');
                    closeAdminModal('addUserModal');
                    document.getElementById('addUserForm').reset();
                    loadAdminUsers();
                    loadAdminOverview();
                } catch (e) { showToast(e.message, 'error'); }
            });
        }
    }


    // ═══════════════════ CUSTOMER LOADERS ═══════════

    async function loadCustomerOverview() {
        try {
            const data = await api.getCustomerDashboard();
            const statValues = document.querySelectorAll('#section-overview .stat-card-value');
            if (statValues[0]) statValues[0].textContent = data.activeResources ?? 0;
            if (statValues[1]) statValues[1].textContent = data.requests?.pending ?? 0;
            if (statValues[2]) statValues[2].textContent = data.requests?.approved ?? 0;
            if (statValues[3]) statValues[3].textContent = data.nearestReturn ? formatDate(data.nearestReturn) : '—';

            // Active resources list
            const resList = document.querySelector('#section-overview .resource-list-compact');
            if (resList && data.allocations?.length) {
                resList.innerHTML = data.allocations.map(a => `
                    <div class="resource-list-item">
                        <div class="resource-item-info">
                            <strong>${a.resource_name}</strong>
                            <span>${a.resource_category}</span>
                        </div>
                        <span class="status-badge ${statusClass(a.status)}">${a.status}</span>
                    </div>
                `).join('');
            } else if (resList) {
                resList.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">No active resources</p>';
            }
        } catch (e) { console.error('Customer overview error:', e); }
    }

    async function loadBrowseResources() {
        try {
            const search = document.getElementById('browseSearch')?.value || '';
            const data = await api.getAvailableResources({ search });
            const resources = data.resources || data || [];
            const grid = document.querySelector('.browse-grid');
            if (!grid) return;
            if (!resources.length) {
                grid.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;grid-column:1/-1;">No resources available at the moment.</p>';
                return;
            }
            grid.innerHTML = resources.map(r => `
                <div class="browse-card">
                    <div class="browse-card-header">
                        <span class="category-badge ${categoryClass(r.category)}">${r.category}</span>
                        <span class="status-badge available">Available</span>
                    </div>
                    <div class="browse-card-info">
                        <h4>${r.name}</h4>
                        <p>${r.description || 'No description available'}</p>
                    </div>
                    <div class="browse-card-meta">
                        <span><i class="fas fa-cubes"></i> ${r.available_qty} in stock</span>
                        <span><i class="fas fa-dollar-sign"></i> ${Number(r.cost_per_unit || 0).toLocaleString()}/unit</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="openRequestModal(${r.id}, '${r.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-paper-plane"></i> Request
                    </button>
                </div>
            `).join('');
        } catch (e) { console.error('Browse resources error:', e); }
    }

    // Hook browse search
    const browseSearchInput = document.getElementById('browseSearch');
    if (browseSearchInput) browseSearchInput.addEventListener('input', () => loadBrowseResources());

    window.openRequestModal = function (resourceId, resourceName) {
        document.getElementById('reqResourceId').value = resourceId;
        document.getElementById('reqResourceName').value = resourceName;
        showCustomerModal('requestResource');
    };

    async function loadMyResources() {
        try {
            const allocations = await api.getMyAllocations();
            const tbody = document.querySelector('#section-my-resources .data-table tbody');
            if (!tbody) return;
            if (allocations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:40px;">No resources assigned to you</td></tr>';
                return;
            }
            tbody.innerHTML = allocations.map(a => `
                <tr data-id="${a.id}">
                    <td>${a.resource_name}</td>
                    <td><span class="category-badge ${categoryClass(a.resource_category)}">${a.resource_category}</span></td>
                    <td>${formatDate(a.assigned_date)}</td>
                    <td>${a.return_due ? formatDate(a.return_due) : '—'}</td>
                    <td><span class="status-badge ${statusClass(a.status)}">${a.status}</span></td>
                    <td>
                        ${a.status === 'active' ? `<button class="action-btn return" title="Return Resource" onclick="returnAlloc(${a.id})"><i class="fas fa-undo"></i></button>` : '—'}
                    </td>
                </tr>
            `).join('');
        } catch (e) { console.error('My resources error:', e); }
    }

    window.returnAlloc = async function (id) {
        if (!confirm('Return this resource?')) return;
        try {
            await api.returnResource(id);
            showToast('Resource returned');
            loadMyResources();
            loadCustomerOverview();
        } catch (e) { showToast(e.message, 'error'); }
    };

    async function loadMyRequests() {
        try {
            const data = await api.getMyRequests({ limit: 50 });
            const counts = await api.getRequestCounts();

            const statNums = document.querySelectorAll('#section-my-requests .request-stat-number');
            if (statNums[0]) statNums[0].textContent = counts.pending ?? 0;
            if (statNums[1]) statNums[1].textContent = counts.approved ?? 0;
            if (statNums[2]) statNums[2].textContent = counts.rejected ?? 0;
            if (statNums[3]) statNums[3].textContent = counts.total ?? 0;

            const list = document.querySelector('#section-my-requests .requests-list');
            if (!list) return;
            if (data.requests.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">You haven\'t made any requests yet.</p>';
                return;
            }
            list.innerHTML = data.requests.map(r => `
                <div class="request-card" data-id="${r.id}">
                    <div class="request-card-header">
                        <div class="request-card-user">
                            <span class="request-id-badge">#REQ-${String(r.id).padStart(3, '0')}</span>
                            <div><strong>${r.resource_name}</strong><span>${r.resource_category}</span></div>
                        </div>
                        <span class="status-badge ${statusClass(r.status)}">${r.status}</span>
                    </div>
                    <div class="request-reason">${r.reason}</div>
                    ${r.admin_note ? `<div class="request-admin-note"><i class="fas fa-comment"></i> Admin: ${r.admin_note}</div>` : ''}
                    <div class="request-card-footer">
                        <span><i class="far fa-clock"></i> ${formatDate(r.created_at)}</span>
                        <div class="request-actions">
                            ${r.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="cancelReq(${r.id})"><i class="fas fa-times"></i> Cancel</button>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) { console.error('My requests error:', e); }
    }

    window.cancelReq = async function (id) {
        if (!confirm('Cancel this request?')) return;
        try {
            await api.cancelRequest(id);
            showToast('Request cancelled');
            loadMyRequests();
            loadCustomerOverview();
        } catch (e) { showToast(e.message, 'error'); }
    };

    async function loadCustomerProfile() {
        try {
            const profile = await api.getProfile();
            // Profile card
            const avatarLg = document.querySelector('#section-profile .profile-avatar-large');
            if (avatarLg) avatarLg.textContent = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')).toUpperCase();
            const nameEl = document.querySelector('#section-profile .profile-card-header h3');
            if (nameEl) nameEl.textContent = `${profile.first_name} ${profile.last_name}`;
            const roleEl = document.querySelector('#section-profile .profile-card-header p');
            if (roleEl) roleEl.textContent = profile.company || profile.role;

            // Profile form fields
            const inputs = document.querySelectorAll('#section-profile .settings-form .settings-input');
            if (inputs[0]) inputs[0].value = profile.first_name || '';
            if (inputs[1]) inputs[1].value = profile.last_name || '';
            if (inputs[2]) inputs[2].value = profile.email || '';
            if (inputs[3]) inputs[3].value = profile.company || '';
        } catch (e) { console.error('Profile error:', e); }
    }

    function setupCustomerForms() {
        // Submit resource request
        const submitReqBtn = document.getElementById('submitRequestBtn');
        if (submitReqBtn) {
            submitReqBtn.addEventListener('click', async () => {
                const resource_id = document.getElementById('reqResourceId').value;
                const reason = document.getElementById('reqReason').value.trim();
                const priority = document.getElementById('reqPriority').value;
                const needed_by = document.getElementById('reqNeededBy').value || null;
                if (!resource_id || !reason) return showToast('Please fill required fields', 'error');
                try {
                    await api.createRequest({ resource_id: +resource_id, reason, priority, needed_by });
                    showToast('Request submitted');
                    closeCustomerModal('requestResourceModal');
                    document.getElementById('requestResourceForm').reset();
                    loadMyRequests();
                    loadCustomerOverview();
                    loadBrowseResources();
                } catch (e) { showToast(e.message, 'error'); }
            });
        }

        // Save profile
        const profileSaveBtn = document.querySelector('#section-profile .settings-form .btn-primary');
        if (profileSaveBtn) {
            profileSaveBtn.addEventListener('click', async function () {
                const inputs = document.querySelectorAll('#section-profile .settings-form .settings-input');
                const first_name = inputs[0]?.value.trim();
                const last_name = inputs[1]?.value.trim();
                const email = inputs[2]?.value.trim();
                const company = inputs[3]?.value.trim();
                try {
                    await api.updateProfile({ first_name, last_name, email, company });
                    // Update stored user
                    const u = api.getUser();
                    u.first_name = first_name; u.last_name = last_name; u.email = email; u.company = company;
                    localStorage.setItem('rh_user', JSON.stringify(u));
                    // Update display
                    const initials = (first_name?.[0] || '') + (last_name?.[0] || '');
                    document.querySelectorAll('.sidebar-avatar, .topbar-avatar').forEach(el => el.textContent = initials.toUpperCase());
                    document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = `${first_name} ${last_name}`);
                    document.querySelectorAll('.topbar-user > span').forEach(el => el.textContent = first_name);
                    showToast('Profile updated');
                } catch (e) { showToast(e.message, 'error'); }
            });
        }

        // Change password
        const pwdBtn = document.querySelector('#section-profile .settings-section:last-child .btn-primary');
        if (pwdBtn) {
            pwdBtn.addEventListener('click', async function () {
                const pwdInputs = document.querySelectorAll('#section-profile .settings-section:last-child .settings-input');
                const currentPassword = pwdInputs[0]?.value;
                const newPassword = pwdInputs[1]?.value;
                const confirmPassword = pwdInputs[2]?.value;
                if (!currentPassword || !newPassword) return showToast('Fill all password fields', 'error');
                if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
                if (newPassword.length < 6) return showToast('Password must be at least 6 characters', 'error');
                try {
                    await api.changePassword(currentPassword, newPassword);
                    showToast('Password changed');
                    pwdInputs.forEach(i => i.value = '');
                } catch (e) { showToast(e.message, 'error'); }
            });
        }
    }

});
