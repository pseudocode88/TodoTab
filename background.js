chrome.runtime.onInstalled.addListener(function(res) {
    chrome.tabs.create({
        url: chrome.extension.getURL('welcome.html')
    })
});

chrome.runtime.setUninstallURL("http://jaison.info/projects/todotab/uninstalled.html");
