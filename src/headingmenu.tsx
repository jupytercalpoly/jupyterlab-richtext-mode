// import { Menu, MenuBar } from "@phosphor/widgets";
// import { CommandRegistry } from "@phosphor/commands";
import React from 'react';
import HeadingMenuItem from "./headingmenuitem";
import MenuHeader from "./menuheader";

// import { EditorView } from "prosemirror-view";
// import { EditorView } from "prosemirror-view";
// import { setBlockType } from "prosemirror-commands";
// import { schema } from "./prosemirror/prosemirror-schema";


// export function createHeadingMenu(commands: CommandRegistry) {
//     let bar = new MenuBar();
//     let menu = new Menu({commands});
//     menu.title.iconClass = "material-icons";
//     menu.title.iconLabel = "format_size";
//     // menu.title.label = "ayyy";


//     menu.addItem({command: 'heading-normal'});
//     menu.addItem({command: 'heading-1'});
//     menu.addItem({command: 'heading-2'});
//     menu.addItem({command: 'heading-3'});
//     menu.addItem({command: 'heading-4'});
//     menu.addItem({command: 'heading-5'});
//     menu.addItem({command: 'heading-6'});
//     bar.addMenu(menu);
//     return bar;
// }

export class HeadingMenu extends React.Component<{handleClick: (e: React.SyntheticEvent) => void, activeLevel: number}, {}> {
    
    constructor(props: any) {
        super(props);
    }



    render() {
        const headingLevels = [0, 1, 2, 3, 4, 5, 6];
        return (
            <div className="editor-menu">
                <MenuHeader name="text styles" /> 
                {
                    headingLevels.map( (level: number) => {
                        return <HeadingMenuItem level={level} activeLevel={this.props.activeLevel} handleClick={this.props.handleClick} key={level} />
                    })
                }
            </div>
        )
    }
}

