import express from 'express';
import createTicketController from '../controllers/createTicket.controller';

const router = express.Router();

router.post('/', createTicketController.get);

export default router;
