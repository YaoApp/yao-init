/// <reference path="../../__assets/js/yao-agent.d.ts" />
import { Component } from "@yao/sui";

const self = this as Component;

// Show requested URL
const urlEl = document.getElementById("requested-url");
if (urlEl) {
  urlEl.textContent = window.location.pathname + window.location.search;
}

// Go back handler
self.GoBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "/";
  }
};
