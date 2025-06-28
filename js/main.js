const DEFAULT_LOCATION = "Cairo";
// Attempt to get user's geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const userLocation = `${coords.latitude},${coords.longitude}`;
      loadWeatherData(userLocation);
    },
    (error) => {
      console.warn(
        "Geolocation not available or denied, using default location."
      );
      loadWeatherData(DEFAULT_LOCATION);
    }
  );
} else {
  console.log("Geolocation not supported, using default location.");
  loadWeatherData(DEFAULT_LOCATION);
}

// variables to load weather data from API
const API_KEY = "3b0bcdea74d943f2945110550252706";
const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&days=3&aqi=no`;

// function to get day of week from index
function getDayOfWeek(dayIndex) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex];
}

// Fetch weather data function
async function fetchWeatherData(location) {
  const url = `${API_URL}&q=${encodeURIComponent(location)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Display current weather
function displayCurrentWeather(data) {
  if (!data?.current || !data?.location) {
    console.error("Invalid data format for current weather");
    return;
  }
  const container = document.getElementById("current-weather");
  if (!container) return;

  const date = new Date(data.location.localtime.replace(" ", "T"));
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = date.getDate();
  // Get ordinal suffix for the day
  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }
  const month = `${getOrdinalSuffix(day)} of ${date.toLocaleDateString("en-US", { month: "long" })}`;

  // Map wind direction abbreviations to full names
  const windDirMap = {
    N: "North",
    S: "South",
    E: "East",
    W: "West",
    NE: "Northeast",
    NW: "Northwest",
    SE: "Southeast",
    SW: "Southwest",
    NNE: "North-Northeast",
    ENE: "East-Northeast",
    ESE: "East-Southeast",
    SSE: "South-Southeast",
    SSW: "South-Southwest",
    WSW: "West-Southwest",
    WNW: "West-Northwest",
    NNW: "North-Northwest",
  };
  // Get full wind direction name or fallback to abbreviation
  const windDirFull =
    windDirMap[data.current.wind_dir.toUpperCase()] || data.current.wind_dir;

  container.innerHTML = `
    <div class="forecast-container" id="forecast">
        <div class="forecast-header bg-card-header d-flex justify-content-between" id="today">
          <div class="header-font">${dayName}</div>
          <div class="header-font">${day}${month}</div>
        </div>
        <div class="forecast-content bg-card-body rounded-bottom" id="current">
          <div class="location-font">${data.location.name}</div>
          <div class="degree">
            <div class="temp-font">${data.current.temp_c}<sup>o</sup>C</div>
            <div class="forecast-icon">
              <img src="https:${data.current.condition.icon}" alt="${data.current.condition.text}" width="90">
            </div>
          </div>
          <div class="condition-font p-2">${data.current.condition.text}</div>
          <span class="header-font px-2"><img class="p-2" src="./img/umbrella.png" alt="">${data.current.humidity}%</span>
          <span class="header-font px-2"><img class="p-2" src="./img/wind.png" alt="">${data.current.wind_kph}km/h</span>
          <span class="header-font px-2"><img class="p-2" src="./img/compass.png" alt="">${windDirFull}</span>
        </div>
    </div>
  `;
}

// Display additional weather (next days)
function displayAdditionalWeather(data) {
  if (!data?.forecast?.forecastday) {
    console.error("Invalid data format");
    return;
  }
  const forecastDays = data.forecast.forecastday.slice(1);
  const container = document.getElementById("additional-weather");
  if (!container) return;

  if (forecastDays.length === 0) {
    container.innerHTML = "<p>No forecast data available.</p>";
    return;
  }

  container.innerHTML = forecastDays
    .map((day) => {
      const date = new Date(day.date.replace(" ", "T"));
      // Use secondary classes for the middle card (index 0)
      const isMiddle = forecastDays.indexOf(day) === 0;
      return `
      <div class="d-flex flex-column w-100">
          <div class="forecast-header ${
            isMiddle ? "bg-card-header-secondary" : "bg-card-header"
          }">
        <div class="header-font">${getDayOfWeek(date.getDay())}</div>
          </div>
          <div class="forecast-content ${
            isMiddle ? "bg-card-body-secondary" : "bg-card-body"
          } d-flex justify-content-center align-items-center flex-column rounded-bottom">
          <img class="text-center p-3" src="https:${
            day.day.condition.icon
          }" alt="${day.day.condition.text}" />
        <div class="maxtemp-font text-center pt-2">${day.day.maxtemp_c}°C</div>
        <div class="mintemp-font text-center pb-2">${day.day.mintemp_c}°C</div>
        <div class="condition-font text-center p-3">${
          day.day.condition.text
        }</div>
          </div>
          </div>
      `;
    })
    .join("");
}

// Debounce function to limit API calls
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Handle user input
function setupUserInput() {
  const input = document.getElementById("userInput");
  if (!input) return;

  input.addEventListener(
    "input",
    debounce((e) => {
      const userInput = e.target.value.trim();
      if (userInput.length > 3) {
        loadWeatherData(userInput);
      }
    }, 500)
  );
}

// function to load weather data and display it
function loadWeatherData(location) {
  fetchWeatherData(location)
    .then((data) => {
      displayCurrentWeather(data);
      displayAdditionalWeather(data);
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

// On DOM ready execute
document.addEventListener("DOMContentLoaded", () => {
  setupUserInput();
  loadWeatherData(DEFAULT_LOCATION);
});
