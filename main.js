/**
 * main.js — Electron Main Process
 * 
 * Quản lý:
 * - BrowserWindow (GUI desktop)
 * - WebSocket server (chạy ngầm)
 * - Global hotkeys (Alt+Q, Alt+W, Alt+A, Alt+S, Alt+H)
 */

'use strict';

const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const TrackerServer = require('./server');

let mainWindow;
let server;
let tray = null;

// Tọa độ lưu tạm
let scaleStartPoint = null;
let playerPoint = null;
let targetPoint = null;
let currentScale = 6.0;

// Config file cho scale
function getScaleConfigPath() {
    const userDataPath = app ? app.getPath('userData') : __dirname;
    return path.join(userDataPath, 'scale_config.json');
}

function loadScale() {
    try {
        const configFile = getScaleConfigPath();
        if (fs.existsSync(configFile)) {
            const data = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
            return data.scale || 6.0;
        }
    } catch (err) {
        console.warn('[!] Lỗi đọc scale:', err.message);
    }
    return 6.0;
}

function saveScale(scale) {
    currentScale = scale;
    try {
        fs.writeFileSync(getScaleConfigPath(), JSON.stringify({
            scale: scale,
            calibrated_at: Date.now(),
            calibrated_at_readable: new Date().toLocaleString('vi-VN')
        }, null, 2));
    } catch (err) {
        console.error('[!] Lỗi lưu scale:', err.message);
    }
    return scale;
}

// ═══════════════════════════════════════
// App Lifecycle
// ═══════════════════════════════════════

app.whenReady().then(async () => {
    createWindow();
    currentScale = loadScale();
    
    // Khởi tạo System Tray (chạy ngầm)
    try {
        tray = new Tray(path.join(__dirname, 'build', 'icon.ico'));
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Hiện ứng dụng', click: () => { mainWindow.show(); mainWindow.focus(); } },
            { label: 'Thoát hoàn toàn', click: () => { app.exit(); } }
        ]);
        tray.setToolTip('Game Distance Tracker - Đang chạy ngầm');
        tray.setContextMenu(contextMenu);
        
        // Single click để ẩn/hiện nhanh
        tray.on('click', () => {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        // Double click dự phòng
        tray.on('double-click', () => {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        });
    } catch (e) {
        console.error('Không thể tải Tray icon:', e.message);
    }
    
    // Đợi server start xong
    await startServer();
    registerHotkeys();

    const sendServerData = async () => {
        // Gửi scale
        mainWindow.webContents.send('scale-loaded', currentScale);
        
        // Gửi server data (QR code, room code)
        if (server) {
            const connectionURL = server.getConnectionURL();
            const qrDataURL = await QRCode.toDataURL(connectionURL, {
                width: 200, margin: 2, color: { dark: '#f0c040', light: '#06060c' }
            });
            mainWindow.webContents.send('server-ready', {
                roomCode: server.roomCode,
                connectionURL,
                qrDataURL,
                localIP: server.getLocalIP(),
                port: server.port
            });
        }
    };

    // Kiểm tra xem trang đã load xong chưa (vì startServer tốn thời gian, có thể trang đã load xong rồi)
    if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.on('did-finish-load', sendServerData);
    } else {
        sendServerData();
    }
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (server) server.stop();
    app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// ═══════════════════════════════════════
// Window
// ═══════════════════════════════════════

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 480,
        height: 720,
        minWidth: 420,
        minHeight: 600,
        resizable: true,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#06060c',
        icon: path.join(__dirname, 'build', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    mainWindow.setMenuBarVisibility(false);

    // Dev tools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

// ═══════════════════════════════════════
// Server
// ═══════════════════════════════════════

async function startServer() {
    server = new TrackerServer({
        port: 3000,
        roomPassword: 'pubg2024',
        onStatusChange: (status) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('client-status', status);
            }
        }
    });

    try {
        await server.start();
        sendLog('✓ Server đã khởi động thành công');
        sendLog(`Room Code: ${server.roomCode}`);
    } catch (err) {
        sendLog(`✗ Lỗi khởi động server: ${err.message}`);
    }
}

// ═══════════════════════════════════════
// Hotkeys
// ═══════════════════════════════════════

function registerHotkeys() {
    // Alt+H: Ẩn/Hiện cửa sổ nhanh
    const regH = globalShortcut.register('Alt+H', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
                sendLog('App đã ẩn xuống Tray (Bấm Alt+H để hiện lại).');
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    // Alt+Q: Bắt đầu đo ô 100m
    const regQ = globalShortcut.register('Alt+Q', () => {
        scaleStartPoint = screen.getCursorScreenPoint();
        sendLog(`📐 Điểm 1 của ô 100m: (${scaleStartPoint.x}, ${scaleStartPoint.y})`);
    });

    // Alt+W: Kết thúc đo ô 100m (tính scale)
    const regW = globalShortcut.register('Alt+W', () => {
        if (!scaleStartPoint) {
            sendLog('⚠ Vui lòng bấm Alt+Q trước để chọn điểm 1!');
            return;
        }
        const scaleEndPoint = screen.getCursorScreenPoint();
        const dx = scaleEndPoint.x - scaleStartPoint.x;
        const dy = scaleEndPoint.y - scaleStartPoint.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        if (distPx < 1) {
            sendLog('⚠ Khoảng cách pixel quá nhỏ!');
            return;
        }

        // Tự động tính scale cho 100m
        const newScale = 100 / distPx;
        saveScale(newScale);
        
        sendLog(`📐 Điểm 2: (${scaleEndPoint.x}, ${scaleEndPoint.y})`);
        sendLog(`✓ Đã set tỷ lệ bản đồ: ${newScale.toFixed(4)} m/px (độ dài ${distPx.toFixed(1)} px = 100m)`);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('scale-loaded', newScale);
        }
        scaleStartPoint = null;
    });

    // Alt+A: Chọn điểm Nhân vật
    const regA = globalShortcut.register('Alt+A', () => {
        playerPoint = screen.getCursorScreenPoint();
        sendLog(`📍 Đã chọn Nhân vật: (${playerPoint.x}, ${playerPoint.y})`);
    });

    // Alt+S: Chọn điểm Mục tiêu & Tính khoảng cách
    const regS = globalShortcut.register('Alt+S', () => {
        if (!playerPoint) {
            sendLog('⚠ Vui lòng bấm Alt+A trước để chọn vị trí Nhân vật!');
            return;
        }
        targetPoint = screen.getCursorScreenPoint();
        
        const dx = targetPoint.x - playerPoint.x;
        const dy = targetPoint.y - playerPoint.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        
        const scale = currentScale;
        const distance = Math.round(distPx * scale);

        const result = {
            distance,
            player: playerPoint,
            marker: targetPoint,
            timestamp: Date.now()
        };

        sendDistanceResult(result);

        // Broadcast tới mobile clients tức thì
        if (server) {
            server.broadcastDistance(result);
        }

        sendLog(`→ Khoảng cách: ${distance}m (từ ${playerPoint.x},${playerPoint.y} đến ${targetPoint.x},${targetPoint.y})`);
    });

    if (!regQ || !regW || !regA || !regS || !regH) {
        console.warn('[!] Không thể đăng ký một số phím tắt');
    }

    console.log('[Hotkeys] Alt+H (Ẩn/Hiện), Alt+Q/W (Scale), Alt+A/S (Đo khoảng cách) đã đăng ký');
}

// ═══════════════════════════════════════
// IPC Handlers
// ═══════════════════════════════════════

ipcMain.on('update-scale', (_, scale) => {
    saveScale(scale);
    sendLog(`✓ Scale cập nhật: ${scale.toFixed(4)} m/px`);
});

ipcMain.handle('get-qrcode', async (_, text) => {
    return await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: { dark: '#f0c040', light: '#06060c' }
    });
});

// Window controls
ipcMain.on('window-minimize', () => {
    if (mainWindow) {
        mainWindow.hide(); // Ẩn xuống tray
        sendLog('App đã được thu nhỏ xuống System Tray.');
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) {
        mainWindow.hide(); // Đóng (X) cũng là ẩn xuống tray để chạy ngầm
        sendLog('App đang chạy ngầm trong System Tray.');
    }
});

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function sendLog(msg) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    const logEntry = `[${timestamp}] ${msg}`;
    console.log(logEntry);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log', logEntry);
    }
}

function sendDistanceResult(data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('distance-result', data);
    }
}
