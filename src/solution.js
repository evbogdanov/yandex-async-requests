function randomResponseTime() {
  const min = 16,
        max = 128;
  return Math.floor(Math.random()*(max-min+1)+min);
}


// Симулирую долгий запрос с рандомным временем выполнения
function fakeFetch(url) {
  const time = randomResponseTime();
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time, `OK: ${url}`);
  });
}


function parallelLimit(urls, limit, callback) {
  const tasks = urls.map((url, id) => ({id, url, isReady: false, isDoing: false})),
        results = [],
        knownUrls = {}; // мемоизация

  let currentTasks = [], // шина
      timeout;

  const addToResults = (id, response) => {
    // Вместе с результатом передаю айдишник для последующей сортировки
    results.push({id, response});
  };

  const doTasks = () => {
    // Вытаскиваю из шины завершённые таски, освобождая место под новые
    currentTasks = currentTasks.filter(task => {
      if (task.isReady) {
        addToResults(task.id, task.response);
        return false;
      }
      return true;
    });

    // Все свободные места в шине забиваю новыми тасками
    while (tasks.length > 0 && currentTasks.length < limit) {
      const nextTask = tasks.shift(),
            nextUrl = nextTask.url;
      // Для данного урла результат может быть уже известен.
      // Тогда нет никакого смысла занимать место в шине.
      if (knownUrls.hasOwnProperty(nextUrl)) {
        addToResults(nextTask.id, knownUrls[nextUrl]);
      }
      else {
        currentTasks.push(nextTask);
      }
    }

    // Запускаю выполнение тасков (если они ещё не делаются)
    for (const task of currentTasks) {
      if (task.isDoing) continue;
      task.isDoing = true;
      fakeFetch(task.url).then(response => {
        task.isReady = true;
        task.response = response;
        // Сохраню ответ, чтобы в будущем быстро вернуть для данного урла
        knownUrls[task.url] = response;
      });
    }
  };

  // Рекурсивно проверяю наличие результатов по тайм-ауту
  const checkResults = () => {
    if (results.length === urls.length) {
      if (timeout) clearTimeout(timeout);
      return callback(
        // Сортирую результаты в том же порядке, в каком были переданы урлы
        results.sort((a, b) => a.id - b.id).map(r => r.response)
      );
    }
    // Необходимого количества результатов ещё нет, продолжаю...
    doTasks();
    timeout = setTimeout(checkResults, 32);
  };

  checkResults();
}


module.exports = parallelLimit;
