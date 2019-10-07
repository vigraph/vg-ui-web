import * as React from 'react';
import * as Model from './model';

import * as vgTypes from './lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: any[]) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  disabled: boolean;
}

interface IState
{
  currentSequence: string[];
  inputText: string;
  inputting: boolean;
  updating: boolean;
  showSeq: boolean;
}

export default class Sequence extends React.Component<IProps, IState>
{
  // Reset state from display when not updating - allows changes not from
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { currentSequence: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.ISequenceSettings;

  private mouseUpTime: number;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const sequenceSettings =
      require('./json/ControlSettings.json').sequence;

    this.settings = sequenceSettings[this.property.subType] ?
      sequenceSettings[this.property.subType] : sequenceSettings.default;

    this.mouseUpTime = 0;

    this.state =
    {
      currentSequence: this.property.value,
      inputText: this.settings.colourSeq ? "#" : "",
      inputting: false,
      updating: false,
      showSeq: false
    };
  }

  public render()
  {
    return(
        <svg id="sequence" className={this.property.subType}>
          <svg id="sequence-control-wrapper"
            x={0} y={0}>
            <rect className={`sequence-input-border ${this.state.inputting ?
              "inputting" : ""}`}
              x={0} y={0}
              width={this.settings.inputWidth}
              height={this.settings.inputHeight}
              onMouseUp={this.handleMouseUp}/>
            <text id="sequence-input" className="input label"
              x={5} y={15}
              width={this.settings.inputWidth}
              height={this.settings.inputHeight}>
            {this.state.inputText}
            </text>
            <svg id="sequence-add-wrapper"
              onMouseUp={this.handleAddMouseDown}>
              <rect className={"sequence-add horz"}
                x={this.settings.inputWidth + 8} y={8}
                height={4} width={14}/>
              <rect className={"sequence-add vert"}
                x={this.settings.inputWidth + 13} y={3}
                height={14} width={4}/>
            </svg>
            <svg id="sequence-show-wrapper" x={this.settings.inputWidth + 30}
              y={6} onMouseDown={this.handleShowMouseDown}>

              {
                this.state.showSeq ?
                  <polygon className="sequence-show-icon hide"
                  points="0,10 15,10 7,0"/>
                  :
                  <polygon className="sequence-show-icon show"
                  points="0,0 15,0 7,10"/>
              }

            </svg>
          </svg>
          {this.state.showSeq && this.createSequenceDisplay()}
        </svg>
    );
  }

  private createSequenceDisplay = () =>
  {
    const itemH = this.settings.itemHeight;
    const itemW = this.settings.itemWidth;
    const rows = this.settings.rows;
    const currentSeq = this.state.currentSequence;

    const backgroundH = itemH * (currentSeq.length < rows ? currentSeq.length :
      rows);
    const backgroundW = itemW * Math.ceil(currentSeq.length / rows);

    if (currentSeq.length === 0)
    {
      return "";
    }
    else
    {
      const fullSeq = (currentSeq.length === this.settings.seqLength);

      return <svg id="sequence-items-wrapper" x={0}
        y={this.settings.inputHeight + 1}>

        <rect className={"sequence-items-wrapper-border" +
          (fullSeq ? " full-sequence" : "")} x={0} y={0}
          height={backgroundH} width={backgroundW}/>
      {
        currentSeq.map((value: any, index: number) =>
        {
          const column = Math.floor(index / rows);
          const row = index % rows;

          return <svg id={index.toString()} key={index} className="sequence-item"
              x={0 + (column * itemW)} y={itemH*row} width={itemW}
              height={itemH} onMouseUp={this.handleItemMouseUp}>

            {this.settings.colourSeq && <rect id="sequence-item-background"
              fill={value} x={0} y={0} width={itemW} height={itemH}/>}

            {!this.settings.colourSeq && <text id="sequence-item"
              className="item label" x={5} y={15}>{value}</text>
            }
          </svg>
        })
      }
      </svg>
    }
  }

  private handleMouseUp = () =>
  {
    const newInputtingState = !this.state.inputting;
    this.setState({inputting: newInputtingState});
    if (newInputtingState)
    {
      window.addEventListener("keydown", this.handleKeyDown);
    }
    else
    {
      window.removeEventListener("keydown", this.handleKeyDown);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) =>
  {
    let newText = this.state.inputText;

    if (e.which === 8)
    {
      if (!this.settings.colourSeq || newText.length > 1)
      {
        newText = newText.slice(0, newText.length - 1);
        this.setState({inputText: newText});
      }
    }
    else if (e.which === 13)
    {
      this.addToSequence();
    }
    else if (e.key.length === 1)
    {
      if (newText.length < this.settings.itemLength)
      {
        newText += e.key;
        this.setState({inputText: newText});
      }
    }
  }

  private handleAddMouseDown = () =>
  {
    this.addToSequence();
  }

  private addToSequence = () =>
  {
    if (this.property.value.length === this.settings.seqLength)
    {
      const newInput = (this.settings.colourSeq ? "#" : "");
      this.setState({inputText: newInput});
    }
    else if (this.settings.colourSeq &&
      (!(/^#[0-9a-f]*$/i.test(this.state.inputText)) ||
      (this.state.inputText.length !== 7 && this.state.inputText.length !== 4)))
    {
      const newInput = "#";
      this.setState({inputText: newInput});
    }
    else if (this.state.inputText !== "" && this.state.inputText !== "#")
    {
      let newSeq = [...this.state.currentSequence];
      newSeq.push(this.state.inputText)
      this.updateSequence(newSeq, true);
    }
  }

  private updateSequence = (newSequence: string[], clear: boolean) =>
  {
    this.setState({updating: true});
    this.props.startUpdate();

    this.setState({currentSequence: newSequence});
    this.props.update(newSequence);

    if (clear)
    {
      const newInput = this.settings.colourSeq ? "#" : "";
      this.setState({inputText: newInput});
    }

    this.setState({updating: false});
    this.props.endUpdate();
  }

  // Show sequence display
  private handleShowMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    const show = !this.state.showSeq;
    this.setState({showSeq: show});
  }

  // Double click to remove item from sequence
  private handleItemMouseUp = (e: React.MouseEvent<SVGElement>) =>
  {
    const date = new Date();
    const now = date.getTime();

    if (now - this.mouseUpTime < 250)
    {
      let newSeq = [...this.state.currentSequence];
      newSeq.splice(parseInt(e.currentTarget.id), 1);
      this.updateSequence(newSeq, false);
      this.mouseUpTime = 0;
    }
    else
    {
      this.mouseUpTime = now;
    }

  }
}
