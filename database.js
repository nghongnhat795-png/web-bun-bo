const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

// Khởi tạo file data.json nếu chưa tồn tại
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
        gallery: [],
        orders: [],
        nextGalleryId: 1,
        nextOrderId: 1
    }, null, 2));
}

// Đọc dữ liệu
function readData() {
    const rawData = fs.readFileSync(dataFile);
    return JSON.parse(rawData);
}

// Ghi dữ liệu
function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
    gallery: {
        getAll: () => {
            const data = readData();
            // Trả về danh sách sắp xếp mới nhất lên đầu
            return data.gallery.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        },
        getById: (id) => {
            const data = readData();
            return data.gallery.find(img => img.id === id);
        },
        insert: (filename, originalName) => {
            const data = readData();
            const newImage = {
                id: data.nextGalleryId++,
                filename,
                original_name: originalName,
                uploaded_at: new Date().toISOString()
            };
            data.gallery.push(newImage);
            writeData(data);
            return { lastInsertRowid: newImage.id };
        },
        update: (id, filename, originalName) => {
            const data = readData();
            const index = data.gallery.findIndex(img => img.id === id);
            if (index !== -1) {
                data.gallery[index].filename = filename;
                data.gallery[index].original_name = originalName;
                writeData(data);
            }
        },
        delete: (id) => {
            const data = readData();
            data.gallery = data.gallery.filter(img => img.id !== id);
            writeData(data);
        }
    },
    orders: {
        getAll: () => {
            const data = readData();
            return data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        },
        insert: (name, phone, time, dish, notes) => {
            const data = readData();
            const newOrder = {
                id: data.nextOrderId++,
                name,
                phone,
                time,
                dish,
                notes,
                created_at: new Date().toISOString()
            };
            data.orders.push(newOrder);
            writeData(data);
            return { lastInsertRowid: newOrder.id };
        }
    }
};
