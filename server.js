/**
 * server.js — WebSocket Server Module cho Electron
 * Được import bởi main.js, không chạy standalone
 */

'use strict';

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

class TrackerServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.roomPassword = options.roomPassword || 'pubg2024';
        this.roomCode = this._generateRoomCode(this.roomPassword);
        this.onStatusChange = options.onStatusChange || (() => {});

        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: { origin: '*' },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        this.connectedClients = { pc: 0, mobile: 0 };
        this._setupRoutes();
        this._setupWebSocket();
    }

    _generateRoomCode(password) {
        return crypto
            .createHash('md5')
            .update(password)
            .digest('hex')
            .substring(0, 6)
            .toUpperCase();
    }

    getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    getConnectionURL() {
        const ip = this.getLocalIP();
        return `http://${ip}:${this.port}?room=${this.roomCode}`;
    }

    _setupRoutes() {
        // Serve mobile PWA files
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'mobile_ui.html'));
        });
    }

    _setupWebSocket() {
        this.io.on('connection', (socket) => {
            const roomCode = socket.handshake.query.room;
            const clientType = socket.handshake.query.type || 'unknown';

            // Xác thực Room Code
            if (roomCode !== this.roomCode) {
                socket.emit('auth_error', { message: 'Mã phòng không đúng!' });
                socket.disconnect();
                return;
            }

            socket.join(this.roomCode);

            if (clientType === 'mobile') this.connectedClients.mobile++;

            console.log(`[+] ${clientType} kết nối — Room: ${this.roomCode}`);
            this.onStatusChange({
                event: 'client_connected',
                clientType,
                clients: { ...this.connectedClients }
            });

            // Nhận dữ liệu distance từ main process và broadcast
            socket.on('update_distance', (data) => {
                socket.to(this.roomCode).emit('distance_update', data);
            });

            socket.on('disconnect', () => {
                if (clientType === 'mobile') {
                    this.connectedClients.mobile = Math.max(0, this.connectedClients.mobile - 1);
                }
                console.log(`[-] ${clientType} ngắt kết nối`);
                this.onStatusChange({
                    event: 'client_disconnected',
                    clientType,
                    clients: { ...this.connectedClients }
                });
            });
        });
    }

    /**
     * Broadcast distance data tới tất cả mobile clients
     */
    broadcastDistance(data) {
        this.io.to(this.roomCode).emit('distance_update', data);
    }

    /**
     * Khởi động server
     * @returns {Promise<void>}
     */
    start() {
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.port, '0.0.0.0', () => {
                console.log(`[Server] Đang chạy tại port ${this.port}`);
                console.log(`[Server] Room Code: ${this.roomCode}`);
                console.log(`[Server] URL: ${this.getConnectionURL()}`);
                resolve();
            }).on('error', reject);
        });
    }

    stop() {
        return new Promise((resolve) => {
            this.io.close();
            this.httpServer.close(resolve);
        });
    }
}

module.exports = TrackerServer;
