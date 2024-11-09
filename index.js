require("dotenv").config();
const {
  Bot,
  Keyboard,
  GrammyError,
  HttpError,
  InlineKeyboard,
} = require("grammy");
const { getRandomQuestion, getCorrectAnswer } = require("./utils");

const bot = new Bot(process.env.BOT_API_KEY);

// Добавляем обработчик команды "start".
bot.command("start", async (context) => {
  const startKeyborad = new Keyboard()
    .text("Transformation")
    .text("Technologies")
    .row()
    .text("Random question")
    .resized();

  await context.reply(
    "Привет!👋\n\nЯ - CTB bot helper. С моей помощью ты сможешь подготовиться к устным опросам по дисциплине '<b>Цифровая трансформация бизнеса</b>'.\n\nНу, а чтобы всегда быть в курсе всех <b>свежих новостей в области экономики и финансов</b> подписывайся на телеграм канал <b>перподавателя</b>: @petrshcherbachenko 📝",
    {
      parse_mode: "HTML",
    }
  );

  await context.reply(
    "С чего желаете начать? Выберите тему воспроса в меню 👇",
    {
      reply_markup: startKeyborad,
    }
  );
});

bot.hears(
  ["Transformation", "Technologies", "Random question"],
  async (context) => {
    const topic = context.message.text.toLowerCase();
    const { question, questionTopic } = getRandomQuestion(topic);

    let inlineKeyboard;

    if (question.hasOptions) {
      const buttonRows = question.options.map((option) => [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${questionTopic}-op`,
            isCorrect: option.isCorrect,
            questionId: question.id,
          })
        ),
      ]);

      inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
      inlineKeyboard = new InlineKeyboard().text(
        "Узнать ответ",
        JSON.stringify({
          type: questionTopic,
          questionId: question.id,
        })
      );
    }

    await context.reply(question.text, {
      reply_markup: inlineKeyboard,
    });
  }
);

bot.on("callback_query:data", async (context) => {
  try {
    const callbackData = JSON.parse(context.callbackQuery.data);

    if (!callbackData.type.includes("op")) {
      const answer = getCorrectAnswer(
        callbackData.type,
        callbackData.questionId
      );
      await context.reply(answer, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      await context.answerCallbackQuery();
      return;
    } else if (callbackData.isCorrect) {
      await context.reply("Верно ✅");
      await context.answerCallbackQuery();
      return;
    } else {
      const answer = getCorrectAnswer(
        callbackData.type.split("-")[0],
        callbackData.questionId
      );
      await context.reply(`Неверно ❌ Правильный ответ: ${answer}`);
      await context.answerCallbackQuery();
    }
  } catch (error) {
    console.error("Ошибка при обработке callback_query:data", error);
    await context.reply("Произошла ошибка. Попробуйте позже.");
    await context.answerCallbackQuery();
  }
});

bot.catch((error) => {
  const context = error.context;
  console.error(`Error while handling update ${context.update.update_id}:`);
  const e = error.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
