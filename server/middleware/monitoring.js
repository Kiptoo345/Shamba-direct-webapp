
const requestStats = {};

function monitor(req, res, next) {
  const consumer = req.apiConsumer || 'UNKNOWN';

  const path = `/api${req.path}`;

  const key = `${req.method} ${path}`;

  if (!requestStats[key]) {
    requestStats[key] = {
      method: req.method,
      path,
      totalCalls: 0,
      consumers: {}
    };
  }

  requestStats[key].totalCalls += 1;

  requestStats[key].consumers[consumer] =
    (requestStats[key].consumers[consumer] || 0) + 1;

  console.log(
    `[API REQUEST] ${consumer} ${req.method} ${path}`
  );

  next();
}

function statsHandler(req, res) {
  res.json({
    totalRequests: Object.values(requestStats)
      .reduce((sum, item) => sum + item.totalCalls, 0),

    endpoints: Object.values(requestStats)
  });
}

function resetStats() {
  Object.keys(requestStats).forEach((key) => {
    delete requestStats[key];
  });
}

module.exports = {
  monitor,
  statsHandler,
  resetStats
};
