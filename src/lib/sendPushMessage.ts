import webpush from 'web-push';
import config from '../config';
import { Message, Subscription  } from 'src/types';
import { deleteSubscription } from '../db';
import logger from '../logger';

const { MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = config

webpush.setVapidDetails(MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const sendPushMessage = (id: string, subscription: Subscription, message: Message) => {
    logger.log('debug', 'Sending Push Message', { pushContent: message, subscription });
    return webpush.sendNotification(subscription.pushSubObj, JSON.stringify(message))
    .catch((error) => {
      logger.log('error', 'Cannot send push mesage', error);
      if (error.statusCode === 404 || error.statusCode === 410) {
        return deleteSubscription(id, subscription.clientAppId);
      } else {
        throw error;
      }
    });
}