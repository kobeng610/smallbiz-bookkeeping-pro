/**
 * SmallBiz BookKeeping Pro - License Authentication System
 * Handles license validation, device fingerprinting, and anti-piracy measures
 */

class LicenseAuth {
    constructor() {
        this.licenseKey = null;
        this.deviceFingerprint = null;
        this.validLicenses = this.initializeLicenseDatabase();
    }

    /**
     * Initialize the license database
     * In production, this would connect to a remote server
     */
    initializeLicenseDatabase() {
        return {
            'SBKP-2025-XXXX-TRIAL': {
                type: 'trial',
                deviceFingerprint: null,
                activatedAt: null,
                expiresAt: null,
                features: ['basic']
            },
            'SBKP-2025-DEMO-00001': {
                type: 'full',
                deviceFingerprint: null,
                activatedAt: null,
                expiresAt: null,
                features: ['all']
            },
            'SBKP-2025-PROD-12345': {
                type: 'full',
                deviceFingerprint: null,
                activatedAt: null,
                expiresAt: null,
                features: ['all']
            }
        };
    }

    /**
     * Generate a unique device fingerprint
     * Combines multiple browser and system attributes
     */
    async generateDeviceFingerprint() {
        const components = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(',') : '',
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            canvasFingerprint: await this.getCanvasFingerprint(),
            webglFingerprint: this.getWebGLFingerprint(),
            audioFingerprint: await this.getAudioFingerprint()
        };

        const fingerprint = JSON.stringify(components);
        return this.hashString(fingerprint);
    }

    /**
     * Generate canvas fingerprint
     */
    async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            // Draw text with specific styling
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('SmallBiz BookKeeping Pro 🔐', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('SmallBiz BookKeeping Pro 🔐', 4, 17);

            const dataURL = canvas.toDataURL();
            return this.hashString(dataURL);
        } catch (e) {
            return 'canvas-unavailable';
        }
    }

    /**
     * Generate WebGL fingerprint
     */
    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'webgl-unavailable';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';

            return this.hashString(`${renderer}-${vendor}`);
        } catch (e) {
            return 'webgl-unavailable';
        }
    }

    /**
     * Generate audio fingerprint
     */
    async getAudioFingerprint() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return 'audio-unavailable';

            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

            gainNode.gain.value = 0; // Mute
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start(0);

            return new Promise((resolve) => {
                scriptProcessor.onaudioprocess = function(event) {
                    const output = event.outputBuffer.getChannelData(0);
                    const fingerprint = Array.from(output.slice(0, 30)).join(',');
                    scriptProcessor.disconnect();
                    oscillator.disconnect();
                    context.close();
                    resolve(this.hashString(fingerprint));
                }.bind(this);
            });
        } catch (e) {
            return 'audio-unavailable';
        }
    }

    /**
     * Hash a string to create a unique identifier
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Validate license key format
     */
    validateLicenseFormat(key) {
        // Format: SBKP-YYYY-XXXX-XXXXX
        const pattern = /^SBKP-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;
        return pattern.test(key);
    }

    /**
     * Activate a license key
     */
    async activateLicense(licenseKey) {
        // Validate format
        if (!this.validateLicenseFormat(licenseKey)) {
            return {
                success: false,
                error: 'Invalid license key format'
            };
        }

        // Check if license exists
        const licenseData = this.validLicenses[licenseKey];
        if (!licenseData) {
            return {
                success: false,
                error: 'Invalid license key'
            };
        }

        // Generate device fingerprint
        const deviceFP = await this.generateDeviceFingerprint();

        // Check if license is already activated on another device
        if (licenseData.deviceFingerprint && licenseData.deviceFingerprint !== deviceFP) {
            return {
                success: false,
                error: 'This license is already activated on another device'
            };
        }

        // Activate license
        licenseData.deviceFingerprint = deviceFP;
        licenseData.activatedAt = new Date().toISOString();

        this.licenseKey = licenseKey;
        this.deviceFingerprint = deviceFP;

        // Save to localStorage
        this.saveLicenseData();

        return {
            success: true,
            licenseType: licenseData.type,
            features: licenseData.features
        };
    }

    /**
     * Verify an existing license
     */
    async verifyLicense() {
        const savedLicense = localStorage.getItem('sbkp_license');
        const savedFingerprint = localStorage.getItem('sbkp_fingerprint');

        if (!savedLicense || !savedFingerprint) {
            return false;
        }

        // Check license exists
        const licenseData = this.validLicenses[savedLicense];
        if (!licenseData) {
            return false;
        }

        // Generate current fingerprint
        const currentFingerprint = await this.generateDeviceFingerprint();

        // Verify fingerprint matches
        if (savedFingerprint !== currentFingerprint) {
            return false;
        }

        this.licenseKey = savedLicense;
        this.deviceFingerprint = savedFingerprint;
        return true;
    }

    /**
     * Deactivate license (logout)
     */
    deactivateLicense() {
        if (this.licenseKey && this.validLicenses[this.licenseKey]) {
            this.validLicenses[this.licenseKey].deviceFingerprint = null;
            this.validLicenses[this.licenseKey].activatedAt = null;
        }

        localStorage.removeItem('sbkp_license');
        localStorage.removeItem('sbkp_fingerprint');
        
        this.licenseKey = null;
        this.deviceFingerprint = null;
    }

    /**
     * Save license data to localStorage
     */
    saveLicenseData() {
        localStorage.setItem('sbkp_license', this.licenseKey);
        localStorage.setItem('sbkp_fingerprint', this.deviceFingerprint);
    }

    /**
     * Get license information
     */
    getLicenseInfo() {
        if (!this.licenseKey) return null;

        const licenseData = this.validLicenses[this.licenseKey];
        return {
            key: this.licenseKey,
            type: licenseData.type,
            features: licenseData.features,
            activatedAt: licenseData.activatedAt
        };
    }

    /**
     * Generate a new license key (for admin use)
     */
    static generateLicenseKey() {
        const year = new Date().getFullYear();
        const random1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const random2 = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `SBKP-${year}-${random1}-${random2}`;
    }

    /**
     * Validate features access
     */
    hasFeature(feature) {
        if (!this.licenseKey) return false;
        
        const licenseData = this.validLicenses[this.licenseKey];
        if (!licenseData) return false;

        return licenseData.features.includes('all') || licenseData.features.includes(feature);
    }
}

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseAuth;
}
