<template>
  <div class="ol-map" id="map"></div>
</template>

<script setup lang="ts">
import Map from "ol/Map"; // 地图实例方法
import View from "ol/View"; // 地图视图方法
import { Tile as TileLayer } from "ol/layer"; // 瓦片渲染方法
import { XYZ, OSM } from "ol/source"; // 瓦片资源
import { onMounted, ref } from "vue";

const tileLayer = new TileLayer({
  // 加载瓦片资源
  // source: new OSM(), //不建议使用，实际开发中会有问题
  source: new XYZ({
    url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}", // 高德瓦片资源
  }),
});

// 实例化地图
const initMap = () => {
  new Map({
    layers: [tileLayer],
    view: new View({
      projection: "EPSG:4326", //坐标类型：EPSG：4326：经纬度坐标，EPSG:3857：投影坐标
      center: [114.064839, 22.548857], //地图中心点
      zoom: 15, // 缩放级别
      minZoom: 0, // 最小缩放级别
      maxZoom: 18, // 最大缩放级别
      constrainResolution: true, // 因为存在非整数的缩放级别，所以设置该参数为true来让每次缩放结束后自动缩放到距离最近的一个整数级别，这个必须要设置，当缩放在非整数级别时地图会糊
    }),
    target: "map", // DOM容器
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
</style>
