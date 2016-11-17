/* Official css to handle slackToHtml and Cards. All other files should be deleted! */

// for meteor/nodejs/server
const self = typeof window === 'undefined' ? global : window;

self.slackToHtml = text => {
  if (!text) return '';
  let convertedText = text.
    replace(/:\+(.+):/gmi, ':%2B$1:').
    replace(/:(.+)::skin-tone-(.):/gmi, ':$1_tone$2:').
    replace(/:simple_smile:/gmi, ':grinning:').
    replace(/:slack:/gmi, '').
    replace(/:stuck_out_tongue:/gmi, ':yum:').
    replace(/:flag-(..):/gmi, ':flag_$1:').
    replace(/^:([\w\+\-_]+?):$/gmi, '<span class="talkus-sh-emoji-big"><img class="talkus-sh-emoji-big" src="https://www.talkus.io/app/emojis/$1.svg"></span>').
    replace(/(?:^|\B):([\w\+\-_]+?):(?:$|\B)/gmi, '<img class="talkus-sh-emoji" src="https://www.talkus.io/app/emojis/$1.svg">').
    replace(/(<(#C|@U|!).*?>)/gm, '');

  convertedText = `<span class="talkus-sh"><span class="talkus-sh-text">${convertedText}</span></span>`;
  convertedText = convertedText.
    replace(/^https:\/\/youtu\.be\/([\w]+)/gm, '</span><iframe width="100%" height="100%" src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe><span class="talkus-sh-text">').
    replace(/&lt;(http.*?)\|image&gt;/gmi, '</span><img class="talkus-sh-image talkus-fullscreen" src="$1"><span class="talkus-sh-text">').
    replace(/<(http.*?)\|image>/gmi, '</span><span class="talkus-sh-span-image"><img class="talkus-sh-image talkus-fullscreen" src="$1"></span><span class="talkus-sh-text">').
    // replace(/&lt;(http.*?)\|image&gt;/gmi, '<img class="talkus-sh-image" src="$1">').
    // replace(/<(http.*?)\|image>/gmi, '<img class="talkus-sh-image" src="$1">').
    replace(/<tel:(.*)\|(.*)>/gmi, '<a href="tel:$1" target="_blank">$2<a>').
    replace(/<(mailto:.*?)\|(.*?)>/gm, '<a target="_blank" href="$1">$2</a>').
    replace(/```([^`]*)```/gm, (s, code) => {
      // const hl = hljs.highlightAuto(code.replace(/^\n+|\n+$/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      // return `<pre>${hl.value}</pre>`;
      return `</span><span class="talkus-sh-pre">${code.replace(/^\n+|\n+$/g, '')}</span><span class="talkus-sh-text">`;
    }).
    replace(/`([^`]*)`/gm, (s, code) => {
      // const hl = hljs.highlightAuto(code.replace(/^\n+|\n+$/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      // return `<code>${hl.value}</code>`;
      return `<span class="talkus-sh-code">${code.replace(/^\n+|\n+$/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}</span>`;
    }).
    replace(/\B\*(.*?)\*\B/gm, '<b>$1</b>').
    replace(/\b_(.*?)_\b/gm, '<i>$1</i>').
    replace(/<(http.*?)>/gm, (e, t) => {
      const s = t.split('|');
      return `<a target="_blank" href="${s[0]}">${s[1] || s[0]}</a>`;
    }).
    replace(/&lt;(http.*?)&gt;/gm, (e, t) => {
      const s = t.split('|');
      return `<a target="_blank" href="${s[0]}">${s[1] || s[0]}</a>`;
    });

  // convert url starting with // into https:// or email doesn't
  convertedText = convertedText.replace(/src="(\/\/[^"]*?)"/gmi, 'src="https:$1"');

  // console.log('slackToHtml:', text, '=>', convertedText);

  convertedText = convertedText.replace(/<span class="talkus-sh-text">\s*<\/span>/gm, '');

  return convertedText;
};

self.slackToHtmlLite = text => {
  if (!text) return '';
  let convertedText = text.
    replace(/[\n\r]+/gmi, ' ').
    replace(/:\+(.+):/gmi, ':%2B$1:').
    replace(/:(.+)::skin-tone-(.):/gmi, ':$1_tone$2:').
    replace(/:simple_smile:/gmi, ':grinning:').
    replace(/:stuck_out_tongue:/gmi, ':yum:').
    replace(/:flag-(..):/gmi, ':flag_$1:').
    replace(/^:([\w\+\-_]+?):$/gmi, '<span class="talkus-sh-emoji-big"><img class="talkus-sh-emoji-big" src="https://www.talkus.io/app/emojis/$1.svg"></span>').
    replace(/(?:^|\B):([\w\+\-_]+?):(?:$|\B)/gmi, '<img class="talkus-sh-emoji" src="https://www.talkus.io/app/emojis/$1.svg">').
    replace(/(<(#C|@U|!).*?>)/gm, '');

  convertedText = `<span class="talkus-sh">${convertedText}</span>`;
  convertedText = convertedText.
    replace(/&lt;(http.*?)\|image&gt;/gmi, '').
    replace(/<(http.*?)\|image>/gmi, '').
    replace(/<tel:(.*)\|(.*)>/gmi, '$2').
    replace(/<(mailto:.*?)\|(.*?)>/gm, '$2').
    replace(/```([^`]*)```/gm, '$1').
    replace(/`([^`]*)`/gm, '$1').
    replace(/\B\*(.*?)\*\B/gm, '<b>$1</b>').
    replace(/\b_(.*?)_\b/gm, '<i>$1</i>').
    replace(/<(http.*?)>/gm, (e, t) => {
      const s = t.split('|');
      return s[1] || s[0];
    }).
    replace(/&lt;(http.*?)&gt;/gm, (e, t) => {
      const s = t.split('|');
      return s[1] || s[0];
    });

  // convert url starting with // into https:// or email doesn't
  convertedText = convertedText.replace(/src="(\/\/[^"]*?)"/gmi, 'src="https:$1"');

  // console.log('slackToHtmlLite:', text, '=>', convertedText);

  return convertedText;
};
