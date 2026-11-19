<div align="center">
  <img src="src/Assests/tabTaskLogo.png" alt="TabTasks Logo" width="96" height="96" />
  <h1>TabTasks</h1>
  <p><strong>A context-aware, privacy-focused to-do list built for the Chrome Side Panel.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Encryption-AES--GCM%20256--bit-success?style=flat-square" alt="AES-GCM 256-bit" />
    <img src="https://img.shields.io/badge/License-ISC-lightgrey?style=flat-square" alt="License" />
  </p>
</div>

---

## 💡 About TabTasks

Most to-do lists force you to context-switch away from your work. **TabTasks** brings your tasks directly into your browsing flow via Chrome's Side Panel.

Whether you need to remember research notes on a GitHub issue, write review comments on a pull request, or maintain a daily global checklist, TabTasks automatically shows you the tasks relevant to the exact website you're on.

## ✨ Key Features

- 🌐 **Context-Aware Tasks (Per-Domain / Per-URL)**: Attach tasks to specific websites. As you navigate or switch tabs, your task list dynamically updates to show items for the current domain.
- 🌍 **Global Tasks**: Switch to Global Mode to keep general tasks accessible across every webpage.
- 🔗 **Source Link Navigation**: Tasks created on specific pages include a direct link back to the exact URL where you created them.
- 🔒 **End-to-End Local Encryption**: Your tasks are encrypted client-side using the Web Crypto API (`AES-GCM` 256-bit) before being saved to local storage. Zero data leaves your browser.
- 📑 **Chrome Side Panel Native**: Seamlessly integrated into Chrome's modern Side Panel API—no annoying popups that close when you click away.
- ⚡ **Instant Keyboard Shortcut**: Open and close your tasks instantly with a simple shortcut (`Cmd+U` on macOS / `Alt+U` on Windows/Linux).

---

## 🛠️ Tech Stack

- **Extension Framework:** Chrome Extension Manifest V3
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **APIs:** Chrome Side Panel API, Chrome Tabs & Storage APIs, Web Crypto API
- **Styling:** Modern, responsive CSS with Inter typography

---

## 🚀 Getting Started / Installation

### Prerequisites
- Node.js (v18+ recommended)
- Google Chrome (or any Chromium browser supporting the Side Panel API: Brave, Edge, Arc)

### 1. Clone & Build
```bash
# Clone the repository
git clone https://github.com/your-username/tabTasks.git
cd tabTasks

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### 2. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `tabTasks` root directory.
5. Click the **TabTasks** icon in the toolbar or press `Cmd+U` / `Alt+U` to open the Side Panel!

---

## ⌨️ Shortcuts

| Action | macOS | Windows / Linux |
| :--- | :--- | :--- |
| **Toggle TabTasks Side Panel** | `Command + U` | `Alt + U` |

---

## 🔐 Security & Privacy

TabTasks is built privacy-first:
- **No Remote Servers:** All data remains strictly in your browser (`chrome.storage.local`).
- **Encrypted at Rest:** A unique 256-bit AES-GCM key is generated on initialization in your browser. All stored task payloads are encrypted before being written to disk.
- **No Trackers or Analytics:** Zero tracking scripts, ads, or third-party analytics.

---

## 📂 Project Structure

```text
tabTasks/
├── manifest.json       # Manifest V3 extension configuration
├── popup.html          # Side panel UI layout
├── popup.css           # Side panel styles
├── package.json        # Project scripts & dependencies
├── tsconfig.json       # TypeScript compiler settings
├── src/
│   ├── background.ts   # Side panel trigger service worker
│   ├── popup.ts        # Core application logic & encryption
│   └── Assests/        # Icons and logos
└── dist/               # Compiled JavaScript files
```

---

## 👤 Author

Built by **[Hitesh Vishal (Hivy)](https://www.linkedin.com/in/hiteshvishal/)**

## 📄 License

This project is licensed under the [ISC License](LICENSE).
