var path    = {
    resources : 'src/',
    root    : {},
    scss     : {},
    build  : 'public/'
};

// Root of respective resource types
path.root = {
    scss : path.resources + 'scss/'
}

// =====
// #scss
// =====
path.scss = {
    watch   : path.root.scss + '**/*.scss',
    src     : path.root.scss + 'index.scss'
};

module.exports = path;