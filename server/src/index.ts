import express, { Express, Request, Response } from "express";
import ticketRoutes from './routes/getTicketRoutes';
import serviceRoutes from './routes/serviceRoutes';
import { errorMiddleware } from "./middleware/errorMiddleware";

const app: Express = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
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
      services: "/api/services"
    }
  });
});

// API routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);

// Error handling middleware
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});
