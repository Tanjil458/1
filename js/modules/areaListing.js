/**
 * Area Listing Module (Side Nav)
 */

const AreaListingModule = {
    areas: [],
    editIndex: -1,
    pendingDeleteId: null,

    init() {
        this.render();
        this.loadAreas();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 16px;">Area List</h3>
                <table id="areaTable" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Area Name</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Edit</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <button class="fab" onclick="AreaListingModule.openModal()">+</button>

            <!-- Area Modal -->
            <div class="modal" id="areaModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="areaModalTitle">Add Area</h3>
                        <button class="modal-close" onclick="AreaListingModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Area Name</label>
                            <input id="areaName" type="text" placeholder="Enter area name">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="AreaListingModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="AreaListingModule.saveArea()">Save</button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Popup -->
            <div class="delete-confirm-overlay" id="areaDeleteConfirmModal">
                <div class="delete-confirm-box" role="dialog" aria-modal="true">
                    <div class="delete-confirm-icon">⚠️</div>
                    <div class="delete-confirm-title">Delete this area?</div>
                    <div class="delete-confirm-text">This action cannot be undone. Are you sure you want to delete this area?</div>
                    <div class="delete-confirm-actions">
                        <button class="delete-confirm-btn cancel" onclick="AreaListingModule.closeDeleteConfirm()">Cancel</button>
                        <button class="delete-confirm-btn delete" onclick="AreaListingModule.confirmDelete()">Delete</button>
                    </div>
                </div>
            </div>
        `;

        this.attachSwipeEvents();
    },

    async loadAreas() {
        try {
            console.log('📥 Loading areas from DB...');
            this.areas = await DB.getAll('areas');
            console.log(`✅ Loaded ${this.areas.length} areas:`, this.areas);
            this.renderTable();
        } catch (error) {
            console.error('❌ Error loading areas:', error);
        }
    },

    renderTable() {
        const tbody = document.querySelector('#areaTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.areas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="padding: 20px; text-align: center; color: #6c757d;">
                        No areas added yet. Click + to add one.
                    </td>
                </tr>
            `;
            return;
        }

        this.areas.forEach((area, i) => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'touch-action: pan-y; transition: transform 0.2s;';
            tr.innerHTML = `
                <td style="padding: 12px 8px; border-bottom: 1px solid #f1f3f5; text-align: center;">${area.name}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">
                    <button class="btn btn-primary btn-small" onclick="AreaListingModule.editArea(${i})" style="background: #5B5FED; color: #fff; padding: 6px 12px; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        Edit
                    </button>
                </td>
            `;

            this.addSwipeToDelete(tr, area.id);
            tbody.appendChild(tr);
        });
    },

    openModal() {
        const modal = document.getElementById('areaModal');
        if (!modal) return;

        document.getElementById('areaModalTitle').textContent = 'Add Area';
        document.getElementById('areaName').value = '';
        this.editIndex = -1;

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('areaModal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    editArea(index) {
        this.editIndex = index;
        const area = this.areas[index];

        document.getElementById('areaModalTitle').textContent = 'Edit Area';
        document.getElementById('areaName').value = area.name;

        document.getElementById('areaModal').classList.add('show');
    },

    async saveArea() {
        console.log('💾 Save area clicked');
        const name = document.getElementById('areaName').value.trim();

        console.log('📝 Area data:', { name });

        if (!name) {
            console.warn('⚠️ Validation failed');
            App.showToast('Please enter area name', 'warning');
            return;
        }

        const areaData = { name, active: true };
        console.log('✅ Validation passed, saving:', areaData);

        try {
            if (this.editIndex === -1) {
                console.log('➕ Adding new area to DB...');
                const id = await DB.add('areas', areaData);
                console.log('✅ Area added with ID:', id);
                App.showToast('Area added successfully', 'success');
            } else {
                areaData.id = this.areas[this.editIndex].id;
                console.log('✏️ Updating area with ID:', areaData.id);
                await DB.update('areas', areaData);
                console.log('✅ Area updated');
                App.showToast('Area updated successfully', 'success');
            }

            this.closeModal();
            console.log('🔄 Reloading areas...');
            await this.loadAreas();
            console.log('✅ Areas reloaded');
        } catch (error) {
            console.error('❌ Error saving area:', error);
            App.showToast('Error saving area: ' + error.message, 'error');
        }
    },

    addSwipeToDelete(row, areaId) {
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
                this.showDeleteConfirm(areaId);
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

    showDeleteConfirm(areaId) {
        this.pendingDeleteId = areaId;
        const modal = document.getElementById('areaDeleteConfirmModal');
        if (modal) {
            modal.classList.add('show');
        }
    },

    closeDeleteConfirm() {
        const modal = document.getElementById('areaDeleteConfirmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.pendingDeleteId = null;
    },

    async confirmDelete() {
        if (!this.pendingDeleteId) return;

        try {
            await DB.delete('areas', this.pendingDeleteId);
            App.showToast('Area deleted', 'success');
            this.closeDeleteConfirm();
            await this.loadAreas();
        } catch (error) {
            console.error('Error deleting area:', error);
            App.showToast('Error deleting area', 'error');
        }
    },

    refresh() {
        this.loadAreas();
    },

    destroy() {
        this.areas = [];
        this.editIndex = -1;
        this.pendingDeleteId = null;
    }
};

// Register module
if (window.App) {
    App.registerModule('areaListing', AreaListingModule);
}

window.AreaListingModule = AreaListingModule;
