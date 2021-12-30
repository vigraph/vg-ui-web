import * as React from 'react';
import Node from './Node';
import Knob from './controllers/Knob';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';

export default class KnobNode extends Node
{
  public render()
  {
    const node = this.props.node;
    const height = node.size.h;
    const width = node.size.w;
    const padding = this.props.padding;

    return (
      <svg id={`node-${node.id}`}
           className={"node " + node.type.replace("/","-") + " " +
                       (node.category ? node.category : "")}
           x={this.state.x} y={this.state.y}>
        {this.createBackground()}

        <Knob property={node.getProperties()[0]}
              position={{x: padding*2+width/2, y: height/2}}
              startUpdate={this.props.startUpdate}
              update={this.updateProperty}
              endUpdate={this.props.endUpdate}
              disabled={false}
              settingsType="default"
        />
        {this.props.children}
      </svg>
    );
  }

  private updateProperty = (value: any) =>
  {
    const node = this.props.node;
    const property = node.getProperties()[0]; // !!!
    const newValue = value; //!!!vgUtils.snapValueToIncrement(value, property.increment);

    // Send update to server and update model property
    vgData.updateProperty(node.path, property.id, newValue,
                          () =>
                            {
                              property.value = newValue;
                              if (this.props.update) this.props.update();
                            });
  }
}

