
/* =========================================================
   ATMOS — Weather, at a glance
   Live weather powered by Open-Meteo
   No API key required for the basic forecast.
   ========================================================= */

"use strict";

/* 1. ELEMENTS */

const el = {
    searchForm: document.getElementById("search-form"),
    citySearch: document.getElementById("city-search"),
    searchButton: document.getElementById("search-button"),
    searchResults: document.getElementById("search-results"),
    searchHint: document.getElementById("search-hint"),

    locationButton: document.getElementById("location-button"),
    refreshButton: document.getElementById("refresh-button"),
    settingsButton: document.getElementById("settings-button"),
    settingsPanel: document.getElementById("settings-panel"),
    closeSettings: document.getElementById("close-settings"),

    unitCelsius: document.getElementById("unit-celsius"),
    unitFahrenheit: document.getElementById("unit-fahrenheit"),
    reducedMotionToggle: document.getElementById("reduced-motion-toggle"),

    favoritesList: document.getElementById("favorites-list"),
    manageFavorites: document.getElementById("manage-favorites"),
    favoriteToggle: document.getElementById("favorite-toggle"),

    cityName: document.getElementById("city-name"),
    countryName: document.getElementById("country-name"),
    localDate: document.getElementById("local-date"),
    currentTemperature: document.getElementById("current-temperature"),
    currentWeatherIcon: document.getElementById("current-weather-icon"),
    weatherDescription: document.getElementById("weather-description"),
    feelsLikeValue: document.getElementById("feels-like-value"),
    highTemperature: document.getElementById("high-temperature"),
    lowTemperature: document.getElementById("low-temperature"),

    sunriseTime: document.getElementById("sunrise-time"),
    sunsetTime: document.getElementById("sunset-time"),
    lastUpdated: document.getElementById("last-updated"),

    weatherScene: document.getElementById("weather-scene"),
    weatherSceneImage: document.getElementById("weather-scene-image"),
    sceneStars: document.getElementById("scene-stars"),
    sceneCloudLayer: document.getElementById("scene-cloud-layer"),
    sceneWeatherParticles: document.getElementById("scene-weather-particles"),
    sceneMist: document.getElementById("scene-mist"),
    sceneCaption: document.getElementById("scene-caption"),
    weatherMascot: document.getElementById("weather-mascot"),

    humidityValue: document.getElementById("humidity-value"),
    humidityDescription: document.getElementById("humidity-description"),
    windSpeedValue: document.getElementById("wind-speed-value"),
    windSpeedUnit: document.getElementById("wind-speed-unit"),
    windDirectionValue: document.getElementById("wind-direction-value"),
    visibilityValue: document.getElementById("visibility-value"),
    pressureValue: document.getElementById("pressure-value"),
    uvIndexValue: document.getElementById("uv-index-value"),
    uvDescription: document.getElementById("uv-description"),
    detailFeelsLike: document.getElementById("detail-feels-like"),

    hourlyForecast: document.getElementById("hourly-forecast"),
    dailyForecast: document.getElementById("daily-forecast"),

    rainChanceValue: document.getElementById("rain-chance-value"),
    rainDescription: document.getElementById("rain-description"),
    rainProbabilityTrack: document.getElementById("rain-probability-track"),
    rainProbabilityFill: document.getElementById("rain-probability-fill"),

    airQualitySection: document.getElementById("air-quality-section"),
    airQualityValue: document.getElementById("air-quality-value"),
    airQualityDescription: document.getElementById("air-quality-description"),

    loadingMessage: document.getElementById("loading-message"),
    errorMessage: document.getElementById("error-message"),
    errorDescription: document.getElementById("error-description"),
    retryButton: document.getElementById("retry-button")
};


/* 2. APPLICATION STATE */

const STORAGE_KEYS = {
    unit: "atmos-temperature-unit",
    favorites: "atmos-favorite-locations",
    lastPlace: "atmos-last-place",
    reducedMotion: "atmos-reduced-motion"
};

const state = {
    unit: "C",
    place: null,
    weather: null,
    favorites: [],
    managingFavorites: false,
    requestId: 0,
    searchTimer: null,
    searchController: null,
    lastFailedPlace: null
};


/* 3. GENERAL HELPERS */

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // The site continues working when storage is unavailable.
    }
}

function isFiniteNumber(value) {
    return value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value));
}

function numericValue(value, digits = 0) {
    if (!isFiniteNumber(value)) return "—";
    return Number(value).toFixed(digits);
}

function temperature(value) {
    if (!isFiniteNumber(value)) return "—°";

    let result = Number(value);

    if (state.unit === "F") {
        result = result * 9 / 5 + 32;
    }

    return `${Math.round(result)}°`;
}

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function makeSvgIcon(symbolId, label = "") {
    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", label ? "false" : "true");

    if (label) {
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", label);
    }

    const use = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use"
    );

    use.setAttribute("href", `#${symbolId}`);
    svg.appendChild(use);

    return svg;
}

function updateExistingIcon(svg, symbolId, label) {
    if (!svg) return;

    let use = svg.querySelector("use");

    if (!use) {
        use = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "use"
        );
        svg.appendChild(use);
    }

    use.setAttribute("href", `#${symbolId}`);
    svg.setAttribute("aria-label", label);
}

function setLoading(isLoading, message = "Gathering the latest weather for you...") {
    el.loadingMessage.hidden = !isLoading;

    const paragraph = el.loadingMessage.querySelector("p");
    if (paragraph) paragraph.textContent = message;

    el.searchButton.disabled = isLoading;
    el.refreshButton.disabled = isLoading;
}

function showError(message) {
    setLoading(false);

    setText(
        el.errorDescription,
        message || "Please check your connection and try again."
    );

    el.errorMessage.hidden = false;
}

function clearError() {
    el.errorMessage.hidden = true;
    setText(el.errorDescription, "");
}

function hideSearchResults() {
    el.searchResults.hidden = true;
    el.citySearch.setAttribute("aria-expanded", "false");
}

function localDateTime(timeZone) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone
        }).format(new Date());
    } catch {
        return new Date().toLocaleString();
    }
}

function formatClock(apiTime) {
    const match = String(apiTime || "").match(/T(\d{2}):(\d{2})/);

    if (!match) return "—";

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const clockHour = hour % 12 || 12;

    return `${clockHour}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDay(dateString, index) {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return `Day ${index + 1}`;

    const date = new Date(Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12
    ));

    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        timeZone: "UTC"
    }).format(date);
}

function fullDate(dateString) {
    const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return dateString;

    const date = new Date(Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12
    ));

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC"
    }).format(date);
}

function indexForCurrentHour(times, currentTime) {
    if (!Array.isArray(times) || !times.length) return 0;

    const target = String(currentTime || "").slice(0, 13);
    let answer = 0;

    for (let i = 0; i < times.length; i++) {
        if (String(times[i]).slice(0, 13) <= target) {
            answer = i;
        } else {
            break;
        }
    }

    return answer;
}

function compassDirection(degrees) {
    if (!isFiniteNumber(degrees)) return "Direction unavailable";

    const labels = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ];

    const index = Math.round(Number(degrees) / 22.5) % 16;

    return `${labels[index]} · ${Math.round(Number(degrees))}°`;
}

function humidityDescription(value) {
    if (!isFiniteNumber(value)) return "Relative humidity";
    if (value < 30) return "Dry air";
    if (value < 60) return "Moderate moisture";
    if (value < 75) return "Humid conditions";
    return "Very humid conditions";
}

function uvDescription(value) {
    if (!isFiniteNumber(value)) return "UV data unavailable";

    const uv = Number(value);

    if (uv <= 2) return "Low UV";
    if (uv <= 5) return "Moderate UV";
    if (uv <= 7) return "High UV";
    if (uv <= 10) return "Very high UV";

    return "Extreme UV";
}

function rainDescription(value) {
    if (!isFiniteNumber(value)) {
        return "Precipitation probability unavailable";
    }

    const chance = Number(value);

    if (chance < 20) return "Low chance of precipitation";
    if (chance < 50) return "Some chance of precipitation";
    if (chance < 75) return "Rain is possible";
    return "High chance of precipitation";
}


/* 4. WEATHER CONDITIONS AND ICONS */

function getWeatherInfo(code, isDay = true) {
    const number = Number(code);

    if (number === 0) {
        return {
            description: "Clear sky",
            type: "clear",
            icon: isDay ? "icon-sun" : "icon-moon"
        };
    }

    if (number === 1) {
        return {
            description: "Mainly clear",
            type: "clear",
            icon: isDay ? "icon-cloud-sun" : "icon-moon"
        };
    }

    if (number === 2) {
        return {
            description: "Partly cloudy",
            type: "cloudy",
            icon: isDay ? "icon-cloud-sun" : "icon-cloud"
        };
    }

    if (number === 3) {
        return {
            description: "Overcast",
            type: "cloudy",
            icon: "icon-cloud"
        };
    }

    if (number === 45 || number === 48) {
        return {
            description: number === 45 ? "Fog" : "Depositing rime fog",
            type: "fog",
            icon: "icon-cloud-fog"
        };
    }

    const descriptions = {
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    };

    if (number in descriptions) {
        if ([95, 96, 99].includes(number)) {
            return {
                description: descriptions[number],
                type: "storm",
                icon: "icon-cloud-storm"
            };
        }

        if ([71, 73, 75, 77, 85, 86].includes(number)) {
            return {
                description: descriptions[number],
                type: "snow",
                icon: "icon-cloud-snow"
            };
        }

        return {
            description: descriptions[number],
            type: "rain",
            icon: "icon-cloud-rain"
        };
    }

    return {
        description: "Conditions unavailable",
        type: "clear",
        icon: isDay ? "icon-cloud-sun" : "icon-moon"
    };
}


/* 5. API REQUESTS */

async function fetchJson(url, signal) {
    const response = await fetch(url, {
        signal,
        headers: {
            Accept: "application/json"
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The weather service returned an unreadable response.");
    }

    if (!response.ok || data.error) {
        throw new Error(
            data.reason ||
            data.message ||
            `Weather service request failed (${response.status}).`
        );
    }

    return data;
}

async function searchLocations(query, signal) {
    const params = new URLSearchParams({
        name: query,
        count: "8",
        language: "en",
        format: "json"
    });

    const data = await fetchJson(
        `https://geocoding-api.open-meteo.com/v1/search?${params}`,
        signal
    );

    return Array.isArray(data.results) ? data.results : [];
}

async function fetchForecast(place) {
    const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "pressure_msl",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m"
        ].join(","),

        hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation_probability",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "uv_index",
            "visibility",
            "surface_pressure"
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

        temperature_unit: "celsius",
        wind_speed_unit: "kmh",
        timezone: "auto",
        forecast_days: "7"
    });

    const data = await fetchJson(
        `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (
        !data.current ||
        !data.hourly ||
        !data.daily ||
        !Array.isArray(data.hourly.time) ||
        !Array.isArray(data.daily.time)
    ) {
        throw new Error("The weather service returned incomplete forecast data.");
    }

    return data;
}

async function fetchAirQuality(place, requestId) {
    const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        hourly: "us_aqi,european_aqi,pm2_5",
        timezone: "auto",
        forecast_days: "2"
    });

    try {
        const data = await fetchJson(
            `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`
        );

        if (
            requestId !== state.requestId ||
            !data.hourly ||
            !Array.isArray(data.hourly.time)
        ) {
            return;
        }

        const currentTime = state.weather?.current?.time;
        const index = indexForCurrentHour(data.hourly.time, currentTime);

        const usAqi = data.hourly.us_aqi?.[index];
        const euAqi = data.hourly.european_aqi?.[index];
        const pm25 = data.hourly.pm2_5?.[index];

        const aqi = isFiniteNumber(usAqi) ? Number(usAqi) : euAqi;

        if (!isFiniteNumber(aqi)) {
            setAirQualityUnavailable();
            return;
        }

        const rounded = Math.round(Number(aqi));
        let category;
        let qualityClass;

        if (rounded <= 50) {
            category = "Good";
            qualityClass = "good";
        } else if (rounded <= 100) {
            category = "Moderate";
            qualityClass = "moderate";
        } else if (rounded <= 150) {
            category = "Unhealthy for sensitive groups";
            qualityClass = "moderate";
        } else if (rounded <= 200) {
            category = "Unhealthy";
            qualityClass = "poor";
        } else if (rounded <= 300) {
            category = "Very unhealthy";
            qualityClass = "unhealthy";
        } else {
            category = "Hazardous";
            qualityClass = "unhealthy";
        }

        setText(el.airQualityValue, String(rounded));

        const extra = isFiniteNumber(pm25)
            ? ` · PM2.5 ${numericValue(pm25, 1)} µg/m³`
            : "";

        setText(
            el.airQualityDescription,
            `${category}${extra}`
        );

        el.airQualitySection.dataset.quality = qualityClass;

    } catch {
        if (requestId === state.requestId) {
            setAirQualityUnavailable();
        }
    }
}

function setAirQualityUnavailable() {
    setText(el.airQualityValue, "—");
    setText(el.airQualityDescription, "Air quality data unavailable");
    delete el.airQualitySection.dataset.quality;
}


/* 6. LOCATION SEARCH AND AUTOCOMPLETE */

function locationLabel(place) {
    return [
        place.name,
        place.admin1 && place.admin1 !== place.name ? place.admin1 : "",
        place.country || ""
    ].filter(Boolean).join(", ");
}

function normalisePlace(place) {
    const latitude = Number(place.latitude ?? place.lat);
    const longitude = Number(place.longitude ?? place.lon);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new Error("That location has invalid coordinates.");
    }

    return {
        name: String(place.name || "Selected location"),
        admin1: String(place.admin1 || ""),
        country: String(place.country || ""),
        latitude,
        longitude,
        timezone: String(place.timezone || "")
    };
}

function renderSearchResults(results) {
    el.searchResults.replaceChildren();

    if (!results.length) {
        const li = document.createElement("li");
        li.textContent = "No matching locations found.";
        li.style.color = "var(--muted)";
        li.style.fontSize = "12px";
        el.searchResults.appendChild(li);
        el.searchResults.hidden = false;
        el.citySearch.setAttribute("aria-expanded", "true");
        return;
    }

    results.forEach((place, index) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result";

        const name = document.createElement("span");
        name.className = "search-result-name";
        name.textContent = place.name;

        const detail = document.createElement("span");
        detail.className = "search-result-detail";
        detail.textContent = [
            place.admin1 && place.admin1 !== place.name ? place.admin1 : "",
            place.country || ""
        ].filter(Boolean).join(", ");

        button.append(name, detail);

        button.addEventListener("click", () => {
            hideSearchResults();
            if (state.searchController) {
                state.searchController.abort();
            }
            el.citySearch.value = "";
            loadPlace(place, { remember: true });
        });

        li.appendChild(button);
        el.searchResults.appendChild(li);
    });

    el.searchResults.hidden = false;
    el.citySearch.setAttribute("aria-expanded", "true");
}

async function updateSearchSuggestions() {
    const query = el.citySearch.value.trim();

    if (query.length < 2) {
        hideSearchResults();
        setText(el.searchHint, "Discover weather anywhere in the world.");
        return;
    }

    if (state.searchController) {
        state.searchController.abort();
    }

    const controller = new AbortController();
    state.searchController = controller;

    try {
        const results = await searchLocations(query, controller.signal);

        if (
            controller.signal.aborted ||
            query !== el.citySearch.value.trim()
        ) {
            return;
        }

        renderSearchResults(results);

        setText(
            el.searchHint,
            results.length
                ? "Choose a matching location or press Search."
                : "Try checking the spelling or searching a nearby city."
        );

    } catch (error) {
        if (error.name === "AbortError") return;

        hideSearchResults();
        setText(
            el.searchHint,
            "Suggestions are unavailable. You can still try Search."
        );
    }
}

async function handleSearchSubmit(event) {
    event.preventDefault();

    const query = el.citySearch.value.trim();
    if (!query) return;

    if (state.searchController) {
        state.searchController.abort();
    }

    if (state.searchTimer) {
        clearTimeout(state.searchTimer);
    }

    hideSearchResults();
    clearError();
    setLoading(true, `Searching for ${query}...`);

    const requestId = ++state.requestId;
    state.lastFailedPlace = null;

    try {
        const results = await searchLocations(query);

        if (requestId !== state.requestId) return;

        if (!results.length) {
            throw new Error(
                `No location named "${query}" was found. Try another spelling.`
            );
        }

        const exactMatch = results.find(
            item => String(item.name).toLowerCase() === query.toLowerCase()
        );

        const chosen = exactMatch || results[0];

        await loadPlace(chosen, {
            remember: true,
            existingRequestId: requestId
        });

    } catch (error) {
        if (requestId !== state.requestId) return;

        setLoading(false);
        showError(error.message || "We couldn't search for that location.");
    }
}


/* 7. LOAD A PLACE */

async function loadPlace(place, options = {}) {
    const requestId = options.existingRequestId ?? ++state.requestId;
    const remember = options.remember !== false;

    let normalised;

    try {
        normalised = normalisePlace(place);
    } catch (error) {
        showError(error.message);
        return;
    }

    state.lastFailedPlace = normalised;

    clearError();
    setLoading(true, `Getting the weather for ${normalised.name}...`);

    try {
        const data = await fetchForecast(normalised);

        if (requestId !== state.requestId) return;

        state.place = normalised;
        state.weather = data;

        renderWeather(data, normalised);
        renderFavorites();
        updateFavoriteButton();

        if (remember && normalised.name !== "Current location") {
            writeStorage(STORAGE_KEYS.lastPlace, normalised);
        }

        setText(el.searchHint, "Discover weather anywhere in the world.");
        clearError();

        // Air quality is optional. A failure here must not break the forecast.
        void fetchAirQuality(normalised, requestId);

    } catch (error) {
        if (requestId !== state.requestId) return;

        showError(
            error.message ||
            "We couldn't load the weather. Check your connection and try again."
        );

    } finally {
        if (requestId === state.requestId) {
            setLoading(false);
        }
    }
}


/* 8. RENDER CURRENT WEATHER */

function renderWeather(data, place) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    const isDay = Number(current.is_day) === 1;
    const info = getWeatherInfo(current.weather_code, isDay);

    const hourIndex = indexForCurrentHour(
        hourly.time,
        current.time
    );

    setText(el.cityName, place.name);

    setText(
        el.countryName,
        [
            place.admin1 && place.admin1 !== place.name ? place.admin1 : "",
            place.country
        ].filter(Boolean).join(", ") || "Local forecast"
    );

    setText(el.localDate, localDateTime(data.timezone || "UTC"));

    setText(
        el.currentTemperature,
        temperature(current.temperature_2m)
    );

    updateExistingIcon(
        el.currentWeatherIcon,
        info.icon,
        info.description
    );

    setText(el.weatherDescription, info.description);

    setText(
        el.feelsLikeValue,
        temperature(current.apparent_temperature)
    );

    setText(
        el.highTemperature,
        temperature(daily.temperature_2m_max?.[0])
    );

    setText(
        el.lowTemperature,
        temperature(daily.temperature_2m_min?.[0])
    );

    setText(
        el.sunriseTime,
        formatClock(daily.sunrise?.[0])
    );

    setText(
        el.sunsetTime,
        formatClock(daily.sunset?.[0])
    );

    setText(
        el.lastUpdated,
        `Updated at ${formatClock(current.time)} local time`
    );

    // Weather detail cards.
    setText(el.humidityValue, numericValue(current.relative_humidity_2m));
    setText(
        el.humidityDescription,
        humidityDescription(current.relative_humidity_2m)
    );

    setText(el.windSpeedValue, numericValue(current.wind_speed_10m));
    setText(el.windSpeedUnit, "km/h");

    setText(
        el.windDirectionValue,
        compassDirection(current.wind_direction_10m)
    );

    const visibility = hourly.visibility?.[hourIndex];

    setText(
        el.visibilityValue,
        isFiniteNumber(visibility)
            ? (Number(visibility) / 1000).toFixed(1)
            : "—"
    );

    const pressure =
        current.surface_pressure ??
        current.pressure_msl ??
        hourly.surface_pressure?.[hourIndex];

    setText(el.pressureValue, numericValue(pressure));

    const uvValue = hourly.uv_index?.[hourIndex] ?? daily.uv_index_max?.[0];

    setText(el.uvIndexValue, numericValue(uvValue, 1));
    setText(el.uvDescription, uvDescription(uvValue));

    setText(
        el.detailFeelsLike,
        temperature(current.apparent_temperature)
    );

    // Current-hour precipitation chance.
    const rainChance = hourly.precipitation_probability?.[hourIndex];

    setText(
        el.rainChanceValue,
        isFiniteNumber(rainChance) ? String(Math.round(rainChance)) : "—"
    );

    setText(el.rainDescription, rainDescription(rainChance));

    const progress = isFiniteNumber(rainChance)
        ? Math.min(100, Math.max(0, Number(rainChance)))
        : 0;

    el.rainProbabilityFill.style.width = `${progress}%`;
    el.rainProbabilityTrack.setAttribute("aria-valuenow", String(progress));

    renderHourlyForecast(hourly, hourIndex);
    renderDailyForecast(daily);
    updateWeatherScene(info, isDay);
    updateUnitButtons();
}


/* 9. HOURLY FORECAST */

function renderHourlyForecast(hourly, startIndex) {
    el.hourlyForecast.replaceChildren();

    const count = Math.min(24, hourly.time.length - startIndex);

    if (count <= 0) {
        showForecastPlaceholder(
            el.hourlyForecast,
            "Hourly forecast is not available right now."
        );
        return;
    }

    for (let offset = 0; offset < count; offset++) {
        const index = startIndex + offset;

        const time = hourly.time[index];
        const hour = Number(String(time).slice(11, 13));
        const isDay = hour >= 6 && hour < 18;

        const info = getWeatherInfo(
            hourly.weather_code[index],
            isDay
        );

        const card = document.createElement("article");
        card.className = "hourly-card";

        if (offset === 0) card.classList.add("is-current");

        const timeLabel = document.createElement("p");
        timeLabel.textContent = offset === 0 ? "Now" : formatClock(time);

        const icon = makeSvgIcon(info.icon, info.description);
        icon.classList.add("hourly-icon");

        const temp = document.createElement("p");
        temp.className = "hour-temperature";
        temp.textContent = temperature(hourly.temperature_2m[index]);

        const rain = document.createElement("p");
        rain.className = "precipitation";

        const chance = hourly.precipitation_probability?.[index];

        rain.textContent = isFiniteNumber(chance)
            ? `${Math.round(chance)}% rain`
            : "—";

        card.append(timeLabel, icon, temp, rain);
        el.hourlyForecast.appendChild(card);
    }
}


/* 10. SEVEN-DAY FORECAST */

function renderDailyForecast(daily) {
    el.dailyForecast.replaceChildren();

    const count = Math.min(7, daily.time.length);

    if (!count) {
        showForecastPlaceholder(
            el.dailyForecast,
            "The daily forecast is not available right now."
        );
        return;
    }

    for (let index = 0; index < count; index++) {
        const row = document.createElement("article");
        row.className = "daily-row";

        if (index === 0) row.classList.add("is-today");

        const day = document.createElement("p");
        day.className = "daily-day";
        day.textContent = formatDay(daily.time[index], index);

        const info = getWeatherInfo(daily.weather_code[index], true);
        const icon = makeSvgIcon(info.icon, info.description);
        icon.classList.add("daily-icon");

        const description = document.createElement("p");
        description.className = "daily-condition";

        const chance = daily.precipitation_probability_max?.[index];

        description.textContent = isFiniteNumber(chance)
            ? `${info.description} · ${Math.round(chance)}% rain`
            : info.description;

        const temperatures = document.createElement("p");
        temperatures.className = "daily-temperatures";

        const high = document.createElement("span");
        high.className = "daily-high";
        high.textContent = temperature(daily.temperature_2m_max[index]);

        const low = document.createElement("span");
        low.className = "daily-low";
        low.textContent = temperature(daily.temperature_2m_min[index]);

        temperatures.append(high, low);
        row.append(day, icon, description, temperatures);

        el.dailyForecast.appendChild(row);
    }
}

function showForecastPlaceholder(container, message) {
    const paragraph = document.createElement("p");
    paragraph.className = "forecast-placeholder";
    paragraph.textContent = message;
    container.replaceChildren(paragraph);
}


/* 11. WEATHER-REACTIVE PHOTOGRAPHIC SCENE */

function updateWeatherScene(info, isDay) {
    const scene = el.weatherScene;
    const image = el.weatherSceneImage;

    const weatherTypes = [
        "clear", "cloudy", "rain", "storm", "snow", "fog", "night"
    ];

    weatherTypes.forEach(type => {
        scene.classList.remove(`weather-${type}`);
    });

    [
        "scene-sunny",
        "scene-cloudy",
        "scene-rainy",
        "scene-stormy",
        "scene-snowy",
        "scene-foggy",
        "scene-night"
    ].forEach(className => scene.classList.remove(className));

    scene.classList.add(`weather-${info.type}`);

    const sceneClass = {
        clear: "scene-sunny",
        cloudy: "scene-cloudy",
        rain: "scene-rainy",
        storm: "scene-stormy",
        snow: "scene-snowy",
        fog: "scene-foggy"
    }[info.type] || "scene-sunny";

    scene.classList.add(sceneClass);

    if (!isDay) {
        scene.classList.add("weather-night", "scene-night");
    }

    const sceneDataKey = {
        clear: "sceneClear",
        cloudy: "sceneCloudy",
        rain: "sceneRain",
        storm: "sceneStorm",
        snow: "sceneSnow",
        fog: "sceneFog"
    }[info.type] || "sceneClear";

    const selectedImage = (!isDay && info.type === "clear")
        ? image.dataset.sceneNight
        : image.dataset[sceneDataKey];

    if (selectedImage && image.getAttribute("src") !== selectedImage) {
        image.style.opacity = "0";
        image.setAttribute("src", selectedImage);
    }

    image.alt =
        `${info.description} weather landscape` +
        (state.place?.name ? ` near ${state.place.name}` : "");

    setText(
        el.sceneCaption,
        `${info.description} · ${isDay ? "Daytime" : "Nighttime"} atmosphere`
    );

    renderSceneClouds(info.type);
    renderSceneStars(isDay);
    renderSceneParticles(info.type);
    updateMascot(info.type, isDay);
}

function renderSceneClouds(type) {
    el.sceneCloudLayer.replaceChildren();

    const count = type === "clear" ? 1 : type === "cloudy" ? 4 : 2;

    for (let i = 0; i < count; i++) {
        const cloud = document.createElement("span");
        cloud.className = "scene-cloud";

        cloud.style.top = `${12 + (i % 4) * 13}%`;
        cloud.style.left = `${-15 + i * 23}%`;
        cloud.style.animationDelay = `${-i * 7}s`;
        cloud.style.animationDuration = `${27 + i * 5}s`;

        if (type === "clear") cloud.style.opacity = "0.3";
        if (type === "rain" || type === "storm") cloud.style.opacity = "0.38";
        if (type === "fog") cloud.style.opacity = "0.18";

        el.sceneCloudLayer.appendChild(cloud);
    }
}

function renderSceneStars(isDay) {
    el.sceneStars.replaceChildren();

    if (isDay) return;

    const reduced = document.body.classList.contains("reduce-motion");
    const count = reduced ? 8 : 22;

    for (let i = 0; i < count; i++) {
        const star = document.createElement("span");
        star.className = "scene-star";

        star.style.top = `${5 + Math.random() * 58}%`;
        star.style.left = `${3 + Math.random() * 94}%`;
        star.style.animationDelay = `${Math.random() * -4}s`;

        el.sceneStars.appendChild(star);
    }
}

function renderSceneParticles(type) {
    const container = el.sceneWeatherParticles;
    container.replaceChildren();

    el.sceneMist.replaceChildren();

    const reduced = document.body.classList.contains("reduce-motion");

    const rainCount = reduced ? 8 : 42;
    const snowCount = reduced ? 7 : 25;

    if (type === "rain" || type === "storm") {
        for (let i = 0; i < rainCount; i++) {
            const drop = document.createElement("span");
            drop.className = "weather-particle rain-particle";

            drop.style.left = `${Math.random() * 104}%`;
            drop.style.animationDelay = `${Math.random() * -2}s`;
            drop.style.animationDuration =
                `${0.65 + Math.random() * 0.65}s`;

            container.appendChild(drop);
        }
    }

    if (type === "snow") {
        for (let i = 0; i < snowCount; i++) {
            const flake = document.createElement("span");
            flake.className = "weather-particle snow-particle";

            const size = 3 + Math.random() * 4;

            flake.style.width = `${size}px`;
            flake.style.height = `${size}px`;
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.animationDelay = `${Math.random() * -7}s`;
            flake.style.animationDuration =
                `${4 + Math.random() * 4}s`;

            container.appendChild(flake);
        }
    }

    if (type === "fog") {
        const count = reduced ? 2 : 5;

        for (let i = 0; i < count; i++) {
            const band = document.createElement("span");
            band.className = "fog-band";

            band.style.top = `${22 + i * 14}%`;
            band.style.animationDelay = `${i * -2}s`;

            el.sceneMist.appendChild(band);
        }
    }

    if (type === "storm" && !reduced) {
        const flash = document.createElement("span");
        flash.className = "storm-flash";
        container.appendChild(flash);
    }
}

function updateMascot(type, isDay) {
    // The mascot remains small and supporting. The environment is the focus.
    const mascot = el.weatherMascot;

    mascot.classList.toggle("scene-rainy", type === "rain" || type === "storm");
    mascot.classList.toggle("scene-night", !isDay);

    if (type === "snow" || (!isDay && type === "clear")) {
        mascot.style.opacity = "0.88";
    } else {
        mascot.style.opacity = "1";
    }
}

el.weatherSceneImage.addEventListener("load", () => {
    el.weatherSceneImage.style.opacity = "1";
    el.weatherScene.classList.remove("image-failed");
});

el.weatherSceneImage.addEventListener("error", () => {
    el.weatherSceneImage.style.opacity = "0.08";
    el.weatherScene.classList.add("image-failed");
});


/* 12. CELSIUS AND FAHRENHEIT */

function updateUnitButtons() {
    const isCelsius = state.unit === "C";

    el.unitCelsius.setAttribute("aria-pressed", String(isCelsius));
    el.unitFahrenheit.setAttribute("aria-pressed", String(!isCelsius));
}

function changeUnit(unit) {
    if (unit !== "C" && unit !== "F") return;

    state.unit = unit;
    writeStorage(STORAGE_KEYS.unit, unit);

    updateUnitButtons();

    if (state.weather && state.place) {
        renderWeather(state.weather, state.place);
    }
}

el.unitCelsius.addEventListener("click", () => changeUnit("C"));
el.unitFahrenheit.addEventListener("click", () => changeUnit("F"));


/* 13. SAVED LOCATIONS */

function samePlace(a, b) {
    if (!a || !b) return false;

    return (
        Math.abs(Number(a.latitude) - Number(b.latitude)) < 0.01 &&
        Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.01
    );
}

function isFavorite(place) {
    return state.favorites.some(saved => samePlace(saved, place));
}

function updateFavoriteButton() {
    const saved = Boolean(state.place && isFavorite(state.place));

    el.favoriteToggle.setAttribute("aria-pressed", String(saved));

    el.favoriteToggle.setAttribute(
        "aria-label",
        saved ? "Remove this location from saved places" : "Save this location"
    );

    el.favoriteToggle.title = saved ? "Remove saved location" : "Save location";
}

function saveFavorites() {
    writeStorage(STORAGE_KEYS.favorites, state.favorites);
}

function renderFavorites() {
    el.favoritesList.replaceChildren();

    el.manageFavorites.textContent =
        state.managingFavorites ? "Done" : "Manage";

    el.manageFavorites.setAttribute(
        "aria-expanded",
        String(state.managingFavorites)
    );

    if (!state.favorites.length) {
        const empty = document.createElement("p");
        empty.textContent = "Save a place using the star beside its name.";
        empty.style.color = "var(--muted)";
        empty.style.fontSize = "11px";
        el.favoritesList.appendChild(empty);
        return;
    }

    state.favorites.forEach(place => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "favorite-location";
        button.textContent = state.managingFavorites
            ? `${place.name} — Remove`
            : place.name;

        const active = state.place && samePlace(state.place, place);

        if (active) {
            button.classList.add("is-active");
            button.setAttribute("aria-current", "true");
        }

        button.addEventListener("click", () => {
            if (state.managingFavorites) {
                state.favorites = state.favorites.filter(
                    item => !samePlace(item, place)
                );

                saveFavorites();
                renderFavorites();
                updateFavoriteButton();
                return;
            }

            loadPlace(place, { remember: true });
        });

        el.favoritesList.appendChild(button);
    });
}

function toggleFavorite() {
    if (!state.place) return;

    if (isFavorite(state.place)) {
        state.favorites = state.favorites.filter(
            place => !samePlace(place, state.place)
        );
    } else {
        state.favorites.unshift({
            name: state.place.name,
            admin1: state.place.admin1,
            country: state.place.country,
            latitude: state.place.latitude,
            longitude: state.place.longitude
        });

        // Keep the list manageable.
        state.favorites = state.favorites.slice(0, 10);
    }

    saveFavorites();
    renderFavorites();
    updateFavoriteButton();
}

el.favoriteToggle.addEventListener("click", toggleFavorite);

el.manageFavorites.addEventListener("click", () => {
    state.managingFavorites = !state.managingFavorites;
    renderFavorites();
});


/* 14. SETTINGS */

function openSettings() {
    el.settingsPanel.hidden = false;
    el.settingsButton.setAttribute("aria-expanded", "true");
}

function closeSettings() {
    el.settingsPanel.hidden = true;
    el.settingsButton.setAttribute("aria-expanded", "false");
}

el.settingsButton.addEventListener("click", () => {
    if (el.settingsPanel.hidden) {
        openSettings();
    } else {
        closeSettings();
    }
});

el.closeSettings.addEventListener("click", closeSettings);

function setReducedMotion(enabled, persist = true) {
    el.reducedMotionToggle.checked = enabled;
    document.body.classList.toggle("reduce-motion", enabled);

    if (persist) {
        writeStorage(STORAGE_KEYS.reducedMotion, enabled);
    }

    if (state.weather) {
        const isDay = Number(state.weather.current.is_day) === 1;
        const info = getWeatherInfo(
            state.weather.current.weather_code,
            isDay
        );

        updateWeatherScene(info, isDay);
    }
}

el.reducedMotionToggle.addEventListener("change", () => {
    setReducedMotion(el.reducedMotionToggle.checked);
});


/* 15. USE MY LOCATION */

function useMyLocation() {
    if (!navigator.geolocation) {
        showError(
            "Your browser doesn't support location detection. Search for a city instead."
        );
        return;
    }

    clearError();
    setLoading(true, "Finding your current location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            const place = {
                name: "Current location",
                admin1: "",
                country: "Your position",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            loadPlace(place, { remember: false });
        },

        error => {
            let message = "We couldn't determine your location.";

            if (error.code === 1) {
                message =
                    "Location permission was denied. Allow access in your browser or search for a city.";
            } else if (error.code === 2) {
                message =
                    "Your location is unavailable right now. Try searching for a city.";
            } else if (error.code === 3) {
                message =
                    "Location detection timed out. Please try again.";
            }

            showError(message);
        },

        {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 300000
        }
    );
}

el.locationButton.addEventListener("click", useMyLocation);


/* 16. REFRESH AND RETRY */

async function refreshWeather() {
    if (!state.place) {
        await loadDefaultLocation();
        return;
    }

    await loadPlace(state.place, { remember: false });
}

el.refreshButton.addEventListener("click", refreshWeather);

el.retryButton.addEventListener("click", () => {
    const place = state.lastFailedPlace || state.place;

    if (place) {
        loadPlace(place, { remember: false });
    } else {
        loadDefaultLocation();
    }
});


/* 17. SEARCH EVENTS */

el.searchForm.addEventListener("submit", handleSearchSubmit);

el.citySearch.addEventListener("input", () => {
    if (state.searchTimer) {
        clearTimeout(state.searchTimer);
    }

    if (state.searchController) {
        state.searchController.abort();
    }

    state.searchTimer = setTimeout(updateSearchSuggestions, 300);
});

el.citySearch.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideSearchResults();
        return;
    }

    if (event.key === "ArrowDown" && !el.searchResults.hidden) {
        const firstButton = el.searchResults.querySelector("button");

        if (firstButton) {
            event.preventDefault();
            firstButton.focus();
        }
    }
});

document.addEventListener("click", event => {
    if (!el.searchForm.contains(event.target)) {
        hideSearchResults();
    }

    if (
        !el.settingsPanel.hidden &&
        !el.settingsPanel.contains(event.target) &&
        !el.settingsButton.contains(event.target)
    ) {
        closeSettings();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeSettings();
        hideSearchResults();
    }
});


/* 18. RESTORE PREFERENCES AND START */

async function loadDefaultLocation() {
    const savedPlace = readStorage(STORAGE_KEYS.lastPlace, null);

    if (
        savedPlace &&
        isFiniteNumber(savedPlace.latitude) &&
        isFiniteNumber(savedPlace.longitude) &&
        savedPlace.name &&
        savedPlace.name !== "Current location"
    ) {
        await loadPlace(savedPlace, { remember: false });
        return;
    }

    try {
        const results = await searchLocations("Coimbatore");
        const coimbatore = results.find(
            place => place.name.toLowerCase() === "coimbatore"
        ) || results[0];

        if (!coimbatore) {
            throw new Error("The default city could not be found.");
        }

        await loadPlace(coimbatore, { remember: true });

    } catch (error) {
        showError(
            error.message ||
            "Atmos couldn't connect to the weather service. Check your internet connection and try again."
        );
    }
}

async function initialiseAtmos() {
    const savedUnit = readStorage(STORAGE_KEYS.unit, "C");

    state.unit = savedUnit === "F" ? "F" : "C";
    updateUnitButtons();

    const savedFavorites = readStorage(STORAGE_KEYS.favorites, []);

    state.favorites = Array.isArray(savedFavorites)
        ? savedFavorites.filter(place =>
            place &&
            isFiniteNumber(place.latitude) &&
            isFiniteNumber(place.longitude) &&
            typeof place.name === "string"
        ).slice(0, 10)
        : [];

    const savedMotion = readStorage(STORAGE_KEYS.reducedMotion, false);

    setReducedMotion(savedMotion === true, false);
    renderFavorites();

    // Start with a real forecast. Never substitute fabricated temperatures.
    await loadDefaultLocation();
}

initialiseAtmos();

