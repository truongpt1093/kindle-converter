/**
 * EPUB Generator using JSZip
 * Creates valid EPUB 2.0 files from HTML content
 */
class EPUBGenerator {
    /**
     * Generate EPUB file from converted data
     * @param {Object} convertedData - Data from converter (html, chapters, etc)
     * @param {Object} metadata - Book metadata (title, author, language, cover, etc)
     * @param {Function} progressCallback - Progress callback (percent, message)
     * @returns {Blob} - EPUB file as blob
     */
    async generate(convertedData, metadata, progressCallback) {
        try {
            progressCallback(0, 'Chuẩn bị tạo EPUB...');

            const zip = new JSZip();

            // 1. Add mimetype (MUST be first, uncompressed)
            zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

            progressCallback(10, 'Tạo cấu trúc EPUB...');

            // 2. META-INF/container.xml
            const containerXML = this.generateContainerXML();
            zip.folder('META-INF').file('container.xml', containerXML);

            progressCallback(20, 'Tạo metadata...');

            // 3. OEBPS/content.opf (Package Document)
            const contentOPF = this.generateContentOPF(metadata, convertedData.chapters);
            zip.folder('OEBPS').file('content.opf', contentOPF);

            progressCallback(30, 'Tạo mục lục...');

            // 4. OEBPS/toc.ncx (Table of Contents)
            const tocNCX = this.generateTocNCX(metadata, convertedData.chapters);
            zip.folder('OEBPS').file('toc.ncx', tocNCX);

            progressCallback(40, 'Tạo stylesheet...');

            // 5. OEBPS/stylesheet.css
            const css = this.generateCSS();
            zip.folder('OEBPS').file('stylesheet.css', css);

            progressCallback(50, 'Xử lý nội dung chính...');

            // 6. OEBPS/content.xhtml (Main content)
            const contentHTML = this.generateContentHTML(convertedData);
            zip.folder('OEBPS').file('content.xhtml', contentHTML);

            progressCallback(60, 'Xử lý ảnh bìa...');

            // 7. Cover image (if provided)
            if (metadata.coverImage) {
                try {
                    zip.folder('OEBPS').file('cover.jpg', metadata.coverImage);
                    progressCallback(70, 'Đã thêm ảnh bìa...');
                } catch (error) {
                    console.warn('Could not add cover image:', error);
                    progressCallback(70, 'Bỏ qua ảnh bìa...');
                }
            } else {
                progressCallback(70, 'Không có ảnh bìa...');
            }

            progressCallback(80, 'Đang nén file EPUB...');

            // Generate EPUB (ZIP file)
            const blob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/epub+zip',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            }, (metadata) => {
                // Progress callback during compression
                const percent = 80 + (metadata.percent * 0.2);
                progressCallback(percent, `Đang nén... ${Math.round(metadata.percent)}%`);
            });

            progressCallback(100, 'Hoàn tất!');

            return blob;

        } catch (error) {
            console.error('EPUB generation error:', error);
            throw new Error(`Lỗi khi tạo EPUB: ${error.message}`);
        }
    }

    /**
     * Generate META-INF/container.xml
     */
    generateContainerXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    }

    /**
     * Generate content.opf (Package Document)
     */
    generateContentOPF(metadata, chapters) {
        const uuid = Utils.generateUUID();
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

    /**
     * Generate toc.ncx (Navigation Control file for XML)
     */
    generateTocNCX(metadata, chapters) {
        const uuid = Utils.generateUUID();
        const title = metadata.title || 'Untitled';

        let navPoints = '';

        if (chapters && chapters.length > 0) {
            // Limit to first 50 chapters for TOC
            const tocChapters = chapters.slice(0, 50);

            tocChapters.forEach((chapter, index) => {
                const chapterTitle = Utils.escapeXML(chapter.title || `Chapter ${index + 1}`);
                const playOrder = index + 1;

                navPoints += `
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>${chapterTitle}</text>
      </navLabel>
      <content src="content.xhtml#chapter-${playOrder}"/>
    </navPoint>`;
            });
        } else {
            // Default navigation point if no chapters
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

    /**
     * Generate CSS stylesheet for EPUB
     */
    generateCSS() {
        return `/* EPUB Stylesheet */
body {
    font-family: Georgia, serif;
    line-height: 1.6;
    margin: 1em;
    padding: 0;
    text-align: justify;
}

h1, h2, h3, h4, h5, h6 {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    text-align: left;
    page-break-after: avoid;
}

h1 {
    font-size: 2em;
    margin-top: 0;
}

h2 {
    font-size: 1.5em;
}

h3 {
    font-size: 1.2em;
}

p {
    margin: 0.5em 0;
    text-indent: 1.5em;
    orphans: 2;
    widows: 2;
}

p:first-child,
h1 + p,
h2 + p,
h3 + p {
    text-indent: 0;
}

/* Tables (for Excel conversion) */
table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 0.9em;
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    text-indent: 0;
}

th {
    background-color: #f2f2f2;
    font-weight: bold;
}

/* Excel sheets */
.excel-sheet {
    margin: 2em 0;
    page-break-before: always;
}

.excel-sheet h2 {
    border-bottom: 2px solid #333;
    padding-bottom: 0.3em;
}

/* PDF pages */
.pdf-page {
    margin: 1em 0;
}

/* Images */
img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
}

/* Links */
a {
    color: #0066cc;
    text-decoration: underline;
}

/* Page breaks */
.page-break {
    page-break-after: always;
}
`;
    }

    /**
     * Generate content.xhtml (Main content file)
     */
    generateContentHTML(convertedData) {
        let content = convertedData.html || convertedData.content || '';

        // If content is plain text, wrap in paragraphs
        if (!content.includes('<')) {
            content = `<p>${Utils.escapeHTML(content)}</p>`;
        }

        // Add chapter anchors if chapters exist
        if (convertedData.chapters && convertedData.chapters.length > 0) {
            convertedData.chapters.forEach((chapter, index) => {
                const anchor = `<a id="chapter-${index + 1}"></a>`;
                const chapterTitle = Utils.escapeHTML(chapter.title);

                // Try to find and replace the chapter title with anchored version
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
}

// Make EPUBGenerator globally available
window.EPUBGenerator = EPUBGenerator;
