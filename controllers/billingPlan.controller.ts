require('dotenv').config();

import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Billing } from '../database';

const get: RequestHandler = async (req: Request, res: Response, next) => {
  try {
    const organizationId = req.query.organizationId as string;
    console.log('organizationId', organizationId);
    await Billing.find({
      organizationId: organizationId,
    }).then((billing: any) => {
      res.status(200).json(billing);
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export default {
  get,
};
