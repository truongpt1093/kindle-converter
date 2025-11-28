/**
 * PDF to HTML/Text Converter using PDF.js
 */
class PDFConverter {
    constructor() {
        // Set PDF.js worker path
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Convert PDF file to HTML/Text
     * @param {File} file - PDF file
     * @param {Function} progressCallback - Progress callback (percent, message)
     * @returns {Object} - Converted data with content, chapters, pageCount
     */
    async convert(file, progressCallback) {
        try {
            progressCallback(10, 'Đang đọc file PDF...');

            const arrayBuffer = await file.arrayBuffer();

            progressCallback(20, 'Đang tải PDF document...');

            // Load PDF
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            const totalPages = pdf.numPages;
            progressCallback(30, `Đang trích xuất văn bản (${totalPages} trang)...`);

            let fullText = '';
            let htmlContent = '';
            const textItems = [];

            // Extract text from each page
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                let pageText = '';
                textContent.items.forEach(item => {
                    if (item.str) {
                        pageText += item.str + ' ';
                        textItems.push({
                            text: item.str,
                            page: pageNum,
                            height: item.height || 12
                        });
                    }
                });

                fullText += `\n\n--- Trang ${pageNum} ---\n\n${pageText.trim()}`;
                htmlContent += `<div class="pdf-page" data-page="${pageNum}">\n${this.textToHTML(pageText.trim())}\n</div>\n\n`;

                const progress = 30 + (60 * pageNum / totalPages);
                progressCallback(progress, `Xử lý trang ${pageNum}/${totalPages}...`);
            }

            progressCallback(92, 'Đang phát hiện chapters...');

            // Auto detect chapters from text
            const chapters = this.detectChapters(fullText, textItems);

            progressCallback(95, 'Hoàn tất trích xuất PDF');

            return {
                content: fullText,
                html: htmlContent,
                plainText: fullText,
                chapters: chapters,
                pageCount: totalPages,
                metadata: {
                    source: 'PDF',
                    pages: totalPages
                }
            };

        } catch (error) {
            console.error('PDF conversion error:', error);
            throw new Error(`Lỗi khi chuyển đổi PDF: ${error.message}`);
        }
    }

    /**
     * Convert plain text to HTML paragraphs
     */
    textToHTML(text) {
        if (!text) return '';

        const paragraphs = text.split(/\n\n+/);
        let html = '';

        paragraphs.forEach(para => {
            para = para.trim();
            if (!para) return;

            // Detect if it's a heading
            if (Utils.isHeading(para)) {
                html += `<h2>${Utils.escapeHTML(para)}</h2>\n`;
            } else {
                html += `<p>${Utils.escapeHTML(para).replace(/\n/g, '<br>')}</p>\n`;
            }
        });

        return html;
    }

    /**
     * Detect chapters from text using patterns
     */
    detectChapters(text, textItems = []) {
        const chapters = [];

        // Pattern 1: "Chương 1", "Chapter 1", etc.
        const chapterRegex = /^(Chương|Chapter|CHƯƠNG|Phần|Part|PART)\s+(\d+|[IVXLCDM]+)[\s:.\-]+(.+)?$/gm;
        let match;

        while ((match = chapterRegex.exec(text)) !== null) {
            chapters.push({
                title: match[0].trim(),
                level: 1,
                position: match.index
            });
        }

        // Pattern 2: Find potential headings from larger text items
        if (textItems.length > 0) {
            const avgHeight = textItems.reduce((sum, item) => sum + item.height, 0) / textItems.length;

            textItems.forEach(item => {
                // If text is significantly larger than average, it might be a heading
                if (item.height > avgHeight * 1.3 && item.text.length > 3 && item.text.length < 100) {
                    const exists = chapters.some(ch => ch.title.includes(item.text));
                    if (!exists) {
                        chapters.push({
                            title: item.text.trim(),
                            level: 2,
                            page: item.page
                        });
                    }
                }
            });
        }

        // Remove duplicates and sort by position
        const uniqueChapters = [];
        const seen = new Set();

        chapters.forEach(ch => {
            if (!seen.has(ch.title)) {
                seen.add(ch.title);
                uniqueChapters.push(ch);
            }
        });

        return uniqueChapters;
    }
}

// Make PDFConverter globally available
window.PDFConverter = PDFConverter;
