/**
 * PreviewScreen - Full-screen live preview of the generated app
 */

import { LivePreviewPanel } from '../LivePreviewPanel';
import './PreviewScreen.css';

export function PreviewScreen() {
  return (
    <div className="preview-screen">
      <LivePreviewPanel />
    </div>
  );
}

export default PreviewScreen;
