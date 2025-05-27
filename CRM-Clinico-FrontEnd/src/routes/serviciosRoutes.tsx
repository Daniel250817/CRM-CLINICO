import type { RouteObject } from 'react-router-dom';
import ServiciosList from '../pages/services/ServiciosList';

export const serviciosRoutes: RouteObject[] = [
  {
    path: '/services',
    element: <ServiciosList />
  }
]; 