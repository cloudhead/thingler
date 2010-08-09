var todo  = require('./todo'),
    session = require('./session'),
    changes = require('./changes');
//
// Routing table
//
this.map = function () {
    // Create a new todo list
    this.post('/');

    // List
    this.path(/^([a-zA-Z0-9-]+)(?:\.json)?/, function () {
        // Password-protect a list
        this.put('/password').bind (todo.protect);
        this.del('/password').bind (todo.unprotect);

        // Create/Destroy session
        this.post('/session').bind (session.post);
        this.del('/session').bind  (session.del);

        // Retrieve the todo list
        this.get().bind  (todo.get);

        // Update the todo list
        this.put().bind  (todo.put);

        // Destroy the todo list
        this.del().bind  (todo.del);

        // Create a change
        this.post().bind (changes.post);
    });
};
