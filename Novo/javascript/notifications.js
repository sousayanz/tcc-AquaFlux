// ========================================
// 🔔 SISTEMA DE NOTIFICAÇÕES TOAST - AQUAFLUX
// ========================================

(function() {
    'use strict';
    
    // Criar container de toasts
    function initToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 380px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    // Função principal de toast
    function showToast(message, type = 'info', title = null, duration = 5000) {
        const container = initToastContainer();
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const defaultTitles = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type] || colors.info};
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            cursor: pointer;
            pointer-events: all;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        `;

        const iconColor = colors[type] || colors.info;
        const iconBg = type === 'success' ? '#d1fae5' : 
                       type === 'error' ? '#fee2e2' : 
                       type === 'warning' ? '#fef3c7' : '#dbeafe';

        toast.innerHTML = `
            <div style="
                font-size: 20px;
                font-weight: bold;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                background: ${iconBg};
                color: ${iconColor};
            ">${icons[type] || icons.info}</div>
            <div style="flex: 1;">
                <div style="
                    font-size: 14px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 2px;
                ">${title || defaultTitles[type]}</div>
                <div style="
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                ">${message}</div>
            </div>
            <button style="
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 20px;
                font-weight: bold;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#f3f4f6'; this.style.color='#4b5563'" 
               onmouseout="this.style.background='none'; this.style.color='#9ca3af'">×</button>
        `;

        // Hover effect
        toast.addEventListener('mouseenter', () => {
            toast.style.transform = 'translateX(-5px)';
            toast.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.25)';
        });

        toast.addEventListener('mouseleave', () => {
            toast.style.transform = 'translateX(0)';
            toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        });

        container.appendChild(toast);

        // Botão de fechar
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeToast(toast);
        });

        // Auto-remover
        if (duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }

        console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
        return toast;
    }

    function removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Adicionar animações ao document
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
            
            @media (max-width: 768px) {
                #toast-container {
                    bottom: 20px !important;
                    right: 20px !important;
                    left: 20px !important;
                    max-width: 100% !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Expor globalmente
    window.showToast = showToast;
    window.showMessage = showToast;
    window.showNotification = showToast;
    
    console.log('✅ Sistema de Toast inicializado!');
})();


// 🔔 SISTEMA UNIFICADO DE NOTIFICAÇÕES - AQUAFLUX
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Criar container de toasts
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    getIcon(type) {
        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    show(message, type = 'info', duration = 5000) {
        const id = Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.id = id;
        
        toast.innerHTML = `
            <div class="toast-icon">
                ${this.getIcon(type)}
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.getTitle(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fechar">×</button>
        `;

        this.container.appendChild(toast);

        const notification = {
            id,
            message,
            type,
            time: new Date(),
            read: false
        };
        this.notifications.unshift(notification);
        this.addToPanel(notification);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeToast(toast);
        });

        toast.addEventListener('click', () => {
            this.openNotificationPanel();
            this.removeToast(toast);
        });

        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }

    getTitle(type) {
        const titles = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
    }

    addToPanel(notification) {
        const panel = document.querySelector('.notification-list');
        if (!panel) return;

        const item = document.createElement('div');
        item.className = 'notification-item unread';
        item.dataset.id = notification.id;

        const timeStr = this.formatTime(notification.time);

        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                ${this.getIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.getTitle(notification.type)}</div>
                <div class="notification-text">${notification.message}</div>
                <div class="notification-time">${timeStr}</div>
            </div>
        `;

        panel.insertBefore(item, panel.firstChild);
        this.updateBadge();
    }

    openNotificationPanel() {
        const panel = document.querySelector('.notification-panel');
        if (panel) {
            panel.classList.add('active');
        }
    }

    updateBadge() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Agora mesmo';
        if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
        return date.toLocaleDateString('pt-BR');
    }
}

// Criar instância global
window.notificationSystem = new NotificationSystem();

// Função global unificada
window.showMessage = (message, type = 'info') => {
    window.notificationSystem.show(message, type);
};

// Aliases
window.showNotification = window.showMessage;
window.showToast = window.showMessage;

console.log('✅ Sistema de notificações carregado!');
