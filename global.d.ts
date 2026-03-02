import { NS as _NS } from '@ns';
import R from 'react';

declare global {
  type NS = _NS;
  const React: typeof R;
  const ReactDOM: typeof import('react-dom');
}
