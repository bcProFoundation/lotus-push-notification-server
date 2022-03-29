import { PushSubscription } from "web-push";

export interface Subscription {
    clientAppId: string,
    pushSubObj: PushSubscription,
    lastCheckIn: number, //timestamp
}

export interface Subscriptions {
    id: string,
    list: Subscription[],
}

export interface Message {
    clientAppId?: string,
    type: MessageType,
    payload: MessageTX | string
}

export interface MessageTX {
    amount: Number,
    fromAddress: string | null | undefined,
    toAddress: string | null | undefined,
    opReturnOutput: string | null | undefined,
}

export enum MessageType {
    tx = 'TX',
    text = 'TEXT'
}

declare global {
    namespace Express {
        interface User {
            id: string,
            isAdmin? : boolean;
        }
    }
}
