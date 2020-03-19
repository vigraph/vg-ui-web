import * as React from 'react';

import { vgConfig } from './lib/Config';

import WebsocketCanvas from './WebsocketCanvas';
import Panel from './Panel';

interface IProps
{
  id: string,
  port: number,
  pinDisplay: (pin: boolean, id?: string) => void,
  removeDisplay: (id: string) => void,
  startPosition: {x: number, y: number}
}

interface IState
{
  width: number,
  height: number
}

export default class InfoPanel extends React.Component<IProps, IState>
{
  constructor(props: IProps)
  {
    super(props);

    const settings = vgConfig.Graph.websocketPanel.resizeProps;

    this.state =
    {
      width: settings.minWidth,
      height: settings.minHeight
    }
  }

  public render()
  {
    return (
      <Panel id={this.props.id} startPosition={this.props.startPosition}
        horizontal={false} empty={false} resizable={true}
        notifyPin={this.props.pinDisplay} resizeUpdate={this.sizeUpdate}>
      {
        <div id="websocket-display">
          <WebsocketCanvas size={{ x: this.state.width, y: this.state.height }}
            port={this.props.port}/>
        </div>
      }
      </Panel>
    );
  }

  private sizeUpdate = (widthDiff: number, heightDiff: number) =>
  {
    const settings = vgConfig.Graph.websocketPanel.resizeProps;

    let newWidth = Math.max(this.state.width + widthDiff, settings.minWidth);
    let newHeight = Math.max(this.state.height + heightDiff,
      settings.minHeight);

    newHeight = settings.aspectRatio ? newWidth * settings.aspectRatio :
      newHeight;

    this.setState({width: newWidth, height: newHeight});
  }
}
