# 📝 Job Application Bot

An automated bot that helps with **scraping job listings** and
**applying to jobs** using **Puppeteer**. It also supports **storing
applications in MongoDB**.

------------------------------------------------------------------------

## 🚀 Features

-   🔍 **Scrape Job Listings** from supported platforms.\
-   🤖 **Automated Applications** using Puppeteer\
-   💾 **Database Integration** using MongoDB (`mongoose`).\
-   🛠 **API-based Architecture** with Express.js.\
-   🧩 Middleware for logging (`morgan`), and
    environment configs (`dotenv`).

------------------------------------------------------------------------

## 📂 Project Structure

    job-application-bot-main/
    ├── app.js                 # Main entry point
    ├── controllers/           # Business logic
    │   ├── applyController.js
    │   └── saveToDbController.js
    ├── models/
    │   └── Application.js     # Mongoose schema
    ├── routes/
    │   └── index.js           # API routes
    ├── package.json
    └── .gitignore

------------------------------------------------------------------------

## ⚙️ Installation

``` bash
# Clone repository
git clone https://github.com/yourusername/job-application-bot.git
cd job-application-bot-main

# Install dependencies
npm install
```

------------------------------------------------------------------------

## 🔧 Configuration

Create a `.env` file in the root directory:

``` env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobbot
```

------------------------------------------------------------------------

## ▶️ Usage

Start the application:

``` bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

API will run on: **http://localhost:5000**

------------------------------------------------------------------------

## 📡 API Endpoints

  Method   Endpoint    Description
  -------- ----------- ------------------------------
  `POST`   `/apply`    Apply to a job automatically

------------------------------------------------------------------------

## 🛠 Tech Stack

-   **Backend:** Node.js, Express.js\
-   **Automation:** Puppeteer\
-   **Database:** MongoDB with Mongoose\
-   **Utilities:** dotenv, multer

------------------------------------------------------------------------

## 🤝 Contributing

``` bash
# Fork the repository
# Create a new branch
git checkout -b feature-name

# Commit changes
git commit -m "Add feature"

# Push to branch
git push origin feature-name
```

Then, open a **Pull Request** 🎉

------------------------------------------------------------------------


