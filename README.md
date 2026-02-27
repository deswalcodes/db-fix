# Bitespeed Identity Reconciliation

A backend service that identifies and links customer contacts across multiple purchases on FluxKart.com. Built as part of the **Bitespeed Backend Task**.

---

## 🔗 Live Endpoint

**Base URL:**  
https://db-fix.onrender.com

**POST Endpoint:**  
https://db-fix.onrender.com/identify

> ⚠️ Hosted on Render free tier — first request may take ~30 seconds to wake up after inactivity.

---

## 📖 Problem Statement

Customers on FluxKart.com often use different email addresses and phone numbers across purchases.  
The system must identify and consolidate these contacts into a single customer identity.

### Rules

- Multiple contacts belonging to the same person are **linked together**
- The **oldest contact** becomes `primary`
- All newer linked contacts become `secondary`
- If two separate primary clusters get linked:
  - The **older primary remains primary**
  - The newer primary is downgraded to `secondary`

---

## 🛠️ Tech Stack

| Layer      | Technology |
|------------|------------|
| Runtime    | Node.js (v20) |
| Framework  | Express.js |
| Database   | MongoDB Atlas |
| ODM        | Mongoose + mongoose-sequence |
| Hosting    | Render.com (Free Tier) |

---

## 📦 Project Structure

```
bitespeed-identity/
├── index.js              # Entry point — Express server setup
├── db.js                 # MongoDB Atlas connection
├── models/
│   └── Contact.js        # Mongoose schema with auto-increment integer id
├── routes/
│   └── identify.js       # /identify endpoint — reconciliation logic
├── .env                  # Local environment variables (not committed)
├── .gitignore
└── package.json
```

---

## 🗄️ Database Schema

```
Contact {
  id              Int (auto-incremented)
  phoneNumber     String?
  email           String?
  linkedId        Int?        // ID of the primary contact
  linkPrecedence  String      // "primary" | "secondary"
  createdAt       DateTime
  updatedAt       DateTime
  deletedAt       DateTime?
}
```

---

## 🚀 API Reference

### POST `/identify`

Identifies and consolidates a customer's contact information.

### Request Body (JSON)

```json
{
  "email": "example@email.com",
  "phoneNumber": "123456"
}
```

> At least one of `email` or `phoneNumber` must be provided.

---

### Response (200 OK)

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

> Note: `primaryContatctId` spelling matches the original assignment specification exactly.

---

## 🧪 Example Test Cases

---

### Case 1 — New Customer

**Request**

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

### Case 2 — Same Phone, New Email (Secondary Created)

**Request**

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

### Case 3 — Two Primaries Merged

When a request links two previously separate contact clusters:

- The older primary remains primary
- The newer primary becomes secondary

**Request**

```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Response**

```json
{
  "contact": {
    "primaryContatctId": 3,
    "emails": [
      "george@hillvalley.edu",
      "biffsucks@hillvalley.edu"
    ],
    "phoneNumbers": [
      "919191",
      "717171"
    ],
    "secondaryContactIds": [4]
  }
}
```

---

## ⚙️ Run Locally

### 1️⃣ Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bitespeed-identity.git
cd bitespeed-identity
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Create `.env` file

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bitespeed?retryWrites=true&w=majority
PORT=3000
```

---

### 4️⃣ Start development server

```bash
npm run dev
```

Server runs at:

```
https://db-fix.onrender.com
```

---

## 📝 Important Notes

- Request payload must be **JSON body** (not form-data)
- `primaryContatctId` spelling intentionally follows assignment spec
- Render free tier sleeps after 15 minutes of inactivity
- First cold start may take ~30 seconds

---

## 📬 Submission Checklist

- Live endpoint deployed
- MongoDB Atlas connected
- Auto-increment integer IDs working
- Proper primary/secondary reconciliation implemented
- README added

---

## 📄 License

This project was built as part of a backend assessment task.
