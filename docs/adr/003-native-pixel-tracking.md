# Native-pixel local tracking

Supersedes ADR001's whole-frame downsampling and hard initial-template appearance
veto. The rocket benchmark showed the original-template correlation stopping an
otherwise strong evolving-template match. Whole-frame reduction also removed the
small black-band detail needed for precise feature selection.

Capture a clean native-pixel region centered on the selected/predicted position.
Use a circular template and normalized luminance structure to reduce background
and illumination sensitivity. Check contrast and color, reject separated competing
peaks, and update templates only from accepted measurements. Soft tethering replaces
the hard keyframe veto. The new score and units are labeled explicitly in EN/ES.

Bound computation using coarse search followed by native-pixel refinement for
large regions. Preserve original measurement units, cancellation, paused retuning,
project schema, and development-only release gating. Both offline replay and the
browser hook call the same pure matcher and region calculation.

The supplied rocket runs continuously through clouds to feature exit in offline
replay. This is benchmark evidence, not a universal guarantee or a demonstrated
accuracy advantage over Tracker. See docs/testing/rocket-autotracking.md.


## Release preparation

The owner accepted multiple motion scenarios and requested release preparation.
Spec08 section11 supersedes development-only gating; production now uses the same
controller and controls. Preview and deployment verification remain separate.
