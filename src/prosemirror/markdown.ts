import * as Markdown from 'prosemirror-markdown';
import { schema } from './prosemirror-schema';
// import markdownit from "markdown-it/lib";
import { Fragment, Mark } from "prosemirror-model";
import { MarkdownParser } from "./from_markdown";

const md = require('markdown-it')({html: true}).use(require('markdown-it-mathjax')());
export const parser = new MarkdownParser(schema, md, {
    blockquote: {block: "blockquote"},
    paragraph: {block: "paragraph"},
    list_item: {block: "list_item"},
    bullet_list: {block: "bullet_list"},
    ordered_list: {block: "ordered_list", getAttrs: (tok: any) => ({order: +tok.attrGet("order") || 1})},
    heading: {block: "heading", getAttrs: (tok: any) => ({level: +tok.tag.slice(1)})},
    code_block: {block: "code_block"},
    fence: {block: "code_block", getAttrs: (tok: any) => ({params: tok.info || ""})},
    hr: {node: "horizontal_rule"},
    image: {node: "image", getAttrs: (tok: any) => ({
      src: tok.attrGet("src"),
      title: tok.attrGet("title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    })},
    hardbreak: {node: "hard_break"},
    inline_math: {node: "inline_math", getAttrs: (tok: any) => ({texts: `$${tok.content}$`})},
    display_math: {block: "block_math", getAttrs: (tok: any) => ({texts: `$$${tok.content}$$`})},
    em: {mark: "em"},
    strong: {mark: "strong", escaped: false},
    link: {mark: "link", getAttrs: (tok: any) => ({
      href: tok.attrGet("href"),
      title: tok.attrGet("title") || null
    })},        
    code_inline: {mark: "code"},
    ins: {mark: "underline"},
    s: {mark: "strikethrough"}

});



export const serializer = new Markdown.MarkdownSerializer({
    blockquote(state, node) {
      state.wrapBlock("> ", null, node, () => state.renderContent(node))
    },
    code_block(state, node) {
      state.write("```" + (node.attrs.params || "") + "\n")
      state.text(node.textContent, false)
      state.ensureNewLine()
      state.write("```")
      state.closeBlock(node)
    },
    heading(state, node) {
      state.write(state.repeat("#", node.attrs.level) + " ")
      state.renderInline(node)
      state.closeBlock(node)
    },
    horizontal_rule(state, node) {
      state.write(node.attrs.markup || "---")
      state.closeBlock(node)
    },
    bullet_list(state, node) {
      state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ")
    },
    ordered_list(state, node) {
      let start = node.attrs.order || 1
      let maxW = String(start + node.childCount - 1).length
      let space = state.repeat(" ", maxW + 2)
      state.renderList(node, space, i => {
        let nStr = String(start + i)
        return state.repeat(" ", maxW - nStr.length) + nStr + ". "
      })
    },
    list_item(state, node) {
      state.renderContent(node)
    },
    paragraph(state, node) {
      state.renderInline(node)
      state.closeBlock(node)
    },
    inline_math(state, node) {
      state.text(node.attrs.texts)
    },
    block_math(state, node) {
      state.text(node.attrs.texts);
      state.closeBlock(node);
    },
    image(state, node) {
      state.write("![" + state.esc(node.attrs.alt || "") + "](" + state.esc(node.attrs.src) +
      //@ts-ignore
                  (node.attrs.title ? " " + state.quote(node.attrs.title) : "") + ")")
    },
    hard_break(state, node, parent, index) {
      for (let i = index + 1; i < parent.childCount; i++)
        if (parent.child(i).type != node.type) {
          state.write("\\\n")
          return
        }
    },
    text(state, node) {
      state.text(node.text)
    }
  }, {
    em: {open: "*", close: "*", mixable: true, expelEnclosingWhitespace: true},
    strong: {open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true},
    link: {
      open(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
        return isPlainURL(mark, parent, index, 1) ? "<" : "["
      },
      close(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
          
        return isPlainURL(mark, parent, index, -1) ? ">"
        //@ts-ignore
          : "](" + _state.esc(mark.attrs.href) + (mark.attrs.title ? " " + _state.quote(mark.attrs.title) : "") + ")"
      }
    },
    underline: {open: "<ins>", close: "</ins>", mixable: true, expelEnclosingWhitespace: true},
    strikethrough: {open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true},
    code: {open: "`", close: "`", mixable: true, expelEnclosingWhitespace: true},
    math: {open: "", close: "", mixable: true, expelEnclosingWhitepsace: true}

  })

  //@ts-ignore
  function backticksFor(node, side) {
    let ticks = /`+/g, m, len = 0
    if (node.isText) while (m = ticks.exec(node.text)) len = Math.max(len, m[0].length)
    let result = len > 0 && side > 0 ? " `" : "`"
    for (let i = 0; i < len; i++) result += "`"
    if (len > 0 && side < 0) result += " "
    return result
  }
  
  //@ts-ignore
  function isPlainURL(link, parent, index, side) {
    if (link.attrs.title) return false
    let content = parent.child(index + (side < 0 ? -1 : 0))
    if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link) return false
    if (index == (side < 0 ? 1 : parent.childCount - 1)) return true
    let next = parent.child(index + (side < 0 ? -2 : 1))
    return !link.isInSet(next.marks)
  }