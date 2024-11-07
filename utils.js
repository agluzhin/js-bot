// Получаем весь перечень вопросов из JSON файла.
const questions = require("./questions.json");
// Импортируем класс "Random" из библиотеки "random-js".
const { Random } = require("random-js");

// Создаем функцию получения случайного вопроса по выбранной теме.
const getRandomQuestion = (topic) => {
  // Создаем объект класса "Random" для использования его методов.
  const random = new Random();
  // Приводим тему к нижнему регистру, так как в "questions.json" все ключи - в нижнем регистре.
  let questionTopic = topic.toLowerCase();

  // Проверяем является ли тема - случайной.
  if (questionTopic == "случайный вопрос") {
    // Получаем случайную тему по ключу.
    questionTopic =
      Object.keys(questions)[
        random.integer(0, Object.keys(questions).length - 1)
      ];
  }

  // Получаем случайный индекс вопроса.
  const randomQuestionIndex = random.integer(
    0,
    questions[questionTopic].length - 1
  );

  // Возвращаем объект со случайным вопросом и темой.
  return {
    question: questions[questionTopic][randomQuestionIndex],
    questionTopic,
  };
};

// Создаем функцию для получения правильного ответа на вопрос по его "id" в выбраной теме.
const getCorrectAnswer = (topic, id) => {
  // Получаем вопрос в выбранной теме по его id.
  const question = questions[topic].find((question) => question.id === id);

  // Проверка на принадлежность к открытому вопросу, если "true", то просто вернет ответ.
  if (!question.hasOptions) {
    return question.answer;
  }

  // Если вопрос тестовый, то вернет ответ на него, если флаг ответа "isCorrect" равен "true".
  return question.options.find((option) => option.isCorrect).text;
};

// Экспортируем созданные функции (открываем доступ для импорта в исполнительный файл).
module.exports = { getRandomQuestion, getCorrectAnswer };
