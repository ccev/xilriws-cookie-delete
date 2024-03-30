var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "load": function () {
    app.tab.query.all({}, function (tabs) {
      for (let i = 0; i < tabs.length; i++) {
        config.addon.tabs[tabs[i].id] = tabs[i];
      }
    });
    /*  */
    core.update.cookies(true);
  },
  "update": {
    "options": function () {
      app.options.send("storage", {
        "whitelist": config.addon.whitelist,
        "sessiononly": config.addon.sessiononly
      });
    },
    "button": function (tab) {
      if (tab) {
        config.addon.tabs[tab.id] = tab;
        /*  */
        if (config.addon.state === "ON") {
          if (config.check.url(tab.url)) {
            app.button.icon(tab.id, "ON");
            const note = (config.addon.sessiononly ? "Session-Only" : "Tab-Only");
            app.button.title(tab.id, "Cookie Auto Delete is active (method: " + note + ')');
          } else {
            app.button.icon(tab.id, "NEUTRAL");
            const domain = config.hostname(tab.url);
            const note = domain ? domain + " is whitelisted" : "is inactive for this tab";
            app.button.title(tab.id, "Cookie Auto Delete " + note);
          }
        } else {
          app.button.icon(tab.id, "OFF");
          app.button.title(tab.id, "Cookie Auto Delete is disabled");
        }
      } else {
        app.button.icon(tab.id, "OFF");
        app.button.title(tab.id, "Cookie Auto Delete is disabled");
      }
    },
    "cookies": function (startup) {
      app.contentsettings.cookies.clear();
      app.tab.query.active(core.update.button);
      /*  */
      const session = config.addon.sessiononly && config.addon.state === "ON";
      app.contentsettings.cookies.set({
        "primaryPattern": "*://*/*", 
        "setting": session ? "session_only" : "allow"
      }, function () {
        if (config.log) {
          console.error("Cookie Auto Delete >>", "Primary Pattern:", "*://*/*", ">> Setting:", session ? "session_only" : "allow");
        }
        /*  */
        config.addon.whitelist.forEach(function (host) {
          app.contentsettings.cookies.set({
            "setting": "allow",
            "primaryPattern": "*://*." + host + "/*",
          });
        });
        /*  */
        const str_1 = (session ? "Session Only: " : " Tab Only: ");
        const str_3 = (session ? " the browser." : " a tab.");
        const str_2 = "cookies are deleted when you close";
        /*  */
        if (startup === false && config.addon.state === "ON") {
          app.notifications.create({
            "title": "Cookie Auto Delete",
            "message": str_1 + str_2 + str_3
          });
        }
      });
    }
  },
  "action": {
    "storage": function (changes, namespace) {
      core.update.cookies(false);
    },
    "button": function () {
      config.addon.state = config.addon.state === "ON" ? "OFF" : "ON";
    },
    "store": function (e) {
      if (e) {
        if ("whitelist" in e) {
          config.addon.whitelist = e.whitelist;
        }
        /*  */
        if ("sessiononly" in e) {
          config.addon.sessiononly = e.sessiononly;
        }
        /*  */
        core.update.options();
      }
    },
    "removed": function (tabId) {
      if (config.addon.sessiononly && config.addon.state === "ON") {
        if (config.log) {
          console.error("Notice >> cookies are deleted when you close the browser.");
        }
      }
      /*  */
      if (config.addon.sessiononly || config.addon.state === "OFF") return;
      /*  */
      const tab = config.addon.tabs[tabId];
      if (tab) {
        if (tab.url) {
          if (config.check.url(tab.url)) {
            app.tab.query.all({}, function (tabs) {
              for (let i = 0; i < tabs.length; i++) {
                const domain_1 = config.hostname(tab.url);
                const domain_2 = config.hostname(tabs[i].url);
                if (domain_1 !== undefined && domain_2 !== undefined) {
                  if (domain_1 === domain_2) {
                    if (config.log) {
                      console.error("No action >> duplicate tab is detected!");
                    }
                    /*  */
                    return;
                  }
                }
              }
              /*  */
              app.cookies.query.all({"url": tab.url}, function (cookies) {
                if (cookies && cookies.length) {
                  for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const DOMAIN = "://" + cookie.domain + cookie.path;
                    const URL_1 = DOMAIN.replace("://.", "://").replace("www.", '');
                    const URL_2 = URL_1.replace("://", "://www.");
                    const URLS = [("http" + URL_1), ("https" + URL_1), ("http" + URL_2), ("https" + URL_2)];
                    /*  */
                    for (let j = 0; j < URLS.length; j++) {
                      const url = URLS[j];
                      app.cookies.remove({"url": url, "name": cookie.name}, function () {
                        if (config.log) {
                          console.error("Cookie deleted >>", cookie.name, cookie.domain, url);
                        }
                      });
                    }
                  }
                } else {
                  if (config.log) {
                    console.error("Error >> no cookies are available for this tab!", tab.url);
                  }
                }
                /*  */
                delete config.addon.tabs[tabId];
              });
            });
          } else {
            if (config.log) {
              console.error("Error >> tab is whitelisted!", tab.url);
            }
          }
        } else {
          if (config.log) {
            console.error("Error >> invalid tab!");
          }
        }
      } else {
        if (config.log) {
          console.error("Error >> no tab is detected!");
        }
      }
    }
  }
};

app.tab.on.removed(core.action.removed);
app.tab.on.created(function (tab) {core.update.button(tab)});
app.tab.on.updated(function (tab) {core.update.button(tab)});
app.tab.on.activated(function (tab) {core.update.button(tab)});

app.button.on.clicked(core.action.button);
app.options.receive("store", core.action.store);
app.options.receive("load", core.update.options);

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);
