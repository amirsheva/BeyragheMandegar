const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toFaDigits(value) {
  return String(
    value ?? ""
  ).replace(
    /[0-9]/g,
    (digit) =>
      FA_DIGITS[
        Number(digit)
      ]
  );
}

function translateTextNode(node) {
  if (
    !node ||
    node.nodeType !==
      Node.TEXT_NODE ||
    !/[0-9]/.test(
      node.nodeValue || ""
    )
  ) {
    return;
  }

  const parent =
    node.parentElement;

  if (!parent) {
    return;
  }

  if (
    parent.closest(
      '[data-keep-latin-digits="true"]'
    )
  ) {
    return;
  }

  const tag =
    parent.tagName;

  if (
    [
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
    ].includes(tag)
  ) {
    return;
  }

  node.nodeValue =
    toFaDigits(
      node.nodeValue
    );
}

function translateAttributes(
  element
) {
  if (
    !element ||
    element.nodeType !==
      Node.ELEMENT_NODE
  ) {
    return;
  }

  if (
    element.closest?.(
      '[data-keep-latin-digits="true"]'
    )
  ) {
    return;
  }

  for (
    const attribute of [
      "placeholder",
      "title",
      "aria-label",
    ]
  ) {
    const value =
      element.getAttribute?.(
        attribute
      );

    if (
      value &&
      /[0-9]/.test(value)
    ) {
      element.setAttribute(
        attribute,
        toFaDigits(value)
      );
    }
  }
}

function translateTree(
  root
) {
  if (!root) {
    return;
  }

  if (
    root.nodeType ===
    Node.TEXT_NODE
  ) {
    translateTextNode(
      root
    );

    return;
  }

  if (
    root.nodeType !==
    Node.ELEMENT_NODE &&
    root.nodeType !==
    Node.DOCUMENT_NODE
  ) {
    return;
  }

  if (
    root.nodeType ===
    Node.ELEMENT_NODE
  ) {
    translateAttributes(
      root
    );
  }

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

  let node =
    walker.nextNode();

  while (node) {
    translateTextNode(
      node
    );

    node =
      walker.nextNode();
  }

  if (
    root.querySelectorAll
  ) {
    root
      .querySelectorAll(
        "[placeholder],[title],[aria-label]"
      )
      .forEach(
        translateAttributes
      );
  }
}

let observer = null;

export function installPersianDigitDisplay() {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  document.documentElement.lang =
    "fa";

  document.documentElement.dir =
    "rtl";

  if (
    document.body
  ) {
    document.body.dir =
      "rtl";
  }

  translateTree(
    document.body ||
      document.documentElement
  );

  if (observer) {
    return;
  }

  observer =
    new MutationObserver(
      (mutations) => {
        for (
          const mutation of
          mutations
        ) {
          if (
            mutation.type ===
            "characterData"
          ) {
            translateTextNode(
              mutation.target
            );

            continue;
          }

          for (
            const node of
            mutation.addedNodes
          ) {
            translateTree(
              node
            );
          }
        }
      }
    );

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true,
      characterData: true,
    }
  );
}
