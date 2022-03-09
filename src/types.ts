import { PushSubscription } from "web-push";

export interface Subscription {
    clientAppId: string,
    pushSubObj: PushSubscription,
}

export interface Subscriptions {
    id: string,
    list: Subscription[],
}

export interface Message {
    type: MessageType,
    payload: MessageTX | string
}

export interface MessageTX {
    amount: Number,
    fromScriptHash: string,
    toScriptHash: string
}

export enum MessageType {
    tx = 'TX',
    text = 'TEXT'
}