# ✂️ SnipURL - Premium URL Shortener

SnipURL is a complete, full-stack URL shortener application. It is designed with a premium, glassmorphic dark-theme user interface and features automatic click analytics, instant QR code generation with download support, and a history table of shortened URLs.

---

## 🚀 Features
- **Modern UI/UX**: Clean geometric typography (Outfit font), glassmorphic container cards, custom glowing background blobs with floating micro-animations, and smooth transition effects.
- **SQLite Persistence**: Automatic DB table setup (`urls.db`) storing long URL mappings, generated short codes, creation timestamps, and click counts.
- **Dynamic Input Validation**: Prevents invalid links from being shortened.
- **Analytics Click Tracking**: Clicking the shortened URLs automatically increments the click count in the database and updates in real-time.
- **Instant QR Code**: Renders a QR code for your shortened link instantly, with one-click direct blob download.
- **Copy Actions**: Easy one-click clipboard copy for both the primary result and history items, complete with tooltips and animations.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, SQLite (`sqlite3` module)
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid, Keyframe Animations), and Vanilla JavaScript (Fetch API, Clipboard API, blobs)

---

## 💻 How to Open and Run in VS Code

Follow these simple steps to run the application on your computer:

### 1. Open the Project Folder in VS Code
- Open **VS Code**.
- Go to `File` > `Open Folder...` (or press `Ctrl+K Ctrl+O`).
- Navigate to and select this folder:
  `C:\Users\harsh\.gemini\antigravity\scratch\url-shortener`

### 2. Open the Terminal
- In VS Code, open the built-in terminal by pressing `Ctrl + \`` (backtick) or going to `Terminal` > `New Terminal` in the top menu.

### 3. Install Dependencies
In the VS Code terminal, run the following command to download and install required packages:
```bash
npm install
```

### 4. Start the Application
You can run the application in development mode (which automatically restarts the server if you modify files):
```bash
npm run dev
```

Alternatively, to start the server in standard production mode:
```bash
npm start
```

### 5. Access the App
Once the server starts, open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

You can now start shortening links!
