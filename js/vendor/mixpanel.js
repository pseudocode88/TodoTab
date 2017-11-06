var api = 'https://api.mixpanel.com';

var mixpanel = {}

function init(token, user) {
    mixpanel.token = token;
}

function track(event) {
    var payload = {
        event: event,
        properties: {
            token: mixpanel.token,
            browser: window.navigator.userAgent
        }
    };

    var data = btoa(JSON.stringify(payload));
    var url = api + '/track?data=' + data;

    xhr('GET', url);
}

mixpanel.init = init,
mixpanel.track = track;
