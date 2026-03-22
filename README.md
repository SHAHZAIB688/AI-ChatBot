# AI Chatbot

A modern web-based AI chatbot powered by Groq's LLM API. Features a clean, responsive UI with chat history, real‑time typing indicators, and markdown rendering.

## Features

- **Groq API Integration** – Uses Llama 3.3 70B or other Groq models
- **Real‑time Chat** – Stream‑like typing simulation
- **Chat History** – Persistent local storage with per‑chat titles
- **Markdown Support** – Renders code blocks, lists, bold/italic
- **Fully Responsive** – Works on desktop and mobile
- **Status Indicators** – Visual connection & API health

## Project Structure

```
AI-ChatBot/
├── Backend/
│   └── server.js          # Express server, Groq API proxy
├── Frontend/
│   ├── index.html         # Main UI
│   ├── style.css          # Styling
│   └── script.js          # Chat logic, API calls
├── package.json           # Node dependencies
├── render.yaml            # Render deployment blueprint
├── .gitignore
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18 or later
- A [Groq API key](https://console.groq.com)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/SHAHZAIB688/AI-ChatBot.git
   cd AI-ChatBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (or inside `Backend/` if you run from there) with:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile   # optional, defaults to above
   PORT=3000                            # optional, defaults to 3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser to `http://localhost:3000` (the frontend is served automatically).

   *Note:* The frontend files are located in `Frontend/`. The Express server serves them as static files, so you can also open `Frontend/index.html` directly for development.

## Deployment

### Deploy on Render (Free Tier)

This project includes a `render.yaml` Blueprint for one‑click deployment on [Render](https://render.com).

1. Push the repository to GitHub (if not already).

2. Sign up / log in to [Render](https://render.com).

3. Click **“New +”** → **“Blueprint”** and connect your GitHub repository.

4. Render will automatically detect the `render.yaml` and pre‑fill the service settings.

5. Add the environment variable `GROQ_API_KEY` (and optionally `GROQ_MODEL`) in the Render dashboard.

6. Click **“Apply”** – Render will build and deploy your chatbot.

   The free tier includes 750 hours/month (enough for 24/7 uptime) and a `*.onrender.com` URL.

### Manual Render Deployment

If you prefer to create the service manually:

- **Type:** Web Service
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `GROQ_API_KEY` (required)
  - `GROQ_MODEL` (optional, default: `llama-3.3-70b-versatile`)
  - `PORT` (optional, Render sets its own)

### Deploy on Other Platforms

The application is a standard Node.js/Express app and can be deployed on any platform that supports Node (Heroku, Railway, Fly.io, etc.). Ensure you set the same environment variables.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key (get it from [console.groq.com](https://console.groq.com)) | – |
| `GROQ_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` |
| `PORT` | Port the server listens on | `3000` |

## API Endpoint

The backend exposes a single endpoint:

**`POST /chat`**

Request body:
```json
{
  "message": "Your question here"
}
```

Response:
```json
{
  "reply": "Model's response"
}
```

## Frontend Customization

- **UI Colors:** Edit `Frontend/style.css` – CSS variables at the top control the theme.
- **Model Switching:** Change the `MODEL` constant in `Backend/server.js` or via the `GROQ_MODEL` env var.
- **API Base URL:** The frontend automatically detects whether it’s running on the same origin as the backend (see `API_BASE` in `Frontend/script.js`).

## Troubleshooting

- **“Server is not configured with GROQ_API_KEY”** – Ensure the `.env` file is present and contains the key, or that the environment variable is set on your deployment platform.
- **CORS errors** – The backend already includes the `cors` middleware; if you see CORS issues, verify the frontend is being served from the same origin as the backend.
- **Blank screen** – Check the browser console for errors. The frontend expects the backend at the same host/port when served together.

## License

ISC – free to use and modify.

## Acknowledgements

- [Groq](https://groq.com) for the lightning‑fast inference API.
- [Express](https://expressjs.com) for the backend framework.
- [Render](https://render.com) for the generous free hosting tier.