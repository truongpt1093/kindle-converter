/**
 * DOCX to HTML Converter using Mammoth.js
 */
class DOCXConverter {
    /**
     * Convert DOCX file to HTML
     * @param {File} file - DOCX file
     * @param {Function} progressCallback - Progress callback (percent, message)
     * @returns {Object} - Converted data with content, html, chapters
     */
    async convert(file, progressCallback) {
        try {
            progressCallback(10, 'Đang đọc file Word...');

            const arrayBuffer = await file.arrayBuffer();

            progressCallback(40, 'Đang chuyển đổi định dạng...');

            // Convert DOCX to HTML using Mammoth
            const result = await mammoth.convertToHtml(
                { arrayBuffer: arrayBuffer },
                {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Title'] => h1:fresh",
                        "p[style-name='Subtitle'] => h2:fresh"
                    ],
                    includeDefaultStyleMap: true,
                    convertImage: mammoth.images.imgElement(function(image) {
                        return image.read("base64").then(function(imageBuffer) {
                            return {
                                src: "data:" + image.contentType + ";base64," + imageBuffer
                            };
                        });
                    })
                }
            );

            progressCallback(70, 'Trích xuất nội dung...');

            const html = result.value;
            const messages = result.messages;

            // Log any warnings or errors from Mammoth
            if (messages.length > 0) {
                console.log('Mammoth conversion messages:', messages);
            }

            // Extract chapters from HTML
            const chapters = this.extractChaptersFromHTML(html);

            progressCallback(85, 'Xử lý văn bản...');

            // Convert HTML to plain text for backup
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            progressCallback(95, 'Hoàn tất xử lý Word');

            return {
                content: html,
                html: html,
                plainText: plainText,
                chapters: chapters,
                metadata: {
                    source: 'DOCX',
                    warnings: messages.filter(m => m.type === 'warning').length,
                    errors: messages.filter(m => m.type === 'error').length
                }
            };

        } catch (error) {
            console.error('DOCX conversion error:', error);
            throw new Error(`Lỗi khi chuyển đổi DOCX: ${error.message}`);
        }
    }

    /**
     * Extract chapters from HTML headings
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

        // If no headings found, try to detect from paragraphs
        if (chapters.length === 0) {
            const paragraphs = doc.querySelectorAll('p');
            paragraphs.forEach((p, index) => {
                const text = p.textContent.trim();
                if (Utils.isHeading(text)) {
                    chapters.push({
                        title: text,
                        level: 1,
                        index: index
                    });
                }
            });
        }

        return chapters;
    }
}

// Make DOCXConverter globally available
window.DOCXConverter = DOCXConverter;
