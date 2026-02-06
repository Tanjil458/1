// Money Utility Functions

const MoneyUtils = {
    // Format number as currency
    formatMoney(amount) {
        if (amount === null || amount === undefined) return '৳0';
        const num = parseFloat(amount);
        if (isNaN(num)) return '৳0';
        return '৳' + num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    },

    // Parse money string to number
    parseMoney(moneyString) {
        if (!moneyString) return 0;
        const cleaned = moneyString.toString().replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    },

    // Add two money values
    add(amount1, amount2) {
        return this.parseMoney(amount1) + this.parseMoney(amount2);
    },

    // Subtract money values
    subtract(amount1, amount2) {
        return this.parseMoney(amount1) - this.parseMoney(amount2);
    }
};
