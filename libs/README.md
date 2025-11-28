# Libraries

## Sử dụng CDN

Project này sử dụng CDN links cho tất cả JavaScript libraries để:
- ✅ Tăng tốc độ tải trang (CDN caching)
- ✅ Giảm kích thước repository
- ✅ Tự động cập nhật
- ✅ Hoạt động tốt với GitHub Pages

## Libraries được sử dụng:

1. **Mammoth.js** (v1.6.0) - DOCX → HTML conversion
   - CDN: https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
   - Docs: https://github.com/mwilliamson/mammoth.js

2. **PDF.js** (v3.11.174) - PDF text extraction
   - CDN: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
   - Worker: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
   - Docs: https://mozilla.github.io/pdf.js/

3. **SheetJS** (v0.20.1) - Excel → JSON/HTML conversion
   - CDN: https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
   - Docs: https://docs.sheetjs.com/

4. **JSZip** (v3.10.1) - EPUB generation (ZIP format)
   - CDN: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
   - Docs: https://stuk.github.io/jszip/

## Local Development (Optional)

Nếu bạn muốn phát triển offline, download các file trên về thư mục này và update script tags trong `index.html`.
