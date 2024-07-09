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
    console.log('QR Code gerado, aguardando leitura...');
    io.emit('qr', qr);
});

client.on('authenticated', () => {
    console.log('Usuário autenticado');
    io.emit('authenticated');
});

client.on('ready', () => {
    console.log('Cliente está pronto');
    io.emit('ready');
});

client.on('auth_failure', msg => {
    console.error('Falha na autenticação', msg);
    io.emit('auth_failure', msg);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado', reason);
    io.emit('disconnected', reason);
});

client.initialize().catch(err => console.error('Erro ao inicializar cliente:', err));

app.use(express.static('public'));
app.use(express.json());

app.post('/send-message', (req, res) => {
    const { number, message, imageUrl } = req.body;
    const media = MessageMedia.fromFilePath(path.join(__dirname, 'public', 'image.jpeg'));

    client.sendMessage(number + '@c.us', media, { caption: message }).then(response => {
        res.json({ status: 'success', number, message });
        console.log(`Mensagem enviada para ${number}: ${message}`);
    }).catch(err => {
        res.status(500).json({ status: 'error', message: err.message });
        console.error('Erro ao enviar mensagem:', err);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
