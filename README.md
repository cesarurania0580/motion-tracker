# PhysTracker

**PhysTracker** is a professional-grade, open-source video analysis tool designed for physics education. Built with modern web technologies, it allows students and educators to analyze motion in videos directly in the browser without installing heavy software.



## Features

- **Multi-Object Tracking:** Analyze two distinct objects (Object A & Object B) simultaneously within the same video.
- **Frame-Accurate Synchronization:** Precise frame stepping logic ensures data points align perfectly with video frames.
- **Smart Calibration:** Easily define the scale (pixels per meter) using a known reference length in the video.
- **Coordinate System Control:** Set and rotate the origin (0,0) to align with the motion path (e.g., inclined planes).
- **Real-Time Analysis:**
  - Interactive Graphs (Position vs. Time, Velocity vs. Time, etc.).
  - Automatic Curve Fitting (Linear & Quadratic regressions).
  - Calculated Velocity data.
- **Data Persistence:**
  - **Auto-save:** Your work is automatically saved to local storage.
  - **Project Files:** Save and load your analysis as `.json` project files.
- **Export Tools:**
  - Download raw data as CSV.
  - Export publication-quality scientific graphs as PNG images.
- **Touch-Friendly UI:** "Tap to Fire" reticle designed for both mouse and touch interaction.

## Quick Start Guide

1. **Upload Video:** Click the **Upload** button to select a video file from your device.
2. **Set Scale:**
   - Click **Set Scale** and drag the green markers to the ends of a known object (e.g., a meter stick).
   - Click **Enter Distance** and input the real-world length in meters.
3. **Set Origin (Optional):** Click **Set Origin** to place the (0,0) coordinate point. You can drag the blue handle to rotate the axes.
4. **Track Motion:**
   - Select **Object A** or **Object B** from the header.
   - Click on the object in the video to mark its position. The video will automatically advance to the next frame.
   - *Tip:* You can drag points to adjust them later.
5. **Analyze:**
   - Switch to the **Analysis** tab to view graphs.
   - Use the dropdowns to change axes (e.g., Y-Position vs. Time).
   - Apply **Curve Fitting** to find slope (velocity) or quadratic coefficients (acceleration).
6. **Export:** Use the export buttons to save your data or graphs.

## Installation

This is a React application. To run it locally:

1. Clone the repository.

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm start
   ```

## License

**PhysTracker** is open-source software licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

**Copyright © 2026 Cesar Cortes**
