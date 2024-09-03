import { RequestHandler } from 'express';

import { Organization } from '../database';
import { decrypt } from '../utils/func';
import axios from 'axios';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { organizationId, channelId } = req.body;

    const org = await Organization.findOne(
      {
        organizationId: organizationId,
      },
      { upsert: false, new: false, setDefaultsOnInsert: false }
    );

    const decryptAccesstoken = org?.intercomAccessToken && decrypt(org?.intercomAccessToken);

    const resp = await axios.get(`https://api.intercom.io/teams`, {
      headers: {
        'Intercom-Version': '2.11',
        Authorization: `Bearer ${decryptAccesstoken}`,
      },
    });

    const data = resp.data;

    res.status(200).json(data?.teams || []);
  } catch (error: any) {
    // handle error
    res.status(500).json({ error: error.message });
  }
};

export default {
  get,
};
