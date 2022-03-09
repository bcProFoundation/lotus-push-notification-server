import webpush from 'web-push';
import config from '../config';
import { Message, Subscription  } from 'src/types';
import { deleteSubscription } from '../db';

const { MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = config

webpush.setVapidDetails(MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const sendPushMessage = (id: string, subscription: Subscription, message: Message) => {
    console.log("Sending Push Message");
    console.log(id, subscription, message);
    return webpush.sendNotification(subscription.pushSubObj, JSON.stringify(message))
    .catch((error) => {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log('Subscription has expired or is no longer valid: ', error);   
        return deleteSubscription(id, subscription.clientAppId);
      } else {
        throw error;
      }
    });
}