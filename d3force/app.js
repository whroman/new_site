var editMode = false,
    selectedNode = null;

var draw = function(json, width, height) {

var nodeList = {}, 
    typeArray = [],
    index = 0;

for (i in json.nodes) {
    json.nodes[i].index = index;
    index++;
}

// Compute the distinct nodeList from the json.
for ( i=0; i<json.links.length; i++) {
    var link = json.links[i];

    link.source = nodeList[json.nodes[link.source]['class'] + link.source] || 
        (nodeList[json.nodes[link.source]['class'] + json.nodes[link.source].index] = {
            title: json.nodes[link.source].properties.title,
            classing: (json.nodes[link.source]["class"]), 
            properties: (json.nodes[link.source].properties),
            index: json.nodes[link.source].index,
            name: (json.nodes[link.source]['class'] + json.nodes[link.source].index),
            value: 0,
            pinned: false
        });

    link.target = nodeList[json.nodes[link.target]['class'] + '' + link.target] || 
        (nodeList[json.nodes[link.target]['class'] + json.nodes[link.target].index] = {
            title: json.nodes[link.target].properties.title,
            classing: (json.nodes[link.target]["class"]), 
            properties: (json.nodes[link.target].properties),
            index: json.nodes[link.target].index,
            name: (json.nodes[link.target]['class'] + json.nodes[link.target].index),
            value: 0,
            pinned: false
        });

};

// ##variables

var levelsWhichOrbit = [1,2,3],
    width = width,
    height = height,
    canvasWidth = 30000,
    canvasHeight = 20000,
    fixedNodes = false,
    linkLength = 3200,
    panWidth = canvasWidth*2/5,
    panHeight = canvasHeight*2/5,
    maxZoomOut = 0.05,
    maxZoomIn = 1.4,
    radianOffset = Math.PI/6,
    zoomInstance = d3.behavior.zoom(),
    zoomArray, 
    currentScale = 0.1,
    newScale = 0.1, 
    translateArray = [-panWidth,-panHeight], 
    newTranslateX, 
    newTranslateY, 
    zoomVars, 
    ratio = function() {return currentScale/newScale*zoomVars[0]};

var counterTwo = 0,
    counterThree = 0;

for ( i in nodeList) {
    nodeList[i].numOfLinks = 0;
    nodeList[i].numOfSignals = 0;
    for ( k in json.links ) {
        if (json.links[k].source) {
            if (nodeList[i].name == json.links[k].source.name || nodeList[i].name == json.links[k].target.name) {
                if ( json.links[k].target.name.indexOf("signal") == -1 && json.links[k].source.name.indexOf("signal") == -1 ) {
                    nodeList[i].numOfLinks += 1
                } else {
                    nodeList[i].numOfSignals += 1
                }
            }          
        }
    }
}

function lengthDecay (length, level) {
    if (!level) level = 1;
    var newLength = Math.ceil(length * Math.pow(0.8, level));
    return newLength
}

// #nodetree
var nodeTree = {}
for ( i in nodeList) {
    nodeTree[nodeList[i].name] = [{'source': 0 }, {'targets': 0}];
}

var allNodes = [];
for ( i in json.links ) {
    var node = json.links[i];
    if (node.target) {
        allNodes.push([node.target.name, []])
    }
}

allNodes.forEach( 
    function(n) {
        for ( i in json.links ) {
            var node = json.links[i];
            if (node.target && n[0] == node.target.name) {
                n[1].push(node.source.name)
            }
        }
    }
)

var nodeTree = [];
var one = new Date().getTime()

allNodes.forEach( function (n) {
    nodeTree[n[0]] = {name: n[0], targets: {}};

    n[1].forEach( function (m) {
        nodeTree[n[0]].targets[m] = {
            name: m, targets: {}
        }
    })
})

for ( a in nodeTree ) {
    for ( b in nodeTree[a].targets ) {
        for ( c in nodeTree ) {
            if (nodeTree[a].targets[b].name == nodeTree[c].name) {
                nodeTree[a].targets[b] = nodeTree[c];
                delete nodeTree[c]
            }
        }
    }
    nodeTree.length += 1 || nodeTree.length == 0;
}

for ( a in nodeTree ) {
    for ( b in nodeTree[a].targets ) {
        for ( d in nodeTree[a].targets[b].targets ) {
            for ( c in nodeTree ) {
                if (nodeTree[c].name == nodeTree[a].targets[b].targets[d].name) {
                    nodeTree[a].targets[b].targets[d] = nodeTree[c]
                    delete nodeTree[c]
                }
            }
        }
    }    
}

var nodeTreeDepth = -1;
var nodeTreeEnds  = [];
var nodesPerLevel = {};

function depthOfObj (obj, parent) {
    if ( Object.keys(obj)[0] != undefined) {
        nodeTreeDepth += 1;
        for ( a in obj ) {
            if ( nodesPerLevel['lvl' + nodeTreeDepth] == undefined) {
                nodesPerLevel['lvl' + nodeTreeDepth] = 1;
            } else {
                nodesPerLevel['lvl' + nodeTreeDepth] += 1;
            };
            if (obj[a].name) {
                nodeList[obj[a].name].depth = nodeTreeDepth;
                if (parent.name) { 
                    nodeList[obj[a].name].parentNode = parent.name;
                };
                obj[a].depth = nodeTreeDepth;
                depthOfObj(obj[a].targets, obj[a]);               
            }
        } 
        if (parent) {
            nodeTreeDepth = parent.depth;
        }
    } else {
        nodeTreeEnds.push(nodeTreeDepth)
        nodeTreeDepth = parent.depth;
    }
}
depthOfObj(nodeTree, '')
nodeTreeDepth = Math.max.apply(null, nodeTreeEnds);

var thirdCounter = -1,
    secondCounter = thirdCounter * 3;

var setOrbit = function(parentName, uniqueCounter) {
    var tbr,
        varLength = linkLength,
        numOfSatellites = (nodeList[parentName].numOfLinks + nodeList[parentName].numOfSignals);
    if ( parentName == "mapname0") {
        tbr = 0
    } else {
        tbr = 1;
        // radianOffset = 2 * Math.PI / numOfSatellites;
        varLength /= Math.pow(2, nodeList[parentName].depth * 1.25);
    }
//     ===>                                                                                          Minus "tbr" accounts for parentNode
    var xx = Math.round(varLength * Math.cos( radianOffset + (2 * Math.PI / (numOfSatellites - tbr) * uniqueCounter)) + nodeList[parentName].x),
        yy = Math.round(varLength * Math.sin( radianOffset + (2 * Math.PI / (numOfSatellites - tbr) * uniqueCounter)) + nodeList[parentName].y);
    return [xx, yy];
}

function recurseTree (toRecurse, parent) {
    var counter = 0,
        countObject = {};
    for ( a in toRecurse ) {
        if (toRecurse[a].depth == 0 ) {
            nodeList[toRecurse[a].name].x = canvasWidth/2;
            nodeList[toRecurse[a].name].y = canvasHeight/2;
            nodeList[toRecurse[a].name].fixed = true;
        } else if (toRecurse[a].depth == 1 || toRecurse[a].depth == 2  || toRecurse[a].depth == 3 ) {
            if (!countObject[parent.name]) {
                countObject[parent.name] = 0;
            }
            var thisXY = setOrbit(parent.name, countObject[parent.name]);
            nodeList[toRecurse[a].name].x = thisXY[0];
            nodeList[toRecurse[a].name].y = thisXY[1];
            nodeList[toRecurse[a].name].fixed = fixedNodes;
            countObject[parent.name]++;
        } else if ( toRecurse[a].depth == nodeTreeDepth) {


            var thisDepth = toRecurse[a].depth,
                newLength = (linkLength * thisDepth) + Math.round(linkLength * nodesPerLevel['lvl'+(thisDepth-1)]/nodesPerLevel['lvl'+(thisDepth)])
            nodeList[toRecurse[a].name].x = newLength * Math.cos( radianOffset + (2 * Math.PI / nodesPerLevel['lvl'+(thisDepth)] * secondCounter)) + canvasWidth/2;
            nodeList[toRecurse[a].name].y = newLength * Math.sin( radianOffset + (2 * Math.PI / nodesPerLevel['lvl'+(thisDepth)] * secondCounter)) + canvasHeight/2;
            nodeList[toRecurse[a].name].fixed = fixedNodes;            
            secondCounter++
        } else if ( toRecurse[a].depth == nodeTreeDepth - 1) {
            var thisDepth = toRecurse[a].depth,
                newLength = (linkLength * thisDepth) + Math.round(linkLength * nodesPerLevel['lvl'+(thisDepth-1)]/nodesPerLevel['lvl'+(thisDepth)]);
            nodeList[toRecurse[a].name].x = newLength * Math.cos( radianOffset + (2 * Math.PI / nodesPerLevel['lvl'+(thisDepth)] * thirdCounter)) + canvasWidth/2;
            nodeList[toRecurse[a].name].y = newLength * Math.sin( radianOffset + (2 * Math.PI / nodesPerLevel['lvl'+(thisDepth)] * thirdCounter)) + canvasHeight/2;
            nodeList[toRecurse[a].name].fixed = fixedNodes;            
            thirdCounter++
        } else {
            if (parent) {
                for ( b in json.links) {
                    if ( parent.name == json.links[b].source.name) {
                        var grandNode = json.links[b].target.name
                    }
                }
                branch(
                // Parent X
                    nodeList[parent.name].x, 
                // Parent Y
                    nodeList[parent.name].y, 
                // Grandparent X
                    nodeList[grandNode].x, 
                // Grandparent Y
                    nodeList[grandNode].y, 
                // Number of Links
                    nodeList[parent.name].numOfLinks
                );
                nodeList[toRecurse[a].name].x = childArray[counter][0];
                nodeList[toRecurse[a].name].y = childArray[counter][1];        
                nodeList[toRecurse[a].name].fixed = fixedNodes;
            }
        }
        recurseTree (toRecurse[a].targets, toRecurse[a])
        counter++
    }
    if (parent) {
        x = parent.depth
    }
}



// #branch
var branch = function(ex, why, grandEx, grandWhy, relationships) {
    var w, h, hyp, tan, rad; childArray = [], invisiLinks = 4;
    hyp = Math.sqrt(
            (ex - grandEx )*(ex - grandEx ) +
            (why - grandWhy )*(why - grandWhy ) *
            0.8       
        );
    tan = Math.atan((why - grandWhy)/(ex - grandEx));
    rad = 2 * Math.PI / (relationships + invisiLinks);
        for (n=0;n<(relationships+invisiLinks);n++) {
            ([ex + Math.cos(tan + rad*n )*hyp, why + Math.sin(tan + rad*n)*hyp])
        }
    if (grandEx - ex > 0) {
        for (n=invisiLinks-1;n<=(relationships+invisiLinks/2);n++) {
            childArray.push([ex + Math.cos(tan + rad*n )*lengthDecay(hyp), why + Math.sin(tan + rad*n)*lengthDecay(hyp)])
        }
    } else {
        for (n=invisiLinks-1;n<=(relationships+invisiLinks/2);n++) {
            childArray.push([ex - Math.cos(tan + rad*n )*lengthDecay(hyp), why - Math.sin(tan + rad*n)*lengthDecay(hyp)])
        }
    }
}

var two = new Date().getTime();

// #recreate #redraw #parse #json
function recreateMap(mapString) {
    mapString = mapString.replace(/%22/gi, '"')
    var mapObj = JSON.parse(mapString);

    for (a in nodeList) {
        var preciousSpace = 
            mapObj[nodeList[a].classing][
                nodeList[a].name
                    .slice(nodeList[a].classing.length, 
                    nodeList[a].name.length)
            ]
        if (nodeList[a] != undefined) {
            nodeList[a].x = preciousSpace.x;
            nodeList[a].y = preciousSpace.y;
            nodeList[a].fixed = true;;
        }
    }


    if (mapObj['pop-ups'] != "") {
        // alert(mapObj["pop-ups"])
        for (var a in mapObj["pop-ups"]) {
            nodeList[mapObj["pop-ups"][a]].pinned = true;        
        }
    }

    return mapObj;
}

// #sniff #url

function sniffURL () {
    var walter = location.search;
    return walter.slice(("?shareMode=true?").length, walter.length);
}

var mapObj = null;
if (sniffURL() == "") {
    recurseTree(nodeTree)
} else {
    mapObj = recreateMap(sniffURL())
}

//#FORCE
var force = d3.layout.force()
    .nodes(d3.values(nodeList))
    .links(json.links)
    .size([canvasWidth, canvasHeight])
    .friction(0.6)
    .charge( 
        function(d) { 
            var radius = 750;
            if (d.classing == "signal") {
                d.r = lengthDecay(radius, nodeTreeDepth*2.15)
            } else {
                d.r = lengthDecay(radius, d.depth*2.15);
            };
            if ( d.depth == 0 ) {
                return -((d.r + ((d.depth+2)*(d.depth+2))) * 150);
            } else if (d.depth == nodeTreeDepth) {
                return -((d.r + ((d.depth+2)*(d.depth+2))) * 400);
            } else {
                return -((d.r + ((d.depth+2)*(d.depth+2))) * 250);
            }
        }
    )
    .linkStrength(0.8)
    .linkDistance(
        function(d) {
            if ( d.target.depth == 0 ) {
                return 5*30;
            } else {
                return (5/(d.target.depth+1))*250;                
            }
    })
    .gravity(0.1)
    .on("tick", tick)
    .start();

//##ZOOM ##SCROLL
var svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height)
    .attr('pointer-events', 'all')
.append('svg:g')
    .attr('id','zoomer')
    .on("mouseup", function() {
        selectedNode = null;
    })
    .call( zoomInstance
        .scaleExtent([maxZoomOut, maxZoomIn])
// .scale and .translate below must be same values as their equivalent under
//      the transform property for #map-svg
        .scale(        
            mapObj == null
                ? currentScale
                : mapObj["mapSvg"].scale
        )
        .translate([
            mapObj == null
                ? -(( canvasWidth * currentScale - width ) / 2 )
                : mapObj["mapSvg"].x
            ,
            mapObj == null
                ? -(( canvasHeight * currentScale - height ) / 2 )
                : mapObj["mapSvg"].y
        ])
        .on('zoom',
            function() {
                if (!d3.event.sourceEvent.target.className.baseVa && selectedNode == null) {
                    if ( d3.event.sourceEvent.wheelDelta > 0) {
                        zoomSetup('zoom-in', 'wheel');
                    } else if ( d3.event.sourceEvent.wheelDelta < 0 ) {
                        zoomSetup('zoom-out', 'wheel');                    
                    } else {
                        zoomSetup();                                        
                    }

                    translateXY(zoomArray[0]);
                    containWithinCanvas(d3.event.translate);
                    nodeContentScaler();

        // Does not directly affect styling
        // Properties exist for simplicity in accessing values
                    d3.select('#map-svg')
                        .property('translateX', d3.event['translate'][0])
                        .property('translateY', d3.event['translate'][1])
                        .property('scale', d3.event['scale'])

                    redraw(d3.event.scale, d3.event.translate);
        // Scales pop-up (Needs to be pluralized)
                    var allPopups = d3.selectAll('.pop-up')[0];
                    if (allPopups[0]) {
                        for (popup in allPopups) {
                            if (popup != 'parentNode') {
                                var thisNode = d3.select('.node.' + allPopups[popup]['name'])[0][0],
                                    toParse = thisNode['attributes'][2]['value'];
                                translateXY(toParse);
                                stylePopup( translateX, translateY, thisNode, d3.select(allPopups[popup]))      
                            }
                        }
                    }
                }
            }
        )
    )    
.append('svg:g')
    .attr('id','map-svg')
    .attr('transform', function() {
        return mapObj == null 
        ? 'translate(-'+ ( ( canvasWidth * currentScale - width ) / 2 ) + ',-'+ ( ( canvasHeight * currentScale - height ) / 2 ) + ') scale(' + currentScale + ')'
        : 'translate('+ mapObj["mapSvg"].x + ','+ mapObj["mapSvg"].y + ') scale(' + mapObj["mapSvg"].scale + ')'
    })
    .property('translateX',
        mapObj == null
        ? (( canvasWidth * currentScale - width ) / 2 )
        : mapObj["mapSvg"].x
    )
    .property('translateY',
        mapObj == null
        ? (( canvasHeight * currentScale - height ) / 2 )
        : mapObj["mapSvg"].y
    )
    .property('scale', 
        mapObj == null 
        ? currentScale 
        : mapObj["mapSvg"].scale
    )
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)

svg.append('svg:rect')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .attr('id', 'rect');

var zoominButton = d3.select('#zoomin');
var zoomoutButton = d3.select('#zoomout');
var zoomer = d3.select('#zoomer');
var map = document.getElementById('map-svg');

var redraw = function(scale, trans) {
    svg.attr("transform",
        "translate(" + trans + ")" +
        " scale(" + scale + ")");
};

var translateXY = function(toParse) {
    translateArray = toParse.split(",");
    if (!translateArray[1]) {
        translateArray = toParse.split(" ");
    }

    translateX = translateArray[0].match(/(-?)(\d+).\d+/g) || translateArray[0].match(/(-?)(\d+)/g);
    translateY = translateArray[1].match(/(-?)(\d+).\d+/g) || translateArray[1].match(/(-?)(\d+)/g);

    translateX = parseFloat(translateX);
    translateY = parseFloat(translateY);
}

var zoomSetup = function(inOrOut, wheelOrClick) {
    if (inOrOut == 'zoom-in' ) {
        zoomVars = [3/2, -1/6]
    } else if (inOrOut == 'zoom-out') {
        zoomVars = [3/4,(1/6)]
    } else {
        zoomVars = [1, 1]
    }

    zoomArray = map.attributes['transform'].value.split(") ");
    currentScale = zoomArray[1].match(/\d+.\d+/g) || zoomArray[1].match(/\d+/g);

    if (wheelOrClick == 'wheel') {
        newScale = d3.event.scale;
    } else {
        newScale = currentScale*(zoomVars[0]);
    }

    if (wheelOrClick == 'wheel') {
        return 
    } else if (newScale < maxZoomIn && newScale > maxZoomOut) {
        translateXY(zoomArray[0]);

        var mapSVG = document.getElementById('map-svg').attributes;
        var curW,
            newW,
            newX,
            curScaledW,
            newScaledW;
        for ( a in mapSVG ) {
            if (mapSVG[a].name == ['width']) {
                curW = document.getElementById('map-container').offsetWidth;
                curH = document.getElementById('map-container').offsetHeight;
                newX = translateX * zoomVars[0] + (curW * zoomVars[0] * zoomVars[1]);
                newY = translateY * zoomVars[0] + (curH * zoomVars[0] * zoomVars[1]);
            }
        }
        translateArray = [newX, newY];
    } else if (ratio() == 1) {
        return 
    }
}

zoominButton
  .on('click', function() {
    zoomSetup('zoom-in');

    if (newScale <= maxZoomIn && newScale >= maxZoomOut) {

        containWithinCanvas(translateArray)

        zoomInstance
            .scaleExtent([maxZoomOut,maxZoomIn])
            .scale(newScale)
            .translate(translateArray);
        redraw(newScale, translateArray);
    }
    nodeContentScaler();
  })

zoomoutButton
  .on('click', function() {
    zoomSetup('zoom-out');
    if (newScale <= maxZoomIn && newScale >= maxZoomOut) {

        containWithinCanvas(translateArray)
      zoomInstance
        .scaleExtent([maxZoomOut,maxZoomIn])
        .scale(newScale)
        .translate(translateArray);
      redraw(newScale, translateArray);
    }
    nodeContentScaler();
  })

d3.select('#toolbar').
        style('margin-top', function(d) {
            return (document.getElementById('map').offsetHeight - 40) + 'px' 
        } )

var browserEl = document.getElementById('map-container'),
        largestX = 0,
        smallestX = canvasWidth,
        largestY = 0,
        smallestY = canvasHeight;

function containWithinCanvas (transArr) {
    var browserWidth = browserEl.offsetWidth,
        browserHeight = browserEl.offsetHeight;

    limitBottom = (browserHeight/2 - largestY*newScale),
    limitTop = (browserHeight/2- smallestY*newScale),
    limitLeft = (browserWidth/2 - largestX*newScale),
    limitRight = (browserWidth/2 - smallestX*newScale);

    if (transArr[1] <= limitBottom) {
        transArr[1] = limitBottom;
    } else if ( transArr[1] >= limitTop) {
        transArr[1] = limitTop;
    } 

    if (transArr[0] <= limitLeft) {
        transArr[0] = limitLeft;
    } else if ( transArr[0] >= limitRight) {
        transArr[0] = limitRight;
    } 

    if (transArr[0] <= (browserWidth-canvasWidth*newScale) ) {
        transArr[0] = browserWidth-canvasWidth*newScale;
    } else if (transArr[0] >= 0) {
        transArr[0] = 0;
    }
}

function showTextOrIcon(level, text, icon, scaleVary) {
    d3.selectAll(level + ' ' + icon)
        .each( function(d) { 
            if ( d.properties.title != "" && d.properties.subtitle != "" ) {
                var thisNode = d3.select('g#' + d.name);
                if (newScale <= (maxZoomOut * scaleVary)) {
                    thisNode
                        .select(text)             
                        .classed('display-none', true )
                    thisNode
                        .select(icon)
                        .attr('height', function(d) { return d['r'] + 'px'} )
                        .attr('width', function(d) { return d['r'] + 'px'} )
                        .attr('x', function(d) { return -d['r']/2 } )
                        .attr('y', function(d) { return -d['r']/2 } )
                } else {
                    thisNode
                        .select(text)             
                        .classed('display-none', false)
                    thisNode
                        .select(icon)
                        .attr('height', function(d) { return d['r']/1.6 + 'px'} )
                        .attr('width', function(d) { return d['r']/1.6 + 'px'} )
                        .attr('x', function(d) { return -d['r']/3.2 } )
                        .attr('y', function(d) { return -d['r']*4/5 } )
                };
            }            
        });
}

// Replaces content based on scale
var nodeContentScaler = function() {
    for (i=0;i<=nodeTreeDepth;i++) {
        showTextOrIcon('.node.lvl' + i, '.node-text', '.icon', 0.8 + 0.8 * i)
    }

    if (zoomOutBtn) {
        if (newScale <= maxZoomOut) {
            zoomOutBtn
                .classed('max', true)
        } else {
            zoomOutBtn
                .classed('max', false)
        }
        if (newScale >= maxZoomIn) {
            zoomInBtn
                .classed('max', true)
        } else {
            zoomInBtn
                .classed('max', false)
        }        
    }
}

// #getmapstring #json
getMapString = function() {
    var mapObj = {},
        popUps = [],
        mapSvg = d3.select("#map-svg");
    d3.selectAll("g.node").each(function(d) {

        if (!mapObj[d.classing]) mapObj[d.classing] = {};

        mapObj[d.classing][d.name.slice(d.classing.length, d.name.length)] = {
            x: parseInt(d.x),
            y: parseInt(d.y),
        }

    })
    d3.selectAll("#map-container .pop-up").each(function(d) {
        var temp = this.className.replace(/pop-up /gi, "");
        // temp.slice(temp.indexOf("pop-up"),("pop-up ").length);
        popUps.push(this.className.split(" ")[1]);
    })

    mapObj["pop-ups"] = popUps;

    mapObj["mapSvg"] = {
        scale: mapSvg.property("scale"),
        x: mapSvg.property("translateX"),
        y: mapSvg.property("translateY"),        
    };

    mapObj = JSON.stringify(mapObj);
    return mapObj;
}
// var walter = location.search
// walter = walter.slice(1, walter.length);

var shareBtn = d3.select("#share");
shareBtn.attr("counter", 0);
d3.select("#share .btn")
    .on("mouseover", function() {
        var newMap = location.origin + location.pathname + "?shareMode=true?" + getMapString();
        d3.select("#share .field")
            .attr("value", newMap)
})
    .on("click", function() {
        shareBtn.attr("counter", function () {
            return parseFloat(shareBtn.attr("counter")) + 1;
        })
        shareBtn.classed("has-link", function () {
            return (parseFloat(shareBtn.attr("counter")) % 2 == 0) ? false : true;
            return true;
        })
});

// #BUILD #nodeList
var node = svg.selectAll("g")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", function(d) {
        if (d["classing"]== 'signal') {
            return ("node "+ d.name + " waiting lvl" + nodeTreeDepth)            
        } else {
            return ("node "+ d.name + " waiting lvl" + d.depth)            
        }
    })
    .attr('id', function(d) {return d.name})
    .property('translateX', function(d) { return d.x})
    .property('translateY', function(d) { return d.y})
    .on('mouseover', mouseover)
    .on('mouseout', mouseout)
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .on("click", function(d, i, a) {
        if (!!d3.select(".create-node")[0][0]) {
            click(d);
            click(d);
        } else {
            click(d)
        }
    })
    .on("touchstart", function(d,i,a) {
        if (!d3.select('.pop-up.' + d.name)[0][0]) {
            mouseover(d,i,a);
            click(d, i, a);
        } else {
            click(d, i, a);
            mouseout(d,i,a);
        }
    })
    .call(force.drag);

function mousedown () {
    if (editMode == true) {
        selectedNode = this;
    }
}

function mouseup () {
    if (editMode == true) {
        selectedNode = null;
    }
}

// Edit force.drag @ d3.js line 518


// BUILD #CIRCLES
node.append("circle")
    .attr("r", function(d) {
        return d.r
    })
    .attr('class', function(d) { 
        if (d.classing == 'signal') {
            return d.classing + ' ' + d.name + ' dont-light ' + nodeList[nodeList[d.name].parentNode].classing;
        } else {
            return d.classing + ' ' + d.name + ' dont-light';           
        }
    })
    .attr('id', function(d) { return d.name })
    .attr('name', function(d) { return d.name })
    .style('fill', function(d) { 
        var circ = d3.select('circle#' + d.parentNode)[0][0];
        if (circ && d.classing == 'signal') {
            return circ.style.fill; 
        } else {
            return d.properties.color;
        }

    })
    .style('opacity', function(d) { return d.properties.opacity })

node.append("circle")
    .attr("r", function(d) { return d['r'] })
    .attr('class', function(d) { return 'invis ' + d.name})
    .style('opacity', '0')

force.start();

// #redraw #pinnedNodes #pop-ups
var pinnedNodes = d3.selectAll("g.node").filter( function (d) {
    return d.pinned;
});

pinnedNodes.each(function(d) {
    mouseover(d);
    click(d);
})
//// #orbitals
var levelsThatOrbit = [];

// Declares all nodes that are in an orbital relationship
//      By passing "orbit" class and setting them to be fixed
for ( a = 0; a < levelsWhichOrbit.length; a++ ) {
    var thisLvl = d3.selectAll("g.node")
        .filter(function(d) {
            if (d.depth == levelsWhichOrbit[a]) {
                return true
            } else {
                return false
            }
        })
        .classed("orbit", function(d) {
            d.fixed = true;
            d3.select("g#" + d.parentNode + ".node").datum().fixed = true;
            return true
        })
    levelsThatOrbit.push(thisLvl);
}

var roman = {};

// Sorts all nodes with class "orbit" into an object
//      where parent node names are keys to their children
for ( a = 0; a < levelsThatOrbit.length; a++ ) {
    if ( levelsWhichOrbit[a] > 1 ) {
        levelsThatOrbit[a].each(function(d) {
            if (!roman[d.parentNode]) {
                roman[d.parentNode] = levelsThatOrbit[a].filter(function(e) {
                    if ( d.parentNode == e.parentNode ) { return true }
                    else { return false }
                });                
            };
        });
    };
};

levelsThatOrbit.pop();
levelsThatOrbit.pop();
for ( b in roman ) {
    levelsThatOrbit.push(roman[b]);
}

roman["mapname0"] = d3.selectAll("g.node.lvl1");

// BUILD Relationship Lines ##links ##paths
var path = svg
    .insert("svg:g", "#rect")
    .attr('id','paths')
    .selectAll("line")
    .data(force.links())
    .enter().append("svg:line")
        .attr("class", function(d) {
            if ( d3.select("g.node." + d.source.name).classed("orbit") ) {
                return "link orbiting " + d.source.name + ' ' + d.target.name + ' not-me'; 
            } else {
                return "link " + d.source.name + ' ' + d.target.name + ' not-me'; 
            }
        })
        .attr('source', function(d) { return d.source.name})
        .attr('target', function(d) { return d.target.name})

var sortNodeOrbits = function(lvlsThatOrbit) {
    for (i=0; i < lvlsThatOrbit.length; i++) {
// "thisParent" is needed to know coordinates of parent, around which nodes are sorted by quadrants
        thisParent = d3.select("g#" + lvlsThatOrbit[i].datum().parentNode + ".node").datum();
        var counter = 0;
        lvlsThatOrbit[i] = lvlsThatOrbit[i].sort(function (a, b) {
            var offXa = thisParent.x - a.x,
                offYa = thisParent.y - a.y,
                offXb = thisParent.x - b.x,
                offYb = thisParent.y - b.y,
                aRad = Math.abs(Math.atan( offYa / offXa )),
                bRad = Math.abs(Math.atan( offYb / offXb ));

//  A          // Quadrant - -
                if ( offXa < 0 && offYa <= 0 ) {aRad = aRad}
//             // Quadrant + - 
                else if ( offXa >= 0 && offYa < 0 ) { aRad = Math.abs(aRad - Math.PI ) }
//             // Quadrant + +
                else if ( offXa > 0 && offYa >= 0 ) { aRad = aRad + Math.PI }
//             // Quadrant - +
                else if ( offXa <= 0 && offYa > 0 ) { aRad = Math.abs(aRad - Math.PI * 4) };

//  B          // Quadrant - -
                if ( offXb < 0 && offYb <= 0 ) {bRad = bRad}
//             // Quadrant + - 
                else if ( offXb >= 0 && offYb < 0 ) {  bRad = Math.abs(bRad - Math.PI ) }
//             // Quadrant + +
                else if ( offXb > 0 && offYb >= 0 ) { bRad = bRad + Math.PI }
//             // Quadrant - +
                else if ( offXb <= 0 && offYb > 0 ) { bRad = Math.abs(bRad - Math.PI * 4) };

            counter++;

            if ( aRad < bRad ) { return -1 } else { return 1 }
        });
    }
}

var hexToRGBConverter = function(hex) {
    var hexToRGB = {
        "A": "10",
        "B": "11",
        "C": "12",
        "D": "13",
        "E": "14",
        "F": "15",
        "a": "10",
        "b": "11",
        "c": "12",
        "d": "13",
        "e": "14",
        "f": "15",
        },
        hexArray = hex.substring(1).split('');
    for ( r = 0; r < hexArray.length; r++ ) {
        if (hexToRGB[hexArray[r]]) {
            hexArray.splice(r, 1, hexToRGB[hexArray[r]])
        }
        hexArray[r] = parseFloat(hexArray[r]);
    }
    return ( hexArray[0] * 16 + hexArray[1] ) + "," + ( hexArray[2] * 16 + hexArray[3] ) + "," + ( hexArray[4] * 15 + hexArray[5] );
}

var drawOrbits = function(lvlsThatOrbit) {
    for ( i = 0; i < lvlsThatOrbit.length; i++ ) {
        thisLvl = lvlsThatOrbit[i];
        for ( b in thisLvl[0]) {
            b  = parseFloat(b)
            if ( b >= 0 ) {
                var arc = thisLvl[0][b],
                    arc2,
                    parentData = d3.select("g.node." + arc.__data__.parentNode)[0][0].__data__,
                    rgbFromHex = hexToRGBConverter(parentData.properties.color);
                if (thisLvl[0][b + 1]) {
                    arc2 = thisLvl[0][b + 1]
                } else {
                    arc2 = thisLvl[0][0]
                }
                d3.select("#paths")
                .append("svg:path")
                    .attr("class", "curvedpath")
                    .property("parent", function(d) {
                        d3.select('g#' + parentData.name + '.node')
                            .classed("orbParent", true);
                        return parentData   
                    })
                    .style("stroke", parentData.properties.color)
                    .style("stroke-width", (nodeTreeDepth - parentData.depth) * 30 + "px")
                    .style("fill", "rgba(" + rgbFromHex + ",0)")
                    .property("source", arc.__data__)
                    .property("target", arc2.__data__);
            }
        }
    }
}

sortNodeOrbits(levelsThatOrbit);
drawOrbits(levelsThatOrbit);

for ( i = 0; i <= nodeTreeDepth; i++ ) {
    d3.selectAll(".node.lvl" + i).insert('svg:image','.invis')
        .attr('xlink:href', function(d) { return d.properties.icon })
        .attr('class', function(d) {return 'icon ' + d.name})
        .attr('width', function(d) { 
            if ( d.depth != 0 ) {
                return d["r"] + "px"
            } else {
                return d["r"] * 1.6 + "px"
            }
        } )
        .attr('height', function(d) { 
            if ( d.depth != 0 ) {
                return d["r"] + "px"
            } else {
                return d["r"] * 1.6 + "px"
            }
        } )
        .attr('x', function(d) { 
            if ( d.depth != 0 ) {
                return -d["r"]/2 + "px"
            } else {
                return -d["r"] * 0.8 + "px"
            }
        } )
        .attr('y', function(d) { 
            if ( d.depth != 0 ) {
                return -d["r"]/2 + "px"
            } else {
                return -d["r"] * 0.8 + "px"
            }
        } )
}

// ##Text ##Algorithms

function stripHTML(dirtyString) {
    var temp = document.createElement('div');
    temp.innerHTML = dirtyString;
    return temp.textContent || temp.innerText;
}

var aToZ = d3.select('#aToZ'),
    letters = 'abcdefghijklmnopqrstuvwxyz',
    letterArray = {};

for ( i = 0; i < letters.length; i++ ) {
    aToZ.append('div')
        .attr('id', letters[i])
        .classed('letter', true)
        .text(letters[i])
}

var let = d3.selectAll('.letter');

let.attr('walt', function (d, i) {
        letterArray[let[0][i].id] = let[0][i].offsetWidth;
    });

var newTextInject = function(title, text, dname) {
    var testText = stripHTML(text),
    testText = testText.split(' '),
    titleText = stripHTML(title),
    titleText = titleText.split(' '),
    testPx = 0,
    i = 0,
    n = 0,
    limit = 5,
    fitText = [];
    for ( k=0; k < limit; k++ ) {
        testPx = 0;
        fitText = [];

        if (titleText[i]) {
            while ( testPx < (150 - 5 * k) && i < titleText.length ) {
                for ( var j = 0; j < titleText[i].length; j++ ) {
                    if (letterArray[titleText[i][j]]) {
                        testPx += letterArray[titleText[i][j]]
                    } else {
                        testPx += 4;
                    }                    
                }
                testPx += 4;
                if (testPx < (150 - 5 * k )) {
                    fitText.push(titleText[i]);
                    i++;    
                } 
            }
            d3.select('.node-text.' + dname)
                .append('svg:tspan')
                .classed('title', true)
                .text(fitText.join(' '))
                .style('font-size', function(d) {
                    return d.r/8 +'px';
                })
                .attr('x', 0)
                .attr('dy', '1.3em')
        } else if (testText[n]) {
            while ( testPx < (150 - 5 * k) && n < testText.length ) {
                for ( j = 0; j < testText[n].length; j++ ) {
                    if (letterArray[testText[n][j]]) {
                        testPx += letterArray[testText[n][j]]
                    } else {
                        testPx += 4;
                    }                    
                }
                testPx += 4;
                if (testPx < (150 - 5 * k )) {
                    fitText.push(testText[n])    
                    n++;                            
                } else if ( k == limit - 1 ) {
                        fitText.push('[...]');
                }
            }
            d3.select('.node-text.' + dname)
                .append('svg:tspan')
                .classed('description', true)
                .text(fitText.join(' '))
                .style('font-size', function(d) {
                    return d.r/10 +'px';
                })
                .attr('x', 0)
                .attr('dy', '1.3em')
        }
    }
    return fitText
}

var dText = function(selection) { 
    selection.append('svg:text')
        .attr('class' , function(d) {return 'node-text ' + d.name + ' ' + d["classing"]})
        .attr('width', function(d) { return d.r * 2})
        .each( function(d) {
            newTextInject(d.properties.title, d.properties.description, d.name);
        })
        .attr('transform', function(d) {
            valign = d.r * 1/5
            return 'translate(0,-'+ valign + ')' 
        });
}

dText(d3.selectAll('.node'));

var three = new Date().getTime();
console.log('Text Parsing took:', three-two)

var zoomOutBtn = d3.select('#zoomout'),
    zoomInBtn = d3.select('#zoomin')

// #transAllChildren used in tick to translate all nodes when a parent orbititing node is dragged
var transAllChildren = function (jData) {
    if (roman[jData.name]) {
        roman[jData.name]
            .attr("transform", function(d) {
                newX = (d.x + offsetX),
                newY = (d.y + offsetY);
                d.x = newX;
                d.y = newY;
                d.px = newX;
                d.py = newY;

                return "translate(" + newX + "," + newY + ")";
            })
        if ( jData.depth + 1 < nodeTreeDepth ) {
            roman[jData.name].each( function (e) {
                transAllChildren(e)
            })
        }
    }
} 

var quadrantize = function (yourX, yourY, yourHyp) {
    if ( yourX >= 0 && yourY > 0 ) {
        return Math.asin( yourY / yourHyp );
    } else
    if ( yourX < 0 && yourY >= 0 ) {
        return Math.acos( yourX / yourHyp ) ; 
    } else
    if ( yourX <= 0 && yourY < 0 ) {
        return Math.PI - Math.asin( yourY / yourHyp );  
    } else
    if ( yourX > 0 && yourY <= 0 ) {
        return Math.PI * 2 - Math.acos( yourX / yourHyp );  
    }
}

var rotateSiblings = function (kData) {
    var par = d3.select("g#" + kData.parentNode + ".node").datum(),
        thisX = par.x - kData.x,
        thisY = par.y - kData.y,
        thisHyp = Math.sqrt(thisX * thisX + thisY * thisY),
        thisAngle = null,
        numOfSatellites = par.numOfLinks + par.numOfSignals - 1,
        countDracula = 0,
        thisAngle = quadrantize(thisX, thisY, thisHyp),
        oX = par.x - oldX,
        oY = par.y - oldY,
        oHyp = Math.sqrt(oX * oX + oY * oY),
        oldAngle = quadrantize(oX, oY, oHyp),
        offsetAngle = thisAngle - oldAngle;


    roman[kData.parentNode].each(function(sib) {
        if (kData.name != sib.name) {
            countDracula++;
            var sibX = par.x - sib.x,
                sibY = par.y - sib.y,
                sibHyp = Math.sqrt(sibX * sibX + sibY * sibY),
                sibAngle = quadrantize(sibX, sibY, sibHyp),
                rotateAngle = sibAngle + offsetAngle,
                newX = (sibHyp * Math.cos(rotateAngle)),
                newY = (sibHyp * Math.sin(rotateAngle));

                var sibPopUp = d3.select(".pop-up." + sib.name);
                if (sibPopUp[0][0]) {
                    sibPopUp
                        .style("left", function() {
                            return (parseFloat(sibPopUp.style("left")) - ( sib.x - par.x + newX )* currentScale + "px");
                        })
                        .style("top", function() {
                            return (parseFloat(sibPopUp.style("top")) - ( sib.y - par.y + newY )* currentScale + "px");
                        })
                }
            // offsetX/Y used for transAllChildren()
                offsetX = par.x - newX - sib.x;
                offsetY = par.y - newY - sib.y;

                sib.x = par.x - newX;
                sib.y = par.y - newY;
                sib.px = par.x - newX;
                sib.py = par.y - newY;

                transAllChildren(sib);
        }
    })
}

// update nodeList, relationships and popups ##tick ##links
function tick(d) {

    if (levelsWhichOrbit != []) {
        d3.selectAll(".curvedpath")
            .attr('d', function(d) {
                var dSource = this.source,
                    dTarget = this.target,
                    dParent = this.parent,
                    wx = ( dSource.x - dParent.x),
                    ax = ( dSource.x - dParent.x),
                    ay = ( dSource.y - dParent.y),
                    bx = (( dTarget.x - dParent.x) + ax ) / 2,
                    by = (( dTarget.y - dParent.y) + ay ) / 2,
                    cr = Math.sqrt( bx * bx + by * by ),
                    numOrbs = dParent.numOfLinks + dParent.numOfSignals;

                    if (dParent.depth != 0) {
                        numOrbs -= 1;
                    };
                    if (numOrbs == 2) {
                        cr = 12.5;
                    } else if (numOrbs == 3) {
                        cr *= 2;
                    } else if (numOrbs == 4) {
                        cr *= 1.5;
                    } else if (numOrbs == 5) {
                        cr *= 1.25;
                    } else if (numOrbs >= 6) {
                        cr *= 1.125;
                    };

                    return "M" + dSource.x + "," + dSource.y + 
                    "A" + cr + "," + cr + " 0 0,1 " + 
                    dTarget.x + "," + dTarget.y;
                    // "L" + dParent.x + ',' + dParent.y + "Z";
            });

        var draggedNode = d3.select(".dragging");

        if (draggedNode[0][0] != null) {
            if (draggedNode[0][0].className.baseVal.indexOf("orb") > -1) {
                if (draggedNode[0][0].className.baseVal.indexOf("orbParent") > -1 && draggedNode.attr("transform") && typeof(oldX) != "undefined") {
                    var newTrans, newX, newY,
                        thisData = draggedNode.datum();
             
                    offsetX = thisData.x - oldX,
                    offsetY = thisData.y - oldY;
                    transAllChildren(thisData);
                };

                if (draggedNode[0][0].className.baseVal.indexOf("orbit") > -1 && draggedNode.attr("transform") && typeof(oldX) != "undefined") {
                    var thisData = draggedNode.datum();
                    offX = thisData.x - oldX;
                    offY = thisData.y - oldY;
                    rotateSiblings(thisData);
                };
                oldX = draggedNode.datum().x;
                oldY = draggedNode.datum().y;

                        // oldX = thisData.x;
                        // oldY = thisData.y;
                    // } else if (draggedNode[0][0].className.baseVal.indexOf("orbit") > -1) {
                    //     if (draggedNode.attr("transform") && typeof(oldX) != "undefined") {
                    //         offsetX = thisData.x - oldX,
                    //         offsetY = thisData.y - oldY;
                    //         rotateSiblings(thisData);
                    //     }

                        // oldX = thisData.x;
                        // oldY = thisData.y;
            }
        } else {
            oldX = undefined;
            oldY = undefined;
        } 
    }


    d3.selectAll('.node')
        .attr('walt', (function(d, i) {
            if (d.x > largestX) {
                largestX = d.x
            }  else if (d.x < smallestX) {
                smallestX = d.x
            } else {

            }
            if (d.y > largestY) {
                largestY = d.y
            } else if (d.y < smallestY) {
                smallestY = d.y
            } else {

            }
        })
    );

    nodeContentScaler();

    var pathsss = d3.selectAll(".link");
    var nodesss = d3.selectAll(".node");

    pathsss.classed('white-line', function(d,i) {
        var x1 = d.source.x,
            y1 = d.source.y,
            x2 = d.target.x,
            y2 = d.target.y,
            hyp = Math.sqrt((x1 - x2)*(x1-x2) + (y1 - y2)*(y1-y2));

        if (d.source.r + d.target.r > hyp) {
            return true         
        }
    })

    pathsss.attr("x1", function(d) {
    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        rad = Math.atan((y2-y1)/(x2-x1)),
        newx1 = d.source.r * -Math.cos(rad);
        if (x2 - x1 >= 0) {
            return x1 - newx1;
        } else {
            return x1 + newx1;
        }
    });    
    pathsss.attr("y1", function(d) {
    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        rad = Math.atan((y2-y1)/(x2-x1)),
        newy1 = d.source.r * Math.sin(rad);
        if (x2 - x1 >= 0) {
            return y1 + newy1;
        } else {
            return y1 -  newy1;
        }
    });    
    pathsss.attr("x2", function(d) {
    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        rad = Math.atan((y2-y1)/(x2-x1)),
        newx1 = d.target.r * Math.cos(rad);
        if (x2 - x1 >= 0) {
            return x2 - newx1;
        } else {
            return x2 + newx1;
        }
    });
    pathsss.attr("y2", function(d) {
    var x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        rad = Math.atan((y2-y1)/(x2-x1)),
        newy1 = d.target.r * -Math.sin(rad);
        if (x2 - x1 >= 0) {
            return y2 + newy1;
        } else {
            return y2 -  newy1;
        }
    });

    nodesss.attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; 
    });

}

// Styles Pop-Up
function stylePopup(dx, dy, that, popup) {
    zoomSetup();
    translateXY(d3.select('#map-svg')[0][0].attributes[1].value.split(') ')[0]);
    var thatRadius = d3.select(that).select('circle')[0][0]['r']['baseVal']['value'];
    var popX = ( translateX + dx*currentScale + thatRadius*currentScale + 12*currentScale);
    var popY = ( translateY + dy*currentScale - thatRadius*currentScale);
    popup
        .style('left', popX + 'px')
        .style('top', popY + 'px')
        .property('nodex', dx)
        .property('nodey', dy)
        .property('offsetx', popX)
        .property('offsety', popY);
}

function popupZ(popup) {
    var zArray = [];
    d3.selectAll('.pop-up')[0].forEach(
        function(i){
            zArray.push(i.style.zIndex);
            var largestZ = Math.max.apply(Math, zArray)
            if (!largestZ) {
                popup.style('z-index', 2)
            } else {
                popup.style('z-index', largestZ + 1)
            }
        }
    )    
}

// Inserts Divs and Data into ##Pop-Up
function injectPopup(popup) {
    var thisNode = d3.select('.node.' + popup[0][0].name);
    popup.append('div')
        .attr('class', 'title')
        .text(thisNode[0][0].__data__.title);
    popup.append('div')
        .attr('class', 'subhead')
        .text('Subheader with more information');
    popup.append('div')
        .attr('class', 'maintext')
        .html("<img src='kitty.jpg'/>" + thisNode[0][0].__data__.properties.description);

    popup
        .on('mouseover', function() {
            popupZ(popup)
        })
}

// ##Sorts node-list to give selected node the highest z-index    
d3.selectAll('g.node').sort(
    function(a,b) {
        if (a['r'] > b['r']) {
            return 1
        } else return -1
    }
)

function whoIsNextToMe (that, links, neighbornodeList) {
    for (i=0;i<links[0].length;i++) {
        var classes = links[0][i].className.baseVal.split(' ');
        classes.splice(classes.indexOf(that.id),1);
        classes.splice(classes.indexOf("link"),1);
        classes.splice(classes.indexOf("orbiting"),1);

        neighbornodeList.push(classes[0])
    }
}

function clearScreen () {
    var btn = d3.select('#clear-screen');
    if (d3.select('.light')[0][0]) {
        btn.classed('display-none', false)
    } else {
        btn.classed('display-none', true)
    }   
}

// On Node Click
function click(d) {
    var thisNode = d3.select('g#' + d.name),
        thisCirc = d3.select('circle.' + d.classing + "." + d.name),
        links = d3.selectAll('.link.' + d.name),
        neighbornodeList = []; 
    whoIsNextToMe(thisNode[0][0], links, neighbornodeList);
    if (thisNode.datum().pinned == false) {
        thisNode.datum().pinned = true;

        thisNode
            .on('mouseout', 
                function(d) {
                    thisCirc
                        .classed('hover', false);
                    neighbornodeList.forEach(
                        function(name) {
                            d3.select('circle#' + name)
                                .classed('hover', false)
                        }
                    )
                }
            );

        thisCirc
            .classed('dont-light', false)
            .attr('class', function(d) {
                return (this.className.baseVal  + ' light')
            })
            .classed('hover', false)

        for(i=0;i<neighbornodeList.length;i++) {
            var thisLink = d3.select('g#' + neighbornodeList[i] + ' circle.'  + neighbornodeList[i]);
            thisLink
            .filter(function(u) {
                if (thisLink[0][0].className.baseVal.indexOf(u.classing) > -1) return true;
                return false;
            })
            thisLink
                .classed('dont-light', false)
                .classed('hover', false)
                .attr('class', function(d) {
                    return (this.className.baseVal  + ' light')
                })
        };

// Handles link UI`
        for ( var k = 0; k < neighbornodeList.length; k++) {
            var thisLink = d.name == neighbornodeList[k] 
                ? d3.select(".link." + d.name) 
                : d3.select(".link." + d.name + "." + neighbornodeList[k]);
            if (thisLink.classed("me")) {
                thisLink.attr("class", function(name) {
                    return thisLink[0][0].className.baseVal + " me" ;
                })
            } else {
                thisLink.classed("me", true)
            }
            thisLink.classed("not-me", false);
        }

        d3.select('.pop-up.' + d.name)
            .transition()
            .style('border-color', '#57c1fa');
        clearScreen();
        d3.select('.pop-up.' + d.name)
        .insert('div', 'div.title')
            .attr('class', 'close-btn')
            .on('click', 
                function() {
                    closePopUp(thisNode, d.name, neighbornodeList);
                    mouseout(d);
                }
            )
    } else {
        closePopUp(thisNode, d.name, neighbornodeList);
    }
}

function closePopUp (thisNode, dName, neighbornodeList) {
        thisNode.datum().pinned = false;
        thisNode
            .on('mouseout', mouseout)
        d3.select('circle.' + dName)
            .attr('class', function(d) {
                var classes = d3.select('circle.' + dName)[0][0].className.baseVal.split(' ');
                classes.splice(classes.indexOf('light'), 1);
                return (classes.join(' '))
            })
        if (!d3.select('circle.light.' + dName)[0][0]) {
        d3.select('circle.' + dName)
            .classed('dont-light', true)            
            .classed('hover', true)            
        }

        for(i=0;i<neighbornodeList.length;i++) {
            d3.select('circle.' + neighbornodeList[i])
                .attr('class', function(d) {
                    var classes = d3.select('circle.' + neighbornodeList[i])[0][0].className.baseVal.split(' ');
                    classes.splice(classes.indexOf('light'), 1);
                    return (classes.join(' '))
                })
            if (!d3.select('circle.light.' + neighbornodeList[i])[0][0]) {
            d3.select('circle.' + neighbornodeList[i])
                .classed('dont-light', true) 
                .classed('hover', true)           
            }
        }

        for(i=0;i<neighbornodeList.length;i++) {        
            var thisLink = d3.select('.link.' + dName + '.' + neighbornodeList[i]);
            thisLink
                .attr('class', function(d) {
                    var classes = thisLink[0][0].className.baseVal.split(' ');
                    classes.splice(classes.indexOf('me'), 1);
                    return (classes.join(' '))
                })
            if (!thisLink.classed("me")) 
                thisLink
                    .classed("not-me", true);
        }

        d3.select('.pop-up.' + dName)
            .transition()
            .style('border-color', '#f83')
        d3.select('.pop-up.' + dName).select('.close-btn').remove();

        clearScreen();
}

// ##clearpopups

var clearPopups = function() {
    var allPopups = d3.selectAll('.pop-up'),
        btn = document.getElementById('clear-screen');

    if (allPopups[0][0]) {
        allPopups.remove();
        btn.className = 'btn display-none';
        d3.selectAll('g.node')
            .on('mouseout', mouseout)
            .datum().pinned = false;
        d3.selectAll('circle')
            .classed('light', false)
            .classed('dont-light', true)
        d3.selectAll('line.link')
            .classed('not-me', true)
            .classed('me', false)
            .classed('hover', false);
    };
};

d3.select('#clear-screen')
    .on('click', clearPopups);

// On Node Mouse-Over
function mouseover(d, i) {
    if (this == window) {
        var that = d3.select('g#'+d.name)[0][0];
    } else { var that = this }
// Renders absolute div pop-up
    if (!d3.select('.pop-up.' + d.name)[0][0]) {
        var popup = d3.select('#map-container').insert('div', 'svg#map')
            .attr('class', 'pop-up ' + d.name)
            .property('name', d.name);
        injectPopup(popup); 
        stylePopup(d.x, d.y, that, popup);
    } else {
        var popup = d3.select('.pop-up.' + d.name)
    }
    popupZ(popup)

// STYLE RELATIONSHIPS
    d3.selectAll(".link." + d.name)
        .classed("hover", true);

// STYLE nodeList
    d3.select('circle#' + d.name)
        .classed('hover', true)
    var links = d3.selectAll('.link.' + d.name),
        neighbornodeList = [];
    whoIsNextToMe(that, links, neighbornodeList)
    for (j=0;j<neighbornodeList.length;j++) {
        d3.selectAll('circle.dont-light.' + neighbornodeList[j])
            .classed('hover', true)
        d3.selectAll('circle.light.' + neighbornodeList[j])
            .classed('hover', true)
    }
}

function mouseout(d) {
    if (this == window) {
        var that = d3.select('g#'+d.name)[0][0];
    } else { var that = this };
    d3.selectAll('circle.dont-light')
        .classed('hover', false)
    d3.selectAll('circle.light')
        .classed('hover', false)
    d3.select('circle.' + d.name + '.light')
        .classed('hover', false)
    d3.select('circle.' + d.name )
        .classed('hover', false)

    //Removes pop-up
    if (d3.select(that).classed('dragging') == false && d3.select('g#' + d.name).datum().pinned != true ) {
        d3.select('.pop-up.' + d.name)
            .remove();
    }

    var allCircs = d3.selectAll('circle')[0];
    
    // If no nodeList are being dragged, all nodeList regain mouseover function
    if (!d3.select('.dragging')[0][0]) {
        d3.selectAll('g.waiting')
            .on('mouseover', mouseover);
    }    
    d3.selectAll('.link')
        .classed('hover', false)
}

};
// End of draw();

// ##height ##width
var userWidth = window.innerWidth,
    userHeight = window.innerHeight;

var one  = new Date().getTime();
draw(typoTres, userWidth, userHeight);
var two  = new Date().getTime();
console.log('Entire Map took ' + (two-one) +' MS to Render');