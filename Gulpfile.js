var gulp = require('gulp')
var data = require('./src/data')

// Loads all gulp plugins located in package.json
// > Call plugins using `gp.<camelizedPluginName>
var gp = require('gulp-load-plugins')()

// Load configurations for gulp files
var paths = require('./tasks/paths')

var gulpNoRead = {
    cwd: paths.cwd,
    read: false,
}

// ======
// #Tasks

gulp.task('build-styles', () =>
    gulp.src(paths.scss.src, { cwd : paths.cwd })
        .pipe(gp.rubySass({
            sourcemapPath: './',
            style: 'compressed'
        }))
        .on('error', gp.util.log)
        .pipe(gulp.dest(paths.build))
)

gulp.task('build-html', () =>
    gulp.src(paths.ejs.src)
        .pipe(gp.ejs(data).on('error', gp.util.log))
        .pipe(gulp.dest(paths.ejs.dest))
)

gulp.task('connect', gp.connect.server({
    root    : ['.'],
    port    : '8889',
    livereload: false
}))

gulp.task('watch', () => {
    gulp.watch(paths.scss.watch, gulpNoRead, ['build-styles'])
    gulp.watch(paths.ejs.src, gulpNoRead, ['build-html'])
})

gulp.task('build', ['build-styles', 'build-html'])

gulp.task('default', [
    'build',
    'watch',
    'connect'
])

gulp.task('dev', ['default'])