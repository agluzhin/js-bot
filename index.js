// Импортируем библиотеку "dotenv" для создания файла конфигурации (в нем будем хранить токен бота).
require("dotenv").config();
// Импортируем необходимые классы из библиотеки "grammY" (необходима для разработки телеграм-ботов).
const {
  Bot,
  Keyboard,
  GrammyError,
  HttpError,
  InlineKeyboard,
} = require("grammy");
// Импортируем созданные функции для поска случайного вопроса и правильного ответа из файла "utils.js".
const { getRandomQuestion, getCorrectAnswer } = require("./utils");

// Создаем объект класса "Bot" с использованием токена нашего бота.
const bot = new Bot(process.env.BOT_API_KEY);

// Добавляем обработчик команды "start".
bot.command("start", async (context) => {
  // Создаем стартовую клавиатуру с перечнем доступных тематик.
  const startKeyborad = new Keyboard()
    .text("HTML")
    .text("CSS")
    .row()
    .text("JavaScript")
    .text("React")
    .row()
    .text("Случайный вопрос")
    .resized();

  // Выводим отформатированное приветственное сообщение.
  await context.reply(
    "Привет!👋\n\nЯ - CTB bot helper. С моей помощью ты сможешь подготовиться к устным опросам по дисциплине '<b>Цифровая трансформация бизнеса</b>'.\n\nНу, а чтобы всегда быть в курсе всех <b>свежих новостей в области экономики и финансов</b> подписывайся на телеграм канал <b>перподавателя</b>: @petrshcherbachenko 📝",
    {
      parse_mode: "HTML",
    }
  );

  // Уточняем у пользователя тему вопроса, выводя клавиатуру.
  await context.reply(
    "С чего желаете начать? Выберите тему воспроса в меню 👇",
    {
      reply_markup: startKeyborad,
    }
  );
});

// Создаем слушатель сообщений (в данном случае определенных тем).
bot.hears(
  ["HTML", "CSS", "JavaScript", "React", "Случайный вопрос"],
  async (context) => {
    // Нажатие на кнопку отправляет в чат сообщение темой => получаем его и приводим к нижнему регистру.
    const topic = context.message.text.toLowerCase();
    // Распаковываем объект, получаемый после отработки нашей функции "getRandomQuestion".
    const { question, questionTopic } = getRandomQuestion(topic);

    // Объявляем переменную для хранения inline-клавитуры (для тестовых вопросов).
    let inlineKeyboard;

    // Если у вопроса есть "опции/варианты ответа", формируем клавиатуру.
    if (question.hasOptions) {
      // Присваиваем кнопкам значения, найденных по теме вариантов ответов.
      const buttonRows = question.options.map((option) => [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${questionTopic}-option`,
            isCorrect: option.isCorrect,
            questionId: question.id,
          })
        ),
      ]);

      // Передаем в переменную созданную из кнопок клавиатуру.
      inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
      // Если вопрос открытый, то добавляет только одну кнопку "Узнать ответ".
      inlineKeyboard = new InlineKeyboard().text(
        "Узнать ответ",
        JSON.stringify({
          type: questionTopic,
          questionId: question.id,
        })
      );
    }

    // Выводим пользователю клавитуру.
    await context.reply(question.text, {
      reply_markup: inlineKeyboard,
    });
  }
);

// Вызываем функцию, когда бот получает "callback data" - ответ от пользователя (при нажатии на кнопку).
bot.on("callback_query:data", async (context) => {
  // Расспаковываем полученную "callback data".
  const callbackData = JSON.parse(context.callbackQuery.data);

  // Если ключ "type" не содержит в себе приписку "option".
  if (!callbackData.type.includes("option")) {
    // Тогда получаем правильный ответ по теме и id вопроса.
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    // Возвращаем пользователю правильный ответ.
    await context.reply(answer, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    // Дожидаемся окончания обработки "callback data".
    await context.answerCallbackQuery();
    // Выходим из функции.
    return;
  }

  // В случае, когда вопрос с "опциями", мы проверяем правильность ответа.
  if (callbackData.isCorrect) {
    // Если верно - сообщаем об этом.
    await context.reply("Верно ✅");
    // Дожидаемся окончания обработки "callback data".
    await context.answerCallbackQuery();
    // Выходим из функции.
    return;
  }

  // Если ответ невереный, то получаем его исходя из темы и id вопроса.
  const answer = getCorrectAnswer(
    callbackData.type.split("-")[0],
    callbackData.questionId
  );
  // Сообщаем пользователю о том, что ответ неверный и выводим правильный.
  await context.reply(`Неверно ❌ Правильный ответ: ${answer}`);
  // Дожидаемся окончания обработки "callback data".
  await context.answerCallbackQuery();
});

// Отлов ошибок.
bot.catch((error) => {
  // Записываем контекст полученной ошибки.
  const context = error.context;
  // Выводим сообщение об ошибке в консоль.
  console.error(`Error while handling update ${context.update.update_id}:`);
  // Получаем объект ошибки.
  const e = error.error;

  // Проверяем объект ошибки на принадлежность к используемой библиотеке.
  if (e instanceof GrammyError) {
    // В случае, если ошибка на стороне библиотеки, вывести данную информацию в консоль.
    console.error("Error in request:", e.description);
    // Проверяем объект ошбики на принадлежность к запросам "telegram api" по сетевому протоколу.
  } else if (e instanceof HttpError) {
    // В случае, если ошибка на стороне telegra, вывести данную информацию в консоль.
    console.error("Could not contact Telegram:", e);
  } else {
    // Когда ошибка не относится ни к библиотеке, ни к telegram, выводим сообщение о неизвестной ошибке.
    console.error("Unknown error:", e);
  }
});

// Запускаем бота.
bot.start();
