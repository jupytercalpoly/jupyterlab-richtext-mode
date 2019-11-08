import { Transaction, EditorState,
Selection,
TextSelection,
NodeSelection,
// NodeSelection,

} from "prosemirror-state";
import { Mark, MarkType, 
    ResolvedPos,
    Node, Schema, NodeType, Fragment
 } from "prosemirror-model";
import { schema } from "./prosemirror-schema";
import { EditorView } from "prosemirror-view";
import { splitListItem, wrapInList, liftListItem, sinkListItem } from "prosemirror-schema-list";
import { chainCommands, setBlockType, 
    lift,
    wrapIn,
    splitBlockKeepMarks
 } from "prosemirror-commands"; 

 import {canSplit} from "prosemirror-transform";
import { undo, redo } from "prosemirror-history";
// import { parser } from "./markdown";

//  import { ReplaceAroundStep } from "prosemirror-transform";

/**
 * Obtains the marks for the currently active selection.
 * 
 * On a non-empty selection, obtains the marks for the most left node of the selection.
 * On an empty selection, obtains the marks for the closest previous non-empty node.
 * 
 * @param transaction - The state transaction generated upon interaction with the editor.
 * @returns - An array of marks.
 */
export function getMarksForSelection(state: EditorState): Mark[] {
    // let selection = transaction.selection;
    // let doc = transaction.doc;
    // console.log(selection.from);
    // if (!selection.empty) { // Non-empty selection
    //     return selection.$from.marks();
    // }

    // else if (selection.from != 1) { // Empty selection 
    //     return selection.$from.marks();
    // }
    if (state.storedMarks)
    {
        return state.storedMarks;
    }
    else 
    {
        if (!state.selection.empty) {
            return state.doc.resolve(state.selection.from + 1).marks();
        }

        return state.selection.$from.marks();
    }
}


export function getWrappingNodes(transaction: Transaction): string[] {
    let { $from } = transaction.selection;
    let nodeList: string[] = [];
    if (findNodeParentEquals($from, schema.nodes.bullet_list)) {
        nodeList.push("bullet_list");
    }
    else if (findNodeParentEquals($from, schema.nodes.ordered_list)) {
        nodeList.push("ordered_list");
    }

    if (findNodeParentEquals($from, schema.nodes.blockquote)) {
        nodeList.push("blockquote");
    }

    return nodeList;
}

// /**
//  * Obtains the marks for the closest previous non-empty node.
//  * 
//  * @param transaction - The state transaction generated upon interaction with the editor.
//  * @returns - An array of marks.
//  */

// function getMarksBefore(state: EditorState) {
//     let doc = state.doc;
//     let selection = state.selection;
//     // console.log(selection.from);
//     if (state.selection.from == 1) {
//         return null;
//     }
//     let from = doc.resolve(selection.from - 1);
//     let prev = 1;
//     // console.log(from.marksAcross(selection.$to));
//     while (!from.marksAcross(selection.$to)) {
//         if (from.pos === 0) {
//             return [];
//         }
//         prev++;
//         from = doc.resolve(selection.from - prev);
//     }

//     return from.marksAcross(selection.$to);

// };

/**
 * Toggles the given mark.
 */
export function toggleMark(markType: MarkType, attrs?: Object) {


    let mark = markType.create(attrs);
    // console.log(mark);
    function canAddMark(from: ResolvedPos, to: ResolvedPos, doc: Node) {

        if (from.marksAcross(to).includes(mark)) {
            for (let i = from.pos + 1; i < to.pos + 1; i++) {
                let pos = doc.resolve(i);
                if (pos.parent.type.isTextblock && 
                !pos.marks().includes(mark) &&
                pos.parent.textContent) {

                    return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }

        
    return (state: EditorState, dispatch: (tr: Transaction) => void) => {
        // If the selection is empty, toggle in storedMarks.
        // TODO: Check to see if marks are even allowed to be added!
        if (dispatch) {
            if (state.selection.empty) {
                let marks = getMarksForSelection(state);
                console.log(marks);
                console.log(state.storedMarks);
                if (marks && marks.includes(mark)) {
                    console.log(`removing stored mark ${mark}`);
                    dispatch(state.tr.removeStoredMark(mark));
                }
                else {
                    console.log(`adding stored mark ${mark}`);
                    dispatch(state.tr.addStoredMark(mark));
                }
            }
    
            else {
                let {ranges} = state.selection;
                for (let i = 0; i < ranges.length; i++) {
                    let {$from, $to} = ranges[i];
                    if (canAddMark($from, $to, state.doc)) {
                        console.log(`adding mark ${mark}`);
                        dispatch(state.tr.addMark($from.pos, $to.pos, mark).scrollIntoView());
                    }
                    else {
                        console.log(`removing mark ${mark}`);
                        dispatch(state.tr.removeMark($from.pos, $to.pos, mark).scrollIntoView());
                    }
                }
                // console.log(selection);
                // if (canAddMark($from, $to, state.doc)) {
                //     console.log(`adding mark ${mark}`);
                //     dispatch(state.tr.addMark(from, to, mark).scrollIntoView());
                // }
                // else {
                //     console.log(`removing mark ${mark}`);
                //     dispatch(state.tr.removeMark(from, to, mark).scrollIntoView());
                // }
            }
        }



        return true;
    }
}

function getSelectionText(selection: Selection, doc: Node) {
    let { $from, from, to } = selection;
    console.log($from.index($from.depth));
    console.log($from.node());
    if ($from.node().childCount - 1 < $from.index(1)) { // Interesting case where, at the end of a paragraph, the child is at an index that hasn't been created.
        return {text: "", link: ""}
    };
    let node = $from.node().child($from.index($from.depth));
    let markTypes = node.marks.map( (mark) => { return mark.type })
    if (markTypes.includes(schema.marks.link)) {
        return {text: node.textContent, link: node.marks.find((mark) => {
            return mark.type.name === "link";
        }).attrs.href};
    }
    else {
        return {text: doc.cut(from, to).textContent, link: ""};
    }

}

export function getTextForSelection(selection: Selection, view: EditorView) {
    let { $from } = selection;
    let doc = view.state.doc;
 

        let linkMenuFields = getSelectionText(selection, doc);
        if (linkMenuFields.text && linkMenuFields.link) {           
            let offset = $from.textOffset;
            let length = $from.node().child($from.index($from.depth)).nodeSize;
            console.log(offset);
            let newSelection = new TextSelection(doc.resolve($from.pos - offset), doc.resolve($from.pos + (length - offset)));

            view.dispatch(view.state.tr.setSelection(newSelection));
            console.log(view.state.selection);
            
        }
        return linkMenuFields;
    
 
        // let node = doc.cut(from, to);
        // let linkField: string;
        // let markTypes = node.marks.map( (mark) => { return mark.type })
        // if (markTypes.includes(schema.marks.link)) {
        //     linkField = node.marks.find((mark) => {
        //         return mark.type.name === "link";
        //     }).attrs.href;
        // }
        // else {
        //     linkField = "";
        // }
        // return {text: node.textContent, link: linkField};


}

export function getHeadingLevel(selection: Selection) {
    let { $from } = selection;
    if ($from.node().type.name === "heading") {
        return $from.node().attrs.level;
    }
    else if ($from.node().type.name === "paragraph") { // Paragraph is normal text.
        return 0;
    }
}

function createCodeBlock(state: EditorState, dispatch: (tr: Transaction) => void) {
    let {$head, $anchor, from} = state.selection;
    let marks = $head.marks().map(mark => mark.type.name);
    if (!(marks.includes("md_code_block") || !($head.sameParent($anchor) || !($head.node().type.name === "paragraph")))) return false;
    
    let language: string;
    let tr = state.tr;
    let offset = $head.parentOffset;
    console.log(offset);
    if ($head.node().textBetween(offset - 1, offset) === "`") {
        language = "";
        console.log("no language!");
    }
    else {
        let child: Node;
        let newPos = state.doc.resolve(from - 1);
        child = newPos.node().child(newPos.index(newPos.depth));
        language = child.textContent.slice(3);
    }

    tr = tr.setSelection(TextSelection.create(tr.doc, from - 3 - language.length, from));
    tr = tr.deleteSelection();
    if (!tr.selection.$from.node().textContent) {
        tr = tr.setBlockType(tr.selection.from, tr.selection.to, schema.nodes.code_block, {params: language});
    }
    else {
        tr = tr.insert(tr.selection.from, schema.nodes.code_block.create({params: language}));
        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from - 2, tr.selection.from - 2));
    }
    dispatch(tr);
    // return ;
    // if ($head.node().textBetween(offset - 1, offset) === "`") { //  Case where no language is given


    //     return ;
    // }
    return true;

}
export function newlineInMath(state: EditorState, dispatch: (tr: Transaction) => void) {
    let {$head, $anchor} = state.selection;
    let marks = $head.marks().map(mark => mark.type.name);
    if (!(marks.includes("math")) || !($head.sameParent($anchor)) || !($head.node().type.name === "paragraph")) return false;
 
    if (dispatch) dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
    return true;
}

export function renderMath(state: EditorState, dispatch: (tr: Transaction) => void) {
    // console.log("render math!");
    let {$head, $anchor} = state.selection;
    let marks = $head.marks().map(mark => mark.type.name);
    let parent = $head.parent;
    if (!(marks.includes("math")) || !($head.sameParent($anchor)) || !($head.node().type.name === "paragraph")) return false;
    let childIndex = $head.index($head.depth);

    let textNode;
    let currentIndex;
    if ($head.node().childCount - 1 < childIndex) {
        
        currentIndex = childIndex - 1;
    }
    else {
        currentIndex = childIndex;
    }

    textNode = parent.child(currentIndex);
    if (!textNode.marks.includes(schema.marks.math.create())) {
        currentIndex = childIndex - 1;
    }
    textNode = parent.child(currentIndex);
    console.log("rendering");
    console.log(textNode);
    let tr = state.tr;
    let fromPos = tr.selection.from;
    let mathText = "";
    for (let i = currentIndex; i >= 0; i--) {
        let child = parent.child(i);
        if (child.marks.includes(schema.marks.math.create())) {
            fromPos -= child.nodeSize;
            if (child.type.name !== "hard_break") {
                mathText = child.text + mathText;
            }
        }
        else {
            break;
        }
    }
    let offset = $head.parentOffset;

    if (!(mathText[0] === "$" && mathText[mathText.length - 1] === "$" && mathText.length > 1
    && $head.node().textBetween(offset - 1, offset) === "$")) {
        return false;
    }
    if (mathText.slice(0, 2) == "$$") {
        if (!(mathText.length > 2 && $head.node().textBetween(offset - 1, offset) == "$"))  
        {
            return false;
        }
    }
    tr = tr.setSelection(TextSelection.create(tr.doc, fromPos, tr.selection.from))
            .removeMark(tr.selection.from, tr.selection.to, schema.marks.math);

    if (mathText.slice(0, 2) === "$$") {
        tr = tr.replaceSelectionWith(schema.nodes.block_math.create({texts: mathText}));
        if (!tr.selection.$head.nodeAfter) {
            tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
            tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 2));
        }
    }
    else {
        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: mathText}));
        
    }
    if (dispatch) dispatch(tr);
    return true;
}

export function toggleBulletList(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView<any>) {
    let selection = view.state.selection;

    if (findNodeParentEquals(selection.$from, schema.nodes.bullet_list)) {
        liftListItem(schema.nodes.list_item)(view.state, view.dispatch);
    }
    else if (findNodeParentEquals(selection.$from, schema.nodes.ordered_list)) {
        liftListItem(schema.nodes.list_item)(view.state, view.dispatch);
        wrapInList(schema.nodes.bullet_list)(view.state, view.dispatch);
    }
    else {
        wrapInList(schema.nodes.bullet_list)(view.state, view.dispatch);
    }
    return true;
}

export function toggleOrderedList(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView<any>) {
    let selection = view.state.selection;

    if (findNodeParentEquals(selection.$from, schema.nodes.ordered_list)) {
        liftListItem(schema.nodes.list_item)(view.state, view.dispatch);
    }
    else if (findNodeParentEquals(selection.$from, schema.nodes.bullet_list)) {
        liftListItem(schema.nodes.list_item)(view.state, view.dispatch);
        wrapInList(schema.nodes.ordered_list)(view.state, view.dispatch);
    }
    else {
        wrapInList(schema.nodes.ordered_list)(view.state, view.dispatch);
    }
    return true;
}

export function toggleBlockquote(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView<any>) {
    let selection = view.state.selection;
    console.log("toggling blockquote!");
    if (findNodeParentEquals(selection.$from, schema.nodes.blockquote)) {
        lift(view.state, view.dispatch);
    }
    else {
        wrapIn(schema.nodes.blockquote)(view.state, view.dispatch);
    }
    return true;
}

// :: (EditorState, ?(tr: Transaction)) → bool
// Split the parent block of the selection. If the selection is a text
// selection, also delete its content.
export function splitBlock(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView<any>) {
    let {$from, $to} = state.selection
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) return false
      if (dispatch) dispatch(state.tr.split($from.pos).scrollIntoView())
      return true
    }
  
    if (!$from.parent.isBlock) return false
  
    if (dispatch) {
      let atEnd = $to.parentOffset == $to.parent.content.size
      let tr = state.tr
      if (state.selection instanceof TextSelection) tr.deleteSelection()
      let deflt = $from.depth == 0 ? null : $from.node(-1).contentMatchAt($from.indexAfter(-1)).defaultType
      let types = atEnd && deflt ? [{type: deflt}] : null
      let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types)
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt && [{type: deflt}])) {
        types = [{type: deflt}]
        can = true
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types)
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt &&
            // @ts-ignore
            $from.node(-1).canReplace($from.index(-1), $from.indexAfter(-1), Fragment.from(deflt.create(), $from.parent)))
          tr.setNodeMarkup(tr.mapping.map($from.before()), deflt)
      }
      dispatch(tr.scrollIntoView())
    }
    return true
  }

export function undoit(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView<any>) {
    console.log("trying to undo!");
    if (undo(state, dispatch)) {
        console.log("did it");
        return true;
    }
}
export function buildKeymap(schema: Schema) {


    let keys: KeyObject = {};
    
    keys["Mod-b"] = toggleMark(schema.marks.strong);
    keys["Mod-B"] = toggleMark(schema.marks.strong);
    keys["Mod-i"] = toggleMark(schema.marks.em);
    keys["Mod-I"] = toggleMark(schema.marks.em);
    keys["Mod-U"] = toggleMark(schema.marks.underline);
    keys["Mod-u"] = toggleMark(schema.marks.underline);
    keys["Mod-X"] = toggleMark(schema.marks.strikethrough);
    keys["Mod-Shift-8"] = toggleBulletList;
    keys["Mod-Shift-9"] = toggleOrderedList;
    keys["Enter"] = chainCommands(renderMath, newlineInMath, createCodeBlock, splitListItem(schema.nodes.list_item), splitBlockKeepMarks);
    keys["ArrowLeft"] = arrowHandler("left");
    keys["ArrowRight"] = arrowHandler("right");
    keys["ArrowUp"] = arrowHandler("up");
    keys["ArrowDown"] = arrowHandler("down");
    keys["Tab"] = sinkListItem(schema.nodes.list_item);
    keys["Shift-Tab"] = liftListItem(schema.nodes.list_item);
    keys["Mod-Alt-0"] = setBlockType(schema.nodes.paragraph);
    keys["Mod-Alt-1"] = setBlockType(schema.nodes.heading, {level: 1});
    keys["Mod-Alt-2"] = setBlockType(schema.nodes.heading, {level: 2});
    keys["Mod-Alt-3"] = setBlockType(schema.nodes.heading, {level: 3});
    keys["Mod-Alt-4"] = setBlockType(schema.nodes.heading, {level: 4});
    keys["Mod-Alt-5"] = setBlockType(schema.nodes.heading, {level: 5});
    keys["Mod-Alt-6"] = setBlockType(schema.nodes.heading, {level: 6});
    keys["Mod-<"] = toggleMark(schema.marks.code);
    keys["Mod-'"] = toggleBlockquote;
    keys["Mod-Alt-z"] = undoit;
    keys["Mod-Z"] = undo;
    keys["Mod-y"] = redo;
    keys["Mod-Y"] = redo;
    return keys;
}
function arrowHandler(dir: any) {
    return (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
        console.log(`arrow key ${dir} pressed!`);
      if (state.selection.empty && view.endOfTextblock(dir)) {
          console.log("this is at the end of a textblock");
        let side = dir == "left" || dir == "up" ? -1 : 1, $head = state.selection.$head
        let nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
        if (nextPos.$head && nextPos.$head.parent.type.name == "code_block") {
          dispatch(state.tr.setSelection(nextPos))
          return true
        }
      }
      console.log(`arrow ${dir} not handled`);
      view.focus();
      return false
    }
  }

export function findNodeParentEquals(pos: ResolvedPos, node: NodeType) {
    let depth = pos.depth;
    // console.log(depth);
    for (let i = depth; i >= 1; i--) {
        // console.log(pos.node(depth));
        if (pos.node(i).type === node) {
            console.log("foundit");
            return true;
        }
    }
    // console.log("couldntfindit:(");
    return false;
}


interface KeyObject {
    [key: string]: (state: EditorState, dispatch: (tr: Transaction) => void, view?: EditorView) => boolean;
}


