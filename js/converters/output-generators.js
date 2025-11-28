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

/**
 * AZW3 Generator (Amazon Kindle Format)
 * Note: AZW3 is Amazon's proprietary format based on EPUB/KF8
 * For best compatibility, use Calibre to convert EPUB → AZW3
 */
class AZW3Generator {
    async generate(convertedData, metadata, progressCallback) {
        progressCallback(5, 'Chuẩn bị tạo AZW3...');

        // AZW3 is based on EPUB/KF8 format
        // We'll create an EPUB-compatible structure with AZW3 extensions
        const zip = new JSZip();

        // 1. Add mimetype for AZW3
        zip.file('mimetype', 'application/vnd.amazon.mobi8-ebook', { compression: 'STORE' });

        progressCallback(10, 'Tạo cấu trúc AZW3...');

        // 2. META-INF/container.xml
        const containerXML = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
        zip.folder('META-INF').file('container.xml', containerXML);

        progressCallback(20, 'Tạo metadata...');

        // 3. OEBPS/content.opf (Package Document with Kindle extensions)
        const contentOPF = this.generateContentOPF(metadata, convertedData.chapters);
        zip.folder('OEBPS').file('content.opf', contentOPF);

        progressCallback(30, 'Tạo mục lục...');

        // 4. OEBPS/toc.ncx
        const tocNCX = this.generateTocNCX(metadata, convertedData.chapters);
        zip.folder('OEBPS').file('toc.ncx', tocNCX);

        progressCallback(40, 'Tạo stylesheet...');

        // 5. OEBPS/stylesheet.css (Kindle-optimized)
        const css = this.generateKindleCSS();
        zip.folder('OEBPS').file('stylesheet.css', css);

        progressCallback(50, 'Xử lý nội dung...');

        // 6. OEBPS/content.xhtml
        const contentHTML = this.generateContentHTML(convertedData);
        zip.folder('OEBPS').file('content.xhtml', contentHTML);

        // 7. Cover image
        if (metadata.coverImage) {
            progressCallback(60, 'Thêm ảnh bìa...');
            zip.folder('OEBPS').file('cover.jpg', metadata.coverImage);
        }

        progressCallback(80, 'Đang nén file AZW3...');

        // Generate AZW3 (modified EPUB structure)
        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.amazon.mobi8-ebook',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        }, (metadata) => {
            const percent = 80 + (metadata.percent * 0.2);
            progressCallback(percent, `Đang nén... ${Math.round(metadata.percent)}%`);
        });

        progressCallback(100, 'Hoàn tất!');

        return blob;
    }

    generateContentOPF(metadata, chapters) {
        const uuid = this.generateUUID();
        const date = new Date().toISOString().split('T')[0];
        const title = metadata.title || 'Untitled';
        const author = metadata.author || 'Unknown';
        const language = metadata.language || 'vi';

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookID">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${Utils.escapeXML(title)}</dc:title>
    <dc:creator opf:role="aut">${Utils.escapeXML(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:identifier id="BookID">urn:uuid:${uuid}</dc:identifier>
    <dc:date>${date}</dc:date>
    <dc:publisher>Kindle Converter</dc:publisher>
    ${metadata.coverImage ? '<meta name="cover" content="cover-image"/>' : ''}
    <meta name="generator" content="Kindle Converter"/>
  </metadata>

  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="stylesheet" href="stylesheet.css" media-type="text/css"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    ${metadata.coverImage ? '<item id="cover-image" href="cover.jpg" media-type="image/jpeg"/>' : ''}
  </manifest>

  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>

  <guide>
    <reference type="text" title="Start" href="content.xhtml"/>
    ${metadata.coverImage ? '<reference type="cover" title="Cover" href="cover.jpg"/>' : ''}
  </guide>
</package>`;
    }

    generateTocNCX(metadata, chapters) {
        const uuid = this.generateUUID();
        const title = metadata.title || 'Untitled';

        let navPoints = '';
        if (chapters && chapters.length > 0) {
            const tocChapters = chapters.slice(0, 50);
            tocChapters.forEach((chapter, index) => {
                const chapterTitle = Utils.escapeXML(chapter.title || `Chapter ${index + 1}`);
                navPoints += `
    <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${chapterTitle}</text>
      </navLabel>
      <content src="content.xhtml#chapter-${index + 1}"/>
    </navPoint>`;
            });
        } else {
            navPoints = `
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel>
        <text>Start</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${Utils.escapeXML(title)}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
    }

    generateKindleCSS() {
        return `/* Kindle-optimized CSS */
body {
    font-family: serif;
    line-height: 1.5;
    margin: 0;
    padding: 1em;
}

h1, h2, h3, h4, h5, h6 {
    font-family: sans-serif;
    font-weight: bold;
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    page-break-after: avoid;
}

h1 { font-size: 1.8em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.2em; }

p {
    margin: 0.5em 0;
    text-align: justify;
    text-indent: 1em;
    orphans: 2;
    widows: 2;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
}

th, td {
    border: 1px solid #666;
    padding: 0.5em;
}

img {
    max-width: 100%;
    height: auto;
}

.page-break {
    page-break-after: always;
}`;
    }

    generateContentHTML(convertedData) {
        let content = convertedData.html || convertedData.content || '';

        if (!content.includes('<')) {
            content = `<p>${Utils.escapeHTML(content)}</p>`;
        }

        if (convertedData.chapters && convertedData.chapters.length > 0) {
            convertedData.chapters.forEach((chapter, index) => {
                const anchor = `<a id="chapter-${index + 1}"></a>`;
                const chapterTitle = Utils.escapeHTML(chapter.title);
                const titleVariants = [
                    `<h1>${chapterTitle}</h1>`,
                    `<h2>${chapterTitle}</h2>`,
                    `<h3>${chapterTitle}</h3>`
                ];
                for (const variant of titleVariants) {
                    if (content.includes(variant)) {
                        content = content.replace(variant, anchor + variant);
                        break;
                    }
                }
            });
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
<head>
    <title>Content</title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
${content}
</body>
</html>`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

// Make generators globally available
window.HTMLGenerator = HTMLGenerator;
window.TXTGenerator = TXTGenerator;
window.DOCXGenerator = DOCXGenerator;
window.AZW3Generator = AZW3Generator;
