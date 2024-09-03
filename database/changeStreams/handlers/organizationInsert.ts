import { ChangeStreamInsertDocument } from 'mongodb';
import processingService from '../../../services/processing.service';
import { ORGANIZATION_STREAM } from '../../../utils/constant';
import axios from 'axios';
import config from '../../../config';
import { nodeMailerTransport } from '../../../utils/nodeMailerTransport';
import { HTML_CONTENT } from '../../../utils/constant';
import { User } from '../../../database';

export async function onChange(change: ChangeStreamInsertDocument) {
  const { fullDocument } = change;

  const user = await User.find({
    organizationId: fullDocument?.organizationId,
  });
  console.log(' organization User', user);

  const email = user[0]?.email;
  const { userName, userId } = user[0] || { userName: null, userId: null };
  try {
    const date = Date.now();
    const event = new Date(date).toDateString();

    const webhookUrl = `https://hooks.slack.com/services/${config.SLACK_NOTIFICATION_WEBHOOK}`;

    const payload = {
      text: `A new organization ${fullDocument?.organizationName} has been added - ${event}`,
    };
    // await sendMail(email);
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOP_AUTHENTICATION_TOKEN}` || '',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email,
        firstName: userName,
        lastName: ' ',
        source: ' ',
        subscribed: true,
        userGroup: ' ',
        userId: userId,
      }),
    };

    await fetch('https://app.loops.so/api/v1/contacts/create', options)
      .then(async (response) => {
        const responseData = await response.json();
        console.log(responseData);
      })
      .catch((err) => console.error('Loops contacts events', err));

    const sendOptions = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOP_AUTHENTICATION_TOKEN}` || '',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email,
        userId: userId,
        eventName: 'Onboarding',
        eventProperties: {},
      }),
    };

    await fetch('https://app.loops.so/api/v1/events/send', sendOptions)
      .then(async (response) => {
        const responseData = await response.json();
        console.log(responseData);
      })
      .catch((err) => console.error('Loops Error events', err));

    await processingService.processInsertedDocument(fullDocument, ORGANIZATION_STREAM);

    axios
      .post(webhookUrl, payload, {
        headers: {
          'Content-type': 'application/json',
        },
      })
      .then((response: any) => {
        console.log('successfully sent message to slack:', response.data);
      })
      .catch((error: any) => {
        console.error('Error sending message to slack:', error);
      });
  } catch (error) {
    console.error(`Error while creating new tenant for new organization ${fullDocument._id}: ${error}`);
  }
}

async function sendMail(email: string) {
  console.log('email ==>>>> ', email, config.EMAIL_USER);
  // send mail with defined transport object
  const info = await nodeMailerTransport.sendMail({
    from: config.EMAIL_USER, // sender address
    to: email, // list of receivers
    subject: 'Get Started with Feedback Sync', // Subject line
    html: HTML_CONTENT, // html body
  });

  console.log('Message sent: %s', info.messageId);
}
