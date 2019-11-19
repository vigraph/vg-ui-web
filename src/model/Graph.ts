// ViGraph UI model - Graph class
// Copyright (c) Paul Clark 2018

// Implements a method-based interface but holds all internal state
// as immutable objects.  Our external interface is typed but internally
// we are untyped because typed immutable.js is just too painful.

// State structure:
// {
//   id: string,
//   nodes: Map<id, {
//            name: string
//            type: string
//            path: string
//            dynamic: boolean
//            category: string
//            description: string
//            inputs: Map<id, { type: string, position: {x, y} }>
//            outputs: Map<id, { type: string, position: null }>
//            forwardEdges: Map<output, List<{ destId: string, destInput: string }>>
//            reverseEdges: Map<input, List<{ srcId: string, srcOutput: string }>>
//            position: { x, y },
//            size: { w, h },
//            properties: Map<id, {
//                                  description: string,
//                                  propType: string,
//                                  valueType: string,
//                                  valueFormat: string,
//                                  controlType: string,
//                                  position: {x, y},
//                                  value: any,
//                                  range: {min, max},
//                                  increment: number,
//                                  available: any[]
//                                },
//             subGraph: boolean
//                  }>
// }

import { List } from 'immutable';
import { Map } from 'immutable';
import { Connector } from './Connector';
import { Node } from './Node';
import { Property } from './Property';
import { vgUtils } from '../lib/Utils';
import { vgData } from '../data/Data';

export class Graph
{
  private history: Array<Map<string, any>> = [];
  private historyIndex: number = 0;  // Index of current state
  private inTransaction: boolean = false;
  private inOverride: boolean = false;
  private lastUndoIndex: number = 0;

  public constructor()
  {
    // Create initial state
    this.history.push(Map<string, any>());
  }

  //
  // Load a graph from the given JSON:
  // { nodes: [
  //     { id, name, type, path, dynamic, category, description, x, y, w, h,
  //       inputs: [ { id, type, x, y } ],
  //       outputs: [ { id, type } ],
  //       edges: [ { output, destId, input } ],
  //       properties: [ { id, description, propType, valueType, valueFormat,
  //                       controlType, x, y, value, rangeMin, rangeMax,
  //                       increment
  //                   } ],
  //       subGraph
  //     } ] }
  // Baseline set if given json is the baseline graph
  public loadFrom(json: any, baseline: boolean, id: string)
  {
    this.beginTransaction();

    this.setGraphID(id);

    // First pass to create nodes, connectors and properties
    for (const n of json.nodes)
    {
      this.addNodeFromJSON(n);
    }

    // Second pass to create edges
    for (const n of json.nodes)
    {
      if (n.edges)
      {
        for (const e of n.edges)
        {
          this.addEdge(n.id, e.output, e.destId, e.input);
        }
      }
    }

    this.commitTransaction();
    if (baseline)
    {
      this.resetBaseline();
    }
  }

  public setGraphID(id: string)
  {
    this.state = this.state.setIn(["id"], id);
  }

  public getGraphID(): string
  {
    return this.state.get("id");
  }

  public graphIsRoot(): boolean
  {
    return (this.getGraphID().split("/").length <= 1);
  }

  public addNodeFromJSON(n: any)
  {
    const node = this.addNode(n.id, n.type || "?");
    node.name = n.name || n.id;
    node.position = { x: n.x || 0, y: n.y || 0 };
    node.size = { w: n.w || 50, h: n.h || 50 };
    node.path = n.path || n.id;
    node.dynamic = n.dynamic || false;
    node.category = n.category || null;
    node.description = n.description || "";
    node.subGraph = n.subGraph || false;
    if (n.inputs)
    {
      for (const i of n.inputs)
      {
        const input = this.addNodeInput(n.id, i.id, i.type);
        input.position = ((i.x !== undefined && i.y !== undefined) ?
          { x: i.x || 0, y: i.y || 0 } : null);
      }
    }

    if (n.outputs)
    {
      for (const o of n.outputs)
      {
        const output = this.addNodeOutput(n.id, o.id, o.type);
        output.position = null;
      }
    }

    if (n.properties)
    {
      for (const p of n.properties)
      {
        const property = this.addProperty(n.id, p.id, p.propType);
        property.value = p.value;
        property.valueType = p.valueType || "";
        property.description = p.description || ""
        property.valueFormat = p.valueFormat || "";
        property.controlType = p.controlType || "none/none";
        property.position = { x: p.x || 0, y: p.y || 0 };
        property.range = { min: p.rangeMin || 0, max: p.rangeMax || 1};
        property.increment = p.increment || 1;
        property.available = p.available || [];
      }
    }

    return node;
  }

  public getNodes(): Node[]
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; }
    return nodes.map((n, id) => new Node(id!, this)).toArray();
  }

  public getNode(id: string): Node | null
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(id);
    if (!node) { return null };
    return new Node(id, this);
  }

  public getNodeProp(id: string, prop: string): any
  {
    return this.state.getIn(["nodes", id, prop]);
  }

  public setNodeProp(id: string, prop: string, value: any)
  {
    this.state = this.state.setIn(["nodes", id, prop], value);
  }

  public addNode(id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", id, "type"], type);
    return new Node(id, this);
  }

  public removeNode(id: string)
  {
    this.state = this.state.deleteIn(["nodes", id]);
  }

  public addNodeInput(parentId: string, id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "inputs", id,
      "type"], type);

    // Initialise reverse edge list for this input connector
    if (!this.state.getIn(["nodes", parentId, "reverseEdges", id]))
    {
      this.state = this.state.setIn(["nodes", parentId, "reverseEdges",
        id], List<{destId: string, destInput: string}>());
    }

    return new Connector(id, parentId, "input", this);
  }

  public addNodeOutput(parentId: string, id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "outputs", id,
      "type"], type);

    // Initialise forward edge list for this output connector
    if (!this.state.getIn(["nodes", parentId, "forwardEdges", id]))
    {
      this.state = this.state.setIn(["nodes", parentId, "forwardEdges",
        id], List<{destId: string, destInput: string}>());
    }

    return new Connector(id, parentId, "output", this);
  }

  public getNodeConnectorProp(id: string, parentId: string, type: string,
    prop: string): any
  {
    const ioType = (type === "input") ? "inputs" : "outputs";
    return this.state.getIn(["nodes", parentId, ioType, id, prop]);
  }

  public setNodeConnectorProp(id: string, parentId: string, type: string,
    prop: string, value: any)
  {
    const ioType = (type === "input") ? "inputs" : "outputs";
    this.state = this.state.setIn(["nodes", parentId, ioType, id, prop], value);
  }

  public getNodeConnectors(parentId: string, type: string): Connector[]
  {
    const ioType = (type === "input") ? "inputs" : "outputs";

    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return []; };
    const inputs: Map<string, any> = node.get(ioType);
    if (!inputs) { return []; };
    return inputs.map((n, id) =>
      new Connector(id!, parentId, type, this)).toArray();
  }

  public getNodeConnector(id: string, parentId: string, type: string):
    Connector | null
  {
    const ioType = (type === "input") ? "inputs" : "outputs";

    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return null };
    const connectors: Map<string, any> = node.get(ioType);
    if (!connectors) { return null };
    const connector: Map<string, any> = connectors.get(id);
    if (!connector) { return null };
    return new Connector(id, parentId, type, this);
  }

  public addEdge(srcId: string, srcOutput: string,
    destId: string, destInput: string)
  {
    const srcConnector = this.getNodeConnector(srcOutput, srcId, "output");
    const destConnector = this.getNodeConnector(destInput, destId, "input");

    if (srcConnector && destConnector && (srcConnector.type ===
      destConnector.type || srcConnector.type === "any" ||
      destConnector.type === "any"))
    {
      this.state = this.state
        .setIn(["nodes", srcId, "forwardEdges", srcOutput],
          this.state.getIn(["nodes", srcId, "forwardEdges", srcOutput]).push(
            { destId, destInput }))
        .setIn(["nodes", destId, "reverseEdges", destInput],
          this.state.getIn(["nodes", destId, "reverseEdges", destInput]).push(
            { srcId, srcOutput }));
    }
}

  public removeEdge(srcId: string, srcOutput: string,
    destId: string, destInput: string)
  {
    if (!this.getNode(srcId) || !this.state.getIn(["nodes", srcId,
      "forwardEdges", srcOutput]))
    {
      vgUtils.log("Graph removeEdge Error: Node " + srcId + " or Output " +
        srcOutput + " not found");
      return;
    }

    if (!this.getNode(destId) || !this.state.getIn(["nodes", destId,
      "reverseEdges", destInput]))
    {
      vgUtils.log("Graph removeEdge Error: Node " + destId + " or Input " +
        destInput + " not found");
      return;
    }

    this.state = this.state
        .deleteIn(["nodes", srcId, "forwardEdges", srcOutput,
          this.state.getIn(["nodes", srcId, "forwardEdges",
          srcOutput]).findIndex((value: {destId: string, destInput: string}) =>
            value.destId === destId && value.destInput === destInput)])
        .deleteIn(["nodes", destId, "reverseEdges", destInput,
          this.state.getIn(["nodes", destId, "reverseEdges",
          destInput]).findIndex((value: {srcId: string, srcOutput: string}) =>
            value.srcId === srcId && value.srcOutput === srcOutput)]);
  }

  // Get forward/reverse edges - returns map of output to {dest, input}
  public getNodeForwardEdges(id: string): Map<string,
    [{ destId: string, destInput: string }]>
  {
    return this.state.getIn(["nodes", id, "forwardEdges"]);
  }

  public getNodeReverseEdges(id: string): Map<string,
    [{ srcId: string, srcOutput: string }]>
  {
    return this.state.getIn(["nodes", id, "reverseEdges"]);
  }

  public addProperty(parentId: string, id: string, propType: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "properties", id,
      "propType"], propType);
    return new Property(id, parentId, this);
  }

  public getPropertyProp(id: string, parentId: string, prop: string): any
  {
    return this.state.getIn(["nodes", parentId, "properties", id, prop]);
  }

  public setPropertyProp(id: string, parentId: string, prop: string, value: any)
  {
    this.state = this.state.setIn(["nodes", parentId, "properties", id, prop],
      value);
  }

  public getProperties(parentId: string): Property[]
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return []; };
    const properties: Map<string, any> = node.get("properties");
    if (!properties) { return []; };
    return properties.map((n, id) =>
      new Property(id!, parentId, this)).toArray();
  }

  public getProperty(id: string, parentId: string): Property | null
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return null };
    const properties: Map<string, any> = node.get("properties");
    if (!properties) { return null };
    const property: Map<string, any> = properties.get(id);
    if (!property) { return null };
    return new Property(id, parentId, this);
  }

  // Transactions - used for temporary changes which might or might not get
  // committed to the model - e.g. dragging
  public beginTransaction()
  {
    // Rollback any existing, for safety
    this.rollbackTransaction();

    // Clone top state as transient one
    this.state = this.state;  // Set get/set below!

    this.inTransaction = true;
  }

  public rollbackTransaction()
  {
    if (this.inTransaction)
    {
      this.undo();
      this.inTransaction = false;
    }
  }

  public commitTransaction()
  {
    if (this.inTransaction)
    {
      // Just leave current state
      this.inTransaction = false;
    }

    // Current and previous states are equal (nothing changed in the last
    // transaction) so 'undo' state. Only responding to identical states so
    // don't need a full undo.
    if (this.historyIndex > 0 && JSON.stringify(this.state) ===
      JSON.stringify(this.history[this.historyIndex-1]))
    {
      this.historyIndex--;
    }
  }

  // Begin override - used to overide current state without adding to the history
  private beginOverride()
  {
    this.rollbackTransaction();

    this.inOverride = true;
  }

  private commitOverride()
  {
    if (this.inOverride)
    {
      this.inOverride = false;
    }
  }

  // Undo / redo state
  public resetBaseline()
  {
    if (this.historyIndex > 0)
    {
      this.history = this.history.slice(this.historyIndex);
      this.historyIndex = 0;
    }
  }

  private stateMoveUpdate(currentState: Map<string, any>,
    newState: Map<string, any>)
  {
    const currentToNew = () =>
    {
      // Compare current state to new state
      currentState.get("nodes").forEach((value: any, nodeID: string) =>
      {
        const cNode = currentState.getIn(["nodes", nodeID]);
        const nNode = newState.getIn(["nodes", nodeID]);

        if (typeof nNode === "undefined")
        {
          // Node not found in new state so should be deleted
          vgData.deleteNode(cNode.get("path"));

          // If node is a pin and it has a connection in the current state
          // then remove the pin from the graph input/output
          if (cNode.get("category") === "pin")
          {
            if (typeof cNode.get("forwardEdges") !== "undefined" ||
              typeof cNode.get("reverseEdges") !== "undefined")
            {
              vgData.nonPropertyDelete(nodeID, currentState.get("id"));
            }
          }
        }
        else
        {
          const cNodePos = cNode.get("position");
          const nNodePos = nNode.get("position");

          // Check node position
          if (cNodePos.x !== nNodePos.x || cNodePos.y !== nNodePos.y)
          {
            // Node position has changed between states
            vgData.updateLayout(nNode.get("path"),
              {x: nNodePos.x, y: nNodePos.y});
          }

          const cNodeSize = cNode.get("size");
          const nNodeSize = nNode.get("size");

          // Check node size
          if (cNodeSize.w !== nNodeSize.w || cNodeSize.h !== nNodeSize.h)
          {
            // Node size has changed between states
            vgData.updateLayout(nNode.get("path"), undefined,
              {w: nNodeSize.w, h: nNodeSize.h});
          }

          // Check node property values
          if (typeof cNode.get("properties") !== "undefined")
          {
            cNode.get("properties").forEach((cPropSetting: any, cKey: string) =>
            {
              const cValue = cPropSetting.get("value");
              const nValue = nNode.getIn(["properties", cKey, "value"]);

              if (cValue !== nValue)
              {
                // Property value has changed between states
                vgData.updateProperty(cNode.get("path"), cKey, nValue);
              }
            });
          }

          // Check forward edges
          if (typeof cNode.get("forwardEdges") !== "undefined")
          {
            cNode.get("forwardEdges").forEach((destList: any, outputID: string) =>
            {
              const nEdges = nNode.getIn(["forwardEdges", outputID]);
              if (!destList.equals(nEdges))
              {
                const newEdges: Array<{dest: string, destInput: string}> = [];

                nEdges.forEach((value: {destId: string, destInput: string}) =>
                {
                  newEdges.push({dest: value.destId, destInput: value.destInput});
                });

                vgData.updateEdges(cNode.get("path"), outputID, newEdges);
              }
            });
          }
        }
      });
    }

    let currentToNewFlag = false;

    // Compare nodes in new state to current state
    newState.get("nodes").forEach((value: any, nodeID: string) =>
    {
      const newStateID = newState.get("id");

      if (typeof currentState.getIn(["nodes", nodeID]) === "undefined")
      {
        currentToNewFlag = true;
        // Node not found in current state so should be added

        vgData.createNode(nodeID, value.get("type"), newStateID, () =>
          {
            const nNode = newState.getIn(["nodes", nodeID]);

            // If node is a pin and it has a connection in the new state
            // add the pin to the graph input/output
            if (nNode.get("category") === "pin")
            {
              if (typeof nNode.get("forwardEdges") !== "undefined")
              {
                vgData.nonPropertyPost(nodeID, {direction: "in"}, newStateID);
              }
              if (typeof nNode.get("reverseEdges") !== "undefined")
              {
                vgData.nonPropertyPost(nodeID, {direction: "out"}, newStateID);
              }
            }

            // Check forward edges
            if (typeof nNode.get("forwardEdges") !== "undefined")
            {
              nNode.get("forwardEdges").forEach((destList: any, outputID: string) =>
              {
                const nEdges = nNode.getIn(["forwardEdges", outputID]);
                const newEdges: Array<{dest: string, destInput: string}> = [];

                nEdges.forEach((value: {destId: string, destInput: string}) =>
                {
                  newEdges.push({dest: value.destId, destInput: value.destInput});
                });

                if (newEdges.length > 0)
                {
                  vgData.updateEdges(nNode.get("path"), outputID, newEdges);
                }
              });
            }

            // Do current to new comparison now because all nodes needed for
            // any potential edge changes now exist.
            // Note: Currently only one action (e.g. node add) per state level.
            currentToNew();
          });

        vgData.updateLayout(value.get("path"), {x: value.get("position").x,
          y: value.get("position").y}, {w: value.get("size").w,
          h: value.get("size").h});
      }
      else
      {
        const nNode = newState.getIn(["nodes", nodeID]);
        const cNode = currentState.getIn(["nodes", nodeID]);
        if (nNode.get("category") === "pin")
        {
          const nfEdge = nNode.get("forwardEdges").get("output").size;
          const nrEdge = nNode.get("reverseEdges").get("input").size;
          const cfEdge = cNode.get("forwardEdges").get("output").size;
          const crEdge = cNode.get("reverseEdges").get("input").size;

          // Pin node has forward edges in new state but doesn't in old state,
          // set it as an input pin
          if (nfEdge && !cfEdge)
          {
            vgData.nonPropertyPost(nodeID, {direction: "in"}, newStateID);
          }
          // Pin node has reverse edges in new state but doesn't in old state,
          // set it as an output pin
          else if  (nrEdge && !crEdge)
          {
            vgData.nonPropertyPost(nodeID, {direction: "out"}, newStateID);
          }
          // Pin node has no connected edges but does in current state,
          // remove pin input/output from graph
          else if (!nfEdge && !nrEdge && (cfEdge || crEdge))
          {
            vgData.nonPropertyDelete(nodeID, newStateID);
          }
        }
      }
    });

    // Do current to new comparison now if it hasn't been done already.
    if (!currentToNewFlag)
    {
      currentToNew();
    }
  }

  // Undo - go back in state history until two graph states have the same id.
  // Undo from the newer state to the older state.
  public undo()
  {
    if (this.historyIndex > 0)
    {
      let flag = false;
      const indexStart = this.historyIndex;

      while (!flag)
      {
        const currentStateID = this.getGraphID();
        this.historyIndex--;
        const newStateID = this.getGraphID();

        if (currentStateID === newStateID)
        {
          flag = true;
          this.stateMoveUpdate(this.history[this.historyIndex + 1],
            this.history[this.historyIndex]);
        }
        else if (this.historyIndex < 1)
        {
          flag = true;
          this.historyIndex = indexStart;
        }
      }

      this.lastUndoIndex = this.historyIndex;
    }
  }

  // Redo - from the index of the last undo (to account for navigation without
  // state change) look forward until two graph state ids match, then redo from
  // the older to the newer.
  public redo()
  {
    if (this.lastUndoIndex < this.history.length - 1)
    {
      let flag = false;
      const indexStart = this.lastUndoIndex;
      this.historyIndex = indexStart;

      while (!flag)
      {
        const currentStateID = this.getGraphID();
        this.historyIndex++;
        const newStateID = this.getGraphID();

        if (currentStateID === newStateID)
        {
          flag = true;
          this.stateMoveUpdate(this.history[this.historyIndex - 1],
            this.history[this.historyIndex]);
        }
        else if (this.historyIndex === this.history.length - 1)
        {
          flag = true;
          this.historyIndex = indexStart;
        }
      }

      this.lastUndoIndex = this.historyIndex;
    }
  }

  // Go forward in graph navigation - set current state (history) to a new clear
  // graph
  public forward(json: any, id: string)
  {
    this.history.push(Map<string, any>());
    this.historyIndex = this.history.length - 1;

    this.loadFrom(json, false, id);
  }

  // Go back in graph navigation - set current state (history) to the last
  // occurance of the graph (by ID) in state history.
  public back(finished: () => void)
  {
    const currentID = this.getGraphID();
    const newID = currentID.slice(0, currentID.lastIndexOf("/"));

    let flag = false;

    while (!flag)
    {
      this.historyIndex--;

      if (this.historyIndex < 0)
      {
        flag = true;
      }
      else if (this.getGraphID() === newID)
      {
        flag = true;

        this.history.push(this.state);
        this.historyIndex = this.history.length - 1;
      }
    }

    const newCurrentID = this.getGraphID();

    // Regenerate current graph to ensure it is up to date
    this.beginOverride();

    this.state = Map<string, any>();

    vgData.generateGraph(newCurrentID, (json:any) =>
      {
        this.loadFrom(json, false, newCurrentID);
        this.commitOverride();
        finished();
      });
  }

  private get state(): Map<string, any>
  {
    return this.history[this.historyIndex];
  }

  private set state(state: Map<string, any>)
  {
    // Override current state
    if (this.inOverride)
    {
      this.history[this.historyIndex] = state;
    }
    else if (this.inTransaction)
    {
      // Just replace top one
      this.history.pop();
      this.history.push(state);
    }
    else
    {
      // Move forward
      this.historyIndex++;

      // Chop off anything after this in forward (redo) history
      if (this.history.length > this.historyIndex)
      {
        this.history = this.history.slice(0, this.historyIndex);
      }
      this.history.push(state);
    }
  }
}
