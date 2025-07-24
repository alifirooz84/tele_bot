const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// --- اطلاعات کارشناسان ---
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی',
};

// نگهداری وضعیت کاربران (chat_id => { phone, name, step })
const users = {};

// --- اطلاعات گرویتی فرم ---
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = '5Zez ECjr EhoB fvDn PGmX jThS';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

// --- توکن تلگرام ---
const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Error sending message:', data);
    }
  } catch (err) {
    console.error('sendMessage error:', err);
  }
}

// دریافت پیام‌ها از تلگرام
app.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.message || !body.message.text) {
      return res.sendStatus(200);
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();

    // لاگ پیام دریافتی
    console.log(`Received message from ${chatId}: ${text}`);

    // اگر کاربر جدید است یا مرحله ندارد، مرحله اول: گرفتن شماره کارشناس
    if (!users[chatId] || users[chatId].step === 'start') {
      if (/^09\d{9}$/.test(text)) {
        if (agents[text]) {
          users[chatId] = {
            phone: text,
            name: agents[text],
            step: 'waiting_customer_phone',
          };
          await sendMessage(chatId, `✅ خوش آمدید ${agents[text]}!\nلطفاً شماره مشتری را وارد کنید.`);
        } else {
          await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست. لطفاً شماره معتبر ارسال کنید.');
        }
      } else {
        await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثل 09123456789) ارسال کنید.');
      }
      return res.sendStatus(200);
    }

    // اگر مرحله بعدی، یعنی گرفتن شماره مشتری است
    if (users[chatId].step === 'waiting_customer_phone') {
      if (/^09\d{9}$/.test(text)) {
        const expertName = users[chatId].name;

        // ساخت داده‌ها برای ارسال به گرویتی فرم
        const submissionData = {
          input_values: {
            5: text,      // شماره مشتری (ID فیلد 5)
            6: expertName // نام کارشناس (ID فیلد 6)
          }
        };

        // ارسال درخواست به گرویتی فرم
        const response = await fetch(GF_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${GF_USERNAME}:${GF_PASSWORD}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          await sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد. ممنون از شما!');
          // پاک کردن وضعیت کاربر بعد از موفقیت
          delete users[chatId];
        } else {
          const errorText = await response.text();
          console.error('GF API error:', errorText);
          await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم. لطفاً دوباره تلاش کنید.');
        }
      } else {
        await sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل و صحیح وارد کنید.');
      }
      return res.sendStatus(200);
    }

    // اگر مرحله تعریف نشده بود، پیام راهنمایی
    await sendMessage(chatId, '❓ لطفاً شماره کارشناس خود را ارسال کنید.');

    return res.sendStatus(200);

  } catch (error) {
    console.error('Error in webhook handler:', error);
    res.sendStatus(500);
  }
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
