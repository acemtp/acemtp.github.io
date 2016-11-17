const metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const permalinks = require('metalsmith-permalinks');
const serve = require('metalsmith-serve');
const watch = require('metalsmith-watch');
const asset = require('metalsmith-static');
const inPlace = require('metalsmith-in-place');
const htmlMinifier = require('metalsmith-html-minifier');
const less = require('metalsmith-less');
const cleanCSS = require('metalsmith-clean-css');
const Handlebars = require('handlebars');
const uglify = require('metalsmith-uglify');
const babel = require('metalsmith-babel');
const collections = require('metalsmith-collections');
const production = process.env.NODE_ENV === 'production';
const sitemap = require('metalsmith-sitemap');

const hdbOptions = {
  engine: 'handlebars',
  partials: 'partials',
};

const wwwUrl = () => { return production ? 'http://opensource-helpdesk.com' : 'http://localhost:40000'; };

Handlebars.registerHelper('production', function () { return production; });
Handlebars.registerHelper('wwwUrl', function () { return wwwUrl(); });

const dest = production ? 'prod' : 'dev';

const ms = metalsmith(__dirname)
  .destination(`./.build/${dest}`)
  .use(asset({
    src: './public',
    dest: '.',
  }))
  // .use(permalinks({
  //   relative: false,
  // }))
  .use(less())
  .use(layouts(hdbOptions))
  .use(babel({
    presets: ['es2015'],
  }))
  .use(collections({
    helpdesk: {
      pattern: 'helpdesk/*.html',
    },
    livechat: {
      pattern: 'livechat/*.html',
    },
    knowledgebase: {
      pattern: 'knowledgebase/*.html',
    },
  }))
  .use(inPlace(hdbOptions))
  .use(sitemap({
    hostname: wwwUrl(),
    omitIndex: true,
  }))
;

if (production) {
  ms.use(htmlMinifier())
    .use(uglify({
      nameTemplate: '[name].[ext]',
    }))
    .use(cleanCSS());
} else {
  ms.use(watch({
    paths: {
      '${source}/**/*': true,
      'layouts/**/*': '**/*.html',
      'partials/**/*': '**/*.html',
    },
    livereload: true,
  }))
  .use(serve({
    port: 40000,
  }));
}

ms.build(function build(err) {
  if (err) { throw err; }
});
