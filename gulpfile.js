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

gulp.task('docs-commit', shell.task([
  'git checkout gh-pages',
  'git add ./docs',
  'git commit -a -m \"updates docs\"',
  'git checkout master',
  'git checkout -b development'
]));

gulp.task('docs-push', ['checkout-master', 'docs-make', 'docs-commit'], function() {
  git.push('origin', 'gh-pages');
});

// ### Misc
gulp.task('checkout-master', shell.task(['git checkout master']));

// ### Example
gulp.task('install-example', shell.task(['cd ' + __dirname + '/example' + ' && npm install']));

gulp.task('example', shell.task(['cd ' + __dirname + '/example' + ' && npm start']));

// ### Tests

// Run test once and exit
gulp.task('test', ['install-example'], function (done) {
  startKarma(false, done);
});

// Watch for file changes and re-run tests on each change
gulp.task('dev', ['install-example'], function (done) {
  startKarma(true, done);
});

function startKarma(singleRun, done) {
  exampleServer.listen(function () {
    karma.start({
      configFile: __dirname + '/karma.conf.js',
      singleRun: singleRun
    }, done);
  });
}

gulp.task('default', ['docs', 'test']);

// ## ISC LICENSE

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// **THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
// OF THIS SOFTWARE.**
