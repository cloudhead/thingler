var crypto = require('crypto');

this.digest = function (str) {
    return crypto.createHash('md5').update(str).digest('hex');
};
