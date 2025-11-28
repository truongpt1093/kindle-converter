/**
 * Kindle Converter - Main Application Logic
 * Pure client-side document to EPUB converter
 */

// Global state
let currentFile = null;
let convertedData = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Kindle Converter initialized');
    initializeApp();
});

/**
 * Initialize application and event listeners
 */
function initializeApp() {
    // Get DOM elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const selectBtn = document.getElementById('select-file-btn');
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');
    const convertAnotherBtn = document.getElementById('convert-another-btn');
    const coverImageInput = document.getElementById('cover-image');

    // Drag & Drop events
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);

    // File selection
    selectBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Conversion
    convertBtn.addEventListener('click', startConversion);

    // Download
    downloadBtn.addEventListener('click', downloadEPUB);

    // Reset/Convert another
    convertAnotherBtn.addEventListener('click', reset);

    // Cover image preview
    coverImageInput.addEventListener('change', handleCoverImageChange);

    // Output format change
    const outputFormatSelect = document.getElementById('output-format');
    outputFormatSelect.addEventListener('change', handleOutputFormatChange);

    console.log('✅ Event listeners attached');
}

/**
 * Handle output format change
 */
function handleOutputFormatChange() {
    const outputFormat = document.getElementById('output-format').value;
    const btnText = document.getElementById('convert-btn-text');

    const formatNames = {
        'epub': 'EPUB',
        'html': 'HTML',
        'txt': 'TXT',
        'docx': 'DOCX'
    };

    btnText.textContent = `Chuyển đổi sang ${formatNames[outputFormat] || 'EPUB'}`;

    // Validate if file is selected
    if (currentFile) {
        validateFormatCompatibility();
    }
}

/**
 * Validate input and output format compatibility
 */
function validateFormatCompatibility() {
    const inputExt = currentFile.name.split('.').pop().toLowerCase();
    const outputFormat = document.getElementById('output-format').value;

    // Map extensions to format names
    const inputFormat = inputExt === 'htm' ? 'html' : inputExt;

    const warningDiv = document.getElementById('format-warning');
    if (warningDiv) warningDiv.remove();

    if (inputFormat === outputFormat) {
        // Show warning
        const optionsPanel = document.querySelector('.options-panel');
        const warning = document.createElement('div');
        warning.id = 'format-warning';
        warning.className = 'format-warning';
        warning.style.cssText = 'background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;';
        warning.innerHTML = `
            <strong>⚠️ Cảnh báo:</strong> Định dạng đầu vào (<strong>${inputFormat.toUpperCase()}</strong>)
            và đầu ra (<strong>${outputFormat.toUpperCase()}</strong>) giống nhau!<br>
            <small>Vui lòng chọn định dạng đầu ra khác.</small>
        `;
        optionsPanel.insertBefore(warning, optionsPanel.firstChild);

        // Disable convert button
        document.getElementById('convert-btn').disabled = true;
        document.getElementById('convert-btn').style.opacity = '0.5';
        document.getElementById('convert-btn').style.cursor = 'not-allowed';

        return false;
    } else {
        // Enable convert button
        document.getElementById('convert-btn').disabled = false;
        document.getElementById('convert-btn').style.opacity = '1';
        document.getElementById('convert-btn').style.cursor = 'pointer';

        return true;
    }
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    handleFiles(files);
}

/**
 * Handle file selection
 */
function handleFiles(files) {
    if (!files || files.length === 0) {
        return;
    }

    currentFile = files[0];

    // Validate file type
    const validExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt', 'html', 'htm', 'epub'];
    const fileExtension = currentFile.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        alert('❌ File không được hỗ trợ.\n\nVui lòng chọn: PDF, DOCX, XLSX, TXT, HTML hoặc EPUB');
        return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (currentFile.size > maxSize) {
        alert('❌ File quá lớn.\n\nKích thước tối đa: 50MB\nFile của bạn: ' + Utils.formatFileSize(currentFile.size));
        return;
    }

    console.log('📄 File selected:', currentFile.name, Utils.formatFileSize(currentFile.size));

    // Display file info
    displayFileInfo(currentFile);

    // Show options section, hide upload zone
    document.getElementById('upload-zone').style.display = 'none';
    document.getElementById('file-section').style.display = 'block';

    // Auto-fill metadata from filename
    const nameWithoutExt = currentFile.name.replace(/\.[^/.]+$/, '');
    document.getElementById('book-title').value = nameWithoutExt;

    // Validate format compatibility
    validateFormatCompatibility();
}

/**
 * Display file information
 */
function displayFileInfo(file) {
    const fileList = document.getElementById('file-list');
    const sizeInMB = Utils.formatFileSize(file.size);
    const fileType = file.type || 'Unknown type';

    // Get file icon based on extension
    const ext = file.name.split('.').pop().toLowerCase();
    let icon = '📄';
    if (ext === 'pdf') icon = '📕';
    else if (ext === 'docx' || ext === 'doc') icon = '📘';
    else if (ext === 'xlsx' || ext === 'xls') icon = '📊';
    else if (ext === 'txt') icon = '📝';
    else if (ext === 'html' || ext === 'htm') icon = '🌐';
    else if (ext === 'epub') icon = '📚';

    fileList.innerHTML = `
        <div class="file-item">
            <div class="file-icon">${icon}</div>
            <div class="file-details">
                <div class="file-name">${Utils.escapeHTML(file.name)}</div>
                <div class="file-meta">${sizeInMB} • ${fileType}</div>
            </div>
            <button class="remove-file-btn" onclick="reset()" title="Xóa file">✕</button>
        </div>
    `;
}

/**
 * Handle cover image change
 */
function handleCoverImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('cover-preview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Cover preview">`;
    };
    reader.readAsDataURL(file);
}

/**
 * Start conversion process
 */
async function startConversion() {
    if (!currentFile) {
        alert('⚠️ Vui lòng chọn file trước!');
        return;
    }

    // Validate format compatibility
    if (!validateFormatCompatibility()) {
        alert('❌ Định dạng đầu vào và đầu ra không được giống nhau!\n\nVui lòng chọn định dạng đầu ra khác.');
        return;
    }

    console.log('🔄 Starting conversion...');

    // Get metadata
    const metadata = {
        title: document.getElementById('book-title').value.trim() || 'Untitled',
        author: document.getElementById('book-author').value.trim() || 'Unknown',
        language: document.getElementById('book-language').value,
        autoTOC: document.getElementById('auto-toc').checked,
        coverImage: await getCoverImage()
    };

    console.log('📋 Metadata:', metadata);

    // Show progress section, hide file section
    document.getElementById('file-section').style.display = 'none';
    document.getElementById('progress-section').style.display = 'block';

    try {
        // Step 1: Convert file to intermediate format
        updateProgress(0, 'Bắt đầu chuyển đổi...');

        const fileExt = currentFile.name.split('.').pop().toLowerCase();
        let converter;

        console.log('🔧 Selecting converter for:', fileExt);

        // Select appropriate converter
        switch (fileExt) {
            case 'pdf':
                converter = new PDFConverter();
                break;
            case 'docx':
            case 'doc':
                converter = new DOCXConverter();
                break;
            case 'xlsx':
            case 'xls':
                converter = new ExcelConverter();
                break;
            case 'txt':
            case 'html':
            case 'htm':
                converter = new TXTConverter();
                break;
            case 'epub':
                converter = new EPUBReader();
                converter.convert = converter.parse; // EPUBReader uses parse() instead of convert()
                break;
            default:
                throw new Error('Định dạng file không được hỗ trợ: ' + fileExt);
        }

        // Convert file
        console.log('📝 Converting file...');
        convertedData = await converter.convert(currentFile, updateProgress);
        console.log('✅ Conversion complete:', convertedData);

        // Step 2: Generate output file
        const outputFormat = document.getElementById('output-format').value;
        const formatNames = { epub: 'EPUB', html: 'HTML', txt: 'TXT', docx: 'DOCX' };
        const extensions = { epub: '.epub', html: '.html', txt: '.txt', docx: '.docx' };

        updateProgress(0, `Đang tạo file ${formatNames[outputFormat]}...`);
        console.log(`📦 Generating ${formatNames[outputFormat]}...`);

        // Select appropriate generator
        let generator;
        switch (outputFormat) {
            case 'epub':
                generator = new EPUBGenerator();
                break;
            case 'html':
                generator = new HTMLGenerator();
                break;
            case 'txt':
                generator = new TXTGenerator();
                break;
            case 'docx':
                generator = new DOCXGenerator();
                break;
            default:
                throw new Error('Định dạng đầu ra không được hỗ trợ: ' + outputFormat);
        }

        const outputBlob = await generator.generate(convertedData, metadata, updateProgress);

        console.log(`✅ ${formatNames[outputFormat]} generated:`, Utils.formatFileSize(outputBlob.size));

        // Save for download
        window.outputBlob = outputBlob;
        window.outputFilename = Utils.sanitizeFilename(metadata.title) + extensions[outputFormat];
        window.outputFormat = outputFormat;

        // Show success section
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('download-section').style.display = 'block';

        console.log('🎉 Conversion successful!');

    } catch (error) {
        console.error('❌ Conversion error:', error);

        // Show error message
        const errorMessage = error.message || 'Đã xảy ra lỗi không xác định';
        alert(`❌ Lỗi khi chuyển đổi:\n\n${errorMessage}\n\nVui lòng thử lại hoặc chọn file khác.`);

        // Reset to upload zone
        reset();
    }
}

/**
 * Update progress UI
 */
function updateProgress(percent, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressDetail = document.getElementById('progress-detail');

    progressFill.style.width = Math.min(100, Math.max(0, percent)) + '%';
    progressText.textContent = Math.round(percent) + '%';
    progressDetail.textContent = message || '';

    console.log(`📊 Progress: ${Math.round(percent)}% - ${message}`);
}

/**
 * Get cover image as ArrayBuffer
 */
async function getCoverImage() {
    const coverInput = document.getElementById('cover-image');
    if (!coverInput.files || !coverInput.files[0]) {
        return null;
    }

    try {
        const file = coverInput.files[0];
        console.log('🖼️ Cover image:', file.name, Utils.formatFileSize(file.size));
        return await file.arrayBuffer();
    } catch (error) {
        console.warn('Could not load cover image:', error);
        return null;
    }
}

/**
 * Download output file
 */
function downloadEPUB() {
    if (!window.outputBlob) {
        alert('⚠️ Không tìm thấy file. Vui lòng thử lại.');
        return;
    }

    const formatNames = { epub: 'EPUB', html: 'HTML', txt: 'TXT', docx: 'DOCX' };
    const formatName = formatNames[window.outputFormat] || 'file';

    console.log(`📥 Downloading ${formatName}:`, window.outputFilename);

    try {
        // Create download link
        const url = URL.createObjectURL(window.outputBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = window.outputFilename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('✅ Download started');

    } catch (error) {
        console.error('Download error:', error);
        alert('❌ Lỗi khi tải file. Vui lòng thử lại.');
    }
}

/**
 * Reset application to initial state
 */
function reset() {
    console.log('🔄 Resetting application...');

    // Clear state
    currentFile = null;
    convertedData = null;
    window.outputBlob = null;
    window.outputFilename = null;
    window.outputFormat = null;

    // Clear form inputs
    document.getElementById('file-input').value = '';
    document.getElementById('book-title').value = '';
    document.getElementById('book-author').value = '';
    document.getElementById('cover-image').value = '';
    document.getElementById('cover-preview').innerHTML = '';
    document.getElementById('output-format').value = 'epub';

    // Remove format warning if exists
    const warningDiv = document.getElementById('format-warning');
    if (warningDiv) warningDiv.remove();

    // Reset UI
    document.getElementById('upload-zone').style.display = 'block';
    document.getElementById('file-section').style.display = 'none';
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('download-section').style.display = 'none';

    console.log('✅ Reset complete');
}

// Make reset function globally accessible (for onclick handler)
window.reset = reset;

console.log('📚 Kindle Converter loaded successfully');
