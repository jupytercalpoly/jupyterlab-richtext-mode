import CodeMirror from "codemirror"
import {exitCode, selectNodeForward} from "prosemirror-commands"
import {undo, redo} from "prosemirror-history"
import { EditorView, Decoration} from "prosemirror-view";
import { Node,
  //  ResolvedPos 
  } from "prosemirror-model";
import { TextSelection,
   Selection
   } from "prosemirror-state";
import "../../node_modules/codemirror/mode/javascript/javascript";
import "../../node_modules/codemirror/mode/python/python";
import { MathJaxTypesetter } from "@jupyterlab/mathjax2";
import { PageConfig } from "@jupyterlab/coreutils";
import { schema } from "./prosemirror-schema";
// import { EditorState, Transaction } from "prosemirror-state";
import "../../node_modules/codemirror/addon/display/autorefresh";
import "../../node_modules/codemirror/addon/selection/mark-selection";
// import { parser } from "./markdown";
export class CodeBlockView {

  private node: Node;
  private view: EditorView;
  private getPos: () => number;
  private incomingChanges: boolean;
  private cm: CodeMirror.Editor;
  public dom: HTMLElement;
  private updating: boolean;
  private doc: CodeMirror.Doc;
  constructor(node: Node, view: EditorView, getPos: () => number) {
      console.log("code blockc reated!");
    // Store for later
    this.node = node
    this.view = view
    this.getPos = getPos
    this.incomingChanges = false
    console.log(this.view);
    console.log(this.getPos);
    console.log(this.incomingChanges);
    // Create a CodeMirror instance
    this.cm = CodeMirror(null, {
      value: this.node.textContent,
      theme: "jupyter",
      mode: node.attrs.params,
      //@ts-ignore
      styleSelectedText: true,
      //@ts-ignore
      autoRefresh: true,
      extraKeys: this.codeMirrorKeymap(),
      
    })
    this.doc = this.cm.getDoc();

    // The editor's outer node is our DOM representation
    this.dom = this.cm.getWrapperElement();
    console.log(this.dom);
    // CodeMirror needs to be in the DOM to properly initialize, so
    // schedule it to update itself
    setTimeout(() => this.cm.refresh());
  
    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false
    // Track whether changes are have been made but not yet propagated
    this.cm.on("beforeChange", () => {this.incomingChanges = true});
    // Propagate updates from the code editor to ProseMirror
    this.cm.on("cursorActivity", () => {
        console.log(this.doc.getSelection());
      if (!this.updating && !this.incomingChanges) this.forwardSelection()
    })
    this.cm.on("changes", () => {
      if (!this.updating) {
        this.valueChanged()
        this.forwardSelection()
      }
      this.incomingChanges = false
    })
    this.cm.on("focus", () => this.forwardSelection())
    this.cm.on("blur", () => this.doc.setCursor({line: 0, ch: 0}));
  }

  forwardSelection() {
    if (!this.cm.hasFocus()) return
    let state = this.view.state
    let selection = this.asProseMirrorSelection(state.doc)
    if (!selection.eq(state.selection))
      this.view.dispatch(state.tr.setSelection(selection))
  }

  asProseMirrorSelection(doc: Node) {
    let offset = this.getPos() + 1
    let anchor = this.doc.indexFromPos(this.doc.getCursor("anchor")) + offset
    let head = this.doc.indexFromPos(this.doc.getCursor("head")) + offset
    console.log(TextSelection.create(doc, anchor, head));
    return TextSelection.create(doc, anchor, head)
  }

  setSelection(anchor: number, head: number) {
    this.cm.focus()
    this.updating = true
    this.doc.setSelection(this.doc.posFromIndex(anchor),
                         this.doc.posFromIndex(head))
    this.updating = false
  }

  valueChanged() {
    let change = computeChange(this.node.textContent, this.cm.getValue())
    if (change) {
      let start = this.getPos() + 1
      let tr = this.view.state.tr.replaceWith(
        start + change.from, start + change.to,
        change.text ? this.view.state.schema.text(change.text) : null)
      this.view.dispatch(tr)
    }
  }

  codeMirrorKeymap() {
    let view = this.view

    let mod = /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl"
    //@ts-ignore
    return CodeMirror.normalizeKeyMap({
      Up: () => this.maybeEscape("line", -1),
      Left: () => this.maybeEscape("char", -1),
      Down: () => this.maybeEscape("line", 1),
      Right: () => this.maybeEscape("char", 1),
      Backspace: () => this.maybeDestroy(),
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch),
      "Ctrl-Enter": () => {
        if (exitCode(view.state, view.dispatch)) view.focus()
      }
    })
  }

  maybeDestroy() {
    console.log("maybe destroy?");
    if (this.doc.getValue() === "") {
      let tr = this.view.state.tr;
      tr = tr.delete(tr.selection.from - 2, tr.selection.to);
      this.view.dispatch(tr);
      this.view.focus();
      return null;
    }
    else {
      console.log("pass");
      return CodeMirror.Pass;
    }
  }

  maybeEscape(unit: string, dir: number) {
    let pos = this.doc.getCursor()
    console.log(pos);
    console.log(this.getPos());
    if (!this.doc.somethingSelected()) {
      // If at the end of the code block and pressing right, then make sure to set the selection to the end and not leave the block.
      if (unit === "char") {
        return CodeMirror.Pass;
      } 
      else {
        if (dir === 1) {
          if (pos.line === this.doc.lastLine() && pos.ch === this.doc.getLine(pos.line).length) {
            this.escapeCodeBlock(dir);
            return null;
          }
          else {
            return CodeMirror.Pass;
          }
        }
        else {
          if (pos.line === this.doc.firstLine() && pos.ch === 0) {
            this.escapeCodeBlock(dir);
            return null;
          }
          else {
            return CodeMirror.Pass;
          }
        }

      }

      // If at the end of the code block and pressing down/up, create an empty paragraph below/above the code block.
      // else if (pos.line != (dir < 0 ? this.doc.firstLine() : this.doc.lastLine()) ||
      // (unit == "char" &&
      //  pos.ch != (dir < 0 ? 0 : this.doc.getLine(pos.line).length))) {
      //   return CodeMirror.Pass;
      // }
    } 
    else {
      return CodeMirror.Pass;
    }

  //   if (this.doc.somethingSelected() ||
  //   pos.line != (dir < 0 ? this.doc.firstLine() : this.doc.lastLine()) ||
  //   (unit == "char" &&
  //    pos.ch != (dir < 0 ? 0 : this.doc.getLine(pos.line).length)))
  //     return CodeMirror.Pass

  // }
  }

  escapeCodeBlock(dir: number) {

      this.view.focus()
      console.log(this.getPos());
      let targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
      let selectedPos = this.view.state.doc.resolve(targetPos);
      let hasNode = (dir < 0 ? (selectedPos.nodeBefore !== null) : (selectedPos.nodeAfter !== null));
      console.log(hasNode);
      // console.log(selection);
      // console.log(selection.$from.node());
      let tr = this.view.state.tr;
      let selection;
      if (!hasNode) {
        tr = tr.insert(targetPos, schema.nodes.paragraph.create());
        selection = Selection.near(tr.doc.resolve(targetPos), dir)

        
        // this.view
        // this.view.dispatch(this.view.state.tr.setSelection(selection).insert(selection.from, schema.nodes.paragraph.create()).scrollIntoView())

      }
      else {
        selection = Selection.near(tr.doc.resolve(targetPos), dir);
        console.log(selection);

      }
      this.view.dispatch(tr.setSelection(selection).scrollIntoView());

      this.view.focus()

  }

  update(node: Node) {
    if (node.type != this.node.type) return false
    this.node = node
    let change = computeChange(this.cm.getValue(), node.textContent)
    if (change) {
      this.updating = true
      this.doc.replaceRange(change.text, this.doc.posFromIndex(change.from),
                           this.doc.posFromIndex(change.to))
      this.updating = false
    }
    return true
  }

  selectNode() { this.cm.focus() }
  stopEvent() { return true }

}

// function findCutBefore($pos: ResolvedPos) {
//   console.log($pos);
//   console.log($pos.parent);
//   if (!$pos.parent.type.spec.isolating) for (let i = $pos.depth - 1; i >= 0; i--) {
//     if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1))
//     if ($pos.node(i).type.spec.isolating) break
//   }
//   return null
// }

// function findCutAfter($pos: ResolvedPos) {
//   if (!$pos.parent.type.spec.isolating) for (let i = $pos.depth - 1; i >= 0; i--) {
//     let parent = $pos.node(i)
//     if ($pos.index(i) + 1 < parent.childCount) return $pos.doc.resolve($pos.after(i + 1))
//     if (parent.type.spec.isolating) break
//   }
//   return null
// }

function computeChange(oldVal: string, newVal: string) {
    if (oldVal == newVal) return null
    let start = 0, oldEnd = oldVal.length, newEnd = newVal.length
    while (start < oldEnd && oldVal.charCodeAt(start) == newVal.charCodeAt(start)) ++start
    while (oldEnd > start && newEnd > start &&
           oldVal.charCodeAt(oldEnd - 1) == newVal.charCodeAt(newEnd - 1)) { oldEnd--; newEnd-- }
    return {from: start, to: oldEnd, text: newVal.slice(start, newEnd)}
  }

export class InlineMathView {
  private node: Node;
  private view: EditorView;
  private getPos: () => number;
  public dom: HTMLElement;
  public contentDOM: HTMLElement;
  // private innerView: EditorView;
  private typesetter: MathJaxTypesetter = new MathJaxTypesetter({
    url: PageConfig.getOption('fullMathjaxUrl'),
    config: PageConfig.getOption('mathjaxConfig')});

  constructor(node: Node, view: EditorView, getPos: () => number) {
      this.node = node;
      this.view = view;
      this.getPos = getPos;
      this.dom = document.createElement("span");
      this.dom.appendChild(document.createTextNode(this.node.attrs.texts));
      this.dom.addEventListener("dblclick", e => {
        let tr = this.view.state.tr;
        this.view.dispatch(tr.deleteSelection()
                              .insert(tr.selection.from, schema.text(this.node.attrs.texts, [schema.marks.math.create()]))
                              .removeStoredMark(schema.marks.math)
                              .scrollIntoView());
      })
      console.log(`made inline_math for ${this.node.attrs.texts}`);
      // console.log(this.view);
      // console.log(this.getPos());eq
 
      // console.log(this.node.attrs.texts);

      // this.innerView.focus();
      // this.selectNode();
      this.typesetter.typeset(this.dom);

  }
  update(node: Node, decorations: Decoration[]) {
    console.log(this.getPos);
    return false;
  }
}



  export class BlockMathView {
    private node: Node;
    private view: EditorView;
    private getPos: () => number;
    public dom: HTMLElement;
    public contentDOM: HTMLElement;
    // private innerView: EditorView;
    private typesetter: MathJaxTypesetter = new MathJaxTypesetter({
      url: PageConfig.getOption('fullMathjaxUrl'),
      config: PageConfig.getOption('mathjaxConfig')});
  
    constructor(node: Node, view: EditorView, getPos: () => number) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.dom = document.createElement("div");
        this.dom.style.cssText = "margin-top: 5px;";
        this.dom.appendChild(document.createTextNode(this.node.attrs.texts));
        this.dom.addEventListener("dblclick", e => {
          console.log("dblclicked!");
          let tr = this.view.state.tr;
          
          // this.view.dispatch(tr.deleteSelection());
          // createParagraphNear(this.view.state, this.view.dispatch);    
          // tr = this.view.state.tr; 
          // this.view.dispatch(tr.insert(tr.selection.from, schema.text(this.node.attrs.texts, [schema.marks.math.create()]))
          // .scrollIntoView());    
          let nodeAfter = tr.selection.$head.nodeAfter;
          if (nodeAfter) {
            if (nodeAfter.type.name === "paragraph") {
              selectNodeForward(this.view.state, this.view.dispatch);
              let tr = this.view.state.tr;
              this.view.dispatch(tr.deleteSelection().insert(tr.selection.from, schema.text(this.node.attrs.texts, [schema.marks.math.create()]))
                                  .scrollIntoView());
            }
            else {
              this.view.dispatch(tr.replaceSelectionWith(schema.nodes.paragraph.create(null, schema.text(this.node.attrs.texts, [schema.marks.math.create()])))
              .scrollIntoView());              
            }
          }
          else {
            this.view.dispatch(tr.replaceSelectionWith(schema.nodes.paragraph.create(null, schema.text(this.node.attrs.texts, [schema.marks.math.create()])))
                                .scrollIntoView());
          }

        })
        // console.log(this.view);
        // console.log(this.getPos());
   
        // console.log(this.node.attrs.texts);
  
        // this.innerView.focus();
        // this.selectNode();
        this.typesetter.typeset(this.dom);
  
    }

    update(node: Node, decorations: Decoration[]) {
      console.log(this.getPos);
      return false;
    }

  }
  

  // dispatchInner(transaction: Transaction) {
  //   console.log(transaction.selection);
  //   console.log(transaction.selection.$from.node());
  //   this.innerView.updateState(this.innerView.state.apply(transaction));
  // }

  // update(node: Node, decorations: Decoration[]): boolean {
  //   console.log(node);
  //   return true;
  // }

  // selectNode() {
  //   if (!this.innerView) {
  //     this.innerView = new EditorView(this.dom, {
  //       state: EditorState.create({
  //         schema: mathSchema
  //       }),
  //       dispatchTransaction: this.dispatchInner.bind(this),
  //       handleDOMEvents: {
  //         mousedown: (view: EditorView, event: Event): boolean => {
  //           if (this.view.hasFocus()) this.innerView.focus()
  //           return true;
  //         }
  //       }
  //     })
  //     this.innerView.dispatch(this.innerView.state.tr.insertText("$"));
  //   }

  // }
  // deselectNode() {
  //   this.innerView.destroy();
  //   this.innerView = null;
  //   this.dom.textContent = "";
  //   this.view.focus();
  // }
  // setSelection(anchor: number, head: number, root: Document) {
  //   console.log(anchor, head);

  // }
  // ignoreMutation() {
  //     return true;
  // }

  // stopEvent(event: Event) {
  //     return true;
  // }

export class ImageView {

  private node: Node;
  // private view: EditorView;
  // private getPos: () => number;
  public dom: HTMLElement;
  
  constructor(node: Node, 
    // view: EditorView, 
    // getPos: () => number
    ) {
    this.node = node;
    // this.view = view;
    // this.getPos = getPos;
    this.dom = document.createElement("img");
    this.dom.setAttribute("src", node.attrs.src);
    this.dom.addEventListener("click", e => {
      console.log("You clicked me!");
      e.preventDefault();
    })
    console.log(this.node);
    // console.log(this.view);
    // console.log(this.getPos);
  }

  update(node: Node, decorations: Decoration[]): boolean {
    console.log("updated!!");
    console.log(decorations);
    console.log(node);
    if (node === this.node) {
      console.log("issa same node!");
      return true;
    }
    return false;
  }

  stopEvent() { return true }
  ignoreMutations() { return true }
}

