import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Organization } from './database';

// const authorizationHeader = process.env.DISCOURSE_AUTHORIZATION_HEADER;
export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  if (req.headers['x-discourse-event-signature']) {
    const signatureHeader = req.headers['x-discourse-event-signature'];
    const signatureValue = signatureHeader.split('sha256=')[1];
    let parts = req.originalUrl.split('/');

    let orgId = parts[parts.length - 1];

    const organizationData = await Organization.find({
      organizationId: orgId,
    });
    if (organizationData) {
      if (organizationData[0]?.discourseSecretKey) {
        //creating hmac object
        const hmac = crypto.createHmac('sha256', organizationData[0].discourseSecretKey);
        //passing the data to be hashed
        const data = hmac.update(JSON.stringify(req.body));
        //Creating the hmac in the required format
        const gen_hmac = data.digest('hex');
        //Printing the output on the console
        console.log('hmac : ' + gen_hmac, signatureValue);
        if (signatureValue === gen_hmac) {
          next();
          return;
        } else {
          res.status(403).send('Forbidden: Invalid secret key.');
          console.log('Webhook secret key does not match the expected key.');
          return;
        }
      } else {
        res.status(400).send('The webhook secret key has not been set.');
        console.log('The webhook secret key has not been set.');
        return;
      }
    } else {
      res.status(400).send('The webhook URL is not valid');
      console.log('The webhook is not valid');
      return;
    }
  }
  if (req.headers['zendesk-webhook-secret-key']) {
    const signatureHeader = req.headers['zendesk-webhook-secret-key'];
    let orgParts = req.originalUrl.split('/');

    let orgId = orgParts[orgParts.length - 1];
    const organizationData = await Organization.find({
      organizationId: orgId,
    });
    if (organizationData) {
      if (organizationData[0]?.zendeskSecretKey) {
        if (organizationData[0]?.zendeskSecretKey === signatureHeader) {
          next();
          return;
        } else {
          res.status(403).send('Forbidden: Invalid zendesk secret key.');
          console.log('Webhook secret key does not match the expected key. ');
          return;
        }
      } else {
        res.status(400).send('The webhook secret key has not been set');
        console.log('The webhook secret key has not been set.');
        return;
      }
    } else {
      res.status(400).send('The webhook URL is not valid');
      console.log('The webhook is not valid');
      return;
    }
  }
  if (req.headers['intercom-webhook-subscription-id']) {
    const str = req.headers['intercom-webhook-subscription-id'];
    const parts = str.split('_');
    const appId = parts[parts.length - 1];
    console.log(appId);
    let orgParts = req.originalUrl.split('/');

    let orgId = orgParts[orgParts.length - 1];
    const organizationData = await Organization.find({
      organizationId: orgId,
    });
    if (organizationData) {
      if (organizationData[0]?.intercomAppId) {
        if (organizationData[0]?.intercomAppId === appId) {
          next();
          return;
        } else {
          res.status(403).send('Forbidden: Invalid intercom appId.');
          console.log('Webhook secret key does not match the expected app id. ');
          return;
        }
      } else {
        res.status(400).send('The webhook app ID  has not been set');
        console.log('The webhook app ID  has not been set.');
        return;
      }
    } else {
      res.status(400).send('The webhook URL is not valid');
      console.log('The webhook is not valid');
      return;
    }
  }
  if (req.headers['stripe-signature']) {
    next();
    return;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('public')) {
    next();
    return;
  }

  if (
    !req.headers.authorization ||
    (!req.headers.authorization.startsWith('Bearer ') && !(req.cookies && req.cookies.__session))
  ) {
    // console.error(
    //   'No Firebase ID token was passed as a Bearer token in the Authorization header.',
    //   'Make sure you authorize your request by providing the following HTTP header:',
    //   'Authorization: Bearer <Firebase ID Token>',
    //   'or by passing a "__session" cookie.'
    // );
    req.user = null;
    res.status(403).send('Unauthorized');
    console.log('[Unauthorized Bearer token -req.headers.authorization not present]');
    return;
  }

  let idToken: string;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    // console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    req.user = null;
    res.status(403).send('Unauthorized');
    console.log('[Unauthorized No cookie]');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    // console.error('Error while verifying Firebase ID token:', error);
    console.log('[Error while verifying Firebase ID token]');
    res.status(403).send('Unauthorized');
    return;
  }
};
