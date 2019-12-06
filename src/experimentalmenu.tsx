import React from 'react';
import MenuHeader from './menuheader';
import ExperimentalMenuItem from "./experimentalmenuitem";

export default class ExperimentalMenu extends React.Component<{handleClick: (e: React.SyntheticEvent) => void, features: string[]}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        let experimentalNames = [
            "Strikethrough", 
            "List", 
            "Block Quote", 
            "Code",
            "Link",
            "Image",
            "Math"
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
                        commandName={feature}
                        handleClick={this.props.handleClick}
                        featureName={experimentalNames[idx]} 
                        hasMenu={hasMenu.includes(experimentalNames[idx])}
                        key={feature} />
                    })
                }
            </div>
        )
    }
}