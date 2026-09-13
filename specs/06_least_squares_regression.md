# Technical Specification: Least-Squares Curve Fitting & Function Plotting

## 1. Overview & Purpose
This module provides real-time **Least-Squares Statistical Regression** (Linear, Quadratic, and Sinusoidal fits) and **High-Resolution Continuous Function Plotting** in the Analysis view. It enables students to extract physical constants (such as constant velocity from a linear slope, acceleration from quadratic coefficients, or rotational frequency from a sinusoidal fit) and verifies statistical correlations ($R^2$ coefficients).

---

## 2. User Experience & UI Elements

### Sidebar Curve Fitting Options
* **Curve Fitting Selector**: A dropdown menu in the Analysis sidebar allowing the user to select the statistical model:
  * **None**: Disables regression drawing.
  * **Linear**: Fits $y = Ax + B$ (Linear motion).
  * **Quadratic**: Fits $y = Ax^2 + Bx + C$ (Constant acceleration).
  * **Sinusoidal**: Fits $y = A\sin(Bx + C) + D$ (Oscillations/Circular projection).
* **Fitted Params Display**: Dynamically displays the solved formula and parameters (e.g. slope, initial position, acceleration constant) alongside the coefficient of determination ($R^2$).

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `curveFitting`: `"Curve Fitting" / "Ajuste de Curva"`
* `none`: `"None" / "Ninguno"`
* `linear`: `"Linear" / "Lineal"`
* `quadratic`: `"Quadratic" / "Cuadrático"`
* `sinusoidal`: `"Sinusoidal" / "Sinusoidal"`
* `coefficient`: `"Correlation (R²)" / "Correlación (R²)"`
* `slope`: `"Slope (A)" / "Pendiente (A)"`
* `acceleration`: `"Acceleration (2A)" / "Aceleración (2A)"`

---

## 4. Curve Fitting Mathematical Formulations

Let the tracking data points be $(x_1, y_1), (x_2, y_2), \dots, (x_n, y_n)$ where $x$ represents the independent variable (typically Time) and $y$ the dependent variable (typically Position or Velocity).

### 1. Linear Least-Squares Fit ($y = Ax + B$)
Solves the linear system minimizing squared residuals:
$$A = \frac{n \sum (x_i y_i) - \sum x_i \sum y_i}{n \sum (x_i^2) - (\sum x_i)^2}$$
$$B = \frac{\sum y_i - A \sum x_i}{n}$$
* **Physics Interpretation**: In a position vs. time plot, the slope $A$ represents the constant velocity ($v$), and the intercept $B$ represents the initial position ($x_0$).

### 2. Quadratic Least-Squares Fit ($y = Ax^2 + Bx + C$)
Constructs the Normal Equations system:
$$\begin{bmatrix}
\sum x_i^4 & \sum x_i^3 & \sum x_i^2 \\
\sum x_i^3 & \sum x_i^2 & \sum x_i \\
\sum x_i^2 & \sum x_i & n
\end{bmatrix}
\begin{bmatrix} A \\ B \\ C \end{bmatrix} =
\begin{bmatrix} \sum x_i^2 y_i \\ \sum x_i y_i \\ \sum y_i \end{bmatrix}$$
The app solves this $3 \times 3$ system using a **Gaussian Elimination solver** (`solveLinearSystem`) with partial pivoting.
* **Physics Interpretation**: In a position vs. time plot under constant acceleration ($x(t) = \frac{1}{2}a t^2 + v_0 t + x_0$), the coefficient $A$ represents **half the acceleration** ($\frac{1}{2}a$). The app displays the actual acceleration value ($2A$) automatically.

### 3. Sinusoidal Fit ($y = A \sin(Bx + C) + D$)
The former implementation tried only five frequencies and five phases, with
amplitude/offset fixed from extrema. That implementation did not match the older
zero-crossing description and could not provide a general least-squares fit.

Approved replacement (CF-01): for each trial frequency solve the linear least-
squares model `p sin(w u) + q cos(w u) + d`, with normalized independent variable
`u=(x-minX)/span`. Search 0.1 cycles per selected span up to the smaller of 128
cycles, half the unique sample count minus one, and the median-spacing sampling
limit. This is a bounded search, not a guarantee against every sampling alias.
Sweep with at least 16 samples per cycle of trial frequency, refine the eight
best local minima, then select the smallest sum of squared residuals. Convert
coefficients to nonnegative amplitude, positive angular frequency, phase and offset.

CF-02: retain full precision through derived position/velocity data and fitting;
round table/parameter labels only. Fit the same selected axes and cropped points
that are plotted. Keep original project measurement schema.

CF-03: require six distinct finite independent-variable values and varying data
for a sinusoidal fit. Show an EN/ES unavailable message otherwise. Warn when the
fit covers less than one cycle, reaches a search boundary, or competing searched
frequencies have nearly equal residuals. A short interval may admit a high R²
without reliable physical parameters.

CF-04: regression tests cover a frequency absent from the former guesses, arbitrary
phase, noisy/irregular samples, cropped intervals, shifted/scaled coordinates,
degenerate inputs, and existing linear/quadratic fits. Owner browser checks remain
separate from automated evidence.

### 4. Coefficient of Determination ($R^2$)
Measures goodness-of-fit, with 1 indicating a perfect fit; values can be negative when the model is worse than the mean. Constant data has undefined R²:
$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$$
where:
$$SS_{\text{res}} = \sum_{i=1}^n \left( y_i - f(x_i) \right)^2 \quad \text{(Sum of Squared Residuals)}$$
$$SS_{\text{tot}} = \sum_{i=1}^n \left( y_i - y_{\text{mean}} \right)^2 \quad \text{(Total Sum of Squares)}$$

---

## 5. High-Resolution Continuous Plotting

To draw the actual continuous mathematical function instead of a wobbly cubic spline connecting noisy points, the engine decouples rendering from experimental coordinates:

1. **Virtual coordinate grid**: Inside a `useMemo` block, the app checks if a curve fit is active and generates a grid of **at least 150 intervals** (32 intervals per fitted sinusoidal cycle, capped at 8192) evenly distributed across the visible horizontal width of the chart:
   $$x_{\text{step}} = \frac{x_{\text{max}} - x_{\text{min}}}{N}$$
   $$x_{\text{virtual}, k} = x_{\text{min}} + k \cdot x_{\text{step}}, \quad \text{for } k \in \{0, 1, \dots, N\}$$
2. **Exact evaluation**: Solves $y_{\text{fit}, k} = f(x_{\text{virtual}, k})$ using the solved mathematical function, storing it under the key `fitYContinuous`.
3. **Dataset merging**: Concatenates these virtual coordinates with the experimental data. 
4. **Isolated rendering layers**:
   * Experimental points contain the dataKey `plotY` but omit `fitYContinuous`, so they are only plotted as dots in the `<Scatter>` layer.
   * Virtual points contain `fitYContinuous` but omit `plotY`, so they are only plotted as the dashed line in the `<Line type="linear" />` layer. This creates a perfectly smooth, mathematically flawless continuous curve spanning the entire width of the chart.
