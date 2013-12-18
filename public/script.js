(function ($) {
  "use strict";

  var getQueryParams, showErrorMessages, checkLoginStatus, checkSites, removeSite;

  getQueryParams = function () {
    var params = {};
    $.each(window.location.search.substr(1).split('&'), function (key, value) {
      value = value.split('=');
      params[value[0]] = value[1] || true;
    });
    return params;
  };

  showErrorMessages = function () {
    var queryParams = getQueryParams(),
      message,
      $error = $('#main .error');

    switch (queryParams['error']) {
      case 'login':
        message = 'Login failed';
        break;
      case 'sites':
        message = 'Failed to add domain';
        break;
    }

    if (message) {
      if (!$error.length) {
        $error = $('<div />').text(message).addClass('error').wrapInner('<p />').prepend($('<h2 />').text('Error')).prependTo('#main');
      }
      $error.text();
    } else {
      $error.remove();
    }
  };

  checkLoginStatus = function () {
    $.getJSON('/user/status', function (data) {
      if (data.loggedin) {
        $('.receive li.first-step ul').replaceWith($('<p />').text('Done! ').append($('<a />', {
          href : '/user/logout',
          text : 'Log out?'
        })))
        checkSites();
      } else {
        if (data.accountsAvailable !== undefined) {
          $('<p />', {
            "class": "accounts-available",
            text : '(' + data.accountsAvailable + ' accounts left at the moment)'
          }).insertAfter('.receive li.first-step > ul');
        }
        $('.receive li.second-step form').remove();
        if (data.dev) {
          $('<a />', {
            href : '/user/auth/dummy',
            text : "Since you're in a dev environment you can bypass online sign ins here!"
          }).appendTo('.receive li.first-step ul').wrap('<li />');
        }
      }
    });
  };

  checkSites = function () {
    $.getJSON('/user/sites', function (data) {
      var $list = $('<ul />');
      $.each(data.sites, function (i, value) {
        var $listItem = $('<li />').text(value + ' ');
        $('<button />').attr('type', 'button').text('Remove').appendTo($listItem).click(function (e) {
          removeSite.call(this, value);
        });
        $listItem.appendTo($list);
      });
      $list.insertBefore('.receive li.second-step form');
    });
  };

  removeSite = function (site) {
    var $this = $(this).text('Removing...');
    $.post('/user/sites', {
      action : 'delete',
      hostname : site
    }, function () {
      $this.parent().slideUp(function () {
        $this.remove();
      });
    }, 'json');
  };

  showErrorMessages();
  checkLoginStatus();

  $('textarea').on('mouseup', function () {
      $(this).select();
  }).each(function () {
    var $this = $(this)
      , text = $this.val();
    text = text.replace('"http://example.com', '"' + window.location.protocol + '//' + window.location.host);
    text = text.replace('//example.com', '//' + window.location.host);
    $this.val(text);
  });
}($));
