'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Network } from 'vis-network';
import { TimelineEvent } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Users, MapPin, Building2, Mail, Filter, Palette, LayoutGrid, Zap, RefreshCw, Download } from 'lucide-react';

// Interfaces para el grafo
interface GraphNode {
  id: string;
  label: string;
  group: 'person' | 'place' | 'event' | 'organization' | 'letter';
  personType?: 'active' | 'mentioned' | 'both';
  shape: string;
  size: number;
  color: string | {
    border: string;
    background: string;
    highlight?: {
      border: string;
      background: string;
    };
  };
  borderWidth: number;
  title: string;
  image?: string; // Para iconos SVG
  font?: {
    size?: number;
    color?: string;
    bold?: boolean;
    face?: string;
    strokeWidth?: number;
    strokeColor?: string;
  };
  shapeProperties?: {
    useBorderWithImage?: boolean;
  };
  asParticipant?: number;
  asMentioned?: number;
  totalConnections?: number;
}

interface GraphEdge {
  id?: string;
  from: string;
  to: string;
  edgeType?: 'participates' | 'mentions' | 'located';
  label?: string;
  title?: string;
  color: string | {
    color: string;
    opacity?: number;
    highlight?: string;
  };
  width: number;
  dashes?: boolean | number[];
  arrows?: string | { to?: { enabled?: boolean } };
  smooth?: {
    type?: string;
    roundness?: number;
  };
}

interface NetworkViewProps {
  events: TimelineEvent[];
  isDarkMode?: boolean;
}

/**
 * Función para crear icono SVG como data URL
 * Genera iconos profesionales para nodos de la red con tamaños según jerarquía
 */
function createNodeIcon(type: 'person' | 'place' | 'organization', color: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  // Paths SVG para los iconos (simplificados de lucide-react)
  const iconPaths = {
    person: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    place: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    organization: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z M6 12h12 M6 8h12 M6 16h12 M10 2v4 M14 2v4',
  };
  
  const path = iconPaths[type];
  
  // Tamaños según jerarquía (reducidos a la mitad del tamaño original)
  const dimensions = {
    large: { svg: 32, radius: 14, icon: 12, stroke: 2 },    // Luis Mitrovic
    medium: { svg: 20, radius: 8, icon: 8, stroke: 1.5 },   // Correspondientes
    small: { svg: 16, radius: 6, icon: 6, stroke: 1 },      // Mencionados
  };
  
  const dim = dimensions[size];
  const center = dim.svg / 2;
  const iconOffset = (dim.svg - dim.icon) / 2;
  
  // Crear SVG con fondo circular
  const svg = `<svg width="${dim.svg}" height="${dim.svg}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${center}" cy="${center}" r="${dim.radius}" fill="${color}" opacity="0.15"/>
  <circle cx="${center}" cy="${center}" r="${dim.radius}" fill="none" stroke="${color}" stroke-width="${dim.stroke}"/>
  <g transform="translate(${iconOffset}, ${iconOffset})">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${dim.stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
  
  // Convertir a data URL (escapar caracteres especiales)
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Calcular color basado en fecha (gradiente temporal)
 */
function getColorByDate(date: Date, minDate: Date, maxDate: Date): string {
  const timespan = maxDate.getTime() - minDate.getTime();
  if (timespan === 0) return '#6366f1'; // Default si solo hay una fecha
  
  const position = (date.getTime() - minDate.getTime()) / timespan;
  
  // Gradiente de azul oscuro (temprano) → azul claro → violeta (tardío)
  const hue = 220 - (position * 60); // De 220 (azul) a 160 (cyan-verde)
  const saturation = 80;
  const lightness = 35 + (position * 30); // De 35% (oscuro) a 65% (claro)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Función helper para ajustar brillo de colores
 */
function adjustColorBrightness(color: string, percent: number): string {
  // Si es HSL, convertir a RGB primero
  if (color.startsWith('hsl')) {
    // Extraer valores HSL
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;
      
      // Convertir HSL a RGB
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else { r = c; b = x; }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      // Ajustar brillo
      const amt = Math.round(2.55 * percent);
      r = Math.min(255, Math.max(0, r + amt));
      g = Math.min(255, Math.max(0, g + amt));
      b = Math.min(255, Math.max(0, b + amt));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  
  // Si es hex
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Función para crear icono de carta simple y opaco
 */
function createLetterIcon(color: string): string {
  const svg = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Fondo opaco circular -->
  <circle cx="12" cy="12" r="11" fill="white" opacity="1"/>
  <circle cx="12" cy="12" r="11" fill="${color}" opacity="1"/>
  
  <!-- Icono de sobre en blanco -->
  <g transform="translate(6, 6)">
    <!-- Rectángulo del sobre -->
    <rect x="1" y="3" width="10" height="7" rx="1" 
          fill="none" stroke="white" stroke-width="1.2"/>
    
    <!-- Solapa del sobre -->
    <path d="M 1 3 L 6 6.5 L 11 3" 
          fill="none" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
  
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export default function NetworkView({ events, isDarkMode }: NetworkViewProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // Estados simplificados
  const [filters, setFilters] = useState({
    showPeople: true,
    showPlaces: true,
  });
  
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical'>('force');
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const [gravity, setGravity] = useState(0.3);
  
  // Estados de métricas y análisis (métricas ahora se calculan con useMemo)
  const [egoNetworkCenter, setEgoNetworkCenter] = useState<string | null>(null);
  const [egoNetworkDepth, setEgoNetworkDepth] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados de opciones visuales simplificados
  const [visualOptions, setVisualOptions] = useState({
    colorByTime: true,
    sizeByActivity: false, // ✅ Nuevo: tamaño por actividad
  });
  
  // Detectar quién es el biografiado (aparece más en sender/recipient)
  const detectBiographedPerson = useMemo(() => {
    const personCount = new Map<string, number>();
    
    events.filter(e => e.type === 'letter').forEach(event => {
      const letterData = event.data as any;
      
      if (letterData?.sender && letterData.sender !== 'Desconocido') {
        const normalized = normalizeName(letterData.sender);
        personCount.set(normalized, (personCount.get(normalized) || 0) + 1);
      }
      if (letterData?.recipient && letterData.recipient !== 'Desconocido') {
        const normalized = normalizeName(letterData.recipient);
        personCount.set(normalized, (personCount.get(normalized) || 0) + 1);
      }
    });
    
    // Persona con más apariciones
    let maxCount = 0;
    let mainPerson = '';
    
    personCount.forEach((count, person) => {
      if (count > maxCount) {
        maxCount = count;
        mainPerson = person;
      }
    });
    
    return mainPerson || 'Luis Mitrovic Balbontín'; // Fallback
  }, [events]);
  
  const mainPerson = detectBiographedPerson;
  
  // Calcular rango de fechas
  const dateRange = useMemo(() => {
    const letterEvents = events.filter(e => e.type === 'letter');
    if (letterEvents.length === 0) return { min: new Date(), max: new Date() };
    
    const dates = letterEvents.map(e => e.date.getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [events]);
  
  // Calcular métricas de actividad
  const activityMetrics = useMemo(() => {
    const metrics = new Map<string, number>();
    
    events.filter(e => e.type === 'letter').forEach(event => {
      const letterData = event.data as any;
      
      // Contar cartas escritas/recibidas
      if (letterData?.sender && letterData.sender !== 'Desconocido') {
        const senderId = `person-${letterData.sender}`;
        metrics.set(senderId, (metrics.get(senderId) || 0) + 1);
      }
      if (letterData?.recipient && letterData.recipient !== 'Desconocido') {
        const recipientId = `person-${letterData.recipient}`;
        metrics.set(recipientId, (metrics.get(recipientId) || 0) + 1);
      }
      
      // Contar menciones
      letterData?.mentionedPeople?.forEach((person: string) => {
        const personId = `person-mentioned-${person}`;
        metrics.set(personId, (metrics.get(personId) || 0) + 1);
      });
      
      letterData?.mentionedPlaces?.forEach((place: string) => {
        const placeId = `place-${place}`;
        metrics.set(placeId, (metrics.get(placeId) || 0) + 1);
      });
      
      letterData?.mentionedOrganizations?.forEach((org: string) => {
        const orgId = `org-${org}`;
        metrics.set(orgId, (metrics.get(orgId) || 0) + 1);
      });
    });
    
    return metrics;
  }, [events]);
  
  // Función para calcular tamaño del nodo
  const getNodeSize = (nodeId: string, baseSize: number): number => {
    if (!visualOptions.sizeByActivity) return baseSize;
    
    const activity = activityMetrics.get(nodeId) || 0;
    if (activity === 0) return baseSize;
    
    // Escalar tamaño: baseSize + (activity * factor)
    const factor = baseSize === 30 ? 2 : baseSize === 18 ? 1.5 : 1; // Diferentes factores por nivel
    return baseSize + (Math.min(activity, 20) * factor); // Cap a 20 para no tener nodos gigantes
  };
  
  // Calcular grafo filtrado con useMemo
  const mainPersonId = `person-${mainPerson}`;
  
  const { filteredNodes, filteredEdges } = useMemo(() => {
    const { nodes, edges } = transformToGraph(
      events, 
      mainPerson, 
      dateRange, 
      visualOptions, 
      filters, 
      normalizeName, 
      isDarkMode || false,
      activityMetrics,
      getNodeSize
    );
    
    const filtered = nodes.filter(node => {
      // ✅ NUNCA filtrar al biografiado
      const isMainPerson = node.id === mainPersonId || node.label === mainPerson;
      if (isMainPerson) return true;
      
      // Filtrar por tipo de nodo
      if (node.group === 'person' && !filters.showPeople) return false;
      if (node.group === 'place' && !filters.showPlaces) return false;
      if (node.group === 'organization' && !filters.showPeople) return false; // Organizaciones con people
      if (node.group === 'letter') return true; // Siempre mostrar cartas
      return true;
    });
    
    const filteredNodeIds = new Set(filtered.map(n => n.id));
    
    const filteredEdges = edges.filter(edge => {
      if (!filteredNodeIds.has(edge.from) || !filteredNodeIds.has(edge.to)) return false;
      // Las edges ya no tienen edgeType en la nueva estructura, todas se muestran
      return true;
    });
    
    return { filteredNodes: filtered, filteredEdges };
  }, [events, filters, mainPerson, dateRange, visualOptions, isDarkMode, activityMetrics]);

  // Calcular métricas con useMemo (evita loop infinito)
  const metricsData = useMemo(() => {
    if (filteredNodes.length > 0 && filteredEdges.length > 0) {
      const degree = calculateDegree(filteredNodes, filteredEdges);
      const betweenness = calculateBetweenness(filteredNodes, filteredEdges);
      const edgeWeights = calculateEdgeWeights(filteredEdges);
      
      return { degree, betweenness, edgeWeights };
    }
    return null;
  }, [filteredNodes, filteredEdges]);

  // Aplicar ego network si está activo (memoizado)
  const displayNodes = useMemo(() => {
    if (egoNetworkCenter) {
      const ego = getEgoNetwork(egoNetworkCenter, filteredNodes, filteredEdges, egoNetworkDepth);
      return ego.nodes;
    }
    return filteredNodes;
  }, [egoNetworkCenter, filteredNodes, filteredEdges, egoNetworkDepth]);

  const displayEdges = useMemo(() => {
    if (egoNetworkCenter) {
      const ego = getEgoNetwork(egoNetworkCenter, filteredNodes, filteredEdges, egoNetworkDepth);
      return ego.edges;
    }
    return filteredEdges;
  }, [egoNetworkCenter, filteredNodes, filteredEdges, egoNetworkDepth]);

  // Configurar physics según el layout (sin claves undefined para evitar errores en vis-network)
  const getPhysicsConfig = () => {
    const base = {
      enabled: physicsEnabled,
      stabilization: {
        enabled: true,
        iterations: layoutMode === 'hierarchical' ? 200 : 500,
      },
    };
    if (layoutMode === 'hierarchical') {
      return {
        ...base,
        solver: 'hierarchicalRepulsion' as const,
        hierarchicalRepulsion: {
          centralGravity: 0.0,
          springLength: 200,
          springConstant: 0.01,
          nodeDistance: 150,
          damping: 0.09,
        },
      };
    }
    return {
      ...base,
      solver: 'barnesHut' as const,
      barnesHut: {
        gravitationalConstant: -4000,
        centralGravity: gravity,
        springLength: 150,
        springConstant: 0.05,
        damping: 0.09,
        avoidOverlap: 0.3,
      },
    };
  };

  // Opciones de vis.js optimizadas con useMemo
  const networkOptions = useMemo(() => ({
    layout: layoutMode === 'hierarchical' ? {
      hierarchical: {
        enabled: true,
        levelSeparation: 200,
        nodeSpacing: 150,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'UD', // Up-Down
        sortMethod: 'directed',
      }
    } : {
      randomSeed: 42,
      improvedLayout: true,
    },
    
    physics: getPhysicsConfig(),
    
    nodes: {
      borderWidth: 1,
      borderWidthSelected: 3,
      font: {
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        size: 12,
      },
      chosen: {
        node: (values: any) => {
          values.shadow = true;
          values.shadowSize = 10;
        },
      },
    },
    
    edges: {
      smooth: {
        enabled: true,
        type: 'continuous',
        roundness: 0.5,
      },
      chosen: {
        edge: (values: any) => {
          values.width = 3;
        },
      },
    },
    
    interaction: {
      hover: true,
      tooltipDelay: 200,
      hideEdgesOnDrag: true,
      hideEdgesOnZoom: false,
    },
  }), [physicsEnabled, gravity, isDarkMode, layoutMode]);

  // Datos de la red memoizados
  const networkData = useMemo(() => {
    return {
      nodes: displayNodes,
      edges: displayEdges,
    };
  }, [displayNodes, displayEdges]);

  // Actualizar fondo cuando cambia dark mode
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.style.backgroundColor = isDarkMode ? '#111827' : '#ffffff';
    
    // También actualizar el canvas de vis.js si ya está creado
    const canvas = container.querySelector('canvas');
    if (canvas && canvas.parentElement) {
      canvas.parentElement.style.backgroundColor = isDarkMode ? '#111827' : '#ffffff';
    }
  }, [isDarkMode]);

  // Solo useEffect para inicializar/actualizar red
  useEffect(() => {
    if (!containerRef.current || !networkData) return;
    
    // Recrear completamente la red cuando cambia el layout
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }
    
    networkRef.current = new Network(
      containerRef.current,
      networkData,
      networkOptions
    );
    
    // Event listeners
    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = displayNodes.find(n => n.id === nodeId);
        setSelectedNode(node);
        
        // Si es persona, activar ego network
        if (node?.group === 'person') {
          setEgoNetworkCenter(nodeId);
        }
      } else {
        setSelectedNode(null);
      }
    });
    
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [networkData, networkOptions, displayNodes, layoutMode]);


  /**
   * Función auxiliar para descargar archivos
   */
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Exportar a formato GEXF (Gephi)
   */
  const exportToGEXF = () => {
    setIsExporting(true);
    try {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" xmlns:viz="http://www.gexf.net/1.2draft/viz" version="1.2">
  <meta>
    <creator>BiographyViz</creator>
    <description>Red de correspondencia - ${events[0]?.title || 'Biografía'}</description>
  </meta>
  <graph mode="static" defaultedgetype="directed">
    <attributes class="node">
      <attribute id="0" title="type" type="string"/>
      <attribute id="1" title="personType" type="string"/>
      <attribute id="2" title="asParticipant" type="integer"/>
      <attribute id="3" title="asMentioned" type="integer"/>
    </attributes>
    <attributes class="edge">
      <attribute id="0" title="edgeType" type="string"/>
      <attribute id="1" title="weight" type="float"/>
    </attributes>
    <nodes>
${filteredNodes.map(node => {
        const colorStr = typeof node.color === 'string' ? node.color : (node.color.background || node.color.border);
        let r = 128, g = 128, b = 128;
        if (typeof colorStr === 'string' && colorStr.startsWith('#') && colorStr.length >= 7) {
          const hex = colorStr.slice(1);
          r = parseInt(hex.slice(0, 2), 16) || 0;
          g = parseInt(hex.slice(2, 4), 16) || 0;
          b = parseInt(hex.slice(4, 6), 16) || 0;
        }
        return `      <node id="${node.id}" label="${node.label.replace(/"/g, '&quot;')}">
        <attvalues>
          <attvalue for="0" value="${node.group}"/>
          ${node.personType ? `<attvalue for="1" value="${node.personType}"/>` : ''}
          ${node.asParticipant ? `<attvalue for="2" value="${node.asParticipant}"/>` : ''}
          ${node.asMentioned ? `<attvalue for="3" value="${node.asMentioned}"/>` : ''}
        </attvalues>
        <viz:size value="${node.size}"/>
        <viz:color r="${r}" g="${g}" b="${b}"/>
      </node>`;
      }).join('\n')}
    </nodes>
    <edges>
${filteredEdges.map((edge, idx) => `      <edge id="${idx}" source="${edge.from}" target="${edge.to}" label="${(edge.label || '').replace(/"/g, '&quot;')}" weight="${edge.width}">
        <attvalues>
          <attvalue for="0" value="${edge.edgeType}"/>
          <attvalue for="1" value="${edge.width}"/>
        </attvalues>
      </edge>`).join('\n')}
    </edges>
  </graph>
</gexf>`;

      downloadFile(xml, 'network.gexf', 'application/xml');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Exportar a JSON (vis.js format)
   */
  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const data = {
        nodes: filteredNodes.map(node => ({
          id: node.id,
          label: node.label,
          group: node.group,
          personType: node.personType,
          size: node.size,
          color: node.color,
          shape: node.shape,
          asParticipant: node.asParticipant,
          asMentioned: node.asMentioned,
          totalConnections: node.totalConnections,
        })),
        edges: filteredEdges.map(edge => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          label: edge.label,
          edgeType: edge.edgeType,
          color: edge.color,
          width: edge.width,
          dashes: edge.dashes,
        })),
        metadata: {
          exportDate: new Date().toISOString(),
          totalNodes: filteredNodes.length,
          totalEdges: filteredEdges.length,
          biography: events[0]?.title || 'Unknown',
        },
      };

      downloadFile(JSON.stringify(data, null, 2), 'network.json', 'application/json');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Exportar a CSV (nodos y aristas separados)
   */
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // CSV de nodos
      const nodeHeaders = ['id', 'label', 'group', 'personType', 'size', 'color', 'asParticipant', 'asMentioned', 'totalConnections'];
      const nodeRows = filteredNodes.map(node => [
        `"${node.id.replace(/"/g, '""')}"`,
        `"${node.label.replace(/"/g, '""')}"`,
        `"${node.group}"`,
        `"${node.personType || ''}"`,
        node.size,
        `"${node.color}"`,
        node.asParticipant || 0,
        node.asMentioned || 0,
        node.totalConnections || 0,
      ]);
      const nodesCSV = [nodeHeaders.map(h => `"${h}"`), ...nodeRows].map(row => row.join(',')).join('\n');

      // CSV de aristas
      const edgeHeaders = ['id', 'from', 'to', 'label', 'edgeType', 'width', 'color'];
      const edgeRows = filteredEdges.map(edge => [
        `"${(edge.id ?? `${edge.from}-${edge.to}`).replace(/"/g, '""')}"`,
        `"${edge.from.replace(/"/g, '""')}"`,
        `"${edge.to.replace(/"/g, '""')}"`,
        `"${(edge.label || '').replace(/"/g, '""')}"`,
        `"${edge.edgeType}"`,
        edge.width,
        `"${edge.color}"`,
      ]);
      const edgesCSV = [edgeHeaders.map(h => `"${h}"`), ...edgeRows].map(row => row.join(',')).join('\n');

      // Descargar ambos
      downloadFile(nodesCSV, 'network-nodes.csv', 'text/csv');
      setTimeout(() => {
        downloadFile(edgesCSV, 'network-edges.csv', 'text/csv');
        setIsExporting(false);
      }, 100);
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting to CSV:', error);
    }
  };

  /**
   * Exportar captura PNG
   */
  const exportToPNG = () => {
    setIsExporting(true);
    try {
      if (!containerRef.current) {
        setIsExporting(false);
        return;
      }

      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'network.png';
            link.click();
            URL.revokeObjectURL(url);
          }
          setIsExporting(false);
        }, 'image/png');
      } else {
        setIsExporting(false);
        console.warn('No se encontró el canvas para exportar');
      }
    } catch (error) {
      setIsExporting(false);
      console.error('Error exporting to PNG:', error);
    }
  };

  return (
    <div className="relative w-full h-full flex">
      {/* Panel lateral simplificado */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-700 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {t('network.title')}
        </h2>
        
        {/* ========== FILTERS ========== */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={16} />
            {t('network.filters')}
          </h3>
          
          <div className="space-y-3">
            {/* People */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Users size={14} />
                {t('network.people')}
              </h4>
              <div className="ml-6 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showPeople}
                    onChange={(e) => setFilters({...filters, showPeople: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show all people
                  </span>
                </label>
              </div>
            </div>
            
            {/* Places */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <MapPin size={14} />
                {t('network.places')}
              </h4>
              <div className="ml-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showPlaces}
                    onChange={(e) => setFilters({...filters, showPlaces: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show places
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* ========== VISUALIZATION OPTIONS ========== */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <Palette size={16} />
            {t('network.visualizationOptions')}
          </h3>
          
          <div className="space-y-2">
            {/* Color by time */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visualOptions.colorByTime}
                onChange={(e) => setVisualOptions({
                  ...visualOptions,
                  colorByTime: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('network.colorByDate')}
              </span>
            </label>
            
            {/* Gradient preview */}
            {visualOptions.colorByTime && (
              <div className="ml-6 p-2 rounded" style={{
                background: 'linear-gradient(to right, hsl(220, 80%, 35%), hsl(190, 80%, 50%), hsl(160, 80%, 65%))'
              }}>
                <div className="flex justify-between text-xs text-white font-medium drop-shadow">
                  <span>{dateRange.min.getFullYear()}</span>
                  <span>→</span>
                  <span>{dateRange.max.getFullYear()}</span>
                </div>
              </div>
            )}
            
            {/* Size by activity */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visualOptions.sizeByActivity}
                onChange={(e) => setVisualOptions({
                  ...visualOptions,
                  sizeByActivity: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Size by activity
              </span>
            </label>
            
            {visualOptions.sizeByActivity && (
              <div className="ml-6 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                Node size reflects number of letters sent/received or times mentioned
              </div>
            )}
          </div>
        </div>
        
        {/* ========== LAYOUT ========== */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutGrid size={16} />
            Layout
          </h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="layout"
                checked={layoutMode === 'force'}
                onChange={() => setLayoutMode('force')}
                className="rounded-full"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Force-Directed
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="layout"
                checked={layoutMode === 'hierarchical'}
                onChange={() => setLayoutMode('hierarchical')}
                className="rounded-full"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Hierarchical
              </span>
            </label>
            
            {/* Descripción del layout seleccionado */}
            <div className="ml-6 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
              {layoutMode === 'force' ? (
                <>
                  <strong>Force-Directed:</strong> Nodes organize naturally based on connections. Best for exploring relationships.
                </>
              ) : (
                <>
                  <strong>Hierarchical:</strong> Clear levels from central person → correspondents → letters → mentions.
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* ========== PHYSICS ========== */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={16} />
            {t('network.physics')}
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={physicsEnabled}
                onChange={(e) => setPhysicsEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('network.enablePhysics')}
              </span>
            </label>
            
            <div className="ml-6 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
              {physicsEnabled 
                ? '✅ Dynamic: Nodes move and adjust positions'
                : '🔒 Static: Fixed positions, easier to analyze'
              }
            </div>
            
            {/* Gravity slider - solo si physics está activo */}
            {physicsEnabled && layoutMode === 'force' && (
              <div className="space-y-2">
                <label className="block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('network.gravity')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {gravity.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={gravity}
                    onChange={(e) => setGravity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </label>
                
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                  {gravity < 0.3 && 'Weak - nodes spread out'}
                  {gravity >= 0.3 && gravity < 0.7 && 'Medium - balanced'}
                  {gravity >= 0.7 && 'Strong - tight clusters'}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* ========== NETWORK HIERARCHY (Legend) ========== */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">
            {t('network.networkHierarchy')}
          </h4>
          
          {/* Level 1 */}
          <div className="mb-3 pb-3 border-b dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 mb-2">LEVEL 1</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-indigo-600"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {mainPerson}
              </span>
            </div>
          </div>
          
          {/* Level 2 */}
          <div className="mb-3 pb-3 border-b dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 mb-2">LEVEL 2</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-600"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Correspondents
              </span>
            </div>
          </div>
          
          {/* Level 3 */}
          <div className="mb-3 pb-3 border-b dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 mb-2">LEVEL 3</p>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Letters
              </span>
            </div>
          </div>
          
          {/* Level 4 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">LEVEL 4</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-400"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">People</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900 border border-green-500"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Places</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-100 dark:bg-orange-900 border border-orange-500"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Organizations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas de la red */}
      <div className="flex-1 relative">
        {/* Controles: Reset View y Export to Gephi */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center gap-2 flex-wrap">
          {egoNetworkCenter && (
            <button
              type="button"
              onClick={() => {
                console.log('[Network] Resetting to full view');
                setEgoNetworkCenter(null);
                setSelectedNode(null);
                if (networkRef.current) {
                  networkRef.current.unselectAll();
                  (networkRef.current as any).fit({
                    animation: {
                      duration: 500,
                      easingFunction: 'easeInOutQuad',
                    },
                  });
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm shadow"
              title="Reset to full network view"
            >
              <RefreshCw size={16} />
              Reset View
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              console.log('[Network] Exporting to Gephi format');
              exportToGEXF();
            }}
            disabled={isExporting}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm shadow disabled:opacity-50"
            title="Export network to Gephi format (.gexf)"
          >
            <Download size={16} />
            Export to Gephi
          </button>
        </div>
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{
            backgroundColor: isDarkMode ? '#111827' : '#ffffff', // gray-900 : white
          }}
        />

        {/* Panel de detalles del nodo seleccionado */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedNode.label}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            {selectedNode.group === 'person' && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${
                    selectedNode.personType === 'active' ? 'bg-red-600' :
                    selectedNode.personType === 'mentioned' ? 'bg-pink-500' :
                    'bg-orange-500'
                  }`}></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedNode.personType === 'active' ? 'Participante Activo' :
                     selectedNode.personType === 'mentioned' ? 'Mencionado' :
                     'Participante + Mencionado'}
                  </span>
                </div>
                
                {selectedNode.asParticipant > 0 && (
                  <div className="text-gray-700 dark:text-gray-300">
                    Como participante: <strong>{selectedNode.asParticipant}</strong>
                  </div>
                )}
                
                {selectedNode.asMentioned > 0 && (
                  <div className="text-gray-700 dark:text-gray-300">
                    Como mencionado: <strong>{selectedNode.asMentioned}</strong>
                  </div>
                )}
                
                <div className="text-gray-900 dark:text-white font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  Total conexiones: {selectedNode.totalConnections}
                </div>
              </div>
            )}
            
            {selectedNode.group === 'place' && (
              <p className="text-sm text-gray-700 dark:text-gray-300">Ubicación mencionada en la biografía</p>
            )}
            
            {selectedNode.group === 'event' && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Evento del timeline
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Aplicar opciones visuales a los nodos
 */
function applyNodeVisualization(
  nodes: GraphNode[],
  options: {
    nodeColorBy: 'type' | 'degree' | 'betweenness';
    nodeSizeBy: 'fixed' | 'degree' | 'betweenness';
    nodeBaseSize: number;
    nodeScaleFactor: number;
    colorByTime: boolean;
  },
  metrics: {
    degree: Map<string, number>;
    betweenness: Map<string, number>;
    edgeWeights: Map<string, number>;
  } | null,
  events: TimelineEvent[]
): GraphNode[] {
  // Calcular rango temporal de eventos para personas
  const personEventDates = new Map<string, number[]>();
  
  events.forEach(event => {
    const eventData = event.data as any;
    const timestamp = event.date.getTime();
    
    // Agregar fechas para sender/recipient
    if (event.type === 'letter') {
      const sender = eventData?.sender || eventData?.personFrom;
      const recipient = eventData?.recipient || eventData?.personTo;
      
      if (sender && sender !== 'Desconocido') {
        if (!personEventDates.has(sender)) personEventDates.set(sender, []);
        personEventDates.get(sender)!.push(timestamp);
      }
      
      if (recipient && recipient !== 'Desconocido') {
        if (!personEventDates.has(recipient)) personEventDates.set(recipient, []);
        personEventDates.get(recipient)!.push(timestamp);
      }
    }
  });
  
  // Calcular fecha promedio para cada persona
  const personAvgDate = new Map<string, number>();
  personEventDates.forEach((dates, person) => {
    const avg = dates.reduce((sum, date) => sum + date, 0) / dates.length;
    personAvgDate.set(person, avg);
  });
  
  // Obtener rango temporal global
  const allDates = Array.from(personAvgDate.values());
  const minDate = allDates.length > 0 ? Math.min(...allDates) : 0;
  const maxDate = allDates.length > 0 ? Math.max(...allDates) : 0;
  const dateRange = maxDate - minDate || 1; // Evitar división por cero
  
  // Al inicio de la función, antes del map
  const biografiadoId = 'person-Luis Mitrovic Balbontín';
  const biografiadoLabel = 'Luis Mitrovic Balbontín';
  
  // Debug: buscar el nodo del biografiado (comparación más robusta)
  const biografiadoNode = nodes.find(n => {
    const isMatch = n.id === biografiadoId || 
                    n.label === biografiadoLabel ||
                    (n.label.includes('Luis Mitrovic Balbontín') && !n.label.includes('padre'));
    return isMatch;
  });
  
  if (biografiadoNode) {
    console.log('🎯 Nodo biografiado encontrado en applyNodeVisualization:', {
      id: biografiadoNode.id,
      label: biografiadoNode.label,
      expectedId: biografiadoId,
      currentColor: biografiadoNode.color,
      currentSize: biografiadoNode.size
    });
  } else {
    console.log('⚠️ Nodo biografiado NO encontrado en applyNodeVisualization. IDs disponibles:', 
      nodes.filter(n => n.group === 'person').map(n => ({ id: n.id, label: n.label }))
    );
  }
  
  return nodes.map(node => {
    let size = node.size;
    let color = node.color;
    let borderWidth = node.borderWidth;
    
    // ✅ DESTACAR BIOGRAFIADO (comparación más robusta)
    const isBiografiado = node.id === biografiadoId || 
                          node.label === biografiadoLabel ||
                          (node.label.includes('Luis Mitrovic Balbontín') && !node.label.includes('padre'));
    
    if (isBiografiado) {
      size = size * 1.5;  // 50% más grande
      borderWidth = 6;    // Borde muy grueso
      color = '#fbbf24';  // Amarillo/dorado
      console.log('✨ Aplicando destacado al biografiado:', { id: node.id, label: node.label, newSize: size, newColor: color });
    }
    
    // COLOREAR POR ÉPOCA (si está activado y no es el biografiado)
    if (!isBiografiado && options.colorByTime && node.group === 'person') {
      const personName = node.label;
      const avgDate = personAvgDate.get(personName);
      
      if (avgDate) {
        const normalizedTime = (avgDate - minDate) / dateRange;
        
        // Dividir en 4 épocas con colores distintos
        if (normalizedTime < 0.25) {
          color = '#3b82f6';  // Azul - Temprano
        } else if (normalizedTime < 0.5) {
          color = '#10b981';  // Verde - Medio-temprano
        } else if (normalizedTime < 0.75) {
          color = '#f59e0b';  // Naranja - Medio-tardío
        } else {
          color = '#ef4444';  // Rojo - Tardío
        }
      }
    }
    // COLOREAR POR TIPO (default, solo si no está coloreando por tiempo)
    else if (!isBiografiado && !options.colorByTime && options.nodeColorBy === 'type') {
      color = node.color; // mantener color original por tipo
    }
    // COLOREAR POR GRADO
    else if (!isBiografiado && !options.colorByTime && options.nodeColorBy === 'degree' && metrics) {
      const degree = metrics.degree.get(node.id) || 0;
      const maxDegree = Math.max(...Array.from(metrics.degree.values()));
      const intensity = maxDegree > 0 ? degree / maxDegree : 0;
      color = `rgb(${255 * (1 - intensity)}, ${100 * intensity}, ${255 * intensity})`;
    }
    // COLOREAR POR BETWEENNESS
    else if (!isBiografiado && !options.colorByTime && options.nodeColorBy === 'betweenness' && metrics) {
      const betweenness = metrics.betweenness.get(node.id) || 0;
      const maxBetweenness = Math.max(...Array.from(metrics.betweenness.values()));
      const intensity = maxBetweenness > 0 ? betweenness / maxBetweenness : 0;
      color = `rgb(${255 - 100 * intensity}, ${100 + 100 * intensity}, ${50 * intensity})`;
    }
    
    // Tamaño por métrica
    if (options.nodeSizeBy !== 'fixed' && metrics) {
      const metric = options.nodeSizeBy === 'degree' 
        ? metrics.degree.get(node.id) || 0
        : metrics.betweenness.get(node.id) || 0;
      
      size = options.nodeBaseSize + metric * options.nodeScaleFactor;
      
      // Si es el biografiado, aplicar el aumento después del cálculo de métrica
      if (isBiografiado) {
        size = size * 1.5;
      }
    }
    
    return { ...node, size, color, borderWidth };
  });
}

/**
 * Aplicar opciones visuales a las aristas
 */
function applyEdgeVisualization(
  edges: GraphEdge[],
  options: {
    edgeColorBy: 'type' | 'weight';
    edgeWidthBy: 'fixed' | 'weight';
    edgeBaseWidth: number;
    edgeScaleFactor: number;
    showEdgeLabels: boolean;
  },
  metrics: {
    degree: Map<string, number>;
    betweenness: Map<string, number>;
    edgeWeights: Map<string, number>;
  } | null
): GraphEdge[] {
  return edges.map(edge => {
    let width = edge.width;
    let color = edge.color;
    
    // Ancho por peso
    if (options.edgeWidthBy === 'weight' && metrics) {
      const key = [edge.from, edge.to].sort().join('|');
      const weight = metrics.edgeWeights.get(key) || 1;
      width = options.edgeBaseWidth + weight * options.edgeScaleFactor;
    }
    
    // Color por peso
    if (options.edgeColorBy === 'weight' && metrics) {
      const key = [edge.from, edge.to].sort().join('|');
      const weight = metrics.edgeWeights.get(key) || 1;
      const maxWeight = Math.max(...Array.from(metrics.edgeWeights.values()));
      const intensity = maxWeight > 0 ? weight / maxWeight : 0;
      color = `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
    }
    
    return {
      ...edge,
      width,
      color,
      label: options.showEdgeLabels ? edge.label : undefined,
    };
  });
}

/**
 * Calcular grado (número de conexiones) para cada nodo
 */
function calculateDegree(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const degree = new Map<string, number>();
  
  nodes.forEach(node => degree.set(node.id, 0));
  
  edges.forEach(edge => {
    degree.set(edge.from, (degree.get(edge.from) || 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) || 0) + 1);
  });
  
  return degree;
}

/**
 * Calcular betweenness centrality (qué tan "puente" es cada nodo)
 * Usa algoritmo de Brandes simplificado
 */
function calculateBetweenness(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const betweenness = new Map<string, number>();
  nodes.forEach(node => betweenness.set(node.id, 0));
  
  // Crear grafo de adyacencia
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(node => adjacency.set(node.id, new Set()));
  edges.forEach(edge => {
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  });
  
  // Para cada nodo como origen
  nodes.forEach(source => {
    // BFS para encontrar caminos más cortos
    const distance = new Map<string, number>();
    const paths = new Map<string, number>();
    const queue: string[] = [source.id];
    
    distance.set(source.id, 0);
    paths.set(source.id, 1);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distance.get(current)!;
      
      adjacency.get(current)?.forEach(neighbor => {
        if (!distance.has(neighbor)) {
          distance.set(neighbor, currentDist + 1);
          queue.push(neighbor);
        }
        
        if (distance.get(neighbor) === currentDist + 1) {
          paths.set(neighbor, (paths.get(neighbor) || 0) + (paths.get(current) || 0));
        }
      });
    }
    
    // Acumular betweenness
    const dependency = new Map<string, number>();
    nodes.forEach(node => dependency.set(node.id, 0));
    
    const sorted = Array.from(distance.entries()).sort((a, b) => b[1] - a[1]);
    
    sorted.forEach(([node, _]) => {
      adjacency.get(node)?.forEach(neighbor => {
        if (distance.get(neighbor)! === distance.get(node)! - 1) {
          const contrib = (paths.get(neighbor)! / paths.get(node)!) * (1 + dependency.get(node)!);
          dependency.set(neighbor, dependency.get(neighbor)! + contrib);
        }
      });
      
      if (node !== source.id) {
        betweenness.set(node, betweenness.get(node)! + dependency.get(node)!);
      }
    });
  });
  
  // Normalizar
  const n = nodes.length;
  const normalizer = n > 2 ? (n - 1) * (n - 2) : 1;
  betweenness.forEach((value, key) => {
    betweenness.set(key, value / normalizer);
  });
  
  return betweenness;
}

/**
 * Calcular peso de aristas (cuántas conexiones entre los mismos nodos)
 */
function calculateEdgeWeights(edges: GraphEdge[]): Map<string, number> {
  const weights = new Map<string, number>();
  
  edges.forEach(edge => {
    // Crear clave única para el par de nodos (ordenados para no duplicar)
    const key = [edge.from, edge.to].sort().join('|');
    weights.set(key, (weights.get(key) || 0) + 1);
  });
  
  return weights;
}

/**
 * Encontrar el ego network (subgrafo centrado en un nodo)
 */
function getEgoNetwork(
  centerNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  depth: number = 1
): { nodes: GraphNode[], edges: GraphEdge[] } {
  const selectedNodes = new Set<string>([centerNodeId]);
  const selectedEdges: GraphEdge[] = [];
  
  // Expandir por niveles
  for (let level = 0; level < depth; level++) {
    const currentLevel = Array.from(selectedNodes);
    
    edges.forEach(edge => {
      if (currentLevel.includes(edge.from)) {
        selectedNodes.add(edge.to);
        selectedEdges.push(edge);
      }
      if (currentLevel.includes(edge.to)) {
        selectedNodes.add(edge.from);
        selectedEdges.push(edge);
      }
    });
  }
  
  const egoNodes = nodes.filter(n => selectedNodes.has(n.id));
  
  return { nodes: egoNodes, edges: selectedEdges };
}

/**
 * Normalizar variaciones del nombre del biografiado
 */
function normalizeName(name: string): string {
  if (!name) return name;
  
  const nameLower = name.toLowerCase().trim();
  const originalName = name;
  
  // Luis Mitrovic Balbontín (el biografiado - HIJO)
  const luisMitrovicBalbotin = [
    'luis mitrovic balbontín',
    'luis mitrovic balbotin',
    'luis mitrovic balbontin', // Sin acento
    'don luis mitrovich',  // Se refiere al hijo
    'don luis mitrovic',   // Contexto: el hijo
    'luis mitrovic',       // Sin apellido materno = hijo (biografiado)
    'mitrovic',            // Solo apellido = hijo (biografiado)
    'luis mitrovich',      // Variación
    'luis m.',             // Abreviado
    'l. mitrovic',         // Abreviado
  ];
  
  // Luis Mitrovic Puljizević (el padre)
  const luisMitrovicPuljizevic = [
    'luis mitrovic puljizević',
    'luis mitrovic puljizevic',
    'luis mitrovic puljizevich',
  ];
  
  // Verificar padre primero (más específico - tiene "puljizevic")
  if (luisMitrovicPuljizevic.some(variation => nameLower.includes(variation))) {
    const normalized = 'Luis Mitrovic Puljizević (padre)';
    return normalized;
  }
  
  // Verificar hijo (cualquier variación que incluya "luis mitrovic" sin "puljizevic")
  if (luisMitrovicBalbotin.some(variation => nameLower.includes(variation) || nameLower === variation)) {
    const normalized = 'Luis Mitrovic Balbontín';
    return normalized;
  }
  
  // Si solo dice "Luis Mitrovic" sin apellido materno, asumir que es el hijo (biografiado)
  // Esto captura casos como "Luis Mitrovic" sin más contexto
  if (nameLower.startsWith('luis') && nameLower.includes('mitrovic') && !nameLower.includes('puljizevic')) {
    const normalized = 'Luis Mitrovic Balbontín';
    return normalized;
  }
  
  return name;
}

function transformToGraph(
  events: TimelineEvent[],
  mainPerson: string,
  dateRange: { min: Date; max: Date },
  visualOptions: any,
  filters: any,
  normalizeNameFn: (name: string) => string,
  isDarkMode: boolean,
  activityMetrics: Map<string, number>,
  getNodeSize: (nodeId: string, baseSize: number) => number
): { nodes: GraphNode[], edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, string>();
  
  const letterEvents = events.filter(e => e.type === 'letter');
  
  // NIVEL 1: LUIS MITROVIC (Centro)
  const biografiadoId = `person-${mainPerson}`;
  nodes.push({
    id: biografiadoId,
    label: mainPerson,
    group: 'person',
    personType: 'active',
    title: `${mainPerson}\n(Biografied person)\n${activityMetrics.get(biografiadoId) || 0} letters`,
    shape: 'dot',
    size: getNodeSize(biografiadoId, 30), // ✅ Tamaño dinámico
    color: {
      border: '#6366f1',
      background: '#6366f1',
      highlight: {
        border: '#4f46e5',
        background: '#4f46e5',
      },
    },
    font: {
      size: 16,
      color: isDarkMode ? '#ffffff' : '#000000', // ✅ Blanco en dark, negro en light
      bold: true,
      strokeWidth: isDarkMode ? 0 : 2, // Sin stroke en dark
      strokeColor: isDarkMode ? 'transparent' : '#ffffff', // Stroke blanco en light
    },
    borderWidth: 3,
  } as any);
  nodeMap.set(biografiadoId, 'person-main');
  
  // Procesar cada carta
  letterEvents.forEach(event => {
    const letterData = event.data as any;
    const letterId = `letter-${event.id}`;
    
    // Obtener sender y recipient
    const sender = letterData?.sender || letterData?.personFrom || letterData?.person_from;
    const recipient = letterData?.recipient || letterData?.personTo || letterData?.person_to;
    
    // NIVEL 2: CORRESPONDIENTES (Personas que escriben/reciben)
    // Sender
    if (sender && sender !== 'Desconocido') {
      const senderId = `person-${sender}`;
      
      // Si no es el biografiado, agregarlo
      if (sender !== mainPerson && !nodeMap.has(senderId)) {
        nodes.push({
          id: senderId,
          label: sender,
          group: 'person',
          personType: 'active',
          title: `${sender}\n(Correspondent)\n${activityMetrics.get(senderId) || 0} letters`,
          shape: 'dot',
          size: getNodeSize(senderId, 18), // ✅ Tamaño dinámico
          color: {
            border: '#3b82f6',
            background: '#3b82f6',
            highlight: {
              border: '#2563eb',
              background: '#2563eb',
            },
          },
          font: {
            size: 12,
            color: isDarkMode ? '#e5e7eb' : '#1f2937', // ✅ Gris claro en dark, gris oscuro en light
            strokeWidth: isDarkMode ? 0 : 1,
            strokeColor: isDarkMode ? 'transparent' : '#ffffff',
          },
          borderWidth: 2,
        } as any);
        nodeMap.set(senderId, 'person-correspondent');
      }
    }
    
    // Recipient
    if (recipient && recipient !== 'Desconocido') {
      const recipientId = `person-${recipient}`;
      
      if (recipient !== mainPerson && !nodeMap.has(recipientId)) {
        nodes.push({
          id: recipientId,
          label: recipient,
          group: 'person',
          personType: 'active',
          title: `${recipient}\n(Correspondent)\n${activityMetrics.get(recipientId) || 0} letters`,
          shape: 'dot',
          size: getNodeSize(recipientId, 18), // ✅ Tamaño dinámico
          color: {
            border: '#3b82f6',
            background: '#3b82f6',
            highlight: {
              border: '#2563eb',
              background: '#2563eb',
            },
          },
          font: {
            size: 12,
            color: isDarkMode ? '#e5e7eb' : '#1f2937', // ✅ Gris claro en dark, gris oscuro en light
            strokeWidth: isDarkMode ? 0 : 1,
            strokeColor: isDarkMode ? 'transparent' : '#ffffff',
          },
          borderWidth: 2,
        } as any);
        nodeMap.set(recipientId, 'person-correspondent');
      }
    }
    
    // NIVEL 3: CARTA (nodo intermedio)
    const letterColor = visualOptions.colorByTime 
      ? getColorByDate(event.date, dateRange.min, dateRange.max)
      : '#8b5cf6'; // Violeta por defecto
    
    // Calcular número de carta (índice + 1)
    const letterNumber = letterEvents.findIndex(e => e.id === event.id) + 1;
    const letterYear = event.date.getFullYear();
    
    nodes.push({
      id: letterId,
      label: `Letter ${letterNumber}\n${letterYear}`,
      group: 'letter',
      title: `📧 Letter ${letterNumber} (${letterYear})\n${event.title}\n✉️ ${sender} → ${recipient}`,
      shape: 'image',
      image: createLetterIcon(letterColor),
      size: 16, // ✅ Reducido 30% (de ~23 a 16)
      color: {
        border: letterColor,
        background: letterColor + '20',
        highlight: {
          border: letterColor,
          background: letterColor + '40',
        },
      },
      font: {
        size: 8,
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        face: 'monospace',
      },
      borderWidth: 0, // ✅ Sin borde adicional
      shapeProperties: {
        useBorderWithImage: false, // ✅ Sin borde
      },
    } as any);
    nodeMap.set(letterId, 'letter');
    
    // CONEXIONES NIVEL 2 → NIVEL 3
    // Sender → Carta
    if (sender && sender !== 'Desconocido') {
      const senderId = `person-${sender}`;
      edges.push({
        from: senderId,
        to: letterId,
        arrows: 'to',
        color: { 
          color: isDarkMode ? letterColor : adjustColorBrightness(letterColor, -20), // ✅ Más oscuro en light
          opacity: isDarkMode ? 0.7 : 0.8, // ✅ Más visible en light
        },
        width: 2,
        smooth: { type: 'continuous' },
      } as any);
    }
    
    // Carta → Recipient
    if (recipient && recipient !== 'Desconocido') {
      const recipientId = `person-${recipient}`;
      edges.push({
        from: letterId,
        to: recipientId,
        arrows: 'to',
        color: { 
          color: isDarkMode ? letterColor : adjustColorBrightness(letterColor, -20), // ✅ Más oscuro en light
          opacity: isDarkMode ? 0.7 : 0.8, // ✅ Más visible en light
        },
        width: 2,
        smooth: { type: 'continuous' },
      } as any);
    }
    
    // NIVEL 4: MENCIONES
    
    // Personas mencionadas
    if (filters.showPeople && letterData?.mentionedPeople) {
      letterData.mentionedPeople.forEach((person: string) => {
        // Skip si es el biografiado o un correspondiente
        if (person === mainPerson) return;
        if (person === sender || person === recipient) return;
        
        const personId = `person-mentioned-${person}`;
        
        if (!nodeMap.has(personId)) {
          nodes.push({
            id: personId,
            label: person,
            group: 'person',
            personType: 'mentioned',
            title: `${person}\n(Mentioned ${activityMetrics.get(personId) || 0} times)`,
            shape: 'dot',
            size: getNodeSize(personId, 10), // ✅ Tamaño dinámico
            color: {
              border: '#60a5fa',
              background: '#dbeafe',
              highlight: {
                border: '#3b82f6',
                background: '#bfdbfe',
              },
            },
            font: {
              size: 9,
              color: isDarkMode ? '#d1d5db' : '#374151', // ✅ Más contraste
              strokeWidth: isDarkMode ? 0 : 1,
              strokeColor: isDarkMode ? 'transparent' : '#ffffff',
            },
            borderWidth: 1,
          } as any);
          nodeMap.set(personId, 'person-mentioned');
        }
        
        // Carta → Persona mencionada
        edges.push({
          from: letterId,
          to: personId,
          color: { 
            color: isDarkMode ? '#60a5fa' : '#2563eb', // ✅ Más oscuro en light
            opacity: isDarkMode ? 0.3 : 0.5, 
          },
          width: 1,
          dashes: [2, 4],
          smooth: { type: 'continuous' },
        } as any);
      });
    }
    
    // Lugares mencionados
    if (filters.showPlaces) {
      const places = [
        ...(letterData?.placeFrom ? [letterData.placeFrom] : []),
        ...(letterData?.placeTo ? [letterData.placeTo] : []),
        ...(letterData?.mentionedPlaces || []),
      ].filter(Boolean);
      
      const uniquePlaces = [...new Set(places)];
      
      uniquePlaces.forEach((place: string) => {
        const placeId = `place-${place}`;
        
        if (!nodeMap.has(placeId)) {
          nodes.push({
            id: placeId,
            label: place,
            group: 'place',
            title: `📍 ${place}\n(Mentioned ${activityMetrics.get(placeId) || 0} times)`,
            shape: 'dot',
            size: getNodeSize(placeId, 10), // ✅ Tamaño dinámico
            color: {
              border: '#10b981',
              background: '#d1fae5',
              highlight: {
                border: '#059669',
                background: '#a7f3d0',
              },
            },
            font: {
              size: 9,
              color: isDarkMode ? '#d1d5db' : '#374151', // ✅ Más contraste
              strokeWidth: isDarkMode ? 0 : 1,
              strokeColor: isDarkMode ? 'transparent' : '#ffffff',
            },
            borderWidth: 1,
          } as any);
          nodeMap.set(placeId, 'place');
        }
        
        // Carta → Lugar
        edges.push({
          from: letterId,
          to: placeId,
          color: { 
            color: isDarkMode ? '#10b981' : '#059669', // ✅ Más oscuro en light
            opacity: isDarkMode ? 0.3 : 0.5, 
          },
          width: 1,
          dashes: [2, 4],
          smooth: { type: 'continuous' },
        } as any);
      });
    }
    
    // Organizaciones mencionadas
    if (filters.showPeople && letterData?.mentionedOrganizations) {
      letterData.mentionedOrganizations.forEach((org: string) => {
        const orgId = `org-${org}`;
        
        if (!nodeMap.has(orgId)) {
          nodes.push({
            id: orgId,
            label: org,
            group: 'organization',
            title: `🏢 ${org}\n(Mentioned ${activityMetrics.get(orgId) || 0} times)`,
            shape: 'dot',
            size: getNodeSize(orgId, 10), // ✅ Tamaño dinámico
            color: {
              border: '#f59e0b',
              background: '#fef3c7',
              highlight: {
                border: '#d97706',
                background: '#fde68a',
              },
            },
            font: {
              size: 9,
              color: isDarkMode ? '#d1d5db' : '#374151', // ✅ Más contraste
              strokeWidth: isDarkMode ? 0 : 1,
              strokeColor: isDarkMode ? 'transparent' : '#ffffff',
            },
            borderWidth: 1,
          } as any);
          nodeMap.set(orgId, 'organization');
        }
        
        // Carta → Organización
        edges.push({
          from: letterId,
          to: orgId,
          color: { 
            color: isDarkMode ? '#f59e0b' : '#d97706', // ✅ Más oscuro en light
            opacity: isDarkMode ? 0.3 : 0.5, 
          },
          width: 1,
          dashes: [2, 4],
          smooth: { type: 'continuous' },
        } as any);
      });
    }
  });
  
  return { nodes, edges };
}

