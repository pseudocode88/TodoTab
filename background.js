browser.runtime.onInstalled.addListener(function(res) {
    chrome.tabs.create({
        url: chrome.extension.getURL('welcome.html')
    })
});

browser.runtime.setUninstallURL("http://jaison.info/projects/todotab/uninstalled.html");