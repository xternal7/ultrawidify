var _dbgc_canvas;
var _dbgc_context;
var _dbgc_timer;
var _dbgc_clearTimeoutCount = 0;
var _dbgc_imageBuffer;

// drawQueue vsebuje stvari, ki jih bomo risali na platno
// Je tabela objektov, ki naj bi zgledali takole:
//  {
//    id:                   (id elementa)
//    class:                (razred elementa)
//    type:                 (črta, kvardat, whatever)
//    startPosition:        (kje se začne risati)
//    dimensions: {width, height}
//  }
//
// drawqueue contains stuff we're gonna draw onto canvas

var _dbgc_drawQueue = [];

var _dbgc_classes = {
  guardLine_blackbar: "#000099",
  guardLine_imageTest: "#5555FF",
  guardLine_blackbar_violation: "#FF0000",
  
  test: "#FF0000"
}

var _dbgc_traceColors = {
  guardLine_blackbar: [0, 0, 96],
  guardLine_imageTest: [72, 72, 255],
  guardLine_blackbar_violation: [255, 0, 0],
  guardLine_imageTest_noimage: [69, 42, 42]
}

var _dbgc_init = async function(canvasSize, canvasPosition){
  console.log("initiating DebugCanvas")
 
  var body = document.getElementsByTagName('body')[0];
 
  if(!canvasPosition){
    canvasPosition = {
      top: 1200,
      left: 800
    }
  }
  if(!_dbgc_canvas){
    _dbgc_canvas = document.createElement("canvas");
    body.appendChild(_dbgc_canvas);
  }
  
  _dbgc_canvas.style.position = "absolute";
  _dbgc_canvas.style.left = `${canvasPosition.left}px`;
  _dbgc_canvas.style.top = `${canvasPosition.top}px`;
  _dbgc_canvas.style.zIndex = 10002;
  _dbgc_canvas.style.transform = "scale(2.5, 2.5)";
  _dbgc_canvas.id = "uw_debug_canvas";
  
  _dbgc_context = _dbgc_canvas.getContext("2d");

  _dbgc_canvas.width = canvasSize.width;
  _dbgc_canvas.height = canvasSize.height;

  console.log("debug canvas is:", _dbgc_canvas, "context:", _dbgc_context)

  // _dbgc_start(); 
}

var _dbgc_removeFromQueue = function(element){
  var ind = _dbgc_drawQueue.indexOf(element);
  if(ind > -1){
    _dbgc_drawQueue.splice(ind, 1);
  }
}

var _dbgc_removeByAttribute = function(attribute, value){
  var i = 0;
  while(i < _dbgc_drawQueue.length){
    if( _dbgc_drawQueue[i][attribute] == value){
      _dbgc_drawQueue.splice(i, 1);
      continue;
    }
    i++;
  }
}

var _dbgc_remove = function(id){
  _dbgc_removeByAttribute('id', id);
}

var _dbgc_removeClass = function(className) {
  _dbgc_removeByAttribute('class', className);
}

// good thing javascript is single threaded because this would be haram as fuck
var _dbgc_autoremove = async function(timeout, element){
  setTimeout( _dbgc_removeFromQueue, timeout, element);
}

var _dbgc_start = function(){
  _dbgc_scheduleUpdate(0);
}

var _dbgc_scheduleUpdate = function (timeout, force_reset){
  // don't allow more than 1 instance
  if(_dbgc_timer){ 
    ++_dbgc_clearTimeoutCount;
    clearTimeout(_dbgc_timer);
  }
  
  _dbgc_timer = setTimeout(function(){
    _dbgc_timer = null;
    _dbgc_update();
  },
  timeout);
}

var _dbgc_draw = function(id, className, type, startPosition, dimensions, removeAfter){
  /**
   * @param id element id
   * @param className element class
   * @param type type of element (line, rectangle)
   * @param startPosition start position on canvas. {x,y}
   * @param dimensions dimensions of object
   * @param removeAfter if defined, element will be removed after this many milliseconds. Leave 0 or undefined to avoid automatic removal (manual removal still possible)
   */
  var element = {
    id: id,
    class: className,
    type: type,
    startPosition: startPosition,
    dimensions: dimensions
  }

  _dbgc_drawQueue.push(element);

  if(removeAfter){
    _dbgc_autoremove(removeAfter, element)
  }
}

var _dbgc_update = function(){
  // get frame off video

  if(GlobalVars.video){
    _dbgc_context.drawImage(GlobalVars.video, 0,0, _dbgc_canvas.width, _dbgc_canvas.height);
  }
  else{
    // console.log("[DebugCanvas] NO VIDEO DETECTED, DOING NOTHIGN");
    _dbgc_scheduleUpdate(100);
    return;
  }
  
  for (var element of _dbgc_drawQueue) {
    _dbgc_context.fillStyle = _dbgc_classes[element.class];
    
    // if(element.type == "rect"){
      _dbgc_context.fillRect(element.startPosition.x, element.startPosition.y, element.dimensions.width, element.dimensions.height);
    // }
  }

  _dbgc_scheduleUpdate(100);
}

var _dbgc_setBuffer = function(buffer) {
  // _dbgc_imageBuffer = buffer.splice(0);
  _dbgc_imageBuffer = new Uint8ClampedArray(buffer);
  // console.log(buffer, "<--buf")
}

var _dbgc_trace = function(className, arrayIndex){
  _dbgc_imageBuffer[arrayIndex  ] = _dbgc_traceColors[className][0];
  _dbgc_imageBuffer[arrayIndex+1] = _dbgc_traceColors[className][1];
  _dbgc_imageBuffer[arrayIndex+2] = _dbgc_traceColors[className][2];  
}

// because (context.putImageData) doesnt work
function putImageData(ctx, imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
  var data = imageData.data;
  var height = imageData.height;
  var width = imageData.width;
  dirtyX = dirtyX || 0;
  dirtyY = dirtyY || 0;
  dirtyWidth = dirtyWidth !== undefined? dirtyWidth: width;
  dirtyHeight = dirtyHeight !== undefined? dirtyHeight: height;
  var limitBottom = Math.min(dirtyHeight, height);
  var limitRight = Math.min(dirtyWidth, width);
  for (var y = dirtyY; y < limitBottom; y++) {
    for (var x = dirtyX; x < limitRight; x++) {
      var pos = y * width + x;
      ctx.fillStyle = 'rgba(' + data[pos*4+0]
                        + ',' + data[pos*4+1]
                        + ',' + data[pos*4+2]
                        + ',' + (data[pos*4+3]/255) + ')';
      ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
}

var _dbgc_showTraces = function(){
  if(_dbgc_context && _dbgc_imageBuffer instanceof Uint8ClampedArray){
    var idata = new ImageData(_dbgc_imageBuffer, _dbgc_canvas.width, _dbgc_canvas.height);
    putImageData(_dbgc_context, idata, 0, 0);
  }
}

var DebugCanvas = {
  events: {
    
  },
  init: _dbgc_init,
  // start: _dbgc_start,
  // draw: _dbgc_draw,
  // remove: _dbgc_remove,
  // removeClass: _dbgc_removeClass,

  setBuffer: _dbgc_setBuffer,
  trace: _dbgc_trace,
  showTraces: _dbgc_showTraces
}