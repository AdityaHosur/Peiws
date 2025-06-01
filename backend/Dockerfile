FROM node:20-alpine

RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Copy app source
COPY . .

RUN npm install --production && npm rebuild bcrypt --build-from-source

# Expose the port the app runs on
EXPOSE 5000

# Add healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Command to run the application
CMD ["node", "server.js"]