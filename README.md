# Gemini Vision Context AI

This is a context-aware AI assistant that uses your camera feed and mouse interactions to proactively provide useful, structured information. It operates in multiple modes to suit your needs, from focused work to open-ended exploration.

## Project Setup

This project is built with React, TypeScript, and Vite. To run it locally, you'll need [Node.js](https://nodejs.org/) and `npm` installed.

### 1. Set Up Your API Key

The application requires a Google Gemini API key to function.

1.  Make a copy of the `.env.example` file and rename it to `.env`.
2.  Open the new `.env` file.
3.  Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.

```
VITE_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 2. Install Dependencies

Open your terminal in the project root directory and run the following command to install all the necessary packages:

```bash
npm install
```

### 3. Run the Development Server

Once the dependencies are installed, you can start the local development server:

```bash
npm run dev
```

This will start the application and typically open it in your default web browser at an address like `http://localhost:5173/`. The local server provides a secure context, which is required for the browser to grant camera and microphone permissions.
