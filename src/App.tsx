import * as React from 'react';

import './App.css';
import Graph from './Graph';

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

  constructor(props: any)
  {
    super(props);

    this.state =
    {
      graphRoot: true,
      fullscreen: false
    };
  }

  public render()
  {
    return (
      <div id="container">
        <div id="buttons">
          <div id="undo-button" className="app-button history"
            onClick={this.handleUndo}>
            <svg  width={28} height={27}>
              <path className="icon"
              d="M 14.813566,0 C 11.650793,0 8.725229,1.130139 6.453352,3.001886
              L 3.003434,0.264584 0,14.321608 13.773836,8.810832
              10.514603,6.224426 c 1.245571,-0.776451 2.710122,-1.224213
              4.298963,-1.224213 4.534096,0 8.156091,3.621989 8.156091,8.15609
              -3e-6,4.534091 -3.622,8.156091 -8.156091,8.156091 -2.579198,0
              -4.846333,-1.180018 -6.343798,-3.030821 a 2.50025,2.50025 0 1 0
              -3.886586,3.14451 c 2.409642,2.978216 6.114052,4.886523
              10.230384,4.886523 7.236291,0 13.156298,-5.920012
              13.156303,-13.156303 C 27.969869,5.920005 22.049859,0
              14.813566,0 Z"/>
            </svg>
          </div>
          <div id="redo-button" className="app-button history"
            onClick={this.handleRedo}>
            <svg  width={28} height={27}>
              <path className="icon"
              d="M 13.156303,0 C 5.9200068,0 -2.1166661e-6,5.9200042 0,13.156302
              c 4.7625005e-6,7.23629 5.9200107,13.156302 13.156303,13.156302
              4.11633,0 7.822806,-1.908307 10.232451,-4.886523
              a 2.5004918,2.5004918 0 1 0 -3.888652,-3.14451
              c -1.497468,1.850806 -3.764603,3.030823 -6.343799,3.030823
              -4.5340927,0 -8.1560887,-3.622002 -8.1560916,-8.156092
              -1.1e-6,-4.5340998 3.6219936,-8.1560908 8.1560916,-8.1560908
              1.589255,0 3.054213,0.447905 4.299995,1.224732
              L 14.197066,8.8113482 27.970385,14.321606 24.967467,0.2645833
              21.517033,3.0024002 C 19.245078,1.1303782 16.319336,0 13.156303,0
              Z"/>
            </svg>
          </div>
          {this.state.fullscreen ?
            <div id="windowed-button" className="app-button window"
              onClick={this.setWindowed}>
                <svg width={27} height={27}>
                  <path className="icon" transform="scale(0.26458333)"
                   d="M 85.318359 0 L 70.376953 14.943359 L 57.964844 2.5996094
                   L 58.230469 43.033203 L 98.576172 42.988281 L 86.164062
                   30.644531 L 101.06445 15.746094 L 85.318359 0 z M 42.833984
                   57.119141 L 2.4882812 57.164062 L 14.900391 69.505859 L 0
                   84.40625 L 15.746094 100.15039 L 30.6875 85.208984 L
                   43.099609 97.550781 L 42.833984 57.119141 z "/>
                </svg>
              </div>
            :
            <div id="fullscreen-button" className="app-button window"
              onClick={this.setFullScreen}>
                <svg  width={27} height={27}>
                  <path className="icon" transform="scale(0.26458333)"
                   d="M 100.79688 0 L 60.451172 0.044921875 L 72.863281 12.388672
                   L 57.964844 27.287109 L 73.708984 43.033203 L 88.652344
                   28.089844 L 101.06445 40.433594 L 100.79688 0 z M 27.355469
                   57.119141 L 12.412109 72.0625 L 0 59.71875 L 0.26757812
                   100.15039 L 40.613281 100.10742 L 28.201172 87.763672 L
                   43.099609 72.863281 L 27.355469 57.119141 z "/>
                </svg>
              </div>
          }
          {!this.state.graphRoot &&
            <div id="back-button" className="app-button back"
              onClick={this.handleBack}>
              <svg  width={20} height={20}>
                <path className="icon"
                 d="M 11.496094 0 L 0 11.496094 L 26.277344 37.773438 L 0
                 64.052734 L 11.496094 75.548828 L 37.773438 49.269531 L
                 64.052734 75.548828 L 75.548828 64.052734 L 49.269531 37.773438
                 L 75.548828 11.496094 L 64.052734 0 L 37.773438 26.277344 L
                 11.496094 0 z "
                 transform="scale(0.26458333)" />
              </svg>
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
}
