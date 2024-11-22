# node-telegram-questionnaire
## Questionnaire

Questionnaire — это класс для бота, построенного на основе библиотеки node-telegram-bot-api. Он управляет многошаговым опросником, поддерживая различные типы ввода, такие как текст, кнопки и загрузка фотографий. Каждый экран представляет шаг опросника, позволяя пользователям взаимодействовать с ботом и сохранять их ответы.

---

## **Особенности**
- Поддержка динамического управления экранами различных типов (`boolean`, `one_choice`, `integer`, `photo`).
- Сохранение ответов пользователей и навигация между экранами.
- Обработка текстовых сообщений, callback-запросов и фотографий.
- Хранение данных с использованием Redis для управления сессиями.

---

## **Установка**

1. **Склонируйте репозиторий:**
   ```bash
   git clone [<repository-url>](https://github.com/R3ady2Code/node-telegram-questionnaire)
   cd node-telegram-questionnaire
2. **Установите зависимости:**
   ```bash
   npm install
3. **Настройте Redis:**
   Убедитесь, что Redis установлен и запущен.

## **Инициализация**
```javascript
const TelegramBot = require("node-telegram-bot-api");
const Questionnaire = require("./Questionnaire");

// Инициализация бота
const bot = new TelegramBot("YOUR_BOT_TOKEN", { polling: true });

// Определение экранов
const screens = [
    {
        id: "screen1",
        type: "boolean",
        query: "Вам нравится наш сервис?",
        buttons: [
            { text: "Да" },
            { text: "Нет" }
        ],
        field: "likes_service",
        expected_response: "boolean"
    },
    {
        id: "screen2",
        type: "integer",
        query: "Сколько вам лет?",
        field: "age",
        expected_response: "integer"
    }
];

// Инициализация опроса
const questionnaire = new Questionnaire(bot, screens);

// Запуск опроса
questionnaire.start();
  
