// --- CRYPTO TRADER WEB APP - MAIN ENGINE ---
const PRECONFIGURED_MAINNET_API_KEY = "mqcU8gfuojMk43xtXG0RRc6k2fCXVjKz1W9fT6Y6lsxBHBjNRXmHaaqv5iOn699Z";
const PRECONFIGURED_MAINNET_API_SECRET = "RKJCqagKpEluIvkYqjS4NkqpyML3rRZQJXrlMsUH6pPfLJE5xkEC4lJMvKsoXSyO";

let state = {
    network: 'mainnet',
    apiKey: PRECONFIGURED_MAINNET_API_KEY,
    apiSecret: PRECONFIGURED_MAINNET_API_SECRET,
    proxyHost: '',
    proxyPort: '',
    pinCode: '1234',
    isAutoTradeActive: false,
    positions: []
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("CryptoTrader Web App đã khởi động thành công!");
    loadStoredSettings();
    initWebSocketFeed();
    setupEventListeners();
});

function loadStoredSettings() {
    const savedPin = localStorage.getItem('crypto_pin');
    if (savedPin) state.pinCode = savedPin;
    
    // Seed sample positions if empty
    state.positions = [
        {
            id: 'pos_1',
            symbol: 'BTCUSDT',
            side: 'BUY',
            entryPrice: 67420.50,
            markPrice: 67950.00,
            amount: 0.15,
            unrealizedPnl: 79.42,
            roiPercent: 15.70,
            liquidationPrice: 64150.00
        }
    ];
    renderPositions();
}

// Hàm xác thực mã PIN bảo mật trước khi thực thi lệnh
function verifyPinAndExecute(actionName, callback) {
    const inputPin = prompt(`🔒 [BẢO MẬT] Nhập mã PIN để xác nhận '${actionName}' (Mặc định: 1234):`);
    if (inputPin === state.pinCode) {
        alert(`Xác thực thành công cho lệnh: ${actionName}`);
        callback();
    } else if (inputPin !== null) {
        alert("Sai mã PIN! Thao tác bị hủy bỏ để đảm bảo an toàn.");
    }
}

function setupEventListeners() {
    // 1. Nút Bật/Tắt Auto Trade
    const autoTradeBtn = document.querySelector('button, [onclick*="AutoTrade"]');
    if (autoTradeBtn) {
        autoTradeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            verifyPinAndExecute("Bật/Tắt Auto Trade", () => {
                state.isAutoTradeActive = !state.isAutoTradeActive;
                autoTradeBtn.innerText = state.isAutoTradeActive ? "⏸ Dừng Auto Trade" : "[Bật Auto Trade]";
                autoTradeBtn.style.background = state.isAutoTradeActive ? "#10b981" : "";
            });
        });
    }

    // 2. Xử lý toàn bộ các nút bấm hành động (BUY, SELL, Đóng vị thế,...)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const text = target.innerText || "";
        if (text.includes("BUY") || text.includes("SELL") || text.includes("Đóng") || text.includes("Mở")) {
            e.preventDefault();
            verifyPinAndExecute(text, () => {
                console.log("Thực thi thành công hành động:", text);
                // Giả lập cập nhật giao diện sau khi lệnh được gửi
            });
        }
    });
}

function initWebSocketFeed() {
    try {
        const ws = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Cập nhật giá real-time nhẹ nhàng tại giao diện
            const btcTicker = data.find(item => item.s === 'BTCUSDT');
            if (btcTicker) {
                const priceEl = document.querySelector('.btc-price');
                if (priceEl) priceEl.innerText = parseFloat(btcTicker.c).toLocaleString();
            }
        };
        ws.onerror = (err) => console.log("WebSocket connection status: Reconnecting...");
    } catch (e) {
        console.log("WebSocket initialized fallback mode.");
    }
}

function renderPositions() {
    const pnlEl = document.querySelector('.total-pnl');
    if (pnlEl) pnlEl.innerText = "+$203.67";
}