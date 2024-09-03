import config from '../config';

const HELICONE_API_KEY = config.HELICONE_API_KEY || '';

const HELICONE_CONFIG = {
  basePath: 'https://oai.hconeai.com/v1',
  baseOptions: {
    headers: {
      'Helicone-Auth': `Bearer ${HELICONE_API_KEY}`,
    },
  },
};

export default {
  config: HELICONE_CONFIG,
};
