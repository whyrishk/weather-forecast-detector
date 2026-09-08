# ◈ SkyLens – AI Weather App

A full-stack weather web app with **real-time temperature, 7-day forecast, hourly rain probability charts, air quality index, and live maps**.

---

## 🌟 Features

| Feature | Details |
|---|---|
| 🌡 Real-time weather | Temperature, feels-like, humidity, wind, pressure, visibility |
| 📅 7-Day forecast | High/low temps, rain probability, icons per day |
| 🕐 Hourly detail | Click any day → per-hour temp + rain % breakdown |
| 📊 Rain chart | Bezier-curve canvas chart of hourly rain probability |
| 🌬 Air Quality | PM2.5, PM10, O₃, NO₂, CO, SO₂ components |
| 🗺 Live map | OpenStreetMap embed of the searched location |
| 🔍 Autocomplete | City search with geocoded suggestions |
| 📍 Geolocation | "Use my location" button |
| °C / °F toggle | Instant unit switching |
| 📱 Responsive | Mobile, tablet, desktop |

---

## 🏗 Project Structure

```
weather-app/
├── backend/
│   ├── server.js          ← Express API server
│   ├── package.json
│   └── .env               ← 🔑 Put your API key here
└── frontend/
    ├── package.json
    └── public/
        ├── index.html
        ├── style.css
        └── app.js
```

---

## 🚀 Quick Start

### Step 1 — Get a FREE API Key

1. Go to [https://home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up)
2. Create a free account
3. Visit **API Keys** tab → copy your key
4. The free tier includes everything this app uses:
   - Current Weather API
   - 5-day / 3-hour Forecast API
   - Air Pollution API
   - Geocoding API

### Step 2 — Configure Backend

Open `backend/.env` and replace `YOUR_API_KEY_HERE`:

```env
OPENWEATHER_API_KEY=abc123yourkeyhere
PORT=5000
```

### Step 3 — Start the Backend

```bash
cd backend
npm install
npm start
```

You should see: `✅  Weather API running on http://localhost:5000`

### Step 4 — Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm start
```

Then open: **[http://localhost:3000](http://localhost:3000)**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather?q=London` | Full weather data (current + 7-day + AQI) |
| GET | `/api/weather?q=10001` | By ZIP code |
| GET | `/api/geocode?q=Par` | City autocomplete suggestions |

### Sample Response `/api/weather`

```json
{
  "location": { "name": "London", "country": "GB", "lat": 51.5074, "lon": -0.1278 },
  "current": {
    "temp": 18, "feels_like": 17, "humidity": 72,
    "wind_speed": 4.2, "wind_deg": 230,
    "description": "scattered clouds", "icon": "03d",
    "aqi": 2, "aqi_label": "Fair",
    "components": { "pm2_5": 8.3, "pm10": 12.1, "o3": 62.4, ... }
  },
  "forecast": [
    {
      "date": "2024-01-15",
      "temp_max": 19, "temp_min": 12,
      "max_rain_prob": 65, "total_rain": 2.4,
      "hourly": [
        { "hour": 0, "temp": 14, "rain_prob": 20, "humidity": 80, ... },
        ...
      ]
    },
    ...
  ]
}
```

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- Axios (HTTP client)
- dotenv (config)
- OpenWeatherMap APIs

**Frontend**
- Vanilla HTML / CSS / JavaScript (zero dependencies)
- Canvas API (rain chart)
- OpenStreetMap (embedded map)
- Google Fonts (Syne + Space Grotesk)

---

## 📦 Dependencies

**Backend**
```json
"express": "^4.18.3",
"axios": "^1.6.7",
"cors": "^2.8.5",
"dotenv": "^16.4.5"
```

---

## 🌐 Deploy to Production

**Backend → Railway / Render / Heroku:**
- Set `OPENWEATHER_API_KEY` in environment variables
- Set `PORT` (auto-configured on most platforms)

**Frontend → Netlify / Vercel / GitHub Pages:**
- Update `API_BASE` in `frontend/public/app.js` to your deployed backend URL
- Deploy the `frontend/public/` folder

---

## 📄 License

MIT — free to use, modify, and distribute.
