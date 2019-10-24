// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// Class to interrogate and modify a dataflow graph within the ViGraph engine,
// as well as getting property Metadata, using REST protocol API.
// State is read/sent in JSON.  The URL format identifies a hierarchy of
// elements (nodes) by ID.
// Processes and combines graph, metadata, config data and layout data to create
// the graph model.

import * as rm from 'typed-rest-client/RestClient';

import * as vgTypes from '../lib/Types';
import { vgUtils } from '../lib/Utils';

const restURL = 'http://localhost:33381';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class Data
{
  private rest: rm.RestClient;
  private generateSuccess?: (json: any) => void;
  private propertiesConfig: vgTypes.IPropertiesConfig;
  private metadata: vgTypes.IMetadata;
  private layoutData: vgTypes.ILayoutData;

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', restURL);
    this.propertiesConfig = require('../json/PropertiesConfig.json');
    this.metadata = {};
    this.layoutData = {};
  }

  //============================================================================
  // Public access/update functions
  //============================================================================

  public returnMetadata()
  {
    return this.metadata;
  }

  // Update property (propID) on node (nodeID) with given value (value)
  public updateProperty(nodeID: string, propID: string,
    value: any, success?: () => void, failure?: () => void)
  {
    const url = restURL + "/graph/" + nodeID + "/@" + propID;

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify({value})
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          // vgUtils.log("Update Property Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Property Failure with response status: " +
            response.status)

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Property Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Update layout data. If no position or size given then layout data for
  // given id is removed. If no id given then this.layoutData is sent with
  // no updates.
  // Note: ID is node path
  public updateLayout(id?: string, position?: {x: number, y: number},
    size?: {w: number, h: number})
  {
    const url = restURL + "/layout";

    if (id)
    {
      if (!position && !size)
      {
        delete this.layoutData[id];
      }
      else
      {
        this.layoutData[id] = {...this.layoutData[id], ...position, ...size};
      }
    }

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(this.layoutData)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Update Layout Success");
        }
        else
        {
          // Error
          vgUtils.log("Update Layout Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Layout Failure with error: " + error);
      });
  }

  // Update edges from output Node with an Array of all valid edges.
  // Edge removed by copying current edges, removing the edge and updating with
  // new array.
  public updateEdges(outputNodePath: string, outputID: string,
    edges: Array<{dest: string, destInput: string}>, success?: ()=>void,
    failure?: () => void)
  {
    const url = restURL + "/graph/" + outputNodePath + "/@" + outputID;

    const data: Array<{"element": string, "input": string}> = [];

    edges.forEach((value: {dest: string, destInput: string}) =>
    {
      data.push({"element": value.dest, "input": value.destInput});
    })

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify({connections: data})
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Update Edges Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Edges Success with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Edges Success with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Get node and calls success with resulting (processed) node allowing it to
  // be added to the Graph model
  public getNode(nodeID: string, parentPath?: string,
    success?: (result: any) => void, failure?: () => void)
  {
    vgUtils.log("Get Node: " + nodeID);

    const path = (typeof parentPath !== "undefined" ? parentPath + '/' : '') +
      nodeID;

    this.getRawGraphItem(path, (result) =>
    {
      vgUtils.log("Process raw node");
      if (this.metadata)
      {
        const item = this.processSingleGraphItem(nodeID, result, parentPath);

        const propConfig = this.propertiesConfig[item.type];

        // Node properties layout (height and width)
        const h = this.layoutData[item.path] && this.layoutData[item.path].h ?
          this.layoutData[item.path].h : (propConfig ? propConfig.height : 0);
        const w = this.layoutData[item.path] && this.layoutData[item.path].w ?
          this.layoutData[item.path].w : (propConfig ? propConfig.width : 0);
        const layout = {h, w}

        if (success) success({...item, ...layout});
      }
      else
      {
        // Error - trying to create node before Graph set up
        vgUtils.log("Process Get Node Failure: Trying to process node " +
          "before full Graph set up");

        if (failure)
        {
          failure();
        }
      }
    },
    () =>
    {
      if (failure)
      {
        failure();
      }
    })
  }

  private async getRawGraphItem(path: string,
    success?: (result: vgTypes.IRawGraphItem)=>void, failure?: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem> =
        await this.rest.get<vgTypes.IRawGraphItem>('/graph/' + path);

      if (res.statusCode === 200 && res.result && success)
      {
        vgUtils.log("Get Raw Graph Item By Path Success");
        success(res.result);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Raw Graph Item Failure with status code: " +
          res.statusCode);

        if (failure)
        {
          failure();
        }
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Raw Graph Item Failure with error: " + error);

      if (failure)
      {
        failure();
      }
    }
  }

  // Create/add node with ID nodeID and type nodeType to Graph
  // Calls success function on PUT success
  public createNode(nodeID: string, nodeType: string, parentPath?: string,
    success?: ()=>void, failure?: () => void)
  {
    const url = restURL + "/graph/" +
      (typeof parentPath !== "undefined" ? parentPath + "/" : "") + nodeID;

    const data = {type: nodeType}

    fetch(url,
    {
      method: "PUT",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Create Node Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Create Node Failure with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Create Node Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Delete node from Graph
  // Calls success on DELETE success
  public deleteNode(nodePath: string, success?: ()=>void, failure?: () => void)
  {
    const url = restURL + "/graph/" + nodePath;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Delete Node Success");

          this.updateLayout(nodePath);

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Delete Node Failure with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Delete Node Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  //============================================================================
  // Generate Graph from Graph data, Metadata and Layout data
  //============================================================================

  // Generate Graph by getting metadata, layout data and graph data and then
  // processing and combining
  public generateGraph(success: (json: any) => void, path?: string)
  {
    this.generateSuccess = success;

    const getLayout = () =>
    {
      if (Object.keys(this.layoutData).length > 0)
      {
        this.getGraphData(path);
      }
      else
      {
        this.getLayoutData(() => { this.getGraphData(); });
      }
    }

    if (Object.keys(this.metadata).length > 0)
    {
      getLayout();
    }
    else
    {
      this.getMetadata(() => {getLayout()});
    }
  }

  //============================================================================
  // Metadata
  //============================================================================

  // Get properties metadata
  private async getMetadata(success: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IMetadata> =
        await this.rest.get<vgTypes.IMetadata>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Metadata Success");
        this.metadata = res.result

        success();
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Metadata Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Metadata Failure with error: " + error);
    }
  }

  //============================================================================
  // Layout Data
  //============================================================================

  // Get data for graph layout
  private async getLayoutData(finished: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.ILayoutData> =
        await this.rest.get<vgTypes.ILayoutData>('/layout');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Layout Data Success");
        this.layoutData = res.result;
        finished();
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Layout Data Failure with status code: " +
          res.statusCode);
        finished();
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Layout Data Failure with error: " + error);
      finished();
    }
  }

  // Layout Graph and pass full graph on to final success callback
  public layoutGraph(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Process layout using stored layout data. If layout data not found
    // for given nodes then layout automatically generated
    this.processLayout(nodes, success,
      (lNodes: vgTypes.IProcessedGraphItem[]) =>
      {
        this.generateLayout(lNodes, success);
      });
  }

  // Process layout data and combine with node data
  private processLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void,
    failure: (nodes: vgTypes.IProcessedGraphItem[]) => void)
  {
    const layout = this.layoutData;
    const layoutNodes: any[] = [];
    let successCount = 0;

    nodes.forEach((value: vgTypes.IProcessedGraphItem) =>
    {
      const propConfig = this.propertiesConfig[value.type];

      if (layout[value.path])
      {
        successCount++;
      }

      const height = layout[value.path] && layout[value.path].h ?
        layout[value.path].h : (propConfig ? propConfig.height : 50);
      const width = layout[value.path] && layout[value.path].w ?
        layout[value.path].w : (propConfig ? propConfig.width : 50);

      const nodeLayout =
      {
        x: layout[value.path] ? layout[value.path].x : 0,
        y: layout[value.path] ? layout[value.path].y : 0,
        h: height,
        w: width
      }

      layoutNodes.push({...value, ...nodeLayout});
    });

    if (successCount > 0)
    {
      const graph = { "nodes" : layoutNodes };
      success(graph);
    }
    else
    {
      failure(nodes);
    }
  }

  // Generate Graph layout without node position data. Nodes ranked by number of
  // parents and laid out without overlapping
  private generateLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Store input and output IDs used to layout Graph without
    // node position data
    const inputEdgeMap: { [key: string]: string[] } = {};
    const outputEdgeMap: { [key: string]: string[] } = {};

    nodes.forEach((node: vgTypes.IProcessedGraphItem, index: number) =>
    {
      node.edges.forEach((edge: {output: string, destId: string, input: string},
        eIndex: number) =>
      {
        inputEdgeMap[edge.destId] ? inputEdgeMap[edge.destId].push(node.id) :
          inputEdgeMap[edge.destId] = [node.id];

        outputEdgeMap[node.id] ? outputEdgeMap[node.id].push(edge.destId) :
          outputEdgeMap[node.id] = [edge.destId];
      })
    })

    const layoutNodes: any[] = [];

    const leaves: string[] = [];
    const ranks: { [key: string] : number } = {};

    const rankNodes = (rank: number, rNodes: string[]) =>
    {
      rNodes.forEach((name: string) =>
      {
        if (!ranks[name] || ranks[name] < rank)
        {
          ranks[name] = rank;
        }

        if (outputEdgeMap[name])
        {
          rankNodes(rank+1, outputEdgeMap[name]);
        }
      });
    }

    for (const key of Object.keys(outputEdgeMap))
    {
      if (!inputEdgeMap[key])
      {
        leaves.push(key);
        ranks[key] = 0;
        rankNodes(1, outputEdgeMap[key]);
      }
    }

    const ranksCount: number[] = [];
    const rankNextPos: [{x: number, y: number}] = [{x: 0, y: 0}];

    nodes.forEach((value: vgTypes.IProcessedGraphItem) =>
    {
      const layout = {x: 0, y: 0, h: 50, w: 50};

      if (this.propertiesConfig[value.type])
      {
        layout.h = this.propertiesConfig[value.type].height;
        layout.w = this.propertiesConfig[value.type].width;
      }

      const nRank = ranks[value.id] ? ranks[value.id] : 0;

      if (typeof ranksCount[nRank] === "undefined")
      {
        ranksCount[nRank] = 0;
      }
      else
      {
        ranksCount[nRank] = ranksCount[nRank] + 1;
      }

      // Position nodes in this rank based on the previous nodes height and
      // the nodes in the next rank based on the largest (width) node so far

      if (!rankNextPos[nRank])
      {
        rankNextPos[nRank] = {x: 0, y: 0};
      }

      layout.x = (rankNextPos[nRank].x) + (nRank === 0 ? marginPadding.x :
        layoutPadding.x);
      layout.y = (rankNextPos[nRank].y) + layoutPadding.y;

      rankNextPos[nRank] = {x: rankNextPos[nRank].x,
        y: layout.y + layout.h};

      if (!rankNextPos[nRank+1])
      {
        rankNextPos[nRank+1] = {x: 0, y: 0};
      }

      rankNextPos[nRank+1] = {x: Math.max(layout.x + layout.w,
        rankNextPos[nRank+1].x),
        y: rankNextPos[nRank+1].y};

      layoutNodes.push({...value, ...layout});
      this.layoutData[value.path] = {x: layout.x, y: layout.y};
    })

    this.updateLayout();

    const graph = { "nodes" : layoutNodes };
    success(graph);
  }

  //============================================================================
  // Graph Data
  //============================================================================

  // Get data for entire graph and create graph model
  private async getGraphData(path?: string)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem> =
        await this.rest.get<vgTypes.IRawGraphItem>('/graph' + (path ?
          "/" + path : ""));

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Graph Data Success");
        this.createGraphModel(res.result,
          path ? path : undefined);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Graph Data Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Graph Data Failure with error: " + error);
    }
  }

  // Create Graph model from processed raw graph data
  private createGraphModel(rawGraphData: vgTypes.IRawGraphItem,
    parentPath?: string)
  {
    const nodes: vgTypes.IProcessedGraphItem[] = [];

    if (rawGraphData.elements)
    {
      for (const itemID of Object.keys(rawGraphData.elements))
      {
        nodes.push(this.processSingleGraphItem(itemID,
          rawGraphData["elements"][itemID], parentPath));
      }
    }

    this.layoutGraph(nodes, (graph: any) =>
      {
        this.generateSuccess!(graph);
      });
  }

  // Process a single graph item into format to create Graph model
  // (see type definitions)
  // parentPath is the path to the node (graph item) parent e.g. graph/graph-1
  // in the case of subgraphs
  private processSingleGraphItem(itemID: string, item: vgTypes.IRawGraphItem,
    parentPath?: string)
  {
    const splitType = item.type.split("/");
    const itemSection = splitType[0];
    const itemType = splitType[1];
    const metadata = this.metadata[itemSection][itemType];

    // Edges
    const gEdges:
      Array<{ output: string, destId: string, input: string}> = [];

    if (item.outputs)
    {
      for (const outputID of Object.keys(item.outputs))
      {
        const connections = item.outputs[outputID].connections;
        if (connections)
        {
          connections.forEach(
            (connection: {element: string, input: string}) =>
            {
              gEdges.push({ output: outputID, destId: connection.element,
                input: connection.input})
            });
        }
      }
    }

    // Outputs
    const gOutputs: Array<{ id: string, type: string }> = [];

    const mOutputs = metadata.outputs;
    if (mOutputs)
    {
      for (const outputID of Object.keys(mOutputs))
      {
        gOutputs.push({id: outputID, type: mOutputs[outputID].type});
      }
    }

    // Inputs - position added later
    const gInputs:
      Array<{ id: string, type: string, x?: number, y?: number}> = [];

    const mInputs = metadata.inputs;
    if (mInputs)
    {
      for (const inputID of Object.keys(mInputs))
      {
        gInputs.push({id: inputID, type: mInputs[inputID].type});
      }
    }

    // Properties: inputs and settings
    const gProps: Array<{ id: string, value: any, valueType: string,
      propType: string, description?: string, controlType?: string,
      valueFormat?: string, rangeMin?: number, rangeMax?: number,
      increment?: number, available?: any[], x?: number, y?: number}> = [];

    const propsConfig = this.propertiesConfig[item.type];

    if (item.inputs)
    {
      for (const inputID of Object.keys(item.inputs))
      {
        const iPropsConfig = (propsConfig && propsConfig.properties[inputID] ?
          propsConfig.properties[inputID] : null);

        gProps.push(
        {
          id: inputID,
          value: item.inputs[inputID].value,
          valueType: item.inputs[inputID].type,
          propType: "input",
          ...iPropsConfig
        });

        // Add connector position to input
        const propInputIndex = gInputs.findIndex(x => x.id === inputID);

        if (propInputIndex >= 0 && iPropsConfig)
        {
          gInputs[propInputIndex] = {...gInputs[propInputIndex],
            ...iPropsConfig.connector};
        }
      }
    }

    if (item.settings)
    {
      for (const settingID of Object.keys(item.settings))
      {
        const sPropsConfig = (propsConfig && propsConfig.properties[settingID] ?
          propsConfig.properties[settingID] : {});

        gProps.push(
        {
          id: settingID,
          value: item.settings[settingID].value,
          valueType: item.settings[settingID].type,
          propType: "setting",
          ...sPropsConfig
        });
      }
    }

    // Subgraph (graph, clone)
    const gSubGraph = (itemType === "graph" || itemType === "clone");

    const node: vgTypes.IProcessedGraphItem =
    {
      id: itemID,
      name: metadata.name,
      type: item.type,
      path: parentPath ? parentPath + "/" + itemID : itemID,
      description: propsConfig ? propsConfig.description : "",
      inputs: gInputs,
      outputs: gOutputs,
      edges: gEdges,
      properties: gProps,
      subGraph: gSubGraph
    };

    return node;
  }
}

export const vgData = new Data();
