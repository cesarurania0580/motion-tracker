# PhysTracker (v1.1.0)

**PhysTracker** is a professional-grade, open-source video and image analysis tool designed for physics education and laboratory research. Built with modern web technologies and a single-file monolithic React architecture, it allows students, educators, and researchers to analyze motion, kinematics, and spectral distributions directly in the browser with high-frequency responsiveness and zero software installation.

---

## 🚀 Key Features

### 1. Spectroscopy & Line Profile Analysis Tool (New in v1.1.0)
* **Offscreen Pixel Averaging**: Sample intensity along an arbitrary line profile with adjustable **Spread Width** (perpendicular pixel averaging) to suppress high-frequency camera noise.
* **Color Channel Splitting**: Analyze Luma (overall intensity) alongside individual Red, Green, and Blue profiles.
* **Arbitrary 2-Point Laser Snap Calibration**: Decouples sampling line boundaries from calibration marks. Click to snap to scale markings or laser dots that extend *outside* the line segment for precise mathematical extrapolation.
* **Vertical Projection Guidelines**: Vibrant, semi-transparent vertical alignment lines (Cyan for Ref 1, Red for Ref 2) that stretch across the canvas for perfect alignment with physical ticks or laser points.
* **Emission Line Reference Guides**: Toggle theoretical reference markers (Hydrogen Balmer Series, Helium, and Mercury Vapor) directly on the spectral chart to verify experimental peak alignment.

### 2. Native Static Image Analysis (New in v1.1.0)
* Directly upload `.png`, `.jpg`, and `.jpeg` images of spectra or experimental kinematics setups.
* Automatically fits the viewport, extracts image dimensions, and disables temporal playback widgets to deliver a clean image-only editing experience.

### 3. Center of Mass (COM) Tracking (New in v1.0.3)
* Track multiple objects simultaneously (Object A & Object B).
* Automatically computes the system's overall Center of Mass (COM) coordinates, velocity, and trajectories in real-time.

### 4. Advanced Scientific Overlays
* **Protractor**: Measure angular positions, deflection, and rotation.
* **Tape Measure**: Measure absolute pixel distances and real-world calibrated meters.
* **Dynamic Kinematic Vectors**: Render velocity and acceleration vectors directly on tracked points that scale and orient dynamically based on motion derivatives.

### 5. Core Kinematics Engine
* **Frame-Accurate Video Control**: Frame step-forward/backward controls synchronized perfectly with data points.
* **Coordinate System Customization**: Place and rotate the origin axis $(0,0)$ to align with motion planes (e.g. inclined tracks).
* **Real-Time Data Curve Fitting**: Instantly apply linear and quadratic regression fits to positions, velocities, and accelerations on interactive charts.
* **Comprehensive Export Tools**: Download raw tracking data as CSV, and download publication-quality charts as PNG images.
* **Auto-Save & Project Files**: Your work is automatically saved in local storage, and projects can be saved/loaded as `.json` project files.

---

## 🚀 Quick Start Guide

### Kinematics Tracking
1. **Upload Media**: Click **Upload Video/Image** to open a video file or static photo.
2. **Set Scale**: Click **Set Scale** and drag the green markers across a known distance (e.g. a meter stick), then input its physical length in meters.
3. **Align Origin (Optional)**: Click **Set Origin** to place the reference axes. Rotate the blue handle to align the x-axis with an inclined plane.
4. **Track Points**: Select **Object A** or **Object B**, then click on the object in the media. The app will automatically mark the point and step to the next frame.
5. **Analyze**: Switch to the **Analysis** panel to view tracking plots, and apply Curve Fitting to extract velocities (slope) or acceleration (quadratic factor).

### Spectroscopy Analysis
1. **Upload Spectrum**: Upload a static photo or video frame of a spectrum.
2. **Enable Line Profile**: Check the **Line Profile** checkbox in the sidebar.
3. **Draw & Align Profile**: Drag the P1 and P2 endpoints horizontally across the spectrum band.
4. **Calibrate Wavelengths**: 
   * Expand the **Wavelength Calibration** sidebar card.
   * Click **🎯 Snap to click** next to Reference 1 and click on your blue laser dot or 400 nm scale tick. Input `400`.
   * Click **🎯 Snap to click** next to Reference 2 and click on your red laser dot or 700 nm scale tick. Input `700`.
   * Toggle **Show Guidelines** to verify vertical guideline projection alignment.
5. **Plot Spectrum**: Go to **Analysis** tab $\to$ **Spectral Profile**, and select **Wavelength (nm)** as the X-axis unit. Check the **Hydrogen (H₂)** guide overlays to align your peaks with theoretical lines.

---

## 🛠️ Running Locally

This is a modern React project powered by Vite. To run it on your machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cesarurania0580/motion-tracker.git
   cd motion-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *To expose the server on your local network to test on tablet/mobile devices, run:*
   ```bash
   npm run dev -- --host
   ```

4. **Build production bundles**:
   ```bash
   npm run build
   ```

---

## 📄 License

**PhysTracker** is open-source software licensed under the [MIT License](LICENSE).

Copyright © 2026 Cesar Cortes

## Development and release

Start with [the specification index](specs/README.md), [project context](CONTEXT.md),
[development and recovery instructions](docs/DEVELOPMENT.md), and
[the automatic-tracking validation record](docs/testing/autotracking.md).
Automatic tracking is available in development and production builds.
See [release preparation](docs/RELEASE.md) for validation and deployment status.
