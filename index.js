const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

app.post('/', async (req, res) => {
  console.log('Received:', JSON.stringify(req.body));
  if (req.body.message && req.body.message.text) {
    const chatId = req.body.message.chat.id;
    const text = req.body.message.text;
    await sendMessage(chatId, `پیام شما دریافت شد: ${text}`);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
