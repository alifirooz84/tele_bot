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

// بقیه کد ...

