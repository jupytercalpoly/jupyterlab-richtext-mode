import {Schema} from "prosemirror-model"
// import { typesetter } from "../index";
// import { MathJaxTypesetter } from "@jupyterlab/mathjax2";
// import { PageConfig } from "@jupyterlab/coreutils";
// ::Schema Document schema for the data model used by CommonMark.
export const schema = new Schema({
  nodes: {
    doc: {
      content: "block+"
    },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{tag: "p"}],
      toDOM() { return ["p", 0] }
    },

    blockquote: {
      content: "block+",
      group: "block",
      parseDOM: [{tag: "blockquote"}],
      toDOM() { return ["blockquote", 0] }
    },

    horizontal_rule: {
      group: "block",
      parseDOM: [{tag: "hr"}],
      toDOM() { return ["div", ["hr"]] }
    },

    heading: {
      attrs: {level: {default: 1}},
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [{tag: "h1", attrs: {level: 1}},
                 {tag: "h2", attrs: {level: 2}},
                 {tag: "h3", attrs: {level: 3}},
                 {tag: "h4", attrs: {level: 4}},
                 {tag: "h5", attrs: {level: 5}},
                 {tag: "h6", attrs: {level: 6}}],
      toDOM(node) { return ["h" + node.attrs.level, 0] }
    },

    code_block: {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      attrs: {params: {default: ""}},
      parseDOM: [{tag: "pre", preserveWhitespace: true, getAttrs: node => (
        //@ts-ignore
        {params: node.getAttribute("data-params") || ""}
      )}],
      toDOM(node) { return ["pre", node.attrs.params ? {"data-params": node.attrs.params} : {}, ["code", 0]] }
    },

    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: {order: {default: 1}, tight: {default: false}},
      parseDOM: [{tag: "ol", getAttrs(dom) {
        //@ts-ignore
        return {order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1,
        //@ts-ignore
                tight: dom.hasAttribute("data-tight")}
      }}],
      toDOM(node) {
        return ["ol", {start: node.attrs.order == 1 ? null : node.attrs.order,
                       "data-tight": node.attrs.tight ? "true" : null}, 0]
      }
    },

    bullet_list: {
      content: "list_item+",
      group: "block",
      attrs: {tight: {default: false}},
      //@ts-ignore
      parseDOM: [{tag: "ul", getAttrs: dom => ({tight: dom.hasAttribute("data-tight")})}],
      toDOM(node) { return ["ul", {"data-tight": node.attrs.tight ? "true" : null}, 0] }
    },

    list_item: {
      content: "paragraph block*",
      defining: true,
      parseDOM: [{tag: "li"}],
      toDOM() { return ["li", 0] }
    },

    text: {
      group: "inline",
      toDOM(node) { return node.text }
    },

    inline_markdown: {
      inline: true,
      group: "inline",
      toDOM(node) { return ["span", 0]}
    },
    image: {
      inline: true,
      attrs: {
        src: {},
        alt: {default: null},
        title: {default: null}
      },
      group: "inline",
      draggable: true,
      parseDOM: [{tag: "img[src]", getAttrs(dom) {
        return {
          //@ts-ignore
          src: dom.getAttribute("src"),
          //@ts-ignore
          title: dom.getAttribute("title"),
          //@ts-ignore
          alt: dom.getAttribute("alt")
        }
      }}],
      toDOM(node) { return ["img", node.attrs] }
    },

    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{tag: "br"}],
      toDOM() { return ["br"] }
    },
    inline_math: {
      inline: true,
      group: "inline",
      attrs: {
        texts: {}
      },
      draggable: true,
      parseDOM: [{tag: "span"}],
      toDOM(node) { return ["span", 0]}
    },

    block_math: {
      group: "block",
      attrs: {
        texts: {}
      },
      draggable: true,
      parseDOM: [{tag: "div"}],
      toDOM(node) { return ["div", 0]}
    }
  },

  marks: {
    em: {
      parseDOM: [{tag: "i"}, {tag: "em"},
                 {style: "font-style", getAttrs: value => value == "italic" && null}],
      toDOM() { return ["em"] }
    },

    strong: {
      parseDOM: [{tag: "b"}, {tag: "strong"},
      //@ts-ignore
                 {style: "font-weight", getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null}],
      toDOM() { return ["strong"] }
    },

    link: {
      attrs: {
        href: {},
        title: {default: null}
      },
      inclusive: false,
      parseDOM: [{tag: "a[href]", getAttrs(dom) {
        //@ts-ignore
        return {href: dom.getAttribute("href"), title: dom.getAttribute("title")}
      }}],
      toDOM(node) { return ["a", node.attrs] }
    },
    
    strikethrough: {
      parseDOM: [{tag: "del"}],
      toDOM() { return ["del"]}
    },
    underline: {
      parseDOM: [{tag: "ins"}],
      toDOM() { return ["ins"]}
    },
    code: {
      parseDOM: [{tag: "code"}],
      toDOM() { return ["code"] }
    }
  }
})