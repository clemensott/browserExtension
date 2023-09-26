import BackgroundVideoOpenService from './Services/BackgroundVideoOpenService';
import MessagesService from './Services/MessagesService';
import StorageService from './Services/StorageService';

const storageService = new StorageService();
const messagesService = new MessagesService();

const videoOpenService = new BackgroundVideoOpenService(storageService, messagesService);
videoOpenService.start();
