// PDF Manager class for handling PDF files and metadata

class PDFManager {
    constructor(pdfDirectory = './pdfs/') {
        this.pdfDirectory = pdfDirectory;
        this.metadataDirectory = `${pdfDirectory}metadata/`;
        this.manifestPath = `${this.metadataDirectory}manifest.json`;
        this.pdfList = [];
        this.metadataCache = new Map();
        this.loadingPromise = null;
    }

    /**
     * Load the list of PDF files from the manifest file
     * @returns {Promise<Array>} Array of PDF file objects
     */
    async loadPDFList() {
        // Prevent multiple simultaneous loads
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadPDFListInternal();
        
        try {
            const result = await this.loadingPromise;
            return result;
        } finally {
            this.loadingPromise = null;
        }
    }

    /**
     * Internal method to load PDF list from manifest
     * @private
     */
    async _loadPDFListInternal() {
        try {
            Logger.debug('Loading PDF list from manifest', { manifestPath: this.manifestPath });
            
            const response = await fetch(this.manifestPath);
            
            if (!response.ok) {
                if (response.status === 404) {
                    Logger.info('Manifest file not found, creating empty list');
                    this.pdfList = [];
                    return this.pdfList;
                }
                throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
            }

            const manifest = await response.json();
            
            if (!Array.isArray(manifest.files)) {
                throw new Error('Invalid manifest format: files property must be an array');
            }

            // Validate and process each PDF file entry
            this.pdfList = [];
            for (const fileEntry of manifest.files) {
                if (this.validatePDFEntry(fileEntry)) {
                    // Add full path and validate file existence
                    const pdfFile = {
                        ...fileEntry,
                        fullPath: `${this.pdfDirectory}${fileEntry.filename}`,
                        url: `${this.pdfDirectory}${fileEntry.filename}`
                    };
                    
                    // Validate the PDF file exists and is accessible
                    if (await this.validatePDFExists(pdfFile.url)) {
                        this.pdfList.push(pdfFile);
                        Logger.debug('Added PDF to list', { filename: pdfFile.filename });
                    } else {
                        Logger.error('PDF file not accessible', { filename: fileEntry.filename, url: pdfFile.url });
                    }
                } else {
                    Logger.error('Invalid PDF entry in manifest', { entry: fileEntry });
                }
            }

            Logger.info('PDF list loaded successfully', { count: this.pdfList.length });
            return this.pdfList;

        } catch (error) {
            Logger.error('Failed to load PDF list', error);
            this.pdfList = [];
            throw new Error(`PDF list loading failed: ${error.message}`);
        }
    }

    /**
     * Validate a PDF entry from the manifest
     * @param {Object} entry - PDF entry object
     * @returns {boolean} True if valid
     */
    validatePDFEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return false;
        }

        // Required fields
        if (!entry.filename || typeof entry.filename !== 'string') {
            Logger.error('PDF entry missing or invalid filename', { entry });
            return false;
        }

        // Validate filename format
        if (!entry.filename.toLowerCase().endsWith('.pdf')) {
            Logger.error('PDF entry filename must end with .pdf', { filename: entry.filename });
            return false;
        }

        // Validate filename doesn't contain path separators
        if (entry.filename.includes('/') || entry.filename.includes('\\')) {
            Logger.error('PDF filename cannot contain path separators', { filename: entry.filename });
            return false;
        }

        // Optional fields validation
        if (entry.fileSize !== undefined && (!Number.isInteger(entry.fileSize) || entry.fileSize < 0)) {
            Logger.error('PDF entry fileSize must be a positive integer', { entry });
            return false;
        }

        if (entry.uploadDate !== undefined && typeof entry.uploadDate !== 'string') {
            Logger.error('PDF entry uploadDate must be a string', { entry });
            return false;
        }

        return true;
    }

    /**
     * Check if a PDF file exists and is accessible
     * @param {string} url - URL to the PDF file
     * @returns {Promise<boolean>} True if file exists and is accessible
     */
    async validatePDFExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            Logger.debug('PDF file validation failed', { url, error: error.message });
            return false;
        }
    }

    /**
     * Validate a PDF file for corruption and proper format
     * @param {string|File} file - PDF file URL or File object
     * @returns {Promise<boolean>} True if PDF is valid
     */
    async validatePDF(file) {
        try {
            let arrayBuffer;
            
            if (typeof file === 'string') {
                // File is a URL
                Logger.debug('Validating PDF from URL', { url: file });
                const response = await fetch(file);
                
                if (!response.ok) {
                    Logger.error('Failed to fetch PDF for validation', { url: file, status: response.status });
                    return false;
                }
                
                arrayBuffer = await response.arrayBuffer();
            } else if (file instanceof File) {
                // File is a File object
                Logger.debug('Validating PDF File object', { name: file.name, size: file.size });
                arrayBuffer = await file.arrayBuffer();
            } else {
                Logger.error('Invalid file parameter for PDF validation', { file });
                return false;
            }

            // Check minimum file size (PDF files should be at least a few hundred bytes)
            if (arrayBuffer.byteLength < 100) {
                Logger.error('PDF file too small to be valid', { size: arrayBuffer.byteLength });
                return false;
            }

            // Check PDF header signature
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = String.fromCharCode(...uint8Array.slice(0, 4));
            
            if (header !== '%PDF') {
                Logger.error('Invalid PDF header signature', { header });
                return false;
            }

            // Check for PDF version in header
            const versionMatch = String.fromCharCode(...uint8Array.slice(0, 8)).match(/%PDF-(\d\.\d)/);
            if (!versionMatch) {
                Logger.error('Invalid PDF version format');
                return false;
            }

            const version = parseFloat(versionMatch[1]);
            if (version < 1.0 || version > 2.0) {
                Logger.error('Unsupported PDF version', { version });
                return false;
            }

            Logger.debug('PDF validation successful', { version });
            return true;

        } catch (error) {
            Logger.error('PDF validation failed', error);
            return false;
        }
    }

    /**
     * Get a PDF file entry by filename
     * @param {string} filename - Name of the PDF file
     * @returns {Object|null} PDF file object or null if not found
     */
    getPDFByFilename(filename) {
        return this.pdfList.find(pdf => pdf.filename === filename) || null;
    }

    /**
     * Get all PDF files
     * @returns {Array} Array of PDF file objects
     */
    getAllPDFs() {
        return [...this.pdfList];
    }

    /**
     * Get the count of loaded PDF files
     * @returns {number} Number of PDF files
     */
    getPDFCount() {
        return this.pdfList.length;
    }

    /**
     * Refresh the PDF list by reloading from manifest
     * @returns {Promise<Array>} Updated array of PDF file objects
     */
    async refreshPDFList() {
        Logger.info('Refreshing PDF list');
        this.pdfList = [];
        this.metadataCache.clear();
        return await this.loadPDFList();
    }

    /**
     * Get metadata for a specific PDF file
     * @param {string} filename - Name of the PDF file (with or without .pdf extension)
     * @returns {Promise<Object>} PDF metadata object
     */
    async getPDFMetadata(filename) {
        try {
            // Normalize filename to remove .pdf extension for metadata lookup
            const baseFilename = filename.replace(/\.pdf$/i, '');
            
            Logger.debug('Loading PDF metadata', { filename, baseFilename });
            
            // Check cache first
            if (this.metadataCache.has(baseFilename)) {
                Logger.debug('Metadata found in cache', { filename: baseFilename });
                return this.metadataCache.get(baseFilename);
            }
            
            // Try to load metadata file
            const metadataPath = `${this.metadataDirectory}${baseFilename}.json`;
            let metadata = null;
            
            try {
                const response = await fetch(metadataPath);
                if (response.ok) {
                    const rawMetadata = await response.json();
                    metadata = await this.validateAndNormalizeMetadata(rawMetadata, filename);
                    Logger.info('Metadata loaded from file', { filename: baseFilename, metadataPath });
                } else if (response.status === 404) {
                    Logger.debug('Metadata file not found, generating default', { filename: baseFilename, metadataPath });
                    metadata = await this.generateDefaultMetadata(filename);
                } else {
                    throw new Error(`Failed to load metadata: ${response.status} ${response.statusText}`);
                }
            } catch (fetchError) {
                Logger.debug('Error loading metadata file, generating default', { 
                    filename: baseFilename, 
                    error: fetchError.message 
                });
                metadata = await this.generateDefaultMetadata(filename);
            }
            
            const manifestEntry = this.getPDFByFilename(filename);
            if (manifestEntry) {
                if (manifestEntry.uploadDate) {
                    metadata.uploadDate = manifestEntry.uploadDate;
                }
                if (manifestEntry.fileSize) {
                    metadata.fileSize = manifestEntry.fileSize;
                }
            }

            // Cache the metadata
            this.metadataCache.set(baseFilename, metadata);
            Logger.debug('Metadata cached', { filename: baseFilename });
            
            return metadata;
            
        } catch (error) {
            Logger.error('Failed to get PDF metadata', { filename, error });
            // Return minimal default metadata as fallback
            return this.generateMinimalMetadata(filename);
        }
    }

    /**
     * Validate and normalize metadata against the schema
     * @param {Object} rawMetadata - Raw metadata from JSON file
     * @param {string} filename - PDF filename for context
     * @returns {Promise<Object>} Validated and normalized metadata
     */
    async validateAndNormalizeMetadata(rawMetadata, filename) {
        try {
            Logger.debug('Validating metadata', { filename, metadata: rawMetadata });
            
            if (!rawMetadata || typeof rawMetadata !== 'object') {
                throw new Error('Metadata must be an object');
            }
            
            // Create normalized metadata with defaults
            const baseFilename = filename.replace(/\.pdf$/i, '');
            const normalized = {
                filename: baseFilename,
                title: rawMetadata.title || this.generateTitleFromFilename(filename),
                description: rawMetadata.description || '',
                tags: Array.isArray(rawMetadata.tags) ? rawMetadata.tags : [],
                uploadDate: rawMetadata.uploadDate || new Date().toISOString(),
                fileSize: rawMetadata.fileSize || null,
                pageCount: rawMetadata.pageCount || null,
                author: rawMetadata.author || '',
                featured: Boolean(rawMetadata.featured)
            };
            
            // Validate required fields
            if (!normalized.title || typeof normalized.title !== 'string') {
                throw new Error('Title is required and must be a string');
            }
            
            // Validate optional fields
            if (normalized.description && typeof normalized.description !== 'string') {
                Logger.error('Invalid description type, using empty string', { filename });
                normalized.description = '';
            }
            
            if (!Array.isArray(normalized.tags)) {
                Logger.error('Invalid tags format, using empty array', { filename });
                normalized.tags = [];
            }
            
            // Validate and clean tags
            normalized.tags = normalized.tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim().toLowerCase())
                .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
            
            // Validate date format
            if (normalized.uploadDate) {
                const date = new Date(normalized.uploadDate);
                if (isNaN(date.getTime())) {
                    Logger.error('Invalid uploadDate format, using current date', { filename, uploadDate: normalized.uploadDate });
                    normalized.uploadDate = new Date().toISOString();
                }
            }
            
            // Validate numeric fields
            if (normalized.fileSize !== null && (!Number.isInteger(normalized.fileSize) || normalized.fileSize < 0)) {
                Logger.error('Invalid fileSize, setting to null', { filename, fileSize: normalized.fileSize });
                normalized.fileSize = null;
            }
            
            if (normalized.pageCount !== null && (!Number.isInteger(normalized.pageCount) || normalized.pageCount < 1)) {
                Logger.error('Invalid pageCount, setting to null', { filename, pageCount: normalized.pageCount });
                normalized.pageCount = null;
            }
            
            Logger.info('Metadata validation successful', { filename, normalized });
            return normalized;
            
        } catch (error) {
            Logger.error('Metadata validation failed', { filename, error });
            throw new Error(`Metadata validation failed: ${error.message}`);
        }
    }

    /**
     * Generate default metadata for a PDF file without metadata
     * @param {string} filename - PDF filename
     * @returns {Promise<Object>} Default metadata object
     */
    async generateDefaultMetadata(filename) {
        try {
            Logger.debug('Generating default metadata', { filename });
            
            const baseFilename = filename.replace(/\.pdf$/i, '');
            const pdfFile = this.getPDFByFilename(filename);
            
            const metadata = {
                filename: baseFilename,
                title: this.generateTitleFromFilename(filename),
                description: '',
                tags: [],
                uploadDate: pdfFile?.uploadDate || new Date().toISOString(),
                fileSize: pdfFile?.fileSize || null,
                pageCount: null,
                author: '',
                featured: false
            };
            
            // Try to get additional file information if available
            if (pdfFile) {
                metadata.fileSize = pdfFile.fileSize;
                metadata.uploadDate = pdfFile.uploadDate;
            }
            
            Logger.info('Default metadata generated', { filename, metadata });
            return metadata;
            
        } catch (error) {
            Logger.error('Failed to generate default metadata', { filename, error });
            return this.generateMinimalMetadata(filename);
        }
    }

    /**
     * Generate minimal metadata as a last resort fallback
     * @param {string} filename - PDF filename
     * @returns {Object} Minimal metadata object
     */
    generateMinimalMetadata(filename) {
        const baseFilename = filename.replace(/\.pdf$/i, '');
        return {
            filename: baseFilename,
            title: this.generateTitleFromFilename(filename),
            description: '',
            tags: [],
            uploadDate: new Date().toISOString(),
            fileSize: null,
            pageCount: null,
            author: '',
            featured: false
        };
    }

    /**
     * Generate a human-readable title from filename
     * @param {string} filename - PDF filename
     * @returns {string} Generated title
     */
    generateTitleFromFilename(filename) {
        return filename
            .replace(/\.pdf$/i, '') // Remove .pdf extension
            .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
            .trim();
    }

    /**
     * Clear metadata cache
     */
    clearMetadataCache() {
        Logger.debug('Clearing metadata cache');
        this.metadataCache.clear();
    }

    /**
     * Get all metadata for loaded PDFs
     * @returns {Promise<Array>} Array of metadata objects
     */
    async getAllMetadata() {
        try {
            Logger.debug('Loading metadata for all PDFs', { count: this.pdfList.length });
            
            const metadataPromises = this.pdfList.map(pdf => 
                this.getPDFMetadata(pdf.filename)
            );
            
            const allMetadata = await Promise.all(metadataPromises);
            
            Logger.info('All metadata loaded', { count: allMetadata.length });
            return allMetadata;
            
        } catch (error) {
            Logger.error('Failed to load all metadata', error);
            throw error;
        }
    }

    async generateThumbnail(pdfUrl) {
        // This method will be implemented in later tasks
        Logger.debug('PDFManager.generateThumbnail() - placeholder', { pdfUrl });
        return null;
    }
}