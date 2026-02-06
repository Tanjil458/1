// UI Utility Functions

const UIUtils = {
    // Show toast message
    showToast(message, duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },

    // Show loading overlay
    showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="
                    background-color: white;
                    padding: 24px 32px;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div class="loading-spinner" style="
                        display: block;
                        width: 40px;
                        height: 40px;
                        margin: 0 auto 16px;
                        border: 4px solid rgba(255, 107, 53, 0.3);
                        border-top-color: #FF6B35;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    "></div>
                    <p style="margin: 0; color: #666;">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    },

    // Confirm dialog
    confirm(message, onConfirm) {
        if (window.confirm(message)) {
            onConfirm();
        }
    }
};

// Add required animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
