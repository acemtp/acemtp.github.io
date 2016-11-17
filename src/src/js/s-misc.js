const log = (...args) => console.log.apply(window.console, args);

/*!
 * IE10 viewport hack for Surface/desktop Windows 8 bug
 * Copyright 2014-2015 The Bootstrap Authors
 * Copyright 2014-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

// See the Getting Started docs for more information:
// http://getbootstrap.com/getting-started/#support-ie10-width

(function iebug() {
  if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    const msViewportStyle = document.createElement('style');
    msViewportStyle.appendChild(
      document.createTextNode(
        '@-ms-viewport{width:auto!important}'
      )
    );
    document.head.appendChild(msViewportStyle);
  }
}());

/* eslint-disable */
let sbcRip;
const shadeBlendConvert = (p, from, to) => {
  if (typeof(p) != "number" || p<-1 || p>1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (typeof(to) != "string" && typeof(to) != "undefined")) return null; //ErrorCheck
  if (!sbcRip) sbcRip = function(d) {
      var l = d.length,RGB = new Object();
      if (l > 9) {
          d = d.split(",");
          if (d.length<3 || d.length>4)return null;//ErrorCheck
          RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
      } else {
          switch(l) {case 8:case 6:case 3:case 2:case 1: return null;} //ErrorCheck
          if (l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
          d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9 || l==5?r(((d>>24&255)/255)*10000)/10000:-1;
      }
      return RGB;}
  var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to && to != "c"?to:b?"#000000":"#FFFFFF",f=sbcRip(from),t=sbcRip(to);
  if (!f || !t) return null; //ErrorCheck
  if (h) return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0 && t[3]<0?")":","+(f[3]>-1 && t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
  else return "#"+(0x100000000+(f[3]>-1 && t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1 || t[3]>-1?1:3);
};
/* eslint-enable */

// http://www.html5rocks.com/en/tutorials/cors/
const createCORSRequest = (method, url) => {
  let xhr = new XMLHttpRequest();

  if ('withCredentials' in xhr) {
    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);
  } else if (typeof window.XDomainRequest !== 'undefined') {
    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // Otherwise, CORS is not supported by the browser.
    xhr = null;
  }
  return xhr;
};

const convertXhrResponseToJson = (xhr, cb) => {
  let res;
  try {
    res = JSON.parse(xhr.responseText);
  } catch (error) {
    console.error('talkus: failed to parse json response', xhr, error);
    if (cb) cb({ ok: false, error });
    return;
  }
  if (!res) {
    if (cb) cb({ ok: false, error: 'res undefined' });
    return;
  }
  res.ok = true;
  if (cb) cb(res);
};

const httpPost = (url, object, cb) => {
  const xhr = createCORSRequest('POST', `${url}?t=${+new Date()}`, !!cb);
  xhr.onprogress = () => {};
  xhr.ontimeout = () => {};
  xhr.onload = () => { convertXhrResponseToJson(xhr, cb); };
  xhr.onerror = () => { if (cb) cb({ ok: false }); };

  if (xhr.setRequestHeader) xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  if (cb) {
    setTimeout(function () {
      xhr.send(JSON.stringify(object));
    }, 0);
  } else {
    xhr.send(JSON.stringify(object));
  }
};

const getUrlVars = () => {
  if (!window.location.search) {
    return {};   // return empty object
  }
  const parms = {};
  let temp;
  const items = window.location.search.slice(1).split('&');   // remove leading ? and split
  for (let i = 0; i < items.length; i++) {
    temp = items[i].split('=');
    if (temp[0]) {
      if (temp.length < 2) {
        temp.push('');
      }
      parms[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
    }
  }
  return parms;
};

const slugify = str => {
  if (!str) return '';
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
};

//
// Talkus Local Storage
//
let lsFakeLocal;
const lsGetItem = key => {
  if (lsFakeLocal) return lsFakeLocal[key];
  try {
    return localStorage.getItem(key);
  } catch (e) {
    if (!lsFakeLocal) {
      lsFakeLocal = {};
      log('plugin: cannot get local storage, use fake localstorage', { key });
    }
  }
  return undefined;
};
const talkusGetVisitors = () => {
  // log('plugin: get visitors from localstorage');

  let visitors;

  try {
    visitors = lsGetItem('talkusVisitors');
    if (visitors) visitors = JSON.parse(visitors);
  } catch (e) {
    console.log('plugin: cannot parse localstorage', visitors);
    visitors = undefined;
  }

  // log('plugin: current localstorage', visitors, lsGetItem('talkusVisitors'));
  if (!visitors) visitors = {};
  return visitors;
};

const talkusGetVisitorId = appId => {
  // log('plugin: get visitorId from localstorage', appId);
  const visitors = talkusGetVisitors();
  return visitors && visitors[appId];
};