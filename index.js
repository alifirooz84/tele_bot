const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// اطلاعات کارشناسان
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

// ذخیره مپ چت‌آیدی به شماره کارشناس
const chatMap = {}; // { chat_id: { phone: '0917...', name: 'علی فیروز' } }

const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = '5Zez ECjr EhoB fvDn PGmX jThS';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

// ارسال پیام به تلگرام
function sendMessage(chatId, text) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// مدیریت پیام‌های ورودی
app.post('/', async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();

  // اگر هنوز کارشناس ثبت‌نام نکرده
  if (!chatMap[chatId]) {
    if (/^09\d{9}$/.test(text)) {
      // شماره موبایل فرستاده شده
      const agentName = agents[text];
      if (agentName) {
        chatMap[chatId] = { phone: text, name: agentName };
        await sendMessage(chatId, `✅ خوش آمدید ${agentName}!\nلطفاً شماره مشتری را وارد کنید.`);
      } else {
        await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
      }
    } else {
      await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثل 09123456789) ارسال کنید.');
    }
    return res.sendStatus(200);
  }

  // اگر شماره مشتری فرستاده شده
  if (/^09\d{9}$/.test(text)) {
    const { name } = chatMap[chatId];

    // ارسال به گرویتی فرم با فرمت درست
    const gfResponse = await fetch(GF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${GF_USERNAME}:${GF_PASSWORD}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_values: {
          '5': text, // شماره مشتری
          '6': name  // نام کارشناس
        }
      })
    });

    if (gfResponse.ok) {
      await sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
    } else {
      const errorText = await gfResponse.text();
      console.error('Error from Gravity Forms API:', errorText);
      await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
    }
  } else {
    await sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل وارد کنید.');
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
