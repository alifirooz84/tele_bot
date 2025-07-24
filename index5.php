<?php
// دریافت اطلاعات از تلگرام
$content = file_get_contents("php://input");
$update = json_decode($content, true);

// لاگ گرفتن (اختیاری)
file_put_contents("log.txt", json_encode($update));

// توکن ربات
$bot_token = 'توکن-ربات-تو-اینجا-بذار';
$api_url = "https://api.telegram.org/bot$bot_token/";

// بررسی پیام
if (isset($update["message"])) {
    $message = $update["message"];
    $chat_id = $message["chat"]["id"];

    // اگر شماره تماس فرستاده شد
    if (isset($message["contact"])) {
        $phone = $message["contact"]["phone_number"];
        sendPhoneToWordpress($phone);
        sendMessage($chat_id, "شماره شما با موفقیت ثبت شد ✅");
    }

    // اگر /start ارسال شد
    if (isset($message["text"]) && $message["text"] === "/start") {
        sendKeyboard($chat_id);
    }
}

// ارسال شماره به وردپرس
function sendPhoneToWordpress($phone) {
    $url = 'https://pestehiran.shop/?receive-phone=1';
    $data = ['phone' => $phone];
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data),
        ]
    ];
    $context = stream_context_create($options);
    file_get_contents($url, false, $context);
}

// ارسال پیام ساده (بدون کیبورد)
function sendKeyboard($chat_id) {
    global $api_url;
    $data = [
        'chat_id' => $chat_id,
        'text' => "سلام! لطفاً شماره‌ات رو بفرست."
    ];
    $url = $api_url . "sendMessage?" . http_build_query($data);
    file_get_contents($url);
}

// ارسال پیام معمولی
function sendMessage($chat_id, $text) {
    global $api_url;
    file_get_contents($api_url . "sendMessage?chat_id=$chat_id&text=" . urlencode($text));
}
