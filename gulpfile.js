// # Gulpfile
// [lib/index.js](index.html) > gulpfile.js
'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    shell = require('gulp-shell'),
    git = require('gulp-git'),
    docco = require('gulp-docco'),
    cache = require('gulp-cached'),
    karma = require('karma').server;

require('gulp-remember');

var exampleServer = require('./example/server.js');

// ### Docs
// The `docs` task builds docco files, switches to the gh-pages
// branch, commits the docs, and switches back to the
// development branch.
//
// Usage: `gulp docs`
gulp.task('docs', function () {
  // **HACK**: This task never exits on my machine, needs investigation.
  setTimeout(process.exit, 3000);
  return gulp.src([
      './README.md',
      './lib/**/*.js',
      './example/*.js',
      './gulpfile.js'
    ])
    .pipe(docco())
    .pipe(cache('docs'))
    .pipe(gulp.dest('./docs/'))
    .on('error', gutil.log);
});

gulp.task('docs-commit', function () {
  // **HACK**: This task never exits on my machine, needs investigation.
  setTimeout(process.exit, 3000);
  return shell.task([
    'cp -r docs/ docscopy/',
    'git checkout gh-pages',
    'rm -rf docs/',
    'mv docscopy/ docs/',
    'git add docs/',
    'git commit -m \"updates docs\"',
    'git checkout master'
  ]);
});

gulp.task('docs-push', function() {
  // **HACK**: This task never exits on my machine, needs investigation.
  setTimeout(process.exit, 3000);
  git.push('origin', 'gh-pages');
});

// ### Misc
gulp.task('checkout-master', shell.task(['git checkout master']));

// ### Example
gulp.task('install-example',
  shell.task(['cd ' + __dirname + '/example' + ' && npm install']));

gulp.task('example',
  shell.task(['cd ' + __dirname + '/example' + ' && npm start']));

// ### Tests

// Run test once and exit
gulp.task('test', function (done) {
  startKarma(null, done);
});

// Run test once and exit
gulp.task('test-ci', function (done) {
  startKarma('ci', done);
});

// Watch for file changes and re-run tests on each change
gulp.task('test-dev', function (done) {
  startKarma('dev', done);
});

function startKarma(name, done) {
  exampleServer.listen(function () {
    karma.start({
      configFile: __dirname + '/karma/' + (name ? name + '.' : '') + 'conf.js'
    }, function (karmaExitCode) {
      done(karmaExitCode);
      setTimeout(process.exit.bind(process, karmaExitCode), 5000);
    });
  });
}

gulp.task('default', ['docs', 'test']);
