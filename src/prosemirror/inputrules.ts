import { InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, TextSelection } from "prosemirror-state";
import { schema } from "./prosemirror-schema";



export function createInputRules(): InputRule[] {
    let inputRules = [];
    inputRules.push(new InputRule(/\$\$.+\$\$/, blockMathFinish));
    inputRules.push(new InputRule(/((?!\$).|^)(\$[^\$]+\$)(?!.)/, inlineMathFinish));
    // inputRules.push(new InputRule(/\${2}(?!.)/, blockMathRule));
    inputRules.push(new InputRule(/((?!\$).|^)\$(?!.)/, inlineMathRule));
    inputRules.push(new InputRule(/(\*\*\*)|(\-\-\-)|(\_\_\_)/, horizontalRule));
    return inputRules;
}

// export function createMathInputRules(): InputRule[] {
//     let inputRules = [];
//     inputRules.push(new InputRule(/.+\$/, inlineMathTypeset));
// }
// function inlineMathTypeset(state: EditorState, match: string[], start: number, end: number): Transaction {
//     let tr = 
// }
function horizontalRule(state: EditorState, match: string[], start: number, end: number): Transaction {
    let tr = state.tr;
    tr = tr.setSelection(TextSelection.create(tr.doc, start, end));
    tr = tr.replaceSelectionWith(schema.nodes.horizontal_rule.create());
    console.log(tr.selection.$from.depth);
    if (tr.selection.$head.depth === 0 && tr.selection.$head.index(tr.selection.$head.depth) === tr.selection.$head.node(tr.selection.$head.depth).childCount) {
        console.log("This is the last child!");
        tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 2));
    }
    // if (!tr.selection.$head.nodeAfter) {
    //     console.log("no node after!");
    //     tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
    //     tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 1));
    // }
    return tr;
}
function inlineMathRule(state: EditorState, match: string[], start: number, end: number): Transaction {



    // let tr = getSelectionReplace();
    // console.log(match[0]);
    let tr = state.tr;
    // console.log(tr.selection);
    tr = tr.insertText("$");
    tr = tr.addMark(tr.selection.from - 1, tr.selection.from, schema.marks.math.create());

    // tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: match[0]}));
    // console.log(tr.selection);
    // console.log("found the inline math!");
    return tr; 
}

export function inlineMathFinish(state: EditorState, match: string[], start: number, end: number): Transaction {

    function getSelectionReplace(state: EditorState, match: string[]): Transaction {
        // let { $from } = state.selection;
        let tr: Transaction;
        // let inline_math = match[0];
        // let toIndex: number;
        let selection: TextSelection;

        // let selectionContent: string; 
        tr = state.tr;

        // console.log(selectionContent);
        // console.log(inline_math);
        // console.log(match);
        // toIndex = $from.pos - inline_math.length + 1;
        // console.log(tr.selection.from);
        // console.log(start, end);
        // if (selectionContent.charAt(selectionContent.length - 1) !== '$') {
        //     selection = TextSelection.create(tr.doc, start - 1, end - 1);
        // }
        // else {
            selection = TextSelection.create(tr.doc, start, end);
        // }
        tr = tr.setSelection(selection);
        return tr;
        }

    let tr = getSelectionReplace(state, match);
    tr = tr.removeMark(tr.selection.from, tr.selection.to, schema.marks.math);
    // console.log(match[0]);
    // console.log(match[0].charAt(0));

    // console.log(match[0].slice(1).charCodeAt(0));
    if (match[0][0] !== "$") { /* Fix when possible. */
        // console.log("not regular");
        if (!(match[0].charCodeAt(0) === 65532)) {
            // console.log("isn't obj");
            // console.log(tr.selection);
            tr = tr.replaceSelectionWith(schema.text(match[0][0]));

        }
        else {
            tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 1, tr.selection.to + 1));
        }
        console.log(tr.selection);
        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: match[0].slice(1)}));
    }
    else {
        console.log("regular");
        console.log(tr.selection);
        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: match[0]}));
    }
    console.log(match);
    tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from));
    // console.log(tr.selection);
    // tr = tr.insertText("s", tr.selection.from);
    // console.log(tr.selection);
    console.log("finished inline math");
    return tr;
}

function blockMathFinish(state: EditorState, match: string[], start: number, end: number): Transaction {

    function getSelectionReplace(state: EditorState, match: string[]): Transaction {
        let tr: Transaction;
        // let inline_math = match[0];

        let selection: TextSelection;
       
        // console.log(inline_math);
        tr = state.tr;
        selection = TextSelection.create(tr.doc, start, end);
        tr = tr.setSelection(selection);
        return tr;
        }

    let tr = getSelectionReplace(state, match);
    // console.log(match[0]);
    tr = tr.removeMark(tr.selection.from, tr.selection.to, schema.marks.math);
    tr = tr.deleteSelection();
    tr = tr.replaceSelectionWith(schema.nodes.block_math.create({texts: match[0]}));
    if (tr.selection.$head.depth === 0 && tr.selection.$head.index(tr.selection.$head.depth) === tr.selection.$head.node(tr.selection.$head.depth).childCount) {
        tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 2));
    }
    console.log("finished block math");
    return tr;
}

// function blockMathRule(state: EditorState, match: string[], start: number, end: number): Transaction {
//     let tr = state.tr;
//     tr = tr.insertText("$");
//     tr = tr.addMark(tr.selection.from - 2, tr.selection.from, schema.marks.block_math.create());
//     tr = tr.removeMark(tr.selection.from - 2, tr.selection.from - 1, schema.marks.block_math);
//     console.log("found block math!");
//     return tr;
// }

