<?php

// توکن ربات شما
$token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// خواندن ورودی خام
$rawData = file_get_contents('php://input');

// ثبت لاگ کامل ورودی خام
file_put_contents("log.txt", date("Y-m-d H:i:s") . " RAW INPUT: " . $rawData . "\n", FILE_APPEND);

// تبدیل به آرایه
$update = json_decode($rawData, true);

// ثبت لاگ بعد از دیکد کردن
file_put_contents("log.txt", date("Y-m-d H:i:s") . " DECODED INPUT: " . print_r($update, true) . "\n", FILE_APPEND);

if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $message = $update['message'];

    // اگر کاربر شماره تماس فرستاد
    if (isset($message['contact'])) {
        $phone = $message['contact']['phone_number'];

        sendPhoneToWordpress($phone);

        sendMessage($chat_id, "شماره شما با موفقیت ثبت شد ✅");
    }
    // اگر دستور /start بود
    elseif (isset($message['text']) && $message['text'] === '/start') {
        sendKeyboard($chat_id);
    }
}

function sendPhoneToWordpress($phone) {
    $url = 'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions';

    $api_key = 'ck_f04de6dfc97b64595bd01b7e2083858fea8748c5';
    $api_secret = 'cs_81c24009334a3f83675811b4a5453a6e75451f5f';

    $data = [
        'input_values' => [
            '5' => $phone
        ]
    ];

    $json_data = json_encode($data);

    $headers = [
        "Content-Type: application/json",
        "Authorization: Basic " . base64_encode("$api_key:$api_secret")
    ];

    $options = [
        'http' => [
            'header'  => implode("\r\n", $headers),
            'method'  => 'POST',
            'content' => $json_data,
        ]
    ];

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    file_put_contents("log.txt", date("Y-m-d H:i:s") . " API response: " . $result . "\n", FILE_APPEND);
}

function sendMessage($chat_id, $text) {
    global $token;
    $url = "https://api.telegram.org/bot$token/sendMessage";

    $data = [
        'chat_id' => $chat_id,
        'text' => $text,
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

function sendKeyboard($chat_id) {
    global $token;
    $url = "https://api.telegram.org/bot$token/sendMessage";

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
