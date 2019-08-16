import { InputRule } from "prosemirror-inputrules";
import { EditorState, Transaction, TextSelection } from "prosemirror-state";
import { schema } from "./prosemirror-schema";



export function createInputRules(): InputRule[] {
    let inputRules = [];
    inputRules.push(new InputRule(/\$.+\$/, inlineMathRule));
    inputRules.push(new InputRule(/\$\$.+\$\$/s, blockMathRule));
    return inputRules;
}

function inlineMathRule(state: EditorState, match: string[], start: number, end: number): Transaction {

    function getSelectionReplace(): Transaction {
        let { $from } = state.selection;
        let tr: Transaction;
        let inline_math = match[0];
        let toIndex: number;
        let selection: TextSelection;
       
        // console.log(inline_math);
        toIndex = $from.pos - inline_math.length + 1;
        selection = TextSelection.create(state.doc, toIndex, $from.pos);
        tr = state.tr.setSelection(selection);
        return tr;
        }

    let tr = getSelectionReplace();
    console.log(match[0]);
    
    tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: match[0]}));
    
    console.log("found the inline math!");
    return tr;
}

function blockMathRule(state: EditorState, match: string[], start: number, end: number): Transaction {
    console.log(match);
    return null;
}
