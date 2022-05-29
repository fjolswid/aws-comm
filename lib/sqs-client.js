const { SQSClient } = require('@aws-sdk/client-sqs');

const REGIION = 'us-east-2';

let sqsClient = null;

const getSqsClient = () => sqsClient;

const initSqsClient = options => {
    sqsClient = new SQSClient(options);
}

module.exports = { getSqsClient, initSqsClient };
