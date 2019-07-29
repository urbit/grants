import express from "express";

import { MessageController, AzimuthController } from "./controllers";
import bodyParser from "body-parser";
import CORS from "cors";

const app: express.Application = express();

const port: number = Number(process.env.PORT) || 4000;

app.use(bodyParser.json());
app.use(CORS());

app.use("/message", MessageController);
app.use("/azimuth", AzimuthController);

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
