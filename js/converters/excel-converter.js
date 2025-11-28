/**
 * Excel (XLSX/XLS) to HTML Converter using SheetJS
 */
class ExcelConverter {
    /**
     * Convert Excel file to HTML
     * @param {File} file - Excel file
     * @param {Function} progressCallback - Progress callback (percent, message)
     * @returns {Object} - Converted data with html content and chapters
     */
    async convert(file, progressCallback) {
        try {
            progressCallback(10, 'Đang đọc file Excel...');

            const arrayBuffer = await file.arrayBuffer();

            progressCallback(30, 'Đang phân tích workbook...');

            // Read Excel file
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellStyles: true,
                cellDates: true
            });

            progressCallback(50, 'Đang xử lý dữ liệu...');

            const sheetNames = workbook.SheetNames;
            let htmlContent = '';
            const chapters = [];

            // Process each sheet
            sheetNames.forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];

                // Convert sheet to HTML table
                const html = XLSX.utils.sheet_to_html(worksheet, {
                    id: `sheet-${index}`,
                    editable: false
                });

                // Add sheet as a chapter
                htmlContent += `
                    <div class="excel-sheet" id="sheet-${index}">
                        <h2>${Utils.escapeHTML(sheetName)}</h2>
                        ${html}
                    </div>
                `;

                chapters.push({
                    title: sheetName,
                    level: 1,
                    sheetIndex: index
                });

                const progress = 50 + (40 * (index + 1) / sheetNames.length);
                progressCallback(progress, `Xử lý sheet ${index + 1}/${sheetNames.length}: ${sheetName}`);
            });

            progressCallback(95, 'Hoàn tất xử lý Excel');

            // Convert HTML to plain text for backup
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            return {
                content: htmlContent,
                html: htmlContent,
                plainText: plainText,
                chapters: chapters,
                metadata: {
                    source: 'Excel',
                    sheetCount: sheetNames.length,
                    sheetNames: sheetNames
                }
            };

        } catch (error) {
            console.error('Excel conversion error:', error);
            throw new Error(`Lỗi khi chuyển đổi Excel: ${error.message}`);
        }
    }
}

// Make ExcelConverter globally available
window.ExcelConverter = ExcelConverter;
