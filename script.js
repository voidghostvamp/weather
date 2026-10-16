
/* =====================================================
   GHOSTVAMP3000 WEATHER 🐸
   Pure JavaScript | Live weather | No API key required
   ===================================================== */

(() => {
    "use strict";

    // ---------- ELEMENTS ----------

    const locationElement = document.getElementById("location");
    const temperatureElement = document.getElementById("temperature");
    const conditionElement = document.getElementById("condition");
    const frogElement = document.querySelector(".frog");
    const noteElement = document.getElementById("weather-note");
    const forecastElement = document.getElementById("forecast");
    const weatherCard = document.querySelector(".weather-card");
    const welcomeSection = document.querySelector(".welcome");

    if (
        !locationElement ||
        !temperatureElement ||
        !conditionElement ||
        !weatherCard ||
        !forecastElement ||
        !welcomeSection
    ) {
        console.error(
            "GhostVamp3000 Weather: Required HTML elements were not found."
        );
        return;
    }

    // ---------- APP STATE ----------

    let temperatureUnit = "C";
    let latestWeather = null;
    let latestPlace = null;
    let searchNumber = 0;

    // ---------- WEATHER DESCRIPTIONS ----------

    function getWeatherInfo(code) {
        const weatherTypes = {
            0:  { label: "Clear sky", icon: "☀️", theme: "clear" },
            1:  { label: "Mostly clear", icon: "🌤️", theme: "clear" },
            2:  { label: "Partly cloudy", icon: "⛅", theme: "cloudy" },
            3:  { label: "Overcast", icon: "☁️", theme: "cloudy" },
            45: { label: "Foggy", icon: "🌫️", theme: "fog" },
            48: { label: "Misty fog", icon: "🌫️", theme: "fog" },
            51: { label: "Light drizzle", icon: "🌦️", theme: "rain" },
            53: { label: "Drizzle", icon: "🌦️", theme: "rain" },
            55: { label: "Heavy drizzle", icon: "🌧️", theme: "rain" },
            56: { label: "Freezing drizzle", icon: "🌧️", theme: "rain" },
            57: { label: "Heavy freezing drizzle", icon: "🌧️", theme: "rain" },
            61: { label: "Light rain", icon: "🌦️", theme: "rain" },
            63: { label: "Rain", icon: "🌧️", theme: "rain" },
            65: { label: "Heavy rain", icon: "🌧️", theme: "rain" },
            66: { label: "Freezing rain", icon: "🌧️", theme: "rain" },
            67: { label: "Heavy freezing rain", icon: "🌧️", theme: "rain" },
            71: { label: "Light snowfall", icon: "🌨️", theme: "snow" },
            73: { label: "Snowfall", icon: "❄️", theme: "snow" },
            75: { label: "Heavy snowfall", icon: "❄️", theme: "snow" },
            77: { label: "Snow grains", icon: "❄️", theme: "snow" },
            80: { label: "Rain showers", icon: "🌦️", theme: "rain" },
            81: { label: "Rain showers", icon: "🌧️", theme: "rain" },
            82: { label: "Heavy showers", icon: "⛈️", theme: "storm" },
            85: { label: "Snow showers", icon: "🌨️", theme: "snow" },
            86: { label: "Heavy snow showers", icon: "❄️", theme: "snow" },
            95: { label: "Thunderstorm", icon: "⛈️", theme: "storm" },
            96: { label: "Thunderstorm with hail", icon: "⛈️", theme: "storm" },
            99: { label: "Strong thunderstorm", icon: "⛈️", theme: "storm" }
        };

        return weatherTypes[code] || {
            label: "Weather update",
            icon: "🌤️",
            theme: "cloudy"
        };
    }

    // ---------- EXTRA STYLES ----------
    // These styles let us add features without changing style.css.

    function addAppStyles() {
        if (document.getElementById("ghost-weather-extra-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "ghost-weather-extra-styles";

        style.textContent = `
            #weather-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 25px;
                max-width: 680px;
            }

            .weather-search {
                display: flex;
                flex: 1 1 260px;
                min-width: 0;
                gap: 8px;
            }

            #city-search {
                width: 100%;
                min-width: 0;
                padding: 13px 16px;
                border: 1px solid rgba(219,235,255,.15);
                border-radius: 14px;
                background: #131e30;
                color: #f1f6ff;
                font: inherit;
                outline: none;
            }

            #city-search:focus {
                border-color: #a5d8ff;
                box-shadow: 0 0 0 3px rgba(165,216,255,.1);
            }

            #city-search::placeholder {
                color: #8fa3bd;
            }

            .weather-action {
                padding: 12px 15px;
                border: 1px solid rgba(219,235,255,.12);
                border-radius: 13px;
                background: #1a2940;
                color: #f1f6ff;
                font: inherit;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: background .2s, transform .2s, border-color .2s;
            }

            .weather-action:hover {
                background: #263c59;
                border-color: rgba(165,216,255,.4);
                transform: translateY(-1px);
            }

            .weather-action:focus-visible {
                outline: 2px solid #a5d8ff;
                outline-offset: 3px;
            }

            .weather-action:disabled {
                opacity: .55;
                cursor: wait;
                transform: none;
            }

            #weather-status {
                min-height: 22px;
                margin-top: 12px;
                color: #9eafc8;
                font-size: 12px;
            }

            .weather-details {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin-top: 15px;
            }

            .weather-stat {
                padding: 18px;
                min-width: 0;
                border: 1px solid rgba(219,235,255,.09);
                border-radius: 19px;
                background: rgba(19,30,48,.78);
            }

            .weather-stat-label {
                margin-bottom: 8px;
                color: #9eafc8;
                font-size: 12px;
            }

            .weather-stat-value {
                color: #f1f6ff;
                font-family: 'Nunito', sans-serif;
                font-size: 23px;
                font-weight: 800;
                overflow-wrap: anywhere;
            }

            #forecast.forecast-placeholder {
                padding: 20px;
                text-align: left;
            }

            .forecast-heading {
                margin: 10px 0 15px;
                color: #f1f6ff;
                font-family: 'Nunito', sans-serif;
                font-size: 18px;
                font-weight: 800;
            }

            .forecast-heading:first-child {
                margin-top: 0;
            }

            .hourly-list {
                display: grid;
                grid-auto-columns: minmax(91px, 1fr);
                grid-auto-flow: column;
                gap: 10px;
                overflow-x: auto;
                padding: 2px 2px 12px;
                scrollbar-width: thin;
                scrollbar-color: #405675 transparent;
            }

            .hour-card {
                display: flex;
                min-height: 132px;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 14px 8px;
                border: 1px solid rgba(219,235,255,.08);
                border-radius: 16px;
                background: rgba(255,255,255,.025);
            }

            .hour-time {
                color: #9eafc8;
                font-size: 11px;
            }

            .hour-icon {
                font-size: 25px;
            }

            .hour-temp {
                color: #f1f6ff;
                font-family: 'Nunito', sans-serif;
                font-size: 18px;
                font-weight: 800;
            }

            .hour-rain {
                color: #a5d8ff;
                font-size: 10px;
            }

            .daily-list {
                display: grid;
                gap: 0;
            }

            .day-card {
                display: grid;
                grid-template-columns: minmax(65px,1fr) 35px minmax(95px,1.5fr) 38px;
                align-items: center;
                gap: 10px;
                padding: 13px 3px;
                border-bottom: 1px solid rgba(219,235,255,.075);
            }

            .day-card:last-child {
                border-bottom: 0;
            }

            .day-name {
                color: #dbe8f7;
                font-size: 12px;
                font-weight: 600;
            }

            .day-icon {
                text-align: center;
                font-size: 20px;
            }

            .day-condition {
                overflow: hidden;
                color: #9eafc8;
                font-size: 10px;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .day-temps {
                color: #f1f6ff;
                font-size: 12px;
                font-weight: 700;
                text-align: right;
                white-space: nowrap;
            }

            .day-temps span {
                margin-left: 4px;
                color: #8294ad;
                font-weight: 500;
            }

            .forecast-source {
                margin-top: 18px;
                color: #8294ad;
                font-size: 10px;
                line-height: 1.6;
            }

            .forecast-source a {
                color: #a5d8ff;
            }

            .forecast-message {
                padding: 20px 5px;
                color: #b7c7dd;
                font-size: 13px;
                line-height: 1.7;
            }

            .forecast-message strong {
                color: #f1f6ff;
            }

            .weather-card[data-weather="rain"],
            .weather-card[data-weather="storm"] {
                background:
                    radial-gradient(ellipse at 85% 8%, rgba(100,160,220,.18), transparent 45%),
                    linear-gradient(135deg,#172b43,#101a2a 80%);
            }

            .weather-card[data-weather="snow"] {
                background:
                    radial-gradient(ellipse at 85% 8%, rgba(200,230,255,.2), transparent 45%),
                    linear-gradient(135deg,#21354d,#111c2e 80%);
            }

            .weather-card[data-weather="clear"] {
                background:
                    radial-gradient(ellipse at 85% 8%, rgba(255,216,140,.17), transparent 45%),
                    linear-gradient(135deg,#1a2f49,#111c2e 80%);
            }

            @media (max-width: 650px) {
                #weather-controls {
                    gap: 8px;
                }

                .weather-search {
                    flex-basis: 100%;
                }

                #city-search {
                    font-size: 14px;
                }

                .weather-action {
                    flex: 1 1 auto;
                }

                .weather-details {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .weather-stat {
                    padding: 15px;
                }

                .weather-stat-value {
                    font-size: 21px;
                }

                #forecast.forecast-placeholder {
                    padding: 15px;
                }

                .day-card {
                    grid-template-columns: 55px 28px minmax(65px, 1fr) auto;
                    gap: 6px;
                }

                .day-condition {
                    font-size: 9px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .weather-action {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ---------- CREATE CONTROLS ----------

    function createControls() {
        if (document.getElementById("weather-controls")) {
            return;
        }

        const subtitle = welcomeSection.querySelector(".subtitle");

        const controls = document.createElement("div");
        controls.id = "weather-controls";

        controls.innerHTML = `
            <form class="weather-search" id="weather-search-form">
                <input
                    id="city-search"
                    type="search"
                    placeholder="Search any city..."
                    aria-label="Search for a city"
                    autocomplete="off"
                    required
                >
                <button class="weather-action" type="submit">
                    Search
                </button>
            </form>

            <button
                class="weather-action"
                id="current-location-button"
                type="button"
            >
                ◎ My location
            </button>

            <button
                class="weather-action"
                id="temperature-unit-button"
                type="button"
                aria-label="Switch temperature unit"
            >
                °C / °F
            </button>
        `;

        if (subtitle) {
            subtitle.insertAdjacentElement("afterend", controls);
        } else {
            welcomeSection.appendChild(controls);
        }

        const status = document.createElement("p");
        status.id = "weather-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        controls.insertAdjacentElement("afterend", status);

        // Extra weather information cards
        if (!document.getElementById("weather-details")) {
            const details = document.createElement("section");
            details.className = "weather-details";
            details.id = "weather-details";
            details.setAttribute("aria-label", "Weather details");

            details.innerHTML = `
                <div class="weather-stat">
                    <p class="weather-stat-label">🌡️ Feels like</p>
                    <p class="weather-stat-value" id="feels-like">--</p>
                </div>

                <div class="weather-stat">
                    <p class="weather-stat-label">💧 Humidity</p>
                    <p class="weather-stat-value" id="humidity-value">--</p>
                </div>

                <div class="weather-stat">
                    <p class="weather-stat-label">🍃 Wind</p>
                    <p class="weather-stat-value" id="wind-value">--</p>
                </div>
            `;

            weatherCard.insertAdjacentElement("afterend", details);
        }
    }

    // ---------- TEMPERATURE HELPERS ----------

    function convertTemperature(celsius) {
        if (temperatureUnit === "F") {
            return (celsius * 9 / 5) + 32;
        }

        return celsius;
    }

    function formatTemperature(celsius) {
        if (typeof celsius !== "number" || !Number.isFinite(celsius)) {
            return "--°";
        }

        return `${Math.round(convertTemperature(celsius))}°${temperatureUnit}`;
    }

    // ---------- TIME HELPERS ----------

    function formatHour(dateTime) {
        const hour = Number(dateTime.slice(11, 13));
        const suffix = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;

        return `${displayHour} ${suffix}`;
    }

    function formatDay(dateString, index) {
        if (index === 0) return "Today";
        if (index === 1) return "Tomorrow";

        const date = new Date(`${dateString}T12:00:00`);

        return date.toLocaleDateString("en", {
            weekday: "short"
        });
    }

    // ---------- STATUS MESSAGES ----------

    function setStatus(message) {
        const status = document.getElementById("weather-status");

        if (status) {
            status.textContent = message;
        }
    }

    function setForecastMessage(message, title = "One moment...") {
        forecastElement.innerHTML = `
            <div class="forecast-message">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;
    }

    function setLoading(isLoading) {
        const searchButton = document.querySelector(
            '#weather-search-form button[type="submit"]'
        );
        const locationButton = document.getElementById(
            "current-location-button"
        );

        if (searchButton) {
            searchButton.disabled = isLoading;
            searchButton.textContent = isLoading ? "Loading..." : "Search";
        }

        if (locationButton) {
            locationButton.disabled = isLoading;
        }
    }

    // ---------- CITY SEARCH ----------

    async function searchCity(cityName) {
        const mySearchNumber = ++searchNumber;

        setLoading(true);
        setStatus(`Finding ${cityName}...`);
        setForecastMessage(
            "Our little frog is checking the skies.",
            "Fetching your forecast 🐸"
        );

        try {
            const params = new URLSearchParams({
                name: cityName,
                count: "5",
                language: "en",
                format: "json"
            });

            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?${params}`
            );

            if (!response.ok) {
                throw new Error("City search is temporarily unavailable.");
            }

            const result = await response.json();

            // Ignore an older search if a newer one was started.
            if (mySearchNumber !== searchNumber) return;

            if (!result.results || result.results.length === 0) {
                throw new Error(
                    `We couldn't find "${cityName}". Try a different spelling or nearby city.`
                );
            }

            const place = result.results[0];

            await loadWeather(
                {
                    latitude: place.latitude,
                    longitude: place.longitude
                },
                {
                    name: place.name,
                    region: place.admin1 || "",
                    country: place.country || "",
                    countryCode: place.country_code || ""
                },
                mySearchNumber
            );
        } catch (error) {
            if (mySearchNumber !== searchNumber) return;

            setStatus(error.message);
            setForecastMessage(
                "Check your internet connection or try another city.",
                "We couldn't load that forecast."
            );

            console.error("City search error:", error);
        } finally {
            if (mySearchNumber === searchNumber) {
                setLoading(false);
            }
        }
    }

    // ---------- LOAD LIVE WEATHER ----------

    async function loadWeather(coordinates, place, requestNumber) {
        const params = new URLSearchParams({
            latitude: String(coordinates.latitude),
            longitude: String(coordinates.longitude),
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "wind_speed_10m"
            ].join(","),
            hourly: [
                "temperature_2m",
                "precipitation_probability",
                "weather_code"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "uv_index_max"
            ].join(","),
            timezone: "auto",
            forecast_days: "7"
        });

        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?${params}`
            );

            if (!response.ok) {
                throw new Error("The weather service couldn't respond.");
            }

            const data = await response.json();

            if (requestNumber !== searchNumber) return;

            if (
                !data.current ||
                !data.hourly ||
                !data.daily ||
                !Array.isArray(data.hourly.time) ||
                !Array.isArray(data.daily.time)
            ) {
                throw new Error("The weather service returned incomplete data.");
            }

            latestWeather = data;
            latestPlace = place;

            renderWeather(data, place);
            setStatus(
                `Weather updated for ${place.name}. Forecast times use the location's local time.`
            );
        } catch (error) {
            if (requestNumber !== searchNumber) return;

            setStatus(error.message);
            setForecastMessage(
                "Check your internet connection and try searching again.",
                "The forecast couldn't load."
            );

            console.error("Weather loading error:", error);
            throw error;
        }
    }

    // ---------- RENDER CURRENT WEATHER ----------

    function renderWeather(data, place) {
        const current = data.current;
        const weatherInfo = getWeatherInfo(current.weather_code);

        const placeParts = [
            place.name,
            place.region,
            place.country
        ].filter(Boolean);

        locationElement.textContent = placeParts.join(", ");
        temperatureElement.textContent = formatTemperature(
            current.temperature_2m
        );

        conditionElement.textContent =
            `${weatherInfo.label} · ` +
            (current.is_day ? "Daytime" : "Nighttime");

        weatherCard.dataset.weather = weatherInfo.theme;

        if (frogElement) {
            // Keep the frog as the star while letting its weather
            // companions change with the forecast.
            const companion =
                current.weather_code >= 95 ? " ⛈️" :
                current.weather_code >= 51 ? " 🌧️" :
                current.weather_code >= 71 && current.weather_code <= 86
                    ? " ❄️" :
                current.weather_code >= 45 && current.weather_code <= 48
                    ? " 🌫️" :
                current.is_day ? " ☀️" : " 🌙";

            frogElement.textContent = `🐸${companion}`;
            frogElement.title = `Your frog says: ${weatherInfo.label}`;
        }

        if (noteElement) {
            const notes = {
                clear: "A little sunshine, a little peace. Enjoy your day. ☀️",
                cloudy: "A soft sky kind of day. Take things at your own pace. ☁️",
                fog: "A quiet, misty moment. Take it nice and slow. 🌫️",
                rain: "Rainy skies, cozy vibes. Maybe listen to the rain. 🌧️",
                snow: "A little winter magic in the air. Stay cozy. ❄️",
                storm: "Stormy skies outside. Stay somewhere safe indoors. ⛈️"
            };

            noteElement.textContent = notes[weatherInfo.theme] ||
                "Take a breath. You're right where you need to be.";
        }

        document.getElementById("feels-like").textContent =
            formatTemperature(current.apparent_temperature);

        document.getElementById("humidity-value").textContent =
            `${Math.round(current.relative_humidity_2m)}%`;

        document.getElementById("wind-value").textContent =
            `${Math.round(current.wind_speed_10m)} km/h`;

        renderForecast(data);
    }

    // ---------- RENDER HOURLY AND 7-DAY FORECAST ----------

    function renderForecast(data) {
        const hourly = data.hourly;
        const daily = data.daily;

        const currentTime = data.current.time || "";
        let startIndex = hourly.time.findIndex(
            time => time >= currentTime
        );

        if (startIndex < 0) {
            startIndex = 0;
        }

        const hourlyCards = hourly.time
            .slice(startIndex, startIndex + 12)
            .map((time, offset) => {
                const index = startIndex + offset;
                const info = getWeatherInfo(hourly.weather_code[index]);
                const chance = hourly.precipitation_probability?.[index];

                const rainLabel =
                    typeof chance === "number"
                        ? `${Math.round(chance)}% rain`
                        : "&nbsp;";

                return `
                    <div class="hour-card">
                        <p class="hour-time">${formatHour(time)}</p>
                        <span class="hour-icon" aria-hidden="true">
                            ${info.icon}
                        </span>
                        <p class="hour-temp">
                            ${formatTemperature(hourly.temperature_2m[index])}
                        </p>
                        <p class="hour-rain">${rainLabel}</p>
                    </div>
                `;
            })
            .join("");

        const dailyCards = daily.time
            .map((date, index) => {
                const info = getWeatherInfo(daily.weather_code[index]);

                const maxTemp = formatTemperature(
                    daily.temperature_2m_max[index]
                );

                const minTemp = formatTemperature(
                    daily.temperature_2m_min[index]
                );

                return `
                    <div class="day-card">
                        <span class="day-name">
                            ${formatDay(date, index)}
                        </span>

                        <span class="day-icon" aria-hidden="true">
                            ${info.icon}
                        </span>

                        <span class="day-condition" title="${info.label}">
                            ${info.label}
                        </span>

                        <span class="day-temps">
                            ${maxTemp}<span>${minTemp}</span>
                        </span>
                    </div>
                `;
            })
            .join("");

        forecastElement.innerHTML = `
            <h3 class="forecast-heading">The next few hours ☁️</h3>

            <div class="hourly-list">
                ${hourlyCards || "<p>No hourly forecast available.</p>"}
            </div>

            <h3 class="forecast-heading" style="margin-top:28px">
                Seven days with your frog 🐸
            </h3>

            <div class="daily-list">
                ${dailyCards || "<p>No daily forecast available.</p>"}
            </div>

            <p class="forecast-source">
                Weather data provided by
                <a href="https://open-meteo.com/" target="_blank"
                   rel="noopener noreferrer">Open-Meteo</a>.
                Forecasts are estimates and may change.
            </p>
        `;
    }

    // ---------- TEMPERATURE UNIT BUTTON ----------

    function setupUnitButton() {
        const unitButton = document.getElementById(
            "temperature-unit-button"
        );

        if (!unitButton) return;

        unitButton.addEventListener("click", () => {
            temperatureUnit = temperatureUnit === "C" ? "F" : "C";

            unitButton.textContent =
                temperatureUnit === "C" ? "°C / °F" : "°F / °C";

            unitButton.setAttribute(
                "aria-label",
                temperatureUnit === "C"
                    ? "Temperatures shown in Celsius. Switch to Fahrenheit."
                    : "Temperatures shown in Fahrenheit. Switch to Celsius."
            );

            if (latestWeather && latestPlace) {
                renderWeather(latestWeather, latestPlace);
            }
        });
    }

    // ---------- CURRENT LOCATION BUTTON ----------

    function setupLocationButton() {
        const locationButton = document.getElementById(
            "current-location-button"
        );

        if (!locationButton) return;

        locationButton.addEventListener("click", () => {
            if (!navigator.geolocation) {
                setStatus(
                    "Your browser does not support location. Search for your city instead."
                );
                return;
            }

            const mySearchNumber = ++searchNumber;

            setLoading(true);
            setStatus("Waiting for your location permission...");

            navigator.geolocation.getCurrentPosition(
                async position => {
                    if (mySearchNumber !== searchNumber) return;

                    const coordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    const place = {
                        name: "Your current location",
                        region: "",
                        country: ""
                    };

                    try {
                        await loadWeather(
                            coordinates,
                            place,
                            mySearchNumber
                        );
                    } catch (error) {
                        console.error(error);
                    } finally {
                        if (mySearchNumber === searchNumber) {
                            setLoading(false);
                        }
                    }
                },

                error => {
                    if (mySearchNumber !== searchNumber) return;

                    const messages = {
                        1: "Location permission was denied. You can search for your city instead.",
                        2: "Your location is unavailable. Check your device settings or search for a city.",
                        3: "Location lookup timed out. Please try again."
                    };

                    setStatus(
                        messages[error.code] ||
                        "Couldn't access your location. Please search for a city."
                    );

                    setLoading(false);
                },

                {
                    enableHighAccuracy: false,
                    timeout: 12000,
                    maximumAge: 300000
                }
            );
        });
    }

    // ---------- EVENT LISTENERS ----------

    function setupSearch() {
        const form = document.getElementById("weather-search-form");
        const input = document.getElementById("city-search");

        if (!form || !input) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            const cityName = input.value.trim();

            if (!cityName) {
                setStatus("Type a city name first.");
                input.focus();
                return;
            }

            if (cityName.length > 100) {
                setStatus("Please enter a shorter city name.");
                return;
            }

            searchCity(cityName);
        });
    }

    // ---------- START THE APP ----------

    function initializeWeatherApp() {
        addAppStyles();
        createControls();
        setupSearch();
        setupLocationButton();
        setupUnitButton();

        setForecastMessage(
            "Loading real weather data. Your frog is getting ready!",
            "Welcome to GhostVamp3000 Weather 🐸"
        );

        // Starting city; search for any other city whenever you like.
        const input = document.getElementById("city-search");

        if (input) {
            input.value = "Coimbatore";
        }

        searchCity("Coimbatore");
    }

    initializeWeatherApp();
})();
