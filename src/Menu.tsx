import * as React from 'react';

import { vgData } from './data/Data';

interface IProps
{
  position: {x: number, y: number},
  menuClosed: () => void,
  menuItemSelected: (id: string) => void
}

interface IState
{
  parentID: string | null
}

const maxSize = 10;

export default class Menu extends React.Component<IProps, IState>
{
  private menuData: Array<{id: string, children: string[]}>;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      parentID: null
    }

    this.menuData = [];

    const metadata = vgData.returnMetadata();

    for (const key of Object.keys(metadata))
    {
      const children: string[] = [];

      for (const ckey of Object.keys(metadata[key]))
      {
        children.push(ckey);
      }

      this.menuData.push({id: key, children});
    }
  }

  public render()
  {
    return <div id="menu" className="menu" style={{left: this.props.position.x,
        top: this.props.position.y}} onContextMenu={this.handleMenuContextMenu}>
        <div className="menu-parent-wrapper">
      {
        this.menuData.map((value: {id: string, children: string[]},
          index: number) =>
        {
          return <div key={index} id={"menu-"+value.id}
            className="menu-item parent"
            onMouseDown={this.handleParentMouseDown}> {value.id} </div>
        })
      }
      </div>
      {
        this.state.parentID && this.createSubMenu()
      }
    </div>
  }

  private createSubMenu = () =>
  {
    const subMenuData = this.menuData.find(x => x.id === this.state.parentID);

    if (subMenuData)
    {
      return <div className="menu-children-wrapper">
      {
        subMenuData.children.map((value: string, index: number) =>
        {
          const id = this.state.parentID + ":" + value;
          return <div key={index} id={"menu-"+id} className="menu-item child"
              onMouseDown={this.handleChildMouseDown}> {value} </div>
        })
      }
      </div>
    }
  }

  private handleParentMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.currentTarget.id;
    this.setState({parentID: target.substring(5, target.length)});
  }

  private handleChildMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.currentTarget.id;
    this.props.menuClosed();
    this.props.menuItemSelected(target.substring(5, target.length));
  }

  // Do nothing - prevents browser context menu from showing
  private handleMenuContextMenu = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
  }
}
