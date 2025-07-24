<?php

$token = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';

$rawData = file_get_contents('php://input');
file_put_contents("log.txt", date("Y-m-d H:i:s") . " RAW INPUT: " . $rawData . "\n", FILE_APPEND);

$update = json_decode($rawData, true);
file_put_contents("log.txt", date("Y-m-d H:i:s") . " DECODED INPUT: " . print_r($update, true) . "\n", FILE_APPEND);

if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'] ?? '';

    if ($text === '/start') {
        sendMessage($chat_id, "سلام! لطفاً شماره تماس خود را ارسال کنید.");
    }
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
