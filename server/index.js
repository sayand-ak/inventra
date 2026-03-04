import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './db/connect.js';
import categoryRoutes from './routes/category.js'
import brandRoutes from './routes/brand.js'
import productRoutes from './routes/product.js'
import userRoutes from './routes/user.js'
import { errorHandler } from './middlewares/error.js';
import { authMiddleware } from './middlewares/auth.js';

const server = express();
dotenv.config();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors({
  origin: '*'
}));

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.use('/api/auth', userRoutes);
    server.use('/api/categories', authMiddleware, categoryRoutes);
    server.use('/api/brands',authMiddleware, brandRoutes);
    server.use('/api/products',authMiddleware, productRoutes);

    server.use(errorHandler);

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during server setup:', error);
  }
};

startServer();
