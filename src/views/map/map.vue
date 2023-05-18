<template>
  <div class="ol-map" id="map"></div>
  <div class="tool">
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
</template>

<script setup lang="ts">
import Map from "ol/Map"; // 地图实例方法
import View from "ol/View"; // 地图视图方法
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer"; // 瓦片渲染方法
import { XYZ, OSM } from "ol/source"; // 瓦片资源
import { onMounted, ref } from "vue";
import { ScaleLine, defaults as defaultControls } from "ol/control";
import { Crop, CirclePlus, Remove, Aim } from "@element-plus/icons-vue";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Style, Stroke, Fill, Circle } from "ol/style";

const map = ref<Map>();

const draw = ref<any>();
//实例化一个矢量图层Vector作为绘制层
const source = new VectorSource();

const tileLayer = new TileLayer({
  // 加载瓦片资源

  // source: new OSM(), //不建议使用，实际开发中会有问题
  source: new XYZ({
    url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}", // 高德瓦片资源
  }),
});

// 实例化地图
const initMap = () => {
  map.value = new Map({
    layers: [tileLayer],
    view: new View({
      projection: "EPSG:4326", //坐标类型：EPSG：4326：经纬度坐标，EPSG:3857：投影坐标
      center: [104.07, 30.6], //地图中心点
      zoom: 15, // 缩放级别
      minZoom: 0, // 最小缩放级别
      maxZoom: 18, // 最大缩放级别
      constrainResolution: true, // 因为存在非整数的缩放级别，所以设置该参数为true来让每次缩放结束后自动缩放到距离最近的一个整数级别，这个必须要设置，当缩放在非整数级别时地图会糊
    }),
    target: "map", // DOM容器

    //加载控件到地图容器中
    controls: defaultControls({
      zoom: false, // 不显示放大缩小按钮
      rotate: false, // 不显示指北针控件
      attribution: false, // 不显示右下角地图信息控件
    }).extend([
      new ScaleLine({
        //设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
        units: "metric",
      }),
    ]),
  });

  // 区域绘制图层
  var vectorLayer = new VectorLayer({
    source: source,
    style: new Style({
      fill: new Fill({
        //填充样式
        color: "rgba(252,85,49, 0.2)",
      }),
      stroke: new Stroke({
        //线样式
        color: "#fc5531",
        width: 2,
      }),
      image: new Circle({
        //点样式
        radius: 7,
        fill: new Fill({
          color: "#fc5531",
        }),
      }),
    }),
  });
  //将绘制层添加到地图容器中
  map.value!.addLayer(vectorLayer);
};

// 缩小
const zoomOut = () => {
  // 使用map对象获取view视图，然后设置View视图的放大，缩小参数即可
  const view = map.value!.getView();
  const zoom = view.getZoom();
  view.setZoom(zoom! - 1);
};

//放大
const zoomIn = () => {
  const view = map.value!.getView();
  const zoom = view.getZoom();
  view.setZoom(zoom! + 1);
};

//圆形绘制
const drawCircle = () => {
  if (draw.value !== undefined && draw.value !== null) {
    map.value?.removeInteraction(draw.value!);
  }
  draw.value = new Draw({
    source: source,
    type: "Circle",
  });
  map.value!.addInteraction(draw.value);
  draw.value.on("drawend", function (e: any) {
    // 绘制结束时获取数据
  });
};

// 绘制多边形
const drawPolygon = () => {
  if (draw.value !== undefined && draw.value !== null) {
    map.value?.removeInteraction(draw.value!);
  }
  draw.value = new Draw({
    source: source,
    type: "Polygon",
  });
  map.value!.addInteraction(draw.value);
  draw.value.on("drawend", function (e: any) {
    // 绘制结束时获取数据
  });
};

onMounted(() => {
  initMap();
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
