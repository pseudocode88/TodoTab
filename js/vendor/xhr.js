/*
Usage:

xhr('GET', '/endpoint')
.success(function (data) { console.log(data); alert('AJAX success'); })
.error(function (data) { console.log(data); alert('AJAX ERROR'); });
*/

xhr = function (type, url, data) {
  var methods = {
    success: function () {},
    error: function () {}
  };

  var parse = function (req) {
    var result;
    if (type === 'JSONP') {
      result = req;
      req = null;
    }
    else {
      try {
        result = JSON.parse(req.responseText);
      } catch (e) {
        result = req.responseText;
      }
    }
    return [result, req];
  };

  var returnObj = {
    success: function (callback) {
      methods.success = callback;
      return returnObj;
    },
    error: function (callback) {
      methods.error = callback;
      return returnObj;
    }
  };

  if (type === 'JSONP') {
    var fnName = 'callback'+Math.floor(Math.random()*1000001);
    window[fnName] = function(request) { methods.success.apply(methods, parse(request)); };
    var script = document.createElement('script');
    script.src = url+'&callback='+fnName;
    document.getElementsByTagName('head')[0].appendChild(script);
  }
  else {
    var request = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    request.open(type, url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          methods.success.apply(methods, parse(request));
        }
        else {
          methods.error.apply(methods, parse(request));
        }
      }
    };
    request.send(data);
  }

  return returnObj;
};