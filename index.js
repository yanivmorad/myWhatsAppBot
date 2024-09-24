const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { handleShoppingList } = require('./shoppingList.js');
const { handleWeatherRequest } = require('./weather.js');
const fs = require('fs-extra');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const app = express();
const port = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;

// התחברות למונגו
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// שאר הקוד שלך...
let qrCodeText = '';
let clientReady = false;
let client;

const allowedNumbers = ['972543514279', '972503060517'];

// MongoDB connection (replace with your MongoDB URI)

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

async function startWhatsAppClient() {
  try {
    await mongoose.connect(MONGODB_URI);
    const store = new MongoStore({ mongoose: mongoose });

    client = new Client({
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
      authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000
      })
    });

    client.on('qr', async (qr) => {
      qrCodeText = await qrcode.toDataURL(qr);
      console.log('New QR code generated');
    });

    client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      clientReady = true;
      client.sendMessage('972543514279@c.us', 'הבוט מוכן');
    });

    client.on('authenticated', () => {
      console.log('WhatsApp client authenticated successfully!');
    });

    client.on('disconnected', async (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      clientReady = false;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      console.log('Attempting to reinitialize the client...');
      await startWhatsAppClient();
    });

    client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
    });

    client.on('message_create', async (message) => {
      try {
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
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    await client.initialize();
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    qrCodeText = 'Error: Failed to initialize WhatsApp client. Please check the logs.';
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before retrying
    await startWhatsAppClient();
  }
}

app.listen(port, () => {
  console.log(`Server running at ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`}`);
  startWhatsAppClient();
});