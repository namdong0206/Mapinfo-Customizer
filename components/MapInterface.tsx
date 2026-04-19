'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapLibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import { toPng } from 'html-to-image';
import { 
  Map as MapIcon, 
  Square, 
  Route, 
  Download, 
  Trash2, 
  Search,
  Plus,
  Layers,
  Info,
  MapPin,
  Car,
  Bike,
  Footprints,
  Flag,
  Home,
  School,
  Camera,
  Coffee,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  FastForward,
  Rewind,
  Zap,
  RotateCcw,
  Eye,
  EyeOff,
  Video,
  Navigation,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import length from '@turf/length';
import centroid from '@turf/centroid';
import along from '@turf/along';
import destination from '@turf/destination';
import bearing from '@turf/bearing';
import lineDistance from '@turf/line-distance';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map styles optimized for performance and visual clarity
const MAP_STYLES: Record<string, { label: string, url: any, category: 'vector' | 'raster' }> = {
  STREETS: { 
    label: 'Bản đồ Phố', 
    url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    category: 'vector' 
  },
  LIGHT: { 
    label: 'Sáng', 
    url: 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    category: 'vector' 
  },
  DARK: { 
    label: 'Tối', 
    url: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    category: 'vector' 
  },
  NAVIGATION: {
    label: 'Điều hướng',
    url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    category: 'vector'
  },
  OSM_STANDARD: {
    label: 'Bản đồ Tiêu chuẩn',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap'
        }
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm-tiles' }]
    }
  },
  PUBLIC_TRANSPORT: {
    label: 'Giao thông công cộng',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'pt-tiles': {
          type: 'raster',
          tiles: ['https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; Memomaps'
        }
      },
      layers: [{ id: 'pt', type: 'raster', source: 'pt-tiles' }]
    }
  },
  HYBRID: {
    label: 'Vệ tinh Nhãn',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        },
        'labels': {
          type: 'raster',
          tiles: ['https://tiles.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: [
        { id: 'satellite', type: 'raster', source: 'satellite-tiles' },
        { id: 'labels', type: 'raster', source: 'labels' }
      ]
    }
  },
  SATELLITE: {
    label: 'Vệ tinh (ArcGIS)',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [{ id: 'satellite', type: 'raster', source: 'satellite-tiles' }]
    }
  },
  ARCGIS_HYBRID: {
    label: 'ArcGIS Hỗn hợp',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'arcgis-imagery': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        },
        'arcgis-labels': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256
        }
      },
      layers: [
        { id: 'arcgis-imagery', type: 'raster', source: 'arcgis-imagery' },
        { id: 'arcgis-labels', type: 'raster', source: 'arcgis-labels' }
      ]
    }
  },
  ARCGIS_TERRAIN_BASE: {
    label: 'ArcGIS Địa hình (Base)',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'arcgis-terrain': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [{ id: 'arcgis-terrain', type: 'raster', source: 'arcgis-terrain' }]
    }
  },
  ARCHITECTURE: {
    label: '3D Kiến trúc',
    url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    category: 'vector'
  },
  TOPO_SHADED: {
    label: 'Địa hình (Khối)',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'topo-shaded-tiles': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [{ id: 'topo-shaded', type: 'raster', source: 'topo-shaded-tiles' }]
    }
  },
  TOPO_PHYSICAL: {
    label: 'Địa hình (Vật lý)',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'topo-phys-tiles': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri'
        }
      },
      layers: [{ id: 'topo-phys', type: 'raster', source: 'topo-phys-tiles' }]
    }
  },
  OPENTOPOMAP: {
    label: 'OpenTopoMap (Gốc)',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'otm-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenTopoMap'
        }
      },
      layers: [{ id: 'otm', type: 'raster', source: 'otm-tiles' }]
    }
  },
  SHORTBREAD: {
    label: 'Shortbread',
    url: 'https://tile.openstreetmap.jp/styles/osm-bright/style.json',
    category: 'vector'
  },
  MAPTILER_OMT: {
    label: 'MapTiler OMT',
    url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Placeholder vector style as MapTiler needs keys
    category: 'vector'
  }
};

// Fix MapLibre GL 3.0+ line-dasharray expression error
const mapboxDrawStyles = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": ["coalesce", ["get", "user_fillColor"], ["get", "user_color"], "#3bb2d0"],
      "fill-opacity": ["coalesce", ["get", "user_fillOpacity"], 0.2],
    },
  },
  {
    id: "gl-draw-lines",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["!=", "user_isRealRoute", true]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
      "line-width": ["coalesce", ["get", "user_width"], 3],
    },
  },
  {
    id: "gl-draw-line-route-support",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["==", "user_isRealRoute", true]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-opacity": 0 // Force hide Air line when Real route is active
    },
  },
  {
    id: "gl-draw-polygon-stroke",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
      "line-width": ["coalesce", ["get", "user_width"], 2],
    },
  },
  {
    id: "gl-draw-line-active",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["==", "active", "true"], ["!=", "user_isRealRoute", true]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "user_color"], "#fbb03b"],
      "line-width": ["coalesce", ["get", "user_width"], 4],
    },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": 5,
      "circle-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
    },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
    paint: {
      "circle-radius": 6,
      "circle-color": "#fbb03b",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff"
    },
  },
  {
    id: "gl-draw-midpoint-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#fbb03b",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
      "circle-opacity": 0.7
    },
  }
];

interface Annotation {
  id: string;
  lngLat: [number, number];
  text: string;
  imageUrl?: string;
  icon?: string;
  size?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  bgColor?: string;
  showText?: boolean;
}

const ICON_PATHS: Record<string, string> = {
  flag: `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>`,
  home: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  school: `<path d="M12 22v-4"/><path d="M18 22V10l-6-6-6 6v12"/><path d="M12 18H6"/><path d="M18 18h-6"/><path d="m8 10 4 4 4-4"/>`,
  camera: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
  coffee: `<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,
  car: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h2"/><path d="M13 17h4"/>`,
  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  'alert-circle': `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
  info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`
};

const DISASTER_ICONS: Record<string, { url: string; label: string; anim: 'pulse' | 'float' | 'shake' }> = {
  '3d-accident': { 
    url: '/2574867725.png', 
    label: 'Tai nạn GT',
    anim: 'shake'
  },
  '3d-fire-house': { 
    url: '/11442696.png', 
    label: 'Cháy nhà',
    anim: 'pulse'
  },
  '3d-explosion': { 
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Collision/3D/collision_3d.png', 
    label: 'Cháy nổ',
    anim: 'pulse'
  },
  '3d-flood': { 
    url: '/9211918.png', 
    label: 'Mưa lũ',
    anim: 'float'
  },
  '3d-landslide': { 
    url: '/263720581.png', 
    label: 'Sụt lở',
    anim: 'shake'
  },
  '3d-fire-forest': { 
    url: '/9211928.png', 
    label: 'Cháy rừng',
    anim: 'pulse'
  },
  '3d-storm': { 
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Cloud%20with%20lightning%20and%20rain/3D/cloud_with_lightning_and_rain_3d.png', 
    label: 'Bão lũ',
    anim: 'float'
  },
  '3d-earthquake': { 
    url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Derelict%20house/3D/derelict_house_3d.png', 
    label: 'Động đất',
    anim: 'shake'
  }
};

export default function MapInterface() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  const [activeMode, setActiveMode] = useState<'view' | 'draw_polygon' | 'draw_line' | 'annotate' | 'image' | 'icon' | 'routing'>('view');
  const activeModeRef = useRef(activeMode);
  const [routeType, setRouteType] = useState<'straight' | 'real'>('straight');
  const [travelMode, setTravelMode] = useState<'driving' | 'motorbike' | 'walking'>('driving');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const annotationsRef = useRef<Annotation[]>([]);
  const markerInstances = useRef<Record<string, maplibregl.Marker>>({});
  
  const [isExporting, setIsExporting] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);
  const [coords, setCoords] = useState({ lng: 105.8342, lat: 21.0278 });
  const [mapStyleKey, setMapStyleKey] = useState<string>('STREETS');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [assetModal, setAssetModal] = useState<{ 
    isOpen: boolean, 
    type: 'annotate' | 'image' | 'icon', 
    lngLat: [number, number] | null,
    text: string,
    imageUrl: string,
    icon: string,
    size: string,
    textColor: string,
    fontSize: number,
    fontWeight: string,
    isUploading: boolean,
    editId: string | null
  }>({
    isOpen: false,
    type: 'annotate',
    lngLat: null,
    text: '',
    imageUrl: '',
    icon: 'flag',
    size: '120',
    textColor: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
    isUploading: false,
    editId: null
  });
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [showAdminBoundaries, setShowAdminBoundaries] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [adminUnitColors, setAdminUnitColors] = useState<{
    provinces: Record<string, string>;
    communes: Record<string, string>;
  }>({ provinces: {}, communes: {} });
  const [adminUnitOpacities, setAdminUnitOpacities] = useState<{
    provinces: Record<string, number>;
    communes: Record<string, number>;
  }>({ provinces: {}, communes: {} });
  const [selectedAdminUnits, setSelectedAdminUnits] = useState<{
    id: string;
    name: string;
    level: 'province' | 'commune';
    properties: any;
  }[]>([]);
  
  // Animation State
  const [animatingFeatures, setAnimatingFeatures] = useState<Record<string, {
    progress: number; // 0 to 1
    speed: number;    // meters per frame (approx)
    isPlaying: boolean;
    direction: 1 | -1;
    visible: boolean; // toggle visibility
    isFpv?: boolean;
  }>>({});
  const animationFrameRef = useRef<number | null>(null);
  
  const selectedFeature = drawnFeatures.find(f => f.id === selectedFeatureId);
  const is3DRef = useRef(is3D);
  const mapStyleRef = useRef(mapStyleKey);
  const adminBoundaryRef = useRef(showAdminBoundaries);
  const drawStateRef = useRef<any>([]); // To persist drawn features across style changes

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);
  
  useEffect(() => {
    is3DRef.current = is3D;
  }, [is3D]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const isOutsidePicker = layerPickerRef.current && !layerPickerRef.current.contains(event.target as Node);
      const isOutsideButton = layerButtonRef.current && !layerButtonRef.current.contains(event.target as Node);
      
      if (isOutsidePicker && isOutsideButton) {
        setShowLayerPicker(false);
      }
    }
    if (showLayerPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showLayerPicker]);

  useEffect(() => {
    mapStyleRef.current = mapStyleKey;
  }, [mapStyleKey]);

  useEffect(() => {
    adminBoundaryRef.current = showAdminBoundaries;
  }, [showAdminBoundaries]);

  // Route Animation Engine
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    const animate = () => {
      const ids = Object.keys(animatingFeatures);
      if (ids.length === 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      setAnimatingFeatures(prev => {
        const next = { ...prev };
        let hasChanges = false;

        ids.forEach(id => {
          const feat = drawnFeatures.find(f => f.id === id);
          if (!feat || !feat.properties?.routeGeometry) return;

          const config = next[id];
          const totalDist = length({ type: 'Feature', geometry: feat.properties.routeGeometry, properties: {} } as any, { units: 'meters' });
          if (totalDist === 0) return;

          let newProgress = config.progress;
          if (config.isPlaying) {
            const metersPerSecond = config.speed / 3.6;
            const metersPerTick = metersPerSecond / 60; 
            
            let delta = (metersPerTick / totalDist) * config.direction;
            newProgress = config.progress + delta;

            if (config.isFpv) {
              if (newProgress >= 1 || newProgress <= 0) {
                // In FPV mode, do not loop. Clamp progress and stop animation.
                newProgress = Math.max(0, Math.min(1, newProgress));
                next[id] = { ...config, progress: newProgress, isPlaying: false, isFpv: false };
                hasChanges = true;
              } else {
                next[id] = { ...config, progress: newProgress };
                hasChanges = true;
              }
            } else {
              if (newProgress > 1) newProgress = 0;
              if (newProgress < 0) newProgress = 1;

              next[id] = { ...config, progress: newProgress };
              hasChanges = true;
            }
          }

          const vehicleSourceId = `vehicle-${id}`;
          const source = m.getSource(vehicleSourceId) as maplibregl.GeoJSONSource;
          if (source) {
            const point = along(feat.properties.routeGeometry, newProgress * (totalDist / 1000), { units: 'kilometers' });
            const nextPointDist = Math.min(newProgress * (totalDist/1000) + 0.005, totalDist/1000);
            const nextPoint = along(feat.properties.routeGeometry, nextPointDist, { units: 'kilometers' });
            const b = bearing(point, nextPoint);
            const finalBearing = config.direction === 1 ? b : b + 180;
            
            // Adjust bearing based on map rotation
            const mapBearing = m.getBearing();
            let relativeBearing = (finalBearing - mapBearing + 360) % 360;
            if (relativeBearing > 180) relativeBearing -= 360;
            
            // Microsoft emojis face left by default. 
            // relativeBearing > 0 means heading Right relative to viewport.
            const facing = (relativeBearing > 0 && relativeBearing < 180) ? 'right' : 'left';

            // Add bouncing animation for walking
            const tMode = feat.properties?.travelMode || travelMode;
            let iconOffset = [0, 0];
            if (tMode === 'walking') {
                const distanceMeters = newProgress * totalDist * 1000;
                const bounce = -Math.abs(Math.sin(distanceMeters * 2.5)) * 12; // Bounce up 12px
                iconOffset = [0, bounce];
            }

            source.setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: point.geometry,
                properties: { 
                  bearing: finalBearing,
                  facing: facing,
                  iconOffset: iconOffset,
                  travelMode: tMode,
                  visible: config.isFpv ? false : (config.visible !== false)
                }
              }]
            });
            
            if (config.isFpv && config.isPlaying) {
              const isSatellite = mapStyleRef.current === 'SATELLITE' || mapStyleRef.current === 'HYBRID';
              const targetZoom = isSatellite ? Math.min(Math.max(m.getZoom(), 14), 16) : Math.max(m.getZoom(), 17);
              
              // Move movement center to the bottom of the screen
              m.jumpTo({
                center: point.geometry.coordinates as [number, number],
                bearing: finalBearing,
                pitch: 45, // Lowered from 75 to 45 for "truly" low-angle perspective
                zoom: targetZoom,
                padding: { top: m.getContainer().clientHeight * 0.7, bottom: 0, left: 0, right: 0 }
              });
            }
          }
        });

        return hasChanges ? next : prev;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [drawnFeatures, animatingFeatures]);

  const toggleAnimation = (id: string) => {
    setAnimatingFeatures(prev => {
      const current = prev[id] || { progress: 0, speed: 60, isPlaying: false, direction: 1, visible: true };
      return {
        ...prev,
        [id]: { ...current, isPlaying: !current.isPlaying }
      };
    });
  };

  const updateAnimationConfig = (id: string, updates: Partial<any>) => {
    setAnimatingFeatures(prev => {
      const current = prev[id] || { progress: 0, speed: 60, isPlaying: false, direction: 1, visible: true };
      return {
        ...prev,
        [id]: { ...current, ...updates }
      };
    });
  };

  const setupImages = useCallback(async (m: maplibregl.Map) => {
    const images = [
      { base: 'vehicle-car', url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Automobile/3D/automobile_3d.png' },
      { base: 'vehicle-motorbike', url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Motorcycle/3D/motorcycle_3d.png' },
      { base: 'vehicle-walking', url: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Person%20walking/Default/3D/person_walking_3d_default.png' },
    ];

    for (const img of images) {
      if (!m.hasImage(`${img.base}-left`)) {
        try {
          const image = await m.loadImage(img.url);
          if (image) {
            // Add original (facing left)
            const sourceData = image.data || image;
            if (!m.hasImage(`${img.base}-left`)) m.addImage(`${img.base}-left`, sourceData);
            
            // Create and add flipped version (facing right)
            if (!m.hasImage(`${img.base}-right`)) {
              const width = sourceData.width || (image as any).width;
              const height = sourceData.height || (image as any).height;
              
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                if ((sourceData as any).data && ((sourceData as any).data instanceof Uint8Array || (sourceData as any).data instanceof Uint8ClampedArray)) {
                  // Raw pixel data
                  const imgDataObj = new ImageData(new Uint8ClampedArray((sourceData as any).data), width, height);
                  const offscreenSchema = document.createElement('canvas');
                  offscreenSchema.width = width;
                  offscreenSchema.height = height;
                  offscreenSchema.getContext('2d')?.putImageData(imgDataObj, 0, 0);
                  ctx.drawImage(offscreenSchema, 0, 0);
                } else if (sourceData instanceof ImageData) {
                   const offscreenSchema = document.createElement('canvas');
                   offscreenSchema.width = width;
                   offscreenSchema.height = height;
                   offscreenSchema.getContext('2d')?.putImageData(sourceData, 0, 0);
                   ctx.drawImage(offscreenSchema, 0, 0);
                } else {
                  // HTMLImageElement or ImageBitmap
                  ctx.drawImage(sourceData as any, 0, 0);
                }
                
                const flippedData = ctx.getImageData(0, 0, width, height);
                m.addImage(`${img.base}-right`, flippedData);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing image ${img.base}:`, error);
        }
      }
    }
  }, []);

  const updateBuildings3D = useCallback((m: maplibregl.Map, active: boolean) => {
    if (!m) return;
    const style = m.getStyle();
    if (!style || !style.layers) return;

    // Remove if exists
    if (m.getLayer('3d-buildings')) m.removeLayer('3d-buildings');

    if (active) {
      // Find a suitable building layer in the current style to extrude (exclude the 3D layer itself)
      const buildingLayer = style.layers.find(l => 
        (l.id.includes('building') || (l as any).source === 'building') && 
        l.id !== '3d-buildings'
      );
      
      if (buildingLayer) {
        m.addLayer({
          'id': '3d-buildings',
          'source': (buildingLayer as any).source || 'openmaptiles',
          'source-layer': (buildingLayer as any)['source-layer'] || 'building',
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.6
          }
        }, buildingLayer.id);
      }
    }
  }, []);

  const setupCustomLayers = useCallback(() => {
    if (!map.current) return;
    const m = map.current;
    
    if (adminBoundaryRef.current) {
      const sourceId = 'vietnam-admin-source';
      const fillLayerId = 'vietnam-admin-fill';
      const lineLayerId = 'vietnam-admin-line';

      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        
        fetch('/data/Việt Nam (tỉnh thành) - 34.json')
          .then(res => res.json())
          .then(data => {
            if (!m.getSource(sourceId)) return;
            const features = data.features;
            const mergedMap = features.reduce((acc: any, feature: any) => {
              const name = (feature.properties.ten_tinh || 'Unknown').trim();
              if (!acc[name]) acc[name] = { ...feature, geometry: { type: 'MultiPolygon', coordinates: [] } };
              const geometry = feature.geometry;
              if (geometry.type === 'Polygon') acc[name].geometry.coordinates.push(geometry.coordinates);
              else if (geometry.type === 'MultiPolygon') acc[name].geometry.coordinates.push(...geometry.coordinates);
              return acc;
            }, {});
            (m.getSource(sourceId) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: Object.values(mergedMap) });
          });
      }

      if (!m.getLayer(fillLayerId)) {
        m.addLayer({
          id: fillLayerId, type: 'fill', source: sourceId,
          paint: { 
            'fill-color': [
              'match',
              ['get', 'ten_tinh'],
              ...(Object.entries(adminUnitColors.provinces).length > 0 
                ? Object.entries(adminUnitColors.provinces).flat() 
                : ['__placeholder__', '#0ea5e9']),
              '#0ea5e9'
            ] as any,
            'fill-opacity': [
              'case',
              ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
              Object.entries(adminUnitOpacities.provinces).length > 0
                ? (['match', ['get', 'ten_tinh'], ...Object.entries(adminUnitOpacities.provinces).flat(), 0.45] as any)
                : 0.45,
              ['match', ['get', 'ten_tinh'], 
                Object.keys(adminUnitColors.provinces).length > 0 ? Object.keys(adminUnitColors.provinces) : ['__placeholder__'],
                Object.entries(adminUnitOpacities.provinces).length > 0
                  ? (['match', ['get', 'ten_tinh'], ...Object.entries(adminUnitOpacities.provinces).flat(), 0.25] as any)
                  : 0.25,
                0.05
              ]
            ] as any
          }
        });
        
        m.on('mouseenter', fillLayerId, () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', fillLayerId, () => { m.getCanvas().style.cursor = ''; });
        m.on('click', fillLayerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feat = e.features[0];
            const originalEvent = e.originalEvent as MouseEvent;
            const isMultiSelect = originalEvent.shiftKey || originalEvent.ctrlKey || originalEvent.metaKey;

            setSelectedAdminUnits(prev => {
              const unit = {
                id: feat.properties.ten_tinh,
                name: feat.properties.ten_tinh,
                level: 'province' as const,
                properties: feat.properties
              };
              
              if (isMultiSelect) {
                const exists = prev.find(u => u.id === unit.id && u.level === 'province');
                if (exists) {
                  return prev.filter(u => u.id !== unit.id || u.level !== 'province');
                }
                return [...prev, unit];
              }
              return [unit];
            });
            setShowDataPanel(true);
          }
        });
      } else {
        // Update existing layer paint property
        m.setPaintProperty(fillLayerId, 'fill-color', [
          'match',
          ['get', 'ten_tinh'],
          ...(Object.entries(adminUnitColors.provinces).length > 0 
            ? Object.entries(adminUnitColors.provinces).flat() 
            : ['__placeholder__', '#0ea5e9']),
          '#0ea5e9'
        ] as any);
        m.setPaintProperty(fillLayerId, 'fill-opacity', [
          'case',
          ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
          Object.entries(adminUnitOpacities.provinces).length > 0
            ? (['match', ['get', 'ten_tinh'], ...Object.entries(adminUnitOpacities.provinces).flat(), 0.45] as any)
            : 0.45,
          ['match', ['get', 'ten_tinh'], 
            Object.keys(adminUnitColors.provinces).length > 0 ? Object.keys(adminUnitColors.provinces) : ['__placeholder__'],
            Object.entries(adminUnitOpacities.provinces).length > 0
              ? (['match', ['get', 'ten_tinh'], ...Object.entries(adminUnitOpacities.provinces).flat(), 0.25] as any)
              : 0.25,
            0.05
          ]
        ] as any);
      }
      
      if (!m.getLayer(lineLayerId)) {
        m.addLayer({
          id: lineLayerId, type: 'line', source: sourceId,
          paint: { 
            'line-color': [
               'case',
               ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
               '#fbbf24',
               '#0284c7'
            ], 
            'line-width': [
              'case',
              ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
              3,
              ['match', ['get', 'ten_tinh'], 
                Object.keys(adminUnitColors.provinces).length > 0 ? Object.keys(adminUnitColors.provinces) : ['__placeholder__'],
                1.5,
                1.0
              ] as any
            ] as any
          }
        });
      } else {
          m.setPaintProperty(lineLayerId, 'line-color', [
            'case',
            ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
            '#fbbf24',
            '#0284c7'
          ]);
          m.setPaintProperty(lineLayerId, 'line-width', [
            'case',
            ['in', ['get', 'ten_tinh'], ['literal', selectedAdminUnits.filter(u => u.level === 'province').map(u => u.id)]],
            3,
            ['match', ['get', 'ten_tinh'], 
              Object.keys(adminUnitColors.provinces).length > 0 ? Object.keys(adminUnitColors.provinces) : ['__placeholder__'],
              1.5,
              1.0
            ] as any
          ] as any);
      }

      if (!m.getSource('vietnam-point-source')) {
        m.addSource('vietnam-point-source', { type: 'geojson', data: '/data/vietnam.json' });
      }
      if (!m.getLayer('vietnam-admin-label')) {
        m.addLayer({
          id: 'vietnam-admin-label', type: 'symbol', source: 'vietnam-point-source',
          minzoom: 4, maxzoom: 12,
          layout: {
            'text-field': ['get', 'ten_tinh'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14, 'text-anchor': 'center'
          },
          paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }
        });
      }

      const communeSourceId = 'vietnam-commune-source';
      if (!m.getSource(communeSourceId)) {
         m.addSource(communeSourceId, { type: 'geojson', data: '/data/vn-communes-34.json' });
      }
      if (!m.getLayer('vietnam-commune-fill')) {
         m.addLayer({
           id: 'vietnam-commune-fill', type: 'fill', source: communeSourceId,
           minzoom: 9, 
           paint: { 
             'fill-color': [
               'match',
               ['get', 'ten_xa'],
               ...(Object.entries(adminUnitColors.communes).length > 0 
                 ? Object.entries(adminUnitColors.communes).flat() 
                 : ['__placeholder__', '#cbd5e1']),
               '#cbd5e1'
             ] as any,
             'fill-opacity': [
               'case',
               ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
               Object.entries(adminUnitOpacities.communes).length > 0
                 ? (['match', ['get', 'ten_xa'], ...Object.entries(adminUnitOpacities.communes).flat(), 0.45] as any)
                 : 0.45,
               ['match', ['get', 'ten_xa'], 
                 Object.keys(adminUnitColors.communes).length > 0 ? Object.keys(adminUnitColors.communes) : ['__placeholder__'],
                 Object.entries(adminUnitOpacities.communes).length > 0
                   ? (['match', ['get', 'ten_xa'], ...Object.entries(adminUnitOpacities.communes).flat(), 0.25] as any)
                   : 0.25,
                 0.05
               ]
             ] as any
           }
         });
         
         m.on('mouseenter', 'vietnam-commune-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
         m.on('mouseleave', 'vietnam-commune-fill', () => { m.getCanvas().style.cursor = ''; });
         m.on('click', 'vietnam-commune-fill', (e) => {
           if (e.features && e.features.length > 0) {
             const feat = e.features[0];
             const originalEvent = e.originalEvent as MouseEvent;
             const isMultiSelect = originalEvent.shiftKey || originalEvent.ctrlKey || originalEvent.metaKey;

             setSelectedAdminUnits(prev => {
               const unit = {
                 id: feat.properties.ten_xa,
                 name: feat.properties.ten_xa,
                 level: 'commune' as const,
                 properties: feat.properties
               };
               
               if (isMultiSelect) {
                 const exists = prev.find(u => u.id === unit.id && u.level === 'commune');
                 if (exists) {
                   return prev.filter(u => u.id !== unit.id || u.level !== 'commune');
                 }
                 return [...prev, unit];
               }
               return [unit];
             });
             setShowDataPanel(true);
           }
         });
      } else {
         m.setPaintProperty('vietnam-commune-fill', 'fill-color', [
           'match',
           ['get', 'ten_xa'],
           ...(Object.entries(adminUnitColors.communes).length > 0 
             ? Object.entries(adminUnitColors.communes).flat() 
             : ['__placeholder__', '#cbd5e1']),
           '#cbd5e1'
         ] as any);
         m.setPaintProperty('vietnam-commune-fill', 'fill-opacity', [
           'case',
           ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
           Object.entries(adminUnitOpacities.communes).length > 0
             ? (['match', ['get', 'ten_xa'], ...Object.entries(adminUnitOpacities.communes).flat(), 0.45] as any)
             : 0.45,
           ['match', ['get', 'ten_xa'], 
             Object.keys(adminUnitColors.communes).length > 0 ? Object.keys(adminUnitColors.communes) : ['__placeholder__'],
             Object.entries(adminUnitOpacities.communes).length > 0
               ? (['match', ['get', 'ten_xa'], ...Object.entries(adminUnitOpacities.communes).flat(), 0.25] as any)
               : 0.25,
             0.05
           ]
         ] as any);
      }
      if (!m.getLayer('vietnam-commune-line')) {
         m.addLayer({
           id: 'vietnam-commune-line', type: 'line', source: communeSourceId,
           minzoom: 9, 
           paint: { 
             'line-color': [
               'case',
               ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
               '#fbbf24',
               '#64748b'
             ], 
             'line-width': [
               'case',
               ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
               2.5,
               ['match', ['get', 'ten_xa'], 
                 Object.keys(adminUnitColors.communes).length > 0 ? Object.keys(adminUnitColors.communes) : ['__placeholder__'],
                 1.2,
                 0.5
               ]
             ]
           }
         });
      } else {
         m.setPaintProperty('vietnam-commune-line', 'line-color', [
           'case',
           ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
           '#fbbf24',
           '#64748b'
         ]);
         m.setPaintProperty('vietnam-commune-line', 'line-width', [
           'case',
           ['in', ['get', 'ten_xa'], ['literal', selectedAdminUnits.filter(u => u.level === 'commune').map(u => u.id)]],
           2.5,
           ['match', ['get', 'ten_xa'], 
             Object.keys(adminUnitColors.communes).length > 0 ? Object.keys(adminUnitColors.communes) : ['__placeholder__'],
             1.2,
             0.5
           ] as any
         ] as any);
      }
      if (!m.getLayer('vietnam-commune-label')) {
         m.addLayer({
           id: 'vietnam-commune-label', type: 'symbol', source: communeSourceId,
           minzoom: 11,
           layout: {
             'text-field': ['get', 'ten_xa'],
             'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
             'text-size': 12, 'text-anchor': 'center'
           },
           paint: { 'text-color': '#1e293b', 'text-halo-color': '#ffffff', 'text-halo-width': 1 }
         });
      }

      // Hide core map labels
      const style = m.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          // Disable all symbol layers except for our custom vietnam labels
          if (layer.type === 'symbol') {
              console.log('Processing symbol layer:', layer.id);
              if (!layer.id.startsWith('vietnam-') && !layer.id.startsWith('vehicle-') && layer.id !== 'search-marker-layer') {
                try { m.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (e) {}
              }
          }
        });
      }
    } else {
      // Remove custom layers if showAdminBoundaries is off
      ['vietnam-admin-fill', 'vietnam-admin-line', 'vietnam-admin-label', 'vietnam-commune-fill', 'vietnam-commune-line', 'vietnam-commune-label'].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      ['vietnam-admin-source', 'vietnam-point-source', 'vietnam-commune-source'].forEach(id => {
        if (m.getSource(id)) m.removeSource(id);
      });

      // Restore core map labels
      const style = m.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          if (layer.type === 'symbol' && !layer.id.includes('vietnam-') && !layer.id.startsWith('vehicle-') && layer.id !== 'search-marker-layer') {
             try { m.setLayoutProperty(layer.id, 'visibility', 'visible'); } catch (e) {}
          }
        });
      }
    }

    // Always re-apply 3D if active
    updateBuildings3D(m, is3DRef.current);
  }, [updateBuildings3D, adminUnitColors, adminUnitOpacities, selectedAdminUnits, showAdminBoundaries]);

  useEffect(() => {
    if (!map.current) return;
    setupCustomLayers();
  }, [showAdminBoundaries, is3D, setupCustomLayers, adminUnitColors, adminUnitOpacities, selectedAdminUnits]);

  useEffect(() => {
    if (!map.current) return;
    
    const currentIds = new Set(annotations.map(a => a.id));
    
    // Remove markers that are no longer in state
    Object.keys(markerInstances.current).forEach(id => {
      if (!currentIds.has(id)) {
        markerInstances.current[id].remove();
        delete markerInstances.current[id];
      }
    });
    
    // Add or update markers
    annotations.forEach(ann => {
      const getMarkerContent = () => {
        const textStyle = `
          color: ${ann.textColor || '#1f2937'};
          font-size: ${ann.fontSize || 12}px;
          font-weight: ${ann.fontWeight || '600'};
          font-family: sans-serif;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
          pointer-events: none;
        `;

        if (ann.imageUrl) {
          const size = ann.size || 64;
          return `
            <div class="flex flex-col items-center gap-1 group">
              <div class="p-1 bg-white rounded-lg shadow-xl border-2 border-white overflow-hidden ring-1 ring-black/10 transition-transform active:scale-95">
                <img src="${ann.imageUrl}" style="width: ${size}px; height: auto; display: block; border-radius: 4px;" referrerPolicy="no-referrer" />
              </div>
              <span style="${textStyle}">${ann.text || ''}</span>
            </div>
          `;
        } else if (ann.icon) {
          if (ann.icon.startsWith('3d-')) {
            const iconData = DISASTER_ICONS[ann.icon];
            const animClass = iconData?.anim === 'pulse' ? 'animate-pulse-slow' : iconData?.anim === 'float' ? 'animate-float' : iconData?.anim === 'shake' ? 'animate-shake-3d' : '';
            
            // Special composite for forest fire
            if (ann.icon === '3d-fire-forest') {
              return `
                <div class="flex flex-col items-center gap-1">
                  <div class="relative w-14 h-14 flex items-center justify-center group">
                    <img src="${iconData?.url}" class="w-full h-full object-contain" />
                    <img src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Fire/3D/fire_3d.png" 
                         class="absolute bottom-0 w-8 h-8 object-contain ${animClass}" />
                  </div>
                  <span style="${textStyle}">${ann.text || ''}</span>
                </div>
              `;
            }

            return `
              <div class="flex flex-col items-center gap-1">
                <div class="relative group">
                  <div class="absolute inset-0 bg-blue-400/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src="${iconData?.url}" class="w-12 h-12 object-contain relative z-10 ${animClass}" style="filter: drop-shadow(0 10px 8px rgba(0,0,0,0.2));" />
                </div>
                <span style="${textStyle}">${ann.text || ''}</span>
              </div>
            `;
          }
          const path = ICON_PATHS[ann.icon] || ICON_PATHS['flag'];
          return `
            <div class="flex flex-col items-center gap-1">
              <div style="background: white; padding: 10px; border-radius: 999px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.15); border: 3px solid #3b82f6; display: flex; align-items: center; justify-content: center; transform: scale(1.1);" class="transition-transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
              </div>
              <span style="${textStyle}">${ann.text || ''}</span>
            </div>
          `;
        } else {
          return `
            <div class="flex flex-col items-center gap-1">
              <div class="px-3 py-1.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95" style="background: ${ann.bgColor || '#3b82f6'}">
                <span class="text-white text-xs font-bold leading-none">${ann.text}</span>
              </div>
            </div>
          `;
        }
      };

      const getPopupContent = () => `
        <div class="p-4 min-w-[200px] font-sans bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-zinc-100">
          ${ann.imageUrl ? `<img src="${ann.imageUrl}" class="w-full h-auto rounded-lg mb-3 shadow-md border border-zinc-200" alt="Annotation" referrerPolicy="no-referrer" />` : ''}
          <h4 class="text-sm font-bold text-zinc-900 leading-tight mb-1">${ann.text}</h4>
          <p class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Lớp nội dung</p>
        </div>
      `;

      if (!markerInstances.current[ann.id]) {
        const el = document.createElement('div');
        el.className = 'custom-marker-wrapper cursor-pointer z-[100]';
        el.innerHTML = getMarkerContent();

        const popup = new maplibregl.Popup({ 
          offset: 35, 
          closeButton: false,
          className: 'custom-map-popup'
        }).setHTML(getPopupContent());

        const marker = new maplibregl.Marker({ 
          element: el,
          draggable: true 
        })
          .setLngLat(ann.lngLat)
          .setPopup(popup)
          .addTo(map.current!);
        
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setAnnotations(prev => prev.map(a => 
            a.id === ann.id ? { ...a, lngLat: [lngLat.lng, lngLat.lat] as [number, number] } : a
          ));
        });

        markerInstances.current[ann.id] = marker;
      } else {
        // Update existing marker
        const marker = markerInstances.current[ann.id];
        marker.setLngLat(ann.lngLat);
        const el = marker.getElement();
        
        const newContent = getMarkerContent();
        if (el.innerHTML !== newContent) {
          el.innerHTML = newContent;
        }
        
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(getPopupContent());
        }
      }
    });
  }, [annotations]);

  const geocoderRef = useRef<any>(null);
  const layerPickerRef = useRef<HTMLDivElement>(null);
  const layerButtonRef = useRef<HTMLButtonElement>(null);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTargetId, setSearchTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [routingStart, setRoutingStart] = useState<{ query: string, coords: [number, number] | null }>({ query: '', coords: null });
  const [routingEnd, setRoutingEnd] = useState<{ query: string, coords: [number, number] | null }>({ query: '', coords: null });
  const [routingFocus, setRoutingFocus] = useState<'start' | 'end' | null>(null);
  const routingFocusRef = useRef(routingFocus);

  useEffect(() => {
    activeModeRef.current = activeMode;
    routingFocusRef.current = routingFocus;
  }, [activeMode, routingFocus]);

  const fetchRealRoute = useCallback(async (featureId: string, waypoints: number[][], mode: string) => {
    try {
      const query = waypoints.map(c => c.join(',')).join(';');
      const service = mode === 'walking' ? 'routed-foot' : mode === 'motorbike' ? 'routed-car' : 'routed-car';
      
      const response = await fetch(`https://routing.openstreetmap.de/${service}/route/v1/driving/${query}?geometries=geojson`);
      const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const routeGeometry = data.routes[0].geometry;
            
            if (draw.current) {
              // Robust property setting
              draw.current.setFeatureProperty(featureId, 'routeGeometry', routeGeometry);
              draw.current.setFeatureProperty(featureId, 'isRealRoute', true); 
              draw.current.setFeatureProperty(featureId, 'isRoute', true);
              draw.current.setFeatureProperty(featureId, 'routeType', 'real');
              draw.current.setFeatureProperty(featureId, 'travelMode', mode);
              
              const len = length({ type: 'Feature', geometry: routeGeometry, properties: {} } as any, { units: 'kilometers' });
              const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0)} m`;
              draw.current.setFeatureProperty(featureId, 'distance', formattedLen);
              
              // CRITICAL: Force Draw to sync with style filters by re-adding the feature
              const updatedFeature = draw.current.get(featureId);
              if (updatedFeature) {
                draw.current.add(updatedFeature as any);
              }
              
              setDrawnFeatures([...draw.current.getAll().features]);

              // Initialize animation state if not exists
              setAnimatingFeatures(prev => {
                if (prev[featureId]) return prev;
                return {
                  ...prev,
                  [featureId]: { progress: 0, speed: 60, isPlaying: false, direction: 1, visible: true }
                };
              });
            }
          }
    } catch (error) {
      console.error('Error fetching real route:', error);
    }
  }, []);

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    // Basic map click info
    setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    
    // Routing mode click
    if (activeModeRef.current === 'routing' && routingFocusRef.current) {
      const coords = [e.lngLat.lng, e.lngLat.lat] as [number, number];
      const query = `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
      if (routingFocusRef.current === 'start') {
        setRoutingStart({ query, coords });
      } else {
        setRoutingEnd({ query, coords });
      }
      return;
    }

    // Check if we clicked on a real route layer (which isn't natively caught by MapboxDraw)
    if (map.current && draw.current) {
      // Don't interfere if we are already doing something interactive with the selected tool
      const currentMode = draw.current.getMode();
      
      const layersToQuery = ['real-routes-layer', 'real-routes-active-layer'].filter(layerId => map.current?.getLayer(layerId));
      
      if (layersToQuery.length > 0) {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: layersToQuery
        });
        
        if (features.length > 0) {
          const featureId = features[0].properties.id;
          if (featureId) {
            // Tell draw to select it if not already in direct_select for this feature
            if (currentMode !== 'direct_select') {
              setSelectedFeatureId(String(featureId));
              draw.current.changeMode('direct_select', { featureId: String(featureId) });
            }
          }
        }
      }
    }
  }, []);

  const handleDrawCreate = useCallback(async (e: any) => {
    const d = draw.current;
    if (!d || !e.features || e.features.length === 0) return;
    
    const feature = e.features[0];
    setDrawnFeatures(d.getAll().features);

    if (feature.geometry.type === 'LineString') {
      const lineCoords = feature.geometry.coordinates;
      if (lineCoords.length >= 2) {
        if (routeType === 'real') {
           await fetchRealRoute(feature.id, lineCoords, travelMode);
        } else {
           const len = length(feature, { units: 'kilometers' });
           const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0)} m`;
           d.setFeatureProperty(feature.id, 'distance', formattedLen);
           d.setFeatureProperty(feature.id, 'routeType', 'straight');
           d.setFeatureProperty(feature.id, 'routeGeometry', feature.geometry); // Store geometry for animation
           d.setFeatureProperty(feature.id, 'travelMode', travelMode);
           d.setFeatureProperty(feature.id, 'originalWaypoints', lineCoords);
           setDrawnFeatures(d.getAll().features);
        }

        // Initialize animation state for new route
        setAnimatingFeatures(prev => ({
          ...prev,
          [feature.id]: { progress: 0, speed: 60, isPlaying: false, direction: 1, visible: true }
        }));
      }
    }
  }, [routeType, travelMode, fetchRealRoute]);

  const handleMapClickRef = useRef(handleMapClick);
  useEffect(() => {
    handleMapClickRef.current = handleMapClick;
  }, [handleMapClick]);

  const handleDrawUpdate = useCallback(async (e: any) => {
    const d = draw.current;
    if (!d || !e.features || e.features.length === 0) return;
    
    setDrawnFeatures(d.getAll().features);
    const feature = e.features[0];

    if (feature.geometry.type === 'LineString' && !['annotate', 'image', 'icon'].includes(activeMode)) {
      const lineCoords = feature.geometry.coordinates;
      if (lineCoords.length >= 2) {
        const currentRouteType = feature.properties?.routeType || routeType;
        const currentTravelMode = feature.properties?.travelMode || travelMode;

        if (currentRouteType === 'real') {
           await fetchRealRoute(feature.id, lineCoords, currentTravelMode);
        } else {
           const len = length(feature, { units: 'kilometers' });
           const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0)} m`;
           d.setFeatureProperty(feature.id, 'distance', formattedLen);
           d.setFeatureProperty(feature.id, 'routeType', 'straight');
           d.setFeatureProperty(feature.id, 'routeGeometry', feature.geometry); // Store geometry for animation
           d.setFeatureProperty(feature.id, 'travelMode', currentTravelMode); // Sync mode
           setDrawnFeatures(d.getAll().features);
        }
      }
    }
  }, [routeType, travelMode, fetchRealRoute, activeMode]);

  // Handle routeType or travelMode change to auto-update existing routes
  useEffect(() => {
    if (!draw.current) return;
    const selectedFeatures = draw.current.getSelected().features;
    selectedFeatures.forEach((feature: any) => {
      if (feature.geometry?.type === 'LineString') {
        const isRoute = feature.properties?.isRoute;
        // If it's a calculated route, its coordinates are dense routing points, so we rely on originalWaypoints
        // If it's straight lines, its coordinates are the exact clicked points.
        const waypoints = feature.properties?.originalWaypoints || feature.geometry.coordinates;
        
        // Update the feature with the newly selected UI modes
        draw.current?.setFeatureProperty(feature.id, 'routeType', routeType);
        draw.current?.setFeatureProperty(feature.id, 'travelMode', travelMode);

        if (routeType === 'real') {
          if (waypoints && waypoints.length >= 2) {
            fetchRealRoute(feature.id, waypoints, travelMode);
          }
        } else {
          // Revert to straight lines (Air mode)
          if (waypoints && waypoints.length >= 2 && isRoute) {
             const straightLine = {
               ...feature,
               geometry: {
                 type: 'LineString',
                 coordinates: waypoints
               },
               properties: {
                 ...feature.properties,
                 isRoute: false,
                 isRealRoute: false,
                 routeGeometry: undefined,
                 routeType: 'straight',
                 travelMode: travelMode,
                 distance: '',
                 originalWaypoints: waypoints
               }
             };
             const len = length(straightLine as any, { units: 'kilometers' });
             const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0)} m`;
             straightLine.properties.distance = formattedLen;
             
             draw.current?.add(straightLine);
             setDrawnFeatures(draw.current?.getAll().features || []);

             // Initialize animation for transition
             setAnimatingFeatures(prev => {
               if (prev[feature.id]) return prev;
               return {
                 ...prev,
                 [feature.id]: { progress: 0, speed: 60, isPlaying: false, direction: 1, visible: true }
               };
             });
          }
        }
      }
    });
  }, [travelMode, routeType, fetchRealRoute]);

  const updateFeatureStyle = useCallback((featureId: string, property: string, value: any) => {
    if (!draw.current) return;
    
    // Direct property setting on Draw store
    draw.current.setFeatureProperty(featureId, property, value);
    
    // Sync React state
    setDrawnFeatures([...draw.current.getAll().features]);

    // Force style refresh
    if (map.current) {
      map.current.triggerRepaint();
    }
  }, []);

  const handleDrawCreateRef = useRef(handleDrawCreate);
  const handleDrawUpdateRef = useRef(handleDrawUpdate);

  useEffect(() => {
    handleDrawCreateRef.current = handleDrawCreate;
  }, [handleDrawCreate]);

  useEffect(() => {
    handleDrawUpdateRef.current = handleDrawUpdate;
  }, [handleDrawUpdate]);

  // Effect to manage Real Route Layers in MapLibre
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    const updateRouteLayer = () => {
      if (!m || !m.getStyle()) return;

      const routeFeatures = drawnFeatures
        .filter(f => f.properties?.routeGeometry)
        .map(f => ({
          type: 'Feature' as const,
          geometry: f.properties?.routeGeometry,
          properties: {
            id: f.id,
            color: f.properties?.color || '#3bb2d0',
            width: f.properties?.width || 5,
            distance: f.properties?.distance || '',
            active: f.id === selectedFeatureId ? 1 : 0
          }
        }));

      // 1. Initialize Route Layers and Data first, so they stay BELOW vehicles
      if (!m.getSource('real-routes')) {
        m.addSource('real-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: routeFeatures }
        });
        m.addLayer({
          id: 'real-routes-layer',
          type: 'line',
          source: 'real-routes',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-opacity': 0.8
          }
        });
        m.addLayer({
          id: 'real-routes-active-layer',
          type: 'line',
          source: 'real-routes',
          filter: ['==', ['get', 'active'], 1],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['+', ['get', 'width'], 2],
            'line-dasharray': [1, 1],
            'line-opacity': 1
          }
        });
        m.addLayer({
          id: 'real-routes-labels',
          type: 'symbol',
          source: 'real-routes',
          layout: {
            'text-field': ['get', 'distance'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'bottom',
            'symbol-placement': 'line',
            'text-offset': [0, -1]
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        });
      } else {
        const source = m.getSource('real-routes') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: routeFeatures
          });
        }
      }

      // 2. Update animation layers (vehicles) ON TOP of routes
      drawnFeatures.forEach(f => {
        if (f.properties?.routeGeometry) {
          const sourceId = `vehicle-${f.id}`;
          const layerId = `vehicle-layer-${f.id}`;
          
          if (!m.getSource(sourceId)) {
            m.addSource(sourceId, {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });

            // Use vehicle-specific icons based on travelMode and movement direction
            m.addLayer({
              id: layerId,
              type: 'symbol',
              source: sourceId,
              layout: {
                'icon-image': [
                   'concat',
                   ['match', ['get', 'travelMode'],
                      'driving', 'vehicle-car-',
                      'motorbike', 'vehicle-motorbike-',
                      'walking', 'vehicle-walking-',
                      'vehicle-car-'
                   ],
                   ['coalesce', ['get', 'facing'], 'left']
                ],
                'icon-offset': ['case', ['has', 'iconOffset'], ['get', 'iconOffset'], ['literal', [0, 0]]],
                'icon-size': 0.15,
                'icon-rotate': 0, // Keep vertical
                'icon-rotation-alignment': 'viewport', // Upright relative to screen
                'icon-pitch-alignment': 'viewport',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              },
              paint: {
                'icon-opacity': ['case', ['boolean', ['get', 'visible'], true], 1, 0]
              }
            });
            // Move layer to front so vehicles stay on top
            if (m.getLayer(layerId)) {
              m.moveLayer(layerId);
            }
          } else if (!m.getLayer(layerId)) {
             // Handle case where style changed and layers were removed but legacy sources remained
             m.addLayer({
              id: layerId,
              type: 'symbol',
              source: sourceId,
              layout: {
                'icon-image': [
                   'concat',
                   ['match', ['get', 'travelMode'],
                      'driving', 'vehicle-car-',
                      'motorbike', 'vehicle-motorbike-',
                      'walking', 'vehicle-walking-',
                      'vehicle-car-'
                   ],
                   ['coalesce', ['get', 'facing'], 'left']
                ],
                'icon-offset': ['case', ['has', 'iconOffset'], ['get', 'iconOffset'], ['literal', [0, 0]]],
                'icon-size': 0.15,
                'icon-rotate': 0,
                'icon-rotation-alignment': 'viewport',
                'icon-pitch-alignment': 'viewport',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              },
              paint: {
                'icon-opacity': ['case', ['boolean', ['get', 'visible'], true], 1, 0]
              }
            });
            // Move layer to front
            if (m.getLayer(layerId)) {
               m.moveLayer(layerId);
            }
          } else {
            // Already exists, just ensure it's on top
            m.moveLayer(layerId);
          }
        }
      });

      // Cleanup old animation layers
      const currentVehicleSourceIds = new Set(drawnFeatures.filter(f => f.properties?.routeGeometry).map(f => `vehicle-${f.id}`));
      m.getStyle().layers.forEach((l: any) => {
        if (l.id.startsWith('vehicle-layer-') && !currentVehicleSourceIds.has(l.source)) {
          m.removeLayer(l.id);
          m.removeSource(l.id.replace('vehicle-layer-', 'vehicle-'));
        }
      });
    };

    updateRouteLayer(); // Call initially and on state change

    m.on('style.load', () => {
      setupImages(m);
      updateRouteLayer();
    });
    return () => { m.off('style.load', updateRouteLayer); };
  }, [drawnFeatures, selectedFeatureId, setupImages]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES['STREETS'].url,
      center: [105.8342, 21.0278], // Hanoi
      zoom: 13,
      pitchWithRotate: true,
      dragRotate: true,
      touchZoomRotate: true,
      touchPitch: true,
      bearingSnap: 0,
      maxPitch: 85,
      interactive: true,
      keyboard: true,
      // @ts-ignore
      preserveDrawingBuffer: true,
    });

    // Fix MapLibre GL v4/v5 compatibility with MapboxDraw
    // @ts-ignore
    const patchMap = (mapInstance: any) => {
      if (mapInstance && mapInstance.painter && !mapInstance.painter.style) {
        mapInstance.painter.style = { shaderPreludeCode: '' };
      }
    };

    map.current = m;

    m.on('load', () => {
      setupImages(m);
      // Re-initialize controls for absolute certainty
      m.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'top-left');
      
      m.addControl(new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }), 'top-left');

      // Force enable all rotation inputs
      m.dragRotate.enable();
      m.touchZoomRotate.enable();
      m.keyboard.enable();
    });

    const forceEnableInteractions = () => {
      if (!m) return;
      try {
        m.dragRotate.enable();
        m.touchZoomRotate.enable();
        m.touchPitch.enable();
        // @ts-ignore
        if (m.touchRotate) m.touchRotate.enable();
      } catch (e) {
        console.warn('Map interaction enable failed:', e);
      }
    };

    m.on('style.load', () => {
      patchMap(m);
      forceEnableInteractions();
      setupCustomLayers();
      
      // Patch Draw modes directly to prevent them from disabling rotation
      const drawInstance = draw.current as any;
      if (drawInstance && drawInstance.modes) {
        // This is a deep hack for Mapbox Draw internal mode lifecycle
        Object.keys(drawInstance.modes).forEach(modeKey => {
          const mode = drawInstance.modes[modeKey];
          if (mode.start) {
            const originalStart = mode.start;
            mode.start = function() {
              const result = originalStart.apply(this, arguments);
              setTimeout(forceEnableInteractions, 10);
              return result;
            };
          }
        });
      }
    });

    m.on('render', () => {
      // Extremely aggressive interaction enforcement
      if (m) {
        if (!m.dragRotate.isEnabled()) m.dragRotate.enable();
        if (!m.touchZoomRotate.isEnabled()) m.touchZoomRotate.enable();
        if (!m.touchPitch.isEnabled()) m.touchPitch.enable();
        // @ts-ignore
        if (m.touchRotate && !m.touchRotate.isEnabled()) m.touchRotate.enable();
        if (!m.keyboard.isEnabled()) m.keyboard.enable();
      }
    });

    // Additional event-based forcing to counteract Draw's internal state machine
    const forceEnable = () => {
      if (m && m.dragRotate && !m.dragRotate.isEnabled()) m.dragRotate.enable();
      if (m && m.touchZoomRotate && !m.touchZoomRotate.isEnabled()) m.touchZoomRotate.enable();
    };
    m.on('mousedown', forceEnable);
    m.on('touchstart', forceEnable);
    m.on('movestart', forceEnable);

    // Explicitly re-enable on mode changes
    m.on('draw.modechange', () => {
      setTimeout(() => {
        forceEnableInteractions();
        forceEnable();
      }, 0);
    });

    // Handle compass specifically - if it's disabled, we force it back
    m.on('rotate', forceEnable);

    const geocoderApi: any = {
      forwardGeocode: async (config: any) => {
        const features = [];
        try {
          const request = `https://photon.komoot.io/api/?q=${encodeURIComponent(config.query)}&limit=1`;
          const response = await fetch(request);
          const geojson = await response.json();
          for (const feature of geojson.features) {
            const center = feature.geometry.coordinates;
            const p = feature.properties;
            
            // Build a readable place name using unique parts
            const placeParts = [p.name, p.street, p.housenumber, p.district, p.city, p.county, p.state, p.country].filter(Boolean);
            const place_name = Array.from(new Set(placeParts)).join(', ');
            
            const featurePayload: any = {
              type: 'Feature',
              geometry: feature.geometry,
              place_name: place_name,
              properties: p,
              text: p.name || place_name,
              place_type: ['place'],
              center: center
            };
            
            features.push(featurePayload);
          }
        } catch (e) {
          console.error("Failed to forwardGeocode", e);
        }
        return { type: 'FeatureCollection', features };
      }
    };

    const geocoder = new MapLibreGeocoder(geocoderApi, {
      maplibregl: maplibregl,
      placeholder: 'Tìm kiếm địa điểm...',
      marker: false,
      zoom: 14,
      flyTo: { zoom: 14 }
    } as any);
    geocoderRef.current = geocoder;
    
    // Hidden container for geocoder instance to be active
    const geocoderContainer = document.createElement('div');
    geocoderContainer.id = 'hidden-geocoder';
    geocoderContainer.style.display = 'none';
    document.body.appendChild(geocoderContainer);
    geocoderContainer.appendChild(geocoder.onAdd(m));
    
    geocoder.on('result', (e: any) => {
      // 1. Always show a search result marker
      const m = map.current;
      if (m) {
        // Clear previous search marker if any
        if (m.getSource('search-marker')) {
          (m.getSource('search-marker') as maplibregl.GeoJSONSource).setData(e.result);
        } else {
          m.addSource('search-marker', { type: 'geojson', data: e.result });
          m.addLayer({
            id: 'search-marker-layer',
            type: 'circle',
            source: 'search-marker',
            paint: {
              'circle-radius': 8,
              'circle-color': '#ef4444',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });
        }
      }

      if (isLinkingMode && selectedFeatureId) {
        const feat = draw.current?.get(selectedFeatureId);
        if (feat) {
          let origin: [number, number];
          if (feat.geometry.type === 'Polygon') {
            const c = centroid(feat as any);
            origin = c.geometry.coordinates as [number, number];
          } else if (feat.geometry.type === 'LineString') {
            origin = feat.geometry.coordinates[feat.geometry.coordinates.length - 1] as [number, number];
          } else {
            origin = (feat.geometry as any).coordinates as [number, number];
          }
          
          const destination = e.result.center;
          
          // Draw a new route from origin to destination
          const newRouteId = Date.now().toString();
          if (routeType === 'real') {
            fetchRealRoute(newRouteId, [origin, destination], travelMode);
          } else {
            const line = {
              type: 'Feature',
              id: newRouteId,
              geometry: { type: 'LineString', coordinates: [origin, destination] },
              properties: { isRoute: true, routeType: 'straight', distance: '', travelMode: travelMode }
            };
            const len = length(line as any, { units: 'kilometers' });
            line.properties.distance = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0)} m`;
            draw.current?.add(line as any);
            setDrawnFeatures(draw.current?.getAll().features || []);
          }
          setIsLinkingMode(false);
        }
      }
    });

    const d = new MapboxDraw({
      displayControlsDefault: false,
      userProperties: true,
      controls: {
        trash: false
      },
      styles: mapboxDrawStyles as any
    });
    draw.current = d;
    m.addControl(d as any, 'top-right');

    const enableInteractions = () => {
      if (!m) return;
      try {
        m.dragRotate.enable();
        m.touchZoomRotate.enable();
        // @ts-ignore
        if (m.touchRotate) m.touchRotate.enable();
      } catch (e) {}
    };
    
    // Force interactions to be active even if Draw tries to suppress them
    m.on('draw.modechange', enableInteractions);
    m.on('draw.selectionchange', enableInteractions);
    m.on('draw.create', enableInteractions);
    m.on('draw.update', enableInteractions);
    
    // Immediate and style load re-enabling
    m.on('style.load', enableInteractions);

    const handleCreate = (e: any) => handleDrawCreateRef.current(e);
    const handleUpdate = (e: any) => handleDrawUpdateRef.current(e);
    const handleDelete = () => setDrawnFeatures(d.getAll().features || []);

    m.on('click', (e) => handleMapClickRef.current(e));

    m.on('draw.create', handleCreate);
    m.on('draw.update', handleUpdate);
    m.on('draw.delete', handleDelete);
    m.on('draw.selectionchange', (e: any) => {
      const selected = e.features;
      if (selected && selected.length > 0) {
        const featureId = selected[0].id;
        setSelectedFeatureId(featureId);
        
        // Auto-switch to direct_select mode so user can drag nodes / endpoints natively
        const geomType = selected[0].geometry.type;
        if (geomType === 'LineString' || geomType === 'Polygon') {
          setTimeout(() => {
            try {
              if (d.getMode() !== 'direct_select') {
                d.changeMode('direct_select', { featureId: featureId });
              }
            } catch (err) {}
          }, 0);
        }
      } else {
        setSelectedFeatureId(null);
      }
    });

    m.on('mousemove', (e: any) => {
      setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    m.on('dragstart', () => {
      setAnimatingFeatures(prev => {
        let hasChanges = false;
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id].isFpv) {
            next[id] = { ...next[id], isFpv: false };
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    });
    
    m.on('style.load', () => {
      // Add custom Viet Nam islands layer
      if (!m.getSource('vietnam-islands')) {
        m.addSource('vietnam-islands', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: 'Quần đảo Hoàng Sa' },
                geometry: { type: 'Point', coordinates: [112.0228, 16.5516] }
              },
              {
                type: 'Feature',
                properties: { name: 'Quần đảo Trường Sa' },
                geometry: { type: 'Point', coordinates: [114.2833, 10.1500] }
              }
            ]
          }
        });
        m.addLayer({
          id: 'vietnam-islands-label',
          type: 'symbol',
          source: 'vietnam-islands',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 13,
            'text-anchor': 'center',
            'text-justify': 'center'
          },
          paint: {
            'text-color': '#0369a1',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        });
      }

      // Clean up all markers first to ensure fresh state on style change
      Object.keys(markerInstances.current).forEach(id => {
        markerInstances.current[id].remove();
        delete markerInstances.current[id];
      });
      // Force re-sync from state
      setAnnotations(prev => [...prev]);

      // Re-add terrain if was active
      if (is3DRef.current) {
        if (!m.getSource('terrain')) {
          m.addSource('terrain', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 14
          });
        }
        
        // Use requestAnimationFrame to ensure style is ready for terrain
        requestAnimationFrame(() => {
          if (m.getSource('terrain')) {
            try {
              m.setTerrain({ source: 'terrain', exaggeration: 1.5 });
            } catch (err) {
              console.warn('Failed to set terrain:', err);
            }
          }
        });
      }
      
      // Inject 3D Buildings if Map Style is ARCHITECTURE
      if (mapStyleRef.current === 'ARCHITECTURE') {
        const layers = m.getStyle().layers;
        const sources = m.getStyle().sources;
        
        let labelLayerId;
        if (layers) {
          for (let i = 0; i < layers.length; i++) {
            const layer = layers[i] as any;
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              labelLayerId = layer.id;
              break;
            }
          }
        }
        
        // Find correct vector source name (usually 'carto' or 'openmaptiles')
        let vectorSourceId = 'carto';
        if (sources && !sources['carto']) {
          if (sources['openmaptiles']) {
            vectorSourceId = 'openmaptiles';
          } else {
            // Find the first vector source
            const firstVectorSource = Object.keys(sources).find(k => sources[k].type === 'vector');
            if (firstVectorSource) vectorSourceId = firstVectorSource;
          }
        }
        
        if (!m.getLayer('3d-buildings') && m.getSource(vectorSourceId)) {
          try {
            m.addLayer(
              {
                'id': '3d-buildings',
                'source': vectorSourceId,
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                  'fill-extrusion-color': '#aaa',
                  // use an 'interpolate' expression to add a smooth transition effect to the buildings as the user zooms in
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              },
              labelLayerId
            );
          } catch (e) {
            console.warn('Could not add 3D buildings layer', e);
          }
        }
      }

      // Re-add admin boundaries if active
      if (adminBoundaryRef.current) {
        // Handled by setupCustomLayers() called at line 1657
      }
    });

    return () => {
      m.remove();
      if (document.getElementById('hidden-geocoder')) {
        document.getElementById('hidden-geocoder')?.remove();
      }
    };
  }, [setupImages]);

  const exportMap = async () => {
    if (!mapContainer.current) return;
    
    setIsExporting(true);
    try {
      if (map.current) {
        // Force a repaint just before capture
        map.current.triggerRepaint();
        await new Promise(resolve => map.current?.once('render', resolve));
      }

      // Use toPng for better reliability with WebGL and external images
      const dataUrl = await toPng(mapContainer.current, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality/resolution
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `map-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Không thể xuất bản đồ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDrawMode = (mode: 'draw_polygon' | 'draw_line' | 'annotate' | 'image' | 'icon' | 'routing') => {
    if (activeMode === mode) {
      setActiveMode('view');
      draw.current?.changeMode('simple_select');
      return;
    }
    
    setActiveMode(mode);
    if (mode === 'draw_polygon') {
      draw.current?.changeMode('draw_polygon');
    } else if (mode === 'draw_line') {
      draw.current?.changeMode('draw_line_string');
    } else {
      // For others we use native click handler, 
      // so we set Draw to neutral mode
      draw.current?.changeMode('simple_select');
    }
  };

  useEffect(() => {
    if (!map.current) return;
    const canvas = map.current.getCanvas();
    if (activeMode === 'annotate') {
      canvas.style.cursor = 'crosshair';
    } else if (activeMode === 'view') {
      canvas.style.cursor = ''; // Reset to default
    }
  }, [activeMode]);

  const handleSearch = (query: string) => {
    if (geocoderRef.current) {
      geocoderRef.current.query(query);
    }
  };

  const editRoute = async (feature: any) => {
    const { originalWaypoints, travelMode, routeType } = feature.properties;
    setRoutingStart({ query: '', coords: originalWaypoints[0] });
    setRoutingEnd({ query: '', coords: originalWaypoints[1] });
    setTravelMode(travelMode);
    setRouteType(routeType);
    setActiveMode('routing');
    setRoutingFocus('start');
  };

  const toggle3D = () => {
    if (!map.current) return;
    const next3D = !is3D;
    setIs3D(next3D);
    is3DRef.current = next3D;
    
    if (next3D) {
      if (!map.current.getSource('terrain')) {
        map.current.addSource('terrain', {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 14
        });
      }
      
      try {
        map.current.setTerrain({ source: 'terrain', exaggeration: 1.5 });
        map.current.easeTo({ pitch: 60, bearing: 20, duration: 1000 });
        updateBuildings3D(map.current, true);
      } catch (err) {
        console.error('Error enabling 3D:', err);
      }
    } else {
      try {
        map.current.setTerrain(null);
        map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        updateBuildings3D(map.current, false);
      } catch (err) {
        console.error('Error disabling 3D:', err);
      }
    }
  };

  const handleOverlayClick = async (e: React.MouseEvent) => {
    if (!map.current || !['annotate', 'image', 'icon', 'routing'].includes(activeMode)) return;

    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Project pixel to LngLat
    const lngLatObj = map.current.unproject([x, y]);
    const lngLat: [number, number] = [lngLatObj.lng, lngLatObj.lat];
    
    if (activeMode === 'routing' && routingFocusRef.current) {
      const query = `${lngLat[1].toFixed(5)}, ${lngLat[0].toFixed(5)}`;
      try {
         setIsSearching(true);
         // Reverse geocoding
         const resp = await fetch(`https://photon.komoot.io/reverse?lon=${lngLat[0]}&lat=${lngLat[1]}`);
         const data = await resp.json();
         const address = data.features?.[0]?.properties?.name || data.features?.[0]?.properties?.street || query;
         
         if (routingFocusRef.current === 'start') {
           setRoutingStart({ query: address, coords: lngLat });
           setRoutingFocus('end');
         } else {
           setRoutingEnd({ query: address, coords: lngLat });
         }
      } catch (err) {
         if (routingFocusRef.current === 'start') {
           setRoutingStart({ query, coords: lngLat });
           setRoutingFocus('end');
         } else {
           setRoutingEnd({ query, coords: lngLat });
         }
      } finally {
         setIsSearching(false);
      }
      return;
    }

    setAssetModal({
      isOpen: true,
      type: activeMode as 'annotate' | 'image' | 'icon',
      lngLat,
      text: activeMode === 'annotate' ? 'Chú thích mới' : (activeMode === 'image' ? 'Hình ảnh' : 'Biểu tượng'),
      imageUrl: '',
      icon: 'flag',
      size: '120',
      textColor: '#1f2937',
      fontSize: 14,
      fontWeight: '600',
      isUploading: false,
      editId: null
    });
    
    // Mode resetting is now handled in saveAsset or close to ensure crosshair visibility during setup
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAssetModal(prev => ({ ...prev, isUploading: true }));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAssetModal(prev => ({ 
        ...prev, 
        imageUrl: result,
        isUploading: false 
      }));
    };
    reader.onerror = () => {
      setAssetModal(prev => ({ ...prev, isUploading: false }));
      alert('Lỗi tải ảnh lên. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const saveAsset = () => {
    if (!assetModal.lngLat || assetModal.isUploading) return;
    
    if (assetModal.editId) {
      setAnnotations(prev => prev.map(a => a.id === assetModal.editId ? {
        ...a,
        text: assetModal.text || 'Ghi chú',
        imageUrl: assetModal.imageUrl || undefined,
        icon: assetModal.type === 'icon' ? assetModal.icon : undefined,
        size: assetModal.type === 'image' ? parseInt(assetModal.size) : undefined,
        textColor: assetModal.textColor,
        fontSize: assetModal.fontSize,
        fontWeight: assetModal.fontWeight
      } : a));
    } else {
      const newAnnotation: Annotation = {
        id: Date.now().toString(36),
        lngLat: assetModal.lngLat,
        text: assetModal.text || 'Ghi chú',
        imageUrl: assetModal.imageUrl || undefined,
        icon: assetModal.type === 'icon' ? assetModal.icon : undefined,
        size: assetModal.type === 'image' ? parseInt(assetModal.size) : undefined,
        textColor: assetModal.textColor,
        fontSize: assetModal.fontSize,
        fontWeight: assetModal.fontWeight
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    
    setAssetModal(prev => ({ ...prev, isOpen: false, editId: null }));
    setActiveMode('view');
    if (map.current) map.current.getCanvas().style.cursor = '';
  };

  const handleConnectRequest = (featureId: string) => {
    setSearchTargetId(featureId);
    setSearchQuery('');
    setShowSearchModal(true);
  };

  const executeConnection = (destination: [number, number], mode: 'straight' | 'real') => {
    if (!searchTargetId || !draw.current) return;
    
    const feat = draw.current.get(searchTargetId);
    if (!feat) return;

    let origin: [number, number];
    if (feat.geometry.type === 'Polygon') {
      const c = centroid(feat as any);
      origin = c.geometry.coordinates as [number, number];
    } else if (feat.geometry.type === 'LineString') {
      origin = feat.geometry.coordinates[feat.geometry.coordinates.length - 1] as [number, number];
    } else {
      origin = (feat.geometry as any).coordinates as [number, number];
    }

    const newRouteId = Date.now().toString();
    const line = {
      type: 'Feature',
      id: newRouteId,
      geometry: { type: 'LineString', coordinates: [origin, destination] },
      properties: { isRoute: false, routeType: mode, distance: '' }
    };
    draw.current.add(line as any);

    if (mode === 'real') {
      fetchRealRoute(newRouteId, [origin, destination], travelMode);
    } else {
      const len = length(line as any, { units: 'kilometers' });
      const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;
      draw.current.setFeatureProperty(newRouteId, 'distance', formattedLen);
      draw.current.setFeatureProperty(newRouteId, 'routeType', 'straight');
      draw.current.setFeatureProperty(newRouteId, 'originalWaypoints', [origin, destination]);
      setDrawnFeatures(draw.current.getAll().features || []);
    }
    
    setShowSearchModal(false);
    setSearchTargetId(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-bg-ui text-text-main overflow-hidden">
      {/* Header Area */}
      <header className="h-[60px] bg-white border-b border-border-main flex items-center px-5 justify-between z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            M
          </div>
          <h1 className="text-lg font-semibold tracking-tight">MapInfo Customizer</h1>
        </div>
        
        <div className="hidden md:flex items-center bg-bg-ui border border-border-main rounded-lg px-3 py-1.5 w-[400px] gap-2">
          <Search size={16} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Tìm kiếm địa điểm..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-text-muted/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e.currentTarget.value);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-white border border-border-main rounded-md text-xs font-medium hover:bg-zinc-50 transition-colors">
            Nhập dữ liệu
          </button>
          <div className="w-9 h-9 rounded-full bg-zinc-200 border-2 border-white shadow-sm overflow-hidden relative">
            <Image src="https://picsum.photos/seed/user/100/100" alt="User" fill referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Tool Selection */}
        <aside className="w-16 bg-white border-r border-border-main flex flex-col items-center py-5 gap-4 z-20 shrink-0 h-full relative">
          <div className="flex flex-col items-center gap-4 overflow-y-auto overflow-x-visible custom-scrollbar w-full flex-1 pb-4">
            <ToolButton 
              active={activeMode === 'draw_polygon'} 
              onClick={() => toggleDrawMode('draw_polygon')}
              icon={<Square size={20} />} 
              label="Square"
            />
            <ToolButton 
              active={activeMode === 'draw_line'} 
              onClick={() => toggleDrawMode('draw_line')}
              icon={<Route size={20} />} 
              label="Line"
            />
            <ToolButton 
              active={activeMode === 'annotate'} 
              onClick={() => toggleDrawMode('annotate')}
              icon={<Info size={20} />} 
              label="Ghi chú" 
            />
            <ToolButton 
              active={activeMode === 'image'} 
              onClick={() => toggleDrawMode('image')} 
              icon={<Download size={20} className="rotate-180" />} 
              label="Chèn ảnh" 
            />
            <ToolButton 
              active={activeMode === 'icon'} 
              onClick={() => toggleDrawMode('icon')} 
              icon={<MapPin size={20} />} 
              label="Chèn biểu tượng" 
            />
            <ToolButton 
              active={activeMode === 'routing'} 
              onClick={() => {
                toggleDrawMode('routing');
                setRoutingFocus('start');
              }} 
              icon={<Navigation size={20} />} 
              label="Tạo chỉ đường" 
            />
            
            <div className="h-px w-8 bg-border-main my-2 shrink-0" />
            
            <button 
              onClick={() => setRouteType(t => t === 'straight' ? 'real' : 'straight')}
              className={cn(
                "w-10 h-10 rounded-lg transition-all flex flex-col items-center justify-center gap-1 shrink-0",
                routeType === 'real' ? "bg-blue-50 text-accent ring-1 ring-blue-200" : "bg-zinc-50 text-text-muted hover:bg-zinc-100"
              )}
              title={routeType === 'real' ? "Đang dùng đường thực" : "Đang dùng đường tuyến tính"}
            >
              <Route size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none">{routeType === 'real' ? 'Real' : 'Air'}</span>
            </button>

            {routeType === 'real' && (
              <div className="flex flex-col gap-1 p-1 bg-zinc-50 rounded-lg border border-border-main w-10 items-center shrink-0">
                <button 
                  onClick={() => setTravelMode('driving')} 
                  className={cn("p-1.5 rounded-md transition-all", travelMode === 'driving' ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text-main")} 
                  title="Ô-tô"
                >
                  <Car size={16} />
                </button>
                <button 
                  onClick={() => setTravelMode('motorbike')} 
                  className={cn("p-1.5 rounded-md transition-all", travelMode === 'motorbike' ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text-main")} 
                  title="Xe máy"
                >
                  <Bike size={16} />
                </button>
                <button 
                  onClick={() => setTravelMode('walking')} 
                  className={cn("p-1.5 rounded-md transition-all", travelMode === 'walking' ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text-main")} 
                  title="Đi bộ"
                >
                  <Footprints size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-4 mb-2 relative">
            <button 
              ref={layerButtonRef}
              onClick={() => setShowLayerPicker(!showLayerPicker)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all relative",
                showLayerPicker ? "bg-blue-50 text-accent border border-blue-200 shadow-sm" : "bg-transparent text-text-muted hover:bg-bg-ui"
              )}
              title="Lớp bản đồ"
            >
              <Layers size={20} />
            </button>
            
            <AnimatePresence>
              {showLayerPicker && (
                <motion.div 
                  ref={layerPickerRef}
                  initial={{ opacity: 0, x: -10, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -10, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-3 bottom-0 w-[calc(100vw-80px)] max-w-64 bg-white border border-border-main rounded-xl shadow-panel p-2 z-[100] flex flex-col gap-1 md:w-64"
                >
                  <div className="px-2 py-1 flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Bản đồ nền</span>
                    <button 
                       onClick={toggle3D}
                       className={cn("text-[10px] px-2 py-0.5 rounded font-bold transition-colors", is3D ? "bg-accent text-white" : "bg-zinc-100 text-text-muted hover:bg-zinc-200")}
                    >
                      3D
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {Object.entries(MAP_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => {
                           if (!map.current) return;
                           const currentCenter = map.current.getCenter();
                           const currentZoom = map.current.getZoom();
                           const currentPitch = map.current.getPitch();
                           const currentBearing = map.current.getBearing();
                           
                           let targetZoom = currentZoom;
                           const isSatellite = key === 'SATELLITE' || key === 'HYBRID' || key === 'ARCGIS_HYBRID';
                           if (isSatellite && targetZoom > 16) {
                             targetZoom = 16;
                           }
                           
                           setMapStyleKey(key);
                           map.current.setStyle(style.url);
                           
                           // Explicitly re-apply camera settings after style load to prevent jumps
                           map.current.once('style.load', () => {
                             map.current?.jumpTo({
                                center: currentCenter,
                                zoom: targetZoom,
                                pitch: currentPitch,
                                bearing: currentBearing
                              });
                           });
                           
                           setShowLayerPicker(false);
                        }}
                        className={cn(
                          "text-[11px] px-2 py-2 rounded-lg text-left transition-all border col-span-1 leading-tight flex flex-col gap-0.5 min-h-[44px]",
                          mapStyleKey === key ? "bg-blue-50 border-blue-200 text-accent shadow-sm" : "bg-transparent border-transparent text-text-main hover:bg-zinc-50"
                        )}
                      >
                        <span className="font-bold line-clamp-1">{style.label}</span>
                        <span className="text-[8px] opacity-60 uppercase tracking-tighter">
                          {style.category === 'vector' ? 'Vector' : 'Raster'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-border-main my-1" />
                  
                  <div className="px-2 py-1 flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Lớp hiển thị</span>
                  </div>
                  <div className="px-1 pb-1">
                    <button
                      onClick={() => setShowAdminBoundaries(!showAdminBoundaries)}
                      className={cn(
                        "w-full text-[11px] px-2 py-2 rounded-lg text-left transition-colors font-medium border leading-tight flex items-center justify-between",
                        showAdminBoundaries ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-transparent border-transparent text-text-main hover:bg-zinc-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        Ranh giới hành chính VN
                      </span>
                      <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center", showAdminBoundaries ? "bg-cyan-500 border-cyan-500 text-white" : "border-border-main bg-white")}>
                        {showAdminBoundaries && <Check size={10} />}
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Map Center Area */}
        <section className="flex-1 relative bg-zinc-200 overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Asset Placement & Routing Overlay */}
          {['annotate', 'image', 'icon', 'routing'].includes(activeMode) && (
            <div 
              className="absolute inset-0 z-[100] cursor-crosshair"
              onClick={handleOverlayClick}
            />
          )}

          {/* Routing Panel */}
          <AnimatePresence>
            {activeMode === 'routing' && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 z-[200] border border-border-main"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-zinc-900 flex items-center gap-2">
                    <Navigation size={16} className="text-accent" />
                    Chỉ đường
                  </h3>
                  <button onClick={() => {
                    setActiveMode('view');
                    setRoutingFocus(null);
                  }} className="text-text-muted hover:text-red-500 transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="space-y-3 relative">
                  <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-200" />
                  
                  <div className="relative">
                    <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-text-main z-10" />
                    <div className="pl-6 flex items-center bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent ml-3 transition-colors">
                       <input 
                         type="text" 
                         value={routingStart.query} 
                         onChange={e => setRoutingStart({ ...routingStart, query: e.target.value })}
                         onFocus={() => setRoutingFocus('start')}
                         placeholder="Chọn điểm bắt đầu..."
                         className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                         onKeyDown={async e => {
                            if (e.key === 'Enter' && routingStart.query) {
                              try {
                                setIsSearching(true);
                                const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(routingStart.query)}&limit=1`);
                                const data = await resp.json();
                                if (data.features?.length > 0) {
                                  const coords = data.features[0].geometry.coordinates;
                                  setRoutingStart({ query: data.features[0].properties.name || routingStart.query, coords });
                                  setRoutingFocus('end');
                                }
                              } finally {
                                setIsSearching(false);
                              }
                            }
                         }}
                       />
                       {routingStart.coords && <Check size={16} className="text-green-500 mr-2" />}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent border-[3px] border-white shadow-sm z-10" />
                    <div className="pl-6 flex items-center bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent ml-3 transition-colors">
                       <input 
                         type="text" 
                         value={routingEnd.query} 
                         onChange={e => setRoutingEnd({ ...routingEnd, query: e.target.value })}
                         onFocus={() => setRoutingFocus('end')}
                         placeholder="Chọn điểm đến..."
                         className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                         onKeyDown={async e => {
                            if (e.key === 'Enter' && routingEnd.query) {
                              try {
                                setIsSearching(true);
                                const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(routingEnd.query)}&limit=1`);
                                const data = await resp.json();
                                if (data.features?.length > 0) {
                                  const coords = data.features[0].geometry.coordinates;
                                  setRoutingEnd({ query: data.features[0].properties.name || routingEnd.query, coords });
                                }
                              } finally {
                                setIsSearching(false);
                              }
                            }
                         }}
                       />
                       {routingEnd.coords && <Check size={16} className="text-green-500 mr-2" />}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    {['straight', 'real'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setRouteType(t as any)}
                        className={cn(
                          "flex-1 py-1.5 flex justify-center rounded-md font-medium text-[10px] uppercase transition-colors tracking-tight",
                          routeType === t ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-main"
                        )}
                      >
                        {t === 'straight' ? 'Đường thẳng' : 'Đường thực'}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    {['driving', 'motorbike', 'walking'].map((m) => (
                      <button 
                        key={m}
                        onClick={() => setTravelMode(m as any)}
                        className={cn(
                          "flex-1 py-1.5 flex justify-center rounded-md font-medium text-xs transition-colors",
                          travelMode === m ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-main"
                        )}
                      >
                        {m === 'driving' ? <Car size={14} /> : m === 'motorbike' ? <Bike size={14} /> : <Footprints size={14} />}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={async () => {
                      let start = routingStart.coords;
                      let end = routingEnd.coords;
                      
                      const geocode = async (q: string) => {
                         const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
                         const json = await res.json();
                         if (json.features?.length > 0) return json.features[0].geometry.coordinates as [number, number];
                         return null;
                      };

                      if (!start && routingStart.query) {
                        start = await geocode(routingStart.query);
                      }
                      if (!end && routingEnd.query) {
                         end = await geocode(routingEnd.query);
                      }

                      if (start && end) {
                        const newRouteId = Date.now().toString();
                        const line = {
                          type: 'Feature',
                          id: newRouteId,
                          geometry: { type: 'LineString', coordinates: [start, end] },
                          properties: { isRoute: false, routeType: routeType, distance: '' }
                        };
                        draw.current?.add(line as any);

                        if (routeType === 'real') {
                          await fetchRealRoute(newRouteId, [start, end], travelMode);
                        } else {
                          const len = length(line as any, { units: 'kilometers' });
                          const formattedLen = len > 1 ? `${len.toFixed(2)} km` : `${(len * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;
                          draw.current?.setFeatureProperty(newRouteId, 'distance', formattedLen);
                          draw.current?.setFeatureProperty(newRouteId, 'routeType', 'straight');
                          draw.current?.setFeatureProperty(newRouteId, 'originalWaypoints', [start, end]);
                          draw.current?.setFeatureProperty(newRouteId, 'travelMode', travelMode);
                          setDrawnFeatures(draw.current?.getAll().features || []);
                        }
                        
                        setActiveMode('view');
                        setRoutingFocus(null);
                        setRoutingStart({ query: '', coords: null });
                        setRoutingEnd({ query: '', coords: null });
                      } else {
                        alert('Vui lòng chọn cả điểm đi và điểm đến hợp lệ!');
                      }
                    }}
                    disabled={(!routingStart.query && !routingStart.coords) || (!routingEnd.query && !routingEnd.coords) || isSearching}
                    className="w-full py-2 bg-accent text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSearching ? <span className="animate-pulse">Đang tìm kiếm...</span> : 'Tạo tuyến đường'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle for Data Panel (when hidden) */}
          {!showDataPanel && (
            <button 
              onClick={() => setShowDataPanel(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-l-0 border-border-main rounded-l-md shadow-sm flex items-center justify-center text-text-muted hover:text-accent z-30 transition-colors"
              title="Hiện bảng dữ liệu"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Overlay Helpers */}
          <AnimatePresence>
            {(activeMode !== 'view' || selectedFeatureId || isLinkingMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-panel border border-border-main flex items-center gap-3 z-30"
              >
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-main">
                    {selectedFeatureId && !isLinkingMode && 'Tùy chỉnh đối tượng: Điều chỉnh tham số ở bảng bên phải.'}
                    {activeMode === 'draw_polygon' && 'Vẽ vùng: Click các điểm, nối điểm đầu để hoàn tất.'}
                    {activeMode === 'draw_line' && 'Vẽ tuyến: Click để thêm điểm nút.'}
                    {activeMode === 'annotate' && 'Ghi chú: Click vị trí trên bản đồ để đặt chú thích.'}
                    {activeMode === 'image' && 'Chèn ảnh: Click vị trí trên bản đồ để đặt ảnh.'}
                    {activeMode === 'icon' && 'Chèn biểu tượng: Click vị trí trên bản đồ để đặt biểu tượng.'}
                    {isLinkingMode && 'Kết nối: Tìm kiếm địa điểm mới ở ô tìm kiếm để vẽ tuyến.'}
                  </span>
                  <p className="text-[10px] text-text-muted italic border-t border-border-main/50 mt-1 pt-1 opacity-80">
                    * Mẹo: Nhấn giữ Chuột phải + Kéo hoặc 2 ngón tay để Xoay bản đồ
                  </p>
                </div>
                <button 
                  onClick={() => {
                    // Force a final sync of properties before closing
                    if (draw.current) {
                      const all = draw.current.getAll().features;
                      setDrawnFeatures([...all]);
                      // Deselect everything to finalize styling and clear "active" state
                      draw.current.changeMode('simple_select', { featureIds: [] });
                    }
                    setActiveMode('view');
                    setSelectedFeatureId(null);
                    setIsLinkingMode(false);
                  }}
                  className="ml-2 px-3 py-1 bg-zinc-900 text-white text-[10px] uppercase font-bold tracking-wider rounded-md hover:bg-zinc-800 transition-colors shadow-lg active:scale-95 transition-transform"
                >
                  Hoàn thành
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Connection Search Modal */}
          <AnimatePresence>
            {showSearchModal && (
              <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-zinc-900 flex items-center gap-2">
                        <Route className="text-accent" />
                        Kết nối địa điểm mới
                      </h3>
                      <p className="text-xs text-text-muted mt-1">Tìm kiếm điểm đến để tạo tuyến đường tự động</p>
                    </div>
                    <button onClick={() => setShowSearchModal(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Tìm kiếm vị trí</label>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Nhập tên địa danh, thành phố, địa chỉ..."
                          className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-accent focus:bg-white outline-none transition-all text-sm font-medium"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const q = searchQuery;
                              if (!q || isSearching) return;
                              setIsSearching(true);
                              try {
                                const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
                                const data = await resp.json();
                                if (data.features && data.features.length > 0) {
                                  const coords = data.features[0].geometry.coordinates;
                                  executeConnection(coords as [number, number], routeType);
                                } else {
                                  alert('Không tìm thấy địa điểm này. Vui lòng thử từ khóa khác.');
                                }
                              } catch (err) {
                                console.error('Search failed:', err);
                                alert('Lỗi kết nối. Vui lòng thử lại sau.');
                              } finally {
                                setIsSearching(false);
                              }
                            }
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-text-muted italic px-2">Nhấn Enter hoặc nút bên dưới để tìm kiếm</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Kiểu tuyến đường</label>
                        <div className="flex bg-zinc-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setRouteType('straight')}
                            className={cn(
                              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                              routeType === 'straight' ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-main"
                            )}
                          >Air</button>
                          <button 
                            onClick={() => setRouteType('real')}
                            className={cn(
                              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                              routeType === 'real' ? "bg-white text-accent shadow-sm" : "text-text-muted hover:text-text-main"
                            )}
                          >Real</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Phương tiện</label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 bg-zinc-100 p-1 rounded-xl">
                          {([
                            { id: 'driving', icon: <Car size={14} /> },
                            { id: 'motorbike', icon: <Bike size={14} /> },
                            { id: 'walking', icon: <Footprints size={14} /> }
                          ] as const).map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setTravelMode(mode.id)}
                              className={cn(
                                "flex-1 py-2 rounded-lg transition-all flex items-center justify-center",
                                travelMode === mode.id ? "bg-white text-accent shadow-sm" : "text-text-muted hover:bg-zinc-200"
                              )}
                            >
                              {mode.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                    <button 
                      onClick={() => setShowSearchModal(false)}
                      className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors"
                    >Hủy bỏ</button>
                    <button 
                      onClick={async () => {
                        if (!searchQuery || isSearching) return;
                        setIsSearching(true);
                        try {
                          const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`);
                          const data = await resp.json();
                          if (data.features && data.features.length > 0) {
                            const coords = data.features[0].geometry.coordinates;
                            executeConnection(coords as [number, number], routeType);
                          } else {
                            alert('Không tìm thấy địa điểm này. Vui lòng thử từ khóa khác.');
                          }
                        } catch (err) {
                          console.error('Search failed:', err);
                          alert('Lỗi kết nối. Vui lòng thử lại sau.');
                        } finally {
                          setIsSearching(false);
                        }
                      }}
                      disabled={!searchQuery || isSearching}
                      className={cn(
                        "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm",
                        !searchQuery 
                          ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
                          : "bg-accent text-white hover:bg-blue-600 active:scale-95"
                      )}
                    >
                      {isSearching ? 'Đang kết nối...' : 'Tìm kiếm & Kết nối'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Custom Asset Input Modal */}
          <AnimatePresence>
            {assetModal.isOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-2xl shadow-2xl border border-border-main w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
                >
                  <div className="p-5 border-b border-border-main bg-zinc-50 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                       {assetModal.type === 'annotate' && <Info className="text-blue-500" size={20} />}
                       {assetModal.type === 'image' && <Download className="text-orange-500 rotate-180" size={20} />}
                       {assetModal.type === 'icon' && <MapPin className="text-green-500" size={20} />}
                       {assetModal.type === 'annotate' && 'Thêm chú thích'}
                       {assetModal.type === 'image' && 'Chèn hình ảnh'}
                       {assetModal.type === 'icon' && 'Chèn biểu tượng'}
                    </h3>
                    <button 
                      onClick={() => setAssetModal(prev => ({ ...prev, isOpen: false }))}
                      className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-text-muted"
                    >
                      <Plus className="rotate-45" size={20} />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Nội dung hiển thị</label>
                      <input 
                        type="text" 
                        value={assetModal.text}
                        onChange={(e) => setAssetModal(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Nhập ghi chú hoặc mô tả..."
                        className="w-full px-4 py-3 bg-zinc-50 border border-border-main rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    
                    {(assetModal.type === 'image' || assetModal.type === 'annotate') && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Chọn ảnh hoặc Nhập URL</label>
                          <div className="flex gap-2">
                             <label className="flex-1 cursor-pointer">
                                <div className={cn(
                                  "flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-xl transition-all",
                                  assetModal.imageUrl ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-zinc-50 border-border-main text-text-muted hover:border-accent"
                                )}>
                                  <Download className="rotate-180" size={18} />
                                  <span className="text-xs font-bold uppercase">{assetModal.imageUrl.startsWith('data:') ? 'Đã chọn ảnh' : 'Tải ảnh lên'}</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                             </label>
                             {assetModal.imageUrl && (
                               <button 
                                onClick={() => setAssetModal(prev => ({ ...prev, imageUrl: '' }))}
                                className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-100"
                               >
                                 <Plus className="rotate-45" size={18} />
                               </button>
                             )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Đường dẫn ảnh trực tiếp</label>
                          <input 
                            type="text" 
                            value={assetModal.imageUrl}
                            onChange={(e) => setAssetModal(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-3 bg-zinc-50 border border-border-main rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all font-mono text-[10px]"
                          />
                        </div>

                        {assetModal.imageUrl && (
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-border-main bg-zinc-100 shadow-inner group">
                             <img src={assetModal.imageUrl} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold uppercase px-3 py-1.5 bg-black/60 rounded-full backdrop-blur-md">Xem trước</span>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {assetModal.type === 'image' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Kích thước (pixels)</label>
                        <input 
                          type="number" 
                          value={assetModal.size}
                          onChange={(e) => setAssetModal(prev => ({ ...prev, size: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-border-main rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    )}

                    {assetModal.type === 'icon' && (
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Biểu tượng hiện đại 3D</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {Object.entries(DISASTER_ICONS).map(([id, data]) => (
                            <button 
                              key={id}
                              onClick={() => setAssetModal(prev => ({ ...prev, icon: id, text: data.label }))}
                              className={cn(
                                "p-2 rounded-xl border transition-all flex flex-col items-center gap-1 group",
                                assetModal.icon === id ? "bg-accent/10 border-accent shadow-sm" : "bg-white border-border-main hover:bg-zinc-50"
                              )}
                            >
                               <img src={data.url} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt={data.label} />
                               <span className="text-[8px] font-bold text-center leading-tight truncate w-full">{data.label}</span>
                            </button>
                          ))}
                        </div>

                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Biểu tượng cơ bản</label>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.keys(ICON_PATHS).map(ic => {
                            const IconComponent = ({ name }: { name: string }) => {
                              if (name === 'flag') return <Flag size={20} />;
                              if (name === 'home') return <Home size={20} />;
                              if (name === 'school') return <School size={20} />;
                              if (name === 'camera') return <Camera size={20} />;
                              if (name === 'coffee') return <Coffee size={20} />;
                              if (name === 'car') return <Car size={20} />;
                              if (name === 'star') return <Star size={20} />;
                              if (name === 'alert-circle') return <AlertCircle size={20} />;
                              if (name === 'check-circle') return <CheckCircle size={20} />;
                              if (name === 'info') return <Info size={20} />;
                              return <MapPin size={20} />;
                            };
                            return (
                              <button 
                                key={ic}
                                onClick={() => setAssetModal(prev => ({ ...prev, icon: ic }))}
                                className={cn(
                                  "p-3 rounded-lg border transition-all flex items-center justify-center",
                                  assetModal.icon === ic ? "bg-accent text-white border-accent shadow-md" : "bg-white border-border-main text-text-muted hover:bg-zinc-50"
                                )}
                              >
                                 <IconComponent name={ic} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border-main space-y-4">
                      <h4 className="text-[10px] font-bold uppercase text-accent tracking-widest">Tùy chỉnh chữ</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-text-muted">Màu chữ</label>
                          <input 
                            type="color" 
                            value={assetModal.textColor}
                            onChange={(e) => setAssetModal(prev => ({ ...prev, textColor: e.target.value }))}
                            className="w-full h-10 rounded-lg cursor-pointer p-0 border-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-text-muted">Cỡ chữ ({assetModal.fontSize}px)</label>
                          <input 
                            type="range" min="8" max="48" 
                            value={assetModal.fontSize}
                            onChange={(e) => setAssetModal(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                            className="w-full h-10 accent-accent"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-text-muted">Độ đậm font</label>
                        <div className="flex gap-2">
                          {['400', '600', '800'].map(w => (
                            <button
                              key={w}
                              onClick={() => setAssetModal(prev => ({ ...prev, fontWeight: w }))}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all",
                                assetModal.fontWeight === w ? "bg-accent text-white border-accent" : "bg-white border-border-main text-text-muted"
                              )}
                            >
                              {w === '400' ? 'Thường' : w === '600' ? 'Đậm' : 'Rất đậm'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 border-t border-border-main flex gap-3 shrink-0">
                    <button 
                      onClick={() => {
                        setAssetModal(prev => ({ ...prev, isOpen: false }));
                        setActiveMode('view');
                        if (map.current) map.current.getCanvas().style.cursor = '';
                      }}
                      className="flex-1 py-3 bg-white border border-border-main text-text-main font-bold rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={saveAsset}
                      className="flex-[2] py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg active:scale-[0.98] transition-transform"
                    >
                      Hoàn thành
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </section>

        {/* Right Data Panel */}
        <AnimatePresence>
          {showDataPanel && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="hidden lg:flex w-[280px] bg-white border-l border-border-main flex-col z-20 shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-border-main flex items-center justify-between">
                <h2 className="text-sm font-semibold truncate">Lớp dữ liệu ({drawnFeatures.length + annotations.length})</h2>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                        setAnnotations([]);
                        if (draw.current) {
                            draw.current.deleteAll();
                            setDrawnFeatures([]);
                        }
                    }}
                    className="text-text-muted hover:text-red-500 p-1 rounded-md transition-colors"
                    title="Xóa tất cả"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="text-accent hover:bg-blue-50 p-1 rounded-md transition-colors"><Plus size={18} /></button>
                  <button 
                    onClick={() => setShowDataPanel(false)}
                    className="text-text-muted hover:bg-zinc-100 p-1 rounded-md transition-colors"
                    title="Thu gọn"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedAdminUnits.length > 0 && (
              <div className="p-3 bg-zinc-900 text-white rounded-lg border border-zinc-800 space-y-3 mb-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase text-accent">Đơn vị hành chính</h3>
                  <button onClick={() => setSelectedAdminUnits([])} className="text-zinc-400 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {selectedAdminUnits.length === 1 ? (
                    <>
                      <p className="text-xs font-bold truncate">{selectedAdminUnits[0].name}</p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{selectedAdminUnits[0].level === 'province' ? 'Tỉnh / Thành phố' : 'Xã / Phường / Thị trấn'}</p>
                    </>
                  ) : (
                    <p className="text-xs font-bold truncate">Đã chọn {selectedAdminUnits.length} địa phương</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Chọn màu sắc tô vùng</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      '#ef4444', '#f97316', '#f59e0b', '#facc15', '#84cc16', 
                      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
                      '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
                    ].map(color => (
                      <button 
                        key={color}
                        onClick={() => {
                          setAdminUnitColors(prev => {
                            const nextProvinces = { ...prev.provinces };
                            const nextCommunes = { ...prev.communes };
                            selectedAdminUnits.forEach(unit => {
                              if (unit.level === 'province') nextProvinces[unit.id] = color;
                              else nextCommunes[unit.id] = color;
                            });
                            return { provinces: nextProvinces, communes: nextCommunes };
                          });
                        }}
                        className={cn(
                          "w-full aspect-square rounded-md border-2 transition-all hover:scale-110",
                          selectedAdminUnits.length === 1 && (selectedAdminUnits[0].level === 'province' ? adminUnitColors.provinces[selectedAdminUnits[0].id] : adminUnitColors.communes[selectedAdminUnits[0].id]) === color
                            ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="color" 
                      className="w-full h-8 rounded cursor-pointer bg-zinc-800 border-none p-0.5"
                      value={selectedAdminUnits.length === 1 ? ((selectedAdminUnits[0].level === 'province' ? adminUnitColors.provinces[selectedAdminUnits[0].id] : adminUnitColors.communes[selectedAdminUnits[0].id]) || '#0ea5e9') : '#0ea5e9'}
                      onChange={(e) => {
                         const color = e.target.value;
                         setAdminUnitColors(prev => {
                            const nextProvinces = { ...prev.provinces };
                            const nextCommunes = { ...prev.communes };
                            selectedAdminUnits.forEach(unit => {
                              if (unit.level === 'province') nextProvinces[unit.id] = color;
                              else nextCommunes[unit.id] = color;
                            });
                            return { provinces: nextProvinces, communes: nextCommunes };
                          });
                      }}
                    />
                    <button 
                      onClick={() => {
                        setAdminUnitColors(prev => {
                          const nextProvinces = { ...prev.provinces };
                          const nextCommunes = { ...prev.communes };
                          selectedAdminUnits.forEach(unit => {
                            if (unit.level === 'province') delete nextProvinces[unit.id];
                            else delete nextCommunes[unit.id];
                          });
                          return { provinces: nextProvinces, communes: nextCommunes };
                        });
                      }}
                      className="px-2 bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                      title="Xóa màu"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Độ trong suốt (Opacity)</label>
                    <span className="text-[10px] text-accent font-bold">
                      {selectedAdminUnits.length === 1 
                        ? Math.round(((selectedAdminUnits[0].level === 'province' ? adminUnitOpacities.provinces[selectedAdminUnits[0].id] : adminUnitOpacities.communes[selectedAdminUnits[0].id]) ?? 0.25) * 100) 
                        : 'Vùng đè'}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
                    value={selectedAdminUnits.length === 1 ? ((selectedAdminUnits[0].level === 'province' ? adminUnitOpacities.provinces[selectedAdminUnits[0].id] : adminUnitOpacities.communes[selectedAdminUnits[0].id]) ?? 0.25) : 0.25}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAdminUnitOpacities(prev => {
                        const nextProvinces = { ...prev.provinces };
                        const nextCommunes = { ...prev.communes };
                        selectedAdminUnits.forEach(unit => {
                          if (unit.level === 'province') nextProvinces[unit.id] = val;
                          else nextCommunes[unit.id] = val;
                        });
                        return { provinces: nextProvinces, communes: nextCommunes };
                      });
                    }}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                   <button 
                     onClick={() => setSelectedAdminUnits([])}
                     className="flex-1 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={() => setSelectedAdminUnits([])}
                     className="flex-1 py-2 bg-accent text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md active:scale-95"
                   >
                     OK
                   </button>
                </div>
              </div>
            )}
            {selectedFeature && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase text-accent">Tùy chỉnh đối tượng</h3>
                  <button onClick={() => setSelectedFeatureId(null)} className="text-accent text-[10px]">Đóng</button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Màu sắc</label>
                    <input 
                      type="color" 
                      className="w-full h-6 rounded cursor-pointer border-none p-0"
                      value={selectedFeature.properties.color || '#3bb2d0'}
                      onChange={(e) => {
                        updateFeatureStyle(selectedFeature.id, 'color', e.target.value);
                        updateFeatureStyle(selectedFeature.id, 'fillColor', e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Độ dày ({selectedFeature.properties.width || 2}px)</label>
                    <input 
                      type="range" min="1" max="10" 
                      className="w-full h-6 accent-accent"
                      value={selectedFeature.properties.width || 2}
                      onChange={(e) => updateFeatureStyle(selectedFeature.id, 'width', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {selectedFeature.geometry.type === 'Polygon' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Độ đậm nền ({Math.round((selectedFeature.properties.fillOpacity || 0.1) * 100)}%)</label>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      className="w-full h-6 accent-accent"
                      value={selectedFeature.properties.fillOpacity || 0.1}
                      onChange={(e) => updateFeatureStyle(selectedFeature.id, 'fillOpacity', parseFloat(e.target.value))}
                    />
                  </div>
                )}

                <button 
                  onClick={() => handleConnectRequest(selectedFeature.id)}
                  className={cn(
                    "w-full py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                    "bg-white border border-accent text-accent hover:bg-blue-50"
                  )}
                >
                  <Route size={12} />
                  Kết nối địa điểm mới
                </button>

                {selectedFeature.properties.originalWaypoints && (
                  <button 
                    onClick={() => editRoute(selectedFeature)}
                    className={cn(
                      "w-full py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                      "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    <Edit2 size={12} />
                    Sửa tuyến đường
                  </button>
                )}

                {selectedFeature.properties.routeGeometry && (
                  <div className="pt-3 border-t border-blue-200 mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Mô phỏng di chuyển</span>
                      <div className="flex bg-zinc-100 p-0.5 rounded-md">
                        <button 
                          onClick={() => updateAnimationConfig(selectedFeature.id, { direction: -1 })}
                          className={cn("p-1 rounded", (animatingFeatures[selectedFeature.id]?.direction === -1) ? "bg-white shadow-sm text-accent" : "text-text-muted")}
                        >
                          <Rewind size={12} />
                        </button>
                        <button 
                          onClick={() => updateAnimationConfig(selectedFeature.id, { direction: 1 })}
                          className={cn("p-1 rounded", (animatingFeatures[selectedFeature.id]?.direction === 1 || !animatingFeatures[selectedFeature.id]) ? "bg-white shadow-sm text-accent" : "text-text-muted")}
                        >
                          <FastForward size={12} />
                        </button>
                      </div>
                      <button 
                        onClick={() => updateAnimationConfig(selectedFeature.id, { visible: !(animatingFeatures[selectedFeature.id]?.visible !== false) })}
                        className={cn(
                          "p-1 rounded ml-1 transition-colors", 
                          (animatingFeatures[selectedFeature.id]?.visible !== false) ? "text-accent bg-blue-50" : "text-text-muted hover:bg-zinc-100"
                        )}
                        title={animatingFeatures[selectedFeature.id]?.visible !== false ? "Ẩn biểu tượng" : "Hiện biểu tượng"}
                      >
                        {animatingFeatures[selectedFeature.id]?.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => toggleAnimation(selectedFeature.id)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          animatingFeatures[selectedFeature.id]?.isPlaying ? "bg-red-500 text-white shadow-lg" : "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        )}
                       >
                         {animatingFeatures[selectedFeature.id]?.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-0.5" />}
                       </button>

                       <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <label className="text-[9px] text-text-muted font-bold uppercase">Tốc độ ({animatingFeatures[selectedFeature.id]?.speed || 60} km/h)</label>
                            <Zap size={10} className="text-amber-500" />
                          </div>
                          <input 
                            type="range" min="10" max="480" step="10"
                            className="w-full h-4 accent-amber-500"
                            value={animatingFeatures[selectedFeature.id]?.speed || 120}
                            onChange={(e) => updateAnimationConfig(selectedFeature.id, { speed: parseInt(e.target.value) })}
                          />
                       </div>

                       <button 
                        onClick={() => updateAnimationConfig(selectedFeature.id, { progress: 0 })}
                        className="w-10 h-10 rounded-lg bg-zinc-100 text-text-muted flex items-center justify-center hover:bg-zinc-200 transition-colors"
                        title="Về điểm xuất phát"
                       >
                         <RotateCcw size={16} />
                       </button>

                       <button 
                        onClick={() => updateAnimationConfig(selectedFeature.id, { isFpv: !animatingFeatures[selectedFeature.id]?.isFpv })}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          animatingFeatures[selectedFeature.id]?.isFpv ? "bg-amber-500 text-white shadow-md hover:bg-amber-600" : "bg-zinc-100 text-text-muted hover:bg-zinc-200"
                        )}
                        title="Góc nhìn người thứ nhất (FPV)"
                       >
                         <Video size={16} />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {annotations.length === 0 && drawnFeatures.length === 0 && (
              <div className="py-10 text-center text-text-muted space-y-2">
                <Info size={24} className="mx-auto opacity-20" />
                <p className="text-xs">Chưa có dữ liệu nào trên bản đồ</p>
              </div>
            )}
            
            {annotations.map(ann => (
              <div 
                key={ann.id} 
                className="p-3 bg-bg-ui rounded-lg border border-border-main flex items-center gap-3 group/item hover:border-accent/50 cursor-pointer transition-colors"
                onClick={() => {
                  setAssetModal({
                    isOpen: true,
                    type: ann.imageUrl ? 'image' : ann.icon ? 'icon' : 'annotate',
                    lngLat: ann.lngLat,
                    text: ann.text || '',
                    imageUrl: ann.imageUrl || '',
                    icon: ann.icon || 'flag',
                    size: (ann.size || 120).toString(),
                    textColor: ann.textColor || '#1f2937',
                    fontSize: ann.fontSize || 14,
                    fontWeight: ann.fontWeight || '600',
                    isUploading: false,
                    editId: ann.id
                  });
                }}
              >
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-accent shadow-sm border border-border-main/50">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ann.text || (ann.imageUrl ? 'Hình ảnh' : ann.icon ? 'Biểu tượng' : 'Ghi chú')}</p>
                  <p className="text-[10px] text-text-muted italic">Click để chỉnh sửa</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnnotations(prev => prev.filter(a => a.id !== ann.id));
                  }}
                  className="text-text-muted hover:text-red-500 p-1 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {drawnFeatures.map(feat => {
              const isPolygon = feat.geometry?.type === 'Polygon';
              const isLine = feat.geometry?.type === 'LineString';
              const isRoute = feat.properties?.isRoute;
              const title = isPolygon ? 'Vùng dữ liệu' : isRoute ? 'Tuyến đường thực tế' : isLine ? 'Tuyến đường thẳng' : 'Lớp dữ liệu';
              const subtitle = feat.properties?.distance ? `Khoảng cách: ${feat.properties.distance}` : (isPolygon ? 'Polygon' : 'Feature');
              
              return (
                <div 
                  key={feat.id} 
                  className={cn(
                    "p-3 rounded-lg border flex items-center gap-3 group/item cursor-pointer transition-colors",
                    selectedFeatureId === feat.id ? "bg-blue-50 border-accent/50" : "bg-bg-ui border-border-main hover:border-accent/30"
                  )}
                  onClick={() => {
                    setSelectedFeatureId(feat.id);
                    if (draw.current) {
                      draw.current.changeMode('simple_select', { featureIds: [feat.id] });
                      
                      // Center map on feature
                      const bounds = new maplibregl.LngLatBounds();
                      if (feat.geometry.type === 'Point') {
                        bounds.extend(feat.geometry.coordinates as [number, number]);
                      } else if (feat.geometry.type === 'LineString') {
                        (feat.geometry.coordinates as number[][]).forEach(c => bounds.extend(c as [number, number]));
                      } else if (feat.geometry.type === 'Polygon') {
                        (feat.geometry.coordinates[0] as number[][]).forEach(c => bounds.extend(c as [number, number]));
                      }
                      if (!bounds.isEmpty() && map.current) {
                        map.current.fitBounds(bounds, { padding: 100, maxZoom: 16 });
                      }
                    }
                  }}
                >
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-accent shadow-sm border border-border-main/50">
                    {isPolygon ? <Square size={14} /> : <Route size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{title}</p>
                    <p className="text-[10px] text-text-muted italic">Click để chỉnh sửa</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (draw.current) {
                        draw.current.delete(feat.id);
                        setDrawnFeatures(draw.current.getAll().features);
                        if (selectedFeatureId === feat.id) setSelectedFeatureId(null);
                      }
                    }}
                    className="text-text-muted hover:text-red-500 p-1 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-bg-ui border-t border-border-main space-y-4">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Xuất dữ liệu</h3>
              <select className="w-full bg-white border border-border-main rounded-md p-2 text-xs outline-none focus:ring-1 focus:ring-accent">
                <option>Hình ảnh (PNG) - 300 DPI</option>
                <option>PDF Print ready</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={exportMap}
                disabled={isExporting}
                className="flex-1 py-2 bg-accent text-white rounded-md text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isExporting ? 'Đang xuất...' : 'Xuất vùng'}
              </button>
            </div>
          </div>
        </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Bar */}
      <footer className="h-[30px] bg-white border-t border-border-main flex items-center px-4 justify-between shrink-0 z-30">
        <div className="text-[10px] text-text-muted font-medium flex gap-4">
          <span>Tọa độ: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Độ cao: 12m</span>
        </div>
        <div className="text-[10px] text-text-muted font-medium">
          MapLibre Engine v2.4.0 | Scale 1:2500
        </div>
      </footer>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative",
        active ? "bg-blue-50 text-accent border border-blue-200 shadow-sm" : "bg-transparent text-text-muted hover:bg-bg-ui"
      )}
      title={label}
    >
      {icon}
      {!active && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-text-main text-white text-[10px] rounded opacity-0 lg:group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
          {label}
        </div>
      )}
    </button>
  );
}
