var app = {};

app.error = function () {
  return chrome.runtime.lastError;
};

app.notifications = {
  "id": "cookie-auto-delete-notifications-id",
  "create": function (e, callback) {
    if (chrome.notifications) {
      chrome.notifications.create(app.notifications.id, {
        "type": e.type ? e.type : "basic",
        "message": e.message ? e.message : '',
        "title": e.title ? e.title : "Notifications",
        "iconUrl": e.iconUrl ? chrome.runtime.getURL(e.iconUrl) : chrome.runtime.getURL("data/icons/64.png")
      }, function (e) {
        if (callback) callback(e);
      });
    }
  }
};

app.options = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.options.message[id] = callback;
    }
  },
  "send": function (id, data) {
    if (id) {
      chrome.runtime.sendMessage({"data": data, "method": id, "path": "background-to-options"}, app.error);
    }
  },
  "post": function (id, data) {
    if (id) {
      if (app.options.port) {
        app.options.port.postMessage({"data": data, "method": id, "path": "background-to-options"});
      }
    }
  }
};

app.cookies = {
  "remove": function (details, callback) {
    if (chrome.cookies) {
      chrome.cookies.remove(details, function (e) {
        if (callback) {
          app.storage.load(function () {
            callback(e);
          });
        }
      });
    }
  },
  "query": {
    "all": function (details, callback) {
      chrome.cookies.getAll(details, function (e) {
        if (callback) {
          app.storage.load(function () {
            callback(e);
          });
        }
      });
    }
  }
};

app.contentsettings = {
  "cookies": {
    "set": function (details, callback) {
      if (chrome.contentSettings) {
        if (chrome.contentSettings.cookies) {
          chrome.contentSettings.cookies.set(details, function (e) {
            if (callback) {
              app.storage.load(function () {
                callback(e);
              });
            }
          });
        }
      }
    },
    "clear": function (callback) {
      if (chrome.contentSettings) {
        if (chrome.contentSettings.cookies) {
          chrome.contentSettings.cookies.clear({}, function (e) {
            if (callback) {
              app.storage.load(function () {
                callback(e);
              });
            }
          });
        }
      }
    }
  }
};

app.storage = {
  "local": {},
  "read": function (id) {
    return app.storage.local[id];
  },
  "update": function (callback) {
    if (app.session) app.session.load();
    /*  */
    chrome.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (callback) {
        callback("update");
      }
    });
  },
  "write": function (id, data, callback) {
    let tmp = {};
    tmp[id] = data;
    app.storage.local[id] = data;
    /*  */
    chrome.storage.local.set(tmp, function (e) {
      if (callback) {
        callback(e);
      }
    });
  },
  "load": function (callback) {
    const keys = Object.keys(app.storage.local);
    if (keys && keys.length) {
      if (callback) {
        callback("cache");
      }
    } else {
      app.storage.update(function () {
        if (callback) callback("disk");
      });
    }
  } 
};

app.on = {
  "management": function (callback) {
    chrome.management.getSelf(callback);
  },
  "uninstalled": function (url) {
    chrome.runtime.setUninstallURL(url, function () {});
  },
  "installed": function (callback) {
    chrome.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    chrome.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "storage": function (callback) {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      app.storage.update(function () {
        if (callback) {
          callback(changes, namespace);
        }
      });
    });
  },
  "message": function (callback) {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      app.storage.load(function () {
        callback(request, sender, sendResponse);
      });
      /*  */
      return true;
    });
  }
};

app.button = {
  "title": function (tabId, title, callback) {
    if (title) {
      let options = {"title": title};
      if (tabId) options["tabId"] = tabId;
      chrome.action.setTitle(options, function (e) {
        if (callback) callback(e);
      });
    }
  },
  "on": {
    "clicked": function (callback) {
      chrome.action.onClicked.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  },
  "icon": function (tabId, path, imageData, callback) {
    if (path && typeof path === "object") {
      let options = {"path": path};
      if (tabId) options["tabId"] = tabId;
      chrome.action.setIcon(options, function (e) {
        if (callback) callback(e);
      });
    } else if (imageData && typeof imageData === "object") {
      let options = {"imageData": imageData};
      if (tabId) options["tabId"] = tabId;
      chrome.action.setIcon(options, function (e) {
        if (callback) callback(e);
      });
    } else {
      let options = {
        "path": {
          "16": "../data/icons/" + (path ? path + '/' : '') + "16.png",
          "32": "../data/icons/" + (path ? path + '/' : '') + "32.png",
          "48": "../data/icons/" + (path ? path + '/' : '') + "48.png",
          "64": "../data/icons/" + (path ? path + '/' : '') + "64.png"
        }
      };
      /*  */
      if (tabId) options["tabId"] = tabId;
      chrome.action.setIcon(options, function (e) {
        if (callback) callback(e);
      }); 
    }
  }
};

app.tab = {
  "open": function (url, index, active, callback) {
    let properties = {
      "url": url, 
      "active": active !== undefined ? active : true
    };
    /*  */
    if (index !== undefined) {
      if (typeof index === "number") {
        properties.index = index + 1;
      }
    }
    /*  */
    chrome.tabs.create(properties, function (tab) {
      if (callback) callback(tab);
    }); 
  },
  "query": {
    "all": function (options, callback) {
      chrome.tabs.query(options ? options : {}, function (tabs) {
        let tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs);
        } else callback(undefined);
      });
    },
    "index": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        let tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0].index);
        } else callback(undefined);
      });
    },
    "active": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        let tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0]);
        } else callback(undefined);
      });
    }
  },
  "on": {
    "created": function (callback) {
      chrome.tabs.onCreated.addListener(function (tab) {
        app.storage.load(function () {
          callback(tab);
        }); 
      });
    },
    "removed": function (callback) {
      chrome.tabs.onRemoved.addListener(function (tabId) {
        app.storage.load(function () {
          callback(tabId);
        }); 
      });
    },
    "updated": function (callback) {
      chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
        app.storage.load(function () {
          if (info && info.status) {
            callback(tab);
          }
        });
      });
    },
    "activated": function (callback) {
      chrome.tabs.onActivated.addListener(function (activeInfo) {
        app.storage.load(function () {
          chrome.tabs.get(activeInfo.tabId, function (tab) {
            let error = chrome.runtime.lastError;
            callback(tab ? tab : {"id": activeInfo.tabId});
          });
        });
      });
    }
  }
};