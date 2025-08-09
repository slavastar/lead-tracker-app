import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads';
import usersRouter from "./routes/users";
import dotenv from 'dotenv';
import paymentsRouter from "./routes/payments";
import webhookRouter from "./routes/webhooks";
import analyticsRouter from "./routes/analytics";
import templatesRouter from "./routes/templates";

dotenv.config();

const app = express();
app.use(cors());

app.use("/api/webhook", webhookRouter);

app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use("/api/users", usersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/templates", templatesRouter);

app.listen(4000, () => {
  console.log('Backend running on http://localhost:4000');
});
