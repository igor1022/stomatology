const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

// Указываем токен, полученный от BotFather
const token = '7618410066:AAH3cpsnbczURoe_4EPzN0Zb-gnSPKkdfFE'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });

const dbPath = path.join(__dirname, 'database', 'appointments.db');

// Открытие базы данных SQLite
const db = new sqlite3.Database(dbPath);

// Создание таблицы для хранения данных пользователя
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    day TEXT,
    time_period TEXT,
    service TEXT
  )
`);

// Временное хранилище для данных
let userState = {};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Отправляем символ руки вниз
  bot.sendMessage(chatId, '👇').then(() => {
    // Путь к видео
    const videoPath = path.join(__dirname, 'videos', 'one_video.mp4');
    
    // Отправляем видео
    bot.sendVideo(chatId, fs.createReadStream(videoPath)).then(() => {
      // Отправляем приветственное сообщение
      const welcomeMessage = 
`Привіт! 👋🏻 
Я — чат-бот стоматології МРІЯ та я допоможу Вам! 😃

Шукаєте перевірену стоматологію для всієї родини? 
Мрієте знайти надійного стоматолога у Броварах? 
Ваша дитина категорично відмовляється лікувати зуби?

Тоді саме час записатися на прийом до наших фахівців!`;

      // Создаем кнопки
      const options = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: 'Дорослий', callback_data: 'adult' }],
            [{ text: 'Дитина', callback_data: 'child' }],
            [{ text: 'Записатись', callback_data: 'appointment' }]
          ]
        })
      };
      
      // Отправляем кнопки
      bot.sendMessage(chatId, welcomeMessage).then(() => {
        bot.sendMessage(chatId, 'Оберіть одну з опцій:', options);
      });
    });
  });
});

// Обработка нажатий на кнопки
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;

  if (data === 'adult') {
    const adultMessage = 
`Раді, що ви обрали стоматологію МРІЯ 🧡

Наші висококваліфіковані спеціалісти завжди раді бачити вас та готові зробити все, щоб ваше лікування пройшло спокійно, безболісно та ви отримали вашу посмішку мрії.

Оберіть, що вас цікавить:`;
    
    const adultOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Послуги', callback_data: 'services' }],
          [{ text: 'Лікарі', callback_data: 'doctors' }],
          [{ text: 'Вартість', callback_data: 'pricing' }],
          [{ text: 'Стерильність', callback_data: 'sterility' }],
          [{ text: 'На головну', callback_data: 'main_menu' }]
        ]
      })
    };

    bot.sendMessage(chatId, adultMessage, adultOptions);
  } else if (data === 'services') {
    const servicesMessage = 'Оберіть, будь ласка, послугу, яка вас цікавить 👇';
    const servicesOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Профілактика', callback_data: 'prophylaxis' }],
          [{ text: 'На головну', callback_data: 'main_menu' }]
        ]
      })
    };
    bot.sendMessage(chatId, servicesMessage, servicesOptions);
  } else if (data === 'prophylaxis') {
    bot.sendMessage(chatId, 'Очікуйте секунду, відкриваю...').then(() => {
      const imagePath = path.join(__dirname, 'photos', 'Profil_foto.jpg');
      bot.sendPhoto(chatId, fs.createReadStream(imagePath)).then(() => {
        const prophylaxisMessage = 
`Профілактика стоматологічних захворювань складається з двох етапів: щоденного догляду за ротовою порожниною в домашніх умовах та регулярному медичному огляді в стоматологічному кабінеті.

Регулярні відвідування стоматолога та професійна гігієна порожнини рота дозволять попередити виникнення карієсу, зубного каменю, запалення ясен.

Запишіться на профілактику вже зараз. Пам’ятайте, попередити хворобу легше, ніж її лікувати.`;

        const prophylaxisOptions = {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: 'Записатися', callback_data: 'book_appointment' }],
              [{ text: 'Обрати лікаря', callback_data: 'choose_doctor' }],
              [{ text: 'Назад', callback_data: 'services' }]
            ]
          })
        };
        bot.sendMessage(chatId, prophylaxisMessage, prophylaxisOptions);
      });
    });
  } else if (data === 'book_appointment') {
    bot.sendMessage(chatId, 'Очікуйте секунду, відкриваю форму запису...').then(() => {
      const daySelectionMessage = 'Оберіть, будь ласка, день в який вам було б зручно прийти:';
      const daySelectionOptions = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: 'Понеділок', callback_data: 'monday' }],
            [{ text: 'Вівторок', callback_data: 'tuesday' }],
            [{ text: 'Середа', callback_data: 'wednesday' }],
            [{ text: 'Четвер', callback_data: 'thursday' }],
            [{ text: 'П\'ятниця', callback_data: 'friday' }],
            [{ text: 'Субота', callback_data: 'saturday' }],
            [{ text: 'Неділя', callback_data: 'sunday' }],
            [{ text: 'На головну сторінку', callback_data: 'main_menu' }]
          ]
        })
      };
      bot.sendMessage(chatId, daySelectionMessage, daySelectionOptions);
    });
  } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(data)) {
    userState[chatId] = { day: data }; // Сохраняем выбранный день
    const timePeriodMessage = 'Оберіть в який період дня вам підібрати час:';
    const timePeriodOptions = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Ранок 09:00-12:00', callback_data: 'morning' }],
          [{ text: 'Обід 12:00-15:00', callback_data: 'afternoon' }],
          [{ text: 'Вечір 15:00-18:00', callback_data: 'evening' }],
          [{ text: 'Назад', callback_data: 'book_appointment' }]
        ]
      })
    };
    bot.sendMessage(chatId, timePeriodMessage, timePeriodOptions);
  } else if (['morning', 'afternoon', 'evening'].includes(data)) {
    userState[chatId].time_period = data; // Сохраняем выбранный период
    bot.sendMessage(chatId, 'Форма:');
    bot.sendMessage(chatId, 'Впишіть нижче Ім\'я та Прізвище👇');
    bot.once('message', (msg) => {
      userState[chatId].name = msg.text; // Сохраняем имя
      bot.sendMessage(chatId, 'Ваш контактний номер телефону, щоб адміністратор підтвердив запис, номер писати в форматі (+38…)\n👇');
      bot.once('message', (msg) => {
        userState[chatId].phone = msg.text; // Сохраняем телефон
        const confirmationMessage = 
`Ваша заявка на прийом до стоматології МРІЯ успішно сформована!

Ім'я: ${userState[chatId].name}
Телефон: ${userState[chatId].phone}
День: ${userState[chatId].day}
Період: ${userState[chatId].time_period}`;

        const paymentOptions = {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: 'Оплатити 1 грн', callback_data: 'pay_1' }],
              [{ text: 'Назад', callback_data: 'main_menu' }]
            ]
          })
        };

        bot.sendMessage(chatId, confirmationMessage, paymentOptions);
      });
    });
  } else if (data === 'pay_1') {
    // Код для интеграции с LiqPay для оплаты 1 грн
    const paymentData = {
      public_key: 'sandbox_i98055514331', // Ваш публичный ключ
      private_key: 'sandbox_nOnCnLZjf8v1WgmA3bB2iisYXlWUuGQ4f9ODRUOR', // Ваш приватный ключ
      amount: 1,
      currency: 'UAH',
      description: 'Оплата за запис до стоматології',
      order_id: 'order_' + Date.now(), // Уникальный ID заказа
      result_url: 'https://yourwebsite.com/payment-result' // URL для получения результата платежа
    };

    const signature = crypto.createHmac('sha1', paymentData.private_key)
      .update(JSON.stringify(paymentData))
      .digest('base64');
      
    // Выполните оплату через API LiqPay
    axios.post('https://sandbox.liqpay.ua/api/3/checkout', {
      ...paymentData,
      signature: signature
    })
    .then(response => {
      // Проверка успешности платежа
      if (response.data.status === 'success') {
        // Сохраняем запись в базу данных
        const { name, phone, day, time_period } = userState[chatId];
        db.run(`INSERT INTO appointments (name, phone, day, time_period, service) VALUES (?, ?, ?, ?, ?)`,
          [name, phone, day, time_period, 'Профілактика'], // Добавляем значение 'Профілактика' в столбец service
          function (err) {
            if (err) {
              console.error(err.message);
            } else {
              const successMessage = 'Ваша заявка успішно збережена! 🥳';
              bot.sendMessage(chatId, successMessage);

              // Отправка информации в канал
              const channelId = -1002331242905; // ID вашего канала
              const channelMessage = 
`📅 Нова запис до стоматології!
👤 Ім'я: ${name}
📞 Телефон: ${phone}
📆 День: ${day}
⏰ Період: ${time_period}`;
              bot.sendMessage(channelId, channelMessage);
            }
          });
      } else {
        bot.sendMessage(chatId, 'Оплата не пройшла. Спробуйте ще раз.');
      }
    })
    .catch(error => {
      console.error('Error during payment process:', error);
      bot.sendMessage(chatId, 'Сталася помилка під час обробки платежу. Спробуйте ще раз.');
    });
  } else if (data === 'main_menu') {
    bot.sendMessage(chatId, 'Повернення в головне меню...');
  }
});
