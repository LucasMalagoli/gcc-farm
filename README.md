# GCC Farm

GCC Farm is a React application designed to manage and track daily and weekly challenges across multiple characters. It provides a centralized dashboard to view progress, a randomizer to gamify task selection, and flexible configuration options.

## Features

*   **Dashboard**:
    *   Grid view of Characters vs. Challenges.
    *   Track progress counts against limits.
    *   Visual icons for Daily (Loop) and Weekly (EventRepeat) resets.
    *   Tooltips showing specific reset days for weekly challenges.
    *   Support for "N/A" challenges per character.
*   **Randomizer**:
    *   Roll the dice to randomly select an available (uncompleted) challenge.
    *   Filters out challenges that are already completed or not allowed for a character.
*   **Configuration**:
    *   **Characters**: Add, remove, reorder, and customize allowed challenges for each character.
    *   **Challenges**: Create challenges with specific reset rules (Daily, Weekly, Never), limits, and custom weekly reset days.
    *   **Data Sync**: Save and load your data directly to/from a local JSON file using the File System Access API.
*   **Modern Design**: Dark-themed UI built with Material UI.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    npm install
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

## Usage

### Data Persistence

This application does **not** use a backend database. Instead, it relies on a local JSON file on your computer to store your progress.

1.  Navigate to the **Configuration** page.
2.  **Create New File**: Creates a new JSON file on your system to store data.
3.  **Link to Existing File**: Select an existing JSON file to load data from.
4.  Once linked, the application will automatically save your progress to the file.
5.  The browser will remember the file handle (via IndexedDB), so you don't need to re-link it every time you refresh, though you may need to grant permission again upon reopening the browser.

### Resets

*   **Daily Resets**: Occur at 00:00 (Sao Paulo Time).
*   **Weekly Resets**: Occur on the specific day configured for the challenge at 00:00 (Sao Paulo Time).

## Tech Stack

*   React
*   TypeScript
*   Vite
*   Material UI
*   React Router
