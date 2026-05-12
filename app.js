import express from 'express'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import dayjs from 'dayjs'

dotenv.config()

const app = express()
// fallback for if there isnt an env file
const PORT = process.env.PORT || 5000

// doesnt create the data folder but creates a path with second val at the end
const DATA_DIR = path.join(import.meta.dirname, 'data')
const WEATHER_FILE = path.join(DATA_DIR, 'weather.json')
const LOG_FILE = path.join(DATA_DIR, 'weather_log.csv')

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(import.meta.dirname, 'public')))

// API to get latest weather
// doesnt have MVC architecture because its just a small bit of functionality
app.get('/api/weather', (req, res) => {
    // .json() is similar to .send()
    if (!fs.existsSync(WEATHER_FILE)) return res.status(404).json({ error: 'No weather data available' })
    try {
        const weatherData = JSON.parse(fs.readFileSync(WEATHER_FILE, 'utf8'))
        // if you dont specify a status code, it will return 200 as default (for success)
        res.json(weatherData)
    } catch (err) {
        console.error('Error reading weather.json:', err)
        res.status(500).json({ error: 'Failed to read weather data' })
    }
})

// API to get historical weather log
app.get('/api/weather-log', (req, res) => {
    if (!fs.existsSync(LOG_FILE)) return res.status(404).json({ error: 'No weather log available' })

    const timestamps = []
    const temps = []

    fs.createReadStream(LOG_FILE)
        .pipe(csv())
        .on('data', row => {
            if (row.timestamp && row.temperature) {
                timestamps.push(row.timestamp)
                temps.push(parseFloat(row.temperature))
            }
        })
        .on('end', () => res.json({ timestamps, temps }))
        .on('error', err => {
            console.error('Error reading CSV:', err)
            res.status(500).json({ error: 'Failed to read log' })
        })
})

app.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`))
