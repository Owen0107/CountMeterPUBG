/**
 * preload.js — Electron Preload Script
 * Bridge an toàn giữa main process và renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ─── Nhận thông tin từ main process ───
    onServerReady: (callback) => ipcRenderer.on('server-ready', (_, data) => callback(data)),
    onDistanceResult: (callback) => ipcRenderer.on('distance-result', (_, data) => callback(data)),
    onClientStatus: (callback) => ipcRenderer.on('client-status', (_, data) => callback(data)),
    onCalibrateResult: (callback) => ipcRenderer.on('calibrate-result', (_, data) => callback(data)),
    onLog: (callback) => ipcRenderer.on('log', (_, msg) => callback(msg)),
    onScaleLoaded: (callback) => ipcRenderer.on('scale-loaded', (_, scale) => callback(scale)),

    // ─── Gửi lệnh tới main process ───
    updateScale: (scale) => ipcRenderer.send('update-scale', scale),

    // ─── QR Code ───
    getQRCode: (text) => ipcRenderer.invoke('get-qrcode', text),

    // ─── Window Controls ───
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    closeWindow: () => ipcRenderer.send('window-close'),
});
