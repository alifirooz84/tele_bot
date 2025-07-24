<?php
$rawData = file_get_contents('php://input');
$update = json_decode($rawData, true);

if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $username = isset($update['message']['chat']['username']) ? $update['message']['chat']['username'] : 'ندارد';
    $first_name = isset($update['message']['chat']['first_name']) ? $update['message']['chat']['first_name'] : 'ندارد';

    $logLine = date('Y-m-d H:i:s') . " | chat_id: $chat_id | username: @$username | first_name: $first_name\n";
    file_put_contents('chat_ids.txt', $logLine, FILE_APPEND);

    // پیام خوشامدگویی ساده
    $botToken = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
    $text = "سلام! شناسه چت شما ثبت شد.\nchat_id: $chat_id";
    $url = "https://api.telegram.org/bot$botToken/sendMessage?" . http_build_query([
        'chat_id' => $chat_id,
        'text' => $text,
    ]);
    file_get_contents($url);
}
echo "OK";
