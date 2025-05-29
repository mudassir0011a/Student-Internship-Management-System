document.addEventListener("DOMContentLoaded", function () {
    if (!window.location.pathname.startsWith('/static/')) {
        console.log(`Page accessed: ${window.location.pathname}`);
    }

    console.log("DOM fully loaded and parsed");

    // Initialize core functions
    checkLoginStatus();
    setupFAQToggle();
    setupDarkMode();
    setupLoginForm();
    setupLogout();
    setupApplicationForm();
    setupPageSpecificScripts();
    setupSearchFunctionality();
    setupApplicantFetching();

    // Function to dynamically update navbar buttons based on login status
    function updateNavbarButtons() {
        fetch('/api/check_login_status')
            .then(response => response.json())
            .then(data => {
                const isLoggedIn = data.logged_in;
                const role = data.role || null;

                if (isLoggedIn) {
                    localStorage.setItem("isLoggedIn", "true");
                    if (role) localStorage.setItem("role", role);
                } else {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("role");
                }

                const dashboardLink = document.getElementById("dashboard-link");
                const logoutLink = document.getElementById("logout-link");
                const loginLink = document.getElementById("login-link");
                const candidateSignup = document.getElementById("candidate-signup");
                const companySignup = document.getElementById("company-signup");

                if (isLoggedIn) {
                    if (dashboardLink) {
                        dashboardLink.classList.remove("d-none");
                        dashboardLink.href = role === "student" ? "/dashboard" : "/recruiter";
                    }
                    if (logoutLink) logoutLink.classList.remove("d-none");
                    if (loginLink) loginLink.classList.add("d-none");
                    if (candidateSignup) candidateSignup.classList.add("d-none");
                    if (companySignup) companySignup.classList.add("d-none");
                } else {
                    if (loginLink) loginLink.classList.remove("d-none");
                    if (candidateSignup) candidateSignup.classList.remove("d-none");
                    if (companySignup) companySignup.classList.remove("d-none");
                    if (dashboardLink) dashboardLink.classList.add("d-none");
                    if (logoutLink) logoutLink.classList.add("d-none");
                }
            })
            .catch(error => {
                console.error("Error fetching login status:", error);
                const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
                const dashboardLink = document.getElementById("dashboard-link");
                const logoutLink = document.getElementById("logout-link");
                const loginLink = document.getElementById("login-link");
                const candidateSignup = document.getElementById("candidate-signup");
                const companySignup = document.getElementById("company-signup");

                if (isLoggedIn) {
                    if (dashboardLink) dashboardLink.classList.remove("d-none");
                    if (logoutLink) logoutLink.classList.remove("d-none");
                    if (loginLink) loginLink.classList.add("d-none");
                    if (candidateSignup) candidateSignup.classList.add("d-none");
                    if (companySignup) companySignup.classList.add("d-none");
                } else {
                    if (loginLink) loginLink.classList.remove("d-none");
                    if (candidateSignup) candidateSignup.classList.remove("d-none");
                    if (companySignup) companySignup.classList.remove("d-none");
                    if (dashboardLink) dashboardLink.classList.add("d-none");
                    if (logoutLink) logoutLink.classList.add("d-none");
                }
            });
    }

    // Call the function to update navbar buttons
    updateNavbarButtons();

    // Toggle Password Visibility
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Assuming input is the previous sibling
            const inputField = this.previousElementSibling;
            if (inputField) {
                if (inputField.type === "password") {
                    inputField.type = "text";
                    this.classList.remove("fa-eye");
                    this.classList.add("fa-eye-slash");
                } else {
                    inputField.type = "password";
                    this.classList.remove("fa-eye-slash");
                    this.classList.add("fa-eye");
                }
            }
        });
    });

    // Toggle for Password Field
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                togglePassword.classList.remove("fa-eye");
                togglePassword.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                togglePassword.classList.remove("fa-eye-slash");
                togglePassword.classList.add("fa-eye");
            }
        });
    }

    // Toggle for Confirm Password Field
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function () {
            if (confirmPasswordInput.type === "password") {
                confirmPasswordInput.type = "text";
                toggleConfirmPassword.classList.remove("fa-eye");
                toggleConfirmPassword.classList.add("fa-eye-slash");
            } else {
                confirmPasswordInput.type = "password";
                toggleConfirmPassword.classList.remove("fa-eye-slash");
                toggleConfirmPassword.classList.add("fa-eye");
            }
        });
    }

    // Apply Now Button Handler
    const applyNowButtons = document.querySelectorAll("#applyNowBtn");
    applyNowButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            const role = localStorage.getItem("role");
            if (!isLoggedIn) {
                event.preventDefault();
                showLoginAlert();
            } else if (role === "recruiter") {
                event.preventDefault();
                Swal.fire({
                    title: "Action Not Allowed",
                    text: "As a recruiter, you cannot apply for internships.",
                    icon: "info",
                    confirmButtonText: "OK"
                });
            }
        });
    });

    // Dark Mode Toggle Handler
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("change", function () {
            document.body.classList.toggle("dark-mode", this.checked);
        });
    }

    // Candidate Signup Handler
    const candidateForm = document.getElementById("registerFormCandidate");
    if (candidateForm) {
        candidateForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(candidateForm);
            fetch("/auth/candidate/signup", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        Swal.fire({
                            title: "Registration Failed",
                            text: data.error,
                            icon: "error",
                            confirmButtonText: "Try Again"
                        });
                    } else {
                        Swal.fire({
                            title: "Registration Successful",
                            text: "Your candidate account has been created.",
                            icon: "success",
                            confirmButtonText: "Login Now"
                        }).then(() => {
                            window.location.href = "/auth/login";
                        });
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: "Error",
                        text: "An unexpected error occurred. Please try again later.",
                        icon: "error",
                        confirmButtonText: "Try Again"
                    });
                });
        });
    }

    // Company Signup Handler
    const companyForm = document.getElementById("registerFormCompany");
    if (companyForm) {
        companyForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(companyForm);
            fetch("/auth/company/signup", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        Swal.fire({
                            title: "Registration Failed",
                            text: data.error,
                            icon: "error",
                            confirmButtonText: "Try Again"
                        });
                    } else {
                        Swal.fire({
                            title: "Registration Successful",
                            text: "Your company account has been created.",
                            icon: "success",
                            confirmButtonText: "Login Now"
                        }).then(() => {
                            window.location.href = "/auth/login";
                        });
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: "Error",
                        text: "An unexpected error occurred. Please try again later.",
                        icon: "error",
                        confirmButtonText: "Try Again"
                    });
                });
        });
    }

    // Fetch login status and update UI dynamically
    fetch('/api/check_login_status')
        .then(response => response.json())
        .then(data => {
            const dashboardLink = document.getElementById("dashboard-link");
            const logoutLink = document.getElementById("logout-link");
            const loginLink = document.getElementById("login-link");
            const candidateSignup = document.getElementById("candidate-signup");
            const companySignup = document.getElementById("company-signup");

            if (data.logged_in) {
                // Show dashboard and logout buttons
                dashboardLink.classList.remove("d-none");
                logoutLink.classList.remove("d-none");

                // Hide login and signup buttons
                loginLink.classList.add("d-none");
                candidateSignup?.classList.add("d-none");
                companySignup.classList.add("d-none");

                // Set the dashboard link based on the role
                dashboardLink.href = data.role === "recruiter" ? "/recruiter" : "/dashboard";
            } else {
                // Show login and signup buttons
                loginLink.classList.remove("d-none");
                candidateSignup.classList.remove("d-none");
                companySignup.classList.remove("d-none");

                // Hide dashboard and logout buttons
                dashboardLink.classList.add("d-none");
                logoutLink.classList.add("d-none");
            }
        })
        .catch(error => console.error("Error fetching login status:", error));

    const logoutLink = document.getElementById("logout-link");

    // Handle logout functionality with confirmation
    if (logoutLink) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior

            // Show confirmation dialog
            Swal.fire({
                title: 'Are you sure?',
                text: "Do you really want to log out?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // If user confirms, send logout request
                    fetch('/api/logout', { method: 'POST' })
                        .then(response => {
                            if (response.ok) {
                                // Update navbar buttons
                                document.getElementById("dashboard-link").classList.add("d-none");
                                logoutLink.classList.add("d-none");
                                document.getElementById("login-link").classList.remove("d-none");
                                document.getElementById("candidate-signup").classList.remove("d-none");
                                document.getElementById("company-signup").classList.remove("d-none");

                                // Redirect to the home page
                                window.location.href = '/';
                            } else {
                                console.error("Failed to log out");
                            }
                        })
                        .catch(error => console.error("Error during logout:", error));
                }
            });
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
            // Ensure the form action is correct
            if (registerForm.action !== "/auth/candidate/signup") {
                console.error("Form action is incorrect:", registerForm.action);
                event.preventDefault(); // Prevent submission
            }
        });
    }
});

// ------------------------- Core Functions -------------------------

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("role");

    const dashboardLink = document.getElementById("dashboard-link");
    const logoutLink = document.getElementById("logout-link");
    const loginLink = document.getElementById("login-link");
    const candidateSignup = document.getElementById("candidate-signup");
    const companySignup = document.getElementById("company-signup");

    const validRoles = ["student", "recruiter"];
    if (!isLoggedIn || !validRoles.includes(role)) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("role");
    }

    if (dashboardLink) {
        dashboardLink.classList.toggle("d-none", !isLoggedIn);
        dashboardLink.href = role === "student" ? "dashboard.html" : "/recruiter";
    }
    if (logoutLink) {
        logoutLink.classList.toggle("d-none", !isLoggedIn);
    }
    if (loginLink) {
        loginLink.classList.toggle("d-none", isLoggedIn);
    }
    // Completely remove the signup buttons when logged in
    if (isLoggedIn) {
        if (candidateSignup) candidateSignup.remove();
        if (companySignup) candidateSignup.remove();
    }
}

// Logout function
function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

function showLoginAlert() {
    Swal.fire({
        title: "Access Denied!",
        text: "Please login first to continue.",
        icon: "warning",
        confirmButtonText: "Login Now",
        confirmButtonColor: "#ff4d4d"
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = "login.html";
        }
    });
}

function showModal(title, message, callback) {
    if (typeof bootstrap === "undefined") {
        console.error("Bootstrap is not defined. Ensure Bootstrap JS is loaded.");
        return;
    }
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modalTitle.textContent = title;
    modalBody.textContent = message;
    modal.show();
    const modalElement = document.getElementById('confirmationModal');
    modalElement.addEventListener('hidden.bs.modal', function () {
        if (callback) callback();
    }, { once: true });
}

// ------------------------- Feature Setup Functions -------------------------

function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("Login form found. Attaching event listener...");
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const role = document.getElementById("role").value;
            const loginButton = loginForm.querySelector("button[type='submit']");

            if (!email || !password || !role) {
                Swal.fire({
                    title: "Missing Fields",
                    text: "Please fill in all required fields.",
                    icon: "warning",
                    confirmButtonText: "OK"
                });
                return;
            }

            loginButton.disabled = true;

            const formData = new FormData(loginForm);

            fetch(loginForm.action, {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        Swal.fire({
                            title: "Login Failed",
                            text: data.error,
                            icon: "error",
                            confirmButtonText: "Try Again"
                        });
                        loginButton.disabled = false;
                    } else if (data.redirect) {
                        Swal.fire({
                            title: "Login Successful",
                            text: "Welcome back! Redirecting to your dashboard...",
                            icon: "success",
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = data.redirect;
                        });
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: "Error",
                        text: "An unexpected error occurred. Please try again later.",
                        icon: "error",
                        confirmButtonText: "Try Again"
                    });
                    loginButton.disabled = false;
                });
        });
    } else {
        console.error("Login form not found.");
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            Swal.fire({
                title: "Logout Confirmation",
                text: "Are you sure you want to logout?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ff4d4d",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, Logout",
                cancelButtonText: "Cancel"
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("role");
                    window.location.href = "index.html";
                }
            });
        });
    }
}

function setupApplicationForm() {
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = new FormData(applicationForm);
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            fetch(applicationForm.action, {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Submit Application';
                    if (data.success) {
                        Swal.fire({
                            title: "Form Submitted Successfully!",
                            text: data.message || "We have received your information.",
                            icon: "success",
                            confirmButtonText: "Close",
                            confirmButtonColor: "#4e72c4"
                        }).then(() => {
                            window.location.href = "/"; // Changed to root URL; adjust if needed
                        });
                    } else {
                        Swal.fire({
                            title: "Submission Failed",
                            text: data.error || "An error occurred. Please try again.",
                            icon: "error",
                            confirmButtonText: "Try Again"
                        });
                    }
                })
                .catch(error => {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Submit Application';
                    console.error('Error:', error);
                    Swal.fire({
                        title: "Error",
                        text: `An unexpected error occurred: ${error.message}. Please try again later.`,
                        icon: "error",
                        confirmButtonText: "Try Again"
                    });
                });
        });
    }
}

// Add this inside the document.addEventListener("DOMContentLoaded", ...) block
function setupApplicantFetching() {
    // Check if we are on the recruiter dashboard page
    if (window.location.pathname === '/recruiter' || window.location.pathname.includes('recruiter.html')) {
        const tbody = document.getElementById('applications-tbody');
        const viewModal = document.getElementById('viewApplicationModal');
        const nameSpan = document.getElementById('view-name');
        const positionSpan = document.getElementById('view-position');
        const appliedSpan = document.getElementById('view-applied');
        const emailSpan = document.getElementById('view-email');
        const resumeLink = document.getElementById('view-resume');

        if (!tbody || !viewModal) {
            console.warn('Applicant table or modal not found on this page.');
            return;
        }

        function updateApplications() {
            fetch('/api/applications')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(applications => {
                    tbody.innerHTML = '';
                    if (!applications.length) {
                        tbody.innerHTML = '<tr><td colspan="5">No applications found.</td></tr>';
                        return;
                    }
                    applications.forEach(app => {
                        const row = document.createElement('tr');
                        row.setAttribute('data-id', app.application_id);
                        row.innerHTML = `
                            <td class="applicant-name">${app.full_name || 'Unknown'}</td>
                            <td class="applicant-position">${app.title || 'N/A'}</td>
                            <td class="applicant-applied">${app.created_at ? app.created_at.split(' ')[0] : 'N/A'}</td>
                            <td><span class="status-badge status-${(app.status || 'pending').toLowerCase()}">${app.status || 'Pending'}</span></td>
                            <td>
                                <button class="btn btn-view" data-bs-toggle="modal" data-bs-target="#viewApplicationModal"
                                        data-name="${app.full_name || 'Unknown'}"
                                        data-position="${app.title || 'N/A'}"
                                        data-applied="${app.created_at ? app.created_at.split(' ')[0] : 'N/A'}"
                                        data-email="${app.email || 'N/A'}"
                                        data-resume="${app.resume ? '/static/applications/' + app.resume : ''}">
                                    View
                                </button>
                                ${app.status === "Pending" ? `
                                    <form method="POST" action="/update_application_status" style="display:inline;">
                                        <input type="hidden" name="application_id" value="${app.application_id}">
                                        <button class="btn btn-accept" name="status" value="Accepted">Accept</button>
                                        <button class="btn btn-reject" name="status" value="Rejected">Reject</button>
                                    </form>
                                ` : ''}
                            </td>
                        `;
                        tbody.appendChild(row);
                    });

                    // Attach event listeners to new view buttons
                    document.querySelectorAll('.btn-view').forEach(btn => {
                        btn.addEventListener('click', () => {
                            nameSpan.textContent = btn.getAttribute('data-name');
                            positionSpan.textContent = btn.getAttribute('data-position');
                            appliedSpan.textContent = btn.getAttribute('data-applied');
                            emailSpan.textContent = btn.getAttribute('data-email');
                            resumeLink.href = btn.getAttribute('data-resume');
                            resumeLink.textContent = btn.getAttribute('data-resume') ? 'Download Resume' : 'No Resume';
                        });
                    });

                    // Attach accept/reject event listeners
                    document.querySelectorAll('.btn-accept').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.preventDefault();
                            const id = button.form.querySelector('input[name="application_id"]').value;
                            const row = document.querySelector(`tr[data-id="${id}"]`);
                            const statusCell = row.querySelector('.status-badge');
                            statusCell.textContent = 'Accepted';
                            statusCell.className = 'status-badge status-accepted';
                            row.querySelector('td:last-child').innerHTML = `<button class="btn btn-view" data-bs-toggle="modal" data-bs-target="#viewApplicationModal" data-id="${id}">View</button>`;
                            Swal.fire({
                                icon: 'success',
                                title: 'Application Accepted',
                                text: `${row.querySelector('.applicant-name').textContent} has been accepted!`,
                                timer: 1500,
                                timerProgressBar: true
                            });
                        });
                    });

                    document.querySelectorAll('.btn-reject').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.preventDefault();
                            const id = button.form.querySelector('input[name="application_id"]').value;
                            const row = document.querySelector(`tr[data-id="${id}"]`);
                            const name = row.querySelector('.applicant-name').textContent;
                            Swal.fire({
                                title: 'Confirm Rejection',
                                text: `Are you sure you want to reject ${name}?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'Yes, Reject',
                                cancelButtonText: 'No'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    const statusCell = row.querySelector('.status-badge');
                                    statusCell.textContent = 'Rejected';
                                    statusCell.className = 'status-badge status-rejected';
                                    row.querySelector('td:last-child').innerHTML = `<button class="btn btn-view" data-bs-toggle="modal" data-bs-target="#viewApplicationModal" data-id="${id}">View</button>`;
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Application Rejected',
                                        text: `${name} has been rejected!`,
                                        timer: 1500,
                                        timerProgressBar: true
                                    });
                                }
                            });
                        });
                    });
                })
                .catch(error => {
                    console.error('Error fetching applications:', error);
                    tbody.innerHTML = '<tr><td colspan="5">Error loading applications. Please try again later.</td></tr>';
                });
        }

        // Initial fetch and set up polling every 30 seconds
        updateApplications();
        setInterval(updateApplications, 30000); // Poll every 30 seconds for updates
    }
}

// Call the new function
setupApplicantFetching();

function setupFAQToggle() {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const isAlreadyOpen = this.classList.contains('active');
            faqToggles.forEach(btn => {
                btn.classList.remove('active');
                if (btn.nextElementSibling) btn.nextElementSibling.style.display = 'none';
            });
            if (!isAlreadyOpen) {
                this.classList.add('active');
                const faqContent = this.nextElementSibling;
                if (faqContent) faqContent.style.display = 'block';
            }
        });
    });
}

function setupDarkMode() {
    console.log("Setting up dark mode...");
    // Additional dark mode logic can be added here.
}

function setupPageSpecificScripts() {
    // Dark Mode Toggle within Dashboard or page-specific scripts.
    const toggleDarkModeButton = document.getElementById('toggleDarkMode');
    if (toggleDarkModeButton) {
        toggleDarkModeButton.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
        });
    }

    // // Mark All Notifications as Read
    // document.getElementById('mark-all-read').addEventListener('click', () => {
    //     document.querySelectorAll('.notification').forEach(notification => {
    //         const notifId = notification.id;
    //         if (!notificationsRead[notifId]) {
    //             notificationsRead[notifId] = true;
    //             notification.style.opacity = '0.6';
    //             notification.style.borderLeftColor = '#ccc';
    //             notification.style.cursor = 'default';
    //         }
    //     });

    //     Swal.fire({
    //         icon: 'success',
    //         title: 'All Marked as Read',
    //         text: 'All notifications have been marked as read.',
    //         timer: 1500,
    //         timerProgressBar: true,
    //     });
    // });

    // Settings Form Validation
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function (e) {
            const passwordInput = document.getElementById('password');
            if (!passwordInput) {
                alert("Password input not found.");
                return;
            }
            const password = passwordInput.value;
            if (password.length < 6) {
                e.preventDefault();
                alert("Password must be at least 6 characters long.");
            } else {
                alert("Settings updated successfully!");
            }
        });
    }
    // Updated Sign-Up / Sign-In Toggle
    const signUpButton = document.getElementById("signUp");
    const signInButton = document.getElementById("signIn");
    const mainContainer = document.querySelector(".container");
    if (signUpButton && signInButton && mainContainer) {
        signUpButton.addEventListener("click", () => {
            mainContainer.classList.add("right-panel-active");
        });
        signInButton.addEventListener("click", () => {
            mainContainer.classList.remove("right-panel-active");
        });
    }
    // Register User
    const registerForm = document.querySelector(".register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const firstNameInput = document.getElementById("firstName");
            const lastNameInput = document.getElementById("lastName");
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const confirmPasswordInput = document.getElementById("confirmPassword");
            if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                alert("Please fill all the fields.");
                return;
            }
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const fullName = firstName + " " + lastName;
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const role = "student";
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            const userData = { fullName, email, password, role };
            localStorage.setItem("userData", JSON.stringify(userData));
            alert("Registration successful! You can now login.");
            window.location.href = "login.html";
        });
    }
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");
    if (!searchInput || !searchResults) {
        console.info("Search functionality not initialized on this page.");
        return;
    }
    const internships = [
        "Software Engineer Intern",
        "Data Analyst Intern",
        "Marketing Intern",
        "Graphic Designer Intern",
        "UI/UX Designer Intern",
        "Web Developer Intern",
        "Product Manager Intern",
        "Content Writer Intern"
    ];
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();
        searchResults.innerHTML = "";
        if (query) {
            const filteredInternships = internships.filter(intern => intern.toLowerCase().includes(query));
            filteredInternships.forEach(intern => {
                const div = document.createElement("div");
                div.textContent = intern;
                div.addEventListener("click", function () {
                    window.location.href = `internships.html?search=${encodeURIComponent(intern)}`;
                });
                searchResults.appendChild(div);
            });
        }
    });
}

// ---------------------- Edit Profile Section Handling ----------------------

// Get all elements related to the edit profile modal
const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profilePhone = document.getElementById('profile-phone');
const profileLocation = document.getElementById('profile-location');
const profileEducation = document.getElementById('profile-education');
const profileResume = document.getElementById('profile-resume');
const profilePic = document.getElementById('profile-pic');
const profilePicInput = document.getElementById('edit-profile-pic');
const profilePicPreview = document.getElementById('profile-pic-preview');

// Pre-fill edit profile modal with existing data (clearing default texts)
if (editProfileModal) {
    editProfileModal.addEventListener('show.bs.modal', () => {
        const nameVal = profileName.textContent.trim();
        const emailVal = profileEmail.textContent.trim();
        const phoneVal = (profilePhone.textContent.trim() === "Phone not provided") ? "" : profilePhone.textContent.trim();
        const locationVal = (profileLocation.textContent.trim() === "Location not provided") ? "" : profileLocation.textContent.trim();
        const educationVal = (profileEducation.textContent.trim() === "Education not provided") ? "" : profileEducation.textContent.trim();
        document.getElementById('edit-name').value = nameVal;
        document.getElementById('edit-email').value = emailVal;
        document.getElementById('edit-phone').value = phoneVal;
        document.getElementById('edit-location').value = locationVal;
        document.getElementById('edit-education').value = educationVal;
        // Clear file inputs on modal open
        document.getElementById('edit-resume').value = '';
        document.getElementById('edit-profile-pic').value = '';
        profilePicPreview.style.display = 'none';
    });
}

// Preview selected profile picture in the modal
if (profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePicPreview.src = event.target.result;
                profilePicPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            profilePicPreview.style.display = 'none';
        }
    });
}

// Handle submission of the Edit Profile form
if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get input values
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();
        const location = document.getElementById('edit-location').value.trim();
        const education = document.getElementById('edit-education').value.trim();
        const resumeFile = document.getElementById('edit-resume').files[0];
        const profilePicFile = document.getElementById('edit-profile-pic').files[0];

        // Validate required fields
        if (!name || !email || !phone || !location || !education) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'All text fields are required!'
            });
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter a valid email address!'
            });
            return;
        }
        if (resumeFile && resumeFile.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please upload a PDF file for the resume!'
            });
            return;
        }
        if (profilePicFile && !profilePicFile.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please upload a valid image file for the profile picture!'
            });
            return;
        }

        // Prepare and send form data for updating profile details
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('location', location);
        formData.append('education', education);
        if (profilePicFile) formData.append('profile_picture', profilePicFile);
        if (resumeFile) formData.append('resume', resumeFile);

        fetch('/update_student_info', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update dashboard elements with new profile info
                    profileName.textContent = name;
                    profileEmail.textContent = email;
                    profilePhone.textContent = phone;
                    profileLocation.textContent = location;
                    profileEducation.textContent = education;
                    if (resumeFile) {
                        profileResume.textContent = resumeFile.name;
                        profileResume.setAttribute('href', URL.createObjectURL(resumeFile));
                    }
                    if (profilePicFile) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            profilePic.src = event.target.result;
                        };
                        reader.readAsDataURL(profilePicFile);
                    }
                    // Close modal and show success alert
                    const modalInstance = bootstrap.Modal.getInstance(editProfileModal);
                    modalInstance.hide();
                    Swal.fire({
                        icon: 'success',
                        title: 'Profile Updated',
                        text: data.message,
                        timer: 2000,
                        timerProgressBar: true
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Update failed!'
                    });
                }
            })
            .catch(error => {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An unexpected error occurred.'
                });
            });
    });
}
