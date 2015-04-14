// # Gulpfile
// [lib/index.js](index.html) > gulpfile.js
'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util');

var shell = require('gulp-shell'),
    git = require('gulp-git'),
    docco = require('gulp-docco');

var cache = require('gulp-cached');
    /*remember = require('gulp-remember');*/

// Docs Task
// =========
// The `docs` task builds docco files, switches to the gh-pages
// branch, commits the docs, and switches back to the
// development branch.
//
// Usage: `gulp docs`

/*gulp.task('checkout-master', shell.task(['git checkout master']));*/

gulp.task('docs-make', // ['checkout-master'],
function () {
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

gulp.task('docs-commit', ['docs-make'], shell.task([
  'git checkout gh-pages',
  'git add ./docs',
  'git commit -a -m \"update docs\"',
  'git checkout master',
  'git checkout -b development'
]));

gulp.task('docs', ['docs-commit'], function() {
  git.push('origin', 'gh-pages');
});

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
