from schemas import EndpointSchema

def extract_endpoints_mock(text: str):
    """
    Mock function to simulate AI extracting endpoints.
    """
    return [
        EndpointSchema(
            method="GET",
            path="/users",
            description="Retrieve all users",
            parameters="{'limit': 'integer', 'offset': 'integer'}"
        ),
        EndpointSchema(
            method="POST",
            path="/users",
            description="Create a new user",
            parameters="{'name': 'string', 'email': 'string'}"
        ),
        EndpointSchema(
            method="GET",
            path="/users/{id}",
            description="Get a user by ID",
            parameters="{'id': 'integer'}"
        )
    ]

def detect_auth_mock(text: str) -> str:
    """
    Mock function to simulate AI detecting auth type.
    """
    return "Bearer Token"

def recommend_sdk_mock(text: str, language: str) -> str:
    return f"Official {language} SDK, REST API Integration"

def generate_wrapper_mock(language: str, endpoints: list) -> str:
    """
    Mock function to generate wrapper class.
    """
    if language.lower() == "java":
        return '''public class ApiClient {
    private final String token;
    private final String baseUrl = "https://api.example.com";

    public ApiClient(String token) {
        this.token = token;
    }

    public String getUsers() {
        // GET /users implementation
        return "";
    }
    
    public String createUser(String name, String email) {
        // POST /users implementation
        return "";
    }
}'''
    elif language.lower() == "python":
        return '''import requests

class ApiClient:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://api.example.com"
        self.headers = {"Authorization": f"Bearer {token}"}

    def get_users(self):
        """Retrieve all users"""
        response = requests.get(f"{self.base_url}/users", headers=self.headers)
        return response.json()

    def create_user(self, name: str, email: str):
        """Create a new user"""
        payload = {"name": name, "email": email}
        response = requests.post(f"{self.base_url}/users", json=payload, headers=self.headers)
        return response.json()'''
    elif language.lower() == "javascript":
        return '''class ApiClient {
    constructor(token) {
        this.token = token;
        this.baseUrl = "https://api.example.com";
        this.headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }

    async getUsers() {
        const response = await fetch(`${this.baseUrl}/users`, {
            method: 'GET',
            headers: this.headers
        });
        return response.json();
    }

    async createUser(name, email) {
        const response = await fetch(`${this.baseUrl}/users`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ name, email })
        });
        return response.json();
    }
}'''
    else:
        return f"// Wrapper for {language} generated here..."
