const amqp = require('amqplib/callback_api');

amqp.connect('amqp://guest:guest@rabbitmq:5672', (err, conn) => {
    if (err) {
        console.error('[!] Error connecting to RabbitMQ:', err.message);
        process.exit(1);
    }

    conn.createChannel((err, ch) => {
        if (err) {
            console.error('[!] Error creating channel:', err.message);
            conn.close();
            process.exit(1);
        }

        const queue = 'rabbit-mq-test';
        ch.assertQueue(queue, { durable: false });

        const responseQueue = 'response-queue';
        ch.assertQueue(responseQueue, { durable: false });

        console.log(" [x] Waiting for messages in %s.", queue);
        ch.consume(queue, function (msg) {
            const jsonPar = JSON.parse(msg.content)
            console.log(" [x] Received %s", msg.content.toString());

            setTimeout(() => {
                // simulate check condition
                if (jsonPar.userId === 't01') {
                    const errorMsg = 'Error: Something went wrong';
                    ch.sendToQueue(responseQueue, Buffer.from(errorMsg));
                    console.log(` [!] Sent error response: ${errorMsg}`);
                } else {
                    const responseMsg = msg.content.toString();
                    ch.sendToQueue(responseQueue, Buffer.from(responseMsg));
                    console.log(` [x] Sent successful response: '${responseMsg}'`);
                }
            }, 1000);
        }, { noAck: true });
    });
});
