import Debug from '../../conf/Debug';
import BrowserDetect from '../../conf/BrowserDetect';

class CommsClient {
  constructor(name, settings) {
    if (BrowserDetect.firefox) {
      this.port = browser.runtime.connect({name: name});
    } else if (BrowserDetect.chrome) {
      this.port = chrome.runtime.connect({name: name});
    } else if (BrowserDetect.edge) {
      this.port = browser.runtime.connect({name: name})
    }

    var ths = this;
    this._listener = m => ths.processReceivedMessage(m);
    this.port.onMessage.addListener(this._listener);

    this.settings = settings;
    this.pageInfo = undefined;
    this.commsId = (Math.random() * 20).toFixed(0);
  }
  
  destroy() {
    this.pageInfo = null;
    this.settings = null;
    if (!BrowserDetect.edge) { // edge is a very special browser made by outright morons.
      this.port.onMessage.removeListener(this._listener);
    }
  }

  setPageInfo(pageInfo){

    this.pageInfo = pageInfo;

    if(Debug.debug) {
      console.log(`[CommsClient::setPageInfo] <${this.commsId}>`, "SETTING PAGEINFO —", this.pageInfo, this)
    }

    var ths = this;
    this._listener = m => ths.processReceivedMessage(m);
    if (!BrowserDetect.edge) {
      this.port.onMessage.removeListener(this._listener);
    }
    this.port.onMessage.addListener(this._listener);
    
  }

  processReceivedMessage(message){
    if(Debug.debug && Debug.comms){
      console.log(`[CommsClient.js::processMessage] <${this.commsId}> Received message from background script!`, message);
    }

    if (!this.pageInfo || !this.settings.active) {
      if(Debug.debug && Debug.comms){
        console.log(`[CommsClient.js::processMessage] <${this.commsId}> this.pageInfo (or settings) not defined. Extension is probably disabled for this site.\npageInfo:`, this.pageInfo,
                    "\nsettings.active:", this.settings.active,
                    "\nnobj:", this
        );
      }
      return;
    }

    if (message.cmd === 'get-current-zoom') {
      this.pageInfo.requestCurrentZoom();
    }

    if (message.cmd === "set-ar") {
      this.pageInfo.setAr(message.arg, message.playing);
    } else if (message.cmd === 'set-alignment') {
      this.pageInfo.setvideoAlignment(message.arg, message.playing);
      this.pageInfo.restoreAr();
    } else if (message.cmd === "set-stretch") {
      this.pageInfo.setStretchMode(message.arg, message.playing);
    } else if (message.cmd === "autoar-start") {
      if (message.enabled !== false) {
        this.pageInfo.initArDetection(message.playing);
        this.pageInfo.startArDetection(message.playing);
      } else {
        this.pageInfo.stopArDetection(message.playing);
      }
    } else if (message.cmd === "pause-processing") {
      this.pageInfo.pauseProcessing(message.playing);
    } else if (message.cmd === "resume-processing") {
      // todo: autoArStatus
      this.pageInfo.resumeProcessing(message.autoArStatus, message.playing);
    } else if (message.cmd === 'set-zoom') {
      this.pageInfo.setZoom(message.arg, true, message.playing);
    } else if (message.cmd === 'change-zoom') {
      this.pageInfo.zoomStep(message.arg, message.playing);
    } else if (message.cmd === 'mark-player') {
      this.pageInfo.markPlayer(message.name, message.color);
    } else if (message.cmd === 'unmark-player') {
      this.pageInfo.unmarkPlayer();
    }
  }

  async sleep(n){
    return new Promise( (resolve, reject) => setTimeout(resolve, n) );
  }

  async sendMessage_nonpersistent(message){
    message = JSON.parse(JSON.stringify(message)); // vue quirk. We should really use vue store instead
    
    if(BrowserDetect.firefox){
      return browser.runtime.sendMessage(message)
    } else {
      return new Promise((resolve, reject) => {
        try{
          if(BrowserDetect.edge){
            browser.runtime.sendMessage(message, function(response){
              var r = response; 
              resolve(r);
            });
          } else {
            chrome.runtime.sendMessage(message, function(response){
              // Chrome/js shittiness mitigation — remove this line and an empty array will be returned
              var r = response; 
              resolve(r);
            });
          }
        }
        catch(e){
          reject(e);
        }
      });
    }
  }

  async requestSettings(){
    if(Debug.debug){
      console.log("%c[CommsClient::requestSettings] sending request for congif!", "background: #11D; color: #aad");
    }
    var response = await this.sendMessage_nonpersistent({cmd: 'get-config'});
    if(Debug.debug){
      console.log("%c[CommsClient::requestSettings] received settings response!", "background: #11D; color: #aad", response);
    }

    if(! response || response.extensionConf){
      return Promise.resolve(false);
    }

    this.settings.active = JSON.parse(response.extensionConf);
    return Promise.resolve(true);
  }

  registerVideo(){
    if (Debug.debug && Debug.comms) {
      console.log(`[CommsClient::registerVideo] <${this.commsId}>`, "Registering video for current page.");
    }
    if (this.pageInfo) {
      if (this.pageInfo.videos.length) { 
        this.port.postMessage({cmd: "has-video"});
      }
    } else {
      // this.port.postMessage({cmd: "has-video"});
    }
    
  }

  unregisterVideo(){
    if (Debug.debug && Debug.comms) {
      console.log(`[CommsClient::unregisterVideo] <${this.commsId}>`, "Unregistering video for current page.");
    }
    this.port.postMessage({cmd: "noVideo"});  // ayymd
  }

  announceZoom(scale){
    this.port.postMessage({cmd: "announce-zoom", zoom: scale});
    this.registerVideo()
  }

}

export default CommsClient;