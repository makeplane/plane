// mq
import { Connection, Channel, connect, ConsumeMessage } from 'amqplib';
// utils
import { logger } from "../utils/logger";

export class MQSingleton {
    private static instance: MQSingleton;
    private connection: Connection | null = null;
    public channel: Channel | null = null;

    private constructor() {}

    // Get the current instance
    public static getInstance(): MQSingleton {
        if (!this.instance) {
            this.instance = new MQSingleton();
        }
        return this.instance;
    }

    // Initialize instance
    public async initialize(): Promise<void> {
        if (!this.connection || !this.channel) {
            await this.init();
        }
    }

    private async init(): Promise<void> {
        const rabbitMqUrl = process.env.RABBITMQ_URL || "";
        try {
            this.connection = await connect(rabbitMqUrl);
            logger.info(`✅ Rabbit MQ Connection is ready`);
            this.channel = await this.connection.createChannel();
            logger.info(`🛸 Created RabbitMQ Channel successfully`);
        } catch (error) {
            console.error('Error in initializing RabbitMQ:', error);
        }
    }

    // Send the message to the given queue
    public async sendToQueue(queue: string, content: Buffer): Promise<boolean> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        await this.channel.assertQueue(queue, { durable: false });
        return this.channel.sendToQueue(queue, content);
    }

    // Receive the message from the given queue
    public async consume(queue: string, callback: (msg: ConsumeMessage | null) => void): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        logger.info("👂 Listening for incoming events")
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.consume(queue, callback, { noAck: true });
    }

}