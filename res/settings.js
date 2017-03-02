var browser_autodetect = true;
var usebrowser = "chrome";

if(browser_autodetect){
  if(typeof browser === "undefined"){ 
    if(chrome){
      browser = chrome; 
      usebrowser = "chrome";
    }
  }
  else
    usebrowser = "firefox";
}
else{
  if(usebrowser == "chrome")
    browser = chrome;
}



function showAbout(){
  clearPage();
  
  document.getElementById("about").classList.remove("hide");
  document.getElementById("tab_about").classList.add("tab-selected");
}
function showShortcuts(){
  clearPage();
  
  document.getElementById("uw_shortcuts").classList.remove("hide");
  document.getElementById("tab_shortcuts").classList.add("tab-selected");
}
function showGeneralSettings(){
  clearPage();
  
  document.getElementById("general_settings").classList.remove("hide");
  document.getElementById("tab_general_settings").classList.add("tab-selected");
}

function showSites(){
  clearPage();
  document.getElementById("uw_sites").classList.remove("hide");
  document.getElementById("tab_sites").classList.add("tab-selected");
}

function clearPage(){
  // Hide you sections
  document.getElementById("uw_shortcuts").classList.add("hide");
  document.getElementById("about").classList.add("hide");
  document.getElementById("general_settings").classList.add("hide");
  document.getElementById("uw_sites").classList.add("hide");
  
  // Hide you tabs
  document.getElementById("tab_shortcuts").classList.remove("tab-selected");
  document.getElementById("tab_about").classList.remove("tab-selected");
  document.getElementById("tab_general_settings").classList.remove("tab-selected");
  document.getElementById("tab_sites").classList.remove("tab-selected");
  
}

function saveopts(){
  
  var actions = ["fitw", "fith", "reset", "zoom", "unzoom", "ar219", "ar169", "ar1610", "ar43", "autoar"];
  var new_keybinds = {};

  // Preberemo naš obrazec in iz njega naredimo nov objekt z bližnjicami.
  // Let's read our form and make a new object with keybinds.
  
  for(var i = 0; i < actions.length; i++){
    var action = actions[i];
    var targetAR = "";
    
    if(action == "ar219"){
      action = "char";
      targetAR = (21/9);
    }
    if(action == "ar169"){
      action = "char";
      targetAR = (16/9);
    }
    if(action == "ar1610"){
      action = "char";
      targetAR = (16/10);
    }
    if(action == "ar43"){
      action = "char";
      targetAR = (4/3);
    }
    
    if(targetAR != ""){
      var keybind = {
        action: action,
        targetAR: targetAR,
        key: document.querySelector("#" + actions[i] + "_letter").value.toLowerCase().replace(/[^a-z0-9]/,""),
        modifiers: []
      }
    }
    else{
      var keybind = {
        action: action,
        key: document.querySelector("#" + actions[i] + "_letter").value.toLowerCase().replace(/[^a-z0-9]/,""),
        modifiers: []
      }
    }
    
    if(document.querySelector("#" + actions[i] + "_ctrl").checked)
      keybind.modifiers.push("ctrl");
    if(document.querySelector("#" + actions[i] + "_alt").checked)
      keybind.modifiers.push("alt");
    if(document.querySelector("#" + actions[i] + "_shift").checked)
      keybind.modifiers.push("shift");
    
    new_keybinds[i] = keybind;
  }
  
  // Preveriti moramo, da nismo dvema možnostima dodali isto bližnjico.
  // We need to check if all keybinds are unique.
  
  var fail = false;

  for(var i = 0; i < actions.length; i++)
    document.querySelector("#" + actions[i] + "_letter").classList.remove("dup_keybinds");
  
  for(var i = 0; i < actions.length; i++){
    if(new_keybinds[i].key == "")
      continue;
    
    for(var j = i + 1; j < actions.length; j++){
      if(new_keybinds[i].key == new_keybinds[j].key){
        if(compareModifiers(new_keybinds[i].modifiers, new_keybinds[j].modifiers)){
          fail = true;
          document.querySelector("#" + actions[i] + "_letter").classList.add("dup_keybinds");
          document.querySelector("#" + actions[j] + "_letter").classList.add("dup_keybinds");
        }
      }
    }
  }
  
  if (!fail){
    browser.storage.local.set({ultrawidify_keybinds:new_keybinds});
  }
  
}

function saveAutoar(){
  setopt({ultrawidify_autoar: document.querySelector("#enable_autoar").checked});
}

function saveUI(){
  var show_ui = document.querySelector("#enable_ui");
  var ui_compact = document.querySelector("#enable_ui_compact");
  var optionLine = document.getElementById("compact_ui_suboption");
  
  if(show_ui.checked){
    ui_compact.disabled = false;
    optionLine.classList.remove("hide");
    setopt({ultrawidify_ui: ui_compact.checked ? "compact" : "all" });
  }
  else{
    ui_compact.disabled = true;
    optionLine.classList.add("hide");
    setopt({ultrawidify_ui: "none"});
  }
}

// setopt in getopt. Shranita oz. dobita stvari iz skladišča
// setopt, getopt. They set/get stuff from the storage

function setopt(item){
  browser.storage.local.set(item);
}
function getopt(prop, callback){
  if(usebrowser == "chrome")
    browser.storage.local.get(prop, callback);
  else
    browser.storage.local.get(prop).then(callback);
  
}

function compareModifiers(a,b){
  //NOTE: to je precej slab in neprenoslijv način primerjanja dveh tabel, ampak za naš primer deluje dovolj
  //      dobro, saj 'ctrl' vedno pride pred 'alt' in 'alt' vedno pride pred 'shift' (če se sploh pojavijo).
  //NOTE: this is bad and totally unfoolproof practice. In our example comparing arrays the way we do works
  //      because values ALWAYS appear in the same order: 'ctrl' always appears before 'alt' (or it doesn't
  //      appear at all). 'alt' always appears before 'shift' (or it doesn't appear at all). 
  if(a.length != b.length)
    return false;
  
  var match = true;
  for(var i = 0; i < a.length; i++)
    match &= a[i] == b[i]
  
  return match;
}

function printerr(err){
  console.log(err);
}

function gotopts(opts){
  if(!opts.ultrawidify_keybinds){
    console.log("ultrawidify keybinds are undefined. the fuck?",opts);
    return;
  }
  var KEYBINDS = Object.keys(opts.ultrawidify_keybinds).map(function (key) { return opts.ultrawidify_keybinds[key];});
  // google chrome is really the untermensch browse       // google chrome is really the untermensch browserr
  var actions = ["fitw", "fith", "reset", "zoom", "unzoom", "ar219", "ar169", "ar1610", "ar43", "autoar"];
  for(var i = 0; i < actions.length; i++){
    document.querySelector("#" + actions[i] + "_letter").classList.remove("dup_keybinds");
    document.querySelector("#" + actions[i] + "_letter").value = KEYBINDS[i].key;
    for(var j = 0; j < KEYBINDS[i].modifiers.length; j++){
      if(KEYBINDS[i].modifiers[j] == "ctrl")
        document.querySelector("#" + actions[i] + "_ctrl").checked = true;
      if(KEYBINDS[i].modifiers[j] == "alt")
        document.querySelector("#" + actions[i] + "_alt").checked = true;
      if(KEYBINDS[i].modifiers[j] == "shift")
        document.querySelector("#" + actions[i] + "_shift").checked = true;
    }
  }
}

function gotar(opts){
  
}

function gotui(opts){
  var show_ui = document.querySelector("#enable_ui");
  var ui_compact = document.querySelector("#enable_ui_compact");
  var optionLine = document.getElementById("compact_ui_suboption");
  
  if(opts.ultrawidify_ui == "all"){
    show_ui.checked = true;
    ui_compact.checked = false;
    optionLine.classList.remove("hide");
  }
  else if(opts.ultrawidify_ui == "compact"){
    show_ui.checked = true;
    ui_compact.checked = true;
    optionLine.classList.remove("hide");
  }
  else if(opts.ultrawidify_ui == "none"){
    show_ui.checked = false;
    ui_compact.checked = false;
    optionLine.classList.add("hide");
  }
}

function gotsites(opts){
  
  var list = document.getElementById("uw_sites_list");
  
  if(list)
    list.remove();
  
  var anchor = document.getElementById("uw_sites_body");
  list = document.createElement("div");
  list.id = "uw_sites_list";
  list.className = "uw_sites";
  
  anchor.appendChild(list);
  
  uw_sites = opts.ultrawidify_siterules;
  console.log("opts",opts);
  
  for (type in {"official":1,"non-official":1,"custom":1} ) {  // unparalleled laziness!
    var head = document.createElement("div");
    head.className = "sites_header";
    head.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    var category_desc = document.createElement("div");
    if(type == "official"){
      category_desc.textContent = "These sites are officially supported by the extension developer. These sites should always work.";
    }
    else if(type == "non-official"){
      category_desc.textContent = "Sites in this category have been contribued by third parties. These sites will probably work, but the developer couldn't test whether they work or not.";
    }
    else if(type == "custom"){
      category_desc.textContent = "In this section, you can define rules for sites that aren't supported either officially or non-officially. See [todo: link] contributing for details. If you define a custom site, please consider sharing configuration on github (see contributing for details).";
    }
    
    list.append(head);
    list.append(category_desc);
    
    var category_counter;
    for (site in uw_sites){
      category_counter = 0;
      
      if(uw_sites[site].type == type){
        
        var entry = document.createElement("div");
        var displayedInfo = document.createElement("div");
        displayedInfo.id = site + "_display";
        displayedInfo.className = "uw_options_line site_details";
        
        var siteTitle = document.createElement("div");
        siteTitle.className = "site_name";
        
        {
          var sitecb = mkcb(site, uw_sites[site].enabled, true);
          var editTitle = mkebox(site, site)
          editTitle.className = "site_title_ebox";
          siteTitle.append(sitecb);
          siteTitle.append(editTitle);
          
          var editBtn = document.createElement("div");
          editBtn.textContent = "« edit »";
          editBtn.className = "inline_button";
          
          
          siteTitle.append(editBtn);
        }
        var urlRules = document.createElement("div");
        {
          var urlRulesLabel = document.createElement("span");
          urlRulesLabel.textContent = "URL rule: ";
          
          urlRulesEbox = mkebox(site, uw_sites[site].urlRules[0]);
          
          urlRules.append(urlRulesLabel);
          urlRules.append(urlRulesEbox);
        }
        
        var playerElement = document.createElement("div");
        
        {
          var playerName = document.createElement("div");
          
          var playerNameLabel = document.createElement("span");
          var playerNameEbox = mkebox(site);
          
          playerNameLabel.textContent = "id of the player container:";
          playerNameEbox = mkebox(site, uw_sites[site].player.name);
          
          playerName.append(playerNameLabel);
          playerName.append(playerNameEbox);
          
          var playerClass = document.createElement("div");
          var pcb = document.createElement("input");
          pcb.type = "checkbox";
          pcb.name = site + "_pccb_name";
          pcb.id = site + "_pccb_id";
          pcb.checked = uw_sites[site].player.isClass;
          pcb.disabled = true;
          
          var pcblabel = document.createElement("span");
          pcblabel.textContent = " Name of the player container is a class";
          
          playerClass.append(pcb);
          playerClass.append(pcblabel);
          playerElement.append(playerName);
          playerElement.append(playerClass);
        }
        
        var iframe_playerName = document.createElement("div");
        var ipn_label = document.createElement("span");
        ipn_label.textContent = "id of the player container when in an iframe:";
        ipn_ebox = mkebox(site, uw_sites[site].iframe ? uw_sites[site].iframe.name : "");
        iframe_playerName.append(ipn_label);
        iframe_playerName.append(ipn_ebox);
        
        var iframe_playerClass = document.createElement("div");
        var ipc_label = document.createElement("span");
        ipc_label.textContent = " Name of the player container is a class";
        var ipc_cb = mkcb(site, uw_sites[site].iframe ? uw_sites[site].iframe.isClass : false);
        iframe_playerClass.append(ipc_cb);
        iframe_playerClass.append(ipc_label);
        
        
        
        var imdbar = document.createElement("div");
        var imdbar_cb = mkcb(site, uw_sites[site].autoar_imdb);
        var imdbar_label = document.createElement("span");
        imdbar_label.textContent = " This site supports automatic aspect ratio detection";
        imdbar.append(imdbar_cb);
        imdbar.append(imdbar_label);
        
        var imdbar_title = document.createElement("div");
        var it_label = document.createElement("span");
        it_label.textContent = "id of the element containing video title:";
        it_ebox = mkebox(site, uw_sites[site].iframe ? uw_sites[site].iframe.name : "");
        imdbar_title.append(it_label);
        imdbar_title.append(it_ebox);
        
        var imdbar_class = document.createElement("div");
        var ic_label = document.createElement("span");
        ic_label.textContent = " Name of the title container is a class";
        var ic_cb = mkcb(site, uw_sites[site].iframe ? uw_sites[site].iframe.isClass : false);
        imdbar_class.append(ic_cb);
        imdbar_class.append(ic_label);
        
        
        
        
        
        
        displayedInfo.append(siteTitle);
        displayedInfo.append(urlRules);
        displayedInfo.append(playerElement);
        displayedInfo.append(iframe_playerName);
        displayedInfo.append(iframe_playerClass);
        
        
        
        displayedInfo.append(imdbar);
        displayedInfo.append(imdbar_title);
        displayedInfo.append(imdbar_class);
        
        entry.append(displayedInfo);
        
        list.append(entry);
        
        category_counter++;
      }
    }
    if(! category_counter){
      var noEntriesMsg = document.createElement("div");
      noEntriesMsg.textContent = "There's no entries in this category yet";
      noEntriesMsg.classList = "red";
      list.append(noEntriesMsg);
    }
  }
  
}

function mkebox(site, value){
  var ebox = document.createElement("input");
  ebox.className = "site_details details_ebox " + site + "_ebox",
  ebox.type = "text";
  ebox.value = value;
  ebox.disabled = true;
  
  return ebox;
}

function mkcb(site, checked, forceEnable){
  var cb = document.createElement("input");
  cb.type = "checkbox";
  cb.name = site + "_cb_name";
  cb.id = site + "_cb_id";
  cb.checked = checked;
  
  if(!forceEnable)
    cb.disabled = true;
  
  return cb;
}

function loadopts(){
  
  getopt("ultrawidify_keybinds", gotopts);
//   getopt("ultrawidify_autoar", gotar)
  getopt("ultrawidify_ui", gotui);
  getopt("ultrawidify_siterules", gotsites);
  
  // We build ui for 'site options' here
//   buildSites();
}


// page init

document.addEventListener("DOMContentLoaded", loadopts);

document.querySelector("#tab_shortcuts").addEventListener("click", showShortcuts);
document.querySelector("#tab_about").addEventListener("click", showAbout);
document.querySelector("#tab_general_settings").addEventListener("click",showGeneralSettings);
document.querySelector("#tab_sites").addEventListener("click", showSites);

document.querySelector("#kb_save").addEventListener("click", saveopts);
document.querySelector("#kb_cancel").addEventListener("click",loadopts);

document.querySelector("#enable_autoar").addEventListener("click",saveAutoar);
document.querySelector("#enable_ui").addEventListener("click", saveUI);
document.querySelector("#enable_ui_compact").addEventListener("click", saveUI);
getopt("ultrawidify_autoar",function(obj){document.querySelector("#enable_autoar").checked = obj.ultrawidify_autoar});
