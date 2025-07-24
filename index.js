app.post('/', async (req, res) => {
  console.log('Incoming update:', JSON.stringify(req.body));
  const message = req.body.message;
  if (!message || !message.text) {
    return res.sendStatus(200);
  }

  const chatId = message.chat.id;
  const text = message.text;

  await sendMessage(chatId, `پیام دریافت شد: ${text}`);

  res.sendStatus(200);
});
