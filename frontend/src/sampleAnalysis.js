export const sampleAnalysis = {
  url: "https://openweathermap.org/api",
  useCase: "Build a weather dashboard that displays current weather, hourly forecasts, 5-day forecasts, air pollution data, and weather alerts. Generate a production-ready API wrapper in Python with authentication handling and reusable methods.",
  language: "Python",
  data: {
    id: "demo-openweather",
    doc_url: "https://openweathermap.org/api",
    use_case: "Build a weather dashboard that displays current weather, hourly forecasts, 5-day forecasts, air pollution data, and weather alerts. Generate a production-ready API wrapper in Python with authentication handling and reusable methods.",
    user_id: "demo-user",
    api_summary: {
      api_name: "OpenWeather API",
      category: "Weather",
      auth_type: "API Key",
      total_endpoints: 22,
      relevant_endpoints_count: 6,
      recommended_method: "Python SDK (custom requests wrapper)"
    },
    auth_card: {
      auth_type: "API Key",
      required_params: "appid",
      location: "Query Parameter",
      example: "?appid=YOUR_API_KEY",
      description: "API Key authentication via query parameter. You must sign up on openweather.org, get an API key, and pass it in the query string as 'appid' with every request."
    },
    integration_recommendation: {
      best_library: "requests",
      sdk_exists: "No",
      why_rest: "The OpenWeather API is structured as a standard RESTful HTTP interface. Utilizing a native Python requests wrapper offers the cleanest implementation, direct control over request timeouts, and native error handling without bloated dependencies.",
      recommendation_summary: "Build a custom Python client class using the requests library, storing the API key securely and attaching it as a default query param."
    },
    confidence_scores: {
      auth: 96,
      endpoints: 98,
      relevance: 95,
      wrapper: 97
    },
    download_metadata: {
      language: "Python",
      generated_time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      wrapper_version: "v1.0.4"
    },
    endpoints: [
      {
        method: "GET",
        path: "/data/2.5/weather",
        description: "Current Weather",
        parameters: "q (String, city name), lat (Float, latitude), lon (Float, longitude), zip (String, zip code), units (String, standard/metric/imperial), lang (String, language code)",
        is_relevant: true,
        relevance_score: 98
      },
      {
        method: "GET",
        path: "/data/2.5/forecast",
        description: "5-Day / 3-Hour Forecast",
        parameters: "q (String, city name), lat (Float, latitude), lon (Float, longitude), units (String, standard/metric/imperial), cnt (Integer, number of timestamps), lang (String)",
        is_relevant: true,
        relevance_score: 97
      },
      {
        method: "GET",
        path: "/data/2.5/air_pollution",
        description: "Air Pollution",
        parameters: "lat (Float, latitude, required), lon (Float, longitude, required)",
        is_relevant: true,
        relevance_score: 95
      },
      {
        method: "GET",
        path: "/data/3.0/onecall",
        description: "One Call API (Current, hourly, daily, alerts)",
        parameters: "lat (Float, required), lon (Float, required), exclude (String, comma-separated parts to exclude), units (String), lang (String)",
        is_relevant: true,
        relevance_score: 94
      },
      {
        method: "GET",
        path: "/geo/1.0/direct",
        description: "Geocoding",
        parameters: "q (String, city name, required), limit (Integer, number of locations in API response)",
        is_relevant: true,
        relevance_score: 92
      },
      {
        method: "GET",
        path: "/geo/1.0/reverse",
        description: "Reverse Geocoding",
        parameters: "lat (Float, required), lon (Float, required), limit (Integer, number of locations)",
        is_relevant: true,
        relevance_score: 90
      },
      {
        method: "GET",
        path: "/data/2.5/history/city",
        description: "Historical Weather by City",
        parameters: "q (String, required), type (String), start (Integer), end (Integer)",
        is_relevant: false,
        relevance_score: 45
      },
      {
        method: "GET",
        path: "/data/2.5/box/city",
        description: "Weather in bounding box",
        parameters: "bbox (String, bounding box coordinates, required), zoom (Integer)",
        is_relevant: false,
        relevance_score: 30
      }
    ],
    generated_code: `import requests
import logging

# Configure logger for output trace tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OpenWeatherClient")

class OpenWeatherClient:
    \"\"\"
    Production-ready API wrapper for the OpenWeather API.
    Handles authentication, units management, error parsing, and session connection pools.
    \"\"\"
    
    def __init__(self, api_key: str, units: str = "metric"):
        \"\"\"
        Initialize the client with your unique API Key (appid).
        
        :param api_key: Your OpenWeather API key.
        :param units: Temperature format ('metric', 'imperial', 'standard').
        \"\"\"
        if not api_key:
            raise ValueError("API Key (appid) is required to initialize the client.")
        
        self.api_key = api_key
        self.units = units
        self.base_url = "https://api.openweathermap.org"
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _request(self, method: str, endpoint: str, params: dict = None, json_data: dict = None):
        \"\"\"
        Internal request helper to centralize error handling and authentication parameters.
        \"\"\"
        url = f"{self.base_url}{endpoint}"
        
        # Inject the mandatory API Key (appid) and configured units
        request_params = {
            "appid": self.api_key,
            "units": self.units
        }
        if params:
            request_params.update(params)

        try:
            logger.info(f"Sending {method} request to {endpoint}")
            response = self.session.request(
                method=method,
                url=url,
                params=request_params,
                json=json_data,
                timeout=10
            )
            
            # Raise exception for 4xx or 5xx status codes
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as http_err:
            status_code = response.status_code
            try:
                error_detail = response.json().get("message", "No detailed error message.")
            except ValueError:
                error_detail = response.text
                
            logger.error(f"HTTP error {status_code} occurred: {error_detail}")
            raise RuntimeError(f"OpenWeather API Error ({status_code}): {error_detail}") from http_err
            
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Network error occurred: {req_err}")
            raise ConnectionError(f"Failed to connect to OpenWeather API: {req_err}") from req_err

    # ─── Weather Methods ───────────────────────────────────────────────────

    def get_current_weather(self, q: str = None, lat: float = None, lon: float = None):
        \"\"\"
        Fetch the current weather data for a city or coordinates.
        https://openweathermap.org/current
        \"\"\"
        params = {}
        if q:
            params["q"] = q
        elif lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        else:
            raise ValueError("You must specify either a city query 'q' or coordinates ('lat', 'lon').")
            
        return self._request("GET", "/data/2.5/weather", params=params)

    # ─── Forecast Methods ──────────────────────────────────────────────────

    def get_forecast(self, q: str = None, lat: float = None, lon: float = None):
        \"\"\"
        Fetch the 5-Day / 3-Hour weather forecast data.
        https://openweathermap.org/forecast5
        \"\"\"
        params = {}
        if q:
            params["q"] = q
        elif lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        else:
            raise ValueError("You must specify either a city query 'q' or coordinates ('lat', 'lon').")
            
        return self._request("GET", "/data/2.5/forecast", params=params)

    def get_one_call(self, lat: float, lon: float, exclude: str = None):
        \"\"\"
        Fetch current weather, hourly forecast for 48 hours, daily forecast for 8 days, 
        and historical weather data for 40-odd years using One Call API 3.0.
        \"\"\"
        params = {
            "lat": lat,
            "lon": lon
        }
        if exclude:
            params["exclude"] = exclude
            
        return self._request("GET", "/data/3.0/onecall", params=params)

    # ─── Air Pollution Methods ─────────────────────────────────────────────

    def get_air_pollution(self, lat: float, lon: float):
        \"\"\"
        Fetch current air pollution data including air quality index (AQI) and concentrations.
        https://openweathermap.org/api/air-pollution
        \"\"\"
        params = {
            "lat": lat,
            "lon": lon
        }
        return self._request("GET", "/data/2.5/air_pollution", params=params)

    # ─── Geocoding Methods ─────────────────────────────────────────────────

    def geocode_city(self, city_name: str, limit: int = 5):
        \"\"\"
        Convert city names into geographic coordinates (lat, lon).
        \"\"\"
        params = {
            "q": city_name,
            "limit": limit
        }
        return self._request("GET", "/geo/1.0/direct", params=params)

    def reverse_geocode(self, lat: float, lon: float, limit: int = 5):
        \"\"\"
        Convert coordinates (lat, lon) into local city names.
        \"\"\"
        params = {
            "lat": lat,
            "lon": lon,
            "limit": limit
        }
        return self._request("GET", "/geo/1.0/reverse", params=params)
`
  }
};
