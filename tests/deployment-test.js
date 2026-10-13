/**
 * Deployment Test Script
 * Tests basic functionality to ensure the site works after deployment
 */

class DeploymentTest {
    constructor() {
        this.results = [];
        this.baseUrl = window.location.origin;
    }

    async runAllTests() {
        console.log('🚀 Starting deployment tests...');
        
        await this.testHomepageLoad();
        await this.testDirectoryLoad();
        await this.testViewerLoad();
        await this.testAssetLoading();
        await this.testPDFAccess();
        
        this.displayResults();
    }

    async testHomepageLoad() {
        try {
            const response = await fetch(`${this.baseUrl}/index.html`);
            const success = response.ok;
            this.addResult('Homepage Load', success, success ? 'Homepage loads successfully' : `HTTP ${response.status}`);
        } catch (error) {
            this.addResult('Homepage Load', false, error.message);
        }
    }

    async testDirectoryLoad() {
        try {
            const response = await fetch(`${this.baseUrl}/directory.html`);
            const success = response.ok;
            this.addResult('Directory Load', success, success ? 'Directory page loads successfully' : `HTTP ${response.status}`);
        } catch (error) {
            this.addResult('Directory Load', false, error.message);
        }
    }

    async testViewerLoad() {
        try {
            const response = await fetch(`${this.baseUrl}/viewer.html`);
            const success = response.ok;
            this.addResult('Viewer Load', success, success ? 'Viewer page loads successfully' : `HTTP ${response.status}`);
        } catch (error) {
            this.addResult('Viewer Load', false, error.message);
        }
    }

    async testAssetLoading() {
        const assets = [
            '/css/main.css',
            '/js/main.js',
            '/js/pdf-manager.js'
        ];

        for (const asset of assets) {
            try {
                const response = await fetch(`${this.baseUrl}${asset}`);
                const success = response.ok;
                this.addResult(`Asset: ${asset}`, success, success ? 'Asset loads successfully' : `HTTP ${response.status}`);
            } catch (error) {
                this.addResult(`Asset: ${asset}`, false, error.message);
            }
        }
    }

    async testPDFAccess() {
        try {
            // GitHub Pages has no directory listings, so verify the generated
            // manifest instead: it is what the site uses to build the library
            const response = await fetch(`${this.baseUrl}/pdfs/metadata/manifest.json`);
            let success = response.ok;
            let message = success ? 'Manifest loads successfully' : `HTTP ${response.status}`;

            if (success) {
                try {
                    const manifest = await response.json();
                    success = Array.isArray(manifest.files);
                    message = success
                        ? `Manifest lists ${manifest.files.length} PDF(s)`
                        : 'Manifest has no "files" array';
                } catch (parseError) {
                    success = false;
                    message = 'Manifest is not valid JSON';
                }
            }

            this.addResult('PDF Manifest', success, message);
        } catch (error) {
            this.addResult('PDF Manifest', false, error.message);
        }
    }

    addResult(testName, success, message) {
        this.results.push({
            name: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    displayResults() {
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        
        console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All deployment tests passed! The site is ready.');
        } else {
            console.log('⚠️  Some tests failed. Check the issues above.');
        }

        // Display results in DOM if available
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = this.generateResultsHTML();
        }
    }

    generateResultsHTML() {
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        
        let html = `
            <div class="test-summary">
                <h3>Deployment Test Results</h3>
                <p><strong>${passed}/${total}</strong> tests passed</p>
            </div>
            <div class="test-details">
        `;
        
        this.results.forEach(result => {
            const statusIcon = result.success ? '✅' : '❌';
            const statusClass = result.success ? 'success' : 'failure';
            
            html += `
                <div class="test-result ${statusClass}">
                    <span class="status">${statusIcon}</span>
                    <span class="name">${result.name}</span>
                    <span class="message">${result.message}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
}

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined') {
    window.DeploymentTest = DeploymentTest;
    
    // Run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const tester = new DeploymentTest();
            tester.runAllTests();
        });
    } else {
        const tester = new DeploymentTest();
        tester.runAllTests();
    }
}

// Export for Node.js testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeploymentTest;
}