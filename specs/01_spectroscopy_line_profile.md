# Functional Specification: Spectroscopy & Line Profile Analysis Tool

## 1. Overview & Purpose
The **Spectroscopy & Line Profile Analysis Tool** enables students and educators to perform high-precision pixel intensity profiling across static images or video frames of optical spectra. The tool samples visual data along a user-defined line profile segment and performs perpendicular pixel averaging (Spread) across selected color channels (Luma, Red, Green, Blue) to plot smooth intensity graphs.

---

## 2. User Experience & UI Elements

### Sidebar Panel: Spectroscopy & Line Profile
* **Line Profile Checkbox**: Toggles the display and activation of the Lime-colored dashed line profile overlay on the canvas.
* **Spread Width (px)**: Range slider (typically `1` to `30` pixels) adjusting the perpendicular thickness of the sampling region.
* **Color Channel Selector**: Dropdown menu allowing the user to select the visual channel to sample:
  * **Luma (Intensity)**: Combined luminance value ($0.299R + 0.587G + 0.114B$).
  * **Red**: Pure red channel.
  * **Green**: Pure green channel.
  * **Blue**: Pure blue channel.

### Analysis View: Spectral Profile Tab
* Displays a **ComposedChart** showing pixel intensity on the Y-axis ($0$ to $255$) and the chosen X-axis unit (Pixels, Meters, or Wavelength in nm).
* If the **Luma** channel is selected, the chart overlays three faint background lines showing the individual Red, Green, and Blue intensity distributions to help students analyze overlapping spectral bands.
* **Emission Line Guides**: A sidebar check-list allowing the user to overlay vertical theoretical reference lines directly on the chart:
  * **Hydrogen ($H_2$ Balmer Series)**: $410.2\text{ nm}$ (Violet), $434.0\text{ nm}$ (Blue-Violet), $486.1\text{ nm}$ (Cyan), $656.3\text{ nm}$ (Red).
  * **Helium ($He$ Noble Gas)**: $447.1\text{ nm}$ (Blue), $501.6\text{ nm}$ (Green), $587.6\text{ nm}$ (Yellow), $667.8\text{ nm}$ (Red).
  * **Mercury ($Hg$ Metal Vapor)**: $404.7\text{ nm}$ (Violet), $435.8\text{ nm}$ (Blue), $546.1\text{ nm}$ (Green), $579.0\text{ nm}$ (Yellow).

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `lineProfile`: `"Line Profile" / "Perfil de Línea"`
* `spreadWidth`: `"Spread Width" / "Ancho de Dispersión"`
* `channel`: `"Channel" / "Canal"`
* `lumaChannel`: `"Luma (Intensity)" / "Luma (Intensidad)"`
* `redChannel`: `"Red" / "Rojo"`
* `greenChannel`: `"Green" / "Verde"`
* `blueChannel`: `"Blue" / "Azul"`
* `spectralCalibration`: `"Wavelength Calibration" / "Calibración de Onda"`
* `spectralCalibDesc`: `"Identify two reference markers..." / "Identifique dos marcas de referencia..."`

---

## 4. Technical Architecture & Mathematics

### Offscreen Canvas Sampling
To isolate visual data from UI elements, zooms, or overlays drawn on the active workspace canvas, the sampling engine constructs a temporary offscreen canvas at the media's **native pixel dimensions** ($W_{\text{native}} \times H_{\text{native}}$):
```javascript
const canvas = document.createElement('canvas');
canvas.width = videoDims.w;
canvas.height = videoDims.h;
const ctx = canvas.getContext('2d');
ctx.drawImage(mediaElement, 0, 0, videoDims.w, videoDims.h);
const imgData = ctx.getImageData(0, 0, videoDims.w, videoDims.h);
```

### Perpendicular Spread Math
Let the line profile segment be defined by endpoints $P_1(x_1, y_1)$ and $P_2(x_2, y_2)$ in native coordinates.
1. The direction vector $\vec{D} = (dx, dy) = (x_2 - x_1, y_2 - y_1)$ has length $L = \sqrt{dx^2 + dy^2}$.
2. The unit direction vector is $\hat{u} = (ux, uy) = (dx/L, dy/L)$.
3. The unit perpendicular normal vector is $\hat{n} = (nx, ny) = (-uy, ux)$.
4. The line is sampled at $N = \lfloor L \rfloor$ discrete steps. For each step $i \in \{0, 1, \dots, N\}$, the central coordinate $C_i$ along the line is:
   $$C_i = P_1 + \left(i \cdot \frac{L}{N}\right) \cdot \hat{u}$$
5. For a spread width $W$ (pixels) and radius $K = \lfloor W / 2 \rfloor$, the perpendicular sampling coordinates $S_{i, k}$ are:
   $$S_{i, k} = C_i + k \cdot \hat{n}, \quad \text{for } k \in \{-K, \dots, K\}$$
6. The RGB values are fetched from the image data array at each coordinate $S_{i, k}$, averaged across the $2K + 1$ samples, and Luma is computed as:
   $$\text{Luma} = 0.299R + 0.587G + 0.114B$$

---

## 5. State Persistence
* `lineProfile`: `{ p1: {x, y}, p2: {x, y}, spread: number, channel: string }` (or `null` if disabled).
* `activeReferenceOverlays`: `{ h2: boolean, he: boolean, hg: boolean }` (emission line overlays visibility states).
