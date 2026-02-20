/* ===================================================
   ResourceHub - Interactive JavaScript
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Navigation ─────────────────────────────────
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Scroll effect for navbar
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    // ─── Scroll Animations ──────────────────────────
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .pricing-card, .point, .stat').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add CSS for animated-in elements
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);


    // ─── Auth Page Logic ────────────────────────────
    const tabButtons = document.querySelectorAll('.tab-button');
    const authTabs = document.querySelectorAll('.auth-tab');
    const switchTabs = document.querySelectorAll('.switch-tab');

    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        switchToTab(tabParam);
    }

    // Tab button clicks
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchToTab(btn.dataset.tab);
        });
    });

    // Switch-tab links
    switchTabs.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchToTab(link.dataset.tab);
        });
    });

    function switchToTab(tabName) {
        // Update buttons
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update panels
        authTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        const targetTab = document.querySelector(`.${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }


    // ─── Toggle Password Visibility ─────────────────
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });


    // ─── Password Strength Meter ────────────────────
    const signupPassword = document.getElementById('signup-password');
    if (signupPassword) {
        signupPassword.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    function updatePasswordStrength(password) {
        const meter = document.querySelector('.strength-meter-fill');
        const text = document.querySelector('.strength-text strong');

        if (!meter || !text) return;

        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;

        const levels = [
            { width: '0%', color: 'transparent', label: '-' },
            { width: '20%', color: '#ef4444', label: 'Very Weak' },
            { width: '40%', color: '#f97316', label: 'Weak' },
            { width: '60%', color: '#f59e0b', label: 'Fair' },
            { width: '80%', color: '#22c55e', label: 'Strong' },
            { width: '100%', color: '#10b981', label: 'Very Strong' }
        ];

        const level = levels[password.length === 0 ? 0 : strength];
        meter.style.width = level.width;
        meter.style.background = level.color;
        text.textContent = level.label;
        text.style.color = level.color === 'transparent' ? '' : level.color;
    }


    // ─── Form Validation ────────────────────────────
    const validators = {
        email(value) {
            if (!value) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
            return '';
        },
        password(value, input) {
            if (!value) return 'Password is required';
            if (input && !input.closest('#loginForm') && value.length < 8) return 'Password must be at least 8 characters';
            return '';
        },
        firstname(value) {
            if (!value) return 'First name is required';
            if (value.length < 2) return 'Must be at least 2 characters';
            return '';
        },
        lastname(value) {
            if (!value) return 'Last name is required';
            if (value.length < 2) return 'Must be at least 2 characters';
            return '';
        },
        company(value) {
            if (!value) return 'Company name is required';
            return '';
        },
        confirm(value) {
            if (!value) return 'Please confirm your password';
            const pwd = document.getElementById('signup-password');
            if (pwd && value !== pwd.value) return 'Passwords do not match';
            return '';
        }
    };

    function validateField(input) {
        const name = input.name;
        const value = input.value.trim();
        const errorSpan = input.closest('.form-group')?.querySelector('.form-error');
        const validator = validators[name];

        if (!validator) return true;

        const error = validator(value, input);

        if (errorSpan) {
            errorSpan.textContent = error;
        }

        if (error) {
            input.classList.add('error');
            input.classList.remove('success');
            return false;
        } else {
            input.classList.remove('error');
            input.classList.add('success');
            return true;
        }
    }

    // Real-time validation on blur
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });


    // ─── Login Form Submission ──────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = loginForm.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) return;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Signing in...';

            // Simulate API call
            await simulateApiCall(1500);

            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Sign In';

            // Save mock auth data so dashboard auth guard passes
            const email = loginForm.querySelector('input[name="email"]').value;
            api.saveAuth({
                token: 'mock-token-' + Date.now(),
                id: 1,
                first_name: email.split('@')[0],
                last_name: '',
                email: email,
                role: 'admin',
                company: 'ResourceHub'
            });

            window.location.href = 'admin-dashboard.html';
        });
    }


    // ─── Signup Form Submission ─────────────────────
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = signupForm.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (input.type !== 'checkbox' && !validateField(input)) {
                    isValid = false;
                }
            });

            // Terms checkbox
            const terms = signupForm.querySelector('input[name="terms"]');
            if (terms && !terms.checked) {
                isValid = false;
                // Flash the checkbox label
                const label = terms.closest('.checkbox-label');
                if (label) {
                    label.style.color = 'var(--danger)';
                    setTimeout(() => { label.style.color = ''; }, 2000);
                }
            }

            if (!isValid) return;

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Creating account...';

            // Simulate API call
            await simulateApiCall(2000);

            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Create Account';

            const firstName = document.getElementById('signup-firstname')?.value || 'there';
            const lastName = document.getElementById('signup-lastname')?.value || '';
            const signupEmail = document.getElementById('signup-email')?.value || '';
            const company = document.getElementById('signup-company')?.value || '';

            // Save mock auth data so dashboard auth guard passes
            api.saveAuth({
                token: 'mock-token-' + Date.now(),
                id: 1,
                first_name: firstName,
                last_name: lastName,
                email: signupEmail,
                role: 'admin',
                company: company
            });

            window.location.href = 'admin-dashboard.html';
        });
    }


    // ─── Helpers ────────────────────────────────────
    function simulateApiCall(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showModal(modalId, message) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const msgEl = modal.querySelector('#successMessage') || modal.querySelector('#errorMessage');
        if (msgEl) msgEl.textContent = message;

        modal.classList.add('show');
    }

    // Expose closeModal globally for onclick handlers
    window.closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    };

    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });


    // ─── Social Login Buttons ────────────────────────
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('comingSoonModal');
            if (modal) modal.classList.add('show');
        });
    });


    // ─── Staggered animation delays ─────────────────
    document.querySelectorAll('.features-grid .feature-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll('.pricing-grid .pricing-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.15}s`;
    });

    document.querySelectorAll('.hero-stats .stat').forEach((stat, i) => {
        stat.style.transitionDelay = `${i * 0.15}s`;
    });

    document.querySelectorAll('.about-points .point').forEach((point, i) => {
        point.style.transitionDelay = `${i * 0.1}s`;
    });

});
