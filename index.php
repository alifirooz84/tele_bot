<?php
// نمایش خطاها
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// توکن ربات
$token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

// آدرس سایت شما و اطلاعات فرم
$site_url = 'https://pestehiran.shop';
$form_id = 1; // آی‌دی فرم گرویتی فرم
$field_id = 5; // آی‌دی فیلد شماره تماس

// گرفتن داده ورودی از تلگرام
$rawData = file_get_contents('php://input');
file_put_contents("log.txt", date("Y-m-d H:i:s") . " RAW INPUT: " . $rawData . "\n", FILE_APPEND);

$update = json_decode($rawData, true);
file_put_contents("log.txt", date("Y-m-d H:i:s") . " DECODED INPUT: " . print_r($update, true) . "\n", FILE_APPEND);

// بررسی پیام
if (isset($update['message']['text'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'];

    if ($text === '/start') {
        sendMessage($chat_id, "سلام! لطفا شماره تماس خود را وارد کنید.");
    } else {
        // ارسال به Gravity Forms API
        $response = sendToGravityForm($text);

        if ($response === true) {
            sendMessage($chat_id, "شماره شما با موفقیت ثبت شد ✅");
        } else {
            sendMessage($chat_id, "❌ ثبت ناموفق بود. لطفاً بعداً تلاش کنید.");
        }
    }
}

function sendMessage($chat_id, $text) {
    global $token;
    $url = "https://api.telegram.org/bot$token/sendMessage";
    $post = [
        'chat_id' => $chat_id,
        'text' => $text
    ];
    file_get_contents($url . "?" . http_build_query($post));
}

function sendToGravityForm($customer_number) {
    global $site_url, $form_id, $field_id;

    $endpoint = "$site_url/wp-json/gf/v2/forms/$form_id/submissions";

    // احراز هویت با Basic Auth یا Application Password
    $username = 'Ali22';
    $app_password = 'ONr1 sRN6 aj16 2gHJ p2qu jzqZ';

    $auth = base64_encode("$username:$app_password");

    $data = [
        'input_' . $field_id => $customer_number
    ];

    $options = [
        'http' => [
            'header'  => [
                "Authorization: Basic $auth",
                "Content-type: application/json"
            ],
            'method'  => 'POST',
            'content' => json_encode(['inputValues' => $data])
        ]
    ];
    $context  = stream_context_create($options);
    $result = file_get_contents($endpoint, false, $context);

    if ($result === false) return false;

    $res = json_decode($result, true);
    return isset($res['is_valid']) && $res['is_valid'] === true;
}
