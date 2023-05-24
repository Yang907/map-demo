<template>
  <div class="ol-map" id="map"></div>
  <!-- 工具 -->
  <div class="tool">
    <div class="tool-item" @click="showMarker()">
      <el-icon :size="20"><Location /></el-icon
      ><span class="operation">点位标注</span>
    </div>
    <div class="tool-item" @click="changeLayer()">
      <el-icon :size="20"><HelpFilled /></el-icon
      ><span class="operation">图层切换</span>
    </div>
    <div class="tool-item" @click="addTrack()">
      <el-icon :size="20"><Position /></el-icon
      ><span class="operation">轨迹回放</span>
    </div>
    <div class="tool-item" @click="drawCircle()">
      <el-icon :size="20"><Aim /></el-icon
      ><span class="operation">圆形框选</span>
    </div>
    <div class="tool-item" @click="drawPolygon()">
      <el-icon :size="20"><Crop /></el-icon
      ><span class="operation">多边形框选</span>
    </div>
    <div
      class="tool-item"
      @click="deleteSelected()"
      :class="!selected.length ? 'disabled' : ''"
    >
      <el-icon :size="20"><Delete /></el-icon
      ><span class="operation">删除</span>
    </div>
    <div class="tool-item" @click="zoomIn()">
      <el-icon :size="20"><CirclePlus /></el-icon
      ><span class="operation">放大</span>
    </div>
    <div class="tool-item" @click="zoomOut()">
      <el-icon :size="20"><Remove /></el-icon
      ><span class="operation">缩小</span>
    </div>
  </div>
  <!-- 点位标注信息显示容器 -->
  <div id="pup-container" class="pup-container">
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-title" class="popup-title"></div>
      <div id="popup-position" class="popup-position"></div>
      <div id="popup-content" class="popup-content"></div>
    </div>
  </div>
  <!-- 鼠标坐标显示容器 -->
  <div id="mouse-position"></div>
</template>

<script setup lang="ts">
import Map from "./map";
import { onMounted, ref } from "vue";
import {
  Crop,
  CirclePlus,
  Remove,
  Aim,
  Position,
  HelpFilled,
  Location,
  Delete,
} from "@element-plus/icons-vue";
import markers from "./data/marker";
import geometry from "./data/trajectory";
import { createStringXY } from "ol/coordinate";
import { MousePosition, ScaleLine } from "ol/control";

const map = ref();
const selected = ref<any[]>([]);

// 缩小
const zoomOut = () => {
  map.value.zoomOut();
};

//放大
const zoomIn = () => {
  map.value.zoomIn();
};

//圆形绘制
const drawCircle = () => {
  map.value.drawCircle();
};

// 绘制多边形
const drawPolygon = () => {
  map.value.drawPolygon();
};

// 改变图层
const changeLayer = () => {
  map.value.changeMapLayer();
};

//添加矢量图层
const addTrack = async () => {
  //画轨迹线
  await map.value.drawLine(geometry);
  //开始动
  map.value.moveStart(geometry);
};

const showMarker = () => {
  map.value.polymerization(markers);
};

const deleteSelected = () => {
  map.value.deleteFeature();
  selected.value = [];
};
onMounted(() => {
  map.value = new Map({
    zoom: false, // 是否显示缩放按钮
    rotate: false,
    attribution: true,
    otherControls: [
      new ScaleLine({
        //设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
        units: "metric",
      }),
      // 鼠标所在位置坐标显示
      new MousePosition({
        //坐标格式
        coordinateFormat: createStringXY(5),
        //地图投影坐标系（若未设置则输出为默认投影坐标系下的坐标）
        projection: "EPSG:4326",
        //坐标信息显示样式类名，默认是'ol-mouse-position'
        className: "custom-mouse-position",
        //显示鼠标位置信息的目标容器
        target: document.getElementById("mouse-position") as any,
      }),
    ],
  });
  //区域选中方法
  map.value.handleSelected(function (data: any) {
    selected.value = [...data];
  });
});
</script>
<style src="node_modules/ol/ol.css"></style>
<style scoped>
html,
body {
  margin: 0;
  height: 100%;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.tool {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 60px;
  /* height: 330px; */
  border-radius: 10px;
  background-color: #fff;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.tool .tool-item {
  width: 100%;
  text-align: center;
  cursor: pointer;
  padding: 10px 0;
}
.tool .tool-item:hover {
  background-color: cornflowerblue;
  color: #fff;
}
.operation {
  font-size: 12px;
  display: block;
}
.pup-container {
  padding-bottom: 30px;
  opacity: 1;
  display: none;
}
.ol-popup {
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  position: relative;
}

.ol-popup::after {
  content: "";
  display: inline-block;
  width: 20px;
  height: 10px;
  position: absolute;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  background-color: rgba(0, 0, 0, 0.8);
  bottom: -10px;
  left: 50%;
  transform: translateX(-10px);
}
#mouse-position {
  background-color: #fff;
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 2px 5px;
}
.disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
