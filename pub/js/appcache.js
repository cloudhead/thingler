// usage: log('inside coolFunc',this,arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
thingler_debug = false;

window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  if (thingler_debug) {
    log.history.push(arguments);

    if(this.console){
      console.log( Array.prototype.slice.call(arguments) );
    }
  }
};

//app cache event handling
var cache = window.applicationCache;
var progressCount = 0;
var cacheStatusValues = {
  0: 'uncached',
  1: 'idle',
  2: 'checking',
  3: 'downloading',
  4: 'updateready',
  5: 'obsolete',
  6: 'error',
  7: 'cached',
  8: 'progress',
  9: 'noupdate'
};

function logAppCacheEvent(e) {
    var online, status, type, message;
    online = (navigator.onLine) ? 'yes' : 'no';
    status = cacheStatusValues[cache.status];
    type = e.type;
    message = 'online: ' + online;
    message+= ', event: ' + type;
    message+= ', status: ' + status;
    if (type == 'error' && navigator.onLine) {
        message+= ' (probably a syntax error in the manifest)';
    }
    log(message);
}

for (var k in cacheStatusValues) {
  if (['idle', 'uncached'].indexOf(cacheStatusValues[k]) == -1) {
    cache.addEventListener(cacheStatusValues[k], logAppCacheEvent, false);
  }
}

cache.addEventListener('error', function(e) {
  log( 'Error: Cache failed to update : ' + progressCount );
}, false);
cache.addEventListener('progress', function(e) {progressCount++;}, false);
cache.addEventListener(
    'updateready',
    function(){
        //automatically swap the cache to the latest version when new cache is ready
        window.applicationCache.swapCache();
        log('swap cache has been called');
    },
    false
);

// setInterval(function(){cache.update()}, 10000);

//onoffline/online events
var onoffline = function () {
 log('Now offline...');
};

var ononline = function () {
 log('Now online...');
};

if (window.addEventListener) {
  document.body.addEventListener("offline", onoffline, false);
  document.body.addEventListener("online", ononline, false);
}
else {
  document.body.onoffline = onoffline;
  document.body.ononline = ononline;
}
