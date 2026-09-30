import { requestRepository as fbReq } from './FirebaseRequestRepository';
import { cardRepository as fbCard } from './FirebaseCardRepository';
import { gameRepository as fbGame } from './FirebaseGameRepository';
import { CardAssignmentService } from '../services/CardAssignmentService';

export const requestRepository = fbReq;
export const cardRepository = fbCard;
export const gameRepository = fbGame;
export const cardAssignmentService = new CardAssignmentService(requestRepository, cardRepository);
