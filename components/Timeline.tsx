'use client';

import type { TimelineEvent } from '@/lib/types';
import TimelineVisualization from '@/components/visualizations/Timeline/Timeline';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  return <TimelineVisualization events={events} />;
}

