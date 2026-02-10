// Deliveries Page - Admin-style detailed calculation view for DSR

const Deliveries = {
    async render() {
        this.currentView = this.currentView || 'list';
        
        try {
            const session = getSession();
            if (!session || !session.employeeId || !session.companyId) {
                return `<div class="empty-state"><div class="empty-title">Session incomplete</div></div>`;
            }
            
            const employeeId = session.employeeId;
            const companyId = session.companyId;
            const employeeName = session.name || 'Unknown';
            
            console.log('🚚 Loading delivery calculations for:', employeeName);

            // Get deliveries data directly from Firestore
            const employeeDeliveries = await DirectFirestore.getEmployeeDeliveries(companyId, employeeId);
            console.log('🚚 Loaded', employeeDeliveries.length, 'delivery records from Firestore');

            if (this.currentView === 'list') {
                return this.renderDeliveryList(employeeDeliveries, employeeName);
            } else if (this.currentView === 'detail') {
                return this.renderDeliveryDetail(this.selectedDelivery, employeeName);
            }
        } catch (error) {
            console.error('❌ Deliveries render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading deliveries</div>
                    <div class="empty-text">${error.message}</div>
                </div>
            `;
        }
    },

    renderDeliveryList(deliveries, employeeName) {
        // Get 5 most recent unique deliveries
        const recentDeliveries = this.getRecentDeliveries(deliveries, 5);
        
        if (recentDeliveries.length === 0) {
            return `
                <div style="background: #fff; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚚</div>
                    <div style="color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Deliveries Found</div>
                    <div style="color: #6b7280; font-size: 14px;">No delivery records available for ${employeeName}</div>
                </div>
            `;
        }
        
        return `
            <div style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: between; margin-bottom: 20px;">
                    <h2 style="color: #374151; font-size: 20px; font-weight: 600; margin: 0;">📦 Recent Deliveries</h2>
                    <div style="color: #6b7280; font-size: 14px;">${recentDeliveries.length} deliveries</div>
                </div>
                
                <div style="space-y: 12px;">
                    ${recentDeliveries.map(delivery => this.renderDeliveryListItem(delivery)).join('')}
                </div>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
                📡 Live data from admin panel • Updated in real-time
            </p>
        `;
    },
    
    getRecentDeliveries(deliveries, limit = 5) {
        // Sort by original timestamp when available, fallback to date-only
        const sorted = [...deliveries].sort((a, b) => {
            const aTime = new Date(a.dateTime || a.date || '').getTime();
            const bTime = new Date(b.dateTime || b.date || '').getTime();
            return bTime - aTime;
        });

        return sorted.slice(0, limit);
    },
    
    renderDeliveryListItem(delivery) {
        const formattedDate = DateUtils.formatDisplayDate(delivery.date);
        const customerName = delivery.customerName || 'Unknown Customer';
        const totalAmount = delivery.totalSales || delivery.amount || 0;
        
        return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; cursor: pointer;" 
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.borderColor='#d1d5db'" 
                 onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e5e7eb'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="color: #374151; font-weight: 600; font-size: 16px; margin-bottom: 4px;">
                            ${customerName}
                        </div>
                        <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
                            📅 ${formattedDate}
                        </div>
                        <div style="color: #059669; font-weight: 600; font-size: 14px;">
                            💰 ৳${MoneyUtils.formatMoney(totalAmount)}
                        </div>
                    </div>
                    <button onclick="Deliveries.viewDeliveryDetail('${delivery.id || delivery.date + '-' + delivery.customerName}', '${delivery.date}', '${delivery.customerName}')" 
                            style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s;"
                            onmouseover="this.style.background='#2563eb'"
                            onmouseout="this.style.background='#3b82f6'">
                        View Details
                    </button>
                </div>
            </div>
        `;
    },

    async viewDeliveryDetail(deliveryId, date, customerName) {
        try {
            console.log('🔍 Opening delivery detail for:', { date, customerName });
            
            const session = getSession();
            if (!session?.companyId || !session?.employeeId) {
                console.error('Session data missing:', session);
                return;
            }
            
            const employeeDeliveries = await DirectFirestore.getEmployeeDeliveries(session.companyId, session.employeeId);
            console.log('🚚 Found deliveries:', employeeDeliveries);
            
            // Find the specific delivery by id first, then fallback to date + customer
            const delivery = employeeDeliveries.find(d => String(d.id) === String(deliveryId))
                || employeeDeliveries.find(d => {
                    const matches = d.date === date && (d.customerName || '').trim() === customerName.trim();
                    console.log('Checking delivery:', { d: d.date, dc: d.customerName, target: { date, customerName }, matches });
                    return matches;
                });
            
            if (!delivery) {
                console.error('Delivery not found for:', { date, customerName, available: employeeDeliveries.map(d => ({ date: d.date, customer: d.customerName })) });
                alert('Delivery details not found. Please try again.');
                return;
            }
            
            console.log('✅ Found delivery:', delivery);
            this.selectedDelivery = delivery;
            this.currentView = 'detail';
            
            // Re-render the page with detail view
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                const html = await this.render(); 
                pageContent.innerHTML = `
                    <section class="page active" id="deliveries-page">
                        ${html}
                    </section>
                `;
                console.log('✅ Detail view rendered successfully');
            } else {
                console.error('pageContent element not found');
            }
        } catch (error) {
            console.error('Error loading delivery detail:', error);
            alert('Error loading delivery details: ' + error.message);
        }
    },

    renderDeliveryDetail(delivery, employeeName) {
        if (!delivery) {
            return `<div class="empty-state"><div class="empty-title">Delivery not found</div></div>`;
        }
        
        const formattedDate = DateUtils.formatDisplayDate(delivery.date);
        const dayName = this.getDayName(delivery.date);
        
        return `
            <div style="background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Back Button -->
                <div style="margin-bottom: 20px;">
                    <button onclick="Deliveries.backToList()" 
                            style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        ← Back to List
                    </button>
                </div>
                
                <!-- Delivery Detail Header -->
                <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0;">
                            ${employeeName} • ${dayName} • ${formattedDate}
                        </h3>
                        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Customer: ${delivery.customerName}</p>
                    </div>
                    
                    <!-- Products & Sales Section -->
                    <div style="padding: 16px;">
                        <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Products & Sales</h4>
                        ${this.renderProductsTable([delivery])}
                    </div>

                    <!-- Cash Denominations Section -->
                    ${this.renderCashDenominations([delivery])}

                    <!-- Extra Expenses Section -->
                    ${this.renderExpensesTable([delivery])}

                    <!-- Credit Section -->
                    ${this.renderCreditsTable([delivery])}
                    
                    <!-- Cash Summary Section -->
                    ${this.renderCashSummary([delivery])}
                    
                    <!-- Customer Details Section -->
                    <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Customer Details</h4>
                        ${this.renderCustomerTable([delivery])}
                    </div>
                </div>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
                📡 Live data from admin panel • Updated in real-time
            </p>
        `;
    },

    backToList() {
        console.log('⬅️ Returning to list view');
        this.currentView = 'list';
        this.selectedDelivery = null;
        
        // Re-render the page with list view
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            this.render().then(html => {
                pageContent.innerHTML = `
                    <section class="page active" id="deliveries-page">
                        ${html}
                    </section>
                `;
                console.log('✅ List view rendered successfully');
            }).catch(error => {
                console.error('Error rendering list view:', error);
            });
        } else {
            console.error('pageContent element not found');
        }
    },

    renderDailyDetailedReports(deliveriesByDay, employeeName) {
        const days = Object.keys(deliveriesByDay).sort();
        
        return days.map(date => {
            const deliveries = deliveriesByDay[date];
            const dayName = this.getDayName(date);
            const formattedDate = DateUtils.formatDisplayDate(date);
            
            if (deliveries.length === 0) {
                return `
                    <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb;">
                            <h3 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0;">
                                ${employeeName} • ${dayName} • ${formattedDate}
                            </h3>
                            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">No deliveries recorded</p>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0;">
                            ${employeeName} • ${dayName} • ${formattedDate}
                        </h3>
                        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">${deliveries.length} deliveries</p>
                    </div>
                    
                    <!-- Products & Sales Section -->
                    <div style="padding: 16px;">
                        <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Products & Sales</h4>
                        ${this.renderProductsTable(deliveries)}
                    </div>
                    
                    <!-- Cash Summary Section -->
                    ${this.renderCashSummary(deliveries)}
                    
                    <!-- Customer Details Section -->
                    <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Customer Details</h4>
                        ${this.renderCustomerTable(deliveries)}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderProductsTable(deliveries) {
        if (deliveries.length === 0) return '<p style="color: #9ca3af; font-size: 13px;">No products delivered</p>';

        const detailedRows = [];
        const simpleRows = [];

        deliveries.forEach(delivery => {
            const source = delivery.products && delivery.products.length > 0
                ? delivery.products
                : (delivery.calculation || []);

            if (source.length > 0) {
                source.forEach(item => {
                    const sold = item.sold || 0;
                    if (sold > 0 || item.dc || item.dp || item.rc || item.rp) {
                        detailedRows.push({
                            productName: item.product || 'Unknown Product',
                            dc: item.dc || 0,
                            dp: item.dp || 0,
                            rc: item.rc || 0,
                            rp: item.rp || 0,
                            sold: sold,
                            price: item.price || 0,
                            total: item.total || (sold * (item.price || 0))
                        });
                    }
                });
            } else {
                simpleRows.push({
                    productName: delivery.product || delivery.productName || 'General Delivery',
                    quantity: delivery.quantity || 1,
                    unitPrice: delivery.unitPrice || delivery.amount || 0,
                    total: delivery.amount || 0
                });
            }
        });

        if (detailedRows.length === 0 && simpleRows.length === 0) {
            return '<p style="color: #9ca3af; font-size: 13px;">No products delivered</p>';
        }

        if (detailedRows.length > 0) {
            const grandTotal = detailedRows.reduce((sum, row) => sum + (row.total || 0), 0);

            return `
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #fff;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Product Name</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">DC</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">DP</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">RC</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">RP</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Sold</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Price</th>
                            <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailedRows.map(row => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #374151;">
                                    ${row.productName}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ${row.dc}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ${row.dp}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ${row.rc}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ${row.rp}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ${row.sold}
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                    ৳${MoneyUtils.formatMoney(row.price)}
                                </td>
                                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #059669;">
                                    ৳${MoneyUtils.formatMoney(row.total)}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8fafc; font-weight: 600;">
                            <td style="padding: 10px 8px; border-top: 2px solid #e5e7eb; color: #374151;" colspan="7">
                                Total Sales
                            </td>
                            <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #059669; font-size: 14px;">
                                ৳${MoneyUtils.formatMoney(grandTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        const grandTotal = simpleRows.reduce((sum, product) => sum + (product.total || 0), 0);

        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #fff;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Product Name</th>
                        <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                        <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
                        <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${simpleRows.map(product => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; color: #374151;">
                                ${product.productName}
                            </td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                ${product.quantity}
                            </td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
                                ৳${MoneyUtils.formatMoney(product.unitPrice)}
                            </td>
                            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #059669;">
                                ৳${MoneyUtils.formatMoney(product.total)}
                            </td>
                        </tr>
                    `).join('')}
                    <tr style="background: #f8fafc; font-weight: 600;">
                        <td style="padding: 10px 8px; border-top: 2px solid #e5e7eb; color: #374151;" colspan="3">
                            Total Sales
                        </td>
                        <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #059669; font-size: 14px;">
                            ৳${MoneyUtils.formatMoney(grandTotal)}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    },

    renderCashSummary(deliveries) {
        if (deliveries.length === 0) return '';
        
        const totalSales = deliveries.reduce((sum, del) => sum + (parseFloat(del.totalSales) || 0), 0);
        const totalCash = deliveries.reduce((sum, del) => sum + (parseFloat(del.totalCash) || 0), 0);
        const totalExpense = deliveries.reduce((sum, del) => sum + (parseFloat(del.totalExpense) || 0), 0);
        const totalCredit = deliveries.reduce((sum, del) => sum + (parseFloat(del.totalCredit) || 0), 0);
        const net = deliveries.reduce((sum, del) => sum + (parseFloat(del.net) || 0), 0);
        
        if (totalSales === 0) return '';
        
        return `
            <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #fefefe;">
                <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Cash Summary</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Description</th>
                            <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">Total Sales</td>
                            <td style="padding: 8px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">
                                ${MoneyUtils.formatMoney(totalSales)}
                            </td>
                        </tr>
                        ${totalExpense > 0 ? `
                            <tr>
                                <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">Total Expenses</td>
                                <td style="padding: 8px; text-align: right; font-weight: 600; color: #dc2626; border-bottom: 1px solid #f3f4f6;">
                                    -${MoneyUtils.formatMoney(totalExpense)}
                                </td>
                            </tr>
                        ` : ''}
                        ${totalCredit > 0 ? `
                            <tr>
                                <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">Total Credit</td>
                                <td style="padding: 8px; text-align: right; font-weight: 600; color: #f59e0b; border-bottom: 1px solid #f3f4f6;">
                                    ${MoneyUtils.formatMoney(totalCredit)}
                                </td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">Cash to Collect</td>
                            <td style="padding: 8px; text-align: right; font-weight: 600; color: #1e40af; border-bottom: 1px solid #f3f4f6;">
                                ${MoneyUtils.formatMoney(net)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCashDenominations(deliveries) {
        if (deliveries.length === 0) return '';

        const details = [];
        deliveries.forEach(delivery => {
            const cashDetail = Array.isArray(delivery.cashDetail) ? delivery.cashDetail : [];
            cashDetail.forEach(item => {
                details.push({
                    note: item.note || 0,
                    qty: item.qty || 0,
                    total: item.total || ((item.note || 0) * (item.qty || 0))
                });
            });
        });

        const filtered = details.filter(item => (item.qty || 0) > 0);
        if (filtered.length === 0) return '';

        const totalCash = filtered.reduce((sum, item) => sum + (item.total || 0), 0);

        return `
            <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #fff;">
                <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Cash Denominations</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Note (৳)</th>
                            <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                            <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(item => `
                            <tr>
                                <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                                    ${MoneyUtils.formatMoney(item.note)}
                                </td>
                                <td style="padding: 8px; text-align: center; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                                    ${item.qty}
                                </td>
                                <td style="padding: 8px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">
                                    ${MoneyUtils.formatMoney(item.total)}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8fafc; font-weight: 600;">
                            <td style="padding: 10px 8px; border-top: 2px solid #e5e7eb; color: #374151;" colspan="2">
                                Total Cash
                            </td>
                            <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #059669; font-size: 14px;">
                                ৳${MoneyUtils.formatMoney(totalCash)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    renderExpensesTable(deliveries) {
        if (deliveries.length === 0) return '';

        const expenses = [];
        deliveries.forEach(delivery => {
            const items = Array.isArray(delivery.expenses) ? delivery.expenses : [];
            items.forEach(item => {
                if (item && item.amount) {
                    expenses.push({
                        name: item.name || 'Expense',
                        amount: parseFloat(item.amount) || 0,
                        type: item.type || 'Expense'
                    });
                }
            });
        });

        const filtered = expenses.filter(item => item.amount > 0);
        if (filtered.length === 0) return '';

        const total = filtered.reduce((sum, item) => sum + item.amount, 0);

        return `
            <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #fff;">
                <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Extra Expenses</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Expense Name</th>
                            <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(item => `
                            <tr>
                                <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                                    ${item.name}
                                </td>
                                <td style="padding: 8px; text-align: right; font-weight: 600; color: #dc2626; border-bottom: 1px solid #f3f4f6;">
                                    ${MoneyUtils.formatMoney(item.amount)}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8fafc; font-weight: 600;">
                            <td style="padding: 10px 8px; border-top: 2px solid #e5e7eb; color: #374151;">
                                Total Expenses
                            </td>
                            <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #dc2626; font-size: 14px;">
                                ৳${MoneyUtils.formatMoney(total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCreditsTable(deliveries) {
        if (deliveries.length === 0) return '';

        const credits = [];
        deliveries.forEach(delivery => {
            const items = Array.isArray(delivery.credit) ? delivery.credit : [];
            items.forEach(item => {
                if (item && item.amount) {
                    credits.push({
                        name: item.name || 'Customer',
                        amount: parseFloat(item.amount) || 0
                    });
                }
            });
        });

        const filtered = credits.filter(item => item.amount > 0);
        if (filtered.length === 0) return '';

        const total = filtered.reduce((sum, item) => sum + item.amount, 0);

        return `
            <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #fff;">
                <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Credit (Unpaid)</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Customer</th>
                            <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(item => `
                            <tr>
                                <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                                    ${item.name}
                                </td>
                                <td style="padding: 8px; text-align: right; font-weight: 600; color: #f59e0b; border-bottom: 1px solid #f3f4f6;">
                                    ${MoneyUtils.formatMoney(item.amount)}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8fafc; font-weight: 600;">
                            <td style="padding: 10px 8px; border-top: 2px solid #e5e7eb; color: #374151;">
                                Total Credit
                            </td>
                            <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #e5e7eb; color: #f59e0b; font-size: 14px;">
                                ৳${MoneyUtils.formatMoney(total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCustomerTable(deliveries) {
        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Customer Name</th>
                        <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Date</th>
                        <th style="padding: 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (৳)</th>
                    </tr>
                </thead>
                <tbody>
                    ${deliveries.map(del => `
                        <tr>
                            <td style="padding: 8px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                                ${del.customerName || 'Unknown Customer'}
                            </td>
                            <td style="padding: 8px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                                ${DateUtils.formatDisplayDate(del.date)}
                            </td>
                            <td style="padding: 8px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">
                                ${MoneyUtils.formatMoney(del.totalSales || del.amount || 0)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    getDayName(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en', { weekday: 'long' });
        }
    }
};

// Make methods globally accessible for onclick handlers
window.Deliveries = Deliveries;
