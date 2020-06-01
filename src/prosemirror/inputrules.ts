import { InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, TextSelection } from "prosemirror-state";
import { schema } from "./prosemirror-schema";



export function createInputRules(): InputRule[] {
    let inputRules = [];

    // inputRules.push(new InputRule(/\${2}(?!.)/, blockMathRule));
    inputRules.push(new InputRule(/(\*\*\*)|(\-\-\-)|(\_\_\_)/, horizontalRule));
    inputRules.push(new InputRule(/\`\`\`(?!.)/, codeBlockRule));
    return inputRules;
}

export function createMathInputRules(): InputRule[] {
    let inputRules = [];
    inputRules.push(new InputRule(/\$\$.+\$\$/, blockMathFinish));
    inputRules.push(new InputRule(/((?!\$).|^)(\$[^\$]+\$)(?!.)/, inlineMathFinish));
    inputRules.push(new InputRule(/((?!\$).|^)\$(?!.)/, inlineMathRule));
    return inputRules;
}


function codeBlockRule(state: EditorState, match: string[], start: number, end: number): Transaction {
    let tr = state.tr;
    tr = tr.insertText("`");
    tr = tr.addMark(start, end + 1, schema.marks.md_code_block.create());
    console.log("making code block!!");
    return tr;
}

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

    let tr = state.tr;
    tr = tr.insertText("$");
    tr = tr.addMark(tr.selection.from - 1, tr.selection.from, schema.marks.math.create());

    return tr; 
}

export function inlineMathFinish(state: EditorState, match: string[], start: number, end: number): Transaction {

    function getSelectionReplace(state: EditorState, match: string[]): Transaction {
        let tr: Transaction;

        let selection: TextSelection;

        tr = state.tr;
        selection = TextSelection.create(tr.doc, start, end);
        tr = tr.setSelection(selection);

        return tr;
        }

    let tr = getSelectionReplace(state, match);
    tr = tr.removeMark(tr.selection.from, tr.selection.to, schema.marks.math);

    let newMatch = match[0].replace(/\ufffc/ug, " ");
    for (let i = 0; i < newMatch.length; i++) {
        console.log(newMatch[i]);
        console.log(newMatch.charCodeAt(i));
    }
    if (match[0][0] !== "$") { /* Fix when possible. */


        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 1, tr.selection.to + 1));
        
        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: newMatch.slice(1)}));
    }
    else {

        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: newMatch}));
    }
    tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from));

    return tr;
}

function blockMathFinish(state: EditorState, match: string[], start: number, end: number): Transaction {

    function getSelectionReplace(state: EditorState, match: string[]): Transaction {
        let tr: Transaction;

        let selection: TextSelection;
       
        tr = state.tr;
        selection = TextSelection.create(tr.doc, start, end);
        tr = tr.setSelection(selection);
        return tr;
        }

    let newMatch = match[0].replace(/\ufffc/ug, " ");
    let tr = getSelectionReplace(state, match);
    tr = tr.removeMark(tr.selection.from, tr.selection.to, schema.marks.math);
    tr = tr.deleteSelection();
    tr = tr.replaceSelectionWith(schema.nodes.block_math.create({texts: newMatch}));
    if (tr.selection.$head.depth === 0 && tr.selection.$head.index(tr.selection.$head.depth) === tr.selection.$head.node(tr.selection.$head.depth).childCount) {
        tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 2));
    }
    return tr;
}


