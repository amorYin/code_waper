var isGithubDemo = isGithubDemo || false;  // This is for GitHub demo only. Remove it in your project

void function(window, document, undefined) {

  // ES5 strict mode
  "user strict";
  var wwidth = document.body.clientWidth;
  var MIN_COLUMN_COUNT = 2; // minimal column count
  var COLUMN_WIDTH = wwidth*0.44;   // cell width: 190, padding: 14 * 2, border: 1 * 2
  var COLUMN_HEIGHT = wwidth*0.50;
  var CELL_PADDING = wwidth;    // cell padding: 14 + 10, border: 1 * 2
  var GAP_HEIGHT = 8;      // vertical gap between cells
  var GAP_WIDTH = 14;       // horizontal gap between cells
  var THRESHOLD = 2000;     // determines whether a cell is too far away from viewport (px)

  var columnHeights;        // array of every column's height
  var columnCount;          // number of columns
  var noticeDelay;          // popup notice timer
  var resizeDelay;          // resize throttle timer
  var scrollDelay;          // scroll throttle timer
  var managing = false;     // flag for managing cells state
  var loading = false;      // flag for loading cells state

  var noticeContainer = document.getElementById('notice');
  var cellsContainer = document.getElementById('cells');
  var cellTemplate = document.getElementById('template').innerHTML;

  // Cross-browser compatible event handler.
  var addEvent = function(element, type, handler) {
    if(element.addEventListener) {
      addEvent = function(element, type, handler) {
        element.addEventListener(type, handler, false);
      };
    } else if(element.attachEvent) {
      addEvent = function(element, type, handler) {
        element.attachEvent('on' + type, handler);
      };
    } else {
      addEvent = function(element, type, handler) {
        element['on' + type] = handler;
      };
    }
    addEvent(element, type, handler);
  };

  // Get the minimal value within an array of numbers.
  var getMinVal = function(arr) {
    return Math.min.apply(Math, arr);
  };

  // Get the maximal value within an array of numbers.
  var getMaxVal = function(arr) {
    return Math.max.apply(Math, arr);
  };

  // Get index of the minimal value within an array of numbers.
  var getMinKey = function(arr) {
    var key = 0;
    var min = arr[0];
    for(var i = 1, len = arr.length; i < len; i++) {
      if(arr[i] < min) {
        key = i;
        min = arr[i];
      }
    }
    return key;
  };

  // Get index of the maximal value within an array of numbers.
  var getMaxKey = function(arr) {
    var key = 0;
    var max = arr[0];
    for(var i = 1, len = arr.length; i < len; i++) {
      if(arr[i] > max) {
        key = i;
        max = arr[i];
      }
    }
    return key;
  };

  // Pop notice tag after user liked or marked an item.
  var updateNotice = function(event) {
    clearTimeout(noticeDelay);
    var e = event || window.event;
    var target = e.target || e.srcElement;
    if(target.tagName == 'SPAN'||target.tagName == 'span') {
      var targetTitle = target.parentNode.tagLine;
      noticeContainer.innerHTML = (target.className == 'like' ? 'Liked ' : 'Marked ')+ '<strong>' + targetTitle + '</strong>';
      noticeContainer.className = 'on';
      noticeDelay = setTimeout(function() {
        noticeContainer.className = 'off';
      }, 2000);
    }
  };

  // Calculate column count from current page width.
  var getColumnCount = function() {
    return Math.max(MIN_COLUMN_COUNT, Math.floor((document.body.offsetWidth + GAP_WIDTH) / (COLUMN_WIDTH + GAP_WIDTH)));
  };

  // Reset array of column heights and container width.
  var resetHeights = function(count) {
    columnHeights = [];
    for(var i = 0; i < count; i++) {
      columnHeights.push(0);
    }
    cellsContainer.style.width = (count * (COLUMN_WIDTH*1.02+GAP_WIDTH) - GAP_WIDTH) + 'px';
  };


  // Fetch JSON string via Ajax, parse to HTML and append to the container.
  var appendCells = function(num) {
    if(loading) {
      // Avoid sending too many requests to get new cells.
      return;
    }
    var xhrRequest = new XMLHttpRequest();
    var fragment = document.createDocumentFragment();
    var cells = [];
    var images;
    xhrRequest.open('GET', 'json.php?n=' + num, true);
    xhrRequest.onreadystatechange = function() {
      if(xhrRequest.readyState == 4 && xhrRequest.status == 200) {
        images = JSON.parse(xhrRequest.responseText);
        for(var j = 0, k = images.length; j < k; j++) {
          var cell = document.createElement('div');
          cell.className = 'cell pending';
          cell.tagLine = images[j].title;
          cells.push(cell);
          front(cellTemplate, images[j], cell);
          fragment.appendChild(cell);
        }
        cellsContainer.appendChild(fragment);
        loading = false;
        adjustCells(cells);
      }
    };
    loading = true;
    xhrRequest.send(null);
  };

  // Fake mode, only for GitHub demo. Delete this function in your project.
  var appendCellsDemo = function(num) {
    if(loading) {
      // Avoid sending too many requests to get new cells.
      return;
    }
    var fragment = document.createDocumentFragment();
    var cells = [];
    for(var j = 0; j < num; j++) {
      var key = Math.floor(Math.random() * 6) + 1;
      var cell = document.createElement('div');
      cell.className = 'cell pending';
      cell.tagLine = 'demo picture ' + key;
      cells.push(cell);
      front(cellTemplate, { 'title': 'demo picture ' + key, 'src': key, 'height': COLUMN_HEIGHT, 'width': COLUMN_WIDTH-30 }, cell);
      fragment.appendChild(cell);
    }
    // Faking network latency.
    setTimeout(function() {
      loading = false;
      cellsContainer.appendChild(fragment);
      adjustCells(cells);
    }, 2000);
  };

  // Position the newly appended cells and update array of column heights.
  var adjustCells = function(cells, reflow) {
    var columnIndex;
    var columnHeight;
    for(var j = 0, k = cells.length; j < k; j++) {
      // Place the cell to column with the minimal height.
      columnIndex = getMinKey(columnHeights);
      columnHeight = columnHeights[columnIndex];
      cells[j].style.height = (cells[j].offsetHeight - CELL_PADDING) + 'px';
      cells[j].style.width = (cells[j].offsetHeight - CELL_PADDING) + 'px';
      cells[j].style.left = columnIndex * (COLUMN_WIDTH+GAP_WIDTH) + 'px';
      cells[j].style.top = columnHeight + 'px';
      columnHeights[columnIndex] = columnHeight + GAP_HEIGHT + cells[j].offsetHeight;
      if(!reflow) {
        cells[j].className = 'cell ready';
      }
    }
    cellsContainer.style.height = getMaxVal(columnHeights) + 'px';
    manageCells();
  };

  // Calculate new column data if it's necessary after resize.
  var reflowCells = function() {
    // Calculate new column count after resize.
    columnCount = getColumnCount();
    if(columnHeights.length != columnCount) {
      // Reset array of column heights and container width.
      resetHeights(columnCount);
      adjustCells(cellsContainer.children, true);
    } else {
      manageCells();
    }
  };

  // Toggle old cells' contents from the DOM depending on their offset from the viewport, save memory.
  // Load and append new cells if there's space in viewport for a cell.
  var manageCells = function() {
    // Lock managing state to avoid another async call. See {Function} delayedScroll.
    managing = true;

    var cells = cellsContainer.children;
    var viewportTop = (document.body.scrollTop || document.documentElement.scrollTop) - cellsContainer.offsetTop;
    var viewportBottom = (window.innerHeight || document.documentElement.clientHeight) + viewportTop;

    // Remove cells' contents if they are too far away from the viewport. Get them back if they are near.
    // TODO: remove the cells from DOM should be better :<
    for(var i = 0, l = cells.length; i < l; i++) {
      if((cells[i].offsetTop - viewportBottom > THRESHOLD) || (viewportTop - cells[i].offsetTop - cells[i].offsetHeight > THRESHOLD)) {
        if(cells[i].className === 'cell ready') {
          cells[i].fragment = cells[i].innerHTML;
          cells[i].innerHTML = '';
          cells[i].className = 'cell shadow';
        }
      } else {
        if(cells[i].className === 'cell shadow') {
          cells[i].innerHTML = cells[i].fragment;
          cells[i].className = 'cell ready';
        }
      }
    }

    // If there's space in viewport for a cell, request new cells.
    if(viewportBottom > getMinVal(columnHeights)) {
      // Remove the if/else statement in your project, just call the appendCells function.
      if(isGithubDemo) {
        appendCellsDemo(columnCount);
      } else {
        appendCells(columnCount);
      }
    }

    // Unlock managing state.
    managing = false;
  };

  // Add 500ms throttle to window scroll.
  var delayedScroll = function() {
    clearTimeout(scrollDelay);
    if(!managing) {
      // Avoid managing cells for unnecessity.
      scrollDelay = setTimeout(manageCells, 500);
    }
  };

  // Add 500ms throttle to window resize.
  var delayedResize = function() {
    clearTimeout(resizeDelay);
    resizeDelay = setTimeout(reflowCells, 500);
  };

  // Initialize the layout.
  var init = function() {
    // Add other event listeners.
    addEvent(cellsContainer, 'click', updateNotice);
    addEvent(window, 'resize', delayedResize);
    addEvent(window, 'scroll', delayedScroll);

    // Initialize array of column heights and container width.
    columnCount = getColumnCount();
    resetHeights(columnCount);

    // Load cells for the first time.
    manageCells();
  };

  // Ready to go!
  addEvent(window, 'load', init);

}(window, document);

function find(t){
    var img = t.lastChild.src;
    var bigShow = document.getElementById('bigShow');
    bigShowImg.src = img;
    bigShow.style.display = "block";
    bigShow.addEventListener('touchstart', function(event) {
                         // If there's exactly one finger inside this element
                         if (event.targetTouches.length == 1) {
                             var touch = event.targetTouches[0];
                             // Place element where the finger is
//                             obj.style.left = touch.pageX + 'px';
//                             obj.style.top = touch.pageY + 'px';
                             
                             }
                         }, false);
    
    bigShow.addEventListener('touchmove', function(event) {
                             // If there's exactly one finger inside this element
                             if (event.targetTouches.length == 2) {
                                var touch = event.targetTouches[0];
                                // Place element where the finger is
                                bigShowImg.style.left = touch.pageX + 'px';
                                bigShowImg.style.top = touch.pageY + 'px';
                                }
                             }, false);
    
    bigShow.addEventListener('touchend', function(event) {
                             // If there's exactly one finger inside this element
                             if (event.targetTouches.length == 1) {
                                    var touch = event.targetTouches[0];
                                    // Place element where the finger is
                                    bigShowImg.style.left = touch.pageX + 'px';
                                    bigShowImg.style.top = touch.pageY + 'px';
                                    bigShow.style.display = 'none';
                                }
                             }, false);
    

    bigShow .onclick = function(){
        bigShow.style.display = 'none';
    }
}