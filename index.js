const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const qs = require('querystring');

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const FORM_URL = 'https://pestehiran.shop/327-2/';

// لیست کارشناسان فروش: شماره موبایل => نام
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

// نگهداری چت‌آیدی‌ها به شماره و نام کارشناس
const chatMap = {};

// تابع ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// مسیر دریافت پیام‌های تلگرام
app.post('/', async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();

  // مرحله اول: گرفتن شماره موبایل کارشناس
  if (!chatMap[chatId]) {
    if (/^09\d{9}$/.test(text)) {
      if (agents[text]) {
        chatMap[chatId] = { phone: text, name: agents[text] };
        await sendMessage(chatId, `✅ خوش آمدید ${agents[text]}!\nلطفاً شماره مشتری را وارد کنید.`);
      } else {
        await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
      }
    } else {
      await sendMessage(chatId, '👋 لطفاً شماره موبایل خود را کامل (مثل 09123456789) ارسال کنید.');
    }
    return res.sendStatus(200);
  }

  // مرحله دوم: گرفتن شماره مشتری و ارسال به گرویتی فرم
  if (/^09\d{9}$/.test(text)) {
    const { name } = chatMap[chatId];

    const formData = {
      'input_5': text,      // شماره مشتری
      'input_6': name,      // نام کارشناس
      'gform_submit': '1',
      'gform_unique_id': '',
      'state_1': '',
      'gform_target_page_number_1': '0',
      'gform_source_page_number_1': '1',
      'gform_field_values': ''
    };

    try {
      const response = await fetch(FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: qs.stringify(formData)
      });

      if (response.ok) {
        await sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
      } else {
        await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
      }
    } catch (error) {
      await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
    }

  } else {
    await sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل وارد کنید.');
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
