import React, { useState, useEffect } from "react";
import { Stage, Layer, Circle, Text, Rect, Group, Image } from "react-konva";
import Konva from "konva";
import useImage from "use-image";

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
  const editText = (obj) => {
    var editButton = obj.currentTarget;
    var textPosition = editButton.getAbsolutePosition();
    //adjusting back to the beginning of the node
    textPosition.x -= width;
    console.log(textPosition);
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
      <Image
        image={editIcon}
        stroke={"green"}
        x={width}
        scaleX={iconScale}
        scaleY={iconScale}
        visible={showEditorPanel}
        onClick={(e) => {
          setEditing(true);
          editText(e);
        }}
      ></Image>
      <Image
        image={deleteIcon}
        stroke={"red"}
        x={width}
        y={deleteIconVerticalOffset}
        scaleX={iconScale}
        scaleY={iconScale}
        visible={showEditorPanel}
        onClick={() => {
          props.deleteNode(props.id);
        }}
      ></Image>
    </Group>
  );
};

const ArgGraph = () => {
  const [nodes, setNodes] = React.useState([]);
  const [args, setArgs] = React.useState([]);
  const [conflicts, setConflicts] = React.useState([]);

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

  const spawnNode = () => {
    setNodes(
      nodes.concat({
        x: mousePos.x,
        y: mousePos.y,
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
      onDblClick={spawnNode}
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
