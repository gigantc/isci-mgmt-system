/**
 * XML parsing for the Matrix library. It runs in the browser (DOMParser). Node
 * tests inject a DOM implementation with setDOMParser(); the library only uses
 * parseFromString plus getElementsByTagNameNS("*", name), localName, parentNode,
 * children, getAttribute, getAttributeNS and textContent.
 */

let ParserImpl = null;

export const setDOMParser = (Impl) => {
  ParserImpl = Impl;
};

export const parseXml = (text) => {
  const Impl = ParserImpl || globalThis.DOMParser;
  if (!Impl) throw new Error("No DOMParser available; call setDOMParser() first");
  return new Impl().parseFromString(text, "application/xml");
};

export const tagNS = (el, name) => el.getElementsByTagNameNS("*", name);
