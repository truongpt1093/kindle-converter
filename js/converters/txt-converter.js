/**
 * TXT/HTML to HTML Converter
 */
class TXTConverter {
    /**
     * Convert TXT/HTML file to HTML
     * @param {File} file - Text/HTML file
     * @param {Function} progressCallback - Progress callback (percent, message)
     * @returns {Object} - Converted data with html content and chapters
     */
    async convert(file, progressCallback) {
        try {
            progressCallback(20, 'Đang đọc file text...');

            const text = await file.text();
            const isHTML = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');

            progressCallback(50, 'Đang format nội dung...');

            let html;
            let chapters;

            if (isHTML) {
                // If already HTML, just clean it up
                html = this.cleanHTML(text);
                chapters = this.extractChaptersFromHTML(html);
            } else {
                // Convert plain text to HTML
                html = this.textToHTML(text);
                chapters = this.detectChapters(text);
            }

            progressCallback(90, 'Hoàn tất xử lý text');

            return {
                content: text,
                html: html,
                plainText: text,
                chapters: chapters,
                metadata: {
                    source: isHTML ? 'HTML' : 'TXT',
                    length: text.length
                }
            };

        } catch (error) {
            console.error('TXT conversion error:', error);
            throw new Error(`Lỗi khi chuyển đổi TXT: ${error.message}`);
        }
    }

    /**
     * Convert plain text to HTML
     */
    textToHTML(text) {
        if (!text) return '';

        // Split by double newlines = paragraphs
        const paragraphs = text.split(/\n\n+/);
        let html = '';

        paragraphs.forEach(para => {
            para = para.trim();
            if (!para) return;

            // Detect if it's a heading
            if (Utils.isHeading(para)) {
                html += `<h2>${Utils.escapeHTML(para)}</h2>\n`;
            } else {
                // Convert single newlines to <br>, keep as paragraph
                const paraHTML = Utils.escapeHTML(para).replace(/\n/g, '<br>');
                html += `<p>${paraHTML}</p>\n`;
            }
        });

        return html || `<p>${Utils.escapeHTML(text)}</p>`;
    }

    /**
     * Clean HTML content
     */
    cleanHTML(html) {
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script and style tags
        const scripts = tempDiv.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());

        // Get body content if exists, otherwise use all content
        const body = tempDiv.querySelector('body');
        return body ? body.innerHTML : tempDiv.innerHTML;
    }

    /**
     * Extract chapters from HTML
     */
    extractChaptersFromHTML(html) {
        const chapters = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find all headings
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headings.forEach((heading, index) => {
            const text = heading.textContent.trim();
            if (text && text.length > 0) {
                chapters.push({
                    title: text,
                    level: parseInt(heading.tagName[1]),
                    index: index
                });
            }
        });

        return chapters;
    }

    /**
     * Detect chapters from plain text
     */
    detectChapters(text) {
        const chapters = [];

        // Pattern: "Chương 1", "Chapter 1", etc.
        const chapterRegex = /^(Chương|Chapter|CHƯƠNG|Phần|Part|PART|MỤC LỤC|Table of Contents)\s+(.+)$/gm;
        let match;

        while ((match = chapterRegex.exec(text)) !== null) {
            chapters.push({
                title: match[0].trim(),
                level: 1,
                position: match.index
            });
        }

        // Also find potential headings (all caps lines, short)
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            line = line.trim();
            if (line.length > 3 && line.length < 100) {
                if (line === line.toUpperCase() && /[A-Z]/.test(line)) {
                    // Check if not already added
                    const exists = chapters.some(ch => ch.title === line);
                    if (!exists) {
                        chapters.push({
                            title: line,
                            level: 2,
                            lineIndex: index
                        });
                    }
                }
            }
        });

        return chapters;
    }
}

// Make TXTConverter globally available
window.TXTConverter = TXTConverter;
