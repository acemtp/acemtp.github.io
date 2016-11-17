let app;

let index;
let client;
const indexName = PRODUCTION ? (STAGING ? 'staging_faq' : 'faq') : 'dev_faq';
const serverUrl = PRODUCTION ? (STAGING ? 'https://staging.talkus.io:4444' : 'https://sock.talkus.io') : 'http://localhost:4443';

let domain; // true if it uses a custom domain CNAME
let mod;
let id;

const search = (q, cb) => {
  client = client || algoliasearch('R69UI7SAT9', app.algoliaSearchPublicKeyId);
  index = index || client.initIndex(indexName);

  const attributesToRetrieve = ['_id', 'faqCategoryId', 'position', 'question', 'appId', 'createdAt', 'category', 'categoryPosition', 'objectID'];
  index.search(q, { attributesToRetrieve, facetFilters: [`lang:${app.lang}`] }, (error, content) => {
    if (error) { log('algolia: Error during Algolia search: ', error); return; }
    log('res', q, content.hits);

    cb(content.hits);
  });
};

const bindFullscreen = () => {
  $('.body').click(e => {
    if ($(e.target).hasClass('talkus-fullscreen')) {
      $('.talkus-fullscreen-container').html('');
      $(e.target).clone().appendTo('.talkus-fullscreen-container');
      $('.talkus-fullscreen-container').addClass('talkus-active');
    }
  });
};

//
// Render faq summary (homepage of the faq)
//

const renderFaqs = () => {
  log('render faqs');
  if ($('.body-faqs').length === 0) {
    log('full render faqs');

    // if klingon add klingon class on body
    if (app.lang === 'tlh') $('html').addClass('klingon');

    $('.body').html(`
      <div class="body-faqs">
        <div class="container-fluid js-header" style="background-color: ${app.primaryColor}; background-image: linear-gradient(140deg, ${app.secondaryColor} 10%, ${app.primaryColor} 90%)">
          <div class="row">
            <div class="col-lg-8 offset-lg-2">
              <div class="starter-template">
                <h2 class="js-title">${slackToHtml(app.sentences.faqsTitle)}</h2>
                <input class="form-control js-input" type="search" placeholder="${app.sentences.faqsTextareaPlaceholder}">
              </div>
            </div>
          </div>
        </div>

        <div class="container content">
          <div class="row js-content">
          </div>
        </div>
      </div>
    `);

    $('.js-input').keyup(() => { renderFaqs(); });
    bindFullscreen();
  }

  const q = $('.js-input').val();
  search(q, faqs => {
    log('faqs', faqs);

    if (faqs.length === 0) {
      // nothing
      $('.js-content').html(`<div class="col-lg-12 center"><h3>${slackToHtml(app.sentences.faqsNothingTitle)}</h3><p>${slackToHtml(app.sentences.faqsNothing)}</p></div></div>`);
      $('.js-talkus-chat').click(() => { window.talkus('open'); });
      return;
    }

    let categories = faqs.reduce((cats, faq) => {
      if (cats[faq.category]) {
        cats[faq.category].faqs.push(faq);
      } else {
        cats[faq.category] = { name: faq._highlightResult.category.value, position: faq.categoryPosition, faqs: [faq] };
        cats.list.push(cats[faq.category]);
      }
      return cats;
    }, { list: [] }).list;

    categories = _.sortBy(categories, 'position');
    log('categories', categories);

    const columns = [];
    let position = 0;
    _.each(categories, category => {
      if (!columns[position]) columns[position] = [];
      columns[position].push({ name: category.name, faqs: category.faqs });
      position = (position + 1) % 2;
    });
    log('columns', columns);

    $('.js-content').html('<div class="col-md-6 js-column-0"></div> <div class="col-md-6 js-column-1"></div>');
    let k = 0;
    const maxEntries = 8;
    _.each(columns, (col, i) => {
      _.each(col, cat => {
        let html = `<h5>${slackToHtml(cat.name)}</h5>`;
        let j = 0;
        _.each(cat.faqs, faq => {
          if (!q && j === maxEntries) html += `<div class="js-more-${k}">(<a href="javascript:void(0)" onclick="$('.js-more-${k}').toggleClass('hide')" class="js-more">${app.sentences.faqsViewAll}...</a>)</div>`;
          const more = (!q && j >= maxEntries) ? `js-more-${k} hide` : '';
          const question = q ? faq._snippetResult && faq._snippetResult.question && faq._snippetResult.question.value : faq.question;
          const answer = q ? `<p class="talkus-snippet">${slackToHtmlLite(faq._snippetResult && faq._snippetResult.answer && faq._snippetResult.answer.value)}</p>` : '';
          const url = domain ? `/${app.lang}/${slugify(faq.question)}-${faq._id}` : `?mod=${mod}&appId=${app.appId}&id=${faq._id}&lang=${app.lang}`;
          html += `<div class="talkus-snippet ${more}"><a href="${url}">${slackToHtml(question)}</a>${answer}</div>`;
          j++;
        });
        $(`.js-column-${i}`).append(html);
        k++;
      });
    });
  });
};


//
// Render one faq (when we have a faqId)
//

const renderFaq = () => {
  log('render one faq');
  if ($('.body-faq').length === 0) {
    log('full render one faq');

    // if klingon add klingon class on body
    if (app.lang === 'tlh') $('html').addClass('klingon');

    const url = domain ? `/${app.lang}` : `?mod=${mod}&appId=${app.appId}&lang=${app.lang}`;

    $('.body').html(`
      <div class="body-faq">
        <div class="container-fluid js-header" style="background-color: ${app.primaryColor}; background-image: linear-gradient(140deg, ${app.secondaryColor} 10%, ${app.primaryColor} 90%)">
          <a href="${url}"><img src="${app.userPicture}"></a>
        </div>

        <div class="container content">
          <div class="row">
            <div class="col-md-4">
              <input class="form-control js-input" type="search" placeholder="${app.sentences.faqsTextareaPlaceholder}">
              <div class="js-faqs"></div>
            </div>
            <div class="col-md-8 js-faq">
            </div>
          </div>
        </div>
      </div>
    `);

    $('.js-input').keyup(() => { renderFaq(); });
    bindFullscreen();
  }

  client = client || algoliasearch('R69UI7SAT9', app.algoliaSearchPublicKeyId);
  index = index || client.initIndex(indexName);

  index.getObject(id, (error, content) => {
    if (error) { log('algolia: Error during Algolia search: ', error); return; }

    const faq = content;
    log('faq', faq);

    $('.js-faq').html(`<div class="talkus-card"><h1>${slackToHtml(faq.question)}</h1><p>${slackToHtml(faq.answer)}</p></div>`);
  });

  const q = $('.js-input').val();
  search(q, faqs => {
    log('faqs', faqs);

    if (faqs.length === 0) {
      // nothing
      $('.js-faqs').html(`<h5>${slackToHtml(app.sentences.faqsNothingTitle)}</h5><p>${slackToHtml(app.sentences.faqsNothing)}</p></div></div>`);
      $('.js-talkus-chat').click(() => { window.talkus('open'); });
      return;
    }

    let categories = faqs.reduce((cats, faq) => {
      if (cats[faq.category]) {
        cats[faq.category].faqs.push(faq);
      } else {
        cats[faq.category] = { name: faq._highlightResult.category.value, position: faq.categoryPosition, faqs: [faq] };
        cats.list.push(cats[faq.category]);
      }
      return cats;
    }, { list: [] }).list;

    categories = _.sortBy(categories, 'position');
    log('categories', categories);
    let html = '';
    let k = 0;
    _.each(categories, cat => {
      html += `<h5>${slackToHtml(cat.name)}</h5>`;
      let j = 0;
      _.each(cat.faqs, faq => {
        const maxEntries = 8;
        if (!q && j === maxEntries) html += `<div class="js-more-${k}">(<a href="javascript:void(0)" onclick="$('.js-more-${k}').toggleClass('hide')" class="js-more">${app.sentences.faqsViewAll}...</a>)</div>`;
        const more = (!q && j >= maxEntries) ? `js-more-${k} hide` : '';
        const question = q ? faq._snippetResult && faq._snippetResult.question && faq._snippetResult.question.value : faq.question;
        const answer = q ? `<p class="talkus-snippet">${slackToHtmlLite(faq._snippetResult && faq._snippetResult.answer && faq._snippetResult.answer.value)}</p>` : '';
        const url = domain ? `/${app.lang}/${slugify(faq.question)}-${faq._id}` : `?mod=${mod}&appId=${app.appId}&id=${faq._id}&lang=${app.lang}`;
        html += `<div class="talkus-snippet ${more}"><a href="${url}">${slackToHtml(question)}</a>${answer}</div>`;
        j++;
      });
      k++;
    });
    $('.js-faqs').html(html);
  });
};


//
// Render newses
//

const renderNewsesSubscribe = () => {
  if (app.newsesSubscribeByEmail) {
    return `<div>${slackToHtml(app.sentences.newsesSubscribeValid)} <button type="button" class="js-newses-unsubscribe btn btn-outline-secondary btn-sm pull-xs-right">${app.sentences.newsesUnsubscribe}</button></div>`;
  }
  return `
    <form class="form-inline js-newses-subscribe" action="" method="POST">
      <p>${slackToHtml(app.sentences.newsesSubscribeTitle)}</p>
      <div class="input-group">
        <input type="email" name="email" class="form-control" placeholder="${app.sentences.newsesSubscribeTextareaPlaceholder}">
        <span class="input-group-btn">
          <button class="btn btn-outline-primary" type="submit">
            <span class="hidden-md-up">
              <svg style="width:16px;height:16px" viewBox="0 0 24 24">
                  <path fill="#0275d8" d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,18H4V8L12,13L20,8V18M20,6L12,11L4,6V6H20V6Z" />
              </svg>          
            </span>
            <span class="hidden-sm-down">
              ${slackToHtml(app.sentences.newsesSubscribe)}
            </span>
          </button>
        </span>
      </div>
    </form>`;
};

const renderNewses = () => {
  if ($('.body-newses').length === 0) {
    const url = domain ? `/${app.lang}` : `?mod=${mod}&appId=${app.appId}&lang=${app.lang}`;

    $('.body').html(`
      <div class="body-newses">
        <div class="container-fluid js-header" style="background-color: ${app.primaryColor}; background-image: linear-gradient(140deg, ${app.secondaryColor} 10%, ${app.primaryColor} 90%)">
          <a href="${url}"><img src="${app.userPicture}"></a>
        </div>
        <div class="container content talkus-newses-subscribe">
          <div class="row">
            <div class="col-lg-8 offset-lg-2">
              <div class="card card-block">
                ${renderNewsesSubscribe()}
              </div>
            </div>
          </div>
        </div>
        <div class="container content">
          <div class="row">
            <div class="col-md-12">
              <h2 class="center js-title">${slackToHtml(app.sentences.newsesTitle)}</h2>
            </div>
          </div>
        </div>
        <div class="container content">
          <div class="row js-content">
          </div>
        </div>
      </div>
    `);

    $('.body').on('submit', '.js-newses-subscribe', (e) => {
      e.preventDefault();
      const $input = $(e.target).find('[name=email]');
      if (!$input.val()) return;
      talkus('newsesSubscribeByEmail', true, $input.val(), app.lang);

      $input.val('');
      app.newsesSubscribeByEmail = app.lang;
      e.target.parentNode.innerHTML = renderNewsesSubscribe();
    });
    $('.body').on('click', '.js-newses-unsubscribe', (e) => {
      e.preventDefault();
      talkus('newsesSubscribeByEmail', false);

      app.newsesSubscribeByEmail = undefined;
      e.target.parentNode.innerHTML = renderNewsesSubscribe();      
    });

    bindFullscreen();
  }

  httpPost(`${serverUrl}/api/newses`, { id: app.appId, lang: app.lang }, newses => {
    if (!newses.ok) {
      console.error('Failed to connect to server... retry in 2 seconds', newses);
      setTimeout(() => { renderNewses(); }, 2 * 1000);
      return;
    }
    log('newses', { newses });

    let html = '';
    _.each(newses, news => {
      if (id && news._id !== id) return;
      const url = domain ? `/${app.lang}/${slugify(news.title)}-${news._id}` : `?mod=${mod}&appId=${app.appId}&id=${news._id}&lang=${app.lang}`;
      let fullUrl = domain ? `${window.location.protocol}//${window.location.host}${url}` : `${window.location.protocol}//${window.location.host}${window.location.pathname}${url}`;
      fullUrl = fullUrl.replace(/&/gmi, '%26');
      const utf8Title = emojione.shortnameToUnicode(news.title);

      html += `
        <div class="talkus-card">
          <h1>${slackToHtml(news.title)}</h1>
          <span class="talkus-card-date"><a href="${url}">${(new Date(news.createdAt)).toLocaleDateString()}</a></span>
          <p>${slackToHtml(news.content)}</p>
          <div class="talkus-card-inline-buttons">
            ${(news.reactions || []).map(reaction => {
              const reactionVotes = news.votes[reaction] || [];
              const voted = false; // reactionVotes.indexOf(visitorId) !== -1;
              return `
                <span class="talkus-reaction talkus-card-inline-button js-talkus-newses-reaction ${voted ? 'talkus-voted' : ''}" data-news-id="${news._id}" data-reaction="${reaction}">
                  ${slackToHtml(reaction)}
                  <span class="talkus-count">${reactionVotes.length}</span>
                </span>
                `;
            }).join('')}
            <a class="share" href="${fullUrl}" target="_blank"><i class="mdi mdi-link-variant"></i></a>
            <a class="share" href="https://www.linkedin.com/shareArticle?url=${fullUrl}&title=${utf8Title}" target="_blank"><i class="mdi mdi-linkedin"></i></a>
            <a class="share" href="https://twitter.com/intent/tweet?url=${fullUrl}&text=${utf8Title}" target="_blank"><i class="mdi mdi-twitter"></i></a>
            <a class="share" href="https://www.facebook.com/sharer/sharer.php?u=${fullUrl}" target="_blank"><i class="mdi mdi-facebook"></i></a>
          </div>
        </div>`;
    });
    if (id) {
      const url = domain ? `/${app.lang}` : `?mod=${mod}&appId=${app.appId}&lang=${app.lang}`;
      html += `<a href="${url}">${app.sentences.faqsViewAll}</a>`;
    }

    $('.js-content').html(`<div class="col-lg-8 offset-lg-2">${html}</div>`);
  });
};


//
// Common
//

const execModule = () => {
  log('exec mod', app, mod, id);

  switch (mod) {
    case 'faqs': {
      if (id) renderFaq();
      else renderFaqs();
      break;
    }
    case 'newses': {
      renderNewses();
      break;
    }
    default:
  }
};

const downloadAppSettings = (appId, lang) => {
  const visitorId = talkusGetVisitorId(appId);
  log('downloadAppSettings', { appId, lang, visitorId });

  httpPost(`${serverUrl}/api/app/settings`, { id: appId, lang, visitorId }, res => {
    if (!res.ok) {
      console.error('Failed to connect to server... retry in 2 seconds', res);
      setTimeout(() => { downloadAppSettings(appId, lang, execModule); }, 2 * 1000);
      return;
    }
    log('app settings', { res });

    app = res;
    app.secondaryColor = shadeBlendConvert(0.3, app.primaryColor, undefined);
    if (app.mod) mod = app.mod;

    window.talkus('init', app.appId);

    let html = `${app.sentences._poweredBy} <a href="https://www.talkus.io?ref=${mod}web&appId=${app.appId}" target="_blank">Talkus</a>`;
    if (mod === 'faqs') html += ' &amp; <a href="https://www.algolia.com" target="_blank">Algolia</a>';
    $('.js-poweredby').html(html);
    execModule();
  });
};

page('*', ctx => {
  ctx.query = qs.parse(ctx.querystring);
  const params = ctx.params[0].split('/');
  ctx.params = {};
  params.shift();
  if (params.length > 0) ctx.params.lang = params.shift();
  if (params.length > 0) ctx.params.id = params.shift();

  domain = !ctx.query.appId;
  if (!domain) mod = ctx.query.mod;

  const appId = domain ? window.location.hostname : ctx.query.appId;
  const lang = (domain ? ctx.params.lang : ctx.query.lang) || undefined;

  id = (domain ? ctx.params.id : ctx.query.id) || undefined;
  const short = id && id.match(/.*-?([a-zA-Z0-9]{17})$/);
  id = short ? short[1] : undefined;

  if (!app) downloadAppSettings(appId, lang, execModule);
  else execModule();
});

page();
