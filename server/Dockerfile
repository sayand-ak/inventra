# Use official Node.js image
FROM node:20-alpine3.21

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (change if your app uses different port)
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]