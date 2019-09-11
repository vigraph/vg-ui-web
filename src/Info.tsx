import * as React from 'react';

import * as Model from './model';

interface IProps
{
  graph: Model.Graph,
  node: Model.Node,
  deleteNode: (node: Model.Node) => void;
}

export default class Info extends React.Component<IProps>
{
  private graph: Model.Graph;

  constructor(props: IProps)
  {
    super(props);

    this.graph = props.graph;
  }

  public render()
  {
    const node = this.props.node;
    const section = node.type.split(":")[0];

    return <div id="info">
      <div id="info-name" className="info-text name">{node.name}</div>
      <div id="info-id" className="info-text id">{node.id}</div>
      <div id="info-description" className="info-text description">
        {node.description}</div>
      <div id="info-section" className="info-text section">{section}</div>
    </div>;
  }
}
