// One owner includes pending openings, so rapid movement cannot queue stale boxes.
export function createTrackingHelpController(schedule=setTimeout, cancel=clearTimeout) {
  let active=null, timer=null;
  function clearTimer() {if(timer!==null)cancel(timer);timer=null;}
  function dismiss(owner) {
    if(!active || (owner!==undefined && active.owner!==owner))return;
    clearTimer();
    const previous=active;active=null;
    previous.hide();
  }
  return {
    dismiss,
    enter(owner,show,hide,delay=400) {
      if(active?.owner===owner && active.visible) {clearTimer();return;}
      dismiss();
      active={owner,show,hide,visible:false};
      const open=()=>{
        timer=null;
        if(active?.owner!==owner)return;
        active.visible=true;show();
      };
      if(delay===0)open();else timer=schedule(open,delay);
    },
    leave(owner) {
      if(active?.owner!==owner)return;
      clearTimer();
      if(!active.visible)dismiss(owner);
      else timer=schedule(()=>dismiss(owner),150);
    },
    hold(owner) {if(active?.owner===owner)clearTimer();},
  };
}
export const trackingHelpController=createTrackingHelpController();
