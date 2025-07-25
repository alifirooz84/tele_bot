import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs/promises';
import fetch from 'node-fetch';

// ====== تنظیمات ======
const TOKEN = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';  
const GRAVITY_API_URL = 'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions';  // <<< آدرس API گرویتی فرمت رو بذار
const GRAVITY_API_USER = 'ck_c41df7e26cdcfcf53c467b77a62b13e91f4343fc';  // <<< نام کاربری API گرویتی فرم
const GRAVITY_API_PASS = 'cs_539bbe6f6d5e524b984d4a658d1d698c75574295';  // <<< رمز API گرویتی فرم

const STORAGE_FILE = './users.json'; // فایل ذخیره اطلاعات کارشناس

// ====== بارگذاری حافظه ======
async function loadUsers() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {}; // اگر فایل نبود یا خطا بود، دیکشنری خالی برگردان
  }
}

// ====== ذخیره حافظه ======
async function saveUsers(users) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(users, null, 2));
}

// ====== ربات ======
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();
  const text = msg.text?.trim();
  if (!text) return;

  // بارگذاری کاربران ذخیره شده
  const users = await loadUsers();

  // بررسی وجود کارشناس در حافظه
  if (!users[chatId]) {
    // اگر شماره کارشناس ذخیره نشده، از کاربر شماره بگیر
    if (!/^\+?\d{10,15}$/.test(text)) {
      bot.sendMessage(chatId, 'لطفا شماره تماس کارشناس را به صورت صحیح وارد کنید (مثلا 09123456789).');
      return;
    }

    // ذخیره شماره کارشناس
    users[chatId] = { salesPhone: text };
    await saveUsers(users);
    bot.sendMessage(chatId, `شماره کارشناس ثبت شد: ${text}\nحالا شماره مشتری را ارسال کنید.`);
    return;
  }

  // اگر شماره کارشناس ذخیره است اما شماره مشتری هنوز نگرفته‌ایم
  if (!users[chatId].customerPhone) {
    // اعتبارسنجی شماره مشتری
    if (!/^\+?\d{10,15}$/.test(text)) {
      bot.sendMessage(chatId, 'لطفا شماره مشتری را به صورت صحیح وارد کنید.');
      return;
    }

    // ذخیره شماره مشتری
    users[chatId].customerPhone = text;
    await saveUsers(users);

    // ارسال داده‌ها به گرویتی فرم
    const bodyData = {
      input_values: {
        5: users[chatId].customerPhone,  // شماره مشتری - id فیلد شماره مشتری
        6: users[chatId].salesPhone      // شماره کارشناس - id فیلد نام کارشناس
      }
    };

    try {
      const res = await fetch(GRAVITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(GRAVITY_API_USER + ':' + GRAVITY_API_PASS).toString('base64')
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        bot.sendMessage(chatId, '✅ اطلاعات با موفقیت ثبت شد.');
      } else {
        const errorData = await res.json();
        bot.sendMessage(chatId, `❌ خطا در ارسال اطلاعات به فرم:\n${JSON.stringify(errorData)}`);
      }
    } catch (e) {
      bot.sendMessage(chatId, `❌ خطا در ارسال درخواست: ${e.message}`);
    }

    // حذف شماره مشتری برای ثبت مجدد (اختیاری)
    delete users[chatId].customerPhone;
    await saveUsers(users);

    return;
  }

  // اگر همه اطلاعات ثبت شده بود و پیام اضافی آمد، به کاربر راهنمایی بده
  bot.sendMessage(chatId, 'برای ثبت سفارش شماره مشتری را ارسال کنید.');
});
