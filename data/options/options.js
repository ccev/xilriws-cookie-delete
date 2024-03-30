var background = (function () {
  let tmp = {};
  chrome.runtime.onMessage.addListener(function (request) {
    for (let id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-options") {
          if (request.method === id) {
            tmp[id](request.data);
          }
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {
      tmp[id] = callback;
    },
    "send": function (id, data) {
      chrome.runtime.sendMessage({
        "method": id, 
        "data": data,
        "path": "options-to-background"
      }, function () {
        return chrome.runtime.lastError;
      });
    }
  }
})();

var config = {
  "render": function (e) {
    document.getElementById("whitelist").value = e.whitelist.join(", ");
    document.getElementById("sessiononly").checked = e.sessiononly;
    document.getElementById("tabonly").checked = !e.sessiononly;
  },
  "load": function () {
    const tabonly = document.getElementById("tabonly");
    const whitelist = document.getElementById("whitelist");
    const sessiononly = document.getElementById("sessiononly");
    /*  */
    tabonly.addEventListener("change", function (e) {
      sessiononly.checked = !e.target.checked;
      background.send("store", {
        "sessiononly": sessiononly.checked
      });
    });
    /*  */
    sessiononly.addEventListener("change", function (e) {
      tabonly.checked = !e.target.checked;
      background.send("store", {
        "sessiononly": sessiononly.checked
      });
    });
    /*  */
    whitelist.addEventListener("change", function (e) {
      let list = [];
      let value = e.target.value || '';
      let hosts = value.split(/\s*\,\s*/);
      /*  */
      for (let i = 0; i < hosts.length; i++) {
        let tmp = hosts[i].replace("http://", '').replace("https://", '').replace("www.", '').split("/");
        list.push(tmp[0].trim());
      }
      /*  */
      list = list.filter(function (element, index, array) {return element && array.indexOf(element) === index});
      background.send("store", {
        "whitelist": list
      });
    });
    /*  */
    background.send("load");
    window.removeEventListener("load", config.load, false);
  }
};

background.receive("storage", config.render);
window.addEventListener("load", config.load, false);
