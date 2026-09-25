// Demo build: no live server, so the socket is an inert stub with the same
// surface the app uses (on/off/emit/connect/disconnect).
const socket = {
  connected: false,
  on() {
    return socket;
  },
  off() {
    return socket;
  },
  emit() {
    return socket;
  },
  connect() {
    return socket;
  },
  disconnect() {
    return socket;
  },
};

export default socket;
