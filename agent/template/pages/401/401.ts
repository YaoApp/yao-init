/// <reference path="../../__assets/js/yao-agent.d.ts" />

// If already logged in, go back
if (window.YaoAgent.isLoggedIn()) {
  window.history.length > 2 ? window.history.back() : (window.location.href = "/");
}
