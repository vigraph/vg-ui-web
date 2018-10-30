import React, { Component } from 'react';
import './Node.css';

export default class Node extends Component
{
  static defaultProps =
  {
    width: 100,
    height: 50
  }

  constructor(props)
  {
    super(props);
    this.state =
      {
        dragging: false,
        x: props.x,
        y: props.y
      };

    this.offsetX = 0;
    this.offsetY = 0;
    this.name = props.name;
  }

  componentDidMount()
  {


  }

  handleMouseDown = (e) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ dragging: true });
    this.offsetX = e.pageX - this.state.x;
    this.offsetY = e.pageY - this.state.y;
  }

  handleMouseUp = (e) =>
  {
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove = (e) =>
  {
    if (this.state.dragging)
      this.setState({ x: e.pageX - this.offsetX,
                      y: e.pageY - this.offsetY });
  }

  render()
  {
    return (
      <svg x={this.state.x} y={this.state.y}>
        <rect width={this.props.width} height={this.props.height}
              className={`node ${this.state.dragging?"dragging":""}`}
              onMouseDown={this.handleMouseDown}
              />
        <text className="label" x={10} y={20}>{this.props.name}</text>
      </svg>
    );
  }
}

