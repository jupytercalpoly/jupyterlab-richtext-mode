import React from 'react';

export default class ExperimentalMenuItem extends React.Component<{handleClick: (e: React.SyntheticEvent) => void, featureName: string, hasMenu: boolean, commandName: string}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        return (
        <div className="jp-scribe-heading-menu">
            <p 
            id={this.props.commandName}
            style={{padding: "10px 25px", borderBottom: "1px solid #E0E0E0"}}
            onClick={this.props.handleClick}>{this.props.featureName}</p>
        </div>
        );
    }
}