import level from 'level';
import subleveldown from 'subleveldown';
import config from '../config';
import { Subscription, Subscriptions } from 'src/types';

const { DB_PATH } = config;
// const db = sublevel(levelup(encoding(leveldown(DB_PATH), {valueEncoding: 'json'})));
// const subDB = db.sublevel('subscriptions');
// const logDB = db.sublevel('logs');
const db = level(DB_PATH, {createIfMissing: true});
const subDB = subleveldown(db, 'subscriptions', { valueEncoding: 'json'});
const logDB = subleveldown(db, 'logs', { valueEncoding: 'json'});

// return 
//  the value associated with the given id
//  undefined if does not exist
// see : https://github.com/Level/levelup#dbgetkey-options-callback
const getSubscriptions = async (id: string) => {
    try {
        return await subDB.get(id);
    } catch(error: any) {
        if ( error.notFound ){
            return undefined;
        } 
        else throw error;
    }
}

// return
//  the Subscrption Object for the give ids
//  undefined if does not exist
const getSubscription = async (id: string, clientAppId: string) => {
    try {
        const existingSubs = await subDB.get(id);
        let found = existingSubs.list.find((sub: Subscription) => sub.clientAppId === clientAppId);
        return found;
    } catch (error: any) {
        if ( error.notFound ) return undefined;
        else throw error;
    }
}


// save new subscription
// overwrite existing subscription
const saveSubscription = async (id: string, newSub: Subscription) => {
    // 1. get the list of subscriptions associated with the id
    // 2. append the new subscription only if it does not already exist in the list
    // 3. replace PushSubscription object if already exists
    const existingSubs = await getSubscriptions(id);
    if ( !existingSubs ) { 
        // the id does not exist in the database
        // save it
        const subs = {
            id,
            list: [newSub]
        }
        await subDB.put(id,subs);
    } else {
        let foundIndex = existingSubs.list.findIndex((sub: Subscription) => sub.clientAppId === newSub.clientAppId);
        if (foundIndex === -1) {
            // this is a new subscription
            // save it to the existing list
            existingSubs.list.push(newSub);

            // TODO: check the limit, remove the sub if neccessary

        } else {
            // already exists, replace the PushSubscription Obj
            existingSubs.list[foundIndex] = newSub;
        }
        await subDB.put(id, existingSubs);
    }
}

// return
//  the deleted subscirptions
//  undefined if does not exist
const deleteSubscriptions = async (id: string) => {
    // 1. get the subscriptions associated with given id
    // 2. delete the subscriptions from the database
    // 3. return the subscriptions, undefined if there is no subscriptions for the given id
    const existingSubs = await getSubscriptions(id);
    if ( existingSubs ) {
        await subDB.del(id);
    }
    return existingSubs;
}


// return the deleted subscription or undefined if the subscription does not exist
const deleteSubscription = async (id: string, clientAppId: string) => {
    // 1. get the subscriptions list for the given id
    // 2. find and remove the subscription with the matching clientAppId
    // 3. save the modified subscriptions list back to db
    // 4. return the removed subscription, undefined if the subscription does not exist
    let deletedSub = undefined;
    const existingSubs = await getSubscriptions(id);
    if ( existingSubs ) {
        const foundIndex = existingSubs.list.findIndex((sub: Subscription) => sub.clientAppId === clientAppId);
        if ( foundIndex !== -1) {
            deletedSub = existingSubs.list.splice(foundIndex,1);
            if ( existingSubs.list.length > 0 ) {
                await subDB.put(id, existingSubs);
            } else {
                await subDB.del(id);
            }
        }
    }
    return deletedSub;
}

// get all the content of the database
const getAllSubscriptionData = async () => {
    let data: Subscriptions[] = [];
    // let iterator = await subDB.iterator({keyAsBuffer:false, valueAsBuffer: false});
    // // while ( iterator.next() )
    // for await (const [key, value] of iterator) {
    //     data.push({[key]: value})    
    // }
    return data;
}

export { getSubscriptions, getSubscription, saveSubscription, deleteSubscription, deleteSubscriptions, getAllSubscriptionData }