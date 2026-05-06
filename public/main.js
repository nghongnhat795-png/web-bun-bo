document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // HAMBURGER MENU TOGGLE
    // ==========================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = this.querySelector('.material-icons');
            if (icon) {
                icon.textContent = navLinks.classList.contains('active') ? 'close' : 'menu';
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('.material-icons');
                if (icon) icon.textContent = 'menu';
            });
        });
    }

    // ==========================================
    // ORDER FORM - Gửi đơn qua API
    // ==========================================
    const orderForm = document.getElementById('orderForm');
    const submitBtn = document.getElementById('submitBtn');

    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const time = document.getElementById('time').value;
        const dish = document.getElementById('dish').value;
        const notes = document.getElementById('notes').value.trim();

        // Disable nút gửi trong khi xử lý
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, time, dish, notes })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                orderForm.reset();
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (err) {
            alert('Không thể kết nối server. Vui lòng thử lại.');
            console.error('Order error:', err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi Đơn';
        }
    });

    // ==========================================
    // GALLERY - Tải ảnh từ API khi mở trang
    // ==========================================
    const galleryContainer = document.getElementById('galleryContainer');
    const galleryEmpty = document.getElementById('galleryEmpty');
    const galleryStatus = document.getElementById('galleryStatus');
    const imageUpload = document.getElementById('imageUpload');
    const replaceImageInput = document.getElementById('replaceImageInput');
    let replaceTargetId = null; // ID ảnh đang được thay thế

    // Hiển thị thông báo
    function showStatus(message, type = 'info') {
        galleryStatus.textContent = message;
        galleryStatus.className = `gallery-status gallery-status--${type}`;
        galleryStatus.style.display = 'block';
        setTimeout(() => {
            galleryStatus.style.display = 'none';
        }, 3000);
    }

    // Tạo phần tử gallery item
    function createGalleryItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.id = image.id;

        item.innerHTML = `
            <img src="/uploads/${image.filename}" alt="${image.original_name}">
            <div class="gallery-controls">
                <button class="gallery-ctrl-btn replace-btn" title="Thay ảnh" data-id="${image.id}">
                    <span class="material-icons">swap_horiz</span>
                </button>
                <button class="gallery-ctrl-btn delete-btn" title="Xóa ảnh" data-id="${image.id}">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;

        // Nút thay ảnh
        item.querySelector('.replace-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            replaceTargetId = image.id;
            replaceImageInput.click();
        });

        // Nút xóa ảnh
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteImage(image.id, item);
        });

        return item;
    }

    // Tải danh sách ảnh từ server
    async function loadGallery() {
        try {
            const response = await fetch('/api/gallery');
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                galleryEmpty.style.display = 'none';
                result.data.forEach(image => {
                    galleryContainer.appendChild(createGalleryItem(image));
                });
            } else {
                galleryEmpty.style.display = 'flex';
            }
        } catch (err) {
            console.error('Lỗi tải gallery:', err);
            galleryEmpty.querySelector('p').textContent = 'Không thể tải ảnh. Kiểm tra kết nối server.';
        }
    }

    // Upload ảnh mới
    async function uploadImages(files) {
        const formData = new FormData();
        let validCount = 0;

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                showStatus(`"${file.name}" quá lớn (>5MB), đã bỏ qua.`, 'error');
                continue;
            }
            formData.append('images', file);
            validCount++;
        }

        if (validCount === 0) return;

        showStatus('Đang tải ảnh lên...', 'info');

        try {
            const response = await fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showStatus(`Đã tải lên ${result.data.length} ảnh!`, 'success');
                galleryEmpty.style.display = 'none';

                // Thêm ảnh mới vào đầu danh sách
                result.data.reverse().forEach(image => {
                    const item = createGalleryItem(image);
                    // Chèn sau galleryEmpty (luôn là phần tử đầu tiên)
                    if (galleryEmpty.nextSibling) {
                        galleryContainer.insertBefore(item, galleryEmpty.nextSibling);
                    } else {
                        galleryContainer.appendChild(item);
                    }
                });
            } else {
                showStatus('Lỗi: ' + result.message, 'error');
            }
        } catch (err) {
            showStatus('Không thể kết nối server.', 'error');
            console.error('Upload error:', err);
        }
    }

    // Thay đổi ảnh
    async function replaceImage(id, file) {
        if (file.size > 5 * 1024 * 1024) {
            showStatus('File quá lớn (>5MB)!', 'error');
            return;
        }

        showStatus('Đang thay ảnh...', 'info');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`/api/gallery/${id}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showStatus('Đã thay đổi ảnh!', 'success');
                // Cập nhật ảnh trên giao diện
                const item = galleryContainer.querySelector(`[data-id="${id}"]`);
                if (item) {
                    const img = item.querySelector('img');
                    img.src = `/uploads/${result.data.filename}?t=${Date.now()}`; // cache bust
                    img.alt = result.data.original_name;
                }
            } else {
                showStatus('Lỗi: ' + result.message, 'error');
            }
        } catch (err) {
            showStatus('Không thể kết nối server.', 'error');
            console.error('Replace error:', err);
        }
    }

    // Xóa ảnh
    async function deleteImage(id, itemElement) {
        if (!confirm('Bạn có chắc muốn xóa ảnh này không?')) return;

        try {
            const response = await fetch(`/api/gallery/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                // Xóa phần tử khỏi DOM với animation
                itemElement.style.transition = 'opacity 0.3s, transform 0.3s';
                itemElement.style.opacity = '0';
                itemElement.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    itemElement.remove();
                    // Kiểm tra nếu hết ảnh
                    const remainingItems = galleryContainer.querySelectorAll('.gallery-item');
                    if (remainingItems.length === 0) {
                        galleryEmpty.style.display = 'flex';
                    }
                }, 300);
                showStatus('Đã xóa ảnh!', 'success');
            } else {
                showStatus('Lỗi: ' + result.message, 'error');
            }
        } catch (err) {
            showStatus('Không thể kết nối server.', 'error');
            console.error('Delete error:', err);
        }
    }

    // === EVENT LISTENERS ===

    // Upload ảnh mới
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                uploadImages(e.target.files);
                imageUpload.value = '';
            }
        });
    }

    // Thay ảnh
    if (replaceImageInput) {
        replaceImageInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0 && replaceTargetId) {
                replaceImage(replaceTargetId, e.target.files[0]);
                replaceImageInput.value = '';
                replaceTargetId = null;
            }
        });
    }

    // Tải gallery khi mở trang
    loadGallery();

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
