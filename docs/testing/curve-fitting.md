# Curve fitting correction

## Confirmed defect
The former sinusoidal implementation used 25 preset frequency/phase combinations
with extrema-based amplitude/offset. A perfect 5.5 rad/unit sine wave returned
5 rad/unit and R²=0.5821776144. The first CF-01 regression failed on the extracted
original calculation before replacing it. The same test now passes with R² near 1.
The screenshot data itself was not exported/replayed, so this establishes the
algorithmic defect, not acceptance on the owner's exact recording.

## Implementation and evidence
App calls the tested pure fitCurve utility for all models. Sinusoidal fitting
solves three linear coefficients at each frequency, searches/refines several
frequency basins, then returns amplitude/frequency/phase/offset. The function,
chart and R² use unrounded values. Plot resolution increases with frequency.
The point schema remains unchanged; CSV output retains additional precision.

All 19 tests pass, including arbitrary phase, noisy irregular samples, tiny
amplitude/shifted axes, cropped data, invalid samples, input immutability and
linear/quadratic compatibility. Constant-data R² is undefined; display/export
uses N/A. Zero R² displays as 0.0000. Lint and production build pass, with existing
Browserslist/bundle-size warnings. No browser was opened and no deployment made.

## Owner acceptance pending
- Repeat the oscillation recording; check the dashed curve and residuals across
  all cycles, then crop the interval and switch A/B and axes.
- Compare displayed parameters and exported graph. Verify export also works for
  constant data and zero R². Check EN/ES unavailable/uncertain messages.
- Check linear/quadratic fits and displayed table precision after retaining full
  internal precision. Project data must survive save/reload unchanged.

## Limits
Frequency search is bounded by sample spacing/count and 128 cycles per selected
span. Median spacing is a heuristic for irregular sampling. Alias ambiguity is
not universally detectable; warnings cover short spans, boundaries and nearly
equal residuals among refined candidates. A high R² alone does not establish a
reliable period on a short interval. Very large series still require owner
responsiveness testing; calculations run on the main thread.
