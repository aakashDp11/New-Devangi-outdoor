// lambda.js
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';

const app = express();

// Your routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Lambda!' });
});

export const handler = serverlessExpress({ app });
