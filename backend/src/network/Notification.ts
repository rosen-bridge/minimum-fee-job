import { WebhookClient } from 'discord.js';
import { discordWebHookUrl } from '../configs';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { DiscordPayloadType } from '../types';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export class Notification {
  private static instance: Notification;
  protected hookClient: WebhookClient | undefined;

  protected constructor() {
    try {
      if (discordWebHookUrl) {
        this.hookClient = new WebhookClient({
          url: discordWebHookUrl,
        });
        logger.debug(
          `'discordWebHookUrl' config is set, instantiating WebhookClient...`
        );
      } else logger.info("Key discordWebHookUrl isn't set in config");
    } catch (e) {
      logger.error(`Something was wrong, couldn't create WebhookClient: ${e}`);
    }
  }

  static getInstance = () => {
    if (!this.instance) {
      logger.debug("Notification instance didn't exist, creating a new one.");
      Notification.instance = new Notification();
      logger.info('Notification instance created.');
    }
    return Notification.instance;
  };

  /**
   * sends a message to notification service using webhook
   * @param msg
   */
  send = async (type: DiscordPayloadType, payload: string): Promise<void> => {
    if (this.hookClient) {
      const sendFunction =
        type === DiscordPayloadType.MESSAGE ? this.sendMessage : this.sendFile;
      try {
        await sendFunction(payload);
        logger.info(`Payload [${type}] has been sent using discord webhook`);
      } catch (e) {
        logger.warn(
          `An error occurred while sending message to discord webhook: ${e}`
        );
        if (e instanceof Error && e.stack) logger.warn(e.stack);
      }
    } else {
      logger.info(`WebhookClient instance doesn't exist`);
      logger.debug(
        `Method sendMessage called for send notification with msg ${payload}`
      );
    }
  };

  /**
   * sends a message to notification service using webhook
   * @param msg
   */
  protected sendMessage = async (msg: string) => {
    return this.hookClient!.send({ content: msg });
  };

  /**
   * sends a file to notification service using webhook
   * @param msg
   */
  protected sendFile = async (fileContent: string) => {
    return this.hookClient!.send({
      files: [{ attachment: Buffer.from(fileContent), name: 'details.md' }],
    });
  };
}

export default Notification;
