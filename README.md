# 🚀 Smart DevTool

<p align="center">
  <img src="screenshots/landing-page.png" width="900">
</p>

<p align="center">
  <strong>AI-Powered API Integration Platform</strong><br>
  Analyze API documentation, detect authentication methods, extract endpoints, recommend SDKs, and generate production-ready wrapper classes in multiple programming languages.
</p>

---

## 📌 Project Overview

Smart DevTool is an AI-powered developer platform that simplifies API integration.

Instead of manually reading lengthy API documentation, users simply provide:

- API Documentation URL
- Intended Use Case (Description)

The platform automatically:

- 🔍 Analyzes API documentation
- 🔐 Detects authentication methods
- 📡 Extracts important API endpoints
- 💡 Recommends SDKs or REST integration
- 🤖 Generates ready-to-use wrapper classes
- 💾 Stores analysis history in PostgreSQL
- 💬 Allows users to interact with an AI chatbot for further assistance

---

# 🎯 Problem Statement

Developers spend significant time understanding API documentation before integrating APIs into applications.

They need to manually identify:

- Authentication methods
- Endpoints
- Request parameters
- SDK availability
- Integration approach

This process is repetitive, time-consuming, and error-prone.

---

# 💡 Solution

Smart DevTool automates the complete API analysis workflow using AI.

It extracts all the essential information from API documentation and instantly generates production-ready wrapper code in the preferred programming language, reducing integration time from hours to minutes.

---

# ✨ Features

✅ AI-powered API Documentation Analysis

✅ Automatic Authentication Detection

✅ Endpoint Extraction

✅ REST & SDK Recommendation

✅ Wrapper Code Generation

✅ Multi-language Support

- Java
- Python
- JavaScript
- TypeScript
- Go
- C#

✅ Download Generated Wrapper

- PDF
- TXT
- Source Code

✅ AI Chat Assistant

✅ History Management

✅ User Profile Management

✅ Clerk Authentication

✅ Responsive UI

✅ Dark / Light Theme

✅ PostgreSQL Database

---

# 🖥️ Screenshots

## Landing Page

![Landing Page](screenshots/landing-page.png)

---

## Login Page

![Login](screenshots/login-page.png)

---

## Dashboard

![Dashboard](screenshots/dashboard.png)

---

## Analysis Page

![Analysis](screenshots/analysis-page.png)

---

## Features

![Features](screenshots/features.png)

---

## Workflow

![Workflow](screenshots/flow.png)

---

## Workflow (Detailed)

![Workflow 2](screenshots/flow2.png)

---

## AI Chatbot

![Chatbot](screenshots/chatbot.png)

---

## History

![History](screenshots/history-page.png)

---

## Profile

![Profile](screenshots/profile1.png)

![Profile](screenshots/profile2.png)

---

## FAQ

![FAQ](screenshots/fqa.png)

---

# 🏗️ System Architecture

The following diagram illustrates the overall architecture and workflow of the Smart DevTool platform.

<p align="center">
  <img src="screenshots/architecture.png" alt="Smart DevTool Architecture" width="1000">
</p>

### Architecture Overview

The system follows a modern client-server architecture with AI-powered analysis.

1. **React Frontend**
   - User interface built with React and Tailwind CSS.
   - Handles authentication, API analysis requests, history, profile management, and AI chatbot interactions.

2. **Clerk Authentication**
   - Provides secure user registration, login, session management, and profile handling.

3. **FastAPI Backend**
   - Receives API documentation URLs and user descriptions.
   - Processes requests and coordinates AI analysis.
   - Generates wrapper code in multiple programming languages.
   - Exposes REST APIs to the frontend.

4. **Groq AI**
   - Analyzes API documentation.
   - Detects authentication methods.
   - Extracts important endpoints.
   - Suggests SDKs or REST integration.
   - Generates production-ready wrapper classes.

5. **PostgreSQL Database**
   - Stores user information.
   - Saves analysis history.
   - Stores generated wrapper metadata.
   - Maintains chatbot conversation history (if enabled).

6. **Generated Output**
   - AI analysis report
   - Authentication summary
   - API endpoint extraction
   - SDK recommendations
   - Wrapper source code
   - PDF/TXT downloads

# ⚙️ Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Clerk Authentication

---

## Backend

- FastAPI
- Python
- SQLAlchemy
- Groq API

---

## Database

- PostgreSQL

---

## AI

- Groq LLM

---

# 📂 Project Structure

```
DriveProject
│
├── backend/
│
├── frontend/
│
├── screenshots/
│   ├── analysis-page.png
│   ├── chatbot.png
│   ├── dashboard.png
│   ├── features.png
│   ├── flow.png
│   ├── flow2.png
│   ├── fqa.png
│   ├── history-page.png
│   ├── landing-page.png
│   ├── login-page.png
│   ├── profile1.png
│   ├── profile2.png
│   └── usecases.png
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/smart-devtool.git
```

```
cd smart-devtool
```

---

## Frontend

```
cd frontend
npm install
npm run dev
```

---

## Backend

```
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Database

Install PostgreSQL

Create a database

Update the `.env` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/smart_devtool
```

---

# 📖 Usage

1. Login using Clerk Authentication.

2. Open the Analysis page.

3. Enter:

- API Documentation URL
- Intended Use Case

4. Click **Launch Analysis**.

5. AI extracts:

- Authentication
- Endpoints
- SDK Suggestions
- Technical Recommendations

6. Generate wrapper code.

7. Download code or PDF.

8. View previous analyses in the History page.

9. Use the AI Chatbot for additional guidance.

---

# 🎯 Example API

### URL

```
https://docs.github.com/en/rest
```

### Description

```
I want to integrate the GitHub REST API into a Java application to manage repositories, commits, issues, and pull requests.
```

---

# 🔮 Future Enhancements

- OAuth API Testing
- Swagger/OpenAPI Support
- Team Collaboration
- API Comparison
- Version Tracking
- Docker Deployment
- CI/CD Pipeline
- Analytics Dashboard

---

# 👩‍💻 Developed By

**Dhivya V**

B.E. Computer Science and Engineering

AI & Full Stack Developer

---

# 📄 License

This project is developed for educational and placement purposes.
