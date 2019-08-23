import React from 'react';

export default class HeadingMenuItem extends React.Component<{level: number, activeLevel: number, handleClick: (e: React.SyntheticEvent) => void}, {}> {

    constructor(props: any) {
        super(props);
        this.getLevelText = this.getLevelText.bind(this);
    }

    getLevelText() {
        switch (this.props.level) {
            case 0:
                return "Normal";
            case 1:
                return "Title";
            case 2:
                return "Subtitle";
            case 3: 
                return "Heading 1";
            case 4: 
                return "Heading 2";
            case 5:
                return "Heading 3";
            case 6:
                return "Caption";
        }
    }
    render() {
        if (this.props.activeLevel === this.props.level) {
            return (
                <div className="jp-scribe-heading-menu-active">
                    <p 
                    id={`heading${this.props.level}`} 
                    className={`jp-scribe-menu-heading${this.props.level}`} 
                    style={{padding: "10px 6px", borderBottom: "1px solid #E0E0E0"}}
                    ><i className="material-icons check-icon" style={{fontSize: "14px"}}>check</i>{this.getLevelText()}</p>
                    
                </div>
            )
        }
        else {
            return (
                <div className="jp-scribe-heading-menu">
                    <p 
                    id={`heading${this.props.level}`} 
                    className={`jp-scribe-menu-heading${this.props.level}`} 
                    style={{padding: "10px 25px", borderBottom: "1px solid #E0E0E0"}}
                    onClick={this.props.handleClick}>{this.getLevelText()}</p>
                    
                </div>
            )
        }

    }
}