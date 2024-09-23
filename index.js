const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { handleShoppingList } = require('./shoppingList.js');
const { handleWeatherRequest } = require('./weather.js');
const puppeteer = require('puppeteer'); 


const app = express();
const port = process.env.PORT || 3000;

let qrCodeText = '';
let clientReady = false;
let client;

const allowedNumbers = ['972543514279', '972503060517'];

app.get('/', (req, res) => {
  if (clientReady) {
    res.send('WhatsApp client is ready and connected!');
  } else if (qrCodeText) {
    res.send(`
      <html>
        <body>
          <h1>WhatsApp QR Code</h1>
          <img src="${qrCodeText}" alt="QR Code" />
          <p>Scan this QR code with your WhatsApp app to log in.</p>
          <script>
            setInterval(() => {
              fetch('/status')
                .then(response => response.text())
                .then(status => {
                  if (status === 'ready') {
                    location.reload();
                  }
                });
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } else {
    res.send('Initializing WhatsApp client. Please refresh in a few seconds.');
  }
});

app.get('/status', (req, res) => {
  res.send(clientReady ? 'ready' : 'not ready');
});

function startWhatsAppClient() {
    const client = new Client({
        puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--disable-extensions'
            ]
        },
        authStrategy: new LocalAuth()
    });

    client.on('authenticated', (session) => {
        console.log('WhatsApp client authenticated successfully!');
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp client disconnected:', reason);
    });

    client.on('auth_failure', (msg) => {
        console.error('Authentication failed:', msg);
    });
    


    

  client.on('qr', async (qr) => {
    qrCodeText = await qrcode.toDataURL(qr); // יצירת תמונת QR
    console.log('New QR code generated');
  });

  client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    clientReady = true;
    client.sendMessage('972543514279@c.us', 'הבוט מוכן');
  });

  client.on('message_create', async (message) => {
    const chat = await message.getChat();
    const contactNumber = chat.id.user;

    if (message.fromMe && message.to === '972543514279@c.us' || allowedNumbers.includes(contactNumber)) {
      if (message.body === 'מה השעה?') {
        const now = new Date();
        await message.reply(`השעה היא: ${now.toLocaleTimeString()}`);
      } else if (message.body === 'מאמי') {
        await message.reply('מה חיימשלי היפה בנשים שאני כלכך אוהב ומעריך ואין עליה בכל העולמות');
      } else if (message.body.startsWith('תזכיר לי')) {
        await message.reply('מה להזכיר לך חיימשלי');
        await message.reply('סתם זה לא עובד עדיין אני לא יכול לזכור כלום');
      } else if (message.body.startsWith('קניות')) {
        await handleShoppingList(message);
      } else if (message.body.startsWith('מזג אוויר')) {
        await handleWeatherRequest(message);
      }
    }
  });

  client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
    qrCodeText = 'Error: Failed to initialize WhatsApp client. Please check the logs.';
  });
}

app.listen(port, () => {
    console.log(`Server running at ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}`);

  startWhatsAppClient();
});