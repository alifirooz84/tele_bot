const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const storage = require('node-persist'); // برای ذخیره دائمی

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// اطلاعات کارشناسان: شماره موبایل => نام کارشناس
const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

// توکن تلگرام و اطلاعات گرویتی فرم
const TELEGRAM_TOKEN = 'توکن_ربات_تلگرام_تو';
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = 'رمز_خصوصی_تو';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

// راه‌اندازی ذخیره‌سازی دائمی
(async () => {
  await storage.init();
})();

// ارسال پیام به تلگرام
async function sendMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// دریافت شماره کارشناس ذخیره شده برای chat_id
async function getAgentByChatId(chatId) {
  return await storage.getItem(`agent_${chatId}`);
}

// ذخیره شماره کارشناس برای chat_id
async function setAgentForChatId(chatId, phone, name) {
  await storage.setItem(`agent_${chatId}`, { phone, name });
}

// حذف اطلاعات کارشناس (در صورت نیاز)
async function removeAgent(chatId) {
  await storage.removeItem(`agent_${chatId}`);
}

app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();

    // چک کن ببین قبلا کارشناس ثبت شده برای این چت
    let agent = await getAgentByChatId(chatId);

    if (!agent) {
      // اگر شماره موبایل ارسال شده
      if (/^09\d{9}$/.test(text)) {
        const agentName = agents[text];
        if (agentName) {
          await setAgentForChatId(chatId, text, agentName);
          await sendMessage(chatId, `✅ خوش آمدید ${agentName}!\nلطفاً شماره مشتری را وارد کنید.`);
        } else {
          await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست. لطفاً شماره معتبر ارسال کنید.');
        }
      } else {
        await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثل 09123456789) ارسال کنید.');
      }
      return res.sendStatus(200);
    }

    // اگر شماره مشتری ارسال شده
    if (/^09\d{9}$/.test(text)) {
      // ارسال داده به گرویتی فرم
      const postData = {
        input_values: {
          '5': text,      // شماره مشتری (فیلد شماره 5)
          '6': agent.name // نام کارشناس (فیلد شماره 6)
        }
      };

      const gfResponse = await fetch(GF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${GF_USERNAME}:${GF_PASSWORD}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (gfResponse.ok) {
        await sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
      } else {
        const errorText = await gfResponse.text();
        console.error('Gravity Forms error:', errorText);
        await sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
      }
    } else {
      await sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل وارد کنید.');
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error in webhook:', err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
