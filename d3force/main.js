if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();
}

var fsCount = 0,
    viewHeight = 640;

var getMapJSON = function() {
    var mapData = {}
    d3.selectAll("g.node").each(function(d){
        var orbit = false;
        if ( this.className.baseVal.indexOf("orbit") > -1 ) {
            orbit = true;
        };  
        mapData[d.name] = {
            "select"  : "g.node." + d.name,
            "x"     : d.x,
            "y"     : d.y,
            "orbit" : orbit,
        }
    });
    var mapSVG = d3.select("#map-svg")[0][0];
    mapData["map-svg"] = {
        "select"  : "#map-svg",
        "x"     : mapSVG.translateX,
        "y"     : mapSVG.translateY,
        "scale" : mapSVG.scale,        
    }
    var popups = d3.selectAll(".pop-up");
    if (popups[0][0]) {
        popups.each(function(){
            var name = this.className.split(" ").join("-")
            mapData[name] = {
                "select"  : ".pop-up." + name,
                "left"  : popups[0][0].style.left,
                "top"   : popups[0][0].style.top,
                "z"     : popups[0][0].style.zIndex, 
            }
        });
    }
    return JSON.stringify(mapData);
}

function toggleFullScreen() {

    // if (screenfull.enabled) {
        try { 
            screenfull.toggle(document.getElementById('map-container'));
        } catch (e) {
            console.log('asdfasd');
            $('body').toggleClass('fullscreenIE')
            $('#container').toggleClass('fullscreenIE')
            $('#header').toggleClass('fullscreenIE')
            $('#fullWidth').toggleClass('fullscreenIE')
        };
    // }
}

function AttachEvent(element, type, handler) {
    if (element.addEventListener) {
        element.addEventListener(type, handler, false);
    }else if (element.attachEvent) {
        element.attachEvent('on' + type, handler)
    } else {
        element['on' + type] = handler;
    }
}

AttachEvent(document, "fullscreenchange",
    function(e) {
        screenChangeListener(e)
    }
);

AttachEvent(document, "mozfullscreenchange",
    function(e) {
        screenChangeListener(e)
    }
);

AttachEvent(document, "webkitfullscreenchange",
    function(e) {
        screenChangeListener(e)
    }
);

var infoToggle = document.getElementById('info-toggle'),
    infoBtn = document.getElementById('info-btn'),
    infoIcon = document.getElementById('info-icon'),
    mapInfo = document.getElementById('map-info');

function screenChangeListener (e) {
var elMap = document.getElementById('map'),
    elMapContainer = document.getElementById('map-container'),
    elToolbar = document.getElementById('toolbar'),
    elFullWidth = document.getElementById('fullWidth'),
    elFullscreen = document.getElementById('fullscreen');

    console.log("screenchange event! ", e);
        fsCount += 1;
    if (fsCount % 2 == 0) {
        elMapContainer.className = elMapContainer.className.split(' ')[0];
        elMapContainer.style.width = window.innerWidth + 'px';
        elMapContainer.style.height = viewHeight + 'px';
        elMap.style.width = elMapContainer.clientWidth + 'px';
        elMap.style.height = viewHeight + 'px';
        elToolbar.style.marginTop = (viewHeight - 40) + 'px';
        elFullscreen.innerHTML = 'Full-Screen';
        elFullscreen.style.backgroundImage = "url('fullscreen-alt.png')";
    } else {
        setTimeout(function(){
            elMap.style.width = window.innerWidth;
            elMap.style.height = window.innerHeight;
            elMapContainer.className += ' absol';
            elMapContainer.style.width = window.innerWidth + 'px';
            elMapContainer.style.height = window.innerHeight + 'px';
            elToolbar.style.marginTop = (window.innerHeight - 40) + 'px';
            elFullscreen.innerHTML = 'Browser';
            elFullscreen.style.backgroundImage = "url('fullscreen-exit-alt.png')";
        },500)    
    }
}

window.onload = function() {
var elMapContainer = document.getElementById('map-container'),
    elToolbar = document.getElementById('toolbar'),
    elFullscreen = document.getElementById('fullscreen'),
    mapInfo = document.getElementById('map-info'),
    // w = document.getElementById('fullWidth').clientWidth,
    h = viewHeight;
    // animates map info box
    // mapInfo.className = 'show';
    elMapContainer.style.width = window.innerWidth + 'px';
    elMapContainer.style.height = window.innerHeight + 'px';
    elToolbar.style.marginTop = (window.innerHeight - 40 + 'px');
    // console.log(w, h)
    // if (screenfull.enabled) {
        $('#toolbar').prepend("<div id='fullscreen' class='btn' onclick='javascript:toggleFullScreen();'>Full-Screen</div>")
    // }

}

window.onresize = function() {
var elMapContainer = $('#map-container'),
    elMap = $('#map'),
    // elFullWidth = $('#fullWidth'),
    elToolbar = document.getElementById('toolbar'),
    elFullscreen = document.getElementById('fullscreen'),
    mapInfo = document.getElementById('map-info');
    elMapContainer.width(window.innerWidth).height(window.innerHeight);
    elMap.width(window.innerWidth).height(window.innerHeight);
    // elFullWidth.width(window.innerWidth).height(window.innerHeight);
    elToolbar.style.marginTop = (window.innerHeight - 40 + 'px');
}

AttachEvent(infoToggle, 'click', 
    function(e) { 
        if (mapInfo.className == 'show') {
            mapInfo.className = 'hide';
            // infoBtn.innerHTML = 'Insight';
            // infoIcon.src = 'right.png'
            infoIcon.className = 'hide';
            infoBtn.className = 'transition open';
            setTimeout(function() {
                infoBtn.className = 'open';
            }, 800);
        } else {
            mapInfo.className = 'show'                        
            // infoBtn.innerHTML = 'Hide';          
            // infoIcon.src = 'close-white.png'
            infoIcon.className = ''
            infoBtn.className = 'transition close';
            setTimeout(function() {
                infoBtn.className = 'close';
            }, 800);        
        }
    }
)

AttachEvent(infoToggle, 'mouseover', 
    function(e) {
        if (infoBtn.className.indexOf("hover") == -1) {
            infoBtn.className += " hover";
        }
    }
)

AttachEvent(infoToggle, 'mouseout', 
    function(e) { 
        if (infoBtn.className.indexOf("hover")) {
            infoBtn.className = infoBtn.className.split(' hover')[0]
        }
    }
)
