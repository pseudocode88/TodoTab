var minifier = require('minifier');
var exec = require('child_process').exec;

var jsFiles = [
    "js/vendor/react.min.js",
    "js/vendor/react-dom.min.js",
    "js/vendor/classnames.min.js",
    "js/vendor/moment.min.js",
    "js/vendor/react-sortable-hoc.min.js",
    "js/config.js",
    "js/store.js",
    "js/compile/todotab.js"
];

minifier.on('error', function(err) {
    console.log(err);
});

console.log('\n➤  Compiling jsx files');
exec(
    "node_modules/.bin/babel js/todotab.jsx -o js/compile/todotab.js",
    function(error, stdout, stderr) {
      if (error) {
        console.log(error);
      }
      console.log('➤  Minifying all js files');
      minifier.minify(jsFiles, { output: 'js/compile/todotab.min.js'})
      console.log('➤  Mogambo kush hua!\n');
    }
);
