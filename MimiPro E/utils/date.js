// Date Utility Functions

const DateUtils = {
    // Format date to YYYY-MM-DD
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Format date to DD/MM/YYYY
    formatDisplayDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    // Get today's date as YYYY-MM-DD
    getToday() {
        return this.formatDate(new Date());
    },

    // Get first day of current month
    getMonthStart() {
        const date = new Date();
        date.setDate(1);
        return this.formatDate(date);
    },

    // Get last day of current month
    getMonthEnd() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return this.formatDate(date);
    },

    // Parse YYYY-MM-DD to Date
    parseDate(dateString) {
        return new Date(dateString);
    },

    // Get month name
    getMonthName(monthIndex) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex];
    },

    // Get day name
    getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    },

    // Check if date is today
    isToday(dateString) {
        return dateString === this.getToday();
    },

    // Get relative date (e.g., "Today", "Yesterday")
    getRelativeDate(dateString) {
        const today = this.getToday();
        if (dateString === today) return 'Today';
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateString === this.formatDate(yesterday)) return 'Yesterday';
        
        return this.formatDisplayDate(dateString);
    },

    // Get date N days ago from today
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.formatDate(date);
    }
};
