let isSending = false;
let intervalId;
const socket = io();
const qrContainer = document.getElementById('qr-container');
const appContainer = document.getElementById('app-container');

console.log('Conectando ao servidor via Socket.IO...');

socket.on('connect', () => {
    console.log('Conectado ao servidor via Socket.IO');
});

socket.on('disconnect', () => {
    console.log('Desconectado do servidor');
});

socket.on('qr', (qr) => {
    console.log('QR Code recebido, exibindo...');
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
        text: qr,
        width: 256,
        height: 256,
        colorDark : "#ffffff",
        colorLight : "#333333",
        correctLevel : QRCode.CorrectLevel.H
    });
    qrContainer.style.display = 'block';
    appContainer.style.display = 'none';
    console.log('QR Code exibido');
});

socket.on('authenticated', () => {
    qrContainer.style.display = 'none';
    appContainer.style.display = 'block';
    console.log('Usuário autenticado');
});

socket.on('ready', () => {
    qrContainer.style.display = 'none';
    appContainer.style.display = 'block';
    console.log('Cliente está pronto para enviar mensagens');
});

socket.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
});

socket.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
});

document.getElementById('send').addEventListener('click', () => {
    if (!isSending) {
        isSending = true;
        sendMessages();
        console.log('Iniciando envio de mensagens');
    }
});

document.getElementById('stop').addEventListener('click', () => {
    const stopButton = document.getElementById('stop');
    if (isSending) {
        clearInterval(intervalId);
        isSending = false;
        stopButton.textContent = 'Continuar';
        stopButton.style.backgroundColor = '#388e3c';
        console.log('Envio de mensagens pausado');
    } else {
        sendMessages();
        stopButton.textContent = 'Stop';
        stopButton.style.backgroundColor = '#cf6679';
        console.log('Envio de mensagens retomado');
    }
});

function sendMessages() {
    let numbers = document.getElementById('numbers').value.split('\n').map(n => n.trim());
    const interval = parseInt(document.getElementById('interval').value) * 1000;
    const message = document.getElementById('message').value;

    let index = 0;

    intervalId = setInterval(() => {
        if (index < numbers.length) {
            let number = numbers[index];
            console.log(`Processando número: ${number}`);

            // Adicionar DDI 55 se estiver ausente
            if (!number.startsWith('55')) {
                number = '55' + number;
                console.log(`Adicionado DDI 55: ${number}`);
            }

            // Remover o 9 para números de Goiás
            if (isFromGoias(number)) {
                number = number.slice(0, 4) + number.slice(5);
                console.log(`Removido 9 do número de Goiás: ${number}`);
            }

            if (isValidNumber(number)) {
                sendMessage(number, message);
                document.getElementById('status').textContent = `Enviando mensagem para: ${number}`;
                console.log(`Enviando mensagem para: ${number}`);
                numbers = numbers.filter((_, i) => i !== index); // Remover número da lista
                document.getElementById('numbers').value = numbers.join('\n');
            } else {
                document.getElementById('status').textContent = `Número inválido: ${number}`;
                console.log(`Número inválido: ${number}`);
            }
        } else {
            clearInterval(intervalId);
            isSending = false;
            document.getElementById('status').textContent = 'Envio concluído!';
            console.log('Envio concluído');
        }
    }, interval);
}

function isFromGoias(number) {
    const goiasPrefixes = ['5562', '5564']; // Prefixos de DDDs de Goiás
    return goiasPrefixes.some(prefix => number.startsWith(prefix));
}

function isValidNumber(number) {
    const regex = /^(55)\d{10,11}$/; // Aceitar números com 10 ou 11 dígitos após o DDI 55
    return regex.test(number);
}

function sendMessage(number, message) {
    fetch('/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            number: number,
            message: message,
            imageUrl: '/image.jpeg'
        })
    }).then(response => response.json())
      .then(data => {
          console.log(`Resposta do servidor: ${JSON.stringify(data)}`);
      })
      .catch(error => console.error('Erro:', error));
}
