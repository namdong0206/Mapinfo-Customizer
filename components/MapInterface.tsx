'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapLibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import html2canvas from 'html2canvas';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import length from '@turf/length';
import centroid from '@turf/centroid';

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
  HUMANITARIAN: {
    label: 'Bản đồ Nhân đạo',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'hot-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; Humanitarian OSM'
        }
      },
      layers: [{ id: 'hot', type: 'raster', source: 'hot-tiles' }]
    }
  },
  CYCLOSM: {
    label: 'CyclOSM',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'cycl-tiles': {
          type: 'raster',
          tiles: ['https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; CyclOSM'
        }
      },
      layers: [{ id: 'cycl', type: 'raster', source: 'cycl-tiles' }]
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
    label: 'Vệ tinh',
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
  ARCHITECTURE: {
    label: '3D Kiến trúc',
    url: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    category: 'vector'
  },
  TOPO: {
    label: 'Địa hình',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'topo-tiles': {
          type: 'raster',
          tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenTopoMap'
        }
      },
      layers: [{ id: 'osm-topo', type: 'raster', source: 'topo-tiles' }]
    }
  },
  TRACESTRACK: {
    label: 'Tracestrack Topo',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'trace-tiles': {
          type: 'raster',
          tiles: ['https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; Tracestrack'
        }
      },
      layers: [{ id: 'trace', type: 'raster', source: 'trace-tiles' }]
    }
  },
  WATERCOLOR: {
    label: 'Bản đồ Màu nước',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'water-tiles': {
          type: 'raster',
          tiles: ['https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'],
          tileSize: 256,
          attribution: '&copy; Stamen'
        }
      },
      layers: [{ id: 'water', type: 'raster', source: 'water-tiles' }]
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
  },
  STAMEN_TONER: {
    label: 'Đơn sắc',
    category: 'raster',
    url: {
      version: 8,
      glyphs: "https://basemaps.cartocdn.com/gl/positron-gl-style/fonts/{fontstack}/{range}.pbf",
      sources: {
        'stamen-toner-tiles': {
          type: 'raster',
          tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; Stamen Design'
        }
      },
      layers: [{ id: 'stamen-toner', type: 'raster', source: 'stamen-toner-tiles' }]
    }
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

export default function MapInterface() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  const [activeMode, setActiveMode] = useState<'view' | 'draw_polygon' | 'draw_line' | 'annotate' | 'image' | 'icon'>('view');
  const [routeType, setRouteType] = useState<'straight' | 'real'>('straight');
  const [travelMode, setTravelMode] = useState<'driving' | 'cycling' | 'walking'>('driving');
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
  
  const [featureEditModal, setFeatureEditModal] = useState<{
    isOpen: boolean,
    featureId: string | null
  }>({
    isOpen: false,
    featureId: null
  });

  const selectedFeature = drawnFeatures.find(f => f.id === (selectedFeatureId || featureEditModal.featureId));
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
    function handleClickOutside(event: MouseEvent) {
      const isOutsidePicker = layerPickerRef.current && !layerPickerRef.current.contains(event.target as Node);
      const isOutsideButton = layerButtonRef.current && !layerButtonRef.current.contains(event.target as Node);
      
      if (isOutsidePicker && isOutsideButton) {
        setShowLayerPicker(false);
      }
    }
    if (showLayerPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayerPicker]);

  useEffect(() => {
    mapStyleRef.current = mapStyleKey;
  }, [mapStyleKey]);

  useEffect(() => {
    adminBoundaryRef.current = showAdminBoundaries;
  }, [showAdminBoundaries]);

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
          paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.05 }
        });
      }
      if (!m.getLayer(lineLayerId)) {
        m.addLayer({
          id: lineLayerId, type: 'line', source: sourceId,
          paint: { 'line-color': '#0284c7', 'line-width': 1.5 }
        });
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
           minzoom: 9, paint: { 'fill-color': '#cbd5e1', 'fill-opacity': 0.05 }
         });
      }
      if (!m.getLayer('vietnam-commune-line')) {
         m.addLayer({
           id: 'vietnam-commune-line', type: 'line', source: communeSourceId,
           minzoom: 9, paint: { 'line-color': '#64748b', 'line-width': 0.5 }
         });
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
          if (layer.type === 'symbol' && !layer.id.includes('vietnam-')) {
            try { m.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (e) {}
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
          if (layer.type === 'symbol' && !layer.id.includes('vietnam-')) {
             try { m.setLayoutProperty(layer.id, 'visibility', 'visible'); } catch (e) {}
          }
        });
      }
    }

    // Always re-apply 3D if active
    updateBuildings3D(m, is3DRef.current);
  }, [updateBuildings3D]);

  useEffect(() => {
    if (!map.current) return;
    setupCustomLayers();
  }, [showAdminBoundaries, is3D, setupCustomLayers]);

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

  const [showDataPanel, setShowDataPanel] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTargetId, setSearchTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchRealRoute = useCallback(async (featureId: string, waypoints: number[][], mode: string) => {
    try {
      const query = waypoints.map(c => c.join(',')).join(';');
      const service = mode === 'walking' ? 'routed-foot' : mode === 'cycling' ? 'routed-bike' : 'routed-car';
      
      const response = await fetch(`https://routing.openstreetmap.de/${service}/route/v1/driving/${query}?geometries=geojson`);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry;
        
        if (draw.current) {
          // Robust property setting
          draw.current.setFeatureProperty(featureId, 'routeGeometry', routeGeometry);
          draw.current.setFeatureProperty(featureId, 'isRealRoute', true); // Simple flag for style filtering
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
        }
      }
    } catch (error) {
      console.error('Error fetching real route:', error);
    }
  }, []);

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    // Basic map click info
    setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    
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
           d.setFeatureProperty(feature.id, 'originalWaypoints', lineCoords);
           setDrawnFeatures(d.getAll().features);
        }
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
            active: f.id === selectedFeatureId ? 1 : 0
          }
        }));

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
      } else {
        const source = m.getSource('real-routes') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: routeFeatures
          });
        }
      }
    };

    updateRouteLayer();
    m.on('style.load', updateRouteLayer);
    return () => { m.off('style.load', updateRouteLayer); };
  }, [drawnFeatures, selectedFeatureId]);

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
              properties: { isRoute: false, routeType: 'straight', distance: '' }
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
        trash: true
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
        const sourceId = 'vietnam-admin-source';
        if (!m.getSource(sourceId)) {
          m.addSource(sourceId, {
            type: 'geojson',
            data: '/data/vn-provinces-34.json'
          });
          m.addLayer({
            id: 'vietnam-admin-fill',
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.05 }
          });
          m.addLayer({
            id: 'vietnam-admin-line',
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#0284c7', 'line-width': 1.5, 'line-dasharray': [2, 2] }
          });
          m.addLayer({
            id: 'vietnam-admin-label',
            type: 'symbol',
            source: sourceId,
            minzoom: 4,
            maxzoom: 11,
            layout: {
              'text-field': ['get', 'ten_tinh'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-anchor': 'center',
              'symbol-placement': 'line-center',
              'text-allow-overlap': false,
              'text-ignore-placement': false
            },
            paint: {
              'text-color': '#0369a1',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            }
          });
        }

        // Add communes
        const communeSourceId = 'vietnam-commune-source';
        if (!m.getSource(communeSourceId)) {
          m.addSource(communeSourceId, {
            type: 'geojson',
            data: '/data/vn-communes-34.json'
          });
        }
        if (!m.getLayer('vietnam-commune-fill')) {
          m.addLayer({
            id: 'vietnam-commune-fill',
            type: 'fill',
            source: communeSourceId,
            minzoom: 9,
            paint: { 'fill-color': '#f8fafc', 'fill-opacity': 0.05 }
          });
        }
        if (!m.getLayer('vietnam-commune-line')) {
          m.addLayer({
            id: 'vietnam-commune-line',
            type: 'line',
            source: communeSourceId,
            minzoom: 9,
            paint: { 'line-color': '#94a3b8', 'line-width': 0.5, 'line-dasharray': [1, 1] }
          });
        }
        if (!m.getLayer('vietnam-commune-label')) {
          m.addLayer({
            id: 'vietnam-commune-label',
            type: 'symbol',
            source: communeSourceId,
            minzoom: 11,
            layout: {
              'text-field': ['get', 'ten_xa'],
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-size': 10,
              'text-anchor': 'center',
              'symbol-placement': 'point',
              'text-allow-overlap': false
            },
            paint: {
              'text-color': '#64748b',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1
            }
          });
        }
      }
    });

    return () => {
      m.remove();
      if (document.getElementById('hidden-geocoder')) {
        document.getElementById('hidden-geocoder')?.remove();
      }
    };
  }, []);

  const exportMap = async () => {
    if (!mapContainer.current) return;
    
    setIsExporting(true);
    try {
      if (map.current) {
        // Force the map to repaint just before capture so drawing buffer is fresh
        map.current.triggerRepaint();
        await new Promise(resolve => map.current?.once('render', resolve));
      }

      const canvas = await html2canvas(mapContainer.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `map-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDrawMode = (mode: 'draw_polygon' | 'draw_line' | 'annotate' | 'image' | 'icon') => {
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
      // For annotate, image, icon we use native click handler, 
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!map.current || !['annotate', 'image', 'icon'].includes(activeMode)) return;

    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Project pixel to LngLat
    const lngLatObj = map.current.unproject([x, y]);
    const lngLat: [number, number] = [lngLatObj.lng, lngLatObj.lat];
    
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
        <aside className="w-16 bg-white border-r border-border-main flex flex-col items-center py-5 gap-4 z-20 shrink-0">
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
          
          <div className="h-px w-8 bg-border-main my-2" />
          
          <button 
            onClick={() => setRouteType(t => t === 'straight' ? 'real' : 'straight')}
            className={cn(
              "w-10 h-10 rounded-lg transition-all flex flex-col items-center justify-center gap-1",
              routeType === 'real' ? "bg-blue-50 text-accent ring-1 ring-blue-200" : "bg-zinc-50 text-text-muted hover:bg-zinc-100"
            )}
            title={routeType === 'real' ? "Đang dùng đường thực" : "Đang dùng đường tuyến tính"}
          >
            <Route size={18} />
            <span className="text-[9px] font-bold uppercase tracking-tight leading-none">{routeType === 'real' ? 'Real' : 'Air'}</span>
          </button>

          {routeType === 'real' && (
            <div className="flex flex-col gap-1 p-1 bg-zinc-50 rounded-lg border border-border-main w-10 items-center">
              <button 
                onClick={() => setTravelMode('driving')} 
                className={cn("p-1.5 rounded-md transition-all", travelMode === 'driving' ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text-main")} 
                title="Ô-tô"
              >
                <Car size={16} />
              </button>
              <button 
                onClick={() => setTravelMode('cycling')} 
                className={cn("p-1.5 rounded-md transition-all", travelMode === 'cycling' ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text-main")} 
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

          <div className="mt-auto flex flex-col gap-4 mb-2 relative group">
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-3 bottom-0 w-64 bg-white border border-border-main rounded-xl shadow-panel p-2 z-50 flex flex-col gap-1"
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
                           
                           setMapStyleKey(key);
                           map.current.setStyle(style.url);
                           
                           // Explicitly re-apply camera settings after style load to prevent jumps
                           map.current.once('style.load', () => {
                             map.current?.jumpTo({
                               center: currentCenter,
                               zoom: currentZoom,
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

          {/* Asset Placement Overlay */}
          {['annotate', 'image', 'icon'].includes(activeMode) && (
            <div 
              className="absolute inset-0 z-[100] cursor-crosshair"
              onClick={handleOverlayClick}
            />
          )}

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
                            { id: 'cycling', icon: <Bike size={14} /> },
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Biểu tượng</label>
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

          {/* Feature Edit Modal */}
          <AnimatePresence>
            {featureEditModal.isOpen && selectedFeature && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-2xl shadow-2xl border border-border-main w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
                >
                  <div className="p-5 border-b border-border-main bg-zinc-50 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                       {selectedFeature.geometry.type === 'Polygon' ? <Square className="text-accent" size={20} /> : <Route className="text-accent" size={20} />}
                       Tùy chỉnh đối tượng
                    </h3>
                    <button 
                      onClick={() => setFeatureEditModal({ isOpen: false, featureId: null })}
                      className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-text-muted"
                    >
                      <Plus className="rotate-45" size={20} />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <div className="space-y-4">
                      <div className="p-3 bg-zinc-50 rounded-xl border border-border-main flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Loại đối tượng</p>
                          <p className="text-sm font-semibold">{selectedFeature.geometry.type === 'Polygon' ? 'Vùng dữ liệu' : 'Tuyến đường'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Kích thước</p>
                          <p className="text-sm font-mono font-bold text-accent">{selectedFeature.properties.distance || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Màu sắc hiển thị</label>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="color" 
                          value={selectedFeature.properties.color || '#3bb2d0'}
                          onChange={(e) => {
                            updateFeatureStyle(selectedFeature.id, 'color', e.target.value);
                            updateFeatureStyle(selectedFeature.id, 'fillColor', e.target.value);
                          }}
                          className="w-16 h-10 rounded-lg cursor-pointer p-0 border-none shadow-sm"
                        />
                        <input 
                          type="text"
                          value={selectedFeature.properties.color || '#3bb2d0'}
                          readOnly
                          className="flex-1 px-4 py-2 bg-zinc-50 border border-border-main rounded-xl font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Độ dày đường kẻ</label>
                        <span className="text-xs font-bold text-accent">{selectedFeature.properties.width || 2}px</span>
                      </div>
                      <input 
                        type="range" min="1" max="12" 
                        value={selectedFeature.properties.width || 2}
                        onChange={(e) => updateFeatureStyle(selectedFeature.id, 'width', parseInt(e.target.value))}
                        className="w-full h-8 accent-accent"
                      />
                    </div>

                    {selectedFeature.geometry.type === 'Polygon' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Độ đậm nền (Fill Opacity)</label>
                          <span className="text-xs font-bold text-accent">{Math.round((selectedFeature.properties.fillOpacity || 0.1) * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05"
                          value={selectedFeature.properties.fillOpacity || 0.1}
                          onChange={(e) => updateFeatureStyle(selectedFeature.id, 'fillOpacity', parseFloat(e.target.value))}
                          className="w-full h-8 accent-accent"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-zinc-50 border-t border-border-main shrink-0">
                    <button 
                      onClick={() => setFeatureEditModal({ isOpen: false, featureId: null })}
                      className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-lg active:scale-[0.98] transition-transform"
                    >
                      Xác nhận thay đổi
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
                    setFeatureEditModal({ isOpen: true, featureId: feat.id });
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
                <option>GeoJSON Output</option>
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
              <button 
                onClick={() => {
                  draw.current?.deleteAll();
                  setAnnotations([]);
                  setDrawnFeatures([]);
                }}
                className="p-2 border border-border-main rounded-md text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
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
        <div className="absolute left-full ml-3 px-2 py-1 bg-text-main text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
          {label}
        </div>
      )}
    </button>
  );
}
