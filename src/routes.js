var todo  = require('./todo'),
    session = require('./session'),
    changes = require('./changes');

function auth(callback) {
    return function (res, id, params) {
        var sess = session.resource.retrieve(this.request);
        callback(res, id, params, sess);
    };
}
//
// Routing table
//
this.map = function () {
    // Create a new todo list
    this.post('/');

    // List
    this.path(/^([a-zA-Z0-9-]+)(?:\.json)?/, function () {
        // Create/Destroy session
        this.post('/session').bind (auth(session.post));
        this.del('/session').bind  (auth(session.del));

        // Retrieve the todo list
        this.get().bind  (auth(todo.get));

        // Update the todo list
        this.put().bind  (auth(todo.put));

        // Destroy the todo list
        this.del().bind  (auth(todo.del));

        // Create a change
        this.post().bind (auth(changes.post));
    });
};
