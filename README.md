# Landing Page Bún Bò Cô Oanh

Dự án xây dựng giao diện Landing Page cho quán Bún Bò Cô Oanh tại Sài Gòn.
Sử dụng: HTML5, CSS3, JavaScript, **Node.js (Express)**, **SQLite**.

## Yêu cầu

- **Node.js** phiên bản 18 trở lên → Tải tại [nodejs.org](https://nodejs.org/)

## Hướng dẫn chạy dự án

### Bước 1: Cài đặt dependencies
Mở Terminal / Command Prompt trong thư mục `bun-bo-co-oanh`, chạy:
```bash
npm install
```

### Bước 2: Khởi động server
```bash
npm start
```

### Bước 3: Mở trình duyệt
Truy cập: **http://localhost:3000**

## Cấu trúc thư mục

```
bun-bo-co-oanh/
├── server.js          # Backend Express server
├── database.js        # Module SQLite database
├── package.json       # Dependencies & scripts
├── data.db            # File database (tự tạo khi chạy)
├── uploads/           # Thư mục lưu ảnh upload
├── public/            # File tĩnh phục vụ cho trình duyệt
│   ├── index.html     # Trang chính
│   ├── style.css      # Giao diện
│   ├── main.js        # Logic frontend (gọi API)
│   └── assets/        # Ảnh banner & món ăn
└── README.md
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/gallery` | Lấy tất cả ảnh |
| POST | `/api/gallery/upload` | Upload ảnh mới (form-data, field: `images`) |
| PUT | `/api/gallery/:id` | Thay đổi ảnh (form-data, field: `image`) |
| DELETE | `/api/gallery/:id` | Xóa ảnh |
| GET | `/api/orders` | Xem tất cả đơn hàng |
| POST | `/api/orders` | Tạo đơn hàng mới (JSON body) |

## Các tính năng
- Responsive tốt trên cả Desktop và Mobile (có Hamburger Menu).
- Giao diện thiết kế theo hệ màu trắng kem, vàng, đỏ gạch.
- **Thư viện ảnh**: Upload, thay đổi, xóa ảnh — lưu vĩnh viễn trên server.
- **Đặt hàng online**: Form đặt món lưu vào database SQLite.
- Giới hạn upload: 5MB/ảnh, chỉ chấp nhận JPEG/PNG/GIF/WebP.

## Deploy lên Render (Miễn phí)
1. Đẩy code lên GitHub.
2. Vào [render.com](https://render.com) → New Web Service → kết nối repo GitHub.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Trỏ tên miền vào Render trong phần Settings → Custom Domain.

## Thiết kế bởi
Hồng Nhật
