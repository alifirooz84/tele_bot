const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
const bot = new TelegramBot(TOKEN, { polling: true });

const expertsInfo = {
  '09170324187': 'علی فیروز',
  '09121234567': 'حسن محمدی',
};

const DATA_FILE = path.join(__dirname, 'users_data.json');

// تابع خواندن داده‌های ذخیره شده
function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading users data:', e);
  }
  return {};
}

// تابع ذخیره داده‌ها
function saveUsers(users) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error saving users data:', e);
  }
}

// بارگذاری اولیه
let users = loadUsers();

const GRAVITY_API_URL = 'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions';
const GRAVITY_AUTH_USER = 'ck_c41df7e26cdcfcf53c467b77a62b13e91f4343fc';
const GRAVITY_AUTH_PASS = 'cs_539bbe6f6d5e524b984d4a658d1d698c75574295';

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  if (!users[chatId]) {
    users[chatId] = { step: 'waitingExpertPhone' };
    saveUsers(users);
    bot.sendMessage(chatId, 'سلام! لطفاً شماره تلفن کارشناس خود را وارد کنید:');
    return;
  }

  const user = users[chatId];

  if (user.step === 'waitingExpertPhone') {
    if (expertsInfo[text]) {
      user.expertPhone = text;
      user.expertName = expertsInfo[text];
      user.step = 'waitingCustomerPhone';
      saveUsers(users);
      bot.sendMessage(chatId, `کارشناس شما ${user.expertName} ثبت شد. لطفاً شماره مشتری را وارد کنید:`);
    } else {
      bot.sendMessage(chatId, 'شماره کارشناس معتبر نیست. لطفاً شماره صحیح را وارد کنید:');
    }
    return;
  }

  if (user.step === 'waitingCustomerPhone') {
    const customerPhone = text;
    try {
      await axios.post(
        GRAVITY_API_URL,
        {
          input_values: {
            6: user.expertName,
            5: customerPhone,
          },
        },
        {
          auth: {
            username: GRAVITY_AUTH_USER,
            password: GRAVITY_AUTH_PASS,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      bot.sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد. می‌توانید شماره مشتری بعدی را وارد کنید:');
    } catch (error) {
      console.error('Error sending to Gravity Forms:', error.response?.data || error.message);
      bot.sendMessage(chatId, '❌ خطا در ارسال اطلاعات به فرم. لطفاً دوباره تلاش کنید.');
    }
  }
});

console.log('Bot is running...');
