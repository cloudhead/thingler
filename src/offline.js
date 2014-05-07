var fs = require('fs');
var sys = require('sys');
var manifestPath = './pub/application.manifest';

this.cacheManifest = function(env, callback, cache, network, fallback) {
  var config = {
    cache: [],
    network: [],
    fallback: []
  };

  //augment cache array
  if (cache && cache.length > 0) {
    for (var i = 0; i < cache.length; i++) {
      config.cache.push(cache[i]);
    }
  }

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

  //check if we need to regenerate cache (if manifest doesn't exist or key has changed)
  fs.stat(manifestPath, function(err, stat) {
    var exists = true;

    if (err) {exists = false;}

    var filesToCache = listFiles();
    precache_key(filesToCache, function(key) {
      hasKeyChanged(exists, key, function(changed) {
        if (changed || !exists) {
          config.cache = config.cache.concat(filesToCache);
          generateManifest(key, callback);
        }
        else callback(false, key);
      });
    });
  });

  //check wether the manifest key has changed
  var hasKeyChanged = function(manifestExists, newKey, cb) {
    if (!manifestExists) {
      cb(false);
    } else {
      fs.open(manifestPath, 'r+', function(err,fd) {
        if (err) return;
        var b = new Buffer(57);
        fs.read(fd,b,0,57,0, function(err) {
          if (err) return;
          var oldKey = b.toString('utf8').match(/#(.*)$/)[1];
          if (oldKey.trim() != newKey.trim()) {
            cb(true);
          } else {
            cb(false);
          }
        });
      });
    }
  };

  //calculate the hash key from the files contents
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

    body.push('NETWORK:');

    for (var j = 0; j < config.network.length; j++) {
      body.push(config.network[j]);
    };

    body.push(''); body.push('FALLBACK:');

    for (var k = 0; k < config.fallback.length; k++) {
      body.push(config.fallback[k]);
    };

    body.push('');

    fs.writeFile(manifestPath, body.join("\n"), function(err) {
      if (err) { throw err;}
      cbk(true, key);
    });
  };

};

//TODO: Find a way to make this totally async
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
        if (newPath != manifestPath) {
          paths.push(newPath);
        }
      }
    }
  };
  recursivelylistFiles('.' + public_root);
  return paths;
};
