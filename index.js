const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// کارشناسان و شماره‌ها
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

// وضعیت کاربران { chat_id: { phone: '...', name: '...' } }
const chatMap = {};

// توکن ربات تلگرام (توکن خودت رو اینجا بذار)
const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// اطلاعات فرم گرویتی فرم
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = '5Zez ECjr EhoB fvDn PGmX jThS';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

// تابع ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// دریافت پیام‌ها
app.post('/', async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();

  // اگر کاربر هنوز شماره کارشناس را ثبت نکرده
  if (!chatMap[chatId]) {
    if (/^09\d{9}$/.test(text)) {
      const agentName = agents[text];
      if (agentName) {
        chatMap[chatId] = { phone: text, name: agentName };
        await sendMessage(chatId, `✅ خوش آمدید ${agentName}!\nلطفاً شماره مشتری را وارد کنید.`);
      } else {
        await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
      }
    } else {
      await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به صورت کامل (مثل 09123456789) ارسال کنید.');
    }
    return res.sendStatus(200);
  }

  // وقتی شماره مشتری ارسال شد
  if (/^09\d{9}$/.test(text)) {
    const { name } = chatMap[chatId];

    try {
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
        await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
      }
    } catch (error) {
      console.error(error);
      await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
    }

    delete chatMap[chatId];
  } else {
    await sendMessage(chatId, '📱 لطفاً شماره مشتری را به صورت کامل وارد کنید.');
  }

  return res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
