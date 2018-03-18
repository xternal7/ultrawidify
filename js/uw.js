if(Debug.debug){
  console.log("\n\n\n\n\n\n           ———    Sᴛλʀᴛɪɴɢ  Uʟᴛʀᴀᴡɪᴅɪꜰʏ    ———\n               <<   ʟᴏᴀᴅɪɴɢ ᴍᴀɪɴ ꜰɪʟᴇ   >>\n\n\n\n");
  try {
    if(window.self !== window.top){
      console.log("%cWe aren't in an iframe.", "color: #afc, background: #174");
    }
    else{
      console.log("%cWe are in an iframe!", "color: #fea, background: #d31", window.self, window.top);
    }
  } catch (e) {
    console.log("%cWe are in an iframe!", "color: #fea, background: #d31");
  }
}

// load all settings from localStorage:

async function main(){
  if(Debug.debug)
    console.log("[uw::main] loading configuration ...");

  // load settings
  var isSlave = true;
  await Settings.init(isSlave);
  var scpromise = SitesConf.init();
  var kbpromise = Keybinds.init();
  
  // počakamo, da so nastavitve naložene
  // wait for settings to load
  await scpromise;
  await kbpromise;

  // globalVars: lastAr type = original
  GlobalVars.lastAr = {type: "original"};
  
  if(Debug.debug)
    console.log("[uw::main] configuration should be loaded now");
  // start autoar and setup everything


  if(Debug.debug)
    console.log("[uw::main] | document is ready. Starting ar script ...");

  if(! SitesConf.isEnabled(window.location.hostname)){
    if(Debug.debug)
      console.log("[uw:main] | site", window.location.hostname, "is blacklisted.");

    return;
  } 
  
//   if(SitesConf.isArEnabled(window.location.hostname)){
//     if(Debug.debug)
//       console.log("[uw::main] Aspect ratio detection is enabled. Starting ArDetect");
//     ArDetect.arSetup();
//   }
//   console.log("[uw::main] ExtensionConf:", ExtensionConf);

  if(ExtensionConf.arDetect.mode == "blacklist"){
    if(Debug.debug)
      console.log("[uw::main] Aspect ratio detection is enabled (mode=",ExtensionConf.arDetect.mode,"). Starting ArDetect");
    ArDetect.arSetup();
  }
  else{
    if(Debug.debug)
      console.log("[uw::main] Aspect ratio detection is disabled. Mode:", ExtensionConf.arDetect.mode);
  }
  
  browser.runtime.onMessage.addListener(receiveMessage);
  setInterval( ghettoOnChange, 100);
  setInterval( ghettoUrlWatcher, 500);
  
  // ko se na ticevki zamenja video, console.log pravi da ultrawidify spremeni razmerje stranic. preglej element 
  // in pogled na predvajalnik pravita, da se to ni zgodilo. Iz tega sledi, da nam ticevka povozi css, ki smo ga
  // vsilili. To super duper ni kul, zato uvedemo nekaj protiukrepov.
  //
  // when you change a video on youtube, console.log says that ultrawidify changes aspect ratio. inspect element 
  // and a look at youtube player, on the other hand, say this didn't happen. It seems that youtube overrides our
  // css, and this is super duper uncool. Therefore, extra checks and measures.
  setInterval( Resizer.antiCssOverride, 200);
  
}


// tukaj gledamo, ali se je velikost predvajalnika spremenila. Če se je, ponovno prožimo resizer
// here we check (in the most ghetto way) whether player size has changed. If it has, we retrigger resizer.

var _video_recheck_counter = 5;
var _video_recheck_period = 1;  // on this many retries

function ghettoOnChange(){
  
  if(_video_recheck_counter++ > _video_recheck_period){
    _video_recheck_counter = 0;
    
    if ( GlobalVars.video == null || 
         GlobalVars.video == undefined ||
         GlobalVars.video.videoWidth == 0 ||
         GlobalVars.video.videoHeight == 0 ){
      
      var video = document.getElementsByTagName("video")[0];
      if ( video !== undefined &&
           video !== null && 
           video.videoWidth > 0 &&
           video.videoHeight > 0 ){
        if(Debug.debug){
          console.log("%c[uw::ghettoOnChange] detected video. registering!", "color: #99f, background: #000");
        }
        
        GlobalVars.video = video;
        Comms.sendToBackgroundScript({"cmd":"register-video"});
      }
    }
  }
  
  if(GlobalVars.video === null)
    return;
  
  if(GlobalVars.playerDimensions == null){
    GlobalVars.playerDimensions = PlayerDetect.getPlayerDimensions( GlobalVars.video );
    
    
    if(GlobalVars.playerDimensions == undefined){
      GlobalVars.playerDimensions = null;
      return;
    }
  }
  
  if(PlayerDetect.checkPlayerSizeChange()){
    
    if(Debug.debug){
      console.log("[uw::ghettoOnChange] change detected");
    }
    
    
    GlobalVars.playerDimensions = PlayerDetect.getPlayerDimensions( GlobalVars.video );
    
    if(GlobalVars.playerDimensions == undefined){
      GlobalVars.playerDimensions = null;
      return;
    }
    
    Resizer.restore();
  }
  
  // sometimes, checkPlayerSizeChange might not detect a change to fullscreen. This means we need to 
  // trick it into doing that
  
  if(GlobalVars.playerDimensions.fullscreen != PlayerDetect.isFullScreen()){
    
    if(Debug.debug){
      console.log("[uw::ghettoOnChange] fullscreen switch detected");
    }
    
    GlobalVars.playerDimensions = PlayerDetect.getPlayerDimensions(GlobalVars.video);
    if(GlobalVars.playerDimensions == undefined){
      GlobalVars.playerDimensions = null;
      return;
    }
    
    Resizer.restore();
  }
  
}

function ghettoUrlWatcher(){
  if (GlobalVars.lastUrl != window.location.href){
    if(Debug.debug){
      console.log("[uw::ghettoUrlWatcher] URL has changed. Trying to retrigger autoAr");
    }
    
    GlobalVars.video = null;
    GlobalVars.lastUrl = window.location.href;
    Resizer.reset();
    main();
  }
}








// comms
function receiveMessage(message, sender, sendResponse) {
  if(Debug.debug)
    console.log("[uw::receiveMessage] we received a message.", message);
  
  if(message.cmd == "has-videos"){
    var anyVideos = GlobalVars.video != null;
    
    if(Debug.debug)
      console.log("[uw::receiveMessage] are there any videos on this page?", anyVideos, GlobalVars.video, this);
    
    if(BrowserDetect.usebrowser == "firefox")
      return Promise.resolve({response: {"hasVideos": anyVideos }});

    try{
      sendResponse({response: {"hasVideos":anyVideos}});
      return true;
    }
    catch(chromeIsShitError){}
    return;
  }
  else if(message.cmd == "get-config"){
    
    var config = {};
    config.videoAlignment = ExtensionConf.miscFullscreenSettings.videoFloat;
    config.arConf = {};
    config.arConf.enabled_global = ExtensionConf.arDetect.enabled == "global";
    
    
    var keybinds = Keybinds.getKeybinds();
    if(Debug.debug)
      console.log("[uw-bg::_uwbg_rcvmsg] Keybinds.fetch returned this:", keybinds); 
    
    config.keyboardShortcuts = keybinds;
    
    // predvidevajmo, da je enako. Če je drugače, bomo popravili ko dobimo odgovor
    // assume current is same as global & change that when you get response from content script
    config.arConf.enabled_current = ArDetect.isRunning();
    
    if(BrowserDetect.usebrowser == "firefox")
      return Promise.resolve({response: config});
    
    try{
      sendResponse({response: config});
    }
    catch(chromeIsShitError){};
    
    return true;
  }

  else if(message.cmd == "force-ar"){
    if(Debug.debug)
      console.log("[uw::receiveMessage] we're being commanded to change aspect ratio to", message.newAr);
    
    if(message.arType == "legacy"){
      ArDetect.stop();
      Resizer.legacyAr(message.newAr);
    }
    else{
      ArDetect.stop();
      Resizer.setAr(message.newAr);
    }
  }
  else if(message.cmd == "force-video-float"){
    if(Debug.debug)
      console.log("[uw::receiveMessage] we're aligning video to", message.newFloat);
    
    ExtensionConf.miscFullscreenSettings.videoFloat = message.newFloat;
    Settings.save(ExtensionConf);
  }
  else if(message.cmd == "stop-autoar"){
    ArDetect.stop();
  }
  else if(message.cmd == "update-settings"){
    if(Debug.debug){
      console.log("[uw] we got sent new ExtensionConf to abide by:", cmd.newConf);
    }
    ExtensionConf = cmd.newConf;
  }
//   else if(message.cmd == "enable-autoar"){
//     if(Debug.debug){
//       console.log("[uw] enabling autoar.");
//     }
//     ExtensionConf.autoAr.mode == "blacklist";
//     Settings.save(ExtensionConf);
//   }
//   else if(message.cmd == "disable-autoar"){
//     if(Debug.debug){
//       console.log("[uw] disabling autoar.");
//     }
//     ExtensionConf.autoAr.mode == "disabled";
//     Settings.save(ExtensionConf);
//   }
  if(message.cmd == "testing"){
    if(Browserdetect.usebrowser = "firefox")
      return Promise.resolve({response: "test response hier"});
    
    sendResponse({response: "test response hier"});
    return true;
  }
}


// $(document).ready(function() {
  main();
// });
