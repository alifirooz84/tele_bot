<?php
// توکن ربات
$token = "7956714963:AAHnybhfhA3c0d7C1VJnXIHhbR-fkeTsXfI";

// کارشناسان با شماره و نام
$agents = [
  '09170324187' => 'علی فیروز',
  '09135197039' => 'علی رضایی',
];

// دریافت ورودی تلگرام
$content = file_get_contents("php://input");
$update = json_decode($content, true);

if (!isset($update["message"])) exit;

$chat_id = $update["message"]["chat"]["id"];
$text = trim($update["message"]["text"] ?? '');

$dataFile = "data.json";
$data = file_exists($dataFile) ? json_decode(file_get_contents($dataFile), true) : [];

// اگر هنوز کارشناس ثبت نشده
if (!isset($data[$chat_id])) {
  // اگر شماره ارسال شده در لیست کارشناسان بود
  if (array_key_exists($text, $agents)) {
    $data[$chat_id] = [
      'phone' => $text,
      'name' => $agents[$text]
    ];
    file_put_contents($dataFile, json_encode($data));
    sendMessage($chat_id, "✅ ثبت شد. لطفاً شماره مشتری را وارد کنید:");
  } else {
    sendMessage($chat_id, "لطفاً شماره تماس خود را ارسال کنید. فقط یک بار نیاز به ثبت است.");
  }
} else {
  // شماره مشتری دریافت شده
  $customer_phone = $text;
  $agent_name = $data[$chat_id]['name'];

  // ارسال به API گرویتی فرم
  $gf_response = send_to_gravity_forms($customer_phone, $agent_name);
  if ($gf_response === true) {
    sendMessage($chat_id, "✅ شماره مشتری با موفقیت ثبت شد.");
  } else {
    sendMessage($chat_id, "❌ خطا در ثبت اطلاعات: $gf_response");
  }
}

// تابع ارسال پیام تلگرام
function sendMessage($chat_id, $text) {
  global $token;
  $url = "https://api.telegram.org/bot$token/sendMessage";
  $params = [
    'chat_id' => $chat_id,
    'text' => $text,
  ];
  file_get_contents($url . '?' . http_build_query($params));
}

// تابع ارسال به گرویتی فرم
function send_to_gravity_forms($customer_phone, $agent_name) {
  $url = "https://pestehiran.shop/wp-json/gf/v2/forms/1/submissions";
  $body = [
    "input_5" => $customer_phone,
    "input_6" => $agent_name,
  ];
  $auth_user = "Ali22";
  $auth_pass = "5Zez ECjr EhoB fvDn PGmX jThS";

  $args = [
    'http' => [
      'method'  => 'POST',
      'header'  => "Authorization: Basic " . base64_encode("$auth_user:$auth_pass") . "\r\n" .
                   "Content-Type: application/json\r\n",
      'content' => json_encode(['input_values' => $body]),
    ]
  ];

  $context = stream_context_create($args);
  $result = file_get_contents($url, false, $context);

  if ($result === false) return "خطا در اتصال به فرم";
  $response = json_decode($result, true);
  return isset($response['is_valid']) && $response['is_valid'] === true ? true : json_encode($response);
}
