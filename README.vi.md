# Bàn tham chiếu & ghép nhân vật AI (3 trong 1) · Tiếng Việt / English

[English](README.md) · **Tiếng Việt** · [中文（原文）](README.zh-CN.md)

> Đây là bản fork đã bản địa hóa của **[anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)** do Anhao ([X @anhao_ai](https://x.com/anhao_ai)) phát triển. Ứng dụng và dữ liệu là công sức của tác giả gốc; bản fork này bổ sung giao diện **tiếng Việt (mặc định) + tiếng Anh** cùng nút chuyển ngôn ngữ. README gốc tiếng Trung được giữ tại [README.zh-CN.md](README.zh-CN.md) và là tài liệu chính thức về tính năng, plugin ComfyUI và agent skill.

**Thư viện tư thế** (1.439 ảnh mô hình trắng + 1.439 depth map) + **thư viện trang phục** (3.224 bộ: 1.407 bộ ảnh thực của Gia, 57 bộ trang phục Trung Hoa cổ của Shisei / 227 góc nhìn, 1.320 bộ anime của Gia, 440 bộ anime của CharaDB) + **thư viện chân dung** (1.499 ảnh CC0), kèm **Bàn ghép nhân vật AI** kết nối 5 API tạo ảnh và **plugin custom node cho ComfyUI**.

![Tổng quan thư viện](docs/preview.jpg)

**Bản demo gốc:** <https://ai-pose-gallery.anhao.app/> (giao diện tiếng Trung)
**Thư viện gốc (tiếng Nhật):** [tư thế](https://ai-pose-gallery.pages.dev/) · [depth](https://ai-pose-depth-gallery.pages.dev/) · [trang phục](https://ai-costume-gallery.pages.dev/) · [chân dung](https://ai-portrait-gallery.pages.dev/)
**Tác giả thư viện gốc:** Gia (ギア, @giaaibusi). **Trang phục anime:** Taki AI ([@taki_auto](https://x.com/taki_auto) · [CharaDB](https://charadb-2fi.pages.dev/)). **Trang phục Trung Hoa cổ:** Shisei / wquguru (CC0).

## Có gì trong ứng dụng

- **Thư viện tư thế (`/poses`)**: 4 hệ, 26 danh mục, 288 nhóm tư thế, 5 góc máy (chính diện, từ trên, từ dưới, nghiêng, chéo 3/4); chuyển giữa mô hình trắng 3D và depth map.
- **Thư viện trang phục (`/costumes`)**: trang phục ảnh thực và anime theo mùa/phong cách, thẻ món đồ & màu, từ khóa prompt tiếng Anh.
- **Thư viện chân dung (`/portraits`)**: ảnh chính diện và ảnh tạo hình, 4 độ dài tóc, 51 kiểu tóc Nhật, top 10 nổi bật.
- **Bàn ghép AI (`/studio`)**: ghép chân dung + trang phục + tư thế (+ ảnh bổ sung), chọn phong cách rồi tạo ảnh bằng Google Gemini, OpenAI GPT Image, Alibaba Cloud Bailian (Qwen), Volcengine Ark (Doubao), PixAI hoặc ComfyUI chạy trên máy. API key chỉ lưu trong trình duyệt của bạn.
- **Chế độ an toàn (SFW)** bật mặc định và ẩn các danh mục 18+.

## Hỗ trợ ngôn ngữ (bản fork bổ sung)

- Ngôn ngữ: **Tiếng Việt** (mặc định), **English** và **中文** gốc.
- Đổi ngôn ngữ bằng nút trên thanh trên cùng. Lựa chọn được lưu trong `localStorage`; có thể gửi link kèm ngôn ngữ bằng `?lang=vi`, `?lang=en` hoặc `?lang=zh`.
- Mọi chữ người xem nhìn thấy đều được dịch: menu, bộ lọc, nút, hộp thoại, thông báo, thông báo lỗi, hộp thoại xác nhận tuổi, `<title>`/meta/Open Graph, và **toàn bộ nhãn dữ liệu** (tên tư thế, danh mục, góc máy, tên và thẻ trang phục, kiểu tóc).
- Ô tìm kiếm nhận tiếng Việt (có hoặc không dấu), tiếng Anh hoặc tiếng Trung, vd: `dong phuc thuy thu`, `sailor uniform` hoặc `水手服`.
- Tệp dữ liệu tiếng Trung gốc trong `data/` được giữ nguyên. Việc dịch diễn ra lúc hiển thị (`src/i18n/translator.ts`) qua hai từ điển:
  - `src/i18n/ui-dict.json`: chuỗi giao diện, dịch thủ công (`scripts/i18n/ui/*.tsv`).
  - `src/i18n/data-dict.json`: 2.312 nhãn dữ liệu. Tên tư thế, danh mục và kiểu tóc được dịch thủ công (`scripts/i18n/manual/*.tsv`); khoảng 2.500 tên trang phục được ghép từ bảng thuật ngữ màu sắc, chất liệu, món đồ đã rà soát (`scripts/i18n/glossary/*.tsv`).
- Cố ý giữ tiếng Trung: **prompt** tạo ảnh mà Bàn ghép gửi tới model (đây là đầu vào cho model, câu chữ tiếng Trung được tinh chỉnh cho Qwen/Doubao), và ô prompt hiển thị nội dung đó.

Tạo lại từ điển sau khi đổi dữ liệu nguồn hoặc giao diện:

```bash
node scripts/i18n/extract_ui_keys.mjs     # liệt kê chuỗi tiếng Trung trong src/
python3 scripts/i18n/build_data_dict.py   # -> src/i18n/data-dict.json (báo lỗi nếu có nhãn chưa dịch được)
python3 scripts/i18n/build_ui.py          # -> src/i18n/ui-dict.json (in ra chuỗi giao diện chưa dịch)
pnpm test                                 # có kiểm tra mọi nhãn dữ liệu đều có bản vi + en
```

## Chạy trên máy

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # kiểm tra kiểu + build production vào dist/
pnpm lint
pnpm test
```

Khi chạy dev, `data/`, `img/` và `thumbs/` được phục vụ trực tiếp từ repo. Bản triển khai là Cloudflare Worker phục vụ `dist/` (`wrangler.jsonc`, `worker.ts`); xem [README.zh-CN.md](README.zh-CN.md) để cài plugin ComfyUI, workflow, PixAI và agent skill.

## Miễn trừ trách nhiệm

1. **Chỉ dùng để học và sáng tác hợp pháp.** Dự án (bàn làm việc web, plugin ComfyUI, workflow và agent skill) dành cho học tập cá nhân, tham khảo giải phẫu và tư thế, minh họa và trao đổi kỹ thuật. Không dùng để tạo hoặc phát tán nội dung trái pháp luật, khiêu dâm, bạo lực, hay ghép mặt / deepfake người thật khi chưa được họ đồng ý rõ ràng.
2. **Nội dung NSFW (18+).** Thư viện có một số tư thế mô hình dành cho người lớn và tham chiếu nội y/trang phục gợi cảm. Chế độ an toàn ẩn chúng theo mặc định; **người dưới 18 tuổi không được tắt chế độ này**.
3. **Nguồn và bản quyền.** Ảnh và metadata gốc về tư thế, trang phục thực và chân dung thuộc về **Gia (@giaaibusi)**; trang phục anime thuộc **Taki AI** (ảnh tải từ CharaDB, không được phân phối lại; xem [LICENSE](https://github.com/taki-ttt/charadb/blob/main/LICENSE)); trang phục Shisei là CC0 của wquguru. Repo này không tuyên bố quyền gì với hình ảnh. **Không đóng gói, bán lại hoặc phân phối có thu phí ảnh trong thư viện.** Người dùng tự chịu hoàn toàn trách nhiệm về cách sử dụng.

## Giấy phép

Mã ứng dụng (`src/`), plugin ComfyUI (`comfyui_plugin/`) và các script (`scripts/`) phát hành theo [giấy phép MIT](LICENSE) © 2026 Anhao. Giấy phép **không áp dụng** cho ảnh và dữ liệu gốc trong `img/`, `thumbs/` và `data/`. Phần bản địa hóa của bản fork này cũng theo điều khoản MIT như trên.
