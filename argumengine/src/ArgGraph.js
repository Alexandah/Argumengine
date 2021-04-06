import React, { useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Circle,
  Text,
  Rect,
  Group,
  Image,
  Arrow,
  Line,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { NetworkCellRounded } from "@material-ui/icons";

const defaultEditorMode = {
  create: { node: false, edge: false },
  edit: { node: false, edge: false },
};

function getRelativePosition(startPos, destPos) {
  //vector math: s + x = d <--> x = d - s
  var relativePos = { x: destPos.x - startPos.x, y: destPos.y - startPos.y };
  return relativePos;
}

const EditorMenu = ({
  menu,
  mousePos,
  parentPos,
  editorMode,
  setEditorMode,
  requestedEditorMode,
  visibilityCondition,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  //closes editor menu if they click away
  const handleClick = () => {
    setVisible(false);
  };

  const updatedEditorMode = (requestedEditorMode) => {
    var newMode = requestedEditorMode;
    //give precedence to edit over create
    //this avoids double menus when clicking objects, since this
    //also counts as clicking the canvas
    if (editorMode.edit.node || editorMode.edit.edge) {
      newMode.create.node = false;
      newMode.create.edge = false;
    }
    //give precedence to node edits over edge edits
    //covers the edge case when a node and edge overlap
    if (editorMode.edit.node) newMode.edit.edge = false;
    return newMode;
  };

  //overrides the default right click behavior
  const handleRightClick = (e) => {
    e.preventDefault();
    var relativeTo = parentPos;
    setPosition(getRelativePosition(relativeTo, mousePos));
    if (visibilityCondition())
      setEditorMode(updatedEditorMode(requestedEditorMode));
    if (visibilityCondition() && requestedEditorMode == editorMode)
      setVisible(true);
    else setVisible(false);
  };

  useEffect(() => {
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("click", handleClick);
    //cleans up listeners when the component is removed
    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("click", handleClick);
    };
  });

  return (
    <Group x={position.x} y={position.y} visible={visible}>
      {menu}
    </Group>
  );
};

const Node = (props) => {
  const [editing, setEditing] = useState(false);
  const [mayShowEditorPanel, setMayShowEditorPanel] = useState(false);
  const iconScale = 0.7;
  const [editIcon] = useImage("/editicon.png");
  const deleteIconVerticalOffset = 27;
  const [deleteIcon] = useImage("/deleteicon.png");

  const selectedShadowOpacity = 0.7;
  const [shadowOpacity, setShadowOpacity] = useState(0);
  //turn on shadow iff node is selected
  useEffect(() => {
    if (props.selected) setShadowOpacity(selectedShadowOpacity);
    else setShadowOpacity(0);
  }, [props.selected]);

  const maxWidth = 150;
  const minWidth = 100;
  const minHeight = minWidth / 2;
  const lettersPerPixelHorizontal = 25 / 100;
  const lettersPerLine = lettersPerPixelHorizontal * 100;
  const verticalPixelsPerLine = 15;
  const getLines = () => {
    let letters = props.text.length;
    var lines = 0;
    while (letters - lettersPerLine > 0) {
      lines++;
      letters -= lettersPerLine;
    }
    return lines;
  };
  const [width, setWidth] = React.useState(minWidth);
  const [height, setHeight] = React.useState(minHeight);

  const updateNodeSize = () => {
    let letters = props.text.length;
    let newWidth = letters / lettersPerPixelHorizontal;
    let newHeight = getLines() * verticalPixelsPerLine;
    newWidth = minWidth > newWidth ? minWidth : newWidth;
    newWidth = newWidth > maxWidth ? maxWidth : newWidth;
    newHeight = minHeight > newHeight ? minHeight : newHeight;
    setWidth(newWidth);
    setHeight(newHeight);
  };

  useEffect(() => {
    updateNodeSize();
  }, [editing, width, height]);

  //for scaling the text editing box
  const getRows = () => {
    return Math.max(getLines(), 3);
  };
  const colsPerPixelHorizontal = 20 / 150;
  const getCols = () => {
    if (width == maxWidth) return 20;
    let letters = props.text.length;
    let horizontalPixels = letters / lettersPerPixelHorizontal;
    let cols = Math.round(horizontalPixels * colsPerPixelHorizontal);
    if (cols < 13) return 13;
    return cols;
  };

  //Since Konva does not support placing a text editing
  //object directly into a group, we have to manually create
  //one on top of it using javascript :(
  const editText = (textBoxPos) => {
    //var editButton = obj.currentTarget;
    //var textPosition = editButton.getAbsolutePosition();
    var textPosition = textBoxPos;
    //adjusting back to the beginning of the node
    //textPosition.x -= width;
    //console.log(textPosition);
    var textarea = document.createElement("textarea");
    textarea.value = props.text;
    textarea.style.position = "absolute";
    textarea.style.top = textPosition.y + "px";
    textarea.style.left = textPosition.x + "px";
    textarea.cols = getCols();
    textarea.rows = getRows();
    document.body.appendChild(textarea);
    textarea.focus();
    function endTextEdit() {
      //if (editing) {
      props.updateNodeText(props.id, textarea.value);
      document.body.removeChild(textarea);
      setEditing(false);
      //}
    }
    textarea.addEventListener("keydown", function (e) {
      if (e.keyCode === 13) endTextEdit();
    });
    textarea.addEventListener("focusout", function (e) {
      //endTextEdit();
    });
  };

  var requestedEditorMode = defaultEditorMode;
  if (mayShowEditorPanel) requestedEditorMode.edit.node = true;

  return (
    <Group
      x={props.x}
      y={props.y}
      draggable
      onClick={() => {
        if (!editing) props.toggleSelected(props.id);
        props.onClick();
      }}
      onDragMove={(e) => {
        var pos = e.currentTarget.getAbsolutePosition();
        props.updateNodePos(props.id, pos.x, pos.y);
      }}
      onMouseEnter={() => setMayShowEditorPanel(true)}
      onMouseLeave={() => setMayShowEditorPanel(false)}
    >
      <Rect
        stroke={"black"}
        width={width}
        height={height}
        fill={"#F3F3F3"}
        cornerRadius={10}
        shadowBlur={10}
        shadowColor={"black"}
        shadowOffsetX={15}
        shadowOffsetY={15}
        shadowOpacity={shadowOpacity}
      ></Rect>
      <Text
        text={props.text}
        align={"center"}
        height={height}
        width={width}
      ></Text>
      <EditorMenu
        visibilityCondition={() => {
          return mayShowEditorPanel;
        }}
        mousePos={props.mousePos}
        parentPos={{ x: props.x, y: props.y }}
        editorMode={props.editorMode}
        setEditorMode={props.setEditorMode}
        requestedEditorMode={requestedEditorMode}
        menu={
          <Group>
            <Image
              image={editIcon}
              stroke={"green"}
              scaleX={iconScale}
              scaleY={iconScale}
              onClick={(e) => {
                setEditing(true);
                var screenPos = e.currentTarget.getAbsolutePosition();
                editText(screenPos);
              }}
            ></Image>
            <Image
              image={deleteIcon}
              stroke={"red"}
              y={deleteIconVerticalOffset}
              scaleX={iconScale}
              scaleY={iconScale}
              onClick={() => {
                setEditing(true);
                props.deleteNode(props.id);
              }}
            ></Image>
          </Group>
        }
      ></EditorMenu>
    </Group>
  );
};

//where points is a list of javascript objects
//with x y coordinate properties
const computeAveragePoint = (points) => {
  var avgX = 0;
  var avgY = 0;
  //Object.keys(points).map(key => {
  //  points[key]
  //})
  for (var i = 0; i < points.length; i++) {
    let point = points[i];
    avgX += point.x;
    avgY += point.y;
  }
  avgX /= points.length;
  avgY /= points.length;
  var avgPoint = { x: avgX, y: avgY };
  return avgPoint;
};

//The various kinds of edges are drawn by having each part
//from premise nodes meet at a central point. This is that point.
const computeMergePoint = (points) => {
  var mergePoint = computeAveragePoint(points);
  return mergePoint;
};

//Konva lines/arrows only accept a flattened array of points.
//s.t. [x0, y0, x1, y1, ...]
const pointListToKonvaLine = (points) => {
  var line = [];
  for (var i = 0; i < points.length; i++) {
    let point = points[i];
    line.push(point.x, point.y);
  }
  return line;
};

const computeStartPointFromPremise = (premise) => {
  //for now, I'm just going to have it start from the bottom middle
  //of each premise node. In the future, perhaps depending on where
  //the conclusion is we could move it to another part of the node.
  //Also, I will need to add premise width/height to the ArgGraph
  //storage to do this consistently
  var width = 100;
  var height = width / 2;
  return { x: premise.x + width / 2, y: premise.y + height };
};

const Argument = ({ mousePos, creating, premises, conclusion }) => {
  const makePremiseToMergePointArrows = (premises, mergepoint) => {
    var arrows = [];
    for (var i = 0; i < premises.length; i++) {
      var premise = premises[i];
      arrows.push(
        <Arrow
          points={pointListToKonvaLine([premise, mergepoint])}
          tension={100}
          stroke={"black"}
          fill={"black"}
        ></Arrow>
      );
    }
    return arrows;
  };

  const makeMergePointToConclusionArrow = (mergepoint, conclusion) => {
    return (
      <Arrow
        points={pointListToKonvaLine([mergepoint, conclusion])}
        stroke={"black"}
        fill={"black"}
      ></Arrow>
    );
  };

  const makeArgumentEdge = (premises, conclusion) => {
    premises = premises.map((premise) => {
      return computeStartPointFromPremise(premise);
    });
    var allPoints = premises.map((p) => {
      return p;
    });
    allPoints.push(conclusion);
    var arrows;
    if (premises.length > 1) {
      var mergepoint = computeMergePoint(allPoints);
      arrows = makePremiseToMergePointArrows(premises, mergepoint);
      arrows.push(makeMergePointToConclusionArrow(mergepoint, conclusion));
    } else {
      arrows = makeMergePointToConclusionArrow(premises[0], conclusion);
    }
    return <Group>{arrows}</Group>;
  };

  var destNode;
  if (creating) {
    var followPos = mousePos;
    followPos.x -= 10;
    followPos.y -= 10;
    destNode = followPos;
  } else destNode = conclusion;
  return makeArgumentEdge(premises, destNode);
};

const Conflict = ({ nodes }) => {
  const makeNodeToMergePointLines = (mergepoint) => {
    var lines = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      lines.push(
        <Line
          points={pointListToKonvaLine([node, mergepoint])}
          stroke={"red"}
          fill={"red"}
        ></Line>
      );
    }
    return lines;
  };

  const makeConflictEdge = () => {
    var connectionPoints = nodes.map((node) => {
      return computeStartPointFromPremise(node);
    });
    var lines;
    if (connectionPoints.length > 1) {
      var mergepoint = computeMergePoint(nodes);
      lines = makeNodeToMergePointLines(mergepoint);
    }

    return <Group>{lines}</Group>;
  };

  return makeConflictEdge();
};

const ArgGraph = () => {
  const [editorMode, setEditorMode] = useState(defaultEditorMode);
  const [nextAvailiableId, setNextAvailiableId] = useState(0);

  const [nodes, setNodes] = React.useState({});
  const [args, setArgs] = React.useState({});
  const [conflicts, setConflicts] = React.useState({});

  const [argBeingCreated, setArgBeingCreated] = React.useState(null);

  const initialCanvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const initialCanvasPos = {
    x: -initialCanvasSize.width / 2,
    y: -initialCanvasSize.height / 2,
  };
  const [canvasPos, setCanvasPos] = React.useState(initialCanvasPos);
  const [canvasScale, setCanvasScale] = React.useState(1);
  const canvasScaleFactor = 1.05;
  const scaleByScrolling = (e) => {
    e.evt.preventDefault();
    var oldScale = canvasScale;
    var newScale =
      e.evt.deltaY < 0
        ? oldScale * canvasScaleFactor
        : oldScale / canvasScaleFactor;
    setCanvasScale(newScale);
  };

  const getSelected = () => {
    var selectedNodes = Object.keys(nodes).map((key) => {
      var node = nodes[key];
      if (node.selected) return node;
    });
    selectedNodes = selectedNodes.filter((node) => node !== undefined);
    return selectedNodes;
  };

  const isAnySelected = () => {
    var selectedNodes = getSelected();
    if (selectedNodes[0] === undefined) return false;
    return selectedNodes.length > 0;
  };

  const toggleSelected = (selectedId) => {
    console.log("toggleSelected running on id: " + selectedId);
    console.log(nodes);
    nodes[selectedId].selected = !nodes[selectedId].selected;
    setNodes(nodes);
    console.log("adjusted mouse pos: ", mousePos);
  };

  const [mousePos, setMousePos] = React.useState();
  const trackMouse = (e) => {
    var pos = e.currentTarget.getPointerPosition();
    pos = getRelativePosition(canvasPos, pos);
    //unscale the mouse pos to ensure it doesn't overshoot
    pos = { x: pos.x / canvasScale, y: pos.y / canvasScale };
    setMousePos(pos);
  };

  const spawnNode = (pos) => {
    var newNodes = nodes;
    var newNode = {
      id: nextAvailiableId,
      x: pos.x,
      y: pos.y,
      text: "",
      selected: false,
      connectedArgs: {},
    };
    newNodes["node" + nextAvailiableId] = newNode;
    console.log("mousePos: ", mousePos);
    console.log("newNode: ", newNode);
    setNextAvailiableId(nextAvailiableId + 1);
    setNodes(newNodes);
  };

  const deleteNode = (selectedId) => {
    var nodeToDelete = nodes[selectedId];
    var argsToDelete = nodeToDelete.connectedArgs;
    Object.keys(argsToDelete).forEach((argId) => {
      if (argId.indexOf("arg") === -1) deleteConf(argId);
      else deleteArg(argId);
    });
    delete nodes[selectedId];
    setNodes(nodes);
  };

  const updateNodePos = (selectedId, x, y) => {
    var updatedNodePos = getRelativePosition(canvasPos, { x: x, y: y });
    nodes[selectedId].x = updatedNodePos.x;
    nodes[selectedId].y = updatedNodePos.y;
    setNodes(nodes);
  };

  const updateNodeText = (selectedId, text) => {
    nodes[selectedId].text = text;
    setNodes(nodes);
  };

  const beginCreatingArgument = (premises) => {
    var newArgs = args;
    var newArg = {
      id: nextAvailiableId,
      creating: true,
      premises: premises,
      conclusion: null,
    };
    newArgs["arg" + nextAvailiableId] = newArg;
    setNextAvailiableId(nextAvailiableId + 1);
    setArgs(newArgs);
    setArgBeingCreated(newArg);
  };

  const cancelCreatingArgument = () => {
    var newArgs = args;
    var argToCancel = argBeingCreated;
    if (argToCancel !== null) {
      delete newArgs["arg" + argBeingCreated.id];
      setArgs(newArgs);
      setArgBeingCreated(null);
    }
  };

  const finishCreatingArgument = (conclusion) => {
    var arg = argBeingCreated;
    var newArgs = args;
    arg.creating = false;
    arg.conclusion = conclusion;
    newArgs["arg" + arg.id] = arg;
    setArgs(newArgs);
    setArgBeingCreated(null);
    var connectedNodes = arg.premises.concat(conclusion);
    var newNodes = nodes;
    for (var i = 0; i < connectedNodes.length; i++) {
      var node = newNodes["node" + connectedNodes[i].id];
      node.connectedArgs["arg" + arg.id] = "arg" + arg.id;
    }
    setNodes(newNodes);
  };

  const deleteArg = (id) => {
    var argToDelete = args[id];
    console.log("deleting arg: " + id);
    var nodesToUpdate = argToDelete.premises.concat(argToDelete.conclusion);
    nodesToUpdate.forEach((node) => {
      delete node.connectedArgs[id];
    });
    setNodes(nodes);
    delete args[id];
    setArgs(args);
  };

  const spawnConf = (conflictingNodes) => {
    var newConfs = conflicts;
    var newConf = { id: nextAvailiableId, nodes: conflictingNodes };
    newConfs["conf" + newConf.id] = newConf;
    setConflicts(newConfs);
    var connectedNodes = newConf.nodes;
    var newNodes = nodes;
    for (var i = 0; i < connectedNodes.length; i++) {
      var node = newNodes["node" + connectedNodes[i].id];
      node.connectedArgs["conf" + newConf.id] = "conf" + newConf.id;
    }
    setNodes(newNodes);
  };

  const deleteConf = (id) => {
    var confToDelete = conflicts[id];
    var nodesToUpdate = confToDelete.nodes;
    nodesToUpdate.forEach((node) => {
      delete node.connectedArgs[id];
    });
    setNodes(nodes);
    delete conflicts[id];
    setArgs(args);
  };

  var creationEditorMenuElements = [];
  if (editorMode.create.node)
    creationEditorMenuElements.push(
      <Circle
        stroke={"black"}
        radius={25}
        fill={"green"}
        onClick={() => {
          spawnNode(mousePos);
        }}
      ></Circle>
    );
  if (editorMode.create.edge)
    creationEditorMenuElements.push(
      <Circle
        stroke={"black"}
        radius={25}
        y={50}
        fill={"red"}
        onClick={() => {
          spawnConf(getSelected());
        }}
      ></Circle>,
      <Circle
        stroke={"black"}
        radius={25}
        y={100}
        fill={"blue"}
        onClick={() => beginCreatingArgument(getSelected())}
      ></Circle>
    );

  var requestedEditorMode = defaultEditorMode;
  requestedEditorMode.create.node = true;
  if (isAnySelected()) requestedEditorMode.create.edge = true;

  return (
    <div>
      <Stage
        width={initialCanvasSize.width}
        height={initialCanvasSize.height}
        x={canvasPos.x}
        y={canvasPos.y}
        onMouseMove={trackMouse}
        onDblClick={() => spawnNode(mousePos)}
        draggable
        onDragMove={(e) => {
          var pos = e.currentTarget.getAbsolutePosition();
          setCanvasPos(pos);
        }}
        style={{
          margin: "0.5rem",
          backgroundColor: "#eee",
          display: "inline-block",
        }}
        scale={{ x: canvasScale, y: canvasScale }}
        onWheel={scaleByScrolling}
      >
        <Layer>
          {Object.keys(nodes).map((nodeKey, i) => {
            let node = nodes[nodeKey];
            return (
              <Node
                key={i}
                id={nodeKey}
                x={node.x}
                y={node.y}
                text={node.text}
                selected={node.selected}
                toggleSelected={toggleSelected}
                updateNodePos={updateNodePos}
                updateNodeText={updateNodeText}
                deleteNode={deleteNode}
                mousePos={mousePos}
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                onClick={() => {
                  if (argBeingCreated !== null) {
                    finishCreatingArgument(node);
                  }
                }}
              ></Node>
            );
          })}
          {Object.keys(args).map((argKey, i) => {
            let arg = args[argKey];
            return (
              <Argument
                key={i}
                id={argKey}
                mousePos={mousePos}
                creating={arg.creating}
                premises={arg.premises}
                conclusion={arg.conclusion}
              ></Argument>
            );
          })}
          {Object.keys(conflicts).map((conflictKey, i) => {
            let conf = conflicts[conflictKey];
            return (
              <Conflict key={i} id={conflictKey} nodes={conf.nodes}></Conflict>
            );
          })}
          <EditorMenu
            editorMode={editorMode}
            setEditorMode={setEditorMode}
            requestedEditorMode={requestedEditorMode}
            visibilityCondition={() => {
              return editorMode.create.node || editorMode.create.edge;
            }}
            mousePos={mousePos}
            parentPos={{ x: 0, y: 0 }}
            menu={<Group>{creationEditorMenuElements}</Group>}
          ></EditorMenu>
        </Layer>
      </Stage>
    </div>
  );
};

export default ArgGraph;
