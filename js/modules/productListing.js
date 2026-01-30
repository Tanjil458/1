/**
 * Product Listing Module (Side Nav)
 */

const ProductListingModule = {
    products: [],
    editIndex: -1,
    pendingDeleteId: null,

    init() {
        this.render();
        this.loadProducts();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 16px;">Product List</h3>
                <table id="prodTable" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Name</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Pcs/Ctn</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Price</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Edit</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <button class="fab" onclick="ProductListingModule.openModal()">+</button>

            <!-- Product Modal -->
            <div class="modal" id="productModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">Add Product</h3>
                        <button class="modal-close" onclick="ProductListingModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Product Name</label>
                            <input id="pname" type="text" placeholder="Enter product name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Pieces per Carton</label>
                            <input id="ppc" type="number" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Price per Piece</label>
                            <input id="pprice" type="number" placeholder="0">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="ProductListingModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="ProductListingModule.saveProduct()">Save</button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Popup -->
            <div class="delete-confirm-overlay" id="deleteConfirmModal">
                <div class="delete-confirm-box" role="dialog" aria-modal="true">
                    <div class="delete-confirm-icon">⚠️</div>
                    <div class="delete-confirm-title">Delete this product?</div>
                    <div class="delete-confirm-text">This action cannot be undone. Are you sure you want to delete this product?</div>
                    <div class="delete-confirm-actions">
                        <button class="delete-confirm-btn cancel" onclick="ProductListingModule.closeDeleteConfirm()">Cancel</button>
                        <button class="delete-confirm-btn delete" onclick="ProductListingModule.confirmDelete()">Delete</button>
                    </div>
                </div>
            </div>
        `;

        this.attachSwipeEvents();
    },

    async loadProducts() {
        try {
            console.log('📥 Loading products from DB...');
            this.products = await DB.getAll('products');
            console.log(`✅ Loaded ${this.products.length} products:`, this.products);
            this.renderTable();
        } catch (error) {
            console.error('❌ Error loading products:', error);
        }
    },

    renderTable() {
        const tbody = document.querySelector('#prodTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.products.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'touch-action: pan-y; transition: transform 0.2s;';
            tr.innerHTML = `
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">${p.name}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">${p.pcs}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">৳${p.price}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">
                    <button class="btn btn-primary btn-small" onclick="ProductListingModule.editProduct(${i})" style="background: #5B5FED; color: #fff; padding: 6px 12px; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        Edit
                    </button>
                </td>
            `;

            this.addSwipeToDelete(tr, p.id);
            tbody.appendChild(tr);
        });
    },

    openModal() {
        const modal = document.getElementById('productModal');
        if (!modal) return;

        document.getElementById('modalTitle').textContent = 'Add Product';
        document.getElementById('pname').value = '';
        document.getElementById('ppc').value = '';
        document.getElementById('pprice').value = '';
        this.editIndex = -1;

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    editProduct(index) {
        this.editIndex = index;
        const p = this.products[index];

        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('pname').value = p.name;
        document.getElementById('ppc').value = p.pcs;
        document.getElementById('pprice').value = p.price;

        document.getElementById('productModal').classList.add('show');
    },

    async saveProduct() {
        console.log('💾 Save product clicked');
        const name = document.getElementById('pname').value.trim();
        const pcs = parseInt(document.getElementById('ppc').value);
        const price = parseFloat(document.getElementById('pprice').value);

        console.log('📝 Product data:', { name, pcs, price });

        if (!name || !pcs || !price) {
            console.warn('⚠️ Validation failed');
            App.showToast('Please fill all fields', 'warning');
            return;
        }

        const productData = { name, pcs, price, active: true };
        console.log('✅ Validation passed, saving:', productData);

        try {
            if (this.editIndex === -1) {
                console.log('➕ Adding new product to DB...');
                const id = await DB.add('products', productData);
                console.log('✅ Product added with ID:', id);
                App.showToast('Product added successfully', 'success');
            } else {
                productData.id = this.products[this.editIndex].id;
                console.log('✏️ Updating product with ID:', productData.id);
                await DB.update('products', productData);
                console.log('✅ Product updated');
                App.showToast('Product updated successfully', 'success');
            }

            this.closeModal();
            console.log('🔄 Reloading products...');
            await this.loadProducts();
            console.log('✅ Products reloaded');
        } catch (error) {
            console.error('❌ Error saving product:', error);
            App.showToast('Error saving product: ' + error.message, 'error');
        }
    },

    addSwipeToDelete(row, productId) {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        let hasMoved = false;

        row.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            const point = e.touches[0];
            startX = point.clientX;
            currentX = startX;
            isSwiping = true;
            hasMoved = false;
        }, { passive: false });

        row.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            const point = e.touches[0];
            currentX = point.clientX;
            const diff = startX - currentX;

            if (Math.abs(diff) > 10) {
                hasMoved = true;
                e.preventDefault();
            }

            if (diff > 0 && diff < 150) {
                row.style.transform = `translateX(-${diff}px)`;
                row.style.background = `linear-gradient(90deg, transparent ${100 - diff / 2}%, rgba(220,53,69,0.1) 100%)`;
            }
        }, { passive: false });

        row.addEventListener('touchend', () => {
            if (!isSwiping) return;
            const diff = startX - currentX;

            if (hasMoved && diff > 100) {
                this.showDeleteConfirm(productId);
                row.style.transform = '';
                row.style.background = '';
            } else {
                row.style.transform = '';
                row.style.background = '';
            }

            isSwiping = false;
            hasMoved = false;
        });
    },

    attachSwipeEvents() {
        // Will be called after table render
    },

    showDeleteConfirm(productId) {
        this.pendingDeleteId = productId;
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.classList.add('show');
        }
    },

    closeDeleteConfirm() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.pendingDeleteId = null;
    },

    async confirmDelete() {
        if (!this.pendingDeleteId) return;

        try {
            await DB.delete('products', this.pendingDeleteId);
            App.showToast('Product deleted', 'success');
            this.closeDeleteConfirm();
            await this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            App.showToast('Error deleting product', 'error');
        }
    },

    refresh() {
        this.loadProducts();
    },

    destroy() {
        this.products = [];
        this.editIndex = -1;
        this.pendingDeleteId = null;
    }
};

// Register module
if (window.App) {
    App.registerModule('productListing', ProductListingModule);
}

window.ProductListingModule = ProductListingModule;
