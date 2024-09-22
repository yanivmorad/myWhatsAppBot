const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
 const { handleShoppingList } = require('./shoppingList.js');
 const { handleWeatherRequest } = require('./weather.js');



const client = new Client({
    authStrategy: new LocalAuth()
});

const allowedNumbers = ['972543514279','972503060517'];

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    client.sendMessage('972543514279@c.us', 'הבוט מוכן');
});



client.on('message_create', async (message) => {
    const chat = await message.getChat();
    const contactNumber = chat.id.user;
    console.log(message.body);
    
    // Check if the message is from an allowed number or sent by yourself
    const isFromAllowedNumber = message.fromMe && message.to === '972543514279@c.us' ||allowedNumbers.includes(contactNumber);

    if (isFromAllowedNumber) {
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
            await handleWeatherRequest(message); // קריאה לפונקציית מזג האוויר
        }
    }
});

client.initialize();