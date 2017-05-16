var gulp = require('gulp');

// Loads all gulp plugins located in package.json
// > Call plugins using `gp.<camelizedPluginName>
var gp = require('gulp-load-plugins')();

// Load configurations for gulp files
var paths = require('./tasks/paths');

var gulpNoRead = {
    cwd: paths.cwd,
    read: false
};

// ======
// #Tasks

gulp.task('build-styles', function () {
    gulp.src(paths.scss.src, { cwd : paths.cwd })
    .pipe(gp.rubySass({
        sourcemapPath: './',
        style: 'compressed'
    }))
    .on('error', gp.util.log)
    .pipe(gulp.dest(paths.build))
});

gulp.task('connect', gp.connect.server({
    root    : ['.'],
    port    : '8889',
    livereload: false
}));

gulp.task('watch', function() {
    gulp.watch(paths.scss.watch, gulpNoRead, ['build-styles']);
});

gulp.task('build', ['build-styles'])

gulp.task('default', [
    'build',
    'watch',
    'connect'
]);

gulp.task('dev', ['default']);