import { Dashboard, DashboardsMessage } from './messages';
import { getConnectedClients } from './server';

/**
 * Sends a list of dashboards to all connected websocket clients.
 * @param dashboards The dashboards to send.
 */
export function sendDashboards(dashboards: Dashboard[]) {
  const message = {
    type: 'dashboards',
    data: {
      dashboards,
    },
  } as DashboardsMessage;

  const clients = getConnectedClients();
  clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}
