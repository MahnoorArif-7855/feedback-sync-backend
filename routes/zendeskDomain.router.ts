import express from 'express';

import zendeskDomainController from '../controllers/zendeskDomain.controller';

const router = express.Router();

router.post('/', zendeskDomainController.get);

export default router;
