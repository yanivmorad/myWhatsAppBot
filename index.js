const express = require('express');
const mongoose = require('mongoose'); // ייבוא Mongoose
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { handleShoppingList } = require('./shoppingList.js');
const { handleWeatherRequest } = require('./weather.js');
const fs = require('fs-extra'); // ייבוא fs-extra לניקוי התיקייה

const app = express();
const port = process.env.PORT || 3000;

// URI של MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yanivmorad10:yaniv1212@redertry.jxlau.mongodb.net/?retryWrites=true&w=majority&appName=rederTry';

// פונקציה לחיבור למסד הנתונים של MongoDB
async function connectMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

// קריאה לפונקציה של החיבור ל-MongoDB
connectMongoDB();

let qrCodeText = '';
let clientReady = false;
let client;

const allowedNumbers = ['972543514279', '972503060517'];

app.get('/', (req, res) => {
    res.send(`
      <html>
        <body>
          <h1>WhatsApp Client Status</h1>
          <div id="status"></div>
          <div id="qrcode"></div>
          <script>
            function updateStatus() {
              fetch('/status')
                .then(response => response.json())
                .then(data => {
                  if (data.ready) {
                    document.getElementById('status').innerHTML = 'WhatsApp client is ready and connected!';
                    document.getElementById('qrcode').innerHTML = '';
                  } else if (data.qrCode) {
                    document.getElementById('status').innerHTML = 'Scan this QR code with your WhatsApp app to log in.';
                    document.getElementById('qrcode').innerHTML = '<img src="/qr-code" alt="QR Code" />';
                  } else {
                    document.getElementById('status').innerHTML = 'Initializing WhatsApp client. Please wait...';
                    document.getElementById('qrcode').innerHTML = '';
                  }
                });
            }
            setInterval(updateStatus, 5000);
            updateStatus();
          </script>
        </body>
      </html>
    `);
  });
  
  app.get('/status', (req, res) => {
    res.json({
      ready: clientReady,
      qrCode: !!qrCodeText
    });
  });
  
  app.get('/qr-code', (req, res) => {
    if (qrCodeText) {
      res.type('png').send(Buffer.from(qrCodeText.split(',')[1], 'base64'));
    } else {
      res.status(404).send('QR code not available');
    }
  });

app.get('/status', (req, res) => {
  res.send(clientReady ? 'ready' : 'not ready');
});

function startWhatsAppClient() {
  const authPath = './.wwebjs_auth/session/Default';

  // ניקוי התיקייה לפני אתחול הקליינט
  fs.removeSync(authPath);
  console.log('Session directory cleaned.');

  client = new Client({
    puppeteer: {
      headless: true,
    //   executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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

  client.on('qr', async (qr) => {
    qrCodeText = await qrcode.toDataURL(qr); // יצירת תמונת QR
    console.log('New QR code generated');
  });

  client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    clientReady = true;
    client.sendMessage('972543514279@c.us', 'הבוט מוכן');
  });

  client.on('authenticated', (session) => {
    console.log('WhatsApp client authenticated successfully!');
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    if (reason === 'LOGOUT') {
      console.log('Attempting to reinitialize the client...');
      startWhatsAppClient(); // אתחול מחדש במצב של logout
    }
  });

  client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
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
