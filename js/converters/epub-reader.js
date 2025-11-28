/**
 * EPUB Reader/Parser
 * Reads EPUB files and extracts content
 */
class EPUBReader {
    /**
     * Parse EPUB file to extract content
     * @param {File} file - EPUB file
     * @param {Function} progressCallback - Progress callback
     * @returns {Object} - Extracted content, metadata, chapters
     */
    async parse(file, progressCallback) {
        try {
            progressCallback(10, 'Đang đọc file EPUB...');

            const arrayBuffer = await file.arrayBuffer();

            progressCallback(30, 'Đang giải nén EPUB...');

            // Load EPUB (ZIP format)
            const zip = await JSZip.loadAsync(arrayBuffer);

            progressCallback(50, 'Đang trích xuất nội dung...');

            // Find content.opf
            const opfFile = await this.findOPFFile(zip);
            if (!opfFile) {
                throw new Error('Không tìm thấy file content.opf trong EPUB');
            }

            const opfContent = await zip.file(opfFile).async('string');
            const parser = new DOMParser();
            const opfDoc = parser.parseFromString(opfContent, 'text/xml');

            progressCallback(60, 'Đang đọc metadata...');

            // Extract metadata
            const metadata = this.extractMetadata(opfDoc);

            progressCallback(70, 'Đang đọc chapters...');

            // Extract spine (reading order)
            const spine = this.extractSpine(opfDoc);
            const manifest = this.extractManifest(opfDoc);

            progressCallback(80, 'Đang xử lý nội dung...');

            // Extract content from each chapter
            let htmlContent = '';
            const chapters = [];
            const opfBasePath = opfFile.substring(0, opfFile.lastIndexOf('/') + 1);

            for (let i = 0; i < spine.length; i++) {
                const itemId = spine[i];
                const item = manifest[itemId];

                if (item && item.mediaType === 'application/xhtml+xml') {
                    const contentPath = opfBasePath + item.href;
                    const chapterFile = zip.file(contentPath);

                    if (chapterFile) {
                        const chapterContent = await chapterFile.async('string');
                        const chapterDoc = parser.parseFromString(chapterContent, 'text/html');

                        // Extract body content
                        const body = chapterDoc.querySelector('body');
                        if (body) {
                            htmlContent += body.innerHTML + '\n\n';

                            // Extract chapter title (first h1/h2)
                            const heading = body.querySelector('h1, h2');
                            if (heading) {
                                chapters.push({
                                    title: heading.textContent.trim(),
                                    level: parseInt(heading.tagName[1])
                                });
                            }
                        }
                    }
                }

                progressCallback(80 + (10 * i / spine.length), `Đọc chapter ${i + 1}/${spine.length}...`);
            }

            progressCallback(95, 'Hoàn tất đọc EPUB');

            // Convert HTML to plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            return {
                content: htmlContent,
                html: htmlContent,
                plainText: plainText,
                chapters: chapters,
                metadata: metadata
            };

        } catch (error) {
            console.error('EPUB parsing error:', error);
            throw new Error(`Lỗi khi đọc EPUB: ${error.message}`);
        }
    }

    /**
     * Find content.opf file in EPUB
     */
    async findOPFFile(zip) {
        // Check META-INF/container.xml
        const containerFile = zip.file('META-INF/container.xml');
        if (containerFile) {
            const containerContent = await containerFile.async('string');
            const parser = new DOMParser();
            const containerDoc = parser.parseFromString(containerContent, 'text/xml');
            const rootfile = containerDoc.querySelector('rootfile');
            if (rootfile) {
                return rootfile.getAttribute('full-path');
            }
        }

        // Fallback: search for .opf file
        const opfFiles = Object.keys(zip.files).filter(name => name.endsWith('.opf'));
        return opfFiles.length > 0 ? opfFiles[0] : null;
    }

    /**
     * Extract metadata from OPF
     */
    extractMetadata(opfDoc) {
        const getMetaContent = (selector) => {
            const element = opfDoc.querySelector(selector);
            return element ? element.textContent.trim() : '';
        };

        return {
            title: getMetaContent('dc\\:title, title'),
            author: getMetaContent('dc\\:creator, creator'),
            language: getMetaContent('dc\\:language, language'),
            publisher: getMetaContent('dc\\:publisher, publisher'),
            date: getMetaContent('dc\\:date, date'),
            identifier: getMetaContent('dc\\:identifier, identifier')
        };
    }

    /**
     * Extract manifest (file list)
     */
    extractManifest(opfDoc) {
        const manifest = {};
        const items = opfDoc.querySelectorAll('manifest > item');

        items.forEach(item => {
            const id = item.getAttribute('id');
            manifest[id] = {
                href: item.getAttribute('href'),
                mediaType: item.getAttribute('media-type')
            };
        });

        return manifest;
    }

    /**
     * Extract spine (reading order)
     */
    extractSpine(opfDoc) {
        const spine = [];
        const itemrefs = opfDoc.querySelectorAll('spine > itemref');

        itemrefs.forEach(itemref => {
            spine.push(itemref.getAttribute('idref'));
        });

        return spine;
    }
}

// Make EPUBReader globally available
window.EPUBReader = EPUBReader;
