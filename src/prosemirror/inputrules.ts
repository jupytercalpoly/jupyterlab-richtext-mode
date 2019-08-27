import { InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, TextSelection } from "prosemirror-state";
import { schema } from "./prosemirror-schema";



export function createInputRules(): InputRule[] {
    let inputRules = [];
    inputRules.push(new InputRule(/\$\$.+\$\$/, blockMathFinish));
    inputRules.push(new InputRule(/((?!\$).|^)(\$[^\$]+\$)(?!.)/, inlineMathFinish));
    // inputRules.push(new InputRule(/\${2}(?!.)/, blockMathRule));
    inputRules.push(new InputRule(/((?!\$).|^)\$(?!.)/, inlineMathRule));
    return inputRules;
}

// export function createMathInputRules(): InputRule[] {
//     let inputRules = [];
//     inputRules.push(new InputRule(/.+\$/, inlineMathTypeset));
// }
// function inlineMathTypeset(state: EditorState, match: string[], start: number, end: number): Transaction {
//     let tr = 
// }
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
    tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: match[0]}));
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
    if (!tr.selection.$head.nodeAfter) {
        tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 1));
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

