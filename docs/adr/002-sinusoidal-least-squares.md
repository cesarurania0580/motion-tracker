# Sinusoidal least-squares fitting

Replace preset parameter guesses with variable projection: solve sine/cosine/
constant coefficients for each trial frequency, then refine multiple frequency
minima. This limits nonlinear optimization to one dimension and avoids a new
runtime dependency. Normalize X and Y for numerical conditioning and evaluate
the function relative to the original X origin.

Search bounds and ambiguous/short-interval warnings are explicit in spec 06.
They do not guarantee unique physical parameters for undersampled motion.
Keep fitting outside React so regression tests exercise the same function used
by the app. Keep full derived-data precision; round only UI presentation.
Linear/quadratic formulae remain unchanged. Constant-data R² is undefined and
rendered/exported as N/A; valid zero R² must not be treated as missing.
