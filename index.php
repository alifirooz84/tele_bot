<?php
// توکن ربات
$bot_token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// خواندن داده ورودی تلگرام
$content = file_get_contents("php://input");
$update = json_decode($content, true);

// ثبت لاگ برای دیباگ
file_put_contents("log.txt", date("Y-m-d H:i:s") . " " . json_encode($update) . "\n", FILE_APPEND);

if (!isset($update["message"])) {
    exit;
}

$message = $update["message"];
$chat_id = $message["chat"]["id"];

// اگر پیام متن هست
if (isset($message["text"])) {
    $text = $message["text"];

    if ($text == "/start") {
        sendKeyboard($chat_id);
        exit;
    }
}

// اگر شماره تماس فرستاده شده
if (isset($message["contact"])) {
    $phone = $message["contact"]["phone_number"];
    file_put_contents("log.txt", date("Y-m-d H:i:s") . " Phone received: $phone\n", FILE_APPEND);

    // اینجا می‌تونی شماره رو ذخیره کنی یا به فرم گرویتی بفرستی

    sendMessage($chat_id, "شماره شما با موفقیت ثبت شد ✅");
    exit;
}

// ارسال پیام به کاربر
function sendMessage($chat_id, $text) {
    global $bot_token;
    $url = "https://api.telegram.org/bot$bot_token/sendMessage?chat_id=$chat_id&text=" . urlencode($text);
    file_get_contents($url);
}

// ارسال کیبورد با دکمه درخواست شماره تماس
function sendKeyboard($chat_id) {
    global $bot_token;

    $keyboard = [
        "keyboard" => [
            [
                ["text" => "📞 ارسال شماره من", "request_contact" => true]
            ]
        ],
        "resize_keyboard" => true,
        "one_time_keyboard" => true
    ];

    $data = [
        'chat_id' => $chat_id,
        'text' => "لطفاً دکمه زیر را بزنید تا شماره شما ثبت شود:",
        'reply_markup' => json_encode($keyboard)
    ];

    $url = "https://api.telegram.org/bot$bot_token/sendMessage?" . http_build_query($data);
    file_get_contents($url);
}
