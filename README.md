# ScholarGuard: Advanced Academic Humanizer (LM Studio Local Integration)

ScholarGuard is a specialized tool designed to humanize AI-generated academic and scientific text. It focuses on maintaining technical rigor while introducing the linguistic variety and authoritative tone characteristic of human experts, effectively bypassing advanced AI detectors.

By integrating with **LM Studio**, you can run ScholarGuard with fully private, local open-source LLMs (such as Llama 3, Mistral, Gemma, or Qwen) with zero cloud dependencies or API costs.

---

## 📥 How to Export this Project

To run ScholarGuard entirely on your local machine:
1. Open the **AI Studio Settings** menu (top right or gear icon).
2. Click **Export** and choose **Download ZIP** or **Export to GitHub**.
3. Extract the downloaded ZIP file to a folder on your local computer.

---

## 🚀 Local Setup (Private, Free & Offline)

Running ScholarGuard locally removes all network and proxy limitations, allowing the frontend to communicate with your local LM Studio instance on `http://localhost:1234` seamlessly.

### 1. Prerequisites

*   **Node.js**: Version 18 or higher.
*   **LM Studio**: Download and install from [lmstudio.ai](https://lmstudio.ai).
*   **A Local LLM**: Open LM Studio, search for and download a model (e.g. `Llama-3-8B` or `Mistral-7B`), then load it in the LM Studio Local Server tab.

### 2. Configure LM Studio

1. In LM Studio, click on the **Local Server** icon on the left sidebar (looks like a double-headed plug/terminal).
2. Select your downloaded model from the top dropdown to load it into memory.
3. Ensure port is set to `1234` (default).
4. Click **Start Server**.
5. Enable **CORS** in LM Studio settings if required by your network.

### 3. Build & Run ScholarGuard Locally

After extracting your exported ZIP file:

1.  Open your terminal/command prompt in the project root directory.
2.  Install the Node dependencies:
    ```bash
    npm install
    ```
3.  *(Optional)* Create a `.env` file in the root directory to customize your default connection:
    ```env
    LM_STUDIO_URL=http://localhost:1234
    ```
4.  Start the local dev server:
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to **http://localhost:3000**.
6.  The app will immediately detect your active LM Studio models! Select the model you loaded, choose your Bypass Strength and Academic Style, and start humanizing!

---

## 📦 Building the Desktop App (.exe / .app / AppImage)

You can package ScholarGuard into a standalone desktop application (portable `.exe` for Windows, AppImage for Linux, or DMG for macOS) using Electron.

1.  Ensure you have completed `npm install`.
2.  Build and pack the app:
    ```bash
    npm run build:exe
    ```
3.  The compiled native executable will be saved in the `dist-exe/` folder.
4.  Launch the standalone desktop app to run it with a sleek, borderless window!

---

## 🛠 Features

*   **Neural Input Terminal**: Real-time word count tracking, layout synchronization, and humanization configuration.
*   **Humanization Engine**: Combines **Syntactic Camouflage**, **Semantic Drift**, and **Extreme Burstiness** rules to disrupt AI patterns.
*   **Academic Customization**: Multi-style support (Heuristic Scientific, Traditional Scientific, Humanities, Narrative, Formal, and Concise).
*   **Local Control Dropdown**: Select loaded GGUF models directly within the horizontal controls tray.
*   **No API Rate Limits**: Process unlimited essays, papers, and text blocks on your own GPU/CPU hardware.

---

## 🔍 Troubleshooting Local Connection

If the app shows your local model status as **Offline**:
1. Check that LM Studio's Local Server is running and says **"Server is listening"**.
2. Verify you can access the model list in your browser at: `http://localhost:1234/v1/models`
3. If your LM Studio is running on a different port or host, click the **Gear Icon** next to the model list inside ScholarGuard to update the connection URL dynamically.

---

## ⚖️ Disclaimer

This tool is intended for ethical use in refining, editing, and improving the readability of academic drafts. Users are responsible for adhering to their institution's academic integrity policies.
