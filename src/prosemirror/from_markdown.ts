// import markdownit from "markdown-it"
// import {schema} from "./prosemirror-schema"
import {Mark, Schema, NodeType, Node} from "prosemirror-model"

function maybeMerge(a: any, b: any) {
  if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks))
    return a.withText(a.text + b.text)
}

// Object used to track the context of a running parse.
class MarkdownParseState {

    private schema: Schema;
    public stack: Object[];
    private marks: Mark[];
    private tokenHandlers: any;

  constructor(schema: Schema, tokenHandlers: any) {
    this.schema = schema
    this.stack = [{type: schema.topNodeType, content: []}]
    this.marks = Mark.none
    this.tokenHandlers = tokenHandlers
  }

  top() {
    return this.stack[this.stack.length - 1]
  }

  push(elt: any) {
      //@ts-ignore
    if (this.stack.length) this.top().content.push(elt)
  }

  // : (string)
  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText(text: string) {
    if (!text) return
    //@ts-ignore
    let nodes = this.top().content, last = nodes[nodes.length - 1]
    let node = this.schema.text(text, this.marks), merged
    if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged
    else nodes.push(node)
  }

  // : (Mark)
  // Adds the given mark to the set of active marks.
  openMark(mark: Mark) {
    this.marks = mark.addToSet(this.marks)
  }

  // : (Mark)
  // Removes the given mark from the set of active marks.
  closeMark(mark: Mark) {
    this.marks = mark.removeFromSet(this.marks)
  }

  parseTokens(toks: any) {
    for (let i = 0; i < toks.length; i++) {
      let tok = toks[i]
      // console.log(tok);
      let handler = this.tokenHandlers[tok.type]
      if (!handler)
        throw new Error("Token type `" + tok.type + "` not supported by Markdown parser")
      handler(this, tok)
    }
  }

  // : (NodeType, ?Object, ?[Node]) → ?Node
  // Add a node at the current position.
  addNode(type: NodeType, attrs?: Object, content?: [Node]) {
    // console.log(type, content);
    let node = type.createAndFill(attrs, content, this.marks);
    // console.log(node);
    if (!node) return null
    this.push(node)
    return node
  }

  // : (NodeType, ?Object)
  // Wrap subsequent content in a node of the given type.
  openNode(type: NodeType, attrs?: Object) {
    this.stack.push({type: type, attrs: attrs, content: []})
  }

  // : () → ?Node
  // Close and return the node that is currently on top of the stack.
  closeNode() {
    if (this.marks.length) this.marks = Mark.none
    let info = this.stack.pop()
    // console.log(info);
    //@ts-ignore
    return this.addNode(info.type, info.attrs, info.content)
  }
}

function attrs(spec: any, token: any) {
  if (spec.getAttrs) return spec.getAttrs(token)
  // For backwards compatibility when `attrs` is a Function
  else if (spec.attrs instanceof Function) return spec.attrs(token)
  else return spec.attrs
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
function noOpenClose(type: string) {
  return type == "code_inline" || type == "code_block" || type == "fence" || type == "display_math"
}

function withoutTrailingNewline(str: string) {
  return str[str.length - 1] == "\n" ? str.slice(0, str.length - 1) : str
}

function noOp() {}

function tokenHandlers(schema: Schema, tokens: Object) {
  let handlers = Object.create(null)
  for (let type in tokens) {
      // console.log(type);
      //@ts-ignore
    let spec = tokens[type]
    if (spec.block) {
        //@ts-ignore
      let nodeType = schema.nodeType(spec.block)
      if (noOpenClose(type)) {
          // console.log(type);
        handlers[type] = (state: any, tok: any) => {
          state.openNode(nodeType, attrs(spec, tok))
          if (!(type === "display_math")) {
            state.addText(withoutTrailingNewline(tok.content))
          }
          state.closeNode()
        }
      } else {
        handlers[type + "_open"] = (state: any, tok: any) => state.openNode(nodeType, attrs(spec, tok))
        handlers[type + "_close"] = (state: any) => state.closeNode()
      }
    } else if (spec.node) {
        //@ts-ignore
      let nodeType = schema.nodeType(spec.node)
      handlers[type] = (state: any, tok: any) => state.addNode(nodeType, attrs(spec, tok))
    } else if (spec.mark) {
      let markType = schema.marks[spec.mark]
      if (noOpenClose(type)) {
        handlers[type] = (state: any, tok: any) => {
          state.openMark(markType.create(attrs(spec, tok)))
          state.addText(withoutTrailingNewline(tok.content))
          state.closeMark(markType)
        }
      } else {
        handlers[type + "_open"] = (state: any, tok: any) => state.openMark(markType.create(attrs(spec, tok)))
        handlers[type + "_close"] = (state: any) => state.closeMark(markType)
      }
    } else if (spec.ignore) {
      if (noOpenClose(type)) {
        handlers[type] = noOp
      } else {
        handlers[type + '_open'] = noOp
        handlers[type + '_close'] = noOp
      }
    } else {
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec))
    }
  }

  handlers.text = (state: any, tok: any) => state.addText(tok.content)
  handlers.inline = (state: any, tok: any) => state.parseTokens(tok.children)
  handlers.softbreak = handlers.softbreak || ((state: any) => state.addText("\n"))

  return handlers
}

// ::- A configuration of a Markdown parser. Such a parser uses
// [markdown-it](https://github.com/markdown-it/markdown-it) to
// tokenize a file, and then runs the custom rules it is given over
// the tokens to create a ProseMirror document tree.
export class MarkdownParser {
  // :: (Schema, MarkdownIt, Object)
  // Create a parser with the given configuration. You can configure
  // the markdown-it parser to parse the dialect you want, and provide
  // a description of the ProseMirror entities those tokens map to in
  // the `tokens` object, which maps token names to descriptions of
  // what to do with them. Such a description is an object, and may
  // have the following properties:
  //
  // **`node`**`: ?string`
  //   : This token maps to a single node, whose type can be looked up
  //     in the schema under the given name. Exactly one of `node`,
  //     `block`, or `mark` must be set.
  //
  // **`block`**`: ?string`
  //   : This token comes in `_open` and `_close` variants (which are
  //     appended to the base token name provides a the object
  //     property), and wraps a block of content. The block should be
  //     wrapped in a node of the type named to by the property's
  //     value.
  //
  // **`mark`**`: ?string`
  //   : This token also comes in `_open` and `_close` variants, but
  //     should add a mark (named by the value) to its content, rather
  //     than wrapping it in a node.
  //
  // **`attrs`**`: ?Object`
  //   : Attributes for the node or mark. When `getAttrs` is provided,
  //     it takes precedence.
  //
  // **`getAttrs`**`: ?(MarkdownToken) → Object`
  //   : A function used to compute the attributes for the node or mark
  //     that takes a [markdown-it
  //     token](https://markdown-it.github.io/markdown-it/#Token) and
  //     returns an attribute object.
  //
  // **`ignore`**`: ?bool`
  //   : When true, ignore content for the matched token.
  private tokens: Object;
  private schema: Schema;
  private tokenizer: any;
  private tokenHandlers: Object;
  constructor(schema: Schema, tokenizer: any, tokens: Object) {
    // :: Object The value of the `tokens` object used to construct
    // this parser. Can be useful to copy and modify to base other
    // parsers on.
    this.tokens = tokens
    this.schema = schema
    this.tokenizer = tokenizer
    this.tokenHandlers = tokenHandlers(schema, this.tokens)
  }

  // :: (string) → Node
  // Parse a string as [CommonMark](http://commonmark.org/) markup,
  // and create a ProseMirror document as prescribed by this parser's
  // rules.
  parse(text: string) {
      // console.log("parsing!");
    let state = new MarkdownParseState(this.schema, this.tokenHandlers), doc
    let tokens = this.tokenizer.parse(text, {});
    let newTokens = liftBlockMath(tokens);
    // console.log(tokens);
    state.parseTokens(newTokens);
    do { doc = state.closeNode() } while (state.stack.length)
    return doc
  }
}

function liftBlockMath(tokens: any[]) {
    let newTokens = [];
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (token.children) {
            // console.log("found children");
            let newChild;
            let foundDisplayMath = false;
            for (let child = 0; child < token.children.length; child++) {
                if (token.children[child].type === "html_inline") {
                  console.log("found html_inline");
                  parseHTMLToken(token.children[child]);
                }
                if (token.children[child].type === "display_math") {
                    // console.log("found the display math");
                    newChild = token.children[child];
                    newChild.block = true;
                    newTokens.pop();
                    newTokens.push(newChild);
                    i++;
                    foundDisplayMath = true;
                    break;
                }
            }
            if (!foundDisplayMath) {
                newTokens.push(token);

            }

        }
        else {
            newTokens.push(token);
        }
    }
    // console.log(newTokens);
    return newTokens;
}

function parseHTMLToken(token: any) {
  // console.log("parsing html!");
  let regex = RegExp(/<(.+)(?=\>)/);
  // console.log(regex.exec(token.content));
  let htmlTag = regex.exec(token.content)[1];
  // console.log(htmlTag);
  if (htmlTag.includes("/")) {
    token.type = htmlTag.slice(1) + "_close";
  }
  else {
    token.type = htmlTag + "_open";
  }
  // console.log(token);
  return token;
}

