import React from 'react';
import ReactDOM from "react-dom";
import MenuHeader from "./menuheader";
import { Widget } from "@phosphor/widgets";
import { CodeLanguageMenuItem } from "./languagemenuitem";
import { HoverBox } from "@jupyterlab/apputils";
import FuzzySet  from "fuzzyset";
import modes from "./modes";
export class CodeMenu extends React.Component<{handleInlineCode: (e: React.SyntheticEvent) => void,
                                                handleBlockCode: (e: React.SyntheticEvent, language: string) => void
                                                returnToExperimental: (e: React.SyntheticEvent) => void,
                                                cancel: (e: React.SyntheticEvent) => void,
                                                languageWidget: Widget
                                            },
                                                 {isBlockOption: boolean, blockLanguage: string, fuzzySet: FuzzySet}> {
    constructor(props: any) {
        super(props);

        this.state = {
            isBlockOption: false,
            blockLanguage: "",
            fuzzySet: FuzzySet(modes)
        }
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleLanguageSelect = this.handleLanguageSelect.bind(this);
    }

    componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
        if (this.state.isBlockOption === true && (this.state.isBlockOption !== prevState.isBlockOption)) {
            let input = (document.querySelector("#languageInput") as HTMLInputElement);
            console.log(input);
            let rect = input.getBoundingClientRect();
            let style = window.getComputedStyle(this.props.languageWidget.node);
            HoverBox.setGeometry({
                anchor: rect,
                host: input,
                minHeight: 50,
                maxHeight: 500,
                node: this.props.languageWidget.node,
                privilege: "below",
                style
            })
        }

    }
    handleLanguageChange(e: React.SyntheticEvent) {

        let target = (e.target as HTMLInputElement);
        let languageWidget = this.props.languageWidget;
        console.log(modes);
        let fuzzyResult = this.state.fuzzySet.get(target.value);
        let resultModes = fuzzyResult.map(result => result[1]);
        ReactDOM.render(<CodeLanguageMenu languages={[...resultModes, "None"]} handleSelect={this.handleLanguageSelect} />, languageWidget.node);
        if (!languageWidget.isAttached) {
            Widget.attach(languageWidget, document.body);
        }
        this.setState({blockLanguage: target.value});
    }

    handleLanguageSelect(e: React.SyntheticEvent, language: string) {
        Widget.detach(this.props.languageWidget);
        this.setState({blockLanguage: language});
        let input = (document.querySelector("#languageInput") as HTMLInputElement);
        input.focus();
    }
    render() {
        if (!this.state.isBlockOption) {
            return (
                <div className="editor-menu">  
                    <MenuHeader 
                    name="code"
                    canClick={true}
                    handleClick={this.props.returnToExperimental} />
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
                    name="code block" 
                    canClick={true}
                    handleClick={() => this.setState({isBlockOption: false})}
                    />
                    <form onSubmit={(e) => { e.preventDefault(); this.props.handleBlockCode(e, this.state.blockLanguage)}} className="jp-scribe-menu-content">
                        <label className="editor-menuLabel" style={{display: "block"}}>
                            Language
                            <input type="text" id="languageInput" value={this.state.blockLanguage} onChange={this.handleLanguageChange} autoComplete="off" />
                        </label>
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

class CodeLanguageMenu extends React.Component<{languages: string[], handleSelect: (e: React.SyntheticEvent, language: string) => void}, {}> {

    constructor(props: any) {
        super(props);
        this.handleLanguageSelect = this.handleLanguageSelect.bind(this);
    }

    handleLanguageSelect(e: React.SyntheticEvent, language: string) {
        this.props.handleSelect(e, language);
    }
    render() {
        return (
            <div className="editor-menu-lifted">
                {this.props.languages.map(language => <CodeLanguageMenuItem name={language} handleSelect={this.handleLanguageSelect} />)}
            </div>
            )
    }
}

