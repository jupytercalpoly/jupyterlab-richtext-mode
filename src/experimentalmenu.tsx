import React from 'react';
import MenuHeader from './menuheader';
import ExperimentalMenuItem from "./experimentalmenuitem";

export default class ExperimentalMenu extends React.Component<{handleClick: (e: React.SyntheticEvent) => void, features: string[]}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        let experimentalCommands = [
            "strikethrough", 
            "lists", 
            "blockquote", 
            "code",
            "link",
            "image",
            "math"
        ]
        let hasMenu = [
            "List",
            "Code",
            "Link",
            "Image",
            "Math"
        ]
        return (
            <div className="editor-menu">
                <MenuHeader name="experimental" />
                {
                    this.props.features.map((feature: string, idx: number) => {
                        return <ExperimentalMenuItem 
                        commandName={experimentalCommands[idx]}
                        handleClick={this.props.handleClick}
                        featureName={feature} 
                        hasMenu={hasMenu.includes(feature)} />
                    })
                }
            </div>
        )
    }
}