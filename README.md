# 📝 Job Application Bot

An automated **Job Application Bot** built using **Node.js**, **Express**, and **Puppeteer** that helps scrape job listings, automatically apply to jobs, and store application data in **Google Firestore (Firebase)**.

---

## 📌 Overview

This project provides a backend API that:
- Scrapes job listings from supported platforms
- Automatically applies to jobs using browser automation
- Stores application details in **Google Firestore**
- Exposes REST APIs for triggering job applications

---

## 🚀 Features

- 🔍 **Job Scraping** using Puppeteer  
- 🤖 **Automated Job Applications**
- ☁️ **Firestore Database Storage**
- 🧩 **Modular MVC Architecture**
- 🌐 **RESTful APIs** using Express.js
- 🔐 Environment-based configuration

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Automation:** Puppeteer  
- **Database:** Google Firestore (Firebase Admin SDK)  
- **Config Management:** dotenv  
- **Logging:** morgan  

---

## 📂 Project Structure

```
job-application-bot/
│
├── app.js                     # Application entry point
├── package.json               # Dependencies & scripts
├── .gitignore
│
├── config/
│   └── firebase.js            # Firebase / Firestore configuration
│
├── controllers/
│   ├── applyController.js     # Job application logic
│   └── saveToDbController.js  # Save applications to Firestore
│
├── models/
│   └── Application.js         # Application data model
│
├── routes/
│   └── index.js               # API routes
│
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Varenya-ramayanam/job-application-bot.git
cd job-application-bot
```

### 2️⃣ Install Dependencies

```bash
npm install
```

---

## 🔐 Environment Variables (Firestore)

Create a `.env` file in the root directory:

```env
PORT=3000

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
```

⚠️ **Important**
- Replace new lines in the private key with `\n`
- Never commit `.env` or Firebase credentials

---

## ▶️ Running the Project

```bash
npm start
```

Server will run at:
```
http://localhost:3000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | `/` | Health check |
| POST | `/apply` | Trigger job application |
| POST | `/save` | Save application details to Firestore |

---

## 🧪 Example Workflow

1. Call the `/apply` endpoint  
2. Puppeteer opens a browser and applies for jobs  
3. Application data is stored in **Firestore**  
4. Applications can be reviewed later

---

## 🔒 Security Notes

- Never commit Firebase credentials  
- Use restricted Firestore rules  
- Follow job platforms’ terms of service  

---

## 📌 Future Improvements

- Support multiple job platforms  
- Retry & failure handling  
- Admin dashboard  
- Authentication & user profiles  
- Job application analytics  

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch  
   ```bash
   git checkout -b feature-name
   ```
3. Commit changes  
   ```bash
   git commit -m "Add feature"
   ```
4. Push and open a Pull Request 🎉

---

## 📄 License

This project is licensed under the **MIT License**.
