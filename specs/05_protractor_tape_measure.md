# Technical Specification: Protractor & Tape Measure Overlay Tools

## 1. Overview & Purpose
The **Protractor & Tape Measure Overlay Tools** provide students with interactive, screen-space tools to measure angular rotation, spatial offsets, and physical distances on the visual canvas. These overlays operate independently of tracking markers, enabling instantaneous on-screen spatial verification.

---

## 2. User Experience & UI Elements

### Sidebar Overlay Controls
* **Tape Measure Toggle Button**: Spawns a draggable blue measuring stick with two endpoints ($P_1$ and $P_2$) showing the physical length directly as a floating label on the canvas.
* **Protractor Toggle Button**: Spawns a draggable yellow angular measuring tool with a central vertex ($V$) and two directional handles ($A$ and $B$), rendering the measured angle in degrees alongside a visual arc sector indicating the swept region.

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `protractor`: `"Protractor" / "Transportador"`
* `tapeMeasure`: `"Tape Measure" / "Cinta Métrica"`
* `angle`: `"Angle" / "Ángulo"`
* `distance`: `"Distance" / "Distancia"`

---

## 4. Technical Architecture & Mathematics

### Tape Measure Distance Math
Let the tape measure handles be located at $P_1(x_1, y_1)$ and $P_2(x_2, y_2)$ in canvas pixel coordinates:
1. The raw pixel distance $D_{\text{px}}$ is computed using the standard Euclidean metric:
   $$D_{\text{px}} = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
2. If the spatial scale factor $S_{\text{px/m}}$ (pixels per meter) is calibrated:
   $$D_{\text{meters}} = \frac{D_{\text{px}}}{S_{\text{px/m}}}$$
3. The floating label renders the calibrated distance in meters (e.g., `0.742 m`) or defaults to raw pixels (`520 px`) if the scale is uncalibrated.

### Protractor Angle Math
Let the protractor be defined by three coordinate handles: Vertex $V(x_v, y_v)$, handle $A(x_a, y_a)$, and handle $B(x_b, y_b)$:
1. Construct the two directional vectors from the vertex:
   $$\vec{u} = A - V = (x_a - x_v, y_a - y_v)$$
   $$\vec{v} = B - V = (x_b - x_v, y_b - y_v)$$
2. Compute the vector magnitudes:
   $$\|\vec{u}\| = \sqrt{u_x^2 + u_y^2}$$
   $$\|\vec{v}\| = \sqrt{v_x^2 + v_y^2}$$
3. If either magnitude is zero, the angle is undefined ($0^\circ$).
4. The angle $\theta$ in radians is computed using the dot product formula:
   $$\cos(\theta) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \cdot \|\vec{v}\|} = \frac{u_x \cdot v_x + u_y \cdot v_y}{\|\vec{u}\| \cdot \|\vec{v}\|}$$
   $$\theta = \arccos\left(\max\left(-1.0, \min\left(1.0, \cos(\theta)\right)\right)\right)$$
5. Convert the radians to degrees:
   $$\theta_{\text{deg}} = \theta \cdot \frac{180}{\pi}$$
6. **Swept Arc Rendering**:
   To draw the visual yellow wedge indicating the measured sector:
   * Calculate absolute polar angles of $A$ and $B$ from $V$:
     $$\phi_a = \text{atan2}(y_a - y_v, x_a - x_v)$$
     $$\phi_b = \text{atan2}(y_b - y_v, x_b - x_v)$$
   * Render a circular arc path centered at $V$ from $\phi_a$ to $\phi_b$ using standard HTML5 Canvas context commands:
     ```javascript
     ctx.beginPath();
     ctx.moveTo(V.x, V.y);
     ctx.arc(V.x, V.y, radius, phi_a, phi_b);
     ctx.closePath();
     ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'; // Faint gold fill
     ctx.fill();
     ```

---

## 5. Interaction and accessibility follow-up — 2026-09-20

- MEASURE-01: When an image user chooses Measure the image, present distance and
  angle as equal task choices with short outcome-focused descriptions. Explain that
  distance may use pixels without calibration and angle needs no scale.
- MEASURE-02: Tape endpoints and protractor vertex/arms are keyboard focusable or
  have equivalent labeled numeric coordinate fields. Arrow movement, direct entry
  and pointer dragging update the same measurement state and result.
- MEASURE-03: On selection and movement, announce the active handle, coordinates and
  current distance/angle in EN/ES. Use shape, labels and focus styling as well as
  color to identify endpoints and arms.
- MEASURE-04: Activating a tool gives one brief endpoint/vertex instruction. Hiding,
  changing task or reopening a tool preserves completed measurements and cancels
  only unfinished placement.
- MEASURE-05: Controls follow the shared cyan/slate palette, retain visible focus
  and meet 44px primary touch-target guidance without changing measurement-overlay
  colors needed to distinguish the tools on the image.

Owner validation covers calibrated and pixel distance, angle, task changes, narrow
screens, both themes, EN/ES, pointer, keyboard and touch. Existing formulas and
native-image coordinate behavior remain authoritative.
