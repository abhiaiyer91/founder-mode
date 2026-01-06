import { useGameStore } from '../store/gameStore';
import { DEFAULT_EVENTS } from '../types/events';
import './EventPanel.css';

export function EventPanel() {
  const {
    alerts,
    activeEvents,
    dismissAlert,
    makeEventChoice,
  } = useGameStore();

  // Get active alerts (not dismissed, with event choices)
  const activeAlerts = alerts.filter(a => !a.dismissed);
  
  if (activeAlerts.length === 0) return null;

  return (
    <div className="event-panel">
      {activeAlerts.map(alert => {
        const event = DEFAULT_EVENTS.find(e => e.id === alert.action?.callback);
        const activeEvent = activeEvents.find(ae => ae.eventId === alert.action?.callback);
        const hasChoices = event?.choices && !activeEvent?.choiceMade;

        return (
          <div 
            key={alert.id} 
            className={`event-alert ${alert.type}`}
          >
            <div className="alert-header">
              <span className="alert-icon">◈</span>
              <span className="alert-title">{alert.title}</span>
              {!hasChoices && (
                <button 
                  className="dismiss-btn"
                  onClick={() => dismissAlert(alert.id)}
                >
                  ×
                </button>
              )}
            </div>
            
            <p className="alert-message">{alert.message}</p>
            
            {hasChoices && event?.choices && (
              <div className="event-choices">
                {event.choices.map(choice => (
                  <button
                    key={choice.id}
                    className="choice-btn"
                    onClick={() => makeEventChoice(event.id, choice.id)}
                  >
                    <span className="choice-label">{choice.label}</span>
                    {choice.cost && (
                      <span className="choice-cost">-${choice.cost.toLocaleString()}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default EventPanel;
