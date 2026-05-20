import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { startScenarioCron } from './jobs/scenarioCron';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use('/uploads', express.static(path.resolve('uploads')));
app.use(routes);

startScenarioCron();
export default app;