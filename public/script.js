let isSending = false;
let intervalId;
const socket = io();
const qrContainer = document.getElementById('qr-container');
const appContainer = document.getElementById('app-container');

socket.on('qr', (qr) => {
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
});

socket.on('authenticated', () => {
    qrContainer.style.display = 'none';
    appContainer.style.display = 'block';
});

socket.on('ready', () => {
    qrContainer.style.display = 'none';
    appContainer.style.display = 'block';
});

document.getElementById('send').addEventListener('click', () => {
    if (!isSending) {
        isSending = true;
        sendMessages();
    }
});

document.getElementById('stop').addEventListener('click', () => {
    const stopButton = document.getElementById('stop');
    if (isSending) {
        clearInterval(intervalId);
        isSending = false;
        stopButton.textContent = 'Continuar';
        stopButton.style.backgroundColor = '#388e3c';
    } else {
        sendMessages();
        stopButton.textContent = 'Stop';
        stopButton.style.backgroundColor = '#cf6679';
    }
});

function sendMessages() {
    const numbers = document.getElementById('numbers').value.split('\n');
    const interval = parseInt(document.getElementById('interval').value) * 1000;
    const message = document.getElementById('message').value;

    let index = 0;

    intervalId = setInterval(() => {
        if (index < numbers.length) {
            const number = numbers[index].trim();
            if (isValidNumber(number)) {
                sendMessage(number, message);
                document.getElementById('status').textContent = `Enviando mensagem para: ${number}`;
            } else {
                document.getElementById('status').textContent = `Número inválido: ${number}`;
            }
            index++;
        } else {
            clearInterval(intervalId);
            isSending = false;
            document.getElementById('status').textContent = 'Envio concluído!';
        }
    }, interval);
}

function isValidNumber(number) {
    const regex = /^(55)\d{11}$/;
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
      .then(data => console.log(data))
      .catch(error => console.error('Erro:', error));
}
