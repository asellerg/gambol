# Start with the official Node.js image.
FROM node:alpine

# Set the working directory in the Docker container.
WORKDIR /app

COPY .env /app

# Copy the package.json and package-lock.json.
COPY package*.json ./

# Copy the rest of the application code.
COPY . .

# Build the app.
RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && npm install \
    && npm run build \
    && apk del .gyp

# Specify the port number the app will run on.
EXPOSE 3000

# Command to run the application.
CMD [ "npm", "start" ]
