const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// لیست کارشناسان با شماره و نام
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

// نگهداری وضعیت چت‌آیدی به اطلاعات کارشناس
const chatMap = {};

// توکن تلگرام و اطلاعات گرویتی فرم
const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = '5Zez ECjr EhoB fvDn PGmX jThS';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

// تابع ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!res.ok) {
      console.error(`Error sending message: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error('Exception in sendMessage:', error);
  }
}

// تابع تاخیر برای جلوگیری از محدودیت ارسال پیام (مثلا خطای 429)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/', async (req, res) => {
  console.log('Received update:', JSON.stringify(req.body, null, 2));
  
  const message = req.body.message;
  if (!message || !message.text) {
    return res.sendStatus(200);
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  try {
    // مرحله ثبت کارشناس
    if (!chatMap[chatId]) {
      if (/^09\d{9}$/.test(text)) {
        const agentName = agents[text];
        if (agentName) {
          chatMap[chatId] = { phone: text, name: agentName };
          await sendMessage(chatId, `✅ خوش آمدید ${agentName}!\nلطفاً شماره مشتری را وارد کنید.`);
          await sleep(1000);
        } else {
          await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
          await sleep(1000);
        }
      } else {
        await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثلاً 09123456789) ارسال کنید.');
        await sleep(1000);
      }
      return res.sendStatus(200);
    }

    // مرحله دریافت شماره مشتری و ارسال به گرویتی فرم
    if (/^09\d{9}$/.test(text)) {
      const { name } = chatMap[chatId];
      console.log(`شماره مشتری دریافت شد: ${text} - ارسال به گرویتی فرم برای کارشناس: ${name}`);

      const gfResponse = await fetch(GF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${GF_USERNAME}:${GF_PASSWORD}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_values: {
            '5': text,   // شماره مشتری
            '6': name    // نام کارشناس
          }
        })
      });

      if (gfResponse.ok) {
        await sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
        await sleep(1000);
      } else {
        const errorText = await gfResponse.text();
        console.error('خطا در ارسال به گرویتی فرم:', errorText);
        await sendMessage(chatId, `❌ خطا در ارسال اطلاعات به فرم:\n${errorText}`);
        await sleep(1000);
      }
    } else {
      await sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل وارد کنید.');
      await sleep(1000);
    }
  } catch (error) {
    console.error('خطا در پردازش پیام:', error);
    await sendMessage(chatId, '⚠️ خطایی رخ داد، لطفاً دوباره تلاش کنید.');
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
