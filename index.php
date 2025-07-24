<?php
$rawData = file_get_contents('php://input');
$update = json_decode($rawData, true);

if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'] ?? '';

    file_put_contents('log.txt', date('Y-m-d H:i:s') . " Message from $chat_id: $text\n", FILE_APPEND);

    if ($text === '/start') {
        $reply = "سلام! ربات فعال است و پیام شما دریافت شد.";
    } else {
        $reply = "پیام دریافت شد: $text";
    }

    $botToken = '7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI';
    $url = "https://api.telegram.org/bot$botToken/sendMessage?" . http_build_query([
        'chat_id' => $chat_id,
        'text' => $reply,
    ]);
    file_get_contents($url);
}

echo "OK";
