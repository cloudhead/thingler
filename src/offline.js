var fs = require('fs');

this.cacheManifest = function(env, callback, network, fallback) {
  var config = {
    cache: [],
    network: ['/'],
    fallback: []
  };

  //augment network array ('/' is already present)
  if (network && network.length > 0) {
    for (var i = 0; i < network.length; i++) {
      config.network.push(network[i]);
    };
  }

  //augment fallback array (strings should be of the form: {namespace} {url})
  if (fallback && fallback.length > 0) {
    for (var i = 0; i < fallback.length; i++) {
      config.fallback.push(fallback[i]);
    };
  }

  //check if we need to regenerate cache (if it doesn't exist or in dev mode)
  fs.stat('./pub/application.manifest', function(err, stat) {
    var regenerate = false;

    if (err) {regenerate = true;}
    else {
      regenerate = (env === 'development');
    }

    if (regenerate) {
      config.cache = listFiles();

      precache_key(config.cache, function(key) {
        generateManifest(key, callback);
      });
    }
    else callback(true);
  });


  //calculate the hask key from the files contents
  var precache_key = function(paths, cb) {
    var crypto = require('crypto');
    var hashes = [];

    for (var i = 0; i < paths.length; i++) {
      var hash = crypto.createHash('sha1');
      hash.update(fs.readFileSync(paths[i]));
      var fileHash = hash.digest('hex');
      hashes.push(fileHash);

      //Once we've hashed the last file, make a hash of all the hashes
      if (i === (paths.length - 1)) {
        hash = crypto.createHash('sha1');
        hash.update(hashes.join(''));
        cb(hash.digest('hex'));
      }
    };
  };

  //Generate the manifest and write it to disk
  var generateManifest = function(key, cbk) {
    var body = ["CACHE MANIFEST"];
    body.push("# " + key);

    for (var i = 0; i < config.cache.length; i++) {
      body.push(config.cache[i].replace('./pub',''));
    };

    body.push(''); body.push('NETWORK:');

    for (var j = 0; j < config.network.length; j++) {
      body.push(config.network[j]);
    };

    body.push(''); body.push('FALLBACK:');

    for (var k = 0; k < config.fallback.length; k++) {
      body.push(config.fallback[k]);
    };

    fs.writeFile('./pub/application.manifest', body.join("\n"), function(err) {
      if (err) { throw err;}
      cbk(false);
    });
  };

};

var listFiles = function() {
  var paths = [];
  var public_root = '/pub';

  var recursivelylistFiles = function(root) {
    var files = fs.readdirSync(root);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var newPath = root + '/' + file;
      var stat = fs.statSync(newPath);
      if (stat.isDirectory()) {
        recursivelylistFiles(newPath);
      }
      else {
        if (newPath != './pub/application.manifest') {
          paths.push(newPath);
        }
      }
    }
  };
  recursivelylistFiles('.' + public_root);
  return paths;
};


