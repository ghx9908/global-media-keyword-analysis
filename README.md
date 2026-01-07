# Search Results Visualization

A beautiful, interactive visualization dashboard for search query results.

## Setup

1. **Parse Data**:
   ```bash
   cd visualization/data
   python3 parse_data.py
   ```
   This will generate `data/data.json` from your source files.

2. **Deploy to GitHub Pages**:
   - Create a new repository on GitHub
   - Push all files to the repository
   - Go to Settings > Pages
   - Select source branch (usually `main` or `master`)
   - Select `/ (root)` folder
   - Save

## File Structure

```
visualization/
├── data/
│   ├── parse_data.py    # Data parsing script
│   ├── index.json       # Task index file (lists all tasks)
│   ├── [Task1].json     # Individual task data files
│   ├── [Task2].json     # Each task has its own JSON file
│   └── ...              # More task files
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles
├── js/
│   ├── app.js          # Main application logic
│   └── charts.js       # Chart visualizations
└── README.md           # This file
```

**Note**: Data is now split into multiple JSON files (one per task) instead of a single large file. This improves loading performance and makes the data more manageable.

## Features

- Interactive task selection
- Two-combination and three-combination query visualization
- Searchable results table
- Beautiful charts using Chart.js
- Responsive design
- GitHub Pages ready

## Usage

1. Run the data parsing script to generate `data.json`
2. Open `index.html` in a web browser
3. Select a task from the dropdown
4. Explore the data using the tabs and search functionality




cd visualization
python3 -m http.server 8000
localhost:8000