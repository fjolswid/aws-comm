const EventEmitter = require('events');

const { SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand } = require('@aws-sdk/client-sqs');

class Queue {
    constructor({ name, client }) {
        this.name = name;
        this.client = client;

        this.polling = false;
        this.pollingRequestCount = 0;
        this.onMessageCallback = null;
        this.eventEmitter = new EventEmitter();

        this.eventEmitter.on(
            "polling-request-result",
            this.onPollingRequestResult.bind(this)
        );
        this.eventEmitter.on("message", this.onMessage.bind(this));
    }

    async getQueueUrl() {
        try {
            return (await this.send(
                new GetQueueUrlCommand({ QueueName: this.name })
            )).QueueUrl;
        } catch (err) {
            if ((err.Code = "AWS.SimpleQueueService.NonExistentQueue")) {
                return null;
            }

            throw err;
        }
    }

    async getUrl() {
        if (!this.url) {
            this.url = await this.getQueueUrl();
        }

        return this.url;
    }

    async sendMessage(data) {
        const json = JSON.stringify(data);

        const res = await this.send(
            new SendMessageCommand({
                MessageDeduplicationId: "test_" + Date.now(),
                MessageGroupId: "test",
                MessageBody: json,
                QueueUrl: await this.getUrl(),
            })
        );

        return res;
    }

    async receiveMessage(options) {
        options.QueueUrl = await this.getUrl();
        return await this.send(new ReceiveMessageCommand(options));
    }

    async deleteMessage(receiptHandle) {
        return await this.send(
            new DeleteMessageCommand({
                QueueUrl: await this.getUrl(),
                ReceiptHandle: receiptHandle,
            })
        );
    }

    async startPolling(onMessageCallback) {
        this.polling = true;
        this.onMessageCallback = onMessageCallback;

        this.pollForMessages();
    }

    stopPolling() {
        this.polling = false;
    }

    async pollForMessages() {
        if (!this.polling) {
            return;
        }

        this.pollingRequestCount++;

        const res = await this.receiveMessage({
            WaitTimeSeconds: 10,
        });

        this.eventEmitter.emit("polling-request-result", res);

        if (this.pollingRequestCount >= 10) {
            return;
        }

        this.pollForMessages();
    }

    async onMessage(message) {
        await this.onMessageCallback(message);

        await this.deleteMessage(message.ReceiptHandle);
    }

    onPollingRequestResult(res) {
        if (!res.Messages) {
            return;
        }

        res.Messages.forEach((message) =>
            this.eventEmitter.emit("message", message)
        );
    }

    send(command) {
        return this.client.send(command);
    }
}

module.exports = { Queue };