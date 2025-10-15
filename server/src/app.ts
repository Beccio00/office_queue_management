//app.ts is used to separate the app export from the listen() in order to do integration testing

import express, { Express, Request, Response } from "express";
import ticketRoutes from "./routes/getTicketRoutes";
import serviceRoutes from "./routes/serviceRoutes";

const app = express();
app.use(express.json());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Office Queue Management API",
    version: "1.0.0",
    endpoints: {
      tickets: "/api/tickets",
      services: "/api/services",
      queue: "/api/queue",
    },
  });
});

// API routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/services", serviceRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

app.use("/api/tickets", ticketRoutes);

export default app;
