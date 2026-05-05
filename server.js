require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { gallery, orders } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CẤU HÌNH GỬI EMAIL (Nodemailer)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname, 'public')));

// Phục vụ ảnh upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// CẤU HÌNH MULTER (Upload ảnh)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        // Tạo thư mục uploads nếu chưa có
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất: timestamp + tên gốc
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    },
    fileFilter: function (req, file, cb) {
        // Chỉ chấp nhận file ảnh
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'), false);
        }
    }
});

// ==========================================
// API: GALLERY (Thư viện ảnh)
// ==========================================

// GET /api/gallery - Lấy tất cả ảnh
app.get('/api/gallery', (req, res) => {
    try {
        const images = gallery.getAll();
        res.json({ success: true, data: images });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
});

// POST /api/gallery/upload - Upload ảnh mới
app.post('/api/gallery/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Không có file nào được chọn' });
        }

        const uploaded = [];
        for (const file of req.files) {
            const result = gallery.insert(file.filename, file.originalname);
            uploaded.push({
                id: result.lastInsertRowid,
                filename: file.filename,
                original_name: file.originalname
            });
        }

        res.json({ success: true, message: `Đã upload ${uploaded.length} ảnh`, data: uploaded });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi upload: ' + err.message });
    }
});

// PUT /api/gallery/:id - Thay đổi ảnh (replace)
app.put('/api/gallery/:id', upload.single('image'), (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = gallery.getById(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file mới' });
        }

        // Xóa file ảnh cũ
        const oldPath = path.join(__dirname, 'uploads', existing.filename);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }

        // Cập nhật database
        gallery.update(id, req.file.filename, req.file.originalname);

        res.json({
            success: true,
            message: 'Đã thay đổi ảnh',
            data: { id, filename: req.file.filename, original_name: req.file.originalname }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi thay ảnh: ' + err.message });
    }
});

// DELETE /api/gallery/:id - Xóa ảnh
app.delete('/api/gallery/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = gallery.getById(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
        }

        // Xóa file trên ổ cứng
        const filePath = path.join(__dirname, 'uploads', existing.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Xóa khỏi database
        gallery.delete(id);

        res.json({ success: true, message: 'Đã xóa ảnh' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi xóa: ' + err.message });
    }
});

// ==========================================
// API: ORDERS (Đặt hàng)
// ==========================================

// GET /api/orders - Xem tất cả đơn hàng
app.get('/api/orders', (req, res) => {
    try {
        const allOrders = orders.getAll();
        res.json({ success: true, data: allOrders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
});

// POST /api/orders - Tạo đơn hàng mới
app.post('/api/orders', (req, res) => {
    try {
        const { name, phone, time, dish, notes } = req.body;

        if (!name || !phone || !time || !dish) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const result = orders.insert(name, phone, time, dish, notes || '');
        
        // Gửi thông báo Email (chạy ngầm)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
                subject: `🍜 Đơn hàng mới từ: ${name}`,
                html: `
                    <h2>Có khách đặt bún bò!</h2>
                    <ul>
                        <li><strong>Khách hàng:</strong> ${name}</li>
                        <li><strong>Số điện thoại:</strong> <a href="tel:${phone}">${phone}</a></li>
                        <li><strong>Giờ nhận:</strong> ${time}</li>
                        <li><strong>Món:</strong> ${dish}</li>
                        <li><strong>Ghi chú:</strong> ${notes || 'Không có'}</li>
                    </ul>
                    <p><a href="tel:${phone}" style="display:inline-block; padding:10px 20px; background-color:#E6B325; color:#333; text-decoration:none; font-weight:bold; border-radius:5px;">Gọi cho khách ngay</a></p>
                `
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi gửi email:', error);
                } else {
                    console.log('Đã gửi email thông báo:', info.response);
                }
            });
        }

        res.json({
            success: true,
            message: `Cảm ơn ${name}! Đơn hàng đã được ghi nhận.`,
            orderId: Number(result.lastInsertRowid)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi tạo đơn: ' + err.message });
    }
});

// ==========================================
// XỬ LÝ LỖI MULTER
// ==========================================
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File quá lớn! Giới hạn 5MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📁 File tĩnh: ./public`);
    console.log(`🖼️  Ảnh upload: ./uploads`);
    console.log(`🗄️  Database: ./data.db`);
});
