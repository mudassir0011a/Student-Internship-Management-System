document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const templateButtons = document.querySelectorAll('.template-btn');
    const colorButtons = document.querySelectorAll('.color-btn');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const printResumeBtn = document.getElementById('print-resume');
    const addEducationBtn = document.getElementById('add-education');
    const addExperienceBtn = document.getElementById('add-experience');
    const educationItems = document.getElementById('education-items');
    const experienceItems = document.getElementById('experience-items');
    const resumeContent = document.getElementById('resume-content');
    const generateSummaryBtn = document.getElementById('generate-summary');
    const summaryOptions = document.getElementById('summary-options');
    const suggestSkillsBtn = document.getElementById('suggest-skills');
    const enhanceDescriptionBtns = document.querySelectorAll('.enhance-description');
    const profileImageInput = document.getElementById('profileImage');

    // Current tab and template state
    let currentTabIndex = 0;
    let currentTemplate = 'modern';
    let currentColor = 'default';
    let profileImageData = null;

    // Initialize the resume builder
    initializeResumeBuilder();

    // Tab navigation
    function initializeResumeBuilder() {
        // Load saved data from localStorage
        loadSavedData();

        // Set up event listeners
        setupEventListeners();

        // Initial render of the resume preview
        updateResumePreview();

        // Update navigation buttons
        updateNavigationButtons();
    }

    function setupEventListeners() {
        // Tab buttons
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                setActiveTab(index);
            });
        });

        // Navigation buttons
        prevBtn.addEventListener('click', goToPreviousTab);
        nextBtn.addEventListener('click', goToNextTab);

        // Template buttons
        templateButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveTemplate(button.dataset.template);
            });
        });

        // Color buttons
        colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveColor(button.dataset.color);
            });
        });

        // Add education button
        addEducationBtn.addEventListener('click', addEducationItem);

        // Add experience button
        addExperienceBtn.addEventListener('click', addExperienceItem);

        // Generate PDF button
        generatePdfBtn.addEventListener('click', generatePDF);

        // Print resume button
        printResumeBtn.addEventListener('click', printResume);

        // Generate summary button
        generateSummaryBtn.addEventListener('click', toggleSummaryOptions);

        // Summary options
        document.querySelectorAll('.ai-option').forEach(option => {
            option.addEventListener('click', () => {
                generateAISummary(option.dataset.style);
            });
        });

        // Suggest skills button
        suggestSkillsBtn.addEventListener('click', suggestSkills);

        // Enhance description buttons
        enhanceDescriptionBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const descriptionElement = this.closest('.experience-item').querySelector('.expDescription');
                enhanceDescription(descriptionElement);
            });
        });

        // Profile image input
        // profileImageInput.addEventListener('change', handleProfileImageUpload);

        // Form input change events for live preview
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                saveFormData();
                updateResumePreview();
            });
        });
    }

    // Tab Navigation Functions
    function setActiveTab(index) {
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab
        tabButtons[index].classList.add('active');
        tabPanes[index].classList.add('active');

        // Update current tab index
        currentTabIndex = index;

        // Update navigation buttons
        updateNavigationButtons();
    }

    function goToPreviousTab() {
        if (currentTabIndex > 0) {
            setActiveTab(currentTabIndex - 1);
        }
    }

    function goToNextTab() {
        if (currentTabIndex < tabButtons.length - 1) {
            setActiveTab(currentTabIndex + 1);
        } else {
            // On last tab, scroll to preview
            document.querySelector('.preview-container').scrollIntoView({ behavior: 'smooth' });
        }
    }

    function updateNavigationButtons() {
        // Hide previous button on first tab
        prevBtn.style.display = currentTabIndex === 0 ? 'none' : 'block';

        // Change next button text on last tab
        if (currentTabIndex === tabButtons.length - 1) {
            nextBtn.textContent = 'Finish';
            nextBtn.innerHTML = 'Finish <i class="fas fa-check"></i>';
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    // Template Functions
    function setActiveTemplate(template) {
        // Remove active class from all template buttons
        templateButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to selected template button
        document.querySelector(`.template-btn[data-template="${template}"]`).classList.add('active');

        // Update current template
        currentTemplate = template;

        // Update resume preview
        updateResumePreview();

        // Save template preference
        localStorage.setItem('resumeTemplate', template);
    }

    // Color Functions
    function setActiveColor(color) {
        // Remove active class from all color buttons
        colorButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to selected color button
        document.querySelector(`.color-btn[data-color="${color}"]`).classList.add('active');

        // Update current color
        currentColor = color;

        // Update resume preview
        updateResumePreview();

        // Save color preference
        localStorage.setItem('resumeColor', color);
    }

    // Education and Experience Item Functions
    function addEducationItem() {
        const newItem = document.createElement('div');
        newItem.className = 'education-item';
        newItem.innerHTML = `
            <div class="form-group">
                <label for="institution">Institution*</label>
                <input type="text" class="institution" required>
            </div>
            <div class="form-group">
                <label for="degree">Degree*</label>
                <input type="text" class="degree" required>
            </div>
            <div class="form-group">
                <label for="fieldOfStudy">Field of Study</label>
                <input type="text" class="fieldOfStudy">
            </div>
            <div class="form-row">
                <div class="form-group half">
                    <label for="eduStartDate">Start Date</label>
                    <input type="month" class="eduStartDate">
                </div>
                <div class="form-group half">
                    <label for="eduEndDate">End Date</label>
                    <input type="month" class="eduEndDate">
                </div>
            </div>
            <div class="form-group">
                <label for="eduDescription">Description (optional)</label>
                <textarea class="eduDescription" rows="3"></textarea>
            </div>
            <button type="button" class="btn-secondary remove-item">Remove</button>
        `;

        educationItems.appendChild(newItem);

        // Add event listener to the remove button
        newItem.querySelector('.remove-item').addEventListener('click', function () {
            educationItems.removeChild(newItem);
            saveFormData();
            updateResumePreview();
        });

        // Add event listeners to new inputs
        newItem.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                saveFormData();
                updateResumePreview();
            });
        });
    }

    function addExperienceItem() {
        const newItem = document.createElement('div');
        newItem.className = 'experience-item';
        newItem.innerHTML = `
            <div class="form-group">
                <label for="jobTitle">Job Title*</label>
                <input type="text" class="jobTitle" required>
            </div>
            <div class="form-group">
                <label for="company">Company*</label>
                <input type="text" class="company" required>
            </div>
            <div class="form-group">
                <label for="location">Location</label>
                <input type="text" class="location">
            </div>
            <div class="form-row">
                <div class="form-group half">
                    <label for="expStartDate">Start Date</label>
                    <input type="month" class="expStartDate">
                </div>
                <div class="form-group half">
                    <label for="expEndDate">End Date</label>
                    <input type="month" class="expEndDate">
                </div>
            </div>
            <div class="form-group">
                <label for="expDescription">Description*</label>
                <textarea class="expDescription" rows="4" required></textarea>
            </div>
            <div class="ai-assist">
                <button type="button" class="btn-ai enhance-description">
                    <i class="fas fa-magic"></i> Enhance Description
                </button>
            </div>
            <button type="button" class="btn-secondary remove-item">Remove</button>
        `;

        experienceItems.appendChild(newItem);

        // Add event listener to the remove button
        newItem.querySelector('.remove-item').addEventListener('click', function () {
            experienceItems.removeChild(newItem);
            saveFormData();
            updateResumePreview();
        });

        // Add event listeners to new inputs
        newItem.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                saveFormData();
                updateResumePreview();
            });
        });

        // Add event listener to enhance description button
        newItem.querySelector('.enhance-description').addEventListener('click', function () {
            const descriptionElement = this.closest('.experience-item').querySelector('.expDescription');
            enhanceDescription(descriptionElement);
        });
    }

    // Profile Image Functions
    // function handleProfileImageUpload(event) {
    //     const file = event.target.files[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onload = function (e) {
    //             profileImageData = e.target.result;
    //             saveFormData();
    //             updateResumePreview();
    //         };
    //         reader.readAsDataURL(file);
    //     }
    // }

    // Data Management Functions
    function getFormData() {
        const data = {
            personal: {
                fullName: document.getElementById('fullName').value,
                jobTitle: document.getElementById('jobTitle').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                linkedin: document.getElementById('linkedin').value,
                website: document.getElementById('website').value,
                profileImage: profileImageData
            },
            summary: document.getElementById('professionalSummary').value,
            education: [],
            experience: [],
            skills: document.getElementById('skillsList').value
        };

        // Get education items
        document.querySelectorAll('.education-item').forEach(item => {
            data.education.push({
                institution: item.querySelector('.institution').value,
                degree: item.querySelector('.degree').value,
                fieldOfStudy: item.querySelector('.fieldOfStudy').value,
                startDate: item.querySelector('.eduStartDate').value,
                endDate: item.querySelector('.eduEndDate').value,
                description: item.querySelector('.eduDescription').value
            });
        });

        // Get experience items
        document.querySelectorAll('.experience-item').forEach(item => {
            data.experience.push({
                jobTitle: item.querySelector('.jobTitle').value,
                company: item.querySelector('.company').value,
                location: item.querySelector('.location').value,
                startDate: item.querySelector('.expStartDate').value,
                endDate: item.querySelector('.expEndDate').value,
                description: item.querySelector('.expDescription').value
            });
        });

        return data;
    }

    function saveFormData() {
        const data = getFormData();
        localStorage.setItem('resumeData', JSON.stringify(data));
    }

    function loadSavedData() {
        const savedData = localStorage.getItem('resumeData');
        const savedTemplate = localStorage.getItem('resumeTemplate');
        const savedColor = localStorage.getItem('resumeColor');

        if (savedTemplate) {
            setActiveTemplate(savedTemplate);
        }

        if (savedColor) {
            setActiveColor(savedColor);
        }

        if (savedData) {
            const data = JSON.parse(savedData);

            // Fill personal information
            document.getElementById('fullName').value = data.personal.fullName || '';
            document.getElementById('jobTitle').value = data.personal.jobTitle || '';
            document.getElementById('email').value = data.personal.email || '';
            document.getElementById('phone').value = data.personal.phone || '';
            document.getElementById('address').value = data.personal.address || '';
            document.getElementById('city').value = data.personal.city || '';
            document.getElementById('state').value = data.personal.state || '';
            document.getElementById('zipCode').value = data.personal.zipCode || '';
            document.getElementById('linkedin').value = data.personal.linkedin || '';
            document.getElementById('website').value = data.personal.website || '';
            profileImageData = data.personal.profileImage || null;

            // Fill summary
            document.getElementById('professionalSummary').value = data.summary || '';

            // Fill skills
            document.getElementById('skillsList').value = data.skills || '';

            // Fill education items
            if (data.education && data.education.length > 0) {
                // Remove default education item
                educationItems.innerHTML = '';

                // Add saved education items
                data.education.forEach(edu => {
                    const newItem = document.createElement('div');
                    newItem.className = 'education-item';
                    newItem.innerHTML = `
                        <div class="form-group">
                            <label for="institution">Institution*</label>
                            <input type="text" class="institution" required value="${edu.institution || ''}">
                        </div>
                        <div class="form-group">
                            <label for="degree">Degree*</label>
                            <input type="text" class="degree" required value="${edu.degree || ''}">
                        </div>
                        <div class="form-group">
                            <label for="fieldOfStudy">Field of Study</label>
                            <input type="text" class="fieldOfStudy" value="${edu.fieldOfStudy || ''}">
                        </div>
                        <div class="form-row">
                            <div class="form-group half">
                                <label for="eduStartDate">Start Date</label>
                                <input type="month" class="eduStartDate" value="${edu.startDate || ''}">
                            </div>
                            <div class="form-group half">
                                <label for="eduEndDate">End Date</label>
                                <input type="month" class="eduEndDate" value="${edu.endDate || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="eduDescription">Description (optional)</label>
                            <textarea class="eduDescription" rows="3">${edu.description || ''}</textarea>
                        </div>
                        <button type="button" class="btn-secondary remove-item">Remove</button>
                    `;

                    educationItems.appendChild(newItem);

                    // Add event listener to the remove button
                    newItem.querySelector('.remove-item').addEventListener('click', function () {
                        educationItems.removeChild(newItem);
                        saveFormData();
                        updateResumePreview();
                    });

                    // Add event listeners to inputs
                    newItem.querySelectorAll('input, textarea').forEach(input => {
                        input.addEventListener('input', () => {
                            saveFormData();
                            updateResumePreview();
                        });
                    });
                });
            }

            // Fill experience items
            if (data.experience && data.experience.length > 0) {
                // Remove default experience item
                experienceItems.innerHTML = '';

                // Add saved experience items
                data.experience.forEach(exp => {
                    const newItem = document.createElement('div');
                    newItem.className = 'experience-item';
                    newItem.innerHTML = `
                        <div class="form-group">
                            <label for="jobTitle">Job Title*</label>
                            <input type="text" class="jobTitle" required value="${exp.jobTitle || ''}">
                        </div>
                        <div class="form-group">
                            <label for="company">Company*</label>
                            <input type="text" class="company" required value="${exp.company || ''}">
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" class="location" value="${exp.location || ''}">
                        </div>
                        <div class="form-row">
                            <div class="form-group half">
                                <label for="expStartDate">Start Date</label>
                                <input type="month" class="expStartDate" value="${exp.startDate || ''}">
                            </div>
                            <div class="form-group half">
                                <label for="expEndDate">End Date</label>
                                <input type="month" class="expEndDate" value="${exp.endDate || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="expDescription">Description*</label>
                            <textarea class="expDescription" rows="4" required>${exp.description || ''}</textarea>
                        </div>
                        <div class="ai-assist">
                            <button type="button" class="btn-ai enhance-description">
                                <i class="fas fa-magic"></i> Enhance Description
                            </button>
                        </div>
                        <button type="button" class="btn-secondary remove-item">Remove</button>
                    `;

                    experienceItems.appendChild(newItem);

                    // Add event listener to the remove button
                    newItem.querySelector('.remove-item').addEventListener('click', function () {
                        experienceItems.removeChild(newItem);
                        saveFormData();
                        updateResumePreview();
                    });

                    // Add event listeners to inputs
                    newItem.querySelectorAll('input, textarea').forEach(input => {
                        input.addEventListener('input', () => {
                            saveFormData();
                            updateResumePreview();
                        });
                    });

                    // Add event listener to enhance description button
                    newItem.querySelector('.enhance-description').addEventListener('click', function () {
                        const descriptionElement = this.closest('.experience-item').querySelector('.expDescription');
                        enhanceDescription(descriptionElement);
                    });
                });
            }
        }
    }

    // Resume Preview Functions
    function updateResumePreview() {
        const data = getFormData();
        let html = `<style>${document.styleSheets[0].cssRules ? Array.from(document.styleSheets[0].cssRules).map(rule => rule.cssText).join(' ') : ''}</style>`;

        // Apply color theme
        applyColorTheme(currentColor);

        // Generate HTML based on the selected template
        switch (currentTemplate) {
            case 'modern':
                html += generateModernTemplate(data);
                break;
            case 'professional':
                html += generateProfessionalTemplate(data);
                break;
            case 'creative':
                html += generateCreativeTemplate(data);
                break;
            case 'executive':
                html += generateExecutiveTemplate(data);
                break;
            case 'minimal':
                html += generateMinimalTemplate(data);
                break;
            default:
                html += generateModernTemplate(data);
        }

        resumeContent.innerHTML = html;
    }

    function applyColorTheme(color) {
        const root = document.documentElement;

        switch (color) {
            case 'default':
                root.style.setProperty('--modern-primary', '#4a4e69');
                root.style.setProperty('--professional-primary', '#2c3e50');
                root.style.setProperty('--creative-primary', '#ff6b6b');
                root.style.setProperty('--executive-primary', '#5e35b1');
                root.style.setProperty('--minimal-primary', '#333333');
                break;
            case 'blue':
                root.style.setProperty('--modern-primary', '#2c3e50');
                root.style.setProperty('--professional-primary', '#1565c0');
                root.style.setProperty('--creative-primary', '#039be5');
                root.style.setProperty('--executive-primary', '#0d47a1');
                root.style.setProperty('--minimal-primary', '#0277bd');
                break;
            case 'green':
                root.style.setProperty('--modern-primary', '#2e7d32');
                root.style.setProperty('--professional-primary', '#1b5e20');
                root.style.setProperty('--creative-primary', '#43a047');
                root.style.setProperty('--executive-primary', '#2e7d32');
                root.style.setProperty('--minimal-primary', '#388e3c');
                break;
            case 'purple':
                root.style.setProperty('--modern-primary', '#5e35b1');
                root.style.setProperty('--professional-primary', '#4527a0');
                root.style.setProperty('--creative-primary', '#7b1fa2');
                root.style.setProperty('--executive-primary', '#6a1b9a');
                root.style.setProperty('--minimal-primary', '#5e35b1');
                break;
            case 'maroon':
                root.style.setProperty('--modern-primary', '#c62828');
                root.style.setProperty('--professional-primary', '#b71c1c');
                root.style.setProperty('--creative-primary', '#d32f2f');
                root.style.setProperty('--executive-primary', '#c62828');
                root.style.setProperty('--minimal-primary', '#c62828');
                break;
        }
    }

    function generateModernTemplate(data) {
        // Format skills as an array
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

        // Format address
        let address = formatAddress(data.personal);

        return `
            <div class="modern-template">
                <div class="resume-header">
                    <h1>${data.personal.fullName || 'Your Name'}</h1>
                    <h2>${data.personal.jobTitle || 'Professional Title'}</h2>
                    <div class="contact-info">
                        ${data.personal.email ? `<span><i class="fas fa-envelope"></i> ${data.personal.email}</span>` : ''}
                        ${data.personal.phone ? `<span><i class="fas fa-phone"></i> ${data.personal.phone}</span>` : ''}
                        ${address ? `<span><i class="fas fa-map-marker-alt"></i> ${address}</span>` : ''}
                        ${data.personal.linkedin ? `<span><i class="fab fa-linkedin"></i> ${data.personal.linkedin}</span>` : ''}
                        ${data.personal.website ? `<span><i class="fas fa-globe"></i> ${data.personal.website}</span>` : ''}
                    </div>
                </div>
                
                <div class="resume-body">
                    ${data.summary ? `
                    <div class="section">
                        <h2 class="section-title">Professional Summary</h2>
                        <p>${data.summary}</p>
                    </div>
                    ` : ''}
                    
                    ${data.experience.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Work Experience</h2>
                        ${data.experience.map(exp => `
                            <div class="item">
                                <div class="item-header">
                                    <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                                    <div class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` | ${exp.location}` : ''}</div>
                                    <div class="item-date">
                                        ${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                    </div>
                                </div>
                                <p class="item-description">${exp.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${data.education.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Education</h2>
                        ${data.education.map(edu => `
                            <div class="item">
                                <div class="item-header">
                                    <div class="item-title">${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                                    <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                                    <div class="item-date">
                                        ${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                    </div>
                                </div>
                                ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${skills.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Skills</h2>
                        <div class="skills-list">
                            ${skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function generateProfessionalTemplate(data) {
        // Format skills as an array
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

        // Format address
        let address = formatAddress(data.personal);

        return `
            <div class="professional-template">
                <div class="resume-header">
                    <h1>${data.personal.fullName || 'Your Name'}</h1>
                    <h2>${data.personal.jobTitle || 'Professional Title'}</h2>
                    <div class="contact-info">
                        ${data.personal.email ? `<span>${data.personal.email}</span>` : ''}
                        ${data.personal.phone ? `<span>${data.personal.phone}</span>` : ''}
                        ${address ? `<span>${address}</span>` : ''}
                        ${data.personal.linkedin ? `<span>${data.personal.linkedin}</span>` : ''}
                        ${data.personal.website ? `<span>${data.personal.website}</span>` : ''}
                    </div>
                </div>
                
                <div class="resume-body">
                    ${data.summary ? `
                    <div class="section">
                        <h2 class="section-title">Summary</h2>
                        <p>${data.summary}</p>
                    </div>
                    ` : ''}
                    
                    ${data.experience.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Professional Experience</h2>
                        ${data.experience.map(exp => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${exp.jobTitle || 'Job Title'} | ${exp.company || 'Company'}</span>
                                    <span class="item-date">
                                        ${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                    </span>
                                </div>
                                ${exp.location ? `<div class="item-subtitle">${exp.location}</div>` : ''}
                                <p class="item-description">${exp.description || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${data.education.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Education</h2>
                        ${data.education.map(edu => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</span>
                                    <span class="item-date">
                                        ${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                    </span>
                                </div>
                                <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                                ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${skills.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Skills</h2>
                        <div class="skills-list">
                            ${skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function generateCreativeTemplate(data) {
        // Format skills as an array
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

        // Format address
        let address = formatAddress(data.personal);

        return `
            <div class="creative-template">
                <div class="resume-header">
                    <h1>${data.personal.fullName || 'Your Name'}</h1>
                    <h2>${data.personal.jobTitle || 'Professional Title'}</h2>
                    <div class="contact-info">
                        ${data.personal.email ? `<span><i class="fas fa-envelope"></i> ${data.personal.email}</span>` : ''}
                        ${data.personal.phone ? `<span><i class="fas fa-phone"></i> ${data.personal.phone}</span>` : ''}
                        ${address ? `<span><i class="fas fa-map-marker-alt"></i> ${address}</span>` : ''}
                        ${data.personal.linkedin ? `<span><i class="fab fa-linkedin"></i> ${data.personal.linkedin}</span>` : ''}
                        ${data.personal.website ? `<span><i class="fas fa-globe"></i> ${data.personal.website}</span>` : ''}
                    </div>
                </div>
                
                ${data.summary ? `
                <div class="section">
                    <h2 class="section-title">Profile</h2>
                    <p>${data.summary}</p>
                </div>
                ` : ''}
                
                ${data.experience.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="item">
                            <div class="item-header">
                                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                                <div class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` | ${exp.location}` : ''}</div>
                                <div class="item-date">
                                    ${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                </div>
                            </div>
                            <p class="item-description">${exp.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${data.education.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Education</h2>
                    ${data.education.map(edu => `
                        <div class="item">
                            <div class="item-header">
                                <div class="item-title">${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                                <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                                <div class="item-date">
                                    ${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                </div>
                            </div>
                            ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Skills</h2>
                    <div class="skills-list">
                        ${skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    function generateExecutiveTemplate(data) {
        // Format skills as an array
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

        // Format address
        let address = formatAddress(data.personal);

        return `
            <div class="executive-template">
                <div class="resume-header">
                    <div class="header-left">
                        <h1>${data.personal.fullName || 'Your Name'}</h1>
                        <h2>${data.personal.jobTitle || 'Professional Title'}</h2>
                    </div>
                    <div class="header-right">
                        <div class="contact-info">
                            ${data.personal.email ? `<span><i class="fas fa-envelope"></i> ${data.personal.email}</span>` : ''}
                            ${data.personal.phone ? `<span><i class="fas fa-phone"></i> ${data.personal.phone}</span>` : ''}
                            ${address ? `<span><i class="fas fa-map-marker-alt"></i> ${address}</span>` : ''}
                            ${data.personal.linkedin ? `<span><i class="fab fa-linkedin"></i> ${data.personal.linkedin}</span>` : ''}
                            ${data.personal.website ? `<span><i class="fas fa-globe"></i> ${data.personal.website}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="resume-body">
                    <div class="main-content">
                        ${data.summary ? `
                        <div class="section">
                            <h2 class="section-title">Executive Summary</h2>
                            <p>${data.summary}</p>
                        </div>
                        ` : ''}
                        
                        ${data.experience.length > 0 ? `
                        <div class="section">
                            <h2 class="section-title">Professional Experience</h2>
                            ${data.experience.map(exp => `
                                <div class="item">
                                    <div class="item-header">
                                        <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                                        <div class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` | ${exp.location}` : ''}</div>
                                        <div class="item-date">
                                            ${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                        </div>
                                    </div>
                                    <p class="item-description">${exp.description || ''}</p>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="sidebar">
                        ${data.education.length > 0 ? `
                        <div class="section">
                            <h2 class="section-title">Education</h2>
                            ${data.education.map(edu => `
                                <div class="item">
                                    <div class="item-header">
                                        <div class="item-title">${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                                        <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                                        <div class="item-date">
                                            ${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        ${skills.length > 0 ? `
                        <div class="section">
                            <h2 class="section-title">Skills</h2>
                            <div class="skills-list">
                                ${skills.map(skill => `
                                    <div class="skill">
                                        <div class="skill-name">${skill}</div>
                                        <div class="skill-level">
                                            <div class="skill-level-fill" style="width: 85%;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function generateMinimalTemplate(data) {
        // Format skills as an array
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

        // Format address
        let address = formatAddress(data.personal);

        return `
            <div class="minimal-template">
                <div class="resume-header">
                    <h1>${data.personal.fullName || 'Your Name'}</h1>
                    <h2>${data.personal.jobTitle || 'Professional Title'}</h2>
                    <div class="contact-info">
                        ${data.personal.email ? `<span>${data.personal.email}</span>` : ''}
                        ${data.personal.phone ? `<span>${data.personal.phone}</span>` : ''}
                        ${address ? `<span>${address}</span>` : ''}
                        ${data.personal.linkedin ? `<span>${data.personal.linkedin}</span>` : ''}
                        ${data.personal.website ? `<span>${data.personal.website}</span>` : ''}
                    </div>
                </div>
                
                ${data.summary ? `
                <div class="section">
                    <h2 class="section-title">Professional Summary</h2>
                    <p class="item-description">${data.summary}</p>
                </div>
                ` : ''}
                
                ${data.experience.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="item">
                            <div class="item-header">
                                <span class="item-title">${exp.jobTitle || 'Job Title'}</span>
                                <span class="item-date">
                                    ${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                </span>
                            </div>
                            <div class="item-subtitle">${exp.company || 'Company'}${exp.location ? `, ${exp.location}` : ''}</div>
                            <p class="item-description">${exp.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${data.education.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Education</h2>
                    ${data.education.map(edu => `
                        <div class="item">
                            <div class="item-header">
                                <span class="item-title">${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</span>
                                <span class="item-date">
                                    ${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                </span>
                            </div>
                            <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                            ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${skills.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Skills</h2>
                    <div class="skills-list">
                        ${skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Helper Functions
    function formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();

        return `${month} ${year}`;
    }

    function formatAddress(personal) {
        let address = '';
        if (personal.address) address += personal.address;
        if (personal.city) {
            if (address) address += ', ';
            address += personal.city;
        }
        if (personal.state) {
            if (address) address += ', ';
            address += personal.state;
        }
        if (personal.zipCode) {
            if (address) address += ' ';
            address += personal.zipCode;
        }
        return address;
    }

    // PDF Generation
    function generatePDF() {
        const resumeContent = document.getElementById('resume-content');
        const clone = resumeContent.cloneNode(true);

        // Special fix for Creative Template
        const creative = clone.querySelector('.creative-template');
        if (creative) {
            creative.style.margin = '0';
            creative.style.padding = '0';
            creative.style.maxWidth = '794px';
            creative.style.backgroundColor = 'white';

            const headerBefore = creative.querySelector('.resume-header::before');
            const headerAfter = creative.querySelector('.resume-header::after');
            if (headerBefore) headerBefore.style.display = 'none';
            if (headerAfter) headerAfter.style.display = 'none';
        }

        const wrapper = document.createElement('div');
        wrapper.style.width = '794px';
        wrapper.style.minHeight = '1123px';
        wrapper.style.padding = '20px';
        wrapper.style.boxSizing = 'border-box';
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        html2pdf().set({
            margin: 0,
            filename: 'resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, scrollY: 0 },
            jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
        }).from(wrapper).save().then(() => wrapper.remove());
    }

    

    // Print Function
    function printResume() {
        const printContent = document.getElementById('resume-content').innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = `
            <div style="padding: 20px;">
                ${printContent}
            </div>
        `;

        window.print();
        document.body.innerHTML = originalContent;

        // Reinitialize the app after printing
        initializeResumeBuilder();
    }

    // AI Functions
    function toggleSummaryOptions() {
        if (summaryOptions.style.display === 'none') {
            summaryOptions.style.display = 'flex';
        } else {
            summaryOptions.style.display = 'none';
        }
    }

    function generateAISummary(style) {
        // Get current form data
        const data = getFormData();

        // Show AI suggestions modal
        const modal = new bootstrap.Modal(document.getElementById('aiSuggestionsModal'));
        modal.show();

        // Show loading state
        document.querySelector('.ai-loading').style.display = 'block';
        document.querySelector('.ai-suggestions').style.display = 'none';

        // Simulate AI generation (in a real app, this would call an API)
        setTimeout(() => {
            // Hide loading state
            document.querySelector('.ai-loading').style.display = 'none';
            document.querySelector('.ai-suggestions').style.display = 'block';

            // Generate suggestions based on style
            const suggestionList = document.querySelector('.suggestion-list');
            suggestionList.innerHTML = '';

            const suggestions = generateSummaryExamples(data, style);

            suggestions.forEach((suggestion, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.dataset.index = index;
                suggestionItem.textContent = suggestion;

                suggestionItem.addEventListener('click', function () {
                    // Toggle selected class
                    document.querySelectorAll('.suggestion-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    this.classList.add('selected');
                });

                suggestionList.appendChild(suggestionItem);
            });

            // Set up apply button
            document.getElementById('apply-suggestion').addEventListener('click', function () {
                const selectedSuggestion = document.querySelector('.suggestion-item.selected');
                if (selectedSuggestion) {
                    document.getElementById('professionalSummary').value = selectedSuggestion.textContent;
                    saveFormData();
                    updateResumePreview();
                    modal.hide();
                }
            });
        }, 1500);

        // Hide summary options
        summaryOptions.style.display = 'none';
    }

    function generateSummaryExamples(data, style) {
        const name = data.personal.fullName || 'professional';
        const title = data.personal.jobTitle || 'professional';

        const professionalSummaries = [
            `Results-driven ${title} with ${Math.floor(Math.random() * 10) + 3} years of experience in delivering high-quality solutions. Proven track record of improving efficiency and driving business growth through innovative approaches and strategic thinking.`,
            `Dedicated ${title} with expertise in project management and team leadership. Committed to delivering exceptional results while maintaining the highest standards of professionalism and integrity.`,
            `Detail-oriented ${title} with strong analytical skills and a passion for problem-solving. Experienced in collaborating with cross-functional teams to achieve organizational objectives and drive continuous improvement.`
        ];

        const creativeSummaries = [
            `Innovative ${title} who thrives on turning challenges into opportunities. A creative thinker with a knack for developing unique solutions that exceed expectations and inspire others.`,
            `Passionate and versatile ${title} with a flair for thinking outside the box. Combines creativity with technical expertise to deliver impactful results that stand out in today's competitive landscape.`,
            `Dynamic ${title} with a creative mindset and an eye for detail. Transforms concepts into reality through a blend of artistic vision and practical implementation strategies.`
        ];

        const technicalSummaries = [
            `Tech-savvy ${title} with extensive experience in implementing cutting-edge solutions. Proficient in leveraging technology to optimize processes and drive efficiency across organizations.`,
            `Analytical ${title} with a strong technical background and a data-driven approach to problem-solving. Skilled in identifying opportunities for improvement and implementing effective technical solutions.`,
            `Forward-thinking ${title} with expertise in emerging technologies and their practical applications. Combines technical knowledge with business acumen to deliver solutions that align with organizational goals.`
        ];

        switch (style) {
            case 'professional':
                return professionalSummaries;
            case 'creative':
                return creativeSummaries;
            case 'technical':
                return technicalSummaries;
            default:
                return professionalSummaries;
        }
    }

    function suggestSkills() {
        // Get current job title
        const jobTitle = document.getElementById('jobTitle').value || '';

        // Show AI suggestions modal
        const modal = new bootstrap.Modal(document.getElementById('aiSuggestionsModal'));
        modal.show();

        // Show loading state
        document.querySelector('.ai-loading').style.display = 'block';
        document.querySelector('.ai-suggestions').style.display = 'none';

        // Simulate AI generation (in a real app, this would call an API)
        setTimeout(() => {
            // Hide loading state
            document.querySelector('.ai-loading').style.display = 'none';
            document.querySelector('.ai-suggestions').style.display = 'block';

            // Generate suggestions based on job title
            const suggestionList = document.querySelector('.suggestion-list');
            suggestionList.innerHTML = '';

            const suggestions = generateSkillSuggestions(jobTitle);

            suggestions.forEach((suggestion, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.dataset.index = index;
                suggestionItem.textContent = suggestion;

                suggestionItem.addEventListener('click', function () {
                    // Toggle selected class
                    document.querySelectorAll('.suggestion-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    this.classList.add('selected');
                });

                suggestionList.appendChild(suggestionItem);
            });

            // Set up apply button
            document.getElementById('apply-suggestion').addEventListener('click', function () {
                const selectedSuggestion = document.querySelector('.suggestion-item.selected');
                if (selectedSuggestion) {
                    document.getElementById('skillsList').value = selectedSuggestion.textContent;
                    saveFormData();
                    updateResumePreview();
                    modal.hide();
                }
            });
        }, 1500);
    }

    function generateSkillSuggestions(jobTitle) {
        const lowerJobTitle = jobTitle.toLowerCase();

        const defaultSkills = [
            "Communication, Teamwork, Problem Solving, Time Management, Adaptability, Leadership, Critical Thinking, Attention to Detail, Project Management, Microsoft Office",
            "Collaboration, Organization, Research, Analytical Thinking, Customer Service, Presentation Skills, Creativity, Decision Making, Interpersonal Skills, Multitasking",
            "Strategic Planning, Negotiation, Conflict Resolution, Emotional Intelligence, Active Listening, Flexibility, Self-Motivation, Work Ethic, Verbal Communication, Written Communication"
        ];

        const techSkills = [
            "JavaScript, HTML, CSS, React, Node.js, SQL, Git, RESTful APIs, Responsive Design, Agile Methodology, Problem Solving, Communication, UI/UX Design, Testing, Debugging",
            "Python, Java, C++, AWS, Docker, Kubernetes, CI/CD, Database Design, System Architecture, Data Structures, Algorithms, Object-Oriented Programming, Linux, Networking, Cloud Computing",
            "TypeScript, Angular, Vue.js, Express, MongoDB, GraphQL, Redux, Jest, Webpack, SASS, Bootstrap, Material UI, Performance Optimization, Version Control, Technical Documentation"
        ];

        const marketingSkills = [
            "Social Media Marketing, Content Creation, SEO, SEM, Google Analytics, Email Marketing, Market Research, Campaign Management, Adobe Creative Suite, CRM Software, Copywriting, Brand Development, Data Analysis, Strategic Planning, Communication",
            "Digital Marketing, Content Strategy, PPC Advertising, Marketing Automation, A/B Testing, Customer Segmentation, Lead Generation, Conversion Optimization, Social Media Management, Google Ads, Facebook Ads, Instagram Marketing, LinkedIn Marketing, Twitter Marketing, Marketing Analytics",
            "Content Marketing, Influencer Marketing, Brand Storytelling, Public Relations, Event Planning, Customer Journey Mapping, Competitive Analysis, Marketing Funnel Optimization, HubSpot, Mailchimp, Canva, Photoshop, Illustrator, Video Editing, Presentation Skills"
        ];

        const financeSkills = [
            "Financial Analysis, Budgeting, Forecasting, Excel, Financial Modeling, Accounting Principles, Risk Assessment, Data Analysis, Financial Reporting, QuickBooks, Communication, Attention to Detail, Problem Solving, Critical Thinking, Strategic Planning",
            "Financial Statement Analysis, Variance Analysis, Cost Accounting, Tax Preparation, Investment Analysis, Cash Flow Management, Profit & Loss Analysis, Balance Sheet Analysis, SAP, Oracle Financials, Bloomberg Terminal, Financial Software, Regulatory Compliance, Internal Controls, Audit Procedures",
            "Corporate Finance, Mergers & Acquisitions, Valuation, Capital Budgeting, Financial Planning, Portfolio Management, Risk Management, Banking, Insurance, Real Estate Finance, Taxation, GAAP, IFRS, Financial Regulations, Business Intelligence"
        ];

        if (lowerJobTitle.includes('developer') || lowerJobTitle.includes('engineer') || lowerJobTitle.includes('programmer') || lowerJobTitle.includes('software')) {
            return techSkills;
        } else if (lowerJobTitle.includes('market') || lowerJobTitle.includes('content') || lowerJobTitle.includes('brand') || lowerJobTitle.includes('social media')) {
            return marketingSkills;
        } else if (lowerJobTitle.includes('financ') || lowerJobTitle.includes('account') || lowerJobTitle.includes('audit') || lowerJobTitle.includes('tax')) {
            return financeSkills;
        } else {
            return defaultSkills;
        }
    }

    function enhanceDescription(descriptionElement) {
        const currentDescription = descriptionElement.value;

        if (!currentDescription) {
            alert('Please enter a description first.');
            return;
        }

        // Show AI suggestions modal
        const modal = new bootstrap.Modal(document.getElementById('aiSuggestionsModal'));
        modal.show();

        // Show loading state
        document.querySelector('.ai-loading').style.display = 'block';
        document.querySelector('.ai-suggestions').style.display = 'none';

        // Simulate AI generation (in a real app, this would call an API)
        setTimeout(() => {
            // Hide loading state
            document.querySelector('.ai-loading').style.display = 'none';
            document.querySelector('.ai-suggestions').style.display = 'block';

            // Generate enhanced descriptions
            const suggestionList = document.querySelector('.suggestion-list');
            suggestionList.innerHTML = '';

            const suggestions = enhanceDescriptionText(currentDescription);

            suggestions.forEach((suggestion, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.dataset.index = index;
                suggestionItem.textContent = suggestion;

                suggestionItem.addEventListener('click', function () {
                    // Toggle selected class
                    document.querySelectorAll('.suggestion-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    this.classList.add('selected');
                });

                suggestionList.appendChild(suggestionItem);
            });

            // Set up apply button
            document.getElementById('apply-suggestion').addEventListener('click', function () {
                const selectedSuggestion = document.querySelector('.suggestion-item.selected');
                if (selectedSuggestion) {
                    descriptionElement.value = selectedSuggestion.textContent;
                    saveFormData();
                    updateResumePreview();
                    modal.hide();
                }
            });
        }, 1500);
    }

    function enhanceDescriptionText(description) {
        // Add action verbs and quantifiable achievements
        const enhancedVersion1 = description.replace(
            /^(.*?)$/m,
            (match) => `Led and executed ${match.toLowerCase()}`
        ).replace(
            /\b(managed|worked on|helped with|did|made)\b/gi,
            () => ['Spearheaded', 'Orchestrated', 'Implemented', 'Executed', 'Pioneered', 'Transformed'][Math.floor(Math.random() * 6)]
        ) + ' Resulted in 30% improvement in efficiency and significant cost savings.';

        // Add more technical details and metrics
        const enhancedVersion2 = description.replace(
            /^(.*?)$/m,
            (match) => `Utilized advanced methodologies to ${match.toLowerCase()}`
        ).replace(
            /\b(managed|worked on|helped with|did|made)\b/gi,
            () => ['Developed', 'Engineered', 'Architected', 'Designed', 'Constructed', 'Formulated'][Math.floor(Math.random() * 6)]
        ) + ' Achieved measurable results including 25% reduction in processing time and 40% increase in user satisfaction.';

        // Add leadership and collaboration aspects
        const enhancedVersion3 = description.replace(
            /^(.*?)$/m,
            (match) => `Collaborated with cross-functional teams to ${match.toLowerCase()}`
        ).replace(
            /\b(managed|worked on|helped with|did|made)\b/gi,
            () => ['Coordinated', 'Facilitated', 'Directed', 'Guided', 'Mentored', 'Led'][Math.floor(Math.random() * 6)]
        ) + ' Successfully delivered project on time and under budget, receiving recognition from senior management.';

        return [enhancedVersion1, enhancedVersion2, enhancedVersion3];
    }
});