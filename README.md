# 📚 Kindle Converter

Chuyển đổi tài liệu **đa định dạng** - **Miễn phí 100%**

Hỗ trợ: **PDF, Word, Excel, TXT, HTML, EPUB** → **EPUB, HTML, TXT, DOCX**

🌐 **Demo**: [https://truongpt1093.github.io/kindle-converter/](https://truongpt1093.github.io/kindle-converter/)

## ✨ Tính năng

- ✅ **Hỗ trợ nhiều định dạng đầu vào**: PDF, DOCX, XLSX, TXT, HTML, EPUB
- 🎯 **Nhiều định dạng đầu ra**: EPUB, HTML, TXT, DOCX
- ⚡ **Validation thông minh** - Cảnh báo nếu input = output format
- 🔒 **100% xử lý trên trình duyệt** - File của bạn không được upload lên server
- 🚀 **Nhanh chóng và dễ sử dụng** - Drag & drop hoặc chọn file
- 📱 **Responsive** - Hoạt động tốt trên mọi thiết bị
- 🎨 **Tùy chỉnh metadata** - Tiêu đề, tác giả, ngôn ngữ, ảnh bìa
- 📖 **Tự động tạo mục lục** - Từ headings trong document
- 💯 **Không giới hạn** - Chuyển đổi không giới hạn số lượng file
- 🆓 **Hoàn toàn miễn phí** - Không quảng cáo, không yêu cầu đăng ký

## 🚀 Cách sử dụng

### Bước 1: Chọn file
- Kéo thả file vào vùng drop zone
- Hoặc click "Chọn File" để browse

### Bước 2: Chọn định dạng đầu ra
- Chọn định dạng muốn chuyển đổi: EPUB, HTML, TXT, hoặc DOCX
- App sẽ tự động cảnh báo nếu input = output format

### Bước 3: Nhập thông tin (tùy chọn)
- Tiêu đề sách
- Tác giả
- Ngôn ngữ
- Ảnh bìa (JPG, PNG)

### Bước 4: Chuyển đổi
- Click "Chuyển đổi sang [Format]"
- Chờ quá trình xử lý (vài giây đến vài phút tùy file)

### Bước 5: Tải về
- Click "Tải về [Format]"
- Sử dụng file đã convert theo nhu cầu

## 📋 Định dạng hỗ trợ

### 📥 Input Formats (Đầu vào)

| Format | Extension | Ghi chú |
|--------|-----------|---------|
| PDF | `.pdf` | Text-based PDF (không hỗ trợ PDF scan) |
| Word | `.docx`, `.doc` | Bảo toàn formatting, images, tables |
| Excel | `.xlsx`, `.xls` | Mỗi sheet = 1 chapter |
| Text | `.txt` | Plain text |
| HTML | `.html`, `.htm` | Web pages |
| EPUB | `.epub` | Đọc và parse EPUB files |

### 📤 Output Formats (Đầu ra)

| Format | Extension | Ghi chú |
|--------|-----------|---------|
| EPUB | `.epub` | E-book format cho Kindle, Kobo, Apple Books |
| HTML | `.html` | Standalone HTML document với styling |
| TXT | `.txt` | Plain text file |
| DOCX | `.docx` | Microsoft Word document (basic) |

### ⚠️ Lưu ý

- **Format validation**: Input format phải khác output format
- **Giới hạn**: File tối đa 50MB
- **EPUB → EPUB**: Không được phép (vô nghĩa)
- **PDF → PDF**: Không được phép

## 🛠️ Công nghệ

### Frontend
- **Pure HTML/CSS/JavaScript** - Không dùng framework
- **Responsive Design** - Mobile-first approach

### Libraries
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX → HTML conversion
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF text extraction
- [SheetJS](https://sheetjs.com/) - Excel processing
- [JSZip](https://stuk.github.io/jszip/) - EPUB generation (ZIP format)

### Hosting
- **GitHub Pages** - Free static hosting
- **CDN** - Libraries loaded from CDN for faster performance

## 🔒 Quyền riêng tư

✅ **Tất cả xử lý diễn ra trên trình duyệt của bạn**
- File không được upload lên server
- Không lưu trữ dữ liệu
- Không tracking, không analytics
- Hoàn toàn offline-capable (sau khi load trang đầu tiên)

## 🏗️ Cấu trúc project

```
kindle-converter/
├── index.html              # Main HTML
├── css/
│   └── style.css          # Styling
├── js/
│   ├── app.js             # Main application logic
│   ├── utils.js           # Utility functions
│   └── converters/
│       ├── pdf-converter.js      # PDF → HTML
│       ├── docx-converter.js     # DOCX → HTML
│       ├── excel-converter.js    # Excel → HTML
│       ├── txt-converter.js      # TXT → HTML
│       └── epub-generator.js     # HTML → EPUB
└── libs/
    └── README.md          # Libraries documentation
```

## 💻 Development

### Local Development

1. Clone repository:
```bash
git clone https://github.com/truongpt1093/kindle-converter.git
cd kindle-converter
```

2. Serve locally (cần web server vì CORS):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (npx)
npx serve

# VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

3. Mở browser: `http://localhost:8000`

### Deployment

GitHub Pages tự động deploy từ branch `main` hoặc `gh-pages`.

Để update:
```bash
git add .
git commit -m "Update converter"
git push origin main
```

## 🐛 Known Issues / Limitations

- ❌ **PDF Scanned**: Không hỗ trợ OCR cho PDF scan (chỉ PDF text-based)
- ❌ **MOBI**: Không tạo trực tiếp file MOBI (cần Calibre để convert EPUB → MOBI)
- ⚠️ **File lớn**: Browser có thể lag với file >50MB
- ⚠️ **Complex formatting**: Một số formatting phức tạp có thể bị mất

## 🤝 Contributing

Contributions are welcome!

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## 📝 TODO / Roadmap

- [ ] Support thêm formats: RTF, ODT, PAGES
- [ ] MOBI generation (if possible client-side)
- [ ] OCR cho PDF scanned (sử dụng Tesseract.js?)
- [ ] Batch conversion (nhiều file cùng lúc)
- [ ] Custom CSS styling cho EPUB output
- [ ] Preview EPUB trước khi download
- [ ] Dark mode
- [ ] Multi-language UI (English, Vietnamese, etc.)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Credits

- Icons: Emojis
- Libraries: Mammoth.js, PDF.js, SheetJS, JSZip
- Inspiration: Calibre, Convertio, CloudConvert

## 📧 Contact

- GitHub: [@truongpt1093](https://github.com/truongpt1093)
- Issues: [GitHub Issues](https://github.com/truongpt1093/kindle-converter/issues)

---

**Made with ❤️ for the reading community**

*Đọc sách mọi lúc, mọi nơi - Read anywhere, anytime* 📚
