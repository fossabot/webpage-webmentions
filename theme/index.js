'use strict';

const escape = require('lodash.escape');
const pathModule = require('path');

const interactionPresentation = {
  'like': 'liked',
  'repost': 'reposted'
};

const templates = {};
const preprocessors = {};

preprocessors.mention = function (data) {
  var self = this;
  var mention = data.mention;

  data.comment = data.comment || false;

  if (interactionPresentation[mention.type]) {
    mention.author.name = mention.author.name || 'Someone';
    mention.name = null;
    mention.summary = interactionPresentation[mention.type] + (mention.interactionTarget ? ' this' : ' something');
    mention.includeAuthorInSummary = true;
  } else {
    mention.author.name = mention.author.name || 'Anonymous';
  }

  return Promise.all((mention.mentions || []).map(function (mention) {
    // TODO: Should render as a u-comment, not an h-entry!
    return self.render('mention', {
      mention: mention,
      singleTarget: data.singleTarget,
      showContext: data.showContext,
      comment: true
    });
  })).then(function (mentions) {
    mention.mentions = mentions;

    data.mention = mention;

    return data;
  });
};

preprocessors.mentions = function (data) {
  var self = this;
  var locals = this.getLocals(theme);

  var mentions = Promise.all(data.mentions.map(function (mention) {
    return self.render('mention', {
      mention: mention,
      singleTarget: data.singleTarget,
      showContext: data.showContext
    });
  }));

  var targets;

  if (data.mentionsArguments.example) {
    targets = ['Example mentions'];
  } else {
    targets = [].concat(
      [].concat(data.mentionsArguments.url || []).map(function (value) {
        return 'Mentions of ' + locals.formatLink(value);
      }),
      [].concat(data.mentionsArguments.site || []).map(function (value) {
        return 'All mentions from site ' + locals.formatLink('http://' + value + '/', value);
      }),
      [].concat(data.mentionsArguments.path || []).map(function (value) {
        return 'All mentions matching path ' + escape(value);
      })
    );
  }

  data.targets = targets;
  delete data.mentionsArguments;

  return mentions.then(function (mentions) {
    data.mentions = mentions;
    return data;
  });
};

const formatAttributes = function (attributes) {
  return Object.keys(attributes).map(key => {
    const value = attributes[key];
    if (!value) { return ''; }
    return escape(key) + '="' + escape(Array.isArray(value) ? value.join(' ') : value) + '"';
  }).join(' ');
};

const formatTag = function (tag, text, attributes) {
  if (typeof text !== 'string') {
    attributes = text;
    text = '';
  }
  return '<' + tag + (attributes ? ' ' + formatAttributes(attributes) : '') + '>' + escape(text) + '</' + tag + '>';
};

const formatLink = function (href, text, attributes) {
  if (text && typeof text !== 'string') {
    attributes = text;
    text = undefined;
  }
  if (!text) {
    text = href;
  }
  return formatTag('a', text, Object.assign({}, attributes, { href: href }));
};

const locals = {
  formatAttributes,
  formatTag,
  formatLink
};

const theme = {
  templatePath: pathModule.join(__dirname, '/templates/'),
  publicPath: pathModule.join(__dirname, '/public/'),
  preprocessors,
  templates,
  locals
};

module.exports = theme;
