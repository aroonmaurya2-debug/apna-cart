// Prevent old/corrupted localStorage values from crashing the React app on startup.
(function () {
  try {
    ['apna-cart-user', 'apna-cart-cart'].forEach(function (key) {
      var value = localStorage.getItem(key)
      if (value == null) return
      try {
        JSON.parse(value)
      } catch (_) {
        localStorage.removeItem(key)
      }
    })
  } catch (_) {}
})()
