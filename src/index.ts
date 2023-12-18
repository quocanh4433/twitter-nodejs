import express from 'express';
import usersRouter from './routes/users.routes';
import databaseService from './services/data.servieces';
import { defaultErrorHanlder } from './middlewares/error.middlewares';
import { Object } from 'lodash';

databaseService.connect();
const app = express();
const port = 3000;

app.use(express.json());
app.use('/users', usersRouter);
app.use(defaultErrorHanlder);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

