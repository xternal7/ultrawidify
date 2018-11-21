if (Debug.debug) {
  console.log("Loading: ActionHandler.js");
}

class ActionHandler {

  constructor(pageInfo) {
    this.pageInfo = pageInfo;
    this.settings = pageInfo.settings;
    
    this.inputs = ['input', 'select', 'button', 'textarea'];
  }

  init() {
    if (Debug.debug) {
      console.log("[ActionHandler::init] starting init");
    }

    this.keyUpActions = [];
    this.keyDownActions = [];
    this.mouseMoveActions = [];
    this.mouseScrollUpActions = [];
    this.mouseScrollDownActions = [];
    this.mouseEnterActions = [];
    this.mouseLeaveActions = [];

    var ths = this;

    var actions;    
    try {
      if (this.settings.active.sites[window.location.host].actions) {
        actions = this.settings.active.sites[window.location.host].actions;
      } else {
        actions = this.settings.active.actions;
      }
    } catch (e) {
      actions = this.settings.active.actions;
    }

    for (var action of actions) {
      if(! action.shortcut) {
        continue;
      }
      var shortcut = action.shortcut[0];
      if (shortcut.onKeyDown) {
        this.keyDownActions.push(action);
      }
      if (shortcut.onKeyUp) {
        this.keyUpActions.push(action);
      }
      if (shortcut.onScrollUp) {
        this.mouseScrollUpActions.push(action);
      }
      if (shortcut.onScrollDown) {
        this.mouseScrollDownActions.push(action);
      }
      if (shortcut.onMouseEnter) {
        this.mouseEnterActions.push(action);
      }
      if (shortcut.onMouseLeave) {
        this.mouseLeaveActions.push(action);
      }
      if (shortcut.onMouseMove) {
        this.mouseMoveActions.push(action);
      }
    }

    document.addEventListener('keydown',  (event) => ths.handleKeydown(event) );
    document.addEventListener('keyup', (event) => ths.handleKeyup(event) );


    if (Debug.debug) {
      console.log("[ActionHandler::init] initialization complete");
    }
  }

  preventAction() {
    var activeElement = document.activeElement;

    if(Debug.debug && Debug.keyboard) {
      Debug.debug = false; // temp disable to avoid recursing;
      
      console.log("[ActionHandler::preventAction] Testing whether we're in a textbox or something. Detailed rundown of conditions:\n" +
      "is full screen? (yes->allow):", PlayerData.isFullScreen(),
      "\nis tag one of defined inputs? (yes->prevent):", this.inputs.indexOf(activeElement.tagName.toLocaleLowerCase()) !== -1,
      "\nis role = textbox? (yes -> prevent):", activeElement.getAttribute("role") === "textbox",
      "\nis type === 'text'? (yes -> prevent):", activeElement.getAttribute("type") === "text",
      "\nwill the action be prevented? (yes -> prevent)", this.preventAction(),
      "\n-----------------{ extra debug info }-------------------",
      "\ntag name? (lowercase):", activeElement.tagName, activeElement.tagName.toLocaleLowerCase(),
      "\nrole:", activeElement.getAttribute('role'),
      "\ntype:", activeElement.getAttribute('type'),
      "insta-fail inputs:", this.inputs
      );

      Debug.debug = true; // undisable
    }

    if (PlayerData.isFullScreen()) {
      return false;
    }
    if (this.inputs.indexOf(activeElement.tagName.toLocaleLowerCase()) !== -1) {
      return true;
    } 
    if (activeElement.getAttribute("role") === "textbox") {
      return true;
    }
    if (activeElement.getAttribute("type") === "text") {
      return true;
    }
    return false;
  }

  isActionMatch(shortcut, event) {
    return shortcut.key      === event.key     &&
           shortcut.ctrlKey  === event.ctrlKey &&
           shortcut.metaKey  === event.metaKey &&
           shortcut.altKey   === event.altKey  &&
           shortcut.shiftKey === event.shiftKey
  }

  execAction(actions, event, shortcutIndex) {
    if(Debug.debug  && Debug.keyboard ){
      console.log("%c[ActionHandler::execAction] Trying to find and execute action for event. Actions/event: ", "color: #ff0", actions, event);
    }

    if (!shortcutIndex) {
      shortcutIndex = 0;
    }

    for (var action of actions) {
      if (this.isActionMatch(action.shortcut[shortcutIndex], event)) {
        if(Debug.debug  && Debug.keyboard ){
          console.log("%c[ActionHandler::execAction] found an action associated with keypress/event: ", "color: #ff0", action);
        }

        for (var cmd of action.cmd) {
          if (cmd.action === "set-ar") {
            this.pageInfo.setAr(cmd.arg);
          } else if (cmd.action === "set-zoom") {
            this.pageInfo.zoomStep(cmd.arg);
          } else if (cmd.action === "set-stretch") {
            this.pageInfo.setStretchMode(cmd.arg);
          } else if (cmd.action === "toggle-pan") {
            this.pageInfo.setPanMode(cmd.arg)
          } else if (cmd.action === "pan") {
            // todo: handle this
          }

        }

        return;
      }
    }
  }

  handleKeyup(event) {
    if(Debug.debug  && Debug.keyboard ){
      console.log("%c[ActionHandler::handleKeyup] we pressed a key: ", "color: #ff0", event.key , " | keydown: ", event.keyup, "event:", event);
    }

    if (this.preventAction()) {
      if (Debug.debug && Debug.keyboard) {
        console.log("[ActionHandler::handleKeyup] we are in a text box or something. Doing nothing.");
      }
      return;
    }

    this.execAction(this.keyUpActions, event, 0);
  }

  handleKeydown(event) {
    if(Debug.debug  && Debug.keyboard ){
      console.log("%c[ActionHandler::handleKeydown] we pressed a key: ", "color: #ff0", event.key , " | keydown: ", event.keydown, "event:", event);
    }

    if (this.preventAction()) {
      if (Debug.debug && Debug.keyboard) {
        console.log("[ActionHandler::handleKeydown] we are in a text box or something. Doing nothing.");
      }
      return;
    }

    this.execAction(this.keyDownActions, event, 0);
  }

}