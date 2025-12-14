var responseDisplay = 'data'
var coreapi = window.coreapi
var schema = window.schema

function normalizeKeys (arr) {
  var _normarr = [];
  for (var i = 0; i < arr.length; i++) {
    _normarr = _normarr.concat(arr[i].split(' > '));
  }
  return _normarr;
}

function normalizeHTTPHeader (str) {
  // Capitalize HTTP headers for display.
  return (str.charAt(0).toUpperCase() + str.substring(1))
    .replace(/-(.)/g, function ($1) {
      return $1.toUpperCase()
    })
    .replace(/(Www)/g, function ($1) {
      return 'WWW'
    })
    .replace(/(Xss)/g, function ($1) {
      return 'XSS'
    })
    .replace(/(Md5)/g, function ($1) {
      return 'MD5'
    })
}

function formEntries (form) {
  // Polyfill for new FormData(form).entries()
  var formData = new FormData(form)
  if (formData.entries !== undefined) {
    return Array.from(formData.entries())
  }

  var entries = []

  for (var i = 0; i < form.elements.length; i++) {
    var element = form.elements[i]

    if (!element.name) {
      continue
    }

    if (element.type === 'file') {
      for (var j = 0; j < element.files.length; j++) {
        entries.push([element.name, element.files[j]])
      }
    } else if (element.type === 'select-multiple' || element.type === 'select-one') {
      for (var j = 0; j < element.selectedOptions.length; j++) {
        entries.push([element.name, element.selectedOptions[j].value])
      }
    } else if (element.type === 'checkbox') {
      if (element.checked) {
        entries.push([element.name, element.value])
      }
    } else {
      entries.push([element.name, element.value])
    }
  }

  return entries
}

$(function () {
  var $selectedAuthentication = $('#selected-authentication')
  var $authControl = $('#auth-control')
  var $authTokenModal = $('#auth_token_modal')
  var $authBasicModal = $('#auth_basic_modal')
  var $authSessionModal = $('#auth_session_modal')

  // Language Control
  $('#language-control li').click(function (event) {
    event.preventDefault()
    var $languageMenuItem = $(this).find('a')
    var $languageControls = $(this).closest('ul').find('li')
    var $languageControlLinks = $languageControls.find('a')
    var language = $languageMenuItem.data('language')

    $languageControlLinks.not('[data-language="' + language + '"]').parent().removeClass('active')
    $languageControlLinks.filter('[data-language="' + language + '"]').parent().addClass('active')

    $('#selected-language').text(language)

    var $codeBlocks = $('pre.highlight')
    $codeBlocks.not('[data-language="' + language + '"]').addClass('hide')
    $codeBlocks.filter('[data-language="' + language + '"]').removeClass('hide')
  })

  // API Explorer
  $('form.api-interaction').submit(function (event) {
    event.preventDefault()

    var $form = $(this).closest('form')
    var $requestMethod = $form.find('.request-method')
    var $requestUrl = $form.find('.request-url')
    var $toggleView = $form.closest('.modal-content').find('.toggle-view')
    var $responseStatusCode = $form.find('.response-status-code')
    var $meta = $form.find('.meta')
    var $responseRawResponse = $form.find('.response-raw-response')
    var $requestAwaiting = $form.find('.request-awaiting')
    var $responseRaw = $form.find('.response-raw')
    var $responseData = $form.find('.response-data')
    var key = normalizeKeys($form.data('key'))
    var params = {}
    var entries = formEntries($form.get()[0])

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i]
      var paramKey = entry[0]
      var paramValue = entry[1]
      var $elem = $form.find('[name="' + paramKey + '"]')
      var dataType = $elem.data('type') || 'string'

      if (dataType === 'integer' && paramValue) {
        var value = parseInt(paramValue)
        if (!isNaN(value)) {
          params[paramKey] = value
        }
      } else if (dataType === 'number' && paramValue) {
        var value = parseFloat(paramValue)
        if (!isNaN(value)) {
          params[paramKey] = value
        }
      } else if (dataType === 'boolean' && paramValue) {
        var value = {
          'true': true,
          'false': false
        }[paramValue.toLowerCase()]
        if (value !== undefined) {
          params[paramKey] = value
        }
      } else if ((dataType === 'array' && paramValue) || (dataType === 'object' && paramValue)) {
        try {
          params[paramKey] = JSON.parse(paramValue)
        } catch (err) {
          // Ignore malformed JSON
        }
      } else if (dataType === 'string' && paramValue) {
        params[paramKey] = paramValue
      }
    }

    $form.find(':checkbox').each(function (index) {
      // Handle unselected checkboxes
      var name = $(this).attr('name')
      if (!params.hasOwnProperty(name)) {
        params[name] = false
      }
    })

    function requestCallback (request) {
      // Fill in the "GET /foo/" display.
      var parser = document.createElement('a')
      parser.href = request.url
      var method = request.options.method
      var path = parser.pathname + parser.hash + parser.search

      $requestMethod.text(method)
      $requestUrl.text(path)
    }

    function responseCallback (response, responseText) {
      // Display the 'Data'/'Raw' control.
      $toggleView.removeClass('hide')

      // Fill in the "200 OK" display.
      $responseStatusCode.removeClass('label-success').removeClass('label-danger')
      if (response.ok) {
        $responseStatusCode.addClass('label-success')
      } else {
        $responseStatusCode.addClass('label-danger')
      }
      $responseStatusCode.text(response.status)
      $meta.removeClass('hide')

      // Fill in the Raw HTTP response display.
      var panelText = 'HTTP/1.1 ' + response.status + ' ' + response.statusText + '\n'
      response.headers.forEach(function (header, key) {
        panelText += normalizeHTTPHeader(key) + ': ' + header + '\n'
      })
      if (responseText) {
        panelText += '\n' + responseText
      }
      $responseRawResponse.text(panelText)
    }

    // Instantiate a client to make the outgoing request.
    var options = {
      requestCallback: requestCallback,
      responseCallback: responseCallback
    }

    // Setup authentication options.
    if (window.auth && window.auth.type === 'token') {
      // Header authentication
      options.auth = new coreapi.auth.TokenAuthentication({
        scheme: window.auth.scheme,
        token: window.auth.token
      })
    } else if (window.auth && window.auth.type === 'basic') {
      // Basic authentication
      options.auth = new coreapi.auth.BasicAuthentication({
        username: window.auth.username,
        password: window.auth.password
      })
    } else if (window.auth && window.auth.type === 'session') {
      // Session authentication
      options.auth = new coreapi.auth.SessionAuthentication({
        csrfCookieName: 'csrftoken',
        csrfHeaderName: 'X-CSRFToken'
      })
    }

    var client = new coreapi.Client(options)
    client.action(schema, key, params).then(function (data) {
      var response = JSON.stringify(data, null, 2)
      $requestAwaiting.addClass('hide')
      $responseRaw.addClass('hide')
      $responseData.addClass('hide').text('').jsonView(response)

      if (responseDisplay === 'data') {
        $responseData.removeClass('hide')
      } else {
        $responseRaw.removeClass('hide')
      }
    }).catch(function (error) {
      var response = JSON.stringify(error.content, null, 2)
      $requestAwaiting.addClass('hide')
      $responseRaw.addClass('hide')
      $responseData.addClass('hide').text('').jsonView(response)

      if (responseDisplay === 'data') {
        $responseData.removeClass('hide')
      } else {
        $responseRaw.removeClass('hide')
      }
    })
  })

  // 'Data'/'Raw' control
  $('.toggle-view button').click(function () {
    var $modalContent = $(this).closest('.modal-content')
    var $modalResponseRaw = $modalContent.find('.response-raw')
    var $modalResponseData = $modalContent.find('.response-data')

    responseDisplay = $(this).data('display-toggle')

    $(this).removeClass('btn-default').addClass('btn-info').siblings().removeClass('btn-info')

    if (responseDisplay === 'raw') {
      $modalResponseRaw.removeClass('hide')
      $modalResponseData.addClass('hide')
    } else {
      $modalResponseData.removeClass('hide')
      $modalResponseRaw.addClass('hide')
    }
  })

  // Authentication: none
  $authControl.find("[data-auth='none']").click(function (event) {
    event.preventDefault()
    window.auth = null
    $selectedAuthentication.text('none')
    $authControl.find("[data-auth]").closest('li').removeClass('active')
    $authControl.find("[data-auth='none']").closest('li').addClass('active')
  })

  // Authentication: token
  $('form.authentication-token-form').submit(function (event) {
    event.preventDefault()
    var $form = $(this).closest('form')
    var scheme = $form.find('input#scheme').val()
    var token = $form.find('input#token').val()
    window.auth = {
      'type': 'token',
      'scheme': scheme,
      'token': token
    }
    $selectedAuthentication.text('token')
    $authControl.find("[data-auth]").closest('li').removeClass('active')
    $authControl.find("[data-auth='token']").closest('li').addClass('active')
    $authTokenModal.modal('hide')
  })

  // Authentication: basic
  $('form.authentication-basic-form').submit(function (event) {
    event.preventDefault()
    var $form = $(this).closest('form')
    var username = $form.find('input#username').val()
    var password = $form.find('input#password').val()
    window.auth = {
      'type': 'basic',
      'username': username,
      'password': password
    }
    $selectedAuthentication.text('basic')
    $authControl.find("[data-auth]").closest('li').removeClass('active')
    $authControl.find("[data-auth='basic']").closest('li').addClass('active')
    $authBasicModal.modal('hide')
  })

  // Authentication: session
  $('form.authentication-session-form').submit(function (event) {
    event.preventDefault()
    window.auth = {
      'type': 'session'
    }
    $selectedAuthentication.text('session')
    $authControl.find("[data-auth]").closest('li').removeClass('active')
    $authControl.find("[data-auth='session']").closest('li').addClass('active')
    $authSessionModal.modal('hide')
  })
})
