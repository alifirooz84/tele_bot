<?php

// توکن ربات شما
$token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// دریافت داده‌های دریافتی از webhook
$update = json_decode(file_get_contents('php://input'), true);

// ذخیره کردن لاگ در فایل log.txt
file_put_contents("log.txt", date("Y-m-d H:i:s") . " | " . print_r($update, true) . "\n", FILE_APPEND);

// بررسی اینکه آیا پیام جدیدی دریافت شده یا نه
if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'] ?? '';

    if ($text === '/start') {
        $keyboard = [
            'keyboard' => [
                [['text' => '📞 ارسال شماره تماس']]
            ],
            'resize_keyboard' => true,
            'one_time_keyboard' => true
        ];

        $reply_markup = json_encode($keyboard);

        sendMessage($chat_id, "سلام! لطفاً شماره تماس خود را با کلیک روی دکمه زیر ارسال کنید.", $reply_markup);
    }
}

// تابع ارسال پیام
function sendMessage($chat_id, $text, $reply_markup = null) {
    global $token;

    $url = "https://api.telegram.org/bot$token/sendMessage";

    $data = [
        'chat_id' => $chat_id,
        'text' => $text,
        'reply_markup' => $reply_markup
    ];

    $options = [
        'http' => [
            'header'  => "Content-Type: application/json",
            'method'  => 'POST',
            'content' => json_encode($data),
        ]
    ];

    $context = stream_context_create($options);
    file_get_contents($url, false, $context);
}

// برای تست دستی در مرورگر
if (php_sapi_name() === 'cli-server' && empty($update)) {
    echo "ربات تلگرام در حال اجراست ✅";
}
