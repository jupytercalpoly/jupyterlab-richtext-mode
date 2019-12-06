import React from 'react';
import MenuHeader from "./menuheader";

export class ImageMenu extends React.Component<{handleImgUpload: (fileUrl: unknown, e: React.SyntheticEvent) => void,
                                                handleSubmitImgLink: (url: string) => void,
                                                cancel: (e: React.SyntheticEvent) => void,
                                                returnToExperimental: (e: React.SyntheticEvent) => void}, {isLinkOption: boolean, imageUrl: string}> {
    

    constructor(props: any) {
        super(props);
        this.state = {
            isLinkOption: false,
            imageUrl: ""
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e: React.SyntheticEvent) {
        let target = (e.target as HTMLInputElement);
        // this.setState({imageUrl: target.value});
        // console.log(this.state.imageUrl);
        // console.log(target.files[0]);
        this.uploadFile(target.files[0]).then( url => {
            this.props.handleImgUpload(url, e);
        });

    }

    handleLinkClick(e: React.SyntheticEvent) {
        this.setState({isLinkOption: true});
    }

    handleLinkChange(e: React.SyntheticEvent) {
        let target = (e.target as HTMLInputElement);
        this.setState({imageUrl: target.value});
    }

    handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault(); 
        if (this.state.imageUrl) {
            this.props.handleSubmitImgLink(this.state.imageUrl);
        }
    }

    uploadFile(file: File) {
        let reader = new FileReader();
        return new Promise((accept, fail) => {
          reader.onload = () => accept(reader.result)
          reader.onerror = () => fail(reader.error)
          reader.readAsDataURL(file);
        })
      }

    render() {
        if (!this.state.isLinkOption) {
            return (
                <div className="editor-menu">  
                    <MenuHeader 
                    name="image"
                    canClick={true}
                    handleClick={this.props.returnToExperimental} 
                    />
                    <p 
                    className="submenu-item jp-scribe-heading-menu"
                    onClick={this.handleLinkClick}>Link to image</p>
                    <form 
                    onClick={() => document.getElementById('file1').click()}
                    className="submenu-item jp-scribe-heading-menu">
                        <span>Upload image</span>
                        <input type="file" id="file1" style={{display: "none"}} onChange={this.handleChange} />
                    </form>

                </div>
            );
        }
        else {
             return (
                <div className="editor-menu">
                    <MenuHeader 
                    name="link to image" 
                    canClick={true}
                    handleClick={() => this.setState({isLinkOption: false})}
                    />
                    <form onSubmit={this.handleSubmit} className="jp-scribe-menu-content">
                        <label className="editor-menuLabel">
                            Link
                            <input 
                            type="text" 
                            style={{marginLeft: "3px"}}
                            value={this.state.imageUrl} 
                            onChange={this.handleLinkChange} 
                            />
                        </label>
                        <div className="linkButtons">
                            <button className="jp-scribe-menu-cancel jp-mod-styled" type="button" onClick={this.props.cancel}>CANCEL</button>
                            <button type="submit" className="jp-scribe-menu-apply jp-mod-styled">APPLY</button> 
                        </div>   
                    </form>
                </div>
             );
        }

        
    }
}