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

path.ejs = {
    src: path.resources + 'index.html',
    watch: path.resources + 'index.html',
    dest: './'
}

path.scss = {
    watch   : path.root.scss + '**/*.scss',
    src     : path.root.scss + 'index.scss'
};


module.exports = path;