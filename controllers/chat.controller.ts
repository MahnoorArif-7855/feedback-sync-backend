import { RequestHandler } from 'express';
import chatService from '../services/chat.service';

const get: RequestHandler = async (req, res, next) => {
  try {
    const { q, organizationid} = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        message: 'Bad Request - q is required',
      });
    }

    // Convert organizationid to a string or null
    let organization: string | null = null;
    if (typeof organizationid === 'string') {
      organization = organizationid;
    }

    res.json(await chatService.completion(q, organization));
  } catch (error) {
    console.error(`Error running chat query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
