import express, { application } from "express";
import morgan from "morgan";
import cors from "cors";
import v1Routes from "./routes/v1/index.js";
import { converter, notFound } from "./middlewares/error.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import useragent from "express-useragent";

dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: "GET, POST, PUT, PATCH, DELETE, HEAD",
  credentials: true, // allow cookies to be sent
};

app.use(cookieParser());

app.use(cors(corsOptions));

// req logger
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

app.use(express.json());

// Middleware to parse user agent information
app.use(useragent.express());

// API endpoints
app.use("/api/v1", v1Routes);

app.use("/api/v1", (req, res) => {
  res.send("Welcome to Rukhak!");
});

// Error handler
app.use(notFound);
app.use(converter);

export default app;
