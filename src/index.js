import React from "react";
import { render } from "react-dom";
import App from "./components/App";
import { loadScrollyteller } from "@abcnews/scrollyteller";

const PROJECT_NAME = "interactive-coronavirus-spread";
const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function init() {
  let scrollyData;
  try {
    scrollyData = loadScrollyteller("one", "u-full");
  } catch (e) {
    console.error(e);
  }

  // Keep the DOM tidy.
  if (scrollyData && scrollyData.mountNode) {
    while (scrollyData.mountNode.nextElementSibling.tagName === "A") {
      window.__ODYSSEY__.utils.dom.detach(
        scrollyData.mountNode.nextElementSibling
      );
    }
  }

  render(<App scrollyData={scrollyData} />, scrollyData.mountNode);
}

if (window.__ODYSSEY__) {
  init();
} else {
  window.addEventListener("odyssey:api", init);
}

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      import("./components/ErrorBox").then(exports => {
        const ErrorBox = exports.default;
        render(<ErrorBox error={err} />, root);
      });
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
