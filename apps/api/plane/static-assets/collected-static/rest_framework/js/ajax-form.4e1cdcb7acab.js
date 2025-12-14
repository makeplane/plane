function replaceDocument(docString) {
  var doc = document.open("text/html");

  doc.write(docString);
  doc.close();

  if (window.djdt) {
    // If Django Debug Toolbar is available, reinitialize it so that
    // it can show updated panels from new `docString`.
    window.addEventListener("load", djdt.init);
  }
}

function doAjaxSubmit(e) {
  var form = $(this);
  var btn = $(this.clk);
  var method = (
    btn.data('method') ||
    form.data('method') ||
    form.attr('method') || 'GET'
  ).toUpperCase();

  if (method === 'GET') {
    // GET requests can always use standard form submits.
    return;
  }

  var contentType =
    form.find('input[data-override="content-type"]').val() ||
    form.find('select[data-override="content-type"] option:selected').text();

  if (method === 'POST' && !contentType) {
    // POST requests can use standard form submits, unless we have
    // overridden the content type.
    return;
  }

  // At this point we need to make an AJAX form submission.
  e.preventDefault();

  var url = form.attr('action');
  var data;

  if (contentType) {
    data = form.find('[data-override="content"]').val() || ''

    if (contentType === 'multipart/form-data') {
      // We need to add a boundary parameter to the header
      // We assume the first valid-looking boundary line in the body is correct
      // regex is from RFC 2046 appendix A
      var boundaryCharNoSpace = "0-9A-Z'()+_,-./:=?";
      var boundaryChar = boundaryCharNoSpace + ' ';
      var re = new RegExp('^--([' + boundaryChar + ']{0,69}[' + boundaryCharNoSpace + '])[\\s]*?$', 'im');
      var boundary = data.match(re);
      if (boundary !== null) {
        contentType += '; boundary="' + boundary[1] + '"';
      }
      // Fix textarea.value EOL normalisation (multipart/form-data should use CR+NL, not NL)
      data = data.replace(/\n/g, '\r\n');
    }
  } else {
    contentType = form.attr('enctype') || form.attr('encoding')

    if (contentType === 'multipart/form-data') {
      if (!window.FormData) {
        alert('Your browser does not support AJAX multipart form submissions');
        return;
      }

      // Use the FormData API and allow the content type to be set automatically,
      // so it includes the boundary string.
      // See https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
      contentType = false;
      data = new FormData(form[0]);
    } else {
      contentType = 'application/x-www-form-urlencoded; charset=UTF-8'
      data = form.serialize();
    }
  }

  var ret = $.ajax({
    url: url,
    method: method,
    data: data,
    contentType: contentType,
    processData: false,
    headers: {
      'Accept': 'text/html; q=1.0, */*'
    },
  });

  ret.always(function(data, textStatus, jqXHR) {
    if (textStatus != 'success') {
      jqXHR = data;
    }

    var responseContentType = jqXHR.getResponseHeader("content-type") || "";

    if (responseContentType.toLowerCase().indexOf('text/html') === 0) {
      replaceDocument(jqXHR.responseText);

      try {
        // Modify the location and scroll to top, as if after page load.
        history.replaceState({}, '', url);
        scroll(0, 0);
      } catch (err) {
        // History API not supported, so redirect.
        window.location = url;
      }
    } else {
      // Not HTML content. We can't open this directly, so redirect.
      window.location = url;
    }
  });

  return ret;
}

function captureSubmittingElement(e) {
  var target = e.target;
  var form = this;

  form.clk = target;
}

$.fn.ajaxForm = function() {
  var options = {}

  return this
    .unbind('submit.form-plugin  click.form-plugin')
    .bind('submit.form-plugin', options, doAjaxSubmit)
    .bind('click.form-plugin', options, captureSubmittingElement);
};
