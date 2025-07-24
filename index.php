<?php

$token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
$form_url = 'https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions';
$form_username = 'Ali22';
$form_password = 'T6qq 3UyR 2yqc Qdab Uf6t xz3q';

// لیست کارشناسان: chat_id => [name, phone]
$agents = [
    '123456789' => ['علی فیروز', '09170324187'], // اینجا چت‌آی‌دی واقعی علی فیروز رو جایگزین کن
];

$raw = file_get_contents('php://input');
file_put_contents("log.txt", date("Y-m-d H:i:s") . " RAW INPUT: $raw\n", FILE_APPEND);
$update = json_decode($raw, true);

$chat_id = $update['message']['chat']['id'];
$text = trim($update['message']['text'] ?? '');

file_put_contents("log.txt", date("Y-m-d H:i:s") . " CHAT_ID: $chat_id\n", FILE_APPEND);

function sendMessage($chat_id, $text) {
    global $token;
    $url = "https://api.telegram.org/bot$token/sendMessage";
    file_get_contents($url . "?chat_id=$chat_id&text=" . urlencode($text));
}

session_start();
$session_file = __DIR__ . "/sessions/$chat_id.json";
if (!is_dir(__DIR__ . "/sessions")) mkdir(__DIR__ . "/sessions");

if (!file_exists($session_file)) {
    file_put_contents($session_file, json_encode(['state' => 'start']));
}

$session = json_decode(file_get_contents($session_file), true);

// اگر کارشناس معتبر نیست، اجازه نده ادامه بده
if (!isset($agents[$chat_id])) {
    sendMessage($chat_id, "دسترسی شما مجاز نیست.");
    exit;
}

$agent_name = $agents[$chat_id][0];
$agent_phone = $agents[$chat_id][1];

switch ($session['state']) {
    case 'start':
        sendMessage($chat_id, "لطفا شماره مشتری را وارد کنید:");
        $session['state'] = 'awaiting_customer_number';
        break;

    case 'awaiting_customer_number':
        $customer_number = $text;

        // ارسال به گرویتی فرم
        $data = [
            'input_5' => $customer_number,
            'input_6' => $agent_name,
        ];

        $ch = curl_init($form_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "$form_username:$form_password");
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['input_values' => $data]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $response = curl_exec($ch);
        curl_close($ch);

        file_put_contents("log.txt", date("Y-m-d H:i:s") . " FORM RESPONSE: $response\n", FILE_APPEND);

        sendMessage($chat_id, "شماره مشتری ثبت شد: $customer_number ✅");
        $session['state'] = 'start';
        break;
}

file_put_contents($session_file, json_encode($session));
