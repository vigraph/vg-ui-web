import * as React from 'react';
import * as Model from './model';

import * as vgTypes from './lib/Types';

import { vgData } from './data/Data';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: any) => void;
  updateGraphs: (value: any) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  showGraph: (id: string) => void;
  parentPath: string;
  disabled: boolean;
}

interface IState
{
  // Current Value is the index of the currently selected Graph in
  // property.available
  currentValue: number;
  selecting: boolean;
  showSelector: boolean;
  currentChoice: number;
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
      showSelector: false,
      currentChoice: -1
    };
  }

  public render()
  {
     const settings = this.settings;
     const available = this.props.property.available;
     let currentDisplay;

     if (this.state.currentValue < 0)
     {
       currentDisplay = "none";
     }
     else
     {
       currentDisplay = available[this.state.currentValue].id;
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
              y={(settings.height / 2) + 4}>
              {currentDisplay}
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

    if (!show)
    {
      this.setState({currentChoice: -1});
    }

    this.setState({showSelector: show});
  }

  // Layout graph selections in a grid starting top left and moving down,
  // starting a new column when 'settings.rows' number of items created
  private createSelector = () =>
  {
    const numAvailable = this.property.available.length;
    const settings = this.settings;
    let currentColumn = 0;
    let currentRow = -1;

    const calcBorderW = (5*2) + (Math.ceil(numAvailable / settings.rows) *
      settings.width) + ((Math.ceil(numAvailable / settings.rows) - 1) *
      settings.padding);
    const nRows = numAvailable <= settings.rows ? numAvailable : settings.rows;
    const calcBorderH = (5*2) + 20 + (nRows * settings.height) +
      (settings.padding * (nRows - 1));

    const borderWidth = numAvailable === 0 || calcBorderW < 90 ?
      90 : calcBorderW;
    const borderHeight = numAvailable === 0 ? 24 : calcBorderH;

    return <svg id="graph-selector" x={5} y={settings.height + 10}>

      <rect className="selector-border"
        x={0} y={0}
        width={borderWidth}
        height={borderHeight}/>

      <svg id="graph-selector-icons">

        <svg id="graph-selector-add" className="graph-selector-icon"
          x={2} y={2} width={20} height={20}
          onMouseDown={this.handleAdd}>
          <rect className="add-icon horz" x={0} y={8} width={20} height={4}/>
          <rect className="add-icon vert" x={8} y={0} width={4} height={20}/>
        </svg>

        <svg id="graph-selector-delete" className="graph-selector-icon"
          x={24} y={2} width={20} height={20}
          onMouseDown={this.handleDelete}>
          <rect className="delete-icon horz" x={0} y={8} width={20} height={4}
            transform="rotate(45 10 10)"/>
          <rect className="delete-icon vert" x={8} y={0} width={4} height={20}
            transform="rotate(45 10 10)"/>
        </svg>

        <svg id="graph-selector-up" className="graph-selector-icon"
          x={46} y={2} width={20} height={20}
          onMouseDown={this.handleUp}>
          <rect className="up-icon vert" x={8} y={5} width={4} height={15}/>
          <path className="up-icon arrow" d={`M 0,10 10,0 20,10 z`}/>
        </svg>

        <svg id="graph-selector-down" className="graph-selector-icon"
          x={68} y={2} width={20} height={20}
          onMouseDown={this.handleDown}>
          <rect className="down-icon vert" x={8} y={0} width={4} height={15}/>
          <path className="down-icon arrow" d={`M 0,10 10,20 20,10 z`}/>
        </svg>

      </svg>

      {
        this.props.property.available.map((value: {id: string, path: string},
          index: number) =>
        {
          if (currentRow + 1 > settings.rows - 1)
          {
            currentRow = 0;
            currentColumn++;
          }
          else
          {
            currentRow++;
          }

          let itemClass = "";

          if (this.state.currentChoice === index)
          {
            itemClass = "choice";
          }
          else if (this.state.currentValue === index)
          {
            itemClass = "selected";
          }

          return <svg id={`${value.id}`}
            className={"graph-selector-item " + itemClass}
            key={index}
            x={5 + (currentColumn * (settings.width + settings.padding))}
            y={25 + (currentRow * (settings.height + settings.padding))}
            onMouseDown={this.handleMouseDown}
            onMouseUp={this.handleMouseUp}
            onMouseLeave={this.handleMouseLeave}>
            <rect className={`selector-item-border ${this.state.currentValue ===
              index ? "selected" : ""}`}
              x={0} y={0} width={settings.width} height={settings.height}/>
            <text className="selector-item-text label"
              x={settings.width / 2} y={(settings.height / 2) + 4}>
              {value.id}
            </text>
          </svg>
        })
      }

    </svg>
  }

  // Add a new empty graph to the selector
  private handleAdd = () =>
  {
    let idCount = this.property.available.length;

    let flag = false;

    const findGraph = (graphID: string) =>
      { return this.property.available.find(x => x.id === graphID); };

    while (!flag)
    {
      if (findGraph("graph-"+idCount))
      {
        idCount++;
      }
      else
      {
        flag = true;
      }
    }

    vgData.addEmptyGraph("graph-"+idCount, this.props.parentPath,
      (newGraph: vgTypes.IProcessedGraphItem) =>
      {
        this.props.startUpdate();
        const newAvailable: Array<{id: string, path: string}> =
          [...this.property.available];
        newAvailable.push({id: newGraph.id, path: newGraph.path});
        this.property.available = newAvailable;
        this.props.endUpdate();
      })

  }

  // Delete current graph 'choice' (highlighted)
  private handleDelete = () =>
  {
    if (this.state.currentChoice !== -1)
    {
      vgData.deletePath(
        this.property.available[this.state.currentChoice].path,
        () =>
        {
          this.props.startUpdate();
          const newAvailable: Array<{id: string, path: string}> =
            [...this.property.available];
          newAvailable.splice(this.state.currentChoice, 1);
          this.property.available = newAvailable;
          this.setState({currentChoice: -1});
          this.props.endUpdate();
        });
    }
  }

  // Move current graph choice up in the list (closer to the start)
  private handleUp = () =>
  {
    if (this.state.currentChoice === 0 || this.state.currentChoice === -1)
    {
      return;
    }

    const currentAvailable = this.property.available;
    const newGraphsList: vgTypes.IRawGraphItem[] = [];

    vgData.getRawSelectorGraphs(this.props.parentPath,
      (graphs: vgTypes.IRawGraphItem[]) =>
    {
      const currentGraphsList = [...graphs];
      const newAvailable: Array<{id: string, path: string}> =
        this.property.available.map((value: {id: string, path: string},
          index: number) =>
        {
          if (index === this.state.currentChoice)
          {
            newGraphsList[index] = currentGraphsList[index-1];
            return currentAvailable[index-1];
          }
          else if (index === this.state.currentChoice - 1)
          {
            newGraphsList[index] = currentGraphsList[index+1];
            return currentAvailable[index+1];
          }
          else
          {
            newGraphsList[index] = currentGraphsList[index];
            return value;
          }
        });

      this.updateGraphList(newAvailable, newGraphsList,
        this.state.currentChoice-1);
    });
  }

  // Move current graph choice down in the list (closer to the end)
  private handleDown = () =>
  {
    if (this.state.currentChoice === this.property.available.length - 1 ||
      this.state.currentChoice === -1)
    {
      return;
    }

    const currentAvailable = this.property.available;
    const newGraphsList: vgTypes.IRawGraphItem[] = [];

    vgData.getRawSelectorGraphs(this.props.parentPath,
      (graphs: vgTypes.IRawGraphItem[]) =>
    {
      const currentGraphsList = [...graphs];
      const newAvailable: Array<{id: string, path: string}> =
        this.property.available.map((value: {id: string, path: string},
          index: number) =>
        {
          if (index === this.state.currentChoice)
          {
            newGraphsList[index] = currentGraphsList[index+1];
            return currentAvailable[index+1];
          }
          else if (index === this.state.currentChoice + 1)
          {
            newGraphsList[index] = currentGraphsList[index-1];
            return currentAvailable[index-1];
          }
          else
          {
            newGraphsList[index] = currentGraphsList[index];
            return value;
          }
        });

      this.updateGraphList(newAvailable, newGraphsList,
        this.state.currentChoice+1);
    });
  }

  private updateGraphList(newAvailable: {id: string, path: string}[],
    newGraphsList: vgTypes.IRawGraphItem[], newCurrentChoice: number)
  {
    this.setState({selecting: true});
      this.props.startUpdate();

      this.property.available = newAvailable;
      const updateGraphs = {"graphs": newGraphsList};

      this.props.updateGraphs(updateGraphs);
      this.setState({currentChoice: newCurrentChoice});

      this.props.endUpdate();
      this.setState({selecting: true});
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

    this.setState({currentChoice: this.property.available.findIndex(
      x => x.id === e.currentTarget.id)});
  }

  private handleMouseUp = (e: React.MouseEvent<SVGElement>) =>
  {
    const date = new Date();

    const graph: {id: string, path: string} = this.property.available.find(
      x => x.id === e.currentTarget.id);

    // Long press - select Graph without showing
    if (this.lastMouseTime.down && date.getTime() -
      this.lastMouseTime.down > 1000 && !this.props.disabled)
    {
      this.selectGraph(graph);
    }
    // Double click - show graph without selecting
    else if (date.getTime() - this.lastMouseTime.up < 250)
    {
      this.props.showGraph(this.props.parentPath+"/graph/"+e.currentTarget.id);
    }

    this.lastMouseTime.up = date.getTime();
  }

  private selectGraph = (graph: {id: string, path: string}) =>
  {
    const index = this.property.available.findIndex(
      x => x.id === graph.id)

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
