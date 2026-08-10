FROM node:18-alpine
WORKDIR /app

# Install only production dependencies for smaller image
COPY package*.json ./
RUN npm ci --only=production

# Copy source and expose port
COPY . .
ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
