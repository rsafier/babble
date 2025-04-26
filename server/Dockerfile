FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies including dev dependencies needed for build
RUN npm install

# Copy the entire codebase
COPY . .


# Create a .env file if it doesn't exist (will be overridden by secrets in production)
RUN touch .env

# Expose the port the app runs on
EXPOSE 3001
ENV PORT=3001
# Start the worker
CMD ["npm", "run", "dev"]
