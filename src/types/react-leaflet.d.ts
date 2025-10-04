import 'react-leaflet';
import { LatLngExpression } from 'leaflet';

declare module 'react-leaflet' {
  export interface MapContainerProps {
    center?: LatLngExpression;
    zoom?: number;
    scrollWheelZoom?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
}