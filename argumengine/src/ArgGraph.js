import React, { useState, useEffect } from "react";
import { Stage, Layer, Circle, Text, Rect, Group, Image } from "react-konva";
import Konva from "konva";
import useImage from "use-image";

const EditorMenu = ({ visibilityCondition, menu }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  //closes editor menu if they click away
  const handleClick = () => {
    setVisible(false);
  };

  //overrides the default right click behavior
  const handleRightClick = (e) => {
    e.preventDefault();
    //setPosition({ x: e.pageX, y: e.pageY });
    setPosition({ x: 0, y: 0 });
    if (visibilityCondition) setVisible(true);
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
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);

  const [showEditorPanel, setShowEditorPanel] = useState(false);
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
    let letters = text.length;
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
    let letters = text.length;
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
  }, [text]);

  //for scaling the text editing box
  const getRows = () => {
    return Math.max(getLines(), 3);
  };
  const colsPerPixelHorizontal = 20 / 150;
  const getCols = () => {
    if (width == maxWidth) return 20;
    let letters = text.length;
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
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.top = textPosition.y + "px";
    textarea.style.left = textPosition.x + "px";
    textarea.cols = getCols();
    textarea.rows = getRows();
    document.body.appendChild(textarea);
    textarea.focus();
    function endTextEdit() {
      //if (editing) {
      setText(textarea.value);
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
      onClick={() => props.toggleSelected(props.id)}
      onDragMove={(e) => {
        var pos = e.currentTarget.getAbsolutePosition();
        props.updateNodePos(props.id, pos.x, pos.y);
      }}
      onMouseEnter={() => setShowEditorPanel(true)}
      onMouseLeave={() => setShowEditorPanel(false)}
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
      <Text text={text} align={"center"} height={height} width={width}></Text>
      <EditorMenu
        visibilityCondition={showEditorPanel}
        menu={
          <Group>
            <Image
              image={editIcon}
              stroke={"green"}
              //x={width}
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
              //x={width}
              y={deleteIconVerticalOffset}
              scaleX={iconScale}
              scaleY={iconScale}
              onClick={() => {
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
  const [nodes, setNodes] = React.useState([]);
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

  const toggleSelected = (selectedIndex) => {
    setNodes(
      nodes.map((node, index) => {
        if (index == selectedIndex) {
          node.selected = !node.selected;
          return node;
        } else return node;
      })
    );
  };

  const [mousePos, setMousePos] = React.useState();
  const trackMouse = (e) => {
    var pos = e.currentTarget.getPointerPosition();
    setMousePos(pos);
  };

  const spawnNode = (pos) => {
    setNodes(
      nodes.concat({
        x: pos.x,
        y: pos.y,
        selected: false,
      })
    );
  };

  const updateNodePos = (selectedIndex, x, y) => {
    setNodes(
      nodes.map((node, index) => {
        if (index == selectedIndex) {
          node.x = x;
          node.y = y;
          return node;
        } else return node;
      })
    );
  };

  const deleteNode = (selectedIndex) => {
    setNodes(nodes.filter((node, i) => i !== selectedIndex));
    console.log(nodes);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={trackMouse}
      onDblClick={() => spawnNode(mousePos)}
    >
      <Layer>
        {nodes.map((node, i) => {
          return (
            <Node
              key={i}
              id={i}
              x={node.x}
              y={node.y}
              selected={node.selected}
              toggleSelected={toggleSelected}
              updateNodePos={updateNodePos}
              deleteNode={deleteNode}
            ></Node>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default ArgGraph;
