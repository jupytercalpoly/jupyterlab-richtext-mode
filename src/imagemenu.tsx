import React from 'react';
import MenuHeader from "./menuheader";

export class ImageMenu extends React.Component<{handleImgUpload: (fileUrl: unknown, e: React.SyntheticEvent) => void
                                                handleSubmitImgLink: (url: string) => void}, {isLinkOption: boolean, imageUrl: string}> {
    

    constructor(props: any) {
        super(props);
        this.state = {
            isLinkOption: false,
            imageUrl: ""
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.handleLinkChange = this.handleLinkChange.bind(this);
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
                    <MenuHeader name="image" />
                    <span className="linkToImage" onClick={this.handleLinkClick}>Link to image</span>
                    <form>
                        <span style={{cursor: "pointer"}} onClick={() => document.getElementById('file1').click()}>Upload image</span>
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
                    <form onSubmit={(e) => {e.preventDefault(); this.props.handleSubmitImgLink(this.state.imageUrl)}}>
                        <input type="text" value={this.state.imageUrl} onChange={this.handleLinkChange} style={{display: "block"}}/>
                        <button type="submit" style={{backgroundColor: "#2196F3", color: "white", width: "25%"}}>APPLY</button> 
                    </form>
                </div>
             );
        }

        
    }
}