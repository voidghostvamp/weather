
/* ==========================================
   GhostVamp3000 Weather — Cat Edition
   Weather API: Open-Meteo
   No API key required
   ========================================== */

"use strict";

/* 1. GET HTML ELEMENTS */

const elements = {
    searchForm: document.getElementById("search-form"),
    citySearch: document.getElementById("city-search"),
    searchButton: document.getElementById("search-button"),
    locationButton: document.getElementById("location-button"),
    unitToggle: document.getElementById("unit-toggle"),

    cityName: document.getElementById("city-name"),
    currentDate: document.getElementById("current-date"),
    currentTemperature: document.getElementById("current-temperature"),
    mainWeatherIcon: document.getElementById("main-weather-icon"),
    weatherCondition: document.getElementById("weather-condition"),
    feelsLikeTemperature: document.getElementById("feels-like-temperature"),
    highLowTemperature: document.getElementById("high-low-temperature"),

    humidityValue: document.getElementById("humidity-value"),
    windSpeedValue: document.getElementById("wind-speed-value"),
    windSpeedUnit: document.getElementById("wind-speed-unit"),
    rainChanceValue: document.getElementById("rain-chance-value"),
    detailFeelsLike: document.getElementById("detail-feels-like"),
    uvIndexValue: document.getElementById("uv-index-value"),
    visibilityValue: document.getElementById("visibility-value"),

    hourlyForecast: document.getElementById("hourly-forecast"),
    weeklyForecast: document.getElementById("weekly-forecast"),

    weatherScene: document.getElementById("weather-scene"),
    sceneSun: document.querySelector(".scene-sun"),
    sceneMoon: document.querySelector(".scene-moon"),
    sceneClouds: document.querySelector(".scene-clouds"),
    sceneEffects: document.getElementById("scene-weather-effects"),
    catMascot: document.getElementById("cat-mascot"),
    catMessage: document.getElementById("cat-message"),

    weatherAlerts: document.getElementById("weather-alerts"),
    alertContent: document.getElementById("alert-content"),
    loadingMessage: document.getElementById("loading-message"),
    errorMessage: document.getElementById("error-message")
};


/* 2. APPLICATION STATE */

let currentUnit = "C";
let latestWeatherData = null;
let latestLocationName = "Coimbatore";
let latestCoordinates = null;
let currentRequest = 0;


/* 3. WEATHER CODE INFORMATION */

function getWeatherInfo(code, isDay = true) {
    const weatherCodes = {
        0: {
            text: "Clear sky",
            dayIcon: "☀️",
            nightIcon: "🌙",
            type: "clear"
        },
        1: {
            text: "Mainly clear",
            dayIcon: "🌤️",
            nightIcon: "🌙",
            type: "clear"
        },
        2: {
            text: "Partly cloudy",
            dayIcon: "⛅",
            nightIcon: "☁️",
            type: "cloudy"
        },
        3: {
            text: "Overcast",
            dayIcon: "☁️",
            nightIcon: "☁️",
            type: "cloudy"
        },
        45: {
            text: "Foggy",
            dayIcon: "🌫️",
            nightIcon: "🌫️",
            type: "fog"
        },
        48: {
            text: "Depositing rime fog",
            dayIcon: "🌫️",
            nightIcon: "🌫️",
            type: "fog"
        },
        51: {
            text: "Light drizzle",
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            type: "rain"
        },
        53: {
            text: "Moderate drizzle",
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            type: "rain"
        },
        55: {
            text: "Dense drizzle",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        56: {
            text: "Light freezing drizzle",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        57: {
            text: "Dense freezing drizzle",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        61: {
            text: "Slight rain",
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            type: "rain"
        },
        63: {
            text: "Moderate rain",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        65: {
            text: "Heavy rain",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        66: {
            text: "Light freezing rain",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        67: {
            text: "Heavy freezing rain",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        71: {
            text: "Slight snowfall",
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            type: "snow"
        },
        73: {
            text: "Moderate snowfall",
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            type: "snow"
        },
        75: {
            text: "Heavy snowfall",
            dayIcon: "❄️",
            nightIcon: "❄️",
            type: "snow"
        },
        77: {
            text: "Snow grains",
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            type: "snow"
        },
        80: {
            text: "Slight rain showers",
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            type: "rain"
        },
        81: {
            text: "Moderate rain showers",
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            type: "rain"
        },
        82: {
            text: "Violent rain showers",
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            type: "storm"
        },
        85: {
            text: "Snow showers",
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            type: "snow"
        },
        86: {
            text: "Heavy snow showers",
            dayIcon: "❄️",
            nightIcon: "❄️",
            type: "snow"
        },
        95: {
            text: "Thunderstorm",
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            type: "storm"
        },
        96: {
            text: "Thunderstorm with hail",
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            type: "storm"
        },
        99: {
            text: "Thunderstorm with heavy hail",
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            type: "storm"
        }
    };

    return weatherCodes[code] || {
        text: "Weather unavailable",
        dayIcon: "🌤️",
        nightIcon: "🌙",
        type: "clear"
    };
}


/* 4. BASIC HELPERS */

function formatTemperature(value) {
    if (!Number.isFinite(Number(value))) {
        return "--°";
    }

    let temperature = Number(value);

    if (currentUnit === "F") {
        temperature = (temperature * 9 / 5) + 32;
    }

    return `${Math.round(temperature)}°`;
}


function getNumericValue(value, suffix = "") {
    if (value === null || value === undefined ||
        !Number.isFinite(Number(value))) {
        return "--";
    }

    return `${Math.round(Number(value))}${suffix}`;
}


function getHourFromTime(timeString) {
    const match = String(timeString).match(/T(\d{2}):/);

    return match ? Number(match[1]) : 0;
}


function formatHour(timeString, isCurrent = false) {
    if (isCurrent) {
        return "Now";
    }

    const hour = getHourFromTime(timeString);
    const twelveHour = hour % 12 || 12;
    const period = hour >= 12 ? "PM" : "AM";

    return `${twelveHour} ${period}`;
}


function formatDay(dateString, index) {
    if (index === 0) {
        return "Today";
    }

    if (index === 1) {
        return "Tomorrow";
    }

    const match = String(dateString).match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) {
        return `Day ${index + 1}`;
    }

    const date = new Date(
        Date.UTC(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            12
        )
    );

    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        timeZone: "UTC"
    }).format(date);
}


function getCurrentHourIndex(hourly, currentTime) {
    if (!hourly || !Array.isArray(hourly.time)) {
        return 0;
    }

    const exactIndex = hourly.time.indexOf(currentTime);

    if (exactIndex !== -1) {
        return exactIndex;
    }

    const nextIndex = hourly.time.findIndex(
        time => time >= currentTime
    );

    return nextIndex === -1 ? 0 : nextIndex;
}


function setLoading(isLoading) {
    elements.loadingMessage.hidden = !isLoading;

    elements.searchButton.disabled = isLoading;
    elements.searchButton.textContent = isLoading
        ? "Loading..."
        : "Search";
}


function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = false;
}


function clearError() {
    elements.errorMessage.textContent = "";
    elements.errorMessage.hidden = true;
}


/* 5. WEATHER API */

async function fetchWeather(latitude, longitude) {
    const parameters = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m"
        ].join(","),

        hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation_probability",
            "weather_code",
            "wind_speed_10m",
            "uv_index",
            "visibility"
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "uv_index_max",
            "sunrise",
            "sunset"
        ].join(","),

        timezone: "auto",
        forecast_days: "7",
        forecast_hours: "24",
        temperature_unit: "celsius",
        wind_speed_unit: "kmh"
    });

    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${parameters}`
    );

    if (!response.ok) {
        throw new Error(
            "The weather service could not be reached. Please try again."
        );
    }

    const data = await response.json();

    if (!data.current || !data.hourly || !data.daily) {
        throw new Error(
            "The weather service returned incomplete data. Please try again."
        );
    }

    return data;
}


/* 6. SEARCH FOR A CITY */

async function searchCity(cityName) {
    const name = cityName.trim();

    if (!name) {
        showError("Please enter a city name.");
        return;
    }

    const requestId = ++currentRequest;

    clearError();
    setLoading(true);

    try {
        const parameters = new URLSearchParams({
            name: name,
            count: "10",
            language: "en",
            format: "json"
        });

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?${parameters}`
        );

        if (!response.ok) {
            throw new Error(
                "Could not search for that city. Please try again."
            );
        }

        const result = await response.json();

        if (requestId !== currentRequest) {
            return;
        }

        if (!result.results || result.results.length === 0) {
            throw new Error(
                `No city found for "${name}". Check the spelling and try again.`
            );
        }

        // Prefer an exact city-name match when available.
        const city = result.results.find(
            item => item.name.toLowerCase() === name.toLowerCase()
        ) || result.results[0];

        const weather = await fetchWeather(
            city.latitude,
            city.longitude
        );

        if (requestId !== currentRequest) {
            return;
        }

        const placeParts = [
            city.name,
            city.admin1 && city.admin1 !== city.name
                ? city.admin1
                : null,
            city.country
        ].filter(Boolean);

        latestLocationName = [...new Set(placeParts)].join(", ");
        latestCoordinates = {
            latitude: city.latitude,
            longitude: city.longitude
        };

        latestWeatherData = weather;

        renderWeather(weather);

        elements.citySearch.value = "";
        clearError();

    } catch (error) {
        if (requestId === currentRequest) {
            showError(
                error.message ||
                "Something went wrong while loading the weather."
            );
        }
    } finally {
        if (requestId === currentRequest) {
            setLoading(false);
        }
    }
}


/* 7. USE MY LOCATION */

function useMyLocation() {
    if (!navigator.geolocation) {
        showError(
            "Your browser does not support location detection. Search for a city instead."
        );
        return;
    }

    const requestId = ++currentRequest;

    clearError();
    setLoading(true);

    elements.locationButton.disabled = true;
    elements.locationButton.textContent = "Finding location...";

    navigator.geolocation.getCurrentPosition(
        async position => {
            if (requestId !== currentRequest) {
                return;
            }

            try {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const weather = await fetchWeather(
                    latitude,
                    longitude
                );

                if (requestId !== currentRequest) {
                    return;
                }

                latestLocationName = "Your location";

                latestCoordinates = {
                    latitude,
                    longitude
                };

                latestWeatherData = weather;

                renderWeather(weather);
                clearError();

            } catch (error) {
                if (requestId === currentRequest) {
                    showError(
                        error.message ||
                        "Could not load weather for your location."
                    );
                }
            } finally {
                if (requestId === currentRequest) {
                    setLoading(false);
                    elements.locationButton.disabled = false;
                    elements.locationButton.innerHTML =
                        '<span aria-hidden="true">◎</span> Use my location';
                }
            }
        },

        error => {
            if (requestId !== currentRequest) {
                return;
            }

            let message = "Unable to get your location.";

            if (error.code === 1) {
                message =
                    "Location permission was denied. Allow location access in your browser or search for a city.";
            } else if (error.code === 2) {
                message =
                    "Your location is unavailable right now. Please try again or search for a city.";
            } else if (error.code === 3) {
                message =
                    "Location detection timed out. Please try again.";
            }

            showError(message);
            setLoading(false);

            elements.locationButton.disabled = false;
            elements.locationButton.innerHTML =
                '<span aria-hidden="true">◎</span> Use my location';
        },

        {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 300000
        }
    );
}


/* 8. RENDER ALL WEATHER INFORMATION */

function renderWeather(data) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    const currentCode = Number(current.weather_code);
    const isDay = Number(current.is_day) === 1;
    const info = getWeatherInfo(currentCode, isDay);

    const hourIndex = getCurrentHourIndex(
        hourly,
        current.time
    );

    const todayHigh = daily.temperature_2m_max[0];
    const todayLow = daily.temperature_2m_min[0];

    // City and date.
    elements.cityName.textContent = latestLocationName;

    const now = new Date();

    try {
        elements.currentDate.textContent =
            new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: data.timezone
            }).format(now);
    } catch {
        elements.currentDate.textContent = current.time.replace("T", " ");
    }

    // Current conditions.
    elements.currentTemperature.textContent =
        formatTemperature(current.temperature_2m);

    elements.mainWeatherIcon.textContent =
        isDay ? info.dayIcon : info.nightIcon;

    elements.weatherCondition.textContent = info.text;

    elements.feelsLikeTemperature.textContent =
        formatTemperature(current.apparent_temperature);

    elements.highLowTemperature.textContent =
        `H: ${formatTemperature(todayHigh)}  L: ${formatTemperature(todayLow)}`;

    // Weather details.
    elements.humidityValue.textContent =
        getNumericValue(current.relative_humidity_2m);

    elements.windSpeedValue.textContent =
        getNumericValue(current.wind_speed_10m);

    elements.rainChanceValue.textContent =
        getNumericValue(
            hourly.precipitation_probability[hourIndex]
        );

    elements.detailFeelsLike.textContent =
        formatTemperature(current.apparent_temperature);

    elements.uvIndexValue.textContent =
        getNumericValue(hourly.uv_index[hourIndex]);

    const visibility = hourly.visibility[hourIndex];

    elements.visibilityValue.textContent =
        Number.isFinite(Number(visibility))
            ? (Number(visibility) / 1000).toFixed(1)
            : "--";

    // Keep the button clear about the current unit.
    elements.unitToggle.textContent =
        currentUnit === "C" ? "°C / °F" : "°F / °C";

    elements.unitToggle.setAttribute(
        "aria-label",
        currentUnit === "C"
            ? "Temperatures are in Celsius. Switch to Fahrenheit."
            : "Temperatures are in Fahrenheit. Switch to Celsius."
    );

    // Update all forecast sections and the cat scene.
    renderHourlyForecast(hourly, hourIndex);
    renderWeeklyForecast(daily);
    updateWeatherScene(currentCode, isDay, info, hourly, hourIndex);
}


/* 9. HOURLY FORECAST */

function renderHourlyForecast(hourly, startIndex) {
    elements.hourlyForecast.replaceChildren();

    const availableHours = Math.min(
        24,
        hourly.time.length - startIndex
    );

    for (let offset = 0; offset < availableHours; offset++) {
        const index = startIndex + offset;

        const code = Number(hourly.weather_code[index]);
        const temperature = hourly.temperature_2m[index];

        // Use the current hour's day/night condition as a sensible
        // default for the forecast icons.
        const hour = getHourFromTime(hourly.time[index]);
        const isDay = hour >= 6 && hour < 18;

        const info = getWeatherInfo(code, isDay);

        const card = document.createElement("article");
        card.className = "hourly-card";

        const time = document.createElement("p");
        time.textContent = formatHour(
            hourly.time[index],
            offset === 0
        );

        const icon = document.createElement("span");
        icon.textContent = isDay ? info.dayIcon : info.nightIcon;
        icon.setAttribute("aria-hidden", "true");

        const temperatureText = document.createElement("p");
        temperatureText.textContent =
            formatTemperature(temperature);

        card.append(time, icon, temperatureText);
        elements.hourlyForecast.appendChild(card);
    }
}


/* 10. SEVEN-DAY FORECAST */

function renderWeeklyForecast(daily) {
    elements.weeklyForecast.replaceChildren();

    for (let index = 0; index < daily.time.length; index++) {
        const code = Number(daily.weather_code[index]);
        const info = getWeatherInfo(code, true);

        const card = document.createElement("article");
        card.className = "forecast-day";

        const dayName = document.createElement("p");
        dayName.className = "forecast-day-name";
        dayName.textContent = formatDay(daily.time[index], index);

        const icon = document.createElement("span");
        icon.textContent = info.dayIcon;
        icon.setAttribute("aria-hidden", "true");

        const condition = document.createElement("p");
        condition.className = "forecast-condition";
        condition.textContent = info.text;

        const temperatures = document.createElement("p");
        temperatures.className = "forecast-temperatures";

        const high = document.createElement("span");
        high.className = "forecast-high";
        high.textContent =
            formatTemperature(daily.temperature_2m_max[index]);

        const low = document.createElement("span");
        low.className = "forecast-low";
        low.textContent =
            formatTemperature(daily.temperature_2m_min[index]);

        temperatures.append(high, low);
        card.append(dayName, icon, condition, temperatures);

        elements.weeklyForecast.appendChild(card);
    }
}


/* 11. CAT WEATHER SCENE */

function updateWeatherScene(code, isDay, info, hourly, hourIndex) {
    const scene = elements.weatherScene;

    // Display either the sun or moon.
    elements.sceneSun.style.display = isDay ? "grid" : "none";
    elements.sceneMoon.style.display = isDay ? "none" : "grid";

    // Set the appearance of the scene based on current conditions.
    const scenes = {
        clearDay: "linear-gradient(180deg, #6f9fcd 0%, #a8c9e9 48%, #718bb4 100%)",
        clearNight: "linear-gradient(180deg, #11182f 0%, #29395b 52%, #414d70 100%)",
        cloudyDay: "linear-gradient(180deg, #839bb5 0%, #aab8ca 50%, #657992 100%)",
        cloudyNight: "linear-gradient(180deg, #252c43 0%, #414a62 55%, #303b52 100%)",
        rainyDay: "linear-gradient(180deg, #586b83 0%, #758ba2 50%, #485c75 100%)",
        rainyNight: "linear-gradient(180deg, #141c31 0%, #303e57 55%, #202c42 100%)",
        snowyDay: "linear-gradient(180deg, #a5bdd4 0%, #d2e0ed 55%, #859fbb 100%)",
        snowyNight: "linear-gradient(180deg, #1d2942 0%, #526883 55%, #33445e 100%)",
        stormDay: "linear-gradient(180deg, #343d53 0%, #535e76 55%, #283248 100%)",
        stormNight: "linear-gradient(180deg, #111625 0%, #262f48 55%, #202b41 100%)",
        fogDay: "linear-gradient(180deg, #8996a8 0%, #b8c0cc 55%, #77879b 100%)",
        fogNight: "linear-gradient(180deg, #333b4c 0%, #677184 55%, #40495a 100%)"
    };

    const sceneKey =
        info.type === "rain"
            ? (isDay ? "rainyDay" : "rainyNight")
            : info.type === "snow"
                ? (isDay ? "snowyDay" : "snowyNight")
                : info.type === "storm"
                    ? (isDay ? "stormDay" : "stormNight")
                    : info.type === "fog"
                        ? (isDay ? "fogDay" : "fogNight")
                        : info.type === "cloudy"
                            ? (isDay ? "cloudyDay" : "cloudyNight")
                            : (isDay ? "clearDay" : "clearNight");

    scene.style.background = scenes[sceneKey];

    // Make the cloud layer fit the weather.
    if (info.type === "clear") {
        elements.sceneClouds.style.opacity = "0.25";
    } else if (info.type === "cloudy" || info.type === "fog") {
        elements.sceneClouds.style.opacity = "0.95";
    } else {
        elements.sceneClouds.style.opacity = "0.75";
    }

    // Update the cat's message.
    const catMessages = {
        clear: [
            "Have a purr-fect day!",
            "Sunshine and cat naps!",
            "A wonderful day to explore!"
        ],
        cloudy: [
            "Cloud watching with me?",
            "A cozy day for a cat nap!",
            "The sky looks fluffy today!"
        ],
        rain: [
            "Rainy day? Stay cozy with me!",
            "Paws off the puddles!",
            "Let's watch the rain together!"
        ],
        snow: [
            "Brrr! Time to get cozy!",
            "Snowflakes are fascinating!",
            "Stay warm, my friend!"
        ],
        storm: [
            "Let's stay safe indoors!",
            "Thunder makes me want a nap!",
            "A cozy indoor day it is!"
        ],
        fog: [
            "Let's take it slowly today.",
            "A mysterious day outside!",
            "Stay safe in the fog!"
        ]
    };

    const messages = catMessages[info.type] || catMessages.clear;
    const messageIndex = new Date().getDate() % messages.length;

    elements.catMessage.textContent = messages[messageIndex];

    // Create lightweight animated weather particles.
    createWeatherEffects(info.type, isDay);

    // Keep the scene's accessible description updated.
    scene.setAttribute(
        "aria-label",
        `${info.text} weather scene with a cat mascot`
    );

    // The alerts area should not claim to provide official warnings.
    // Open-Meteo forecast data does not supply official local alerts.
    elements.weatherAlerts.hidden = true;
    elements.alertContent.textContent = "";

    // Keep unused arguments available for future scene improvements.
    void code;
    void hourly;
    void hourIndex;
}


/* 12. ANIMATED WEATHER PARTICLES */

function addParticleStyles() {
    if (document.getElementById("weather-particle-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "weather-particle-styles";

    style.textContent = `
        .weather-particle {
            position: absolute;
            pointer-events: none;
            will-change: transform, opacity;
        }

        .rain-particle {
            top: -14px;
            width: 2px;
            height: 14px;
            border-radius: 3px;
            background: rgba(220, 238, 255, 0.8);
            animation: cat-rain-fall 0.85s linear infinite;
        }

        .snow-particle {
            top: -12px;
            color: #ffffff;
            font-size: 12px;
            animation: cat-snow-fall 5s linear infinite;
            text-shadow: 0 0 7px rgba(255, 255, 255, 0.5);
        }

        .sun-particle {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 245, 194, 0.85);
            box-shadow: 0 0 10px rgba(255, 234, 164, 0.8);
            animation: cat-sun-drift 4s ease-in-out infinite alternate;
        }

        .fog-particle {
            left: -30%;
            width: 160%;
            height: 22px;
            border-radius: 50%;
            background: rgba(238, 245, 255, 0.13);
            filter: blur(8px);
            animation: cat-fog-drift 9s ease-in-out infinite alternate;
        }

        .lightning-flash {
            position: absolute;
            inset: 0;
            background: rgba(220, 235, 255, 0.8);
            opacity: 0;
            animation: cat-lightning 7s linear infinite;
            pointer-events: none;
        }

        @keyframes cat-rain-fall {
            from { transform: translate3d(0, -10px, 0); }
            to { transform: translate3d(-20px, 310px, 0); }
        }

        @keyframes cat-snow-fall {
            0% { transform: translate3d(0, -12px, 0) rotate(0deg); }
            100% { transform: translate3d(28px, 310px, 0) rotate(250deg); }
        }

        @keyframes cat-sun-drift {
            from { transform: translate3d(0, 0, 0); opacity: 0.2; }
            to { transform: translate3d(12px, 18px, 0); opacity: 0.9; }
        }

        @keyframes cat-fog-drift {
            from { transform: translateX(-8%); }
            to { transform: translateX(8%); }
        }

        @keyframes cat-lightning {
            0%, 91%, 94%, 97%, 100% { opacity: 0; }
            92%, 95% { opacity: 0.23; }
        }

        @media (prefers-reduced-motion: reduce) {
            .weather-particle,
            .lightning-flash {
                animation: none !important;
            }
        }
    `;

    document.head.appendChild(style);
}


function createWeatherEffects(type, isDay) {
    const container = elements.sceneEffects;

    container.replaceChildren();

    if (type === "rain") {
        for (let i = 0; i < 34; i++) {
            const particle = document.createElement("span");

            particle.className =
                "weather-particle rain-particle";

            particle.style.left = `${Math.random() * 105}%`;
            particle.style.animationDelay = `${Math.random() * -2}s`;
            particle.style.animationDuration =
                `${0.65 + Math.random() * 0.6}s`;

            container.appendChild(particle);
        }

    } else if (type === "snow") {
        for (let i = 0; i < 22; i++) {
            const particle = document.createElement("span");

            particle.className =
                "weather-particle snow-particle";

            particle.textContent = Math.random() > 0.5 ? "❄" : "·";
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * -5}s`;
            particle.style.animationDuration =
                `${3.5 + Math.random() * 4}s`;

            container.appendChild(particle);
        }

    } else if (type === "fog") {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement("span");

            particle.className =
                "weather-particle fog-particle";

            particle.style.top = `${25 + i * 13}%`;
            particle.style.animationDelay = `${i * -1.5}s`;
            particle.style.opacity = `${0.25 + Math.random() * 0.25}`;

            container.appendChild(particle);
        }

    } else if (type === "storm") {
        for (let i = 0; i < 24; i++) {
            const particle = document.createElement("span");

            particle.className =
                "weather-particle rain-particle";

            particle.style.left = `${Math.random() * 105}%`;
            particle.style.animationDelay = `${Math.random() * -2}s`;

            container.appendChild(particle);
        }

        const flash = document.createElement("span");
        flash.className = "lightning-flash";
        container.appendChild(flash);

    } else if (type === "clear" && isDay) {
        for (let i = 0; i < 11; i++) {
            const particle = document.createElement("span");

            particle.className =
                "weather-particle sun-particle";

            particle.style.left = `${Math.random() * 95}%`;
            particle.style.top = `${Math.random() * 65}%`;
            particle.style.animationDelay = `${Math.random() * -4}s`;

            container.appendChild(particle);
        }
    }
}


/* 13. CELSIUS / FAHRENHEIT SWITCH */

function toggleTemperatureUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";

    elements.unitToggle.textContent =
        currentUnit === "C" ? "°C / °F" : "°F / °C";

    if (latestWeatherData) {
        renderWeather(latestWeatherData);
    }
}


/* 14. EVENT LISTENERS */

elements.searchForm.addEventListener("submit", event => {
    event.preventDefault();
    searchCity(elements.citySearch.value);
});

elements.locationButton.addEventListener("click", useMyLocation);

elements.unitToggle.addEventListener("click", toggleTemperatureUnit);


/* 15. INITIALIZE THE APP */

function initializeWeatherApp() {
    addParticleStyles();

    elements.cityName.textContent = "Coimbatore";
    elements.loadingMessage.textContent =
        "Loading weather for Coimbatore...";

    // Automatically load the default city when the website opens.
    searchCity("Coimbatore");
}

initializeWeatherApp();
