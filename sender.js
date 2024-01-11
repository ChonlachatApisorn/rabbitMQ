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

        const newMsg = 'test';

        ch.consume(responseQueue, function (response) {
            // Check if the response is an error message
            if (response.content.toString().startsWith('Error:')) {
                console.error(` [!] Received an error response: ${response.content.toString()}`);
            } else {
                console.log(` [x] Received a successful response: ${response.content.toString()}`);
            }

            conn.close();
            process.exit(0);
        }, { noAck: true });

        const success = ch.sendToQueue(queue, Buffer.from(newMsg));

        if (success) {
            console.log(` [x] Sent '${newMsg}'`);
        } else {
            console.error(` [!] Failed to send message '${newMsg}'`);
            conn.close();
            process.exit(1);
        }

        setTimeout(() => {
            console.log('Closing connection after timeout');
            conn.close();
            process.exit(0);
        }, 5000);
    });
});
