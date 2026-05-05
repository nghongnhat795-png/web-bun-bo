document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');

    orderForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Ngăn chặn reload trang

        // Lấy dữ liệu
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const time = document.getElementById('time').value;
        const dish = document.getElementById('dish').value;
        const notes = document.getElementById('notes').value;

        // In ra console
        console.log('--- ĐƠN HÀNG MỚI ---');
        console.log('Tên:', name);
        console.log('SĐT:', phone);
        console.log('Giờ:', time);
        console.log('Món:', dish);
        console.log('Ghi chú:', notes);

        // Hiển thị alert
        alert(`Cảm ơn ${name}! Đơn hàng của bạn đã được gửi thành công.\nChúng tôi sẽ liên hệ lại qua số ${phone}.`);

        // Reset form
        orderForm.reset();
    });

    // === Hamburger Menu Toggle ===
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            // Đổi icon giữa menu và close
            const icon = this.querySelector('.material-icons');
            if (icon) {
                icon.textContent = navLinks.classList.contains('active') ? 'close' : 'menu';
            }
        });

        // Đóng menu khi nhấn vào link (trên mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('.material-icons');
                if (icon) icon.textContent = 'menu';
            });
        });
    }

    // === Image Upload Logic for Gallery ===
    const imageUpload = document.getElementById('imageUpload');
    const galleryContainer = document.getElementById('galleryContainer');
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    if (imageUpload && galleryContainer) {
        imageUpload.addEventListener('change', function(e) {
            const files = e.target.files;
            
            if (files.length === 0) return;

            let skippedCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue; // Chỉ chấp nhận file ảnh

                // Kiểm tra kích thước file (tối đa 5MB)
                if (file.size > MAX_FILE_SIZE) {
                    skippedCount++;
                    continue;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'gallery-item';
                    
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.alt = file.name || 'Ảnh tải lên';
                    
                    imgContainer.appendChild(img);
                    // Chèn ảnh mới vào đầu danh sách
                    galleryContainer.insertBefore(imgContainer, galleryContainer.firstChild);
                }
                reader.readAsDataURL(file); // Đọc file thành chuỗi base64
            }

            if (skippedCount > 0) {
                alert(`${skippedCount} ảnh bị bỏ qua vì vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
            }
            
            // Xóa giá trị input để có thể tải lại cùng một file nếu muốn
            imageUpload.value = '';
        });
    }

    // === Smooth scroll for nav links ===
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
