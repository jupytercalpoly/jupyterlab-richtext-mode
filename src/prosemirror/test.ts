import { Schema } from "prosemirror-model";

export const schema = new Schema({
    nodes: {
        doc: {
            content: "paragraph+"
        },
        paragraph: {
            content: "text*",
            parseDOM: [{tag: "p"}],
            toDOM() { return ["p", 0] }
        },
        text: {
            group: "inline",
            toDOM(node) { return node.text }
        }
    },

    marks: {
        em: {
            parseDOM: [{tag: "i"}, {tag: "em"}],
            toDOM() { return ["em"] }
        },
        strong: {
            parseDOM: [{tag: "b"}, {tag: "strong"}],
            toDOM() { return ["strong"] }
        }
    }
})