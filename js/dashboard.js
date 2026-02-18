/* ===================================================
   ResourceHub - Dashboard JavaScript
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

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
    const resourceSearch = document.getElementById('resourceSearch');
    if (resourceSearch) {
        resourceSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#section-resources .data-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    const browseSearch = document.getElementById('browseSearch');
    if (browseSearch) {
        browseSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.browse-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }


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

});
