# PhysTracker 1.2.0

[Use PhysTracker](https://phystracker.org/) · [Changelog](CHANGELOG.md) · [License](LICENSE)

PhysTracker is an open-source video and image analysis tool for physics teaching. Mark an object's position frame by frame, or use automatic tracking to follow a distinctive feature. Calibrate distance, inspect motion graphs, fit curves, and export measurements—all in your browser.

## What you can do

- **Track motion:** Choose Object A or B, then select Manual or Automatic from the tracking button. Automatic tracking uses a small patch of the original video, lets you adjust its size and search area, and pauses when a match is weak or ambiguous. Inspect automatically marked points before using them in an analysis.
- **Measure and analyze:** Set scale and coordinate origin; inspect position, velocity, acceleration, and center of mass. Fit linear, quadratic, or sinusoidal curves to selected graph data.
- **Use visual tools:** Show a tape measure, protractor, motion vectors, or a spectroscopy line profile with wavelength calibration and emission-line guides.
- **Keep your work:** Export measurements as CSV and graphs as PNG. The app also saves work locally and can export and reopen JSON project files. The media file is not embedded in a project file; reopen the corresponding video or image after loading a project.

### Automatic tracking

1. Upload a video and select **Object A** or **Object B**.
2. Set the video's frame rate, open the tracking button, and choose **Automatic tracking**.
3. Click a distinctive feature in the video. For a narrow object, choose an area with contrasting edges rather than a large patch of background.
4. Adjust the template diameter and search radius if needed, then choose **Track one frame** or **Run tracking**. Pause to change settings without discarding recorded points.
5. Check the plotted points. If tracking stops or selects the wrong location, use **Reselect object** or **Clear A/B data** as appropriate.

Automatic tracking is available for videos. Manual tracking remains available for videos and still images. Tracking accuracy depends on the video, target, and settings.

## Run locally

Requirements: Node.js 20.19+ or 22.12+, and npm.

```bash
git clone https://github.com/cesarurania0580/motion-tracker.git
cd motion-tracker
npm ci
npm run dev
```

Open the localhost URL printed by Vite. For a production build, run `npm run build`; the output is in `dist`. Run `npm test` and `npm run lint` to check the code.

## Project documentation

- [Specifications and development workflow](specs/README.md)
- [Project context](CONTEXT.md)
- [Local development and recovery](docs/DEVELOPMENT.md)
- [Autotracking benchmark and limitations](docs/testing/rocket-autotracking.md)
- [Curve-fitting validation](docs/testing/curve-fitting.md)

PhysTracker is licensed under the [MIT License](LICENSE). Copyright © 2026 Cesar Cortes.
