<template>
  <div class="ol-map" id="map"></div>
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
    <div class="tool-item" @click="zoomIn()">
      <el-icon :size="20"><CirclePlus /></el-icon
      ><span class="operation">放大</span>
    </div>
    <div class="tool-item" @click="zoomOut()">
      <el-icon :size="20"><Remove /></el-icon
      ><span class="operation">缩小</span>
    </div>
  </div>
  <div id="popup" class="ol-popup">
    <a href="#" id="popup-closer" class="ol-popup-closer"></a>
    <div id="popup-title" class="popup-title"></div>
    <div id="popup-content" class="popup-content"></div>
  </div>
  <div id="info_popup"></div>
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
} from "@element-plus/icons-vue";
import markers from "./data/marker";

const map = ref();

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
  await map.value.drawLine();
  //开始动
  map.value.moveStart();
};

const showMarker = () => {
  map.value.polymerization(markers);
};

onMounted(() => {
  map.value = new Map();
});
</script>
<style scoped>
@import "node_modules/ol/ol.css";
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
</style>
