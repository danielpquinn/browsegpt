(() => {
  /**
   * @typedef SimpleNode
   * @type {object}
   * @property {string} id
   * @property {HTMLElement} el
   * @property {string} tag
   * @property {SimpleNode[]} children
   */

  /**
   * @typedef Action
   * @type {object}
   * @property {"CLICK" | "NAVIGATE" | "ENTER_TEXT"} action
   * @property {number} id
   * @property {string} value
   * @property {string} el
   */

  /**
   * @typedef Command
   * @type {object}
   * @property {string} reason
   * @property {string} step
   * @property {Action[]} actions
   */

  /** @type Map<string, SimpleNode> */
  const nodes = new Map();

  /** @type Set<HTMLElement> */
  const used = new Set();

  /**
   * @param {number} delay
   */
  const wait = (delay) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, delay);
    });

  const sendKeys = async (el, str) => {
    let val = "";
    const keys = str.split("");
    for (const key of keys) {
      val += key;
      el.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
      );
      await wait(10);
      el.dispatchEvent(
        new KeyboardEvent("keypress", { bubbles: true, cancelable: true, key })
      );
      await wait(10);
      el.value = val;
      await wait(10);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await wait(10);
      el.dispatchEvent(new Event("change", { bubbles: true }));
      await wait(10);
      el.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key })
      );
      await wait(10);
    }
  };

  /**
   * @param {HTMLElement} el Element to type into
   * @param {string} text Text to enter
   * @param {boolean} submit Wether to submit form after entering text
   */
  const enterText = async (el, text, submit) => {
    el.click();
    el.focus();

    await sendKeys(el, text);

    if (!submit) {
      return;
    }

    let form = null;
    let currentEl = el;

    while (currentEl) {
      if (currentEl.tagName === "FORM") {
        form = currentEl;
        currentEl = null;
      } else {
        currentEl = currentEl.parentNode;
      }
    }

    if (form) {
      form.requestSubmit();
      return;
    }

    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
      })
    );
    await wait(10);
    el.dispatchEvent(
      new KeyboardEvent("keypress", {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
      })
    );
    await wait(10);
    el.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
      })
    );
    await wait(10);
  };

  const allowedTags = new Set([
    // Interactive elements
    "LINK",
    "BUTTON",
    "INPUT",
    "TEXTAREA",
    // Contextual elements
    "HEADING",
    "HEADER",
    "MAIN",
    "MENU",
    "NAV",
    "ARTICLE",
    "SECTION",
    "DIALOG",
    "FORM",
  ]);

  const tagsWithText = new Set([
    "LINK",
    "BUTTON",
    "INPUT",
    "TEXTAREA",
    "HEADING",
  ]);

  /**
   * @param {HTMLElement} el
   */
  const getLabel = (el) => {
    if (el.ariaLabel) {
      return el.ariaLabel;
    }

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const label = document.getElementById(labelledBy);
      if (label) {
        const text = label.textContent;
        if (text) {
          return text;
        }
      }
    }

    try {
      const labelEl = document.querySelector(
        `label[for="${el.getAttribute("name")}"], label[for="${el.getAttribute(
          "id"
        )}"]`
      );
      if (labelEl) {
        return labelEl.textContent;
      }
    } catch (e) {
      // Ignore querySelector errors
    }

    const placeholder = el.getAttribute("placeholder");
    if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && placeholder) {
      return placeholder;
    }

    const nameAttribute = el.getAttribute("nameAttribute");
    if (
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
      nameAttribute
    ) {
      return nameAttribute;
    }

    return "";
  };

  const clean = (text = "") => {
    return text
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .substring(0, 30)
      .trim();
  };

  /**
   * @param {SimpleNode} node
   */
  const getTextForNode = (node) => {
    const { el } = node;
    let label = getLabel(el);

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const value = clean(el.value);
      if (label) {
        return `label=${clean(label)}, value=${value || "None"}`;
      }
    }

    if (label) {
      return clean(label);
    }

    if (el.textContent) {
      return clean(el.textContent);
    }

    if (el.getAttribute("href")) {
      return clean(el.getAttribute("href"));
    }
  };

  /**
   * @param {HTMLElement} el
   */
  const getSimplifiedTag = (el) => {
    if (!el.tagName) {
      return null;
    }

    if (
      el.tagName === "BUTTON" ||
      el.getAttribute("role") === "button" ||
      (el.tagName === "INPUT" && el.getAttribute("type") === "submit") ||
      (el.tagName === "INPUT" && el.getAttribute("type") === "radio")
    ) {
      return "BUTTON";
    }

    if (el.tagName === "A") {
      return "LINK";
    }

    if (el.tagName === "INPUT") {
      const type = el.getAttribute("type");

      if (["text", "search", "tel"].includes(type) || !type) {
        return "INPUT";
      }
    }

    if (el.tagName === "TEXTAREA" || el.getAttribute("role") === "textbox") {
      return "TEXTAREA";
    }

    if (el.tagName === "HEADER") {
      return "HEADER";
    }

    if (el.tagName === "MAIN" || el.getAttribute("role") === "main") {
      return "MAIN";
    }

    if (el.tagName === "MENU" || el.getAttribute("role") === "menu") {
      return "MENU";
    }

    if (el.tagName === "NAV" || el.getAttribute("role") === "nav") {
      return "NAV";
    }

    if (el.tagName === "DIALOG" || el.getAttribute("role") === "dialog") {
      return "DIALOG";
    }

    if (el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3") {
      return "HEADING";
    }

    if (el.tagName === "FORM") {
      return "FORM";
    }
    return "";
  };

  /**
   * @param {SimpleNode} root
   */
  const serialize = (root) => {
    let output = "";

    /**
     * @param {SimpleNode} node
     * @param {number} depth
     */
    const serializeNode = (node, depth) => {
      const { id, tag, children } = node;
      const text = tagsWithText.has(tag) ? getTextForNode(node) : "";
      const padding = new Array(depth + 1).join("  ");
      output += `${padding}${id} ${tag}`;
      if (text) {
        output += " ";
        output += text;
      }
      output += "\n";

      for (const child of children) {
        serializeNode(child, depth + 1);
      }
    };

    for (const child of root.children) {
      serializeNode(child, 0);
    }

    return output;
  };

  const getBrowserContent = () => {
    nodes.clear();
    let id = -1;

    /** @type SimpleNode */
    const root = {
      id,
      el: document.body,
      tag: "BODY",
      children: [],
    };

    /**
     *
     * @param {HTMLElement} el
     * @param {SimpleNode} parent
     * @returns
     */
    const processNode = (el, parent) => {
      if (!(el instanceof Element)) {
        return;
      }
      const tag = getSimplifiedTag(el);
      const text = getTextForNode({ el, tag });

      if (
        allowedTags.has(tag) &&
        !used.has(el) &&
        el.checkVisibility?.() &&
        el.getBoundingClientRect?.()?.top < window.innerHeight
      ) {
        id += 1;
        const node = {
          id,
          el,
          tag,
          text,
          children: [],
        };
        nodes.set(id, node);
        parent.children.push(node);
        for (const child of Array.from(el.childNodes)) {
          processNode(child, node);
        }
      } else {
        const children = Array.from(el.childNodes);
        for (const child of children) {
          processNode(child, parent);
        }
      }
    };

    for (const child of Array.from(root.el.childNodes)) {
      processNode(child, root);
    }

    const html = serialize(root).split("\n").slice(0, 100).join("\n");

    return {
      html,
      url: window.location.href.substring(0, 60),
    };
  };

  /**
   * @param {string} command
   */
  const runCommand = async (commandJson) => {
    try {
      /** @type Command */
      const command = JSON.parse(commandJson);
      const lastEnterText = command.actions
        .filter((a) => a.action === "ENTER_TEXT")
        .pop();
      for (const actionObj of command.actions) {
        const { action, id, value } = actionObj;
        if (action === "CLICK") {
          nodes.get(id).el.click();
          used.add(nodes.get(id).el);
        } else if (action === "ENTER_TEXT") {
          await enterText(nodes.get(id).el, value, actionObj === lastEnterText);
          used.add(nodes.get(id).el);
        } else if (action === "NAVIGATE") {
          window.location.assign(value);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  chrome.runtime.onMessage.addListener((req, sender, res) => {
    if (req.message === "get_browser_content") {
      const browserContent = getBrowserContent();
      res({
        url: browserContent.url,
        html: browserContent.html,
      });
    } else if (req.message === "run_command") {
      runCommand(req.command);
    } else if (req.message === "clear_history") {
      used.clear();
    }
  });
})();
