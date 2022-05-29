const { getSqsClient } = require('./sqs-client');
const { Queue } = require('./queue');

const getQueue = ({name}) => {
    return new Queue({ name, client: getSqsClient() });
}

module.exports = {
    getQueue
}