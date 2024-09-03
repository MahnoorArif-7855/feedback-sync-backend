import axios, { AxiosRequestConfig } from 'axios';
import { Request, RequestHandler } from 'express';
import { Admin } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    await Admin.find().then((pricing: any) => {
      res.status(200).json(pricing);
    });
  } catch (error) {
    console.error(`Error running chat query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
