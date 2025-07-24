const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

const bot = new TelegramBot(token, { polling: true });

const experts = {
  '09170324187': 'علی فیروز',
  '09135197039': 'علی رضایی'
};

const userState = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  if (!userState[chatId]) {
    if (/^09\d{9}$/.test(text)) {
      if (experts[text]) {
        userState[chatId] = { expertPhone: text, step: 'waiting_for_customer' };
        await bot.sendMessage(chatId, `✅ خوش آمدید ${experts[text]}!\nلطفاً شماره مشتری را ارسال کنید.`);
      } else {
        await bot.sendMessage(chatId, '❌ شماره شما در لیست کارشناسان نیست.');
      }
    } else {
      await bot.sendMessage(chatId, 'لطفاً شماره موبایل خود را به صورت کامل ارسال کنید.');
    }
    return;
  }

  if (userState[chatId].step === 'waiting_for_customer') {
    if (/^09\d{9}$/.test(text)) {
      const expertPhone = userState[chatId].expertPhone;
      const expertName = experts[expertPhone];

      try {
        await axios.post(
          'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions',
          {
            input_values: {
              '5': text,
              '6': expertName
            }
          },
          {
            auth: {
              username: 'Ali22',
              password: '5Zez ECjr EhoB fvDn PGmX jThS'
            }
          }
        );

        await bot.sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
      } catch (error) {
        console.error(error.response?.data || error.message);
        await bot.sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم.');
      }

      delete userState[chatId];
    } else {
      await bot.sendMessage(chatId, 'لطفاً شماره مشتری را به صورت کامل وارد کنید.');
    }
  }
});

console.log('Bot is running...');
