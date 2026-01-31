import { 
  Mail, 
  Camera, 
  Plane, 
  MapPin, 
  User, 
  Building2,
  Calendar,
  MessageCircle,
  FileText,
  Home,
  Settings,
  BarChart3,
  Network,
  Map as MapIcon,
  Clock,
  Filter,
  Download,
  Upload,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Globe,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  LucideIcon,
} from 'lucide-react';

export const Icons = {
  // Event types
  letter: Mail,
  photo: Camera,
  trip: Plane,
  
  // Entities
  person: User,
  place: MapPin,
  organization: Building2,
  
  // Navigation
  home: Home,
  timeline: Clock,
  network: Network,
  map: MapIcon,
  analytics: BarChart3,
  settings: Settings,
  
  // Actions
  upload: Upload,
  download: Download,
  search: Search,
  filter: Filter,
  edit: Edit,
  delete: Trash2,
  close: X,
  check: Check,
  plus: Plus,
  minus: Minus,
  
  // UI
  calendar: Calendar,
  message: MessageCircle,
  file: FileText,
  eye: Eye,
  eyeOff: EyeOff,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  
  // Theme
  moon: Moon,
  sun: Sun,
  globe: Globe,
  
  // Status
  info: Info,
  alert: AlertCircle,
  success: CheckCircle,
  error: XCircle,
} as const;

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className = '', size = 20 }: IconProps) {
  const LucideIcon = Icons[name] as LucideIcon;
  return <LucideIcon className={className} size={size} />;
}
