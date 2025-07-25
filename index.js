const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const storage = require('node-persist');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const agents = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

const TELEGRAM_TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
const GF_USERNAME = 'Ali22';
const GF_PASSWORD = '8b903f9496ac65e';
const GF_FORM_ID = 1;
const GF_API_URL = `https://pestehiran.shop/wp-json/gf/v2/forms/${GF_FORM_ID}/submissions`;

(async () => {
  await storage.init();
})();

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

async function getAgentByChatId(chatId) {
  return await storage.getItem(`agent_${chatId}`);
}

async function setAgentForChatId(chatId, phone, name) {
  await storage.setItem(`agent_${chatId}`, { phone, name });
}

app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();

    let agent = await getAgentByChatId(chatId);

    if (!agent) {
      if (/^09\d{9}$/.test(text)) {
        const agentName = agents[text];
        if (agentName) {
          await setAgentForChatId(chatId, text, agentName);
          await sendMessage(chatId, `✅ خوش آمدید ${agentName}!\nلطفاً شماره مشتری را وارد کنید.`);
        } else {
          await sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
        }
      } else {
        await sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثل 09123456789) ارسال کنید.');
      }
      return res.sendStatus(200);
    }

    if (/^09\d{9}$/.test(text)) {
      const postData = {
        input_values: {
          '5': text,
          '6': agent.name
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
