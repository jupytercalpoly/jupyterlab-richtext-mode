import React from 'react';
import MenuHeader from "./menuheader";
export class CodeMenu extends React.Component<{handleInlineCode: (e: React.SyntheticEvent) => void,
                                                handleBlockCode: (e: React.SyntheticEvent, language: string) => void,
                                                cancel: (e: React.SyntheticEvent) => void}, {isBlockOption: boolean, blockLanguage: string}> {
    constructor(props: any) {
        super(props);

        this.state = {
            isBlockOption: false,
            blockLanguage: ""
        }
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
    }

    handleLanguageChange(e: React.SyntheticEvent) {
        let target = (e.target as HTMLInputElement);
        this.setState({blockLanguage: target.value});
    }

    render() {
        if (!this.state.isBlockOption) {
            return (
                <div className="editor-menu">  
                    <MenuHeader name="code" />
                    <div className="jp-scribe-menu-content">
                        <p className="linkToImage" onClick={this.props.handleInlineCode}>Inline code</p>
                        <p className="linkToImage" onClick={() => {this.setState({isBlockOption: true})}}>Code block</p>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="editor-menu">
                    <MenuHeader 
                    name="select language" 
                    canClick={true}
                    handleClick={() => this.setState({isBlockOption: false})}
                    />
                    <form onSubmit={(e) => { e.preventDefault(); this.props.handleBlockCode(e, this.state.blockLanguage)}} className="jp-scribe-menu-content">
                        <input type="text" value={this.state.blockLanguage} onChange={this.handleLanguageChange} style={{display: "block"}}/>
                        <div className="linkButtons">
                            <button className="jp-scribe-menu-cancel jp-mod-styled" type="button" onClick={this.props.cancel}>CANCEL</button>
                            <button type="submit" className="jp-scribe-menu-apply jp-mod-styled">APPLY</button> 
                        </div>   
                    </form>
                </div>
            )
        }

}
}