import axios, { AxiosRequestConfig } from 'axios';
import { RequestHandler } from 'express';
import config from '../config';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const data = req.body;
    const authvalidation = req.user;
    const { name, message, email } = data;

    const ticket = {
      ticket: {
        comment: { body: message },
        priority: 'urgent',
        subject: email,
      },
    };

    let configZendesk = {
      method: 'POST',
      url: `https://${config.ZENDESK_DOMAIN}.zendesk.com/api/v2/tickets`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${config.ZENDESK_TOKEN}`,
      },
      data: ticket,
    };

    axios(configZendesk)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        res.status(200).json(JSON.stringify(response.data));
      })
      .catch(function (error) {
        const { response } = error;
        console.log(response);
        next(error);
      });
  } catch (error) {
    console.error(`Error running create ticket query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
