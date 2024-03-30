var config = {};

config.log = false;

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.addon = {
  "tabs": [],
  set state (val) {app.storage.write("state", val)},
  set whitelist (val) {app.storage.write("whitelist", val)},
  set sessiononly (val) {app.storage.write("sessiononly", val)},
  get state () {return app.storage.read("state") !== undefined ? app.storage.read("state") : "ON"},
  get whitelist () {return app.storage.read("whitelist") !== undefined ? app.storage.read("whitelist") : []},
  get sessiononly () {return app.storage.read("sessiononly") !== undefined ? app.storage.read("sessiononly") : false}
};

config.hostname = function (url) {
  if (url && url.indexOf("http") === 0) {
    try {
      const tmp = new URL(url);
      return tmp.hostname.replace("www.", ''); 
    } catch (e) {}
  }
  /*  */
  return undefined;
};

config.check = {
  "url": function (url) {
    if (url) {
      const domain = config.hostname(url);
      if (domain) {
        const whitelist = config.addon.whitelist;
        return whitelist.indexOf(domain) === -1;
      }
      /*  */
      return false;
    }
    /*  */
    return false;
  }
};
