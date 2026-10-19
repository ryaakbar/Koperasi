// === AUTHENTICATION LOGIC ===
const currentUser = JSON.parse(localStorage.getItem('koperasi_user'));
const isLoginPage = document.getElementById("login-form") !== null;

// Routing Protection
if (!currentUser && !isLoginPage) {
    window.location.href = 'login.html';
} else if (currentUser && isLoginPage) {
    window.location.href = 'index.html';
}

if (isLoginPage) {
    // --- HALAMAN LOGIN ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const userVal = document.getElementById('login-username').value.trim();
        const passVal = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        
        // Aturan: Username = Arya / arya, Password = 123
        if (userVal.toLowerCase() === 'arya' && passVal === '123') {
            errorEl.style.display = 'none';
            // Simpan sesi login
            localStorage.setItem('koperasi_user', JSON.stringify({ 
                username: 'Arya',
                name: 'Arya',
                class: 'Siswa / Admin Koperasi' 
            }));
            window.location.href = 'index.html';
        } else {
            errorEl.style.display = 'block';
        }
    });

} else {
    // --- HALAMAN UTAMA (INDEX) ---

    // Set Data Profile
    if(currentUser) {
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-class').textContent = "Username: " + currentUser.username;
        document.getElementById('profile-initial').textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Auto-fill nama di checkout
        const checkoutName = document.getElementById('checkout-name');
        if(checkoutName) checkoutName.value = currentUser.name;
    }

    // Modal Profile & Logout
    const profileOverlay = document.getElementById('profile-overlay');
    document.getElementById('open-profile-btn').addEventListener('click', () => profileOverlay.classList.add('active'));
    document.getElementById('close-profile-btn').addEventListener('click', () => profileOverlay.classList.remove('active'));
    
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('koperasi_user');
        window.location.href = 'login.html';
    });

    /**
     * Data Produk Koperasi Sekolah
     */
    const products = [
        { id: 1, title: "Jas Almamater", category: "seragam", desc: "Jas almamater resmi sekolah.", price: 200000, icon: `<img src="almamater.jpg" alt="Jas Almamater" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 2, title: "Baju Batik", category: "seragam", desc: "Batik resmi identitas sekolah.", price: 130000, icon: `<img src="batik.jpg" alt="Baju Batik" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 3, title: "Dasi Sekolah", category: "atribut", desc: "Dasi standar seragam bordir.", price: 15000, icon: `<img src="dasi.jpg" alt="Dasi Sekolah" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 4, title: "Baju Jurusan", category: "seragam", desc: "Seragam praktek khusus kejuruan.", price: 140000, icon: `<img src="jurusan.jpg" alt="Baju Jurusan" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 5, title: "Seragam Olahraga", category: "seragam", desc: "Setelan olahraga nyaman.", price: 110000, icon: `<img src="olahraga.jpg" alt="Seragam Olahraga" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 6, title: "Baju Pramuka", category: "pramuka", desc: "Seragam pramuka lengkap.", price: 125000, icon: `<img src="pramuka.jpg" alt="Baju Pramuka" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 7, title: "Baju Seragam", category: "seragam", desc: "Seragam putih standar nasional.", price: 150000, icon: `<img src="seragam.jpg" alt="Baju Seragam" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` },
        { id: 8, title: "Topi Sekolah", category: "atribut", desc: "Topi upacara resmi sekolah.", price: 20000, icon: `<img src="topi.jpg" alt="Topi Sekolah" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` }
    ];

    /**
     * State Management
     */
    let cartItems = [];
    let purchaseHistory = [];
    let currentCategory = "semua";
    let currentSearch = "";
    let selectedProduct = null;
    let currentQty = 1;
    let currentSize = "M";

    /**
     * DOM Elements
     */
    const productGrid = document.getElementById("product-grid");
    const cartBadge = document.getElementById("cart-badge");
    const toastContainer = document.getElementById("toast-container");

    const actionSheetOverlay = document.getElementById("action-sheet-overlay");
    const sheetContent = document.getElementById("sheet-content");
    const cartSidebarOverlay = document.getElementById("cart-sidebar-overlay");
    const checkoutOverlay = document.getElementById("checkout-overlay");
    const historyOverlay = document.getElementById("history-overlay");

    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
    };

    /**
     * 1. Render Catalog Products
     */
    const renderProducts = () => {
        productGrid.innerHTML = "";
        const filteredProducts = products.filter(p => {
            const matchCat = currentCategory === "semua" || p.category === currentCategory;
            const matchSearch = p.title.toLowerCase().includes(currentSearch.toLowerCase());
            return matchCat && matchSearch;
        });

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = `<div class="empty-state"><p>Produk gak ketemu, bro.</p></div>`;
            return;
        }

        filteredProducts.forEach(p => {
            const card = document.createElement("article");
            card.className = "product-card";
            card.innerHTML = `
                <div class="product-image">${p.icon}</div>
                <div class="product-info">
                    <h4 class="product-title">${p.title}</h4>
                    <p class="product-desc">${p.desc}</p>
                    <div class="product-price">${formatRupiah(p.price)}</div>
                    <button class="btn-add-cart" onclick="openBottomSheet(${p.id})">Tambah</button>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };

    /**
     * 2. Bottom Sheet Logic
     */
    window.openBottomSheet = (id) => {
        selectedProduct = products.find(p => p.id === id);
        currentQty = 1;
        currentSize = "M";
        renderSheetContent();
        actionSheetOverlay.classList.add("active");
    };

    window.selectSize = (size) => {
        currentSize = size;
        document.querySelectorAll(".size-btn").forEach(btn => {
            btn.classList.toggle("active", btn.textContent === size);
        });
    };

    const renderSheetContent = () => {
        const otherProducts = products.filter(p => p.id !== selectedProduct.id);
        let otherProductsHTML = otherProducts.map(p => `
            <div class="other-product-card">
                <div class="op-icon">${p.icon}</div>
                <div class="op-title">${p.title}</div>
                <div class="op-price">${formatRupiah(p.price)}</div>
                <button class="btn-add-op" onclick="quickAdd(${p.id})">Tambah (+1)</button>
            </div>
        `).join('');

        sheetContent.innerHTML = `
            <div class="sheet-product-info">
                <div class="sheet-icon">${selectedProduct.icon}</div>
                <div class="sheet-details">
                    <h4>${selectedProduct.title}</h4>
                    <div class="price">${formatRupiah(selectedProduct.price)}</div>
                </div>
            </div>
            
            <label style="font-size:13px; color:var(--text-secondary); margin-bottom:8px; display:block;">Pilih Ukuran</label>
            <div class="size-options">
                ${['S', 'M', 'L', 'XL'].map(size => `
                    <button type="button" class="size-btn ${currentSize === size ? 'active' : ''}" onclick="selectSize('${size}')">${size}</button>
                `).join('')}
            </div>

            <label style="font-size:13px; color:var(--text-secondary); margin-bottom:8px; display:block;">Atur Jumlah</label>
            <div class="qty-control">
                <button class="qty-btn" onclick="updateQty(-1)">-</button>
                <span class="qty-number">${currentQty}</span>
                <button class="qty-btn" onclick="updateQty(1)">+</button>
            </div>
            
            <div class="sheet-actions">
                <button class="btn btn-outline" onclick="addToCart(false)">Masukkan Keranjang</button>
                <button class="btn btn-primary" onclick="addToCart(true)">Beli Sekarang</button>
            </div>

            <div class="other-products-section">
                <h5>Mungkin lo juga butuh ini:</h5>
                <div class="other-products-list">
                    ${otherProductsHTML}
                </div>
            </div>
        `;
    };

    window.updateQty = (change) => {
        currentQty += change;
        if (currentQty < 1) currentQty = 1;
        document.querySelector(".qty-number").textContent = currentQty;
    };

    window.quickAdd = (id) => {
        const p = products.find(prod => prod.id === id);
        const defaultSize = "M";
        const existing = cartItems.find(item => item.id === id && item.size === defaultSize);
        
        if (existing) {
            existing.qty += 1;
        } else {
            cartItems.push({ ...p, qty: 1, size: defaultSize });
        }
        updateCartBadge();
        showToast(`✓ ${p.title} masuk keranjang`);
    };

    /**
     * 3. Cart Logic
     */
    window.addToCart = (isBuyNow) => {
        const existingItem = cartItems.find(item => item.id === selectedProduct.id && item.size === currentSize);
        if (existingItem) {
            existingItem.qty += currentQty;
        } else {
            cartItems.push({ ...selectedProduct, qty: currentQty, size: currentSize });
        }
        
        updateCartBadge();
        closeAllModals();

        if (isBuyNow) {
            openCheckoutModal();
        } else {
            showToast("✓ Produk berhasil ditambahkan");
        }
    };

    const updateCartBadge = () => {
        const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
        cartBadge.textContent = totalQty;
    };

    const openCartSidebar = () => {
        renderCartSidebar();
        cartSidebarOverlay.classList.add("active");
    };

    const renderCartSidebar = () => {
        const container = document.getElementById("cart-items-container");
        const totalEl = document.getElementById("cart-total-price");
        container.innerHTML = "";
        
        if (cartItems.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-secondary); margin-top:40px;">Keranjang lo masih kosong nih.</p>`;
            totalEl.textContent = "Rp0";
            document.getElementById("btn-checkout-cart").disabled = true;
            return;
        }

        document.getElementById("btn-checkout-cart").disabled = false;
        let total = 0;

        cartItems.forEach((item, index) => {
            total += (item.price * item.qty);
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-icon">${item.icon}</div>
                    <div class="cart-item-info">
                        <h5>${item.title}</h5>
                        <div class="cart-item-price">${formatRupiah(item.price)}</div>
                        <div class="cart-item-qty">Ukuran: ${item.size} | Jumlah: ${item.qty}</div>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">Hapus</button>
                </div>
            `;
        });
        totalEl.textContent = formatRupiah(total);
    };

    window.removeFromCart = (index) => {
        cartItems.splice(index, 1);
        updateCartBadge();
        renderCartSidebar();
    };

    /**
     * 4. Checkout Logic
     */
    const openCheckoutModal = () => {
        if(cartItems.length === 0) return;
        closeAllModals();
        
        let total = 0;
        let totalQty = 0;
        const checkoutItemsList = document.getElementById("checkout-items-list");
        checkoutItemsList.innerHTML = "";

        cartItems.forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            totalQty += item.qty;

            checkoutItemsList.innerHTML += `
                <div class="checkout-item-row">
                    <div>
                        <span class="checkout-item-title">${item.title} (${item.size})</span> 
                        <span class="checkout-item-qty">x${item.qty}</span>
                    </div>
                    <div class="checkout-item-price">${formatRupiah(itemTotal)}</div>
                </div>
            `;
        });

        document.getElementById("checkout-total-price").textContent = formatRupiah(total);
        document.getElementById("checkout-total-qty").textContent = `Total: ${totalQty} Item`;

        checkoutOverlay.classList.add("active");
    };

    document.getElementById("btn-checkout-cart").addEventListener("click", openCheckoutModal);

    const WHATSAPP_KOPERASI = "6285117138150";

    const createWhatsAppPaymentMessage = (transaction) => {
        const detailProduk = transaction.items.map((item, index) => {
            const subtotal = item.price * item.qty;
            return `${index + 1}. ${item.title} (Ukuran: ${item.size}) x${item.qty} - ${formatRupiah(subtotal)}`;
        }).join("\n");

        return `Halo Koperasi Sekolah, saya ingin melakukan pembayaran/pemesanan dengan rincian berikut:

*PEMBAYARAN KOPERASI SEKOLAH*
No. Invoice: ${transaction.invoice}
Nama Siswa: ${transaction.nama}
Kelas: ${transaction.kelas}
Tanggal: ${transaction.tanggal}

*Rincian Pesanan:*
${detailProduk}

Total Item: ${transaction.totalQty}
*Total Pembayaran: ${formatRupiah(transaction.total)}*

Mohon dikonfirmasi untuk pesanan saya. Terima kasih.`;
    };

    document.getElementById("btn-confirm-payment").addEventListener("click", () => {
        const namaSiswa = document.getElementById("checkout-name").value.trim() || "Siswa (Tanpa Nama)";
        const kelasSiswa = document.getElementById("checkout-class").value.trim() || "Belum diisi";
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);

        const dateObj = new Date();
        const tgl = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const waktu = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const newTransaction = {
            invoice: "INV-" + Math.floor(Math.random() * 1000000),
            nama: namaSiswa,
            kelas: kelasSiswa,
            tanggal: `${tgl} - ${waktu}`,
            items: [...cartItems],
            totalQty: totalQty,
            total: total
        };

        purchaseHistory.unshift(newTransaction);

        const pesanWhatsApp = createWhatsAppPaymentMessage(newTransaction);
        const whatsappUrl = `https://wa.me/${WHATSAPP_KOPERASI}?text=${encodeURIComponent(pesanWhatsApp)}`;

        cartItems = [];
        updateCartBadge();
        closeAllModals();
        showToast("✓ Pembayaran berhasil. Membuka WhatsApp...");

        setTimeout(() => {
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }, 350);
    });

    /**
     * 5. History Modal
     */
    document.getElementById("nav-history").addEventListener("click", (e) => {
        e.preventDefault();
        closeAllModals();
        
        const container = document.getElementById("history-container");
        container.innerHTML = "";

        if (purchaseHistory.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-secondary);">Belum ada riwayat pembelian, bro.</p>`;
        } else {
            purchaseHistory.forEach(tx => {
                let itemsHTML = tx.items.map(item => `<li>${item.title} - Ukuran ${item.size} (x${item.qty})</li>`).join('');
                container.innerHTML += `
                    <div class="history-card">
                        <div class="history-header">
                            <strong>${tx.invoice}</strong>
                            <span>${tx.tanggal}</span>
                        </div>
                        <ul class="history-items" style="list-style-position: inside;">
                            ${itemsHTML}
                        </ul>
                        <div class="history-total">
                            Total: ${formatRupiah(tx.total)}
                        </div>
                    </div>
                `;
            });
        }

        historyOverlay.classList.add("active");
    });

    /**
     * 6. UI Helpers
     */
    const showToast = (message) => {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const closeAllModals = () => {
        actionSheetOverlay.classList.remove("active");
        cartSidebarOverlay.classList.remove("active");
        checkoutOverlay.classList.remove("active");
        historyOverlay.classList.remove("active");
        if(profileOverlay) profileOverlay.classList.remove('active');
    };

    document.getElementById("close-sheet-btn").addEventListener("click", closeAllModals);
    document.getElementById("close-cart-btn").addEventListener("click", closeAllModals);
    document.getElementById("close-checkout-btn").addEventListener("click", closeAllModals);
    document.getElementById("close-history-btn").addEventListener("click", closeAllModals);
    document.getElementById("open-cart-btn").addEventListener("click", openCartSidebar);

    [actionSheetOverlay, cartSidebarOverlay, checkoutOverlay, historyOverlay, profileOverlay].forEach(overlay => {
        if(overlay) {
            overlay.addEventListener("click", (e) => {
                if(e.target === overlay) closeAllModals();
            });
        }
    });

    /**
     * 7. Search, Filter & Mobile Menu
     */
    document.getElementById("search-input").addEventListener("input", (e) => {
        currentSearch = e.target.value;
        renderProducts();
    });

    document.getElementById("category-filters").addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");
            currentCategory = e.target.getAttribute("data-filter");
            renderProducts();
        }
    });

    document.getElementById("mobile-menu-btn").addEventListener("click", () => {
        document.getElementById("main-nav").classList.toggle("show");
    });

    // Init
    renderProducts();
}
