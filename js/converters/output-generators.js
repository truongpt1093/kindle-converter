/**
 * Output Format Generators
 * Generate different output formats from converted data
 */

/**
 * HTML Generator
 */
class HTMLGenerator {
    async generate(convertedData, metadata, progressCallback) {
        progressCallback(20, 'Tạo file HTML...');

        const html = this.createHTMLDocument(convertedData, metadata);

        progressCallback(80, 'Hoàn tất tạo HTML');

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        progressCallback(100, 'Hoàn tất!');

        return blob;
    }

    createHTMLDocument(convertedData, metadata) {
        const title = Utils.escapeHTML(metadata.title || 'Untitled');
        const author = Utils.escapeHTML(metadata.author || 'Unknown');
        const content = convertedData.html || convertedData.content || '';

        return `<!DOCTYPE html>
<html lang="${metadata.language || 'vi'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="${author}">
    <title>${title}</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        .book-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .book-title {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .book-author {
            font-size: 1.2em;
            color: #6b7280;
        }
        .book-content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { color: #1f2937; margin-top: 1.5em; }
        p { margin: 1em 0; text-align: justify; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="book-header">
        <h1 class="book-title">${title}</h1>
        <p class="book-author">by ${author}</p>
    </div>
    <div class="book-content">
        ${content}
    </div>
    <footer style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 0.9em;">
        <p>Converted by Kindle Converter</p>
    </footer>
</body>
</html>`;
    }
}

/**
 * TXT Generator
 */
class TXTGenerator {
    async generate(convertedData, metadata, progressCallback) {
        progressCallback(20, 'Tạo file TXT...');

        const text = this.createTextDocument(convertedData, metadata);

        progressCallback(80, 'Hoàn tất tạo TXT');

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        progressCallback(100, 'Hoàn tất!');

        return blob;
    }

    createTextDocument(convertedData, metadata) {
        const title = metadata.title || 'Untitled';
        const author = metadata.author || 'Unknown';

        // Get plain text content
        let content = convertedData.plainText || convertedData.content || '';

        // If content is HTML, convert to plain text
        if (content.includes('<') && content.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            content = tempDiv.textContent || tempDiv.innerText || '';
        }

        // Format as plain text document
        let output = '';
        output += '='.repeat(60) + '\n';
        output += title.toUpperCase() + '\n';
        output += 'by ' + author + '\n';
        output += '='.repeat(60) + '\n\n';
        output += content;
        output += '\n\n' + '-'.repeat(60) + '\n';
        output += 'Converted by Kindle Converter\n';

        return output;
    }
}

/**
 * DOCX Generator (Simple version using HTML)
 */
class DOCXGenerator {
    async generate(convertedData, metadata, progressCallback) {
        progressCallback(20, 'Tạo file DOCX...');

        // Create a simple DOCX structure using XML
        const docx = await this.createDOCX(convertedData, metadata, progressCallback);

        progressCallback(100, 'Hoàn tất!');

        return docx;
    }

    async createDOCX(convertedData, metadata, progressCallback) {
        progressCallback(40, 'Đang tạo cấu trúc DOCX...');

        const zip = new JSZip();

        // DOCX is a ZIP file with specific structure
        // [Content_Types].xml
        zip.file('[Content_Types].xml', this.createContentTypes());

        // _rels/.rels
        zip.folder('_rels').file('.rels', this.createRels());

        // word/_rels/document.xml.rels
        zip.folder('word').folder('_rels').file('document.xml.rels', this.createDocumentRels());

        // word/document.xml (main content)
        const content = convertedData.html || convertedData.content || '';
        zip.folder('word').file('document.xml', this.createDocumentXML(content, metadata));

        progressCallback(70, 'Đang nén file DOCX...');

        // Generate DOCX blob
        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return blob;
    }

    createContentTypes() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
    }

    createRels() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    }

    createDocumentRels() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
    }

    createDocumentXML(htmlContent, metadata) {
        // Convert HTML to simple DOCX XML
        // This is a simplified version - for production, use a proper library

        // Convert HTML to plain text with basic formatting
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        let paragraphs = '';
        const elements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6');

        elements.forEach(el => {
            const text = Utils.escapeXML(el.textContent.trim());
            if (!text) return;

            const isHeading = el.tagName.match(/^H[1-6]$/);
            const style = isHeading ? '<w:pStyle w:val="Heading1"/>' : '';

            paragraphs += `
                <w:p>
                    <w:pPr>${style}</w:pPr>
                    <w:r>
                        <w:t>${text}</w:t>
                    </w:r>
                </w:p>`;
        });

        // If no structured content, add as plain text
        if (!paragraphs) {
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            const textParagraphs = plainText.split(/\n\n+/);

            textParagraphs.forEach(para => {
                const text = Utils.escapeXML(para.trim());
                if (!text) return;

                paragraphs += `
                    <w:p>
                        <w:r>
                            <w:t>${text}</w:t>
                        </w:r>
                    </w:p>`;
            });
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        ${paragraphs}
    </w:body>
</w:document>`;
    }
}

// Make generators globally available
window.HTMLGenerator = HTMLGenerator;
window.TXTGenerator = TXTGenerator;
window.DOCXGenerator = DOCXGenerator;
