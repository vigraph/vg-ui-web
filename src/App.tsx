import * as React from 'react';

import './App.css';
import Graph from './Graph';

import { vgIcons } from './icons/Icons';
import { vgConfig } from './lib/Config';
import { vgUtils } from './lib/Utils';

interface IProps
{

}

interface IState
{
  graphRoot: boolean,
  fullscreen: boolean,
  buttonLabel: {name: string, x: number, y: number} | null
}

export default class App extends React.Component<IProps, IState>
{
  private graph = React.createRef<Graph>();

  constructor(props: any)
  {
    super(props);

    this.state =
    {
      graphRoot: true,
      fullscreen: false,
      buttonLabel: null
    };
  }

  public render()
  {
    return (
      <div id="container">
        <div id="buttons">
          {this.createButton("undo", this.handleUndo)}
          {this.createButton("redo", this.handleRedo)}
          {this.createButton("clear", this.handleClear)}
          {this.state.fullscreen ?
           this.createButton("window", this.setWindowed)
           :
          this.createButton("fullscreen", this.setFullScreen)
          }
          {this.createButton("theme", this.handleTheme)}
          {this.createSaveButton()}
          <div id="load-button" className="app-button"
            onPointerEnter={this.handleButtonEnter}
            onPointerLeave={this.handleButtonLeave}>
            <input id="fileLoadInput" className="fileLoadInput" type="file"
              onChange={this.handleLoad} multiple={false} accept=".json"/>
            <label htmlFor="fileLoadInput" >
             { this.createIcon("load") }
            </label>
          </div>
          {!this.state.graphRoot && this.createButton("back", this.handleBack)}
          {this.createLabel()}
         </div>
        <Graph ref={this.graph} notifyGraphRoot={this.notifyGraphRoot}/>
      </div>
    );
  }

  private createIcon(name: string)
  {
    const Icon = vgIcons.App[name];
    return <Icon />
  }

  private createButton(name: string, onClick: () => void, className?: string)
  {
    return <div id={name+"-button"} className={`app-button ${name} `+
      `${className!==undefined?className:""}`}
      onClick={onClick}
      onPointerEnter={this.handleButtonEnter}
      onPointerLeave={this.handleButtonLeave}>
      { this.createIcon(name) }
    </div>
  }

  private createLabel()
  {
    if (this.state.buttonLabel)
    {
      const label = this.state.buttonLabel;
      const fontSize = vgConfig.Graph.fontSize.appButtonLabel;
      const size = vgUtils.textBoundingSize(label.name, fontSize);
      return <div id="app-button-label" className="button-label label"
        style={{left: label.x, top: label.y, width: size.width,
          height: size.height, fontSize: fontSize}}>{label.name}</div>
    }
    else
    {
      return "";
    }
  }

  private createSaveButton()
  {
    return this.createButton("save", this.handleSave);
  }

  private notifyGraphRoot = (graphRoot: boolean) =>
  {
    if (this.state.graphRoot !== graphRoot)
    {
      this.setState({graphRoot});
    }
  }

  private handleUndo = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.undo();
    }
  }

  private handleRedo = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.redo();
    }
  }

  private handleClear = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.clear();
    }
  }

  private setFullScreen = () =>
  {
    const req = { "fullscreen": true };
    (window as any).external.invoke(JSON.stringify(req));
    this.setState({fullscreen: true});
  }

  private setWindowed = () =>
  {
    const req = { "fullscreen": false };
    (window as any).external.invoke(JSON.stringify(req));
    this.setState({fullscreen: false});
  }

  private handleBack = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.goBack();
    }
  }

  private handleSave = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.save();
    }
  }

  private handleLoad = (event: React.ChangeEvent<HTMLInputElement>) =>
  {
    if (this.graph.current)
    {
      this.graph.current.load(event.currentTarget.id);
    }
  }

  private handleTheme = () =>
  {
    var root = document.documentElement;
    if (root.hasAttribute("class"))
      root.removeAttribute("class");
    else
      root.setAttribute("class", "theme-light");
  }

  private handleButtonEnter = (e: React.PointerEvent<HTMLElement>) =>
  {
    const targetButton = e.currentTarget;
    const id = targetButton.id.split("-")[0];
    const name = vgConfig.Strings.appButtons[id];

    if (name)
    {
      this.setState({buttonLabel: {name, x: targetButton.offsetLeft,
        y: targetButton.offsetTop}});
    }
  }

  private handleButtonLeave = (e: React.PointerEvent<HTMLElement>) =>
  {
    this.setState({buttonLabel: null});
  }
}
