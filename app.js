const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', (qr) => {
    io.emit('qr', qr);
});

client.on('authenticated', () => {
    io.emit('authenticated');
});

client.on('ready', () => {
    io.emit('ready');
});

client.initialize();

app.use(express.static('public'));
app.use(express.json());

app.post('/send-message', (req, res) => {
    const { number, message, imageUrl } = req.body;
    const media = MessageMedia.fromFilePath(path.join(__dirname, 'public', 'image.jpeg'));

    client.sendMessage(number + '@c.us', media).then(response => {
        client.sendMessage(number + '@c.us', message).then(response => {
            res.json({ status: 'success', number, message });
        }).catch(err => {
            res.status(500).json({ status: 'error', message: err.message });
        });
    }).catch(err => {
        res.status(500).json({ status: 'error', message: err.message });
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
