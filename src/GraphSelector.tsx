import * as React from 'react';
import * as Model from './model';

import * as vgTypes from './lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  showGraph: (nodes: any[]) => void;
}

interface IState
{
  // Current Value is the index of the currently selected Graph in
  // property.available
  currentValue: number;
  selecting: boolean;
  showSelector: boolean;
}

export default class GraphSelector extends React.Component<IProps, IState>
{
  // Reset state from graph selector when not selecting - allows movement not by
  // selecting (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.selecting ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.IGraphSelectorSettings;

  private pickerRef: SVGSVGElement | null;

  private lastMouseTime: {up: number, down: number};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;
    this.pickerRef = null;
    this.lastMouseTime = {up: 0, down: 0};

    const gSelectorSettings = require('./json/ControlSettings.json').graphSelector;

    this.settings = gSelectorSettings[this.property.subType] ?
      gSelectorSettings[this.property.subType] : gSelectorSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      selecting: false,
      showSelector: false
    };
  }

  public render()
  {
     const settings = this.settings;
     const available = this.props.property.available;
     let currentSelection;

     if (this.state.currentValue < 0)
     {
       currentSelection = "none";
     }
     else
     {
       currentSelection = available[this.state.currentValue].id;
     }

    return(
        <svg id="graph-selector-wrapper" className={this.property.subType}
          ref={(ref) => { this.pickerRef = ref; }}>

          <svg id="selection-display" className="display"
            x={5} y={0}
            onMouseDown={this.togglePickerShow}>
            <rect className="selection-display-border"
              x={0} y={0} width={settings.width}
              height={settings.height}/>
            <text className="selection-display-text label"
              x={settings.width / 2}
              y={settings.height / 2}>
              {currentSelection}
            </text>
          </svg>

          {
            this.state.showSelector && this.createSelector()
          }
        </svg>
    );
  }

  private togglePickerShow = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    const show = !this.state.showSelector;
    this.setState({showSelector: show});
  }

  // Layout graph selections in a grid starting top left and moving right,
  // starting a new row when 'settings.columns' number of items created
  private createSelector = () =>
  {
    const numAvailable = this.property.available.length;
    const settings = this.settings;
    let currentRow = 0;
    let currentCol = -1;

    return <svg id="graph-selector" x={5} y={settings.height + 10}>

      <rect className="selector-border"
        x={0} y={0}
        width={(5*2) + (settings.columns * settings.width) +
          (settings.padding * (settings.columns -1))}
        height={(5*2) + (Math.ceil(numAvailable /
          settings.columns) * settings.height) +
          ((Math.ceil(numAvailable / settings.columns)
          - 1) * settings.padding)}/>

      {
        this.props.property.available.map((value: any, index: number) =>
        {
          if (currentCol + 1 > settings.columns - 1)
          {
            currentCol = 0;
            currentRow++;
          }
          else
          {
            currentCol++;
          }

          return <svg id={`${value.id}`}
            className={"graph-selector-item"}
            key={index}
            x={5 + (currentCol * (settings.width + settings.padding))}
            y={5 + (currentRow * (settings.height + settings.padding))}
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
            onMouseLeave={this.handleMouseLeave}>
            <rect className={`selector-item-border ${this.state.currentValue ===
              index ? "selected" : ""}`}
              x={0} y={0} width={settings.width} height={settings.height}/>
            <text className="selector-item-text label"
              x={settings.width / 2} y={settings.height / 2}>{value.id}</text>
            </svg>
        })
      }

    </svg>
  }

  private handleMouseLeave = (e: React.MouseEvent<SVGElement>) =>
  {
    this.lastMouseTime = {up: 0, down: 0};
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    const date = new Date();
    this.lastMouseTime.down = date.getTime();
  }

  private handleMouseUp = (e: React.MouseEvent<SVGElement>) =>
  {
    const date = new Date();

    const graph = this.property.available.find(
      x => x.id === e.currentTarget.id);

    // Long press - select Graph without showing
    if (this.lastMouseTime.down && date.getTime() -
      this.lastMouseTime.down > 1000)
    {
      this.selectGraph(graph);
    }
    // Double click - show graph without selecting
    else if (date.getTime() - this.lastMouseTime.up < 250)
    {
      this.showGraph(graph);
    }

    this.lastMouseTime.up = date.getTime();
  }

  private showGraph = (graph: any) =>
  {
    this.props.showGraph(graph.elements);
  }

  private selectGraph = (graph: any) =>
  {
    const index = this.property.available.indexOf(graph);

    this.setState({selecting: true});
    this.props.startUpdate();

    // Deselect if current selection is selected again
    if (index === this.state.currentValue)
    {
      this.setState({currentValue: -1});
      this.props.update(-1);
    }
    else
    {
      this.setState({currentValue: index});
      this.props.update(index);
    }

    this.setState({selecting: false});
    this.props.endUpdate();
  }
}
