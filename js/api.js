/* ===================================================
   RMS - API Helper
   =================================================== */

// Backend API base URL
const API_BASE = 'http://localhost:5000/api';

const api = {
    // Get stored token
    getToken() {
        return localStorage.getItem('rms_token');
    },
    // Get stored user
    getUser() {
        const u = localStorage.getItem('rms_user');
        return u ? JSON.parse(u) : null;
    },
    // Save auth data
    saveAuth(data) {
        localStorage.setItem('rms_token', data.token);
        localStorage.setItem('rms_user', JSON.stringify({
            id: data.id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            role: data.role,
            department: data.department
        }));
    },
    // Logout
    logout() {
        localStorage.removeItem('rms_token');
        localStorage.removeItem('rms_user');
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
    login(email, password) { return this.post('/auth/login', { email, password }); },
    register(data) { return this.post('/auth/register', data); },
    getProfile() { return this.get('/auth/me'); },
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
    getMyResources() { return this.get('/resources/my'); },
    createResource(data) { return this.post('/resources', data); },
    updateResource(id, data) { return this.put(`/resources/${id}`, data); },
    deleteResource(id) { return this.del(`/resources/${id}`); },
    getResourceStats() { return this.get('/resources/stats'); },

    // ─── Requests ───
    getRequests(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/requests${q ? '?' + q : ''}`);
    },
    getSentRequests() { return this.get('/requests/sent'); },
    getReceivedRequests() { return this.get('/requests/received'); },
    createRequest(data) { return this.post('/requests', data); },
    approveRequest(id, admin_note = '') { return this.put(`/requests/${id}/approve`, { admin_note }); },
    rejectRequest(id, admin_note = '') { return this.put(`/requests/${id}/reject`, { admin_note }); },
    returnResource(id) { return this.put(`/requests/${id}/return`, {}); },
    cancelRequest(id) { return this.del(`/requests/${id}/cancel`); },
    getRequestCounts() { return this.get('/requests/counts'); },

    // ─── Categories ───
    getCategories() { return this.get('/categories'); },

    // ─── Admin ───
    getAdminStats() { return this.get('/admin/stats'); },
    getUsers(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/admin/users${q ? '?' + q : ''}`);
    },
    verifyUser(id, is_verified) { return this.put(`/admin/users/${id}/verify`, { is_verified }); },
    blockUser(id, is_blocked) { return this.put(`/admin/users/${id}/block`, { is_blocked }); },
    deleteUser(id) { return this.del(`/admin/users/${id}`); },
    getActivity(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/admin/activity${q ? '?' + q : ''}`);
    },
    getAllResources(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.get(`/admin/resources${q ? '?' + q : ''}`);
    }
};

// Make available globally
window.api = api;
