/* ===================================================
   ResourceHub - API Helper
   =================================================== */

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

const api = {
    // Get stored token
    getToken() {
        return localStorage.getItem('rh_token');
    },
    // Get stored user
    getUser() {
        const u = localStorage.getItem('rh_user');
        return u ? JSON.parse(u) : null;
    },
    // Save auth data
    saveAuth(data) {
        localStorage.setItem('rh_token', data.token);
        localStorage.setItem('rh_user', JSON.stringify({
            id: data.id, first_name: data.first_name, last_name: data.last_name,
            email: data.email, role: data.role, company: data.company
        }));
    },
    // Logout
    logout() {
        localStorage.removeItem('rh_token');
        localStorage.removeItem('rh_user');
        window.location.href = 'auth.html';
    },
    // Check auth — redirect to auth if not logged in
    requireAuth(expectedRole) {
        const token = this.getToken();
        const user = this.getUser();
        if (!token || !user) {
            window.location.href = 'auth.html';
            return null;
        }
        if (expectedRole && user.role !== expectedRole) {
            window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
            return null;
        }
        return user;
    },

    // Generic request
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, config);
            let data;
            const text = await res.text();
            try { data = JSON.parse(text); } catch { data = { message: text || 'Server error' }; }
            if (!res.ok) {
                if (res.status === 401) {
                    this.logout();
                    return;
                }
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Server not reachable. Make sure the backend is running on localhost:5000');
            }
            console.error('API Error:', err);
            throw err;
        }
    },

    // Convenience methods
    get(endpoint) { return this.request(endpoint); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
    del(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

    // ─── Auth ───
    login(email, password, role) { return this.post('/auth/login', { email, password, role }); },
    register(data) { return this.post('/auth/register', data); },
    getProfile() { return this.get('/auth/profile'); },
    updateProfile(data) { return this.put('/auth/profile', data); },
    changePassword(currentPassword, newPassword) { return this.put('/auth/change-password', { currentPassword, newPassword }); },

    // ─── Resources ───
    getResources(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/resources${q ? '?' + q : ''}`);
    },
    getAvailableResources(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/resources/available${q ? '?' + q : ''}`);
    },
    createResource(data) { return this.post('/resources', data); },
    updateResource(id, data) { return this.put(`/resources/${id}`, data); },
    deleteResource(id) { return this.del(`/resources/${id}`); },
    getResourceStats() { return this.get('/resources/stats'); },
    getCostOverview() { return this.get('/resources/cost-overview'); },

    // ─── Requests ───
    getRequests(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/requests${q ? '?' + q : ''}`);
    },
    getMyRequests(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/requests/mine${q ? '?' + q : ''}`);
    },
    createRequest(data) { return this.post('/requests', data); },
    approveRequest(id, admin_note) { return this.put(`/requests/${id}/approve`, { admin_note }); },
    rejectRequest(id, admin_note) { return this.put(`/requests/${id}/reject`, { admin_note }); },
    cancelRequest(id) { return this.del(`/requests/${id}`); },
    getRequestCounts() { return this.get('/requests/counts'); },

    // ─── Allocations ───
    getMyAllocations() { return this.get('/allocations/mine'); },
    getAllAllocations() { return this.get('/allocations'); },
    returnResource(id) { return this.put(`/allocations/${id}/return`, {}); },

    // ─── Dashboard ───
    getAdminDashboard() { return this.get('/dashboard/admin'); },
    getCustomerDashboard() { return this.get('/dashboard/customer'); },
    getUsers(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/dashboard/users${q ? '?' + q : ''}`);
    },
    createUser(data) { return this.post('/dashboard/users', data); },
    updateUser(id, data) { return this.put(`/dashboard/users/${id}`, data); },
    deleteUser(id) { return this.del(`/dashboard/users/${id}`); },
    getActivity() { return this.get('/dashboard/activity'); }
};

// Make available globally
window.api = api;
