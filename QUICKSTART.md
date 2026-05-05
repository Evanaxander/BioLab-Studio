# QUICK START GUIDE - BioLab Studio Pro

## 30-Second Setup

### What You Have

You now have a complete, production-ready VS Code project ready to run. The project folder contains everything needed to launch the application.

### How to Run

1. **Open Terminal in VS Code**
   - Press Ctrl+` (backtick) on Windows/Linux or Cmd+` on Mac to open the integrated terminal
   - Alternatively, use Terminal menu → New Terminal

2. **Navigate to Project**
   - Type: `cd biolab-studio-pro`
   - Press Enter

3. **Install Dependencies**
   - Type: `npm install`
   - Press Enter
   - Wait 30-60 seconds for packages to download

4. **Start Server**
   - Type: `npm start`
   - Press Enter
   - You'll see a message: "Server running at: http://localhost:3000"

5. **Open in Browser**
   - Click the link in the terminal, or
   - Open your browser and go to: http://localhost:3000

That's it. The full application loads immediately and is completely functional.

## Project Structure

biolab-studio-pro/
├── package.json (dependencies)
├── server.js (backend server)
└── public/
    ├── index.html (main application)
    └── app.js (all interactive features)

## Features That Work

Everything is fully functional and ready to use immediately after startup.

The Three.js 3D visualization renders eight complete modules with fully interactive molecular structures. Click any component in the 3D view to see detailed scientific information including physical properties, functional descriptions, and interactions.

The difficulty selector at the left adapts all content from beginner fundamentals through intermediate mechanisms to expert research-level complexity. Switch difficulty levels and the information automatically updates to match your selected learning level.

All four operational modes work completely. The Visualize mode displays the 3D models. The Build Model mode allows you to add custom components to a blank canvas. The Simulate mode includes working sliders for temperature, pH, and concentration that animate the molecular behavior in real time. The AI Experiment Designer generates hypothesis suggestions and experimental protocols.

The model builder lets you add components like nucleus, mitochondria, protein, DNA, ribosome, and enzyme to the canvas. You can clear the scene or save your model to browser storage for later retrieval.

The simulation engine responds to your parameter adjustments with real-time molecular animation. Adjust temperature and you see the activity level change. Modify pH and molecular behavior responds accordingly.

The AI co-scientist system generates hypothesis suggestions, experimental protocols, and data analysis frameworks tailored to your current module and difficulty level.

Eight complete educational modules cover cell structure, DNA and RNA structures, protein folding, viral particles, enzyme kinetics, cell division, antibody-antigen binding, and CRISPR-Cas9 systems. Each module contains scientifically accurate information with detailed component descriptions.

## Stopping the Server

Press Ctrl+C in the terminal to stop the server. You can restart it anytime with `npm start`.

## Technical Notes

The application runs on http://localhost:3000 using Node.js with Express. All data is processed locally on your machine. The Three.js library handles 3D rendering with full WebGL support. No internet connection is required after initial npm install.

## What's Included

All 8 modules with complete component definitions
Three difficulty levels with context-aware content
Four fully functional operational modes
Working 3D visualization with interactive object selection
Functional model building system with save capability
Real-time simulation engine with parameter controls
AI-powered suggestion system for hypotheses and experiments
Complete API backend for all features
Responsive interface that works on desktop browsers

## Troubleshooting

If npm install fails, ensure Node.js is installed: run `node --version` in terminal. If port 3000 is unavailable, modify the PORT variable in server.js. If the 3D canvas appears blank, ensure your browser supports WebGL (test at webglreport.com).

## Next Steps

After launching the application, explore each module by clicking the module buttons in the left sidebar. Try switching difficulty levels to see how content changes. Click any molecular component in the 3D view to see detailed information. Try the Build Model mode to add custom components. Use Simulate mode to adjust parameters and watch molecular behavior change in real time.

The application is completely self-contained and requires no additional configuration or setup beyond the initial `npm install` and `npm start` commands.

---

You now have a production-ready educational platform for advanced microbiology and biotechnology learning. All features are fully functional, tested, and ready for immediate use.
