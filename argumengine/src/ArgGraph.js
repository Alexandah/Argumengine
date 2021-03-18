import React, { useState, useEffect } from "react";
import { Stage, Layer, Circle, Text, Rect, Group, Image } from "react-konva";
import Konva from "konva";
import useImage from "use-image";

function getRelativePosition(startPos, destPos) {
  //vector math: s + x = d <--> x = d - s
  var relativePos = { x: destPos.x - startPos.x, y: destPos.y - startPos.y };
  return relativePos;
}

const EditorMenu = ({ visibilityCondition, menu, mousePos, parentPos }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  //closes editor menu if they click away
  const handleClick = () => {
    setVisible(false);
  };

  //overrides the default right click behavior
  const handleRightClick = (e) => {
    e.preventDefault();
    var relativeTo = parentPos;
    setPosition(getRelativePosition(relativeTo, mousePos));
    if (visibilityCondition) setVisible(true);
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
  }, [editing]);

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

  return (
    <Group
      x={props.x}
      y={props.y}
      draggable
      onClick={() => {
        if (!editing) props.toggleSelected(props.id);
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
        visibilityCondition={mayShowEditorPanel}
        mousePos={props.mousePos}
        parentPos={{ x: props.x, y: props.y }}
        menu={
          <Group>
            <Image
              image={editIcon}
              stroke={"green"}
              scaleX={iconScale}
              scaleY={iconScale}
              onClick={() => {
                setEditing(true);
                editText({ x: props.x, y: props.y });
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

const ArgGraph = () => {
  const [nextAvailiableId, setNextAvailiableId] = useState(0);
  const [nodes, setNodes] = React.useState({});
  const [args, setArgs] = React.useState([]);
  const [conflicts, setConflicts] = React.useState([]);

  const [isCreatingArg, setIsCreatingArg] = React.useState(false);
  const [isCreatingConf, setIsCreatingConf] = React.useState(false);

  //where points is a list of javascript objects
  //with x y coordinate properties
  const computeAveragePoint = (points) => {
    var avgX = 0;
    var avgY = 0;
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

  const getSelected = () => {
    return nodes.filter((node) => node.selected);
  };

  //The various kinds of edges are drawn by having each part
  //from premise nodes meet at a central point. This is that point.
  const computeMergePoint = (points) => {
    var mergePoint = computeAveragePoint(points);
    return mergePoint;
  };

  const pointListToKonvaLine = (points) => {
    var line = [];
    for (var i = 0; i < points.length; i++) {
      let point = points[i];
      line.push(point.x, point.y);
    }
    return line;
  };

  const toggleSelected = (selectedId) => {
    console.log("toggleSelected running on id: " + selectedId);
    nodes[selectedId].selected = !nodes[selectedId].selected;
    setNodes(nodes);
  };

  const [mousePos, setMousePos] = React.useState();
  const trackMouse = (e) => {
    var pos = e.currentTarget.getPointerPosition();
    setMousePos(pos);
  };

  const spawnNode = (pos) => {
    console.log("spawnNode running");
    var newNodes = nodes;
    var newNode = {
      id: nextAvailiableId,
      x: pos.x,
      y: pos.y,
      text: "",
      selected: false,
    };
    newNodes["node" + nextAvailiableId] = newNode;
    setNextAvailiableId(nextAvailiableId + 1);
    setNodes(newNodes);
  };

  const updateNodePos = (selectedId, x, y) => {
    console.log("updateNodePos running on id: " + selectedId);
    nodes[selectedId].x = x;
    nodes[selectedId].y = y;
    setNodes(nodes);
  };

  const updateNodeText = (selectedId, text) => {
    nodes[selectedId].text = text;
    setNodes(nodes);
  };

  const deleteNode = (selectedId) => {
    console.log("deleteNode running on id: " + selectedId);
    console.log(nodes);
    delete nodes[selectedId];
    setNodes(nodes);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={trackMouse}
      onDblClick={() => spawnNode(mousePos)}
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
            ></Node>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default ArgGraph;
