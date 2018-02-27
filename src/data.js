const createLink = (name, url, techs) => ({ name, url, techs })

module.exports = {
    links: [
        createLink('stackoverflow', 'http://stackoverflow.com/users/2539700/walter-roman'),
        createLink('instagram', 'http://instagram.com/ralterwoman'),
        createLink('github', 'https://github.com/whroman'),
    ],
    projects: [
        [
            createLink('babbel', 'https://www.babbel.com', [
                createLink('react-redux', 'https://github.com/reactjs/react-redux'),
                createLink('webpack', 'https://webpack.github.io'),
                createLink('mocha', 'https://mochajs.org')
            ]),
            createLink('prompt.ly', 'http://www.prompt.ly', [
                createLink('angular.js', 'http://angularjs.org/'),
                createLink('node', 'https://nodejs.org/'),
                createLink('trigger.io', 'https://trigger.io')
            ]),
            createLink('minesweeper', 'https://github.com/whroman/minesweeper-react', [
                createLink('react', 'https://facebook.github.io/react'),
                createLink('reflux', 'https://github.com/spoike/refluxjs'),
                createLink('istanbul', 'https://github.com/gotwarlost/istanbul')
            ]),
        ],
        [
            createLink('kiwi', 'https://kiwi.ki', [
                createLink('backbone.js', 'http://backbonejs.org'),
                createLink('browserify', 'http://browserify.org'),
            ]),
            createLink('mortgage scraper', 'https://github.com/tinta/ALLegalsScraper', [
                createLink('jasmine', 'http://jasmine.github.io/2.3/introduction.html'),
                createLink('nightmare', 'https://github.com/segmentio/nightmare'),
                createLink('google oauth', 'http://passportjs.org'),
            ]),
            createLink('successfactors', 'http://www.successfactors.com/en_us/customers.html', [
                createLink('jquery', 'http://jquery.com')
            ]),
            createLink('gaza-graphs', 'http://whroman.github.io/gaza-graphs', [
                createLink('d3.js', 'http://d3js.org'),
            ]),
        ]
    ]
}