> Status: rejected and rolled back. Duplicate toolbar actions increased clutter.
> Retained below as historical context; see revised requirements in spec 14.

# Sidebar task tabs

Use one sidebar scrolling region beneath stable Setup / Track / Data navigation.
Tools is a separate local view, not a fourth task tab. Tab and Tools selection are
transient Zustand fields so explicit Header tracking actions can route to Track.
They are excluded from project export/autosave; normal experiment changes do not
change the selected tab.

Keep task sections mounted to preserve native disclosures. Automatic controls
mount only while their task is visible, with fine-tuning preferences retained in
the existing tracking hook. Tool controls remain mounted under the Tools view.
Tab changes do not stop acquisition; pending point review is cancelled when its
UI is hidden. Show Pause in the stable header if acquisition runs on another tab.

Share chooseTrackingMode between the original toolbar menu and new direct controls
so manual, automatic and off retain consistent state transitions. Existing engine,
measurement and file formats are unchanged. Owner evaluation precedes acceptance.
