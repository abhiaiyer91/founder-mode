/**
 * CampusScreen - Isometric campus view powered by Phaser 3
 * 
 * Visual representation of your startup campus with buildings and employees.
 */

import { CampusGame } from '../../game/campus';
import './CampusScreen.css';

export function CampusScreen() {
  return (
    <div className="campus-screen">
      <CampusGame />
    </div>
  );
}

export default CampusScreen;
