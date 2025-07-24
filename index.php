<?php
// تنظیمات ربات و گرویتی فرم
$bot_token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
$gravity_form_url = 'https://pestehiran.shop/wp-json/gf/v2/forms/1/entries';
$app_username = 'Ali22';
$app_password = 'T6qq 3UyR 2yqc Qdab Uf6t xz3q';

// مسیر فایل ذخیره کارشناسان
$agents_file = 'agents.json';

// لیست شماره کارشناسان و اسامی‌شان
$agents_list = [
    '09170324187' => 'علی فیروز',
    '09135197039' => 'علی رضایی',
];

// خواندن داده ورودی تلگرام
$content = file_get_contents("php://input");
file_put_contents("log.txt", date("Y-m-d H:i:s") . " RAW INPUT: " . $content . "\n", FILE_APPEND);

$update = json_decode($content, true);
if (!is_array($update) || !isset($update['message']['chat']['id'])) {
    exit("no valid input");
}

$chat_id = $update['message']['chat']['id'];
$text = trim($update['message']['text'] ?? '');
$contact = $update['message']['contact'] ?? null;

// بارگذاری اطلاعات کارشناسان ذخیره شده
if (file_exists($agents_file)) {
    $agents = json_decode(file_get_contents($agents_file), true);
} else {
    $agents = [];
}

// اگر پیام /start بود، درخواست شماره بفرست
if ($text === '/start') {
    sendKeyboardRequestContact($chat_id);
    exit;
}

// اگر کارشناس شماره خودش رو فرستاد (contact)
if ($contact && isset($contact['user_id']) && $contact['user_id'] == $chat_id) {
    $phone = $contact['phone_number'];
    if (isset($agents_list[$phone])) {
        // ذخیره شماره و اسم کارشناس
        $agents[$chat_id] = [
            'phone' => $phone,
            'name' => $agents_list[$phone],
        ];
        file_put_contents($agents_file, json_encode($agents, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        sendMessage($chat_id, "شماره شما با موفقیت ثبت شد. حالا لطفا شماره مشتری را ارسال کنید.");
    } else {
        sendMessage($chat_id, "شماره شما در لیست کارشناسان موجود نیست. لطفا با پشتیبانی تماس بگیرید.");
    }
    exit;
}

// اگر کارشناس ثبت نشده بود
if (!isset($agents[$chat_id])) {
    sendMessage($chat_id, "لطفا ابتدا شماره تماس خود را ارسال کنید. برای شروع /start را ارسال کنید.");
    exit;
}

$agent_name = $agents[$chat_id]['name'] ?? 'کارشناس';
$customer_phone = $text;

// اعتبارسنجی شماره مشتری (شماره موبایل ایران)
if (!preg_match('/^09\d{9}$/', $customer_phone)) {
    sendMessage($chat_id, "لطفا شماره مشتری را به صورت صحیح وارد کنید (مثلا: 09123456789).");
    exit;
}

// آماده سازی داده برای ارسال به گرویتی فرم
$body = [
    'input_5' => $customer_phone,
    'input_6' => $agent_name,
];

// ارسال به گرویتی فرم
$response = wp_post_to_gravity_form($gravity_form_url, $app_username, $app_password, $body);

if ($response['success']) {
    sendMessage($chat_id, "✅ شماره مشتری با موفقیت ثبت شد.");
} else {
    sendMessage($chat_id, "❌ خطا در ثبت فرم:\n" . $response['error']);
}


// توابع کمکی

function sendMessage($chat_id, $text) {
    global $bot_token;
    if (!$chat_id) return;

    $url = "https://api.telegram.org/bot$bot_token/sendMessage";
    $post_fields = [
        'chat_id' => $chat_id,
        'text' => $text,
    ];
    file_get_contents($url . "?" . http_build_query($post_fields));
}

function sendKeyboardRequestContact($chat_id) {
    global $bot_token;
    $keyboard = [
        'keyboard' => [
            [['text' => '📞 ارسال شماره من', 'request_contact' => true]]
        ],
        'resize_keyboard' => true,
        'one_time_keyboard' => true,
    ];

    $data = [
        'chat_id' => $chat_id,
        'text' => "لطفا شماره تماس خود را ارسال کنید تا اجازه ثبت شماره مشتری را داشته باشید.",
        'reply_markup' => json_encode($keyboard),
    ];

    $url = "https://api.telegram.org/bot$bot_token/sendMessage?" . http_build_query($data);
    file_get_contents($url);
}

function wp_post_to_gravity_form($url, $username, $password, $fields) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $result = curl_exec($ch);
    $error = curl_error($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpcode == 200 || $httpcode == 201) {
        return ['success' => true];
    } else {
        return ['success' => false, 'error' => $error ?: $result];
    }
}
