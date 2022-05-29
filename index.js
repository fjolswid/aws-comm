const { initSqsClient } = require('./lib/sqs-client');
const { getQueue } = require('./lib/get-queue');

module.exports = { getQueue, initSqsClient };