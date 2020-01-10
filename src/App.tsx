import * as React from 'react';

import './App.css';
import Graph from './Graph';

const reqSvgs = require.context('!@svgr/webpack!./icons/app', false, /\.svg$/)

interface IProps
{

}

interface IState
{
  graphRoot: boolean,
  fullscreen: boolean
}

export default class App extends React.Component<IProps, IState>
{
  private graph = React.createRef<Graph>();
  private iconMap: {[key: string]: any};

  constructor(props: any)
  {
    super(props);

    this.state =
    {
      graphRoot: true,
      fullscreen: false
    };

    // Make icon paths into simple names
    this.iconMap = {};
    reqSvgs.keys().forEach((path: string) =>
    {
      const key = path.substring(path.lastIndexOf('/') + 1,
        path.lastIndexOf('.'));
      this.iconMap[key] = reqSvgs(path).default
    });
  }

  private createIcon(name: string)
  {
    const Icon = this.iconMap[name];
    return < Icon />
  }

  public render()
  {
    return (
      <div id="container">
        <div id="buttons">
          <div id="undo-button" className="app-button"
            onClick={this.handleUndo}>
            { this.createIcon("undo") }
          </div>
          <div id="redo-button" className="app-button"
            onClick={this.handleRedo}>
            { this.createIcon("redo") }
          </div>
          {this.state.fullscreen ?
           <div id="windowed-button" className="app-button"
                onClick={this.setWindowed}>
             { this.createIcon("window") }
           </div>
           :
           <div id="fullscreen-button" className="app-button"
                onClick={this.setFullScreen}>
             { this.createIcon("fullscreen") }
           </div>
          }
          <div id="theme-button" className="app-button"
               onClick={this.handleTheme}>
             { this.createIcon("theme") }
          </div>
          <div id="save-button" className="app-button"
            onClick={this.handleSave}>
             { this.createIcon("save") }
          </div>
          <div id="load-button" className="app-button">
            <input id="fileLoadInput" className="fileLoadInput" type="file"
              onChange={this.handleLoad} multiple={false} accept=".json"/>
            <label htmlFor="fileLoadInput" >
             { this.createIcon("load") }
            </label>
          </div>
          {!this.state.graphRoot &&
            <div id="back-button" className="app-button back"
              onClick={this.handleBack}>
              { this.createIcon("back") }
            </div>
          }
         </div>
        <Graph ref={this.graph} notifyGraphRoot={this.notifyGraphRoot} />
      </div>
    );
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
}
