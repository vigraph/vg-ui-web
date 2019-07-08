import * as React from 'react';
import * as Model from './model';

import * as vgType from './Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: string) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
}

interface IState
{
  currentText: string;
  editing: boolean;
  updating: boolean;
}

export default class TextDisplay extends React.Component<IProps, IState>
{
  // Reset state from display when not updating - allows changes not from
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { currentText: props.property.value };
  }

  private property: Model.Property;

  private settings: vgType.ITextDisplaySettings;

  private mouseUpTime: number;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const textDisplaySettings =
      require('./json/ControlSettings.json').textDisplay;

    this.settings = textDisplaySettings[this.property.subType] ?
      textDisplaySettings[this.property.subType] : textDisplaySettings.default;

    this.mouseUpTime = 0;

    this.state =
    {
      currentText: this.property.value,
      editing: false,
      updating: false
    };
  }

  public render()
  {
    return(
        <svg id="text-display" className={this.property.subType}
          onMouseUp={this.handleMouseUp}>
          <svg id="text-display-wrapper"
            x={0} y={0}
            width={this.settings.width} height={this.settings.height}>
            <text id="text-display-text" className="label"
              x={this.settings.width/2} y={15}>
            {this.state.currentText}
            </text>
          </svg>
          {this.state.editing && <svg className="text-display-editing-wrapper">
            <rect className="text-display-editing-border"
              x={0} y={0}
              width={this.settings.width} height={this.settings.height}/>
        </svg>}
        </svg>
    );
  }

  private handleMouseUp = () =>
  {
    const date = new Date();
    const now = date.getTime();

    if (now - this.mouseUpTime < 250)
    {
      const newEditState = !this.state.editing;
      this.setState({editing: newEditState});
      if (newEditState)
      {
        window.addEventListener("keydown", this.handleKeyDown);
      }
      else
      {
        window.removeEventListener("keydown", this.handleKeyDown);
      }
    }

    this.mouseUpTime = now;
  }

  private handleKeyDown = (e: KeyboardEvent) =>
  {
    let newText = this.state.currentText;

    if (e.which === 8)
    {
      newText = newText.slice(0, newText.length - 1);
    }
    else if (e.which === 13)
    {
      this.setState({editing: !this.state.editing});
      window.removeEventListener("keydown", this.handleKeyDown);
    }
    else if (e.key.length === 1)
    {
      newText += e.key;
    }

    this.updateText(newText);
  }

  private updateText = (newText: string) =>
  {
    this.setState({updating: true});
    this.props.startUpdate();

    this.setState({currentText: newText});
    this.props.update(newText);

    this.setState({updating: false});
    this.props.endUpdate();
  }
}
