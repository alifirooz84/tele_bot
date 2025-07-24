const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';  // توکن ربات تلگرام
const bot = new TelegramBot(token, { polling: true });

const experts = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی',
};

const userState = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  // مرحله اول: دریافت شماره کارشناس
  if (!userState[chatId]) {
    if (/^09\d{9}$/.test(text)) {
      if (experts[text]) {
        userState[chatId] = { expertPhone: text, step: 'waiting_for_customer' };
        await bot.sendMessage(chatId, `✅ خوش آمدید ${experts[text]}!\nلطفاً شماره مشتری را وارد کنید.`);
      } else {
        await bot.sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست. لطفاً شماره صحیح وارد کنید.');
      }
    } else {
      await bot.sendMessage(chatId, '👋 لطفاً شماره تماس خود را به‌صورت کامل (مثل 09123456789) ارسال کنید.');
    }
    return;
  }

  // مرحله دوم: دریافت شماره مشتری
  if (userState[chatId].step === 'waiting_for_customer') {
    if (/^09\d{9}$/.test(text)) {
      const expertPhone = userState[chatId].expertPhone;
      const expertName = experts[expertPhone];

      try {
        await axios.post(
          'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions',
          {
            input_values: {
              '5': text,      // شماره مشتری (فیلد شماره 5)
              '6': expertName // نام کارشناس (فیلد شماره 6)
            }
          },
          {
            auth: { username: 'Ali22', password: '5Zez ECjr EhoB fvDn PGmX jThS' },
          }
        );

        await bot.sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
      } catch (err) {
        console.error(err.response?.data || err.message);
        await bot.sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
      }
      userState[chatId] = null;
    } else {
      await bot.sendMessage(chatId, '📱 لطفاً شماره مشتری را به‌صورت کامل و صحیح وارد کنید.');
    }
    return;
  }
});
