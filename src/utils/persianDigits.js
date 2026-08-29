const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value) {
  if (value === null || value === undefined) return "";

  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}

function shouldSkip(element) {
  if (!element) return true;
  if (element.closest?.("[data-latin-digits]")) return true;

  return [
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "CODE",
    "PRE",
  ].includes(element.tagName);
}

function convertTextNode(node) {
  const parent = node.parentElement;
  if (shouldSkip(parent)) return;

  const current = node.nodeValue;
  if (!current || !/\d/.test(current)) return;

  const converted = toPersianDigits(current);
  if (converted !== current) node.nodeValue = converted;
}

function convertTree(root) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    convertTextNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    convertTextNode(node);
  }
}

export function installPersianDigits() {
  if (typeof document === "undefined") return;

  convertTree(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        convertTextNode(mutation.target);
        continue;
      }

      mutation.addedNodes.forEach((node) => convertTree(node));
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => observer.disconnect();
}
