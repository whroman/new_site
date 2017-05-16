var gulp = require('gulp')

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

const createLink = (name, url) => ({ name, url })

const createProject = (name, url, techs) => ({ name, url, techs })


const data = {
    links: [
        createLink('stackoverflow', 'http://stackoverflow.com/users/2539700/walter-roman'),
        createLink('instagram', 'http://instagram.com/ralterwoman'),
        createLink('github', 'https://github.com/whroman'),
    ],
    projects: [
        [
            createProject('babbel', 'https://www.babbel.com', [
                createLink('react-redux', 'https://github.com/reactjs/react-redux'),
                createLink('webpack', 'https://webpack.github.io'),
                createLink('mocha', 'https://mochajs.org')
            ]),
            createProject('prompt.ly', 'http://www.prompt.ly', [
                createLink('react-redux', 'https://github.com/reactjs/react-redux'),
                createLink('angular.js', 'http://angularjs.org/'),
                createLink('node', 'https://nodejs.org/'),
                createLink('trigger.io', 'https://trigger.io')
            ]),
            createProject('minesweeper', 'https://github.com/whroman/minesweeper-react', [
                createLink('react', 'https://facebook.github.io/react'),
                createLink('reflux', 'https://github.com/spoike/refluxjs'),
                createLink('istanbul', 'https://github.com/gotwarlost/istanbul')
            ]),
        ],
        [
            createProject('kiwi', 'https://kiwi.ki', [
                createLink('backbone.js', 'http://backbonejs.org'),
                createLink('browserify', 'http://browserify.org')
            ]),
            createProject('mortgage scraper', 'https://github.com/tinta/ALLegalsScraper', [
                createLink('jasmine', 'http://jasmine.github.io/2.3/introduction.html'),
                createLink('google oauth', 'http://passportjs.org'),
                createLink('phantom.js', 'http://phantomjs.org')
            ]),
            createProject('successfactors', 'http://www.successfactors.com/en_us/customers.html', [
                createLink('jquery', 'http://jquery.com')
            ]),
            createProject('gaza-graphs', 'http://whroman.github.io/gaza-graphs', [
                createLink('d3.js', 'http://d3js.org'),
            ]),
        ]
    ]
}

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