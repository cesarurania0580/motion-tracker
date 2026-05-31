# Technical Specification: Center of Mass (COM) Tracking & Dynamic Vectors

## 1. Overview & Purpose
This module provides real-time **Multi-Object Trajectory Tracking**, automated **Center of Mass (COM) Coordinate Calculation**, and **Dynamic Kinematic Vector Overlays** (Velocity & Acceleration arrows). It enables students to analyze multi-body systems (such as inelastic/elastic collisions, binary orbits, or explosions) and visually study vectors in Cartesian coordinate spaces.

---

## 2. User Experience & UI Elements

### Trajectory Marking & Object Toggles
* **Object A / Object B Header Toggle**: Selects the active target object to track. 
* **Center of Mass (COM) View Mode**: Selects the COM object in the dropdown to plot virtual trajectory coordinates and study system momentum.

### Dynamic Vectors On Canvas
* **Vector Controls Panel**:
  * **Show Velocity Vectors Checkbox**: Toggles dynamic green arrow indicators drawn on the tracked points.
  * **Show Acceleration Vectors Checkbox**: Toggles dynamic amber arrow indicators drawn on the tracked points.
  * **Vector Scale Slider**: Modifies arrow display scaling multiplier to optimize canvas visibility.

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `velocityVectors`: `"Show Velocity Vectors" / "Mostrar Vectores Velocidad"`
* `accelerationVectors`: `"Show Acceleration Vectors" / "Mostrar Vectores Aceleración"`
* `vectorScale`: `"Vector Scale" / "Escala de Vector"`
* `comShort`: `"COM" / "MDC"`

---

## 4. Technical Architecture & Mathematics

### System Center of Mass (COM) Calculation
For each frame index $i$, if coordinates for both Object A $(x_a, y_a)$ and Object B $(x_b, y_b)$ exist:
1. The combined Center of Mass coordinates $X_{\text{com}}$ and $Y_{\text{com}}$ are computed using:
   $$X_{\text{com}, i} = \frac{m_a \cdot x_{a, i} + m_b \cdot x_{b, i}}{m_a + m_b}$$
   $$Y_{\text{com}, i} = \frac{m_a \cdot y_{a, i} + m_b \cdot y_{b, i}}{m_a + m_b}$$
   where $m_a$ and $m_b$ are the user-defined mass values (default `1.0` kg).

### Numerical Derivatives (Central Difference Method)
To avoid high-frequency noise amplification from simple forward-difference algorithms, velocities and accelerations are calculated using the **Central Difference numerical approximation**:

1. **Velocity ($v_x, v_y$)**:
   The velocity component at frame index $i$ is calculated using the adjacent frames $i-1$ and $i+1$:
   $$v_{x, i} = \frac{x_{i+1} - x_{i-1}}{t_{i+1} - t_{i-1}} = \frac{x_{i+1} - x_{i-1}}{2 \cdot \Delta t}$$
   *(For boundary frames at the very beginning or end of tracking, the engine falls back to standard forward or backward difference approximations).*

2. **Acceleration ($a_x, a_y$)**:
   The acceleration component at frame index $i$ is calculated using:
   $$a_{x, i} = \frac{v_{x, i+1} - v_{x, i-1}}{t_{i+1} - t_{i-1}} = \frac{v_{x, i+1} - v_{x, i-1}}{2 \cdot \Delta t}$$

---

## 5. UI Canvas Vector Drawing

### Vector Vector Arrows (On-Canvas Overlay)
The dynamic arrows are drawn inside the `renderFrame` loop on top of each coordinate:
1. The vector components $(v_x, v_y)$ or $(a_x, a_y)$ are scaled by the `vectorScale` multiplier.
2. The arrow length $L_v$ and direction angle $\theta_v$ are computed:
   $$\theta_v = \text{atan2}(v_y, v_x)$$
3. The arrow tip is drawn by offsetting the coordinates by $\Delta x = L_v \cdot \cos(\theta_v)$ and $\Delta y = L_v \cdot \sin(\theta_v)$.
4. The arrowhead branches out at angles of $\theta_v \pm 150^\circ$ for a professional, aerodynamic layout:
```javascript
const drawArrow = (fromx, fromy, dx, dy, color) => {
  const tox = fromx + dx;
  const toy = fromy + dy;
  const angle = Math.atan2(dy, dx);
  const headlen = 10 / zoom; // Keeps arrow tip size constant across zoom
  
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw(2.5);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI/6), toy - headlen * Math.sin(angle - Math.PI/6));
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI/6), toy - headlen * Math.sin(angle + Math.PI/6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};
```
