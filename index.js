const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = "7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const GRAVITY_FORM_ENDPOINT = "https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions";
const GRAVITY_USER = "Ali22";
const GRAVITY_PASS = "5Zez ECjr EhoB fvDn PGmX jThS";

// حافظه موقت کاربران (chat_id => اطلاعات کاربر)
const users = {};

app.post("/", async (req, res) => {
  const message = req.body.message;
  if (!message || !message.chat || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();
  const user = users[chatId];

  // اگر برای اولین بار است
  if (!user) {
    users[chatId] = { step: "awaiting_self_phone" };
    await sendMessage(chatId, "👤 لطفاً شماره موبایل خودتان را وارد کنید:");
    return res.sendStatus(200);
  }

  // مرحله گرفتن شماره کارشناس
  if (user.step === "awaiting_self_phone") {
    if (/^09\d{9}$/.test(text)) {
      users[chatId] = {
        phone: text,
        fullName: `کارشناس ${chatId}`, // می‌تونی اینجا نام واقعی بگیری بعداً
        step: "awaiting_customer_number"
      };
      await sendMessage(chatId, "✅ شماره شما ثبت شد.\nاکنون لطفاً شماره مشتری را وارد کنید:");
    } else {
      await sendMessage(chatId, "❌ لطفاً شماره موبایل معتبر وارد کنید (مثل 0912XXXXXXX).");
    }
    return res.sendStatus(200);
  }

  // مرحله گرفتن شماره مشتری
  if (user.step === "awaiting_customer_number") {
    if (/^\d{8,11}$/.test(text)) {
      const customerNumber = text;
      try {
        const payload = {
          input_values: {
            "5": customerNumber,
            "6": `${user.fullName} - ${user.phone}`
          }
        };
        const auth = Buffer.from(`${GRAVITY_USER}:${GRAVITY_PASS}`).toString("base64");

        await axios.post(GRAVITY_FORM_ENDPOINT, payload, {
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json"
          }
        });

        await sendMessage(chatId, "✅ اطلاعات مشتری ثبت شد.\nشماره بعدی را وارد کنید یا /start را برای بازنشانی بزنید.");
      } catch (err) {
        console.error("خطا:", err.response?.data || err.message);
        await sendMessage(chatId, "❌ خطا در ارسال اطلاعات به فرم.");
      }
    } else {
      await sendMessage(chatId, "❌ لطفاً شماره مشتری را به‌درستی وارد کنید (مثلاً 1234567890).");
    }
    return res.sendStatus(200);
  }

  // اگر دستور /start زده شد → بازنشانی
  if (text === "/start") {
    delete users[chatId];
    await sendMessage(chatId, "🔄 ربات بازنشانی شد. لطفاً شماره خود را دوباره وارد کنید.");
    return res.sendStatus(200);
  }

  // پیام ناشناس
  await sendMessage(chatId, "❗ لطفاً فقط شماره مشتری را وارد کنید یا /start بزنید.");
  res.sendStatus(200);
});

// تابع ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

// راه‌اندازی سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ربات در حال اجرا روی پورت ${PORT}`);
});
