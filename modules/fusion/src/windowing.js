/**
 * Sort normalized events and split them into fixed windows.
 * @param {Array<Object>} events
 * @param {Object} options
 * @param {number} [options.windowMinutes=5]
 * @returns {Array<{ start: Date, end: Date, events: Object[] }>}
 */
function windowNormalizedEvents(events, options = {}) {
  const { windowMinutes = 5 } = options;
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const windowSizeMs = windowMinutes * 60 * 1000;
  const windows = [];

  let currentWindow = null;

  sortedEvents.forEach((event) => {
    const eventTime = new Date(event.timestamp).getTime();

    if (!currentWindow) {
      currentWindow = {
        start: new Date(eventTime),
        end: new Date(eventTime + windowSizeMs),
        events: [event]
      };
      return;
    }

    if (eventTime < currentWindow.end.getTime()) {
      currentWindow.events.push(event);
    } else {
      windows.push(currentWindow);
      currentWindow = {
        start: new Date(eventTime),
        end: new Date(eventTime + windowSizeMs),
        events: [event]
      };
    }
  });

  if (currentWindow) {
    windows.push(currentWindow);
  }

  return windows;
}

module.exports = {
  windowNormalizedEvents
};
