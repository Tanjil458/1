// Direct Firestore Service - No Local Database
// Fetches data directly from Firestore in real-time

const DirectFirestore = {
    
    /**
     * Get employee advances (cash + product combined)
     */
    async getEmployeeAdvances(companyId, employeeId) {
        try {
            console.log('💰 Fetching advances directly from Firestore for:', employeeId);
            
            // Fetch from advances collection (contains cash and new product advances)
            const advancesSnapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('advances')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const advancesFromMain = [];
            advancesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                    advancesFromMain.push({
                        id: doc.id,
                        ...data,
                        // Normalize amount field
                        amount: data.amount || data.totalValue || 0,
                        // Ensure type is set properly
                        type: data.type || 'cash'
                    });
                }
            });

            // Fetch from productAdvances collection (legacy product advances)
            const productSnapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('productAdvances')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const productAdvances = [];
            productSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                    // Check if this product advance already exists in main advances collection
                    const existsInMain = advancesFromMain.find(adv => 
                        adv.date === data.date && 
                        adv.productName === data.productName &&
                        adv.type === 'product'
                    );
                    
                    // Only add if not already in main collection (avoid duplicates)
                    if (!existsInMain) {
                        productAdvances.push({
                            id: doc.id,
                            ...data,
                            amount: data.totalValue || data.amount || 0,
                            type: 'product',
                            reason: `Product: ${data.productName} (${data.quantity} × ৳${data.unitPrice})`
                        });
                    }
                }
            });

            const allAdvances = [...advancesFromMain, ...productAdvances];
            console.log(`💰 Found ${advancesFromMain.length} from advances collection + ${productAdvances.length} from productAdvances collection = ${allAdvances.length} total`);
            
            // Debug logging for all advances
            allAdvances.forEach((adv, index) => {
                console.log(`💵 Advance ${index + 1}:`, {
                    id: adv.id,
                    date: adv.date,
                    type: adv.type,
                    amount: adv.amount,
                    productName: adv.productName,
                    reason: adv.reason || adv.note
                });
            });
            
            return allAdvances;
            
        } catch (error) {
            console.error('❌ Error fetching advances:', error);
            return [];
        }
    },

    /**
     * Get employee attendance
     */
    async getEmployeeAttendance(companyId, employeeId) {
        try {
            console.log('📅 Fetching attendance from Firestore for:', employeeId);
            
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('attendance')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const attendance = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                    attendance.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`📅 Found ${attendance.length} attendance records`);
            return attendance;
            
        } catch (error) {
            console.error('❌ Error fetching attendance:', error);
            return [];
        }
    },

    /**
     * Get employee deliveries (from history collection where admin saves delivery calculations)
     */
    async getEmployeeDeliveries(companyId, employeeId) {
        try {
            console.log('🚚 Fetching deliveries from Firestore for:', employeeId);
            
            // Query for records where employeeId matches (single employee records)
            const singleSnapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('history')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            // Query for records where employeeIds array contains this employee (multi-employee records)
            const multiSnapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('history')
                .where('employeeIds', 'array-contains', String(employeeId))
                .get();
            
            const deliveries = [];
            const processedIds = new Set();
            
            // Process single employee records
            singleSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true && !processedIds.has(doc.id)) {
                    processedIds.add(doc.id);
                    deliveries.push(this.transformHistoryToDelivery(doc.id, data));
                }
            });
            
            // Process multi-employee records
            multiSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true && !processedIds.has(doc.id)) {
                    processedIds.add(doc.id);
                    deliveries.push(this.transformHistoryToDelivery(doc.id, data));
                }
            });

            console.log(`🚚 Found ${deliveries.length} delivery records from history collection`);
            return deliveries;
            
        } catch (error) {
            console.error('❌ Error fetching deliveries:', error);
            return [];
        }
    },

    /**
     * Transform history record to delivery format
     */
    transformHistoryToDelivery(id, data) {
        return {
            id: id,
            ...data,
            dateTime: data.date || '',
            customerName: this.extractCustomerFromName(data.name),
            area: data.area || '',
            amount: parseFloat(data.sales) || 0,
            date: data.date ? data.date.split('T')[0] : '', // Convert ISO to YYYY-MM-DD
            product: data.calculation && data.calculation.length > 0 ? data.calculation[0].product : 'Mixed Products',
            quantity: data.calculation ? data.calculation.reduce((sum, calc) => sum + (calc.sold || 0), 0) : 0,
            products: data.calculation || [],
            expenses: data.expenses || [],
            credit: data.credit || [],
            cashDetail: data.cashDetail || [],
            totalSales: parseFloat(data.sales) || 0,
            totalCash: parseFloat(data.cash) || 0,
            totalExpense: parseFloat(data.totalExpense) || 0,
            totalCredit: parseFloat(data.totalCredit) || 0,
            net: parseFloat(data.net) || 0
        };
    },

    /**
     * Extract customer name from history record name format "Customer, Date"
     */
    extractCustomerFromName(name) {
        if (!name) return 'Unknown Customer';
        const parts = name.split(',');
        return parts.length > 0 ? parts[0].trim() : name;
    },

    /**
     * Get employee profile
     */
    async getEmployeeProfile(companyId, employeeId) {
        try {
            console.log('👤 Fetching profile from Firestore for:', employeeId);
            
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('employees')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            if (snapshot.empty) {
                console.warn('⚠️ Employee profile not found');
                return null;
            }

            const doc = snapshot.docs[0];
            const profile = doc.data();
            
            if (profile.deleted === true) {
                console.warn('⚠️ Employee profile is deleted');
                return null;
            }

            console.log('👤 Profile fetched successfully');
            return {
                id: doc.id,
                ...profile
            };
            
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            return null;
        }
    },

    /**
     * Get repayments
     */
    async getEmployeeRepayments(companyId, employeeId) {
        try {
            console.log('💵 Fetching repayments from Firestore for:', employeeId);
            
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('repayments')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const repayments = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                    repayments.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`💵 Found ${repayments.length} repayment records`);
            return repayments;
            
        } catch (error) {
            console.error('❌ Error fetching repayments:', error);
            return [];
        }
    }
};

// Make available globally
window.DirectFirestore = DirectFirestore;