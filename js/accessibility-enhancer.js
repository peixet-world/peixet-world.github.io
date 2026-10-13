// Accessibility enhancement utilities for PDF sharing website

class AccessibilityEnhancer {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        
        this.announcements = [];
        this.lastFocusedElement = null;
        this.skipLinks = [];
        
        this.initializeAccessibilityFeatures();
    }

    /**
     * Initialize accessibility features
     */
    initializeAccessibilityFeatures() {
        this.createSkipLinks();
        this.setupFocusManagement();
        this.setupKeyboardNavigation();
        this.setupScreenReaderAnnouncements();
        this.enhanceFormAccessibility();
        this.setupColorContrastMonitoring();
        
        Logger.debug('Accessibility enhancer initialized');
    }

    /**
     * Create skip links for keyboard navigation
     */
    createSkipLinks() {
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');
        
        const skipLinks = [
            { href: '#main-content', text: 'Skip to main content' },
            { href: '#navigation', text: 'Skip to navigation' },
            { href: '#search', text: 'Skip to search' },
            { href: '#footer', text: 'Skip to footer' }
        ];
        
        skipLinks.forEach(link => {
            const skipLink = document.createElement('a');
            skipLink.href = link.href;
            skipLink.textContent = link.text;
            skipLink.className = 'skip-link';
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.focusElement(link.href);
            });
            
            skipLinksContainer.appendChild(skipLink);
        });
        
        // Insert skip links at the beginning of the body
        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
        
        Logger.debug('Skip links created');
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.lastFocusedElement = e.target;
            this.announceElementInfo(e.target);
        });
        
        // Handle focus trapping in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
        
        // Ensure focus is visible
        document.addEventListener('focusin', (e) => {
            this.ensureFocusVisible(e.target);
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Arrow key navigation for card grids
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('pdf-card')) {
                this.handleCardGridNavigation(e);
            }
        });
        
        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
        });
        
        // Enter and Space key handling for custom interactive elements
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
                e.preventDefault();
                e.target.click();
            }
        });
    }

    /**
     * Setup screen reader announcements
     */
    setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
        
        // Create assertive live region for urgent announcements
        const assertiveLiveRegion = document.createElement('div');
        assertiveLiveRegion.id = 'assertive-live-region';
        assertiveLiveRegion.className = 'sr-only';
        assertiveLiveRegion.setAttribute('aria-live', 'assertive');
        assertiveLiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(assertiveLiveRegion);
        
        Logger.debug('Screen reader live regions created');
    }

    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        // Add proper labels and descriptions to form elements
        const forms = document.querySelectorAll('form');
        forms.forEach(form => this.enhanceForm(form));
        
        // Monitor for dynamically added forms
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                        forms.forEach(form => this.enhanceForm(form));
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Enhance a specific form
     * @param {HTMLFormElement} form - Form to enhance
     */
    enhanceForm(form) {
        // Ensure form has proper labeling
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.enhanceFormField(input);
        });
        
        // Add form validation announcements
        form.addEventListener('submit', (e) => {
            this.handleFormSubmission(e);
        });
    }

    /**
     * Enhance a form field
     * @param {HTMLElement} field - Form field to enhance
     */
    enhanceFormField(field) {
        // Ensure field has a label
        if (!field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
            const label = field.closest('label') || document.querySelector(`label[for="${field.id}"]`);
            if (!label && field.placeholder) {
                field.setAttribute('aria-label', field.placeholder);
            }
        }
        
        // Add required field announcements
        if (field.required && !field.getAttribute('aria-required')) {
            field.setAttribute('aria-required', 'true');
        }
        
        // Add invalid field handling
        field.addEventListener('invalid', () => {
            this.announceFieldError(field);
        });
        
        // Add input validation feedback
        field.addEventListener('input', () => {
            this.validateFieldAccessibility(field);
        });
    }

    /**
     * Setup color contrast monitoring
     */
    setupColorContrastMonitoring() {
        // Check for high contrast mode preference
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
            Logger.debug('High contrast mode detected');
        }
        
        // Monitor for contrast preference changes
        if (window.matchMedia) {
            const contrastQuery = window.matchMedia('(prefers-contrast: high)');
            contrastQuery.addEventListener('change', (e) => {
                if (e.matches) {
                    document.body.classList.add('high-contrast');
                    this.announce('High contrast mode enabled');
                } else {
                    document.body.classList.remove('high-contrast');
                    this.announce('High contrast mode disabled');
                }
            });
        }
    }

    /**
     * Handle tab navigation and focus trapping
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTabNavigation(e) {
        const modal = document.querySelector('.modal:not([hidden])');
        if (modal) {
            this.trapFocusInModal(e, modal);
        }
    }

    /**
     * Trap focus within a modal
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} modal - Modal element
     */
    trapFocusInModal(e, modal) {
        const focusableElements = modal.querySelectorAll(this.focusableElements);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    /**
     * Handle card grid navigation with arrow keys
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleCardGridNavigation(e) {
        const currentCard = e.target;
        const grid = currentCard.closest('.pdf-grid');
        if (!grid) return;
        
        const cards = Array.from(grid.querySelectorAll('.pdf-card'));
        const currentIndex = cards.indexOf(currentCard);
        let targetIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowRight':
                targetIndex = Math.min(currentIndex + 1, cards.length - 1);
                break;
            case 'ArrowLeft':
                targetIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                // Calculate grid columns based on container width
                const gridColumns = this.calculateGridColumns(grid);
                targetIndex = Math.min(currentIndex + gridColumns, cards.length - 1);
                break;
            case 'ArrowUp':
                const gridColumnsUp = this.calculateGridColumns(grid);
                targetIndex = Math.max(currentIndex - gridColumnsUp, 0);
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = cards.length - 1;
                break;
            default:
                return;
        }
        
        if (targetIndex !== currentIndex) {
            e.preventDefault();
            cards[targetIndex].focus();
            this.announceCardPosition(targetIndex + 1, cards.length);
        }
    }

    /**
     * Calculate grid columns for navigation
     * @param {HTMLElement} grid - Grid container
     * @returns {number} Number of columns
     */
    calculateGridColumns(grid) {
        const gridStyle = window.getComputedStyle(grid);
        const gridTemplateColumns = gridStyle.gridTemplateColumns;
        
        if (gridTemplateColumns && gridTemplateColumns !== 'none') {
            return gridTemplateColumns.split(' ').length;
        }
        
        // Fallback: estimate based on card width and container width
        const cards = grid.querySelectorAll('.pdf-card');
        if (cards.length === 0) return 1;
        
        const cardWidth = cards[0].offsetWidth;
        const containerWidth = grid.offsetWidth;
        return Math.floor(containerWidth / cardWidth) || 1;
    }

    /**
     * Handle escape key
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleEscapeKey(e) {
        // Close modals
        const modal = document.querySelector('.modal:not([hidden])');
        if (modal) {
            this.closeModal(modal);
            return;
        }
        
        // Clear search/filters
        const searchInput = document.querySelector('#search-input');
        if (searchInput && searchInput === document.activeElement && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            this.announce('Search cleared');
        }
    }

    /**
     * Focus an element by selector or element
     * @param {string|HTMLElement} target - Target selector or element
     */
    focusElement(target) {
        let element;
        
        if (typeof target === 'string') {
            element = document.querySelector(target);
        } else {
            element = target;
        }
        
        if (element) {
            element.focus();
            
            // Scroll element into view if needed
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Ensure focus is visible
     * @param {HTMLElement} element - Focused element
     */
    ensureFocusVisible(element) {
        // Add focus-visible class for styling
        element.classList.add('focus-visible');
        
        // Remove class when focus is lost
        const removeFocusVisible = () => {
            element.classList.remove('focus-visible');
            element.removeEventListener('blur', removeFocusVisible);
        };
        
        element.addEventListener('blur', removeFocusVisible);
        
        // Ensure element is in viewport
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    /**
     * Announce information to screen readers
     * @param {string} message - Message to announce
     * @param {boolean} assertive - Whether to use assertive announcement
     */
    announce(message, assertive = false) {
        const liveRegionId = assertive ? 'assertive-live-region' : 'live-region';
        const liveRegion = document.getElementById(liveRegionId);
        
        if (liveRegion) {
            // Clear previous announcement
            liveRegion.textContent = '';
            
            // Add new announcement after a brief delay
            setTimeout(() => {
                liveRegion.textContent = message;
            }, 100);
            
            Logger.debug('Screen reader announcement', { message, assertive });
        }
    }

    /**
     * Announce element information when focused
     * @param {HTMLElement} element - Focused element
     */
    announceElementInfo(element) {
        if (element.classList.contains('pdf-card')) {
            const title = element.querySelector('h3');
            const metadata = element.querySelector('.metadata');
            
            if (title) {
                let announcement = `Document: ${title.textContent}`;
                if (metadata) {
                    announcement += `. ${metadata.textContent}`;
                }
                this.announce(announcement);
            }
        }
    }

    /**
     * Announce card position in grid
     * @param {number} position - Current position
     * @param {number} total - Total number of items
     */
    announceCardPosition(position, total) {
        this.announce(`Item ${position} of ${total}`);
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    handleFormSubmission(e) {
        const form = e.target;
        const invalidFields = form.querySelectorAll(':invalid');
        
        if (invalidFields.length > 0) {
            e.preventDefault();
            this.announce(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Please correct and try again.`, true);
            invalidFields[0].focus();
        }
    }

    /**
     * Announce field error
     * @param {HTMLElement} field - Field with error
     */
    announceFieldError(field) {
        const fieldName = this.getFieldName(field);
        const errorMessage = field.validationMessage || 'Invalid input';
        this.announce(`${fieldName}: ${errorMessage}`, true);
    }

    /**
     * Get field name for announcements
     * @param {HTMLElement} field - Form field
     * @returns {string} Field name
     */
    getFieldName(field) {
        const label = field.getAttribute('aria-label') || 
                     field.getAttribute('placeholder') ||
                     field.name ||
                     'Field';
        return label;
    }

    /**
     * Validate field accessibility
     * @param {HTMLElement} field - Form field to validate
     */
    validateFieldAccessibility(field) {
        // Check if field has proper labeling
        const hasLabel = field.getAttribute('aria-label') || 
                        field.getAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${field.id}"]`);
        
        if (!hasLabel) {
            Logger.warn('Form field missing proper label', { field });
        }
        
        // Check if required field is properly marked
        if (field.required && !field.getAttribute('aria-required')) {
            field.setAttribute('aria-required', 'true');
        }
    }

    /**
     * Close modal and restore focus
     * @param {HTMLElement} modal - Modal to close
     */
    closeModal(modal) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        
        // Restore focus to last focused element
        if (this.lastFocusedElement && this.lastFocusedElement !== modal) {
            this.lastFocusedElement.focus();
        }
        
        this.announce('Dialog closed');
    }

    /**
     * Enhance dynamic content accessibility
     * @param {HTMLElement} container - Container with new content
     */
    enhanceDynamicContent(container) {
        // Add proper ARIA labels to new elements
        const interactiveElements = container.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        interactiveElements.forEach(element => {
            this.enhanceInteractiveElement(element);
        });
        
        // Enhance any new forms
        const forms = container.querySelectorAll('form');
        forms.forEach(form => this.enhanceForm(form));
        
        // Add keyboard navigation to new card grids
        const cards = container.querySelectorAll('.pdf-card');
        cards.forEach(card => {
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Enhance interactive element
     * @param {HTMLElement} element - Interactive element to enhance
     */
    enhanceInteractiveElement(element) {
        // Ensure element has proper role
        if (element.tagName === 'DIV' && element.onclick && !element.getAttribute('role')) {
            element.setAttribute('role', 'button');
        }
        
        // Ensure element is keyboard accessible
        if (element.getAttribute('role') === 'button' && !element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        // Add keyboard event handlers for custom buttons
        if (element.getAttribute('role') === 'button' && !element.hasKeyboardHandler) {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
            element.hasKeyboardHandler = true;
        }
    }

    /**
     * Check color contrast compliance
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Whether contrast is sufficient
     */
    checkColorContrast(element) {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // This is a simplified check - in production, you'd use a proper contrast calculation
        const bgLuminance = this.calculateLuminance(backgroundColor);
        const textLuminance = this.calculateLuminance(color);
        
        const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                        (Math.min(bgLuminance, textLuminance) + 0.05);
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        const fontSize = parseFloat(styles.fontSize);
        const requiredContrast = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700) ? 3 : 4.5;
        
        return contrast >= requiredContrast;
    }

    /**
     * Calculate relative luminance (simplified)
     * @param {string} color - CSS color value
     * @returns {number} Relative luminance
     */
    calculateLuminance(color) {
        // This is a very simplified calculation
        // In production, you'd parse RGB values and apply the proper formula
        if (color.includes('rgb')) {
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
                const r = parseInt(matches[0]) / 255;
                const g = parseInt(matches[1]) / 255;
                const b = parseInt(matches[2]) / 255;
                return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            }
        }
        return 0.5; // Default fallback
    }

    /**
     * Get accessibility status
     * @returns {Object} Accessibility status information
     */
    getAccessibilityStatus() {
        const focusableCount = document.querySelectorAll(this.focusableElements).length;
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
        const formsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length;
        
        return {
            focusableElements: focusableCount,
            imagesWithoutAlt,
            formsWithoutLabels,
            skipLinksPresent: document.querySelectorAll('.skip-link').length > 0,
            liveRegionsPresent: document.getElementById('live-region') !== null
        };
    }
}

// Global accessibility enhancer instance
window.AccessibilityEnhancer = new AccessibilityEnhancer();