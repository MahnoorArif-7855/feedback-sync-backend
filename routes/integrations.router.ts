import express from 'express';
import integrationsController from '../controllers/integrations.controller';

const router = express.Router();

router.use('/g2', integrationsController.g2.get);
router.use('/zendesk', integrationsController.zendesk.get);

export default router;
