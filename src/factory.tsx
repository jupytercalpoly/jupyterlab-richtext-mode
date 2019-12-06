import { NotebookPanel, 
    StaticNotebook
} from "@jupyterlab/notebook";
import { Cell, 
    MarkdownCell
 } from "@jupyterlab/cells";
 import { CodeEditor } from "@jupyterlab/codeeditor";
 import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
// import { ProsemirrorMarkdownCell } from "./widget";

 export default class ContentFactoryEditor extends NotebookPanel.ContentFactory {
    constructor(options?: Cell.ContentFactory.IOptions | undefined) {
        super(options);
        
    }

    /**
     * Create a markdown cell with a ProseMirror editor instead of CodeMirror. 
     * @param options 
     * @param parent 
     */
    createMarkdownCell(
        options: MarkdownCell.IOptions,
        parent: StaticNotebook
      ): MarkdownCell {
        let model = options.model;
        let proseMirrorEditor = (options: CodeEditor.IOptions) => {
            return new ProseMirrorEditor(options, model);
          }
          
        let newContentFactory = new ContentFactoryEditor({editorFactory: proseMirrorEditor})
        options.contentFactory = newContentFactory;
        
        return new MarkdownCell(options).initializeState();
      }

  }
  